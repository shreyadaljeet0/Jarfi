import { useState, type FormEvent } from "react";
import { useWallet } from "../../hooks/use-stellar-wallet";
import { isValidStellarAddress } from "../../lib/stellar-tx";
import "./wallet-panel.css";

/**
 * Self-contained Stellar wallet panel: detect → connect → balance → send → tx.
 * All wallet/SDK logic is orchestrated through the useWallet() hook, which
 * imports detectFreighter / connectWallet / signTx from lib/stellar-wallet.ts
 * and the balance/payment helpers from lib/stellar-tx.ts.
 */
export function StellarWalletPanel() {
  const wallet = useWallet();

  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await wallet.refreshBalance();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setTxHash(null);
    setFormError(null);

    const to = destination.trim();
    const value = amount.trim();

    if (!isValidStellarAddress(to)) {
      setFormError("Enter a valid Stellar destination address (starts with G, 56 chars).");
      return;
    }
    if (!(Number(value) > 0)) {
      setFormError("Enter an amount greater than 0.");
      return;
    }

    setSending(true);
    try {
      const { hash } = await wallet.sendXlm(to, value);
      setTxHash(hash);
      setDestination("");
      setAmount("");
    } catch {
      // Failure message is surfaced via wallet.error below.
    } finally {
      setSending(false);
    }
  }

  // --- Detecting Freighter ---------------------------------------------------
  if (wallet.hasFreighter === null) {
    return (
      <div className="wallet-panel">
        <div className="wallet-card">
          <p>
            <span className="wallet-spinner" />
            Checking for the Freighter extension…
          </p>
        </div>
      </div>
    );
  }

  // --- REQUIREMENT 1: install prompt ----------------------------------------
  if (wallet.hasFreighter === false) {
    return (
      <div className="wallet-panel">
        <div className="wallet-card wallet-install">
          <h2>Freighter required</h2>
          <p>
            The Freighter wallet extension was not detected. Install it, set it to{" "}
            <strong>Testnet</strong>, then reload this page.
          </p>
          <p style={{ marginTop: 12 }}>
            <a href="https://freighter.app" target="_blank" rel="noreferrer">
              Install Freighter →
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-panel">
      {/* --- REQUIREMENT 2: connect / disconnect --- */}
      <div className="wallet-card">
        <h2>Wallet</h2>
        {!wallet.isConnected ? (
          <button
            className="wallet-btn primary"
            onClick={() => void wallet.connect()}
            disabled={wallet.isLoading}
          >
            {wallet.isLoading ? (
              <>
                <span className="wallet-spinner" />
                Connecting…
              </>
            ) : (
              "Connect Wallet"
            )}
          </button>
        ) : (
          <>
            <div className="wallet-address-full" title="Your Stellar address">
              {wallet.address}
            </div>
            <div className="wallet-row" style={{ marginTop: 14 }}>
              <span style={{ fontSize: 13, color: "var(--text)" }}>Connected · Testnet</span>
              <button className="wallet-btn ghost" onClick={wallet.disconnect}>
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>

      {/* --- REQUIREMENT 3: balance --- */}
      {wallet.isConnected && (
        <div className="wallet-card">
          <div className="wallet-row">
            <h2 style={{ margin: 0 }}>XLM Balance</h2>
            <button
              className="wallet-btn ghost"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <span className="wallet-spinner" />
                  Refreshing…
                </>
              ) : (
                "Refresh Balance"
              )}
            </button>
          </div>
          <div className="wallet-balance" style={{ marginTop: 12 }}>
            {wallet.balance ?? "…"}
            <small>XLM</small>
          </div>
          {wallet.balance === "0" && (
            <p className="wallet-unfunded">
              0 XLM — account not funded. Fund it with the{" "}
              <a
                href="https://friendbot.stellar.org"
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--accent)" }}
              >
                Friendbot
              </a>{" "}
              on Testnet.
            </p>
          )}
        </div>
      )}

      {/* --- REQUIREMENT 4: send XLM --- */}
      {wallet.isConnected && (
        <div className="wallet-card">
          <h2>Send XLM</h2>
          <form onSubmit={handleSend}>
            <div className="wallet-field">
              <label htmlFor="destination">Destination address</label>
              <input
                id="destination"
                type="text"
                placeholder="G…"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                disabled={sending}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="wallet-field">
              <label htmlFor="amount">Amount (XLM)</label>
              <input
                id="amount"
                type="number"
                min="0"
                step="0.0000001"
                placeholder="1.0000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={sending}
              />
            </div>
            <button className="wallet-btn primary" type="submit" disabled={sending}>
              {sending ? (
                <>
                  <span className="wallet-spinner" />
                  Sending…
                </>
              ) : (
                "Send XLM"
              )}
            </button>
          </form>

          {/* --- REQUIREMENT 4: transaction feedback --- */}
          {txHash && (
            <div className="wallet-banner success" style={{ marginTop: 16 }}>
              Transaction sent! Hash:{" "}
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
              >
                {txHash}
              </a>
            </div>
          )}
          {formError && (
            <div className="wallet-banner error" style={{ marginTop: 16 }}>
              {formError}
            </div>
          )}
        </div>
      )}

      {/* Global wallet errors (connect / balance / submit). */}
      {wallet.error && <div className="wallet-banner error">{wallet.error}</div>}
    </div>
  );
}
