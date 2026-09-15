import type { FiatWithdrawQuote } from "../types";

export interface WithdrawService {
  getFiatWithdrawQuote(amountUsd: number): Promise<FiatWithdrawQuote>;
  executeFiatWithdraw(sessionId: string): Promise<{ transactionId: string }>;
}
