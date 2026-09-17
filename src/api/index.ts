import { apiRequest } from "./client";
import type {
  Balance,
  CryptoWithdrawFee,
  CryptoWithdrawResult,
  DepositAddress,
  SettlementNetwork,
  Transaction,
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
  },

  withdraw: {
    getCryptoWithdrawFee: (_params: {
      network: SettlementNetwork;
      address: string;
      amountUsd: number;
    }): Promise<CryptoWithdrawFee> => Promise.reject(new Error("Withdraw isn't wired up yet.")),

    executeCryptoWithdraw: (_params: {
      network: SettlementNetwork;
      address: string;
      amountUsd: number;
    }): Promise<CryptoWithdrawResult> => Promise.reject(new Error("Withdraw isn't wired up yet.")),
  },
};
