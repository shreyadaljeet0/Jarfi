const STROOPS_PER_UNIT = 10_000_000n;

export function formatUnits(amount: bigint): string {
  const whole = amount / STROOPS_PER_UNIT;
  const frac = amount % STROOPS_PER_UNIT;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(7, "0").replace(/0+$/, "");
  return `${whole}.${fracStr}`;
}

export function toStroops(amount: string): bigint {
  const [whole, frac = ""] = amount.trim().split(".");
  const paddedFrac = (frac + "0000000").slice(0, 7);
  const wholePart = whole === "" ? 0n : BigInt(whole);
  return wholePart * STROOPS_PER_UNIT + BigInt(paddedFrac || "0");
}

export function formatCountdown(targetDateSeconds: bigint, nowSeconds: number): string {
  const remaining = Number(targetDateSeconds) - nowSeconds;
  if (remaining <= 0) return "unlocked";

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
