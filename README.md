# SaveJar

A time-locked savings jar on Stellar Soroban. Deposit XLM (or any SEP-41
token) into a jar that unlocks by a target date, a savings goal, or a
combination of both — funds are only withdrawable once the condition is met.

**Live on Testnet:** `CBR4V5L5ES2RMLHCXAGJAGI3GAEPFK4H744UJP6DIXM7FZA2CSB47ZWN`
([view on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBR4V5L5ES2RMLHCXAGJAGI3GAEPFK4H744UJP6DIXM7FZA2CSB47ZWN))

## Project Structure

```
.
├── contracts/save_jar/     Soroban contract (Rust) + unit tests
├── packages/save_jar_client/  Generated TypeScript bindings for the contract
├── frontend/               React + Vite dApp (Create Jar form, My Jars dashboard)
├── scripts/deploy.sh        Build, deploy, and regenerate bindings
└── .github/workflows/       CI (contracts + frontend) and CD (deploy on push to main)
```

## Contract

Four unlock types, selected at jar creation:

| Type | Unlocks when |
|---|---|
| `DateOnly` | `now >= target_date` |
| `GoalOnly` | `balance >= target_amount` |
| `EitherOne` | either condition is met |
| `BothRequired` | both conditions are met |

Public functions: `create_jar`, `deposit`, `withdraw`, `get_jar`,
`get_user_jars`, `is_unlocked`. See `contracts/save_jar/src/lib.rs` for the
full interface and `src/test.rs` for the test suite (20 tests covering every
unlock type, unauthorized/double withdrawal, invalid configs, and asset
validation).

### Build & test

```bash
rustup target add wasm32v1-none
cargo test -p save_jar
cargo build --target wasm32v1-none --release -p save_jar
```

> Use the `wasm32v1-none` target, not `wasm32-unknown-unknown` — newer Rust
> toolchains enable WASM reference-types by default on the latter, which the
> Soroban host rejects.

### Deploy

```bash
stellar keys generate --network testnet --fund sj-deployer   # one-time
./scripts/deploy.sh testnet sj-deployer
```

This builds the contract, deploys it, regenerates
`packages/save_jar_client` from the on-chain contract spec, and prints the
new contract ID. The frontend picks up the new ID automatically via that
package's generated `networks` export.

## Frontend

React + Vite + TypeScript, using `@stellar/stellar-sdk`'s `contract.Client`
(via the generated `save_jar_client` bindings package) and
`@stellar/freighter-api` for wallet connection and transaction signing.

```bash
npm install         # from the repo root — sets up the npm workspace
npm run dev -w frontend
```

Requires the [Freighter](https://freighter.app) browser extension, set to
Testnet, with a funded testnet account (use
[Friendbot](https://friendbot.stellar.org) or `stellar keys fund`).

## Demo walkthrough

1. Install Freighter, switch it to Testnet, fund the account via Friendbot.
2. Run the frontend (`npm run dev -w frontend`) and click **Connect
   Freighter Wallet**.
3. In **Create a Jar**, pick XLM, choose "Unlock on a date", set a date a
   few minutes out, and submit — approve the transaction in Freighter.
4. The new jar appears in **My Jars**, showing a countdown and a disabled
   **Withdraw** button.
5. Deposit some XLM into the jar using the amount field.
6. Wait for the countdown to reach zero (the dashboard polls every 20s) —
   the status badge flips to **Unlocked** and **Withdraw** becomes active.
7. Click **Withdraw** and approve in Freighter — the balance returns to
   your wallet and the jar is marked **Withdrawn**.

## CI/CD

`.github/workflows/ci.yml` runs on every push and pull request:
- **contracts** — `cargo test -p save_jar` and a release wasm build
- **frontend** — `npm ci`, `oxlint`, `tsc -b && vite build`, and `vitest run`

`.github/workflows/deploy.yml` runs on push to `main`:
- **deploy-contract** — builds the wasm, deploys it to Testnet with the
  Stellar CLI, and regenerates/builds the `save_jar_client` TypeScript
  bindings from the new contract
- **deploy-frontend** — builds the frontend against the freshly regenerated
  bindings and deploys it to Vercel

The deploy workflow requires these repository secrets: `STELLAR_SECRET_KEY`
(a funded Testnet account used to sign the deploy), `VERCEL_TOKEN`,
`VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`.

> **Known limitation:** every push to `main` deploys a brand-new contract
> instance via `stellar contract deploy` rather than upgrading the existing
> one in place. This means jars created under a previous deployment become
> orphaned (inaccessible from the new contract ID) once a new deploy lands,
> and the "Live on Testnet" contract ID above changes on every merge. A
> proper fix would switch to `stellar contract upgrade` for subsequent
> deploys, deploying fresh only on the very first release.
