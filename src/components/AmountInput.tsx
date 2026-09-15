import { useState, type ChangeEvent } from "react";
import { formatUsd } from "../lib/format";
import { usdChips, type AmountChip } from "../lib/amountChips";
import styles from "./AmountInput.module.css";

const DEFAULT_CHIPS = usdChips([50, 100, 500]);
const MAX_CHIP: AmountChip = { label: "Max", getValue: (available) => available };

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Shared large-numeral amount entry: serif-italic prefix + input matching
 * the dashboard's typographic scale, an available-balance/error caption,
 * and quick-amount chips (+ Max, always appended). USD flows (Withdraw,
 * Earn's "Add to Earn") use the defaults; asset-denominated flows (Swap)
 * pass `prefix=""`, a `unitLabel` like "ETH", `percentChips(...)`, and a
 * `formatAvailable` for a non-dollar caption.
 */
export function AmountInput({
  onAmountChange,
  available,
  unitLabel = "USD",
  prefix = "$",
  chips = DEFAULT_CHIPS,
  formatAvailable,
  decimals = 2,
  error,
  autoFocus = true,
}: {
  onAmountChange: (amount: number) => void;
  available: number;
  unitLabel?: string;
  prefix?: string;
  chips?: AmountChip[];
  formatAvailable?: (value: number) => string;
  decimals?: number;
  error?: string;
  autoFocus?: boolean;
}) {
  const [raw, setRaw] = useState("");

  function commit(nextRaw: string) {
    setRaw(nextRaw);
    const parsed = Number.parseFloat(nextRaw);
    onAmountChange(Number.isFinite(parsed) ? parsed : 0);
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    const digitsAndDot = event.target.value.replace(/[^0-9.]/g, "");
    const firstDot = digitsAndDot.indexOf(".");
    const cleaned =
      firstDot === -1
        ? digitsAndDot
        : digitsAndDot.slice(0, firstDot + 1) + digitsAndDot.slice(firstDot + 1).replace(/\./g, "");
    commit(cleaned);
  }

  function handleChip(chip: AmountChip) {
    const value = roundTo(chip.getValue(available), decimals);
    commit(String(value));
  }

  const availableCaption = formatAvailable ? formatAvailable(available) : formatUsd(available);

  return (
    <div className={styles.wrap}>
      <div className={styles.inputRow}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        <input
          className={styles.input}
          inputMode="decimal"
          placeholder="0"
          value={raw}
          onChange={handleInput}
          autoFocus={autoFocus}
          aria-label={`Amount in ${unitLabel}`}
        />
        <span className={styles.currency}>{unitLabel}</span>
      </div>
      <div className={styles.meta}>
        <span className={error ? styles.error : undefined}>{error ?? `Available ${availableCaption}`}</span>
      </div>
      <div className={styles.chips}>
        {[...chips, MAX_CHIP].map((chip) => (
          <button key={chip.label} type="button" className={styles.chip} onClick={() => handleChip(chip)}>
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
