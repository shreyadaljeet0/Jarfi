import { useEffect, useState } from "react";
import "./App.css";
import { connectWallet, getConnectedAddress } from "./lib/wallet";
import { Navbar } from "./components/Navbar";
import { CreateJarForm } from "./components/CreateJarForm";
import { JarsDashboard } from "./components/JarsDashboard";

export function DappPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    getConnectedAddress().then((addr) => {
      if (addr) setAddress(addr);
    });
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setConnectError(null);
    try {
      const wallet = await connectWallet();
      setAddress(wallet.address);
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : String(err));
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    setAddress(null);
  }

  return (
    <div className="app">
      <Navbar
        address={address}
        connecting={connecting}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      <header>
        <p className="tagline">Time-locked savings jars on Stellar Soroban (Testnet)</p>
        {connectError && <p className="error">{connectError}</p>}
      </header>

      {address && (
        <main>
          <CreateJarForm address={address} onCreated={() => setRefreshKey((k) => k + 1)} />
          <JarsDashboard address={address} refreshKey={refreshKey} />
        </main>
      )}
    </div>
  );
}
