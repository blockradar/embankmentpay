import type { Transaction } from "../../types";
import { useAccountStore } from "./accountStore";

/**
 * Mock-only: simulates a deposit landing, the way a real `deposit.success` /
 * `onramp.success` Blockradar webhook would credit the account. Has no live
 * counterpart — real deposits are credited server-side by a webhook, never
 * triggered from the client — so this must only ever be called from UI
 * gated on `env.apiMode === "mock"`.
 */
export function simulateDepositArriving(
  amountUsd: number,
  txn: Omit<Transaction, "id" | "occurredAt" | "timestampLabel" | "amountUsd">,
) {
  useAccountStore.getState().creditDeposit(amountUsd, txn);
}
