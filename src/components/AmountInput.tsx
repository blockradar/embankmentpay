import { useState, type ChangeEvent } from "react";
import { formatUsd } from "../lib/format";
import styles from "./AmountInput.module.css";

const DEFAULT_CHIPS = [50, 100, 500];

/**
 * Shared large-numeral amount entry: serif-italic `$` + input matching the
 * dashboard's typographic scale, an available-balance/error caption, and
 * quick-amount chips (+ Max). Used by Withdraw now, and Swap/Earn's "Add to
 * Earn" in upcoming phases — kept generic (no domain knowledge of which
 * flow it's in) so all three share one look and one set of edge cases.
 */
export function AmountInput({
  onAmountChange,
  availableUsd,
  currencyLabel = "USD",
  chips = DEFAULT_CHIPS,
  error,
  autoFocus = true,
}: {
  onAmountChange: (amount: number) => void;
  availableUsd: number;
  currencyLabel?: string;
  chips?: number[];
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

  function handleChip(amount: number) {
    commit(String(amount));
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
          aria-label={`Amount in ${currencyLabel}`}
        />
        <span className={styles.currency}>{currencyLabel}</span>
      </div>
      <div className={styles.meta}>
        <span className={error ? styles.error : undefined}>
          {error ?? `Available ${formatUsd(availableUsd)}`}
        </span>
      </div>
      <div className={styles.chips}>
        {chips.map((amount) => (
          <button key={amount} type="button" className={styles.chip} onClick={() => handleChip(amount)}>
            ${amount}
          </button>
        ))}
        <button type="button" className={styles.chip} onClick={() => handleChip(availableUsd)}>
          Max
        </button>
      </div>
    </div>
  );
}
