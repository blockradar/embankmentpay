import type { TransactionKind } from "../../api/types";

const glyph: Record<TransactionKind, string> = {
  yield: "%",
  "deposit-received": "↙",
  "withdraw-sent": "↓",
  swap: "⇄",
  "bank-deposit": "+",
};

export function TransactionGlyph({ kind }: { kind: TransactionKind }) {
  return <span aria-hidden>{glyph[kind]}</span>;
}
