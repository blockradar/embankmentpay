import { create } from "zustand";
import type { Balance, RewardPosition, Transaction } from "../../types";
import { mockBalance, mockRewardPosition, mockTransactions } from "./data";

interface AccountState {
  balance: Balance;
  transactions: Transaction[];
  rewardPosition: RewardPosition;
  /** Credits the mock account the way a real deposit/reward webhook would. */
  creditDeposit: (
    amountUsd: number,
    txn: Omit<Transaction, "id" | "occurredAt" | "timestampLabel" | "amountUsd">,
  ) => void;
  /** Debits the mock account the way a confirmed withdrawal execute would. */
  debitWithdraw: (
    amountUsd: number,
    txn: Omit<Transaction, "id" | "occurredAt" | "timestampLabel" | "amountUsd">,
  ) => void;
  /** Test-only: restores the store to its seed state. */
  reset: () => void;
}

let txnSeq = 0;

function seed() {
  return {
    balance: { ...mockBalance },
    transactions: mockTransactions.map((txn) => ({ ...txn })),
    rewardPosition: { ...mockRewardPosition },
  };
}

/**
 * Single in-memory source of truth for mock-mode account data. Mock
 * adapters read from it; the dev-only "simulate arriving" actions in the
 * Deposit flow write to it, so a simulated deposit is immediately reflected
 * on the Dashboard. Never imported by live adapters or by feature code
 * directly — only through the mock adapters and the mock-only
 * `simulateDepositArriving` helper.
 */
export const useAccountStore = create<AccountState>((set) => ({
  ...seed(),
  creditDeposit: (amountUsd, txn) =>
    set((state) => {
      txnSeq += 1;
      const transaction: Transaction = {
        ...txn,
        amountUsd,
        id: `txn_mock_${Date.now()}_${txnSeq}`,
        occurredAt: new Date().toISOString(),
        timestampLabel: "Just now",
      };
      return {
        balance: {
          ...state.balance,
          totalUsd: state.balance.totalUsd + amountUsd,
          availableUsd: state.balance.availableUsd + amountUsd,
        },
        transactions: [transaction, ...state.transactions],
      };
    }),
  debitWithdraw: (amountUsd, txn) =>
    set((state) => {
      txnSeq += 1;
      // Defends against ever going negative if this is somehow called with
      // more than available — the amount screen's validation should already
      // have prevented that, this is a backstop, not the primary guard.
      const safeAmount = Math.min(amountUsd, state.balance.availableUsd);
      const transaction: Transaction = {
        ...txn,
        amountUsd: -safeAmount,
        id: `txn_mock_${Date.now()}_${txnSeq}`,
        occurredAt: new Date().toISOString(),
        timestampLabel: "Just now",
      };
      return {
        balance: {
          ...state.balance,
          totalUsd: Math.max(0, state.balance.totalUsd - safeAmount),
          availableUsd: Math.max(0, state.balance.availableUsd - safeAmount),
        },
        transactions: [transaction, ...state.transactions],
      };
    }),
  reset: () => set(seed()),
}));
