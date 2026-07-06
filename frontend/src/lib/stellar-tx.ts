import {
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
  StrKey,
} from "@stellar/stellar-sdk";
import { STELLAR_TESTNET_PASSPHRASE, HORIZON_TESTNET_URL } from "./stellar-wallet";

const server = new Horizon.Server(HORIZON_TESTNET_URL);

/** Client-side check for a valid Stellar public (G...) address. */
export function isValidStellarAddress(address: string): boolean {
  return StrKey.isValidEd25519PublicKey(address);
}

/**
 * REQUIREMENT 3 — fetch the native XLM balance from Horizon Testnet.
 * Returns "0" for an unfunded account (HTTP 404) instead of throwing.
 */
export async function fetchXlmBalance(address: string): Promise<string> {
  const res = await fetch(`${HORIZON_TESTNET_URL}/accounts/${address}`);

  if (res.status === 404) return "0"; // account not funded yet
  if (!res.ok) {
    throw new Error(`Horizon responded with HTTP ${res.status} while fetching balance.`);
  }

  const data = (await res.json()) as {
    balances: Array<{ asset_type: string; balance: string }>;
  };
  const native = data.balances.find((b) => b.asset_type === "native");
  return native ? native.balance : "0";
}

/**
 * REQUIREMENT 4 (steps 1-3) — load the source account, build a native
 * payment transaction on Testnet, and return its unsigned XDR.
 */
export async function buildPaymentXdr(
  from: string,
  to: string,
  amount: string,
): Promise<string> {
  const account = await server.loadAccount(from);

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_TESTNET_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: to,
        asset: Asset.native(),
        amount,
      }),
    )
    .setTimeout(30)
    .build();

  return transaction.toXDR();
}

/**
 * REQUIREMENT 4 (step 5) — submit a signed XDR to Horizon Testnet.
 * Resolves with the transaction hash; rejects with the Horizon error.
 */
export async function submitSignedTx(signedXdr: string): Promise<{ hash: string }> {
  const transaction = TransactionBuilder.fromXDR(signedXdr, STELLAR_TESTNET_PASSPHRASE);
  const result = await server.submitTransaction(transaction);
  return { hash: result.hash };
}
