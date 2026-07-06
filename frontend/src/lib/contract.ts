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
