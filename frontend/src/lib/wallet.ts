import {
  isConnected,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction,
  signAuthEntry as freighterSignAuthEntry,
} from "@stellar/freighter-api";
import type { SignAuthEntry } from "@stellar/stellar-sdk/contract";
import { NETWORK_PASSPHRASE } from "./config";

export interface WalletState {
  address: string;
}

export async function connectWallet(): Promise<WalletState> {
  const { isConnected: hasFreighter } = await isConnected();
  if (!hasFreighter) {
    throw new Error("Freighter wallet extension not found. Please install it from freighter.app.");
  }

  const { address, error } = await requestAccess();
  if (error) {
    throw new Error(typeof error === "string" ? error : "Failed to connect to Freighter.");
  }

  const { networkPassphrase } = await getNetwork();
  if (networkPassphrase !== NETWORK_PASSPHRASE) {
    throw new Error(
      `Freighter is set to the wrong network. Switch to Testnet in the Freighter extension.`,
    );
  }

  return { address };
}

export async function getConnectedAddress(): Promise<string | null> {
  const { isConnected: hasFreighter } = await isConnected();
  if (!hasFreighter) return null;
  const { address } = await getAddress();
  return address || null;
}

// Matches the SignTransaction shape expected by @stellar/stellar-sdk's contract.Client.
export { signTransaction };

// Freighter's signedAuthEntry can be null; the SDK's SignAuthEntry type requires a string.
export const signAuthEntry: SignAuthEntry = async (entryXdr, opts) => {
  const result = await freighterSignAuthEntry(entryXdr, opts);
  if (result.error || result.signedAuthEntry === null) {
    throw new Error(
      typeof result.error === "string" ? result.error : "Freighter failed to sign the authorization entry.",
    );
  }
  return { signedAuthEntry: result.signedAuthEntry, signerAddress: result.signerAddress };
};
