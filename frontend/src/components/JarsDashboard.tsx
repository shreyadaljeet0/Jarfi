import { useEffect, useState, useCallback, useRef } from "react";
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

  // Withdrawal is one-time and terminal (see contracts/save_jar/src/lib.rs),
  // so a withdrawn jar can never change again — skip refetching it on
  // subsequent polls and reuse the cached entry instead.
  const withdrawnCache = useRef(new Map<string, JarEntry>());

  const loadJars = useCallback(async () => {
    setError(null);
    try {
      const client = getClient(address);
      const idsTx = await client.get_user_jars({ owner: address });
      const ids = idsTx.result;

      const entries = await Promise.all(
        ids.map(async (jarId): Promise<JarEntry> => {
          const cached = withdrawnCache.current.get(jarId.toString());
          if (cached) return cached;

          const [jarTx, unlockedTx] = await Promise.all([
            client.get_jar({ jar_id: jarId }),
            client.is_unlocked({ jar_id: jarId }),
          ]);
          const entry: JarEntry = {
            jarId,
            jar: unwrapResult(jarTx.result),
            unlocked: unwrapResult(unlockedTx.result),
          };
          if (entry.jar.withdrawn) {
            withdrawnCache.current.set(jarId.toString(), entry);
          }
          return entry;
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
    withdrawnCache.current.clear();
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
      {loading && (
        <p>
          <span className="spinner" aria-hidden="true" />
          Loading jars…
        </p>
      )}
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
