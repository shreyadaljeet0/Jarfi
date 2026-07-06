export type UnlockTypeTag = "DateOnly" | "GoalOnly" | "EitherOne" | "BothRequired";

/** DateOnly/EitherOne/BothRequired need a target date; GoalOnly doesn't. */
export function needsDate(unlockType: UnlockTypeTag): boolean {
  return unlockType !== "GoalOnly";
}

/** GoalOnly/EitherOne/BothRequired need a target amount; DateOnly doesn't. */
export function needsAmount(unlockType: UnlockTypeTag): boolean {
  return unlockType !== "DateOnly";
}

export interface JarFormInputs {
  unlockType: UnlockTypeTag;
  asset: string;
  targetDate: string;
  targetAmount: string;
}

/** Validate CreateJarForm's inputs client-side. Returns an error message, or null if valid. */
export function validateJarInputs({
  unlockType,
  asset,
  targetDate,
  targetAmount,
}: JarFormInputs): string | null {
  if (!asset) return "Enter a token contract address.";
  if (needsDate(unlockType) && !targetDate) return "Pick a target date.";
  if (needsAmount(unlockType) && (!targetAmount || Number(targetAmount) <= 0)) {
    return "Enter a target amount greater than 0.";
  }
  return null;
}
