/**
 * Blockradar webhook signatures.
 *
 * Every webhook carries an `x-blockradar-signature` header: the hex
 * HMAC-SHA512 of the raw request body, keyed with your API key. Only
 * Blockradar and your server know the key, so a matching signature proves
 * the event is genuine and wasn't modified in transit.
 */
import { createHmac } from "node:crypto";

export function signWebhook(rawBody: Buffer | string, secret: string): string {
  return createHmac("sha512", secret).update(rawBody).digest("hex");
}

export function isValidSignature(_rawBody: Buffer, _signature: string | undefined, _secret: string): boolean {
  // 🧑‍💻 LIVE CODE — chapter 3a. `npm test` goes green when this is right.
  //
  //  1. No signature header? → false
  //  2. expected = signWebhook(rawBody, secret)
  //  3. Compare expected vs signature with crypto.timingSafeEqual (NOT ===),
  //     so response timing can't leak how many characters matched.
  //     timingSafeEqual throws if lengths differ — check lengths first.
  //
  // Answer key: git show master:server/webhook-signature.ts
  return false;
}
