import styles from "./AssetIcon.module.css";

// Desaturated-enough versions of each asset's own brand color to sit inside
// the dark/gold theme without fighting it, while staying recognizable.
const COLORS: Record<string, string> = {
  ETH: "#9a9af0",
  USDT: "#3fae91",
  EURC: "#5c98e0",
  WBTC: "#e69a4d",
};

export function AssetIcon({ symbol }: { symbol: string }) {
  const color = COLORS[symbol] ?? "var(--ep-text-secondary)";
  return (
    <span className={styles.badge} style={{ background: `${color}26`, color }}>
      {symbol}
    </span>
  );
}
