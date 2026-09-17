/**
 * Server configuration — the ONLY place secrets are read.
 *
 * Values come from environment variables: `.env` locally (loaded by
 * `tsx --env-file`), your host's secret manager in production. None of
 * them start with VITE_, so Vite can never bundle them into the browser.
 */
import type { SettlementNetwork } from "../shared/types";

// ════════════════════════════════════════════════════════════════════════
//  WHAT CHANGED FROM TESTNET → MAINNET
// ════════════════════════════════════════════════════════════════════════
//
//  1. BLOCKRADAR_API_KEY
//     Generated in the dashboard with *Live Mode* on. A testnet key can't
//     see mainnet wallets, and a mainnet key can't see testnet ones.
//
//  2. BLOCKRADAR_WALLET_ID_*
//     A mainnet master wallet is a NEW wallet you create in the dashboard.
//     Testnet wallet IDs don't carry over.
//
//  3. EXPECTED_NETWORK = "mainnet"
//     On startup the server asks Blockradar about each wallet and refuses
//     to run if it's on the wrong network (see server/wallets.ts). A
//     leftover testnet key fails loudly instead of silently.
//
//  4. Webhook URL + signing key
//     Blockradar signs each webhook with the API key from the page where
//     the webhook URL is set. Set the URL on the SAME Developers page your
//     BLOCKRADAR_API_KEY came from. A URL set on a master wallet's own
//     developer page is signed with that wallet's key instead, and every
//     event fails verification with 401.
//
//  5. IP allowlist
//     If your live key has an IP allowlist, calls from any other IP fail
//     with 401 Unauthorized — which looks exactly like a wrong key.
//
//  What did NOT change: the base URL, the endpoints, and the request and
//  response shapes. The integration code below is identical on testnet.
// ════════════════════════════════════════════════════════════════════════

export const EXPECTED_NETWORK = "mainnet";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),

  blockradar: {
    baseUrl: process.env.BLOCKRADAR_BASE_URL ?? "https://api.blockradar.co/v1",
    apiKey: required("BLOCKRADAR_API_KEY"),
  },

  /**
   * Mainnet guardrail: the most USDC one withdrawal may send. Real money —
   * cap it while you're testing, raise it deliberately.
   */
  maxWithdrawUsdc: process.env.MAX_WITHDRAW_USDC ?? "5",

  /**
   * One Blockradar master wallet per network. Arc is required (it's the
   * point of the workshop); Base is optional and only used for contrast.
   */
  walletIds: {
    arc: required("BLOCKRADAR_WALLET_ID_ARC"),
    base: process.env.BLOCKRADAR_WALLET_ID_BASE || undefined,
  } satisfies Record<SettlementNetwork, string | undefined>,
};
