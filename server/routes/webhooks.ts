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
import { config } from "../config";
import { HttpError } from "../errors";
import { store } from "../store";
import { isValidSignature } from "../webhook-signature";

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

    const key = `${event}:${data.id}`;

    // 🧑‍💻 LIVE CODE — chapter 3b.
    // ② Seen it before? Blockradar retries for ~2.5 hours, and events can be
    //    resent. If store.hasProcessedWebhook(key) → respond 200
    //    { received: true, duplicate: true } and stop. (Try: npm run webhook:test -- --twice)
    //
    // ③ Wrong network? If data.network !== EXPECTED_NETWORK (from ../config) →
    //    store.markWebhookProcessed(key), respond 200, stop. (200, so it isn't retried.)

    // ④ Handle it. This is quick (one database write), so we do it before
    //    responding: if it throws, Blockradar gets a 500 and retries. If your
    //    handler does slow work (emails, other APIs), save the event, respond
    //    200 right away, and do the slow part in a background job.
    switch (event) {
      case "deposit.success":
        handleDepositSuccess(key, data);
        break;
      case "withdraw.success":
      case "withdraw.failed":
      case "withdraw.cancelled":
        handleWithdrawUpdate(key, data);
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
  // 🧑‍💻 LIVE CODE — chapter 3c.
  //
  //  1. owner = data.address && store.findDepositAddressById(data.address.id)
  //     wallet = getWallet(owner.address.network)   (import from ../wallets)
  //     No owner, or wallet.walletId !== data.wallet.id → markWebhookProcessed(key), stop.
  //  2. ARC GOTCHA: gas IS USDC. A "deposit" whose data.senderAddress is our own
  //     master wallet (wallet.address) is the gas top-up for a gasless withdrawal.
  //     → markWebhookProcessed(key), don't credit.
  //  3. store.markWebhookProcessed(key, { transactionId: data.id, userId, network,
  //     amount: data.amount, asset, hash: data.hash, creditedAt }) — ONE write.
  //
  // Answer key: git show master:server/routes/webhooks.ts
  throw new HttpError(501, `Chapter 3: credit deposit ${data.id} (${key}) in server/routes/webhooks.ts`);
}

/**
 * The final word on a withdrawal. On success, `networkFee` is the proof of
 * the Arc hook: the gas was paid in USDC, and `networkFees[].feeSource`
 * shows who paid it — MASTER_WALLET when gasless is on.
 */
function handleWithdrawUpdate(key: string, data: BlockradarWebhookEvent["data"]) {
  const status = data.status === "SUCCESS" ? "SUCCESS" : data.status === "CANCELLED" ? "CANCELLED" : "FAILED";
  const networkFee = data.networkFee
    ? {
        amount: data.networkFee.amount,
        symbol: data.networkFee.symbol,
        amountUsd: data.networkFee.amountUsd,
        paidBy: [...new Set((data.networkFees ?? []).map((f) => f.feeSource))],
      }
    : null;

  const withdrawal = store.updateWithdrawalFromWebhook(key, data.id, { status, hash: data.hash, networkFee });
  if (!withdrawal) {
    // e.g. a withdrawal made from the dashboard, not through this app.
    console.log(`[webhook] ${key}: not a withdrawal this app sent, recorded only`);
    return;
  }
  const fee = networkFee ? `gas ${networkFee.amount} ${networkFee.symbol} paid by ${networkFee.paidBy.join(", ")}` : "no fee info";
  console.log(`[webhook] withdrawal ${data.id} → ${status} (${fee})`);
}
