import type { FiatWithdrawQuote, PaymentMethodData, ResolvedRecipient } from "../types";

export interface WithdrawService {
  /**
   * Mirrors GET .../withdraw/fiat/rates — establishes a sessionId for this
   * withdrawal attempt, scoped to the requested amount. Kept through
   * payment-method resolution, quote, and execute, matching Blockradar's
   * "one session per attempt" guidance.
   */
  getWithdrawSession(amountUsd: number): Promise<{ sessionId: string }>;
  /**
   * Mirrors POST .../withdraw/fiat/payment-method/resolve — Blockradar's
   * anti-fraud check: resolves a bank account to its holder's name before
   * the user can proceed. There is no saved/reusable recipient in their
   * API, so this is called fresh on every withdrawal.
   */
  resolvePaymentAccount(
    params: { sessionId: string } & PaymentMethodData,
  ): Promise<{ accountName: string }>;
  getFiatWithdrawQuote(params: {
    sessionId: string;
    amountUsd: number;
    recipient: ResolvedRecipient;
  }): Promise<FiatWithdrawQuote>;
  /**
   * Takes the full quote (not just sessionId) so the mock adapter can debit
   * the correct amount without a second lookup; a live adapter only needs
   * `quote.sessionId` and `recipient`'s paymentMethodData off these to hit
   * the real execute endpoint.
   */
  executeFiatWithdraw(params: {
    quote: FiatWithdrawQuote;
    recipient: ResolvedRecipient;
  }): Promise<{ transactionId: string }>;
}
