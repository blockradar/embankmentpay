# Embankment Pay

A reference project for taking a stablecoin app from Arc testnet to **Arc
mainnet** with [Blockradar](https://docs.blockradar.co): wallets, deposit
addresses, deposit webhooks, and withdrawals where gas is paid in USDC.

## How it fits together

```
Browser (React, src/)  ──/api/*──▶  API server (server/)  ──x-api-key──▶  Blockradar
     no secrets                      holds the API key                    api.blockradar.co
```

The browser never talks to Blockradar directly. Anything in a `VITE_*`
variable is compiled into the public JavaScript bundle, so an API key there
is readable by anyone — the server exists to keep it out.

## Prerequisites

- Node 20+
- A Blockradar account with **Live Mode** enabled
- A mainnet master wallet on Arc (and optionally Base), created in the dashboard

## Setup

```bash
npm install
cp .env.example .env   # then fill in the values, see below
npm run dev            # starts the API server (:3001) and the web app (:5173)
```

On startup the API server checks every configured wallet against
Blockradar and refuses to start if something is wrong:

```
✓ arc: "Arc Mainnet" 0xb1d9…f41f · mainnet · gas paid in USDC
✓ base: "Base Mainnet" 0xb1d9…f41f · mainnet · gas paid in ETH
API listening on http://localhost:3001
```

## Getting your keys

1. In the [Blockradar dashboard](https://dashboard.blockradar.co), switch to
   **Live Mode**.
2. Create a master wallet on Arc (and Base, if you want the comparison).
   Master wallets are created in the dashboard — copy each wallet ID into
   `BLOCKRADAR_WALLET_ID_ARC` / `BLOCKRADAR_WALLET_ID_BASE`.
3. Generate an API key and put it in `BLOCKRADAR_API_KEY`. If you enable an
   IP allowlist on the key, add your server's IP — requests from anywhere
   else fail with `401 Unauthorized`, which looks exactly like a bad key.

## What changes from testnet to mainnet

See the labelled block at the top of [`server/config.ts`](server/config.ts).
In short: a Live Mode API key, new mainnet wallet IDs, and the expected
network. The base URL, endpoints, and response shapes are the same.

## Receiving webhooks

Blockradar tells your server about deposits by POSTing to a webhook URL. The
handler is `server/routes/webhooks.ts`; it verifies the signature, ignores
duplicates and other environments, then credits the user who owns the address.

⚠️ **Set the webhook URL on the same Developers page your API key came from.**
Blockradar signs each webhook with the key from the page the URL is set on. A
URL on a master wallet's own developer page is signed with that wallet's key,
so with an account-level `BLOCKRADAR_API_KEY` every event fails with 401.

**Without a real deposit** — send a signed test event to your local server:

```bash
npm run webhook:test               # valid event → deposit credited
npm run webhook:test -- --twice    # same event twice → second is a duplicate
npm run webhook:test -- --tamper   # body edited after signing → 401
```

**With real deposits** — expose the server and point the wallet at it:

```bash
npm run tunnel   # ngrok, exposing ONLY POST /webhooks/blockradar (ngrok-webhook-only.yml)
# then set https://<your-id>.ngrok-free.app/webhooks/blockradar as the
# webhook URL on the dashboard's Developers page (where your API key is)
```

⚠️ Never tunnel the whole server: `server/auth.ts` is a placeholder and
`/api` can move money. `npm run tunnel` uses a traffic policy that returns
404 for everything except the webhook.

## Environment variables

All read by the API server only (`server/config.ts`).

| Variable | Purpose |
|---|---|
| `BLOCKRADAR_API_KEY` | Live Mode API key, sent as `x-api-key`. Also the webhook signing secret. |
| `BLOCKRADAR_WALLET_ID_ARC` | Arc mainnet master wallet ID. Required. |
| `BLOCKRADAR_WALLET_ID_BASE` | Base mainnet master wallet ID. Optional. |
| `BLOCKRADAR_BASE_URL` | Defaults to `https://api.blockradar.co/v1`. |
| `MAX_WITHDRAW_USDC` | Mainnet guardrail: max USDC per withdrawal, default `5`. |
| `PORT` | API server port, default `3001`. |

## Scripts

```bash
npm run dev       # API server + web app together
npm run dev:api   # API server only (restarts on change)
npm run dev:web   # web app only
npm run webhook:test  # send a signed test deposit webhook to the local server
npm run build     # typecheck (app + server) + production build of the web app
npm test          # run the test suite
npm run lint      # oxlint
```

## Project structure

```
server/
  config.ts          # env vars + "what changed from testnet → mainnet"
  wallets.ts         # loads and verifies each master wallet at startup
  blockradar.ts      # every Blockradar API call
  auth.ts            # ⚠️ placeholder: who the current user is
  store.ts           # ⚠️ tiny JSON-file database (data/db.json)
  errors.ts          # what the browser is (and isn't) told when things fail
  webhook-signature.ts # HMAC-SHA512 signature check (+ tests)
  routes/deposit.ts  # one gasless deposit address per user, and credited deposits
  routes/webhooks.ts # POST /webhooks/blockradar — verify, dedupe, credit
  routes/account.ts  # GET /api/me/:network/{balance,transactions} — that address's money
  routes/withdraw.ts # quote (gas in USDC) → send (idempotent, capped) → status from webhook
  money.ts           # amounts as decimal strings, compared in micro-units
  index.ts           # Express app
scripts/
  send-test-webhook.ts # signed fake deposit webhook for demos
shared/types.ts      # data shapes shared by server and browser
src/
  api/               # browser → /api calls (no secrets)
  config/networks.ts # display-only network labels
  components/        # shared UI (AmountInput, QrCode, CopyButton, ...)
  features/          # one folder per screen (dashboard, deposit, withdraw, activity, shell)
```
