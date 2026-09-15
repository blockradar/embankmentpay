import type { RewardPosition, RewardProduct } from "../types";

export interface EarnService {
  listProducts(): Promise<RewardProduct[]>;
  getPosition(): Promise<RewardPosition>;
  deposit(amountUsd: number): Promise<{ transactionId: string }>;
  withdraw(amountUsd: number): Promise<{ transactionId: string }>;
}
