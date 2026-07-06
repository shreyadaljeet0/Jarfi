# SaveJar frontend

React + Vite + TypeScript dApp for the [save_jar](../contracts/save_jar)
Soroban contract. See the [repo root README](../README.md) for the full
project overview, contract details, and deploy instructions.

## Routes

- `/` — marketing landing page
- `/app` — the jar dApp (create jars, deposit, withdraw)
- `/wallet` — a standalone Freighter wallet demo (connect, balance, send XLM)

## Development

```bash
npm install         # from the repo root — sets up the npm workspace
npm run dev -w frontend
```

## Scripts

- `npm run dev -w frontend` — start the Vite dev server
- `npm run build -w frontend` — type-check and build for production
- `npm run lint -w frontend` — run oxlint
- `npm run test -w frontend` — run the Vitest unit tests
