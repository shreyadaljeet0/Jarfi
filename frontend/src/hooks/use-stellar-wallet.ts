import { useCallback, useEffect, useState } from "react";
import {
  detectFreighter,
  connectWallet,
  getWalletAddress,
  signTx,
} from "../lib/stellar-wallet";
import { fetchXlmBalance, buildPaymentXdr, submitSignedTx } from "../lib/stellar-tx";

export interface WalletHook {
  address: string | null;
  balance: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  /** null while still detecting, then true/false. */
  hasFreighter: boolean | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  sendXlm: (to: string, amount: string) => Promise<{ hash: string }>;
}

/** Turn any thrown value — including Horizon submit errors — into a message. */
function toMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const e = err as {
      response?: {
        data?: {
          detail?: string;
          title?: string;
          extras?: {
            result_codes?: { transaction?: string; operations?: string[] };
          };
        };
      };
      message?: string;
    };
    const codes = e.response?.data?.extras?.result_codes;
    if (codes) {
      const ops = codes.operations?.length ? ` (${codes.operations.join(", ")})` : "";
      return `Transaction failed: ${codes.transaction ?? "unknown"}${ops}`;
    }
    const detail = e.response?.data?.detail ?? e.response?.data?.title;
    if (detail) return detail;
    if (e.message) return e.message;
  }
  return fallback;
}

export function useWallet(): WalletHook {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFreighter, setHasFreighter] = useState<boolean | null>(null);

  // Detect Freighter and silently restore an already-authorized session.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const present = await detectFreighter();
        if (cancelled) return;
        setHasFreighter(present);
        if (present) {
          const existing = await getWalletAddress();
          if (!cancelled && existing) setAddress(existing);
        }
      } catch {
        if (!cancelled) setHasFreighter(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    setError(null);
    try {
      setBalance(await fetchXlmBalance(address));
    } catch (err) {
      setError(toMessage(err, "Failed to fetch XLM balance."));
    }
  }, [address]);

  // Auto-fetch balance whenever the connected address changes.
  useEffect(() => {
    if (address) void refreshBalance();
    else setBalance(null);
  }, [address, refreshBalance]);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setAddress(await connectWallet());
    } catch (err) {
      setError(toMessage(err, "Failed to connect wallet."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
    setError(null);
  }, []);

  const sendXlm = useCallback(
    async (to: string, amount: string): Promise<{ hash: string }> => {
      if (!address) throw new Error("Connect your wallet first.");
      setIsLoading(true);
      setError(null);
      try {
        const xdr = await buildPaymentXdr(address, to, amount);
        const signedXdr = await signTx(xdr);
        const result = await submitSignedTx(signedXdr);
        await refreshBalance();
        return result;
      } catch (err) {
        const message = toMessage(err, "Failed to send transaction.");
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [address, refreshBalance],
  );

  return {
    address,
    balance,
    isConnected: address !== null,
    isLoading,
    error,
    hasFreighter,
    connect,
    disconnect,
    refreshBalance,
    sendXlm,
  };
}
