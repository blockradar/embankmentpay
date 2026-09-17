// @vitest-environment node
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isValidSignature, signWebhook } from "./webhook-signature";

const secret = "test-api-key";
const body = Buffer.from('{"event":"deposit.success","data":{"id":"tx_1","amount":"10.0"}}');

describe("webhook signatures", () => {
  it("signs with hex HMAC-SHA512, as Blockradar documents", () => {
    const expected = createHmac("sha512", secret).update(body).digest("hex");
    expect(signWebhook(body, secret)).toBe(expected);
  });

  it("accepts a body signed with the secret", () => {
    expect(isValidSignature(body, signWebhook(body, secret), secret)).toBe(true);
  });

  it("rejects a body changed after signing", () => {
    const signature = signWebhook(body, secret);
    const tampered = Buffer.from(body.toString().replace('"10.0"', '"10000.0"'));
    expect(isValidSignature(tampered, signature, secret)).toBe(false);
  });

  it("rejects a signature made with a different key", () => {
    expect(isValidSignature(body, signWebhook(body, "someone-elses-key"), secret)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    expect(isValidSignature(body, undefined, secret)).toBe(false);
  });

  it("rejects a malformed signature without throwing", () => {
    expect(isValidSignature(body, "not-a-signature", secret)).toBe(false);
  });
});
