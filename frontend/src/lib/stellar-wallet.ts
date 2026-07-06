import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";

/**
 * Stellar Testnet constants. Every call in this app targets Testnet only.
 */
export const STELLAR_TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
export const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";

/** Freighter's structured error → a plain Error with a readable message. */
function freighterError(
  error: { message?: string } | undefined,
  fallback: string,
): Error {
  return new Error(error?.message ?? fallback);
}

/** REQUIREMENT 1 — detect the Freighter extension via isConnected(). */
export async function detectFreighter(): Promise<boolean> {
  const { isConnected: present } = await isConnected();
  return present;
}

/**
 * REQUIREMENT 2 — request permission and return the wallet address.
 * Uses isAllowed() to skip the prompt when already authorized, otherwise
 * requestAccess(), then reads the address with getAddress().
 */
export async function connectWallet(): Promise<string> {
  if (!(await detectFreighter())) {
    throw new Error(
      "Freighter extension not detected. Install it from https://freighter.app",
    );
  }

  const allowed = await isAllowed();
  if (!allowed.isAllowed) {
    const access = await requestAccess();
    if (access.error) {
      throw freighterError(access.error, "Freighter connection was rejected.");
    }
    if (access.address) return access.address;
  }

  const { address, error } = await getAddress();
  if (error) {
    throw freighterError(error, "Could not read the wallet address from Freighter.");
  }
  if (!address) {
    throw new Error("Freighter returned an empty address — is an account unlocked?");
  }
  return address;
}

/**
 * Return the address only if the user has already authorized this site,
 * without triggering a permission prompt. null otherwise.
 */
export async function getWalletAddress(): Promise<string | null> {
  if (!(await detectFreighter())) return null;
  const allowed = await isAllowed();
  if (!allowed.isAllowed) return null;
  const { address } = await getAddress();
  return address || null;
}

/**
 * REQUIREMENT 4 (step 4) — sign a transaction XDR with Freighter on Testnet.
 * Returns the signed XDR string.
 */
export async function signTx(xdr: string): Promise<string> {
  const { signedTxXdr, error } = await signTransaction(xdr, {
    networkPassphrase: STELLAR_TESTNET_PASSPHRASE,
  });
  if (error) {
    throw freighterError(error, "Freighter failed to sign the transaction.");
  }
  return signedTxXdr;
}
