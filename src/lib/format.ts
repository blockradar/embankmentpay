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

export function formatSigned(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${formatUsd(Math.abs(value))}`;
}

/** "0x1234…abcd" — first 6 + last 4 chars, for compact on-chain address display. */
export function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** "Rate locked for Ns" below a minute, "M:SS" at or above — used by any
 * flow with a rate-locked quote countdown (Swap; the fiat withdraw quote
 * this was built for is currently unwired, see withdraw.service.ts). */
export function formatCountdown(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, "0")}`;
  }
  return `${seconds}s`;
}
