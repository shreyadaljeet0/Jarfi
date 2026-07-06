import { useState } from "react";
import type { JarData } from "save_jar_client";
import { getClient, unwrapResult } from "../lib/contract";
import { formatUnits, toStroops, formatCountdown } from "../lib/format";

interface JarCardProps {
  jarId: bigint;
  jar: JarData;
  unlocked: boolean;
  address: string;
  nowSeconds: number;
  onChanged: () => void;
}

const UNLOCK_TYPE_LABELS: Record<string, string> = {
  DateOnly: "Date",
  GoalOnly: "Goal",
  EitherOne: "Date or Goal",
  BothRequired: "Date and Goal",
};

export function JarCard({ jarId, jar, unlocked, address, nowSeconds, onChanged }: JarCardProps) {
  const [depositAmount, setDepositAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasGoal = jar.target_amount > 0n;
  const hasDate = jar.target_date > 0n;
  const progressPct = hasGoal
    ? Math.min(100, Number((jar.balance * 10000n) / jar.target_amount) / 100)
    : null;

  const status = jar.withdrawn ? "Withdrawn" : unlocked ? "Unlocked" : "Locked";

  async function handleDeposit() {
    setError(null);
    const amount = toStroops(depositAmount);
    if (amount <= 0n) {
      setError("Enter an amount greater than 0.");
      return;
    }
    setBusy(true);
    try {
      const client = getClient(address);
      const tx = await client.deposit({ jar_id: jarId, depositor: address, amount });
      const { result } = await tx.signAndSend();
      unwrapResult(result);
      setDepositAmount("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleWithdraw() {
    setError(null);
    setBusy(true);
    try {
      const client = getClient(address);
      const tx = await client.withdraw({ jar_id: jarId, caller: address });
      const { result } = await tx.signAndSend();
      unwrapResult(result);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="jar-card">
      <div className="jar-card-header">
        <h3>Jar #{jarId.toString()}</h3>
        <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>
      </div>

      <p className="jar-condition">{UNLOCK_TYPE_LABELS[jar.unlock_type.tag]}</p>

      <p className="jar-balance">
        Balance: <strong>{formatUnits(jar.balance)}</strong>
        {hasGoal && <> / {formatUnits(jar.target_amount)} target</>}
      </p>

      {hasGoal && progressPct !== null && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {hasDate && (
        <p className="jar-countdown">
          {jar.target_date <= BigInt(nowSeconds) ? "Date reached" : `Unlocks in ${formatCountdown(jar.target_date, nowSeconds)}`}
        </p>
      )}

      {!jar.withdrawn && (
        <div className="jar-actions">
          <div className="deposit-row">
            <input
              type="number"
              min="0"
              step="0.0000001"
              placeholder="Amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={busy}
            />
            <button onClick={handleDeposit} disabled={busy}>
              Deposit
            </button>
          </div>
          <button className="withdraw-btn" onClick={handleWithdraw} disabled={!unlocked || busy}>
            {busy ? "Working…" : "Withdraw"}
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
