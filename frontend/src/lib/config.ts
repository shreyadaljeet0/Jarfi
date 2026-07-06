import { networks } from "save_jar_client";

export const CONTRACT_ID = networks.testnet.contractId;
export const NETWORK_PASSPHRASE = networks.testnet.networkPassphrase;
export const RPC_URL = "https://soroban-testnet.stellar.org";

// Stellar Asset Contract address for native XLM on testnet.
export const NATIVE_ASSET_CONTRACT_ID =
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

export const POLL_INTERVAL_MS = 20_000;
