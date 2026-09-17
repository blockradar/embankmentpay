export function formatUsd(value: number, opts: Intl.NumberFormatOptions = {}): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(Math.abs(value));
  return value < 0 ? `-${formatted}` : formatted;
}

/** "0x1234…abcd" — first 6 + last 4 chars, for compact on-chain address display. */
export function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * USDC amounts at real precision (up to 6 decimals, at least 2), so small
 * amounts don't round to "$0.00": "0.0090254" → "0.009025", "1.5" → "1.50".
 */
export function formatUsdc(amount: string | number): string {
  const [whole, fraction = ""] = String(amount).split(".");
  const trimmed = fraction.slice(0, 6).replace(/0+$/, "").padEnd(2, "0");
  return `${whole || "0"}.${trimmed}`;
}

