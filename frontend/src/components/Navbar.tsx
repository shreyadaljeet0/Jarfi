import { Link } from "react-router-dom";

interface NavbarProps {
  address: string | null;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function Navbar({ address, connecting, onConnect, onDisconnect }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">🫙</span>
        <span className="navbar-title">SaveJar</span>
        <div className="navbar-links">
          <Link to="/wallet">Wallet</Link>
        </div>
      </div>

      {address ? (
        <div className="navbar-wallet">
          <span className="wallet-address" title={address}>
            {address.slice(0, 6)}…{address.slice(-6)}
          </span>
          <button className="disconnect-btn" onClick={onDisconnect}>
            Disconnect
          </button>
        </div>
      ) : (
        <button onClick={onConnect} disabled={connecting}>
          {connecting ? "Connecting…" : "Connect Wallet"}
        </button>
      )}
    </nav>
  );
}
