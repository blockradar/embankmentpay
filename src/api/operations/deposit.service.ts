import type { Balance, DepositAddress, SettlementNetwork, Transaction } from "../types";

export interface DepositService {
  getBalance(): Promise<Balance>;
  getRecentTransactions(limit?: number): Promise<Transaction[]>;
  createStablecoinAddress(chain: SettlementNetwork): Promise<DepositAddress>;
}
