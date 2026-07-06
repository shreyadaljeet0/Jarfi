#!/usr/bin/env bash
# Builds, deploys, and (re)generates TypeScript bindings for the SaveJar contract.
#
# Usage:
#   ./scripts/deploy.sh [network] [source-identity]
#
#   network         stellar CLI network name (default: testnet)
#   source-identity stellar CLI identity/alias used to sign the deploy (default: sj-deployer)
#
# Prerequisites:
#   - rustup target add wasm32v1-none
#   - stellar CLI identity funded on the target network:
#       stellar keys generate --network testnet --fund sj-deployer
set -euo pipefail

NETWORK="${1:-testnet}"
SOURCE="${2:-sj-deployer}"

cd "$(dirname "$0")/.."

echo "==> Building contract (wasm32v1-none, release)"
cd contracts/save_jar
cargo build --target wasm32v1-none --release
cd ../..

WASM_PATH="target/wasm32v1-none/release/save_jar.wasm"

echo "==> Deploying to ${NETWORK} as ${SOURCE}"
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source "$SOURCE" \
  --network "$NETWORK" \
  --alias save_jar)

echo "==> Deployed contract ID: ${CONTRACT_ID}"

echo "==> Regenerating TypeScript bindings (packages/save_jar_client)"
stellar contract bindings typescript \
  --contract-id save_jar \
  --network "$NETWORK" \
  --output-dir packages/save_jar_client \
  --overwrite

echo "==> Building bindings package"
npm install
npm run build -w save_jar_client

echo ""
echo "Done. Contract ID for ${NETWORK}: ${CONTRACT_ID}"
echo "The frontend reads this automatically from packages/save_jar_client's generated 'networks' export."
