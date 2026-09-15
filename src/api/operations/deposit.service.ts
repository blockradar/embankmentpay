import type {
  Balance,
  DepositAddress,
  DepositSourceChain,
  Transaction,
  VirtualAccount,
} from "../types";

export interface DepositService {
  getBalance(): Promise<Balance>;
  getRecentTransactions(limit?: number): Promise<Transaction[]>;
  createStablecoinAddress(chain: DepositSourceChain): Promise<DepositAddress>;
  createVirtualAccount(currency: "USD"): Promise<VirtualAccount>;
}
