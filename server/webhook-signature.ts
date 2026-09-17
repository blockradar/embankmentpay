/**
 * Blockradar webhook signatures.
 *
 * Every webhook carries an `x-blockradar-signature` header: the hex
 * HMAC-SHA512 of the raw request body, keyed with your API key. Only
 * Blockradar and your server know the key, so a matching signature proves
 * the event is genuine and wasn't modified in transit.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export function signWebhook(rawBody: Buffer | string, secret: string): string {
  return createHmac("sha512", secret).update(rawBody).digest("hex");
}

export function isValidSignature(rawBody: Buffer, signature: string | undefined, secret: string): boolean {
  if (!signature) return false;

  const expected = Buffer.from(signWebhook(rawBody, secret));
  const received = Buffer.from(signature);

  // timingSafeEqual takes the same time however many characters match, so
  // an attacker can't guess the signature one character at a time by
  // measuring response times. (It throws on different lengths — check first.)
  return expected.length === received.length && timingSafeEqual(expected, received);
}
