import { apiRequest } from "./client";
import type {
  Balance,
  CreditedDeposit,
  DepositAddress,
  SettlementNetwork,
  Transaction,
  Withdrawal,
  WithdrawQuote,
} from "./types";

/**
 * Every API call the screens make, in one place. Each one maps 1:1 to a
 * route in server/routes/.
 */
export const api = {
  account: {
    getBalance: (network: SettlementNetwork) => apiRequest<Balance>(`/me/${network}/balance`),

    getRecentTransactions: (network: SettlementNetwork, limit = 5) =>
      apiRequest<Transaction[]>(`/me/${network}/transactions?limit=${limit}`),
  },

  deposit: {
    /** Returns the user's deposit address, creating it on first use. */
    getAddress: (network: SettlementNetwork) =>
      apiRequest<DepositAddress>(`/me/${network}/deposit-address`, { method: "POST" }),

    /** Deposits the server's webhook has credited, newest first. */
    listDeposits: (network: SettlementNetwork) => apiRequest<CreditedDeposit[]>(`/me/${network}/deposits`),
  },

  withdraw: {
    /** Validates and estimates gas. Moves no funds. */
    getQuote: (network: SettlementNetwork, body: { address: string; amount: string }) =>
      apiRequest<WithdrawQuote>(`/me/${network}/withdraw/quote`, { method: "POST", body }),

    /** ⚠️ Sends real funds. Reusing `idempotencyKey` returns the original withdrawal instead of sending again. */
    send: (network: SettlementNetwork, body: { address: string; amount: string; idempotencyKey: string }) =>
      apiRequest<Withdrawal>(`/me/${network}/withdrawals`, { method: "POST", body }),

    get: (network: SettlementNetwork, id: string) => apiRequest<Withdrawal>(`/me/${network}/withdrawals/${id}`),
  },
};
