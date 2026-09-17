/**
 * Sends a fake `deposit.success` webhook to the local server, signed with
 * your API key exactly the way Blockradar signs real ones. Lets you demo the
 * deposit flow without waiting for a real on-chain deposit.
 *
 *   npm run webhook:test               valid event        → 200, deposit credited
 *   npm run webhook:test -- --twice    same event twice   → 2nd is a duplicate
 *   npm run webhook:test -- --tamper   edited after signing → 401
 *
 * The demo user needs an Arc deposit address first: open the Deposit page.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { DEMO_USER_ID } from "../server/auth";
import { signWebhook } from "../server/webhook-signature";

const apiKey = process.env.BLOCKRADAR_API_KEY;
const walletId = process.env.BLOCKRADAR_WALLET_ID_ARC;
if (!apiKey || !walletId) throw new Error("Run via `npm run webhook:test` so .env is loaded.");

const db = JSON.parse(readFileSync("data/db.json", "utf8"));
const address = db.depositAddresses?.[DEMO_USER_ID]?.arc;
if (!address) throw new Error("No Arc deposit address yet — open the Deposit page first.");

const body = JSON.stringify({
  event: "deposit.success",
  data: {
    id: `test-${randomUUID()}`,
    type: "DEPOSIT",
    status: "SUCCESS",
    amount: "1.0",
    hash: null,
    network: "mainnet",
    recipientAddress: address.address,
    asset: { symbol: "USDC" },
    address: { id: address.id, address: address.address },
    wallet: { id: walletId },
  },
});
const signature = signWebhook(body, apiKey);

async function send(label: string, payload: string) {
  const res = await fetch(`http://localhost:${process.env.PORT ?? 3001}/webhooks/blockradar`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-blockradar-signature": signature },
    body: payload,
  });
  console.log(`${label} → ${res.status} ${await res.text()}`);
}

if (process.argv.includes("--tamper")) {
  // An attacker changes the amount but can't re-sign without the API key.
  await send("tampered event", body.replace('"amount":"1.0"', '"amount":"1000.0"'));
} else {
  await send("valid event", body);
  if (process.argv.includes("--twice")) await send("same event again", body);
}
