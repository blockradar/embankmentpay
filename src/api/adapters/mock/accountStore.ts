import { create } from "zustand";
import type { Balance, OnChainAssetHolding, RewardPosition, Transaction } from "../../types";
import { mockBalance, mockHoldings, mockRewardPosition, mockTransactions } from "./data";

interface AccountState {
  balance: Balance;
  transactions: Transaction[];
  rewardPosition: RewardPosition;
  holdings: OnChainAssetHolding[];
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
  /** Debits an on-chain holding and credits USDC balance, as a confirmed swap would. */
  recordSwap: (
    fromAssetId: string,
    fromAmount: number,
    toAmountUsd: number,
    txn: Omit<Transaction, "id" | "occurredAt" | "timestampLabel" | "amountUsd">,
  ) => void;
  /** Test-only: restores the store to its seed state. */
  reset: () => void;
}

let txnSeq = 0;

// Crypto-precision rounding for holding balances, so subtracting a swapped
// amount (e.g. 0.42 - 0.1) can't leak floating-point noise like
// 0.32000000000000006 into the UI.
function roundToPrecision(value: number, decimals = 8): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function seed() {
  return {
    balance: { ...mockBalance },
    transactions: mockTransactions.map((txn) => ({ ...txn })),
    rewardPosition: { ...mockRewardPosition },
    holdings: mockHoldings.map((holding) => ({ ...holding })),
  };
}

/**
 * Single in-memory source of truth for mock-mode account data. Mock
 * adapters read from it; the dev-only "simulate arriving" actions in the
 * Deposit flow, Withdraw's execute, and Swap's execute all write to it, so
 * a change made in any flow is immediately reflected on the Dashboard.
 * Never imported by live adapters or by feature code directly — only
 * through the mock adapters and the mock-only `simulateDepositArriving`
 * helper.
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
  recordSwap: (fromAssetId, fromAmount, toAmountUsd, txn) =>
    set((state) => {
      txnSeq += 1;
      const holdings = state.holdings.map((holding) => {
        if (holding.assetId !== fromAssetId) return holding;
        // Backstop against a negative balance the same way debitWithdraw
        // guards its side — the amount screen should already have capped this.
        const safeFromAmount = Math.min(fromAmount, holding.balance);
        const nextBalance = roundToPrecision(Math.max(0, holding.balance - safeFromAmount));
        const nextBalanceUsd = roundToPrecision(nextBalance * holding.priceUsd, 2);
        return { ...holding, balance: nextBalance, balanceUsd: nextBalanceUsd };
      });
      const transaction: Transaction = {
        ...txn,
        amountUsd: toAmountUsd,
        id: `txn_mock_${Date.now()}_${txnSeq}`,
        occurredAt: new Date().toISOString(),
        timestampLabel: "Just now",
      };
      return {
        holdings,
        balance: {
          ...state.balance,
          totalUsd: state.balance.totalUsd + toAmountUsd,
          availableUsd: state.balance.availableUsd + toAmountUsd,
        },
        transactions: [transaction, ...state.transactions],
      };
    }),
  reset: () => set(seed()),
}));
