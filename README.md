# Embankment Pay

A stablecoin banking dashboard (Deposit, Withdraw, Swap, Earn) built on top of
[Blockradar](https://blockradar.co)'s Wallet-as-a-Service API, settling in
USDC on Base.

## Prerequisites

- Node 20+
- npm
- A Blockradar API key (staging or production) — see [Getting your keys](#getting-your-keys) below

## Setup

```bash
git clone https://github.com/blockradar/embankmentpay.git
cd embankmentpay
npm install
cp .env.example .env.local   # then fill in the values, see below
npm run dev
```

The app runs at `http://localhost:5173` (or whatever port Vite prints —
pass `-- --port 5183` to `npm run dev` to pin one).

## Getting your keys

1. Log in to the [Blockradar dashboard](https://dashboard.blockradar.co) for
   the environment you want to point at (staging or production have separate
   base URLs and keys — see `.env.example`).
2. Under your business's API settings, generate an API key. This goes in
   `VITE_BLOCKRADAR_API_KEY`.
3. Master wallets are **dashboard-only** — Blockradar's API has no
   create/list-wallet endpoint. In the dashboard's Wallets section, create
   (or find an existing) master wallet per network you want to support, and
   copy its wallet ID into the matching `VITE_WALLET_ID_*` variable.
   - Currently only a Base wallet is expected to exist; `VITE_WALLET_ID_ARC`
     can stay blank until Blockradar provisions an Arc wallet for this
     account.
4. Never commit `.env.local` — it's gitignored. Only `.env.example` (no real
   values) is tracked in git.

⚠️ **Even the "staging" API can hold real funds on real mainnet chains.**
Wallets returned by the staging API in this project are tagged
`"network": "mainnet"`, not testnet — reads (balances, addresses,
transactions) are harmless, but anything that executes a real withdrawal or
swap moves actual money. Treat staging credentials with the same care as
production ones.

## Environment variables

All variables live in `.env.local` (see `.env.example` for the template).

| Variable | Purpose |
|---|---|
| `VITE_API_MODE` | Default mode (`mock` or `live`) for any operation without its own override. |
| `VITE_API_MODE_DEPOSIT` / `_WITHDRAW` / `_SWAP` / `_EARN` | Per-operation override — lets one operation run live while the others stay on mock data. Falls back to `VITE_API_MODE` if unset. |
| `VITE_BLOCKRADAR_BASE_URL` | e.g. `https://staging-api.blockradar.co/v1` — v2 endpoints (virtual accounts) are called by swapping `/v1` for `/v2` internally, no separate config needed. |
| `VITE_BLOCKRADAR_API_KEY` | Sent as the `x-api-key` header on every live request. |
| `VITE_DEFAULT_NETWORK` | `arc` or `base` — which settlement network the Dashboard defaults to. |
| `VITE_WALLET_ID_ARC` / `VITE_WALLET_ID_BASE` | The Blockradar master wallet ID per network (see step 3 above). Leave blank for a network you haven't provisioned — live calls for that network fail with a clear in-app error rather than crashing. |

### Mock vs. live

Every operation (`api.deposit`, `api.withdraw`, `api.swap`, `api.earn`) is
resolved once, per-operation, in `src/api/index.ts`, based on
`env.apiModes.<operation>`. Screens only ever call `api.<operation>.*` —
never a mock or live adapter file directly — so flipping one operation to
live is a one-line `.env.local` change, not a code change.

Vitest always forces every operation to `mock` regardless of `.env.local`
(see `vite.config.ts`), so `npm test` never makes real network calls.

## Scripts

```bash
npm run dev       # start the dev server
npm run build     # typecheck + production build
npm test          # run the test suite (mock-only, no network calls)
npm run lint      # oxlint
npm run preview   # preview a production build locally
```

## Project structure

```
src/
  config/env.ts              # all environment/endpoint config, per-operation mode resolution
  api/
    client.ts                 # fetch wrapper for live calls (v1 + v2)
    types/                    # types mirroring confirmed Blockradar response shapes
    operations/*.service.ts   # one interface per operation (deposit/withdraw/swap/earn)
    adapters/mock/            # in-memory dummy data + a Zustand store for mock-mode state
    adapters/live/            # real Blockradar calls
    index.ts                  # the `api` facade — resolves mock vs. live per operation
  components/                 # shared cross-flow UI (AmountInput, FlowComplete, StepHeader, ...)
  features/                   # one folder per screen/flow (dashboard, deposit, withdraw, swap, earn, shell)
  styles/theme.css             # design tokens (color, type, spacing, motion)
```

## Current integration status

- **Deposit** — live (address generation, balance, transaction history, bank transfer via virtual account)
- **Withdraw, Swap, Earn** — mock data, live integration in progress

Only the Base network has a live wallet configured; other chains/networks
show a clear "not available yet" message rather than failing silently.
