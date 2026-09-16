import type {
  CryptoWithdrawFee,
  CryptoWithdrawResult,
  FiatWithdrawQuote,
  PaymentMethodData,
  ResolvedRecipient,
  SettlementNetwork,
} from "../types";

export interface WithdrawService {
  /**
   * Mirrors POST .../withdraw/network-fee — a same-chain on-chain send has
   * no session/expiry concept (unlike fiat withdraw or swap), just a
   * point-in-time fee/arrival estimate.
   */
  getCryptoWithdrawFee(params: {
    network: SettlementNetwork;
    address: string;
    amountUsd: number;
  }): Promise<CryptoWithdrawFee>;
  /** Mirrors POST .../withdraw — sends on-chain to an external address on the same chain. */
  executeCryptoWithdraw(params: {
    network: SettlementNetwork;
    address: string;
    amountUsd: number;
  }): Promise<CryptoWithdrawResult>;

  // --- Fiat withdrawal — kept for a possible future phase, not currently
  // wired into any screen. The active Withdraw flow is crypto-only (see
  // WithdrawPage). This is real, verified Blockradar research, not dead
  // guesswork, so it stays rather than being deleted.
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
