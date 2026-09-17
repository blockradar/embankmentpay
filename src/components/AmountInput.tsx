import { useState, type ChangeEvent } from "react";
import { formatUsd } from "../lib/format";
import styles from "./AmountInput.module.css";

interface AmountChip {
  label: string;
  getValue: (available: number) => number;
}

const CHIPS: AmountChip[] = [
  ...[50, 100, 500].map((value) => ({ label: `$${value}`, getValue: () => value })),
  { label: "Max", getValue: (available) => available },
];

/**
 * Shared large-numeral amount entry: serif-italic prefix + input matching
 * the dashboard's typographic scale, an available-balance/error caption,
 * and quick-amount chips.
 */
export function AmountInput({
  onAmountChange,
  available,
  unitLabel = "USD",
  error,
  autoFocus = true,
}: {
  onAmountChange: (amount: number) => void;
  available: number;
  unitLabel?: string;
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
    const value = Math.round(chip.getValue(available) * 100) / 100;
    commit(String(value));
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.inputRow}>
        <span className={styles.prefix}>$</span>
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
        <span className={error ? styles.error : undefined}>{error ?? `Available ${formatUsd(available)}`}</span>
      </div>
      <div className={styles.chips}>
        {CHIPS.map((chip) => (
          <button key={chip.label} type="button" className={styles.chip} onClick={() => handleChip(chip)}>
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
