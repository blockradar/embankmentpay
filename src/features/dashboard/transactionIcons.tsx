import type { TransactionKind } from "../../api/types";

const glyph: Record<TransactionKind, string> = {
  "deposit-received": "↙",
  "withdraw-sent": "↓",
};

export function TransactionGlyph({ kind }: { kind: TransactionKind }) {
  return <span aria-hidden>{glyph[kind]}</span>;
}
