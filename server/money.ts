/**
 * Money handling. Amounts travel as decimal STRINGS ("0.005"), never as
 * JavaScript numbers — floats can't represent most decimals exactly
 * (0.1 + 0.2 !== 0.3). To compare amounts, convert to whole micro-units.
 */
import { HttpError } from "./errors";

const USDC_DECIMALS = 6;

/** Validates a user-entered USDC amount and returns it as a clean decimal string. */
export function parseUsdcAmount(input: unknown): string {
  const amount = typeof input === "string" ? input.trim() : "";
  if (!/^\d+(\.\d{1,6})?$/.test(amount)) {
    throw new HttpError(400, "Enter an amount like 1.50 (USDC has at most 6 decimal places).");
  }
  if (toMicroUnits(amount) <= 0n) {
    throw new HttpError(400, "Amount must be greater than 0.");
  }
  return amount;
}

/** "1.5" → 1500000n. Extra decimals (e.g. from a balance) are truncated, never rounded up. */
export function toMicroUnits(amount: string): bigint {
  const [whole, fraction = ""] = amount.split(".");
  return BigInt(whole || "0") * 10n ** BigInt(USDC_DECIMALS) + BigInt(fraction.slice(0, USDC_DECIMALS).padEnd(USDC_DECIMALS, "0"));
}
