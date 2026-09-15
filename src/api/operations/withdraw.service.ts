import type { FiatWithdrawQuote } from "../types";

export interface WithdrawService {
  getFiatWithdrawQuote(amountUsd: number): Promise<FiatWithdrawQuote>;
  /**
   * Takes the full quote (not just sessionId) so the mock adapter can debit
   * the correct amount without a second lookup; a live adapter only needs
   * `quote.sessionId` off this object to hit the real execute endpoint.
   */
  executeFiatWithdraw(quote: FiatWithdrawQuote): Promise<{ transactionId: string }>;
}
