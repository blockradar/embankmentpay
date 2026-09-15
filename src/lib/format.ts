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

/** "Rate locked for Ns" below a minute, "M:SS" at or above — used by any
 * flow with a rate-locked quote countdown (Withdraw, Swap). */
export function formatCountdown(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, "0")}`;
  }
  return `${seconds}s`;
}
