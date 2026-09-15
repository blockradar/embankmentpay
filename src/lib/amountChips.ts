export interface AmountChip {
  label: string;
  getValue: (available: number) => number;
}

/** Fixed-dollar chips, e.g. usdChips([50, 100, 500]) → "$50" "$100" "$500". */
export function usdChips(values: number[]): AmountChip[] {
  return values.map((value) => ({ label: `$${value}`, getValue: () => value }));
}

/** Percentage-of-balance chips, e.g. percentChips([25, 50]) → "25%" "50%". */
export function percentChips(percents: number[]): AmountChip[] {
  return percents.map((pct) => ({ label: `${pct}%`, getValue: (available) => available * (pct / 100) }));
}
