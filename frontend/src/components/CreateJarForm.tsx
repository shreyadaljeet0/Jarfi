import { useState } from "react";
import type { FormEvent } from "react";
import type { UnlockType } from "save_jar_client";
import { StrKey } from "save_jar_client";
import { getClient, unwrapResult, friendlyContractError } from "../lib/contract";
import { NATIVE_ASSET_CONTRACT_ID } from "../lib/config";
import { toStroops } from "../lib/format";
import { needsDate, needsAmount, validateJarInputs } from "../lib/jar-form";
import type { UnlockTypeTag } from "../lib/jar-form";

const UNLOCK_LABELS: Record<UnlockTypeTag, string> = {
  DateOnly: "Unlock on a date",
  GoalOnly: "Unlock at a savings goal",
  EitherOne: "Unlock on date OR goal (whichever first)",
  BothRequired: "Unlock only when date AND goal are both met",
};

interface CreateJarFormProps {
  address: string;
  onCreated: (jarId: bigint) => void;
}

export function CreateJarForm({ address, onCreated }: CreateJarFormProps) {
  const [assetChoice, setAssetChoice] = useState<"native" | "custom">("native");
  const [customAsset, setCustomAsset] = useState("");
  const [unlockType, setUnlockType] = useState<UnlockTypeTag>("DateOnly");
  const [targetDate, setTargetDate] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdJarId, setCreatedJarId] = useState<bigint | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreatedJarId(null);

    const asset = assetChoice === "native" ? NATIVE_ASSET_CONTRACT_ID : customAsset.trim();
    if (assetChoice === "custom" && asset && !StrKey.isValidContract(asset)) {
      setError("That doesn't look like a valid token contract address (should start with C...).");
      return;
    }

    const validationError = validateJarInputs({ unlockType, asset, targetDate, targetAmount });
    if (validationError) {
      setError(validationError);
      return;
    }

    const targetDateSeconds = needsDate(unlockType)
      ? BigInt(Math.floor(new Date(targetDate).getTime() / 1000))
      : 0n;
    const targetAmountStroops = needsAmount(unlockType) ? toStroops(targetAmount) : 0n;

    setSubmitting(true);
    try {
      const client = getClient(address);
      const tx = await client.create_jar({
        owner: address,
        asset,
        unlock_type: { tag: unlockType, values: undefined } as UnlockType,
        target_date: targetDateSeconds,
        target_amount: targetAmountStroops,
      });
      const { result } = await tx.signAndSend();
      const jarId = unwrapResult(result);
      setCreatedJarId(jarId);
      onCreated(jarId);
    } catch (err) {
      setError(friendlyContractError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="create-jar-form">
      <h2>Create a Jar</h2>

      <label>
        Asset
        <select value={assetChoice} onChange={(e) => setAssetChoice(e.target.value as "native" | "custom")}>
          <option value="native">XLM (native)</option>
          <option value="custom">Custom token (e.g. USDC) — paste contract address</option>
        </select>
      </label>

      {assetChoice === "custom" && (
        <label>
          Token contract address
          <input
            type="text"
            placeholder="C..."
            value={customAsset}
            onChange={(e) => setCustomAsset(e.target.value)}
          />
        </label>
      )}

      <label>
        Unlock condition
        <select value={unlockType} onChange={(e) => setUnlockType(e.target.value as UnlockTypeTag)}>
          {(Object.keys(UNLOCK_LABELS) as UnlockTypeTag[]).map((tag) => (
            <option key={tag} value={tag}>
              {UNLOCK_LABELS[tag]}
            </option>
          ))}
        </select>
      </label>

      {needsDate(unlockType) && (
        <label>
          Target date
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </label>
      )}

      {needsAmount(unlockType) && (
        <label>
          Target amount ({assetChoice === "native" ? "XLM" : "token units"})
          <input
            type="number"
            min="0"
            step="0.0000001"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
          />
        </label>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? "Creating…" : "Create Jar"}
      </button>

      {error && <p className="error">{error}</p>}
      {createdJarId !== null && (
        <p className="success">Jar #{createdJarId.toString()} created!</p>
      )}
    </form>
  );
}
