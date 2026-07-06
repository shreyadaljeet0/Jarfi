import { useEffect, useState, useCallback } from "react";
import type { JarData } from "save_jar_client";
import { getClient, unwrapResult } from "../lib/contract";
import { JarCard } from "./JarCard";
import { POLL_INTERVAL_MS } from "../lib/config";

interface JarsDashboardProps {
  address: string;
  refreshKey: number;
}

interface JarEntry {
  jarId: bigint;
  jar: JarData;
  unlocked: boolean;
}

export function JarsDashboard({ address, refreshKey }: JarsDashboardProps) {
  const [jars, setJars] = useState<JarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));

  const loadJars = useCallback(async () => {
    setError(null);
    try {
      const client = getClient(address);
      const idsTx = await client.get_user_jars({ owner: address });
      const ids = idsTx.result;

      const entries = await Promise.all(
        ids.map(async (jarId): Promise<JarEntry> => {
          const [jarTx, unlockedTx] = await Promise.all([
            client.get_jar({ jar_id: jarId }),
            client.is_unlocked({ jar_id: jarId }),
          ]);
          return {
            jarId,
            jar: unwrapResult(jarTx.result),
            unlocked: unwrapResult(unlockedTx.result),
          };
        }),
      );

      entries.sort((a, b) => (a.jarId < b.jarId ? -1 : a.jarId > b.jarId ? 1 : 0));
      setJars(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    loadJars();
  }, [loadJars, refreshKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowSeconds(Math.floor(Date.now() / 1000));
      loadJars();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadJars]);

  return (
    <section className="jars-dashboard">
      <h2>My Jars</h2>
      {loading && <p>Loading jars…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && jars.length === 0 && <p>No jars yet — create one above.</p>}
      <div className="jars-grid">
        {jars.map(({ jarId, jar, unlocked }) => (
          <JarCard
            key={jarId.toString()}
            jarId={jarId}
            jar={jar}
            unlocked={unlocked}
            address={address}
            nowSeconds={nowSeconds}
            onChanged={loadJars}
          />
        ))}
      </div>
    </section>
  );
}
