import { Client } from "save_jar_client";
import { CONTRACT_ID, NETWORK_PASSPHRASE, RPC_URL } from "./config";
import { signTransaction, signAuthEntry } from "./wallet";

export function getClient(publicKey: string): Client {
  return new Client({
    contractId: CONTRACT_ID,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
    publicKey,
    signTransaction,
    signAuthEntry,
  });
}

// Unwraps the Result<T, ContractError> that every write method returns after signAndSend(),
// throwing a readable message instead of leaving callers to inspect the Result union.
export function unwrapResult<T>(result: { unwrap: () => T }): T {
  return result.unwrap();
}

// save_jar_client's Errors map (contracts/save_jar/src/lib.rs's Error enum) is
// surfaced by unwrap() as an Error whose .message is the bare variant name
// (e.g. "NotOwner") — map those to copy a user can actually act on.
const CONTRACT_ERROR_MESSAGES: Record<string, string> = {
  InvalidConfig: "That combination of unlock date/goal isn't valid for this jar type.",
  JarNotFound: "That jar doesn't exist.",
  ZeroDeposit: "Enter an amount greater than 0.",
  NotOwner: "Only the jar's owner can withdraw from it.",
  AlreadyWithdrawn: "This jar has already been withdrawn.",
  StillLocked: "This jar hasn't reached its unlock date or goal yet.",
};

/** Turn a thrown contract/RPC error into a message a user can read. */
export function friendlyContractError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return CONTRACT_ERROR_MESSAGES[message] ?? message;
}
