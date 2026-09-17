/**
 * POST /webhooks/blockradar — STEP 2 of the core flow: handle a deposit.
 *
 * Blockradar calls this URL when something happens on your wallets. Set it
 * on the dashboard's Developers page — the same page BLOCKRADAR_API_KEY came
 * from, because Blockradar signs webhooks with that page's key.
 *
 * It's a public URL — anyone can POST to it — so every request is treated
 * as hostile until its signature proves it came from Blockradar.
 */
import express, { Router } from "express";
import type { BlockradarWebhookEvent } from "../blockradar";
import { config, EXPECTED_NETWORK } from "../config";
import { store } from "../store";
import { isValidSignature } from "../webhook-signature";
import { getWallet } from "../wallets";

export const webhooksRouter = Router();

webhooksRouter.post(
  "/webhooks/blockradar",
  // Keep the body as raw bytes. The signature covers exactly what was sent;
  // parsing to JSON and re-serializing it could change a byte and break it.
  express.raw({ type: "application/json", limit: "1mb" }),
  (req, res) => {
    const rawBody = req.body as unknown;
    if (!Buffer.isBuffer(rawBody)) {
      res.status(400).json({ error: "Expected a JSON body" });
      return;
    }

    // ① Is it really from Blockradar? Check BEFORE reading anything in it.
    if (!isValidSignature(rawBody, req.header("x-blockradar-signature"), config.blockradar.apiKey)) {
      console.warn("[webhook] rejected: invalid signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }
    const { event, data } = JSON.parse(rawBody.toString("utf8")) as BlockradarWebhookEvent;

    // ② Seen it before? Blockradar retries any event that doesn't get a 200
    //    (5 attempts over ~2.5 hours), and you can resend events manually.
    //    Handling the same deposit twice would credit the user twice.
    const key = `${event}:${data.id}`;
    if (store.hasProcessedWebhook(key)) {
      console.log(`[webhook] ${key} already processed, skipping`);
      res.json({ received: true, duplicate: true });
      return;
    }

    // ③ Right environment? Acknowledge with 200 (so it isn't retried for
    //    hours) but don't act on it.
    if (data.network !== EXPECTED_NETWORK) {
      console.warn(`[webhook] ignored ${key}: network is ${data.network}, expected ${EXPECTED_NETWORK}`);
      store.markWebhookProcessed(key);
      res.json({ received: true });
      return;
    }

    // ④ Handle it. This is quick (one database write), so we do it before
    //    responding: if it throws, Blockradar gets a 500 and retries. If your
    //    handler does slow work (emails, other APIs), save the event, respond
    //    200 right away, and do the slow part in a background job.
    switch (event) {
      case "deposit.success":
        handleDepositSuccess(key, data);
        break;
      default:
        console.log(`[webhook] ${key} (no handler for ${event})`);
        store.markWebhookProcessed(key);
    }

    // ⑤ Acknowledge.
    res.json({ received: true });
  },
);

function handleDepositSuccess(key: string, data: BlockradarWebhookEvent["data"]) {
  // Whose deposit address did the money arrive at?
  const owner = data.address ? store.findDepositAddressById(data.address.id) : undefined;

  // Also check it came through the wallet we configured for that network —
  // cheap insurance against mixing up wallets.
  if (!owner || getWallet(owner.address.network).walletId !== data.wallet.id) {
    // e.g. a deposit straight to the master wallet, or an address this app didn't create.
    console.warn(`[webhook] ${key} to ${data.recipientAddress}: no matching user address, not credited`);
    store.markWebhookProcessed(key);
    return;
  }

  // Blockradar screens deposits for sanctions (data.amlScreening). A
  // production app should hold, not credit, anything flagged.

  // In a real app, this is where you credit your ledger and notify the user,
  // in the same database transaction as marking the event processed.
  store.markWebhookProcessed(key, {
    transactionId: data.id,
    userId: owner.userId,
    network: owner.address.network,
    amount: data.amount,
    asset: data.asset?.symbol ?? "USDC",
    hash: data.hash,
    creditedAt: new Date().toISOString(),
  });
  console.log(`[webhook] credited ${data.amount} ${data.asset?.symbol} to ${owner.userId} (${key})`);
}
