import { useEffect } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import { StellarWalletPanel } from "./components/wallet/StellarWalletPanel";

export function WalletPage() {
  useEffect(() => {
    document.title = "Stellar Wallet — Freighter Integration";
  }, []);

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="navbar-logo">🫙</span>
          <span className="navbar-title">SaveJar</span>
        </div>
        <div className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/app">App</Link>
        </div>
      </nav>

      <header>
        <h1>Stellar Wallet — Freighter Integration</h1>
        <p className="tagline">
          Detect → Connect → Balance → Send → Tx hash · Stellar Testnet
        </p>
      </header>

      <main>
        <StellarWalletPanel />
      </main>
    </div>
  );
}
