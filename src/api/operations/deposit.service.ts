import type {
  Balance,
  DepositAddress,
  SettlementNetwork,
  Transaction,
  VirtualAccount,
} from "../types";

export interface DepositService {
  getBalance(): Promise<Balance>;
  getRecentTransactions(limit?: number): Promise<Transaction[]>;
  createStablecoinAddress(network: SettlementNetwork): Promise<DepositAddress>;
  createVirtualAccount(currency: "USD"): Promise<VirtualAccount>;
}
