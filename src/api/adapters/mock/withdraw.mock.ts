import type { WithdrawService } from "../../operations/withdraw.service";
import { mockDelay } from "./delay";
import { useAccountStore } from "./accountStore";

export const withdrawMockAdapter: WithdrawService = {
  getFiatWithdrawQuote: (amountUsd) =>
    mockDelay({
      sessionId: "sess_mock_1",
      debitAmount: amountUsd,
      minAmount: 1,
      networkFee: 0,
      networkFeeInUsd: 0,
      transactionFee: 0,
      estimatedArrivalSeconds: 60 * 60 * 24,
      // Blockradar's withdraw-fiat guide documents a 20-minute rate/routing
      // session validity — the exact response field name wasn't confirmed
      // against the live API reference (only available via an interactive,
      // JS-rendered schema we couldn't scrape), so `expiresInSeconds` here is
      // our best-effort shape. Verify the real field name when building the
      // live adapter; the value (1200s) is taken from the documented prose.
      expiresInSeconds: 60 * 20,
    }),
  executeFiatWithdraw: (quote) => {
    // In mock mode, "execute" is the whole simulation — a real withdrawal is
    // debited server-side once Blockradar confirms it, but there's no
    // separate async step to fake here the way Deposit's push-based
    // "simulate arriving" needed, since the user already triggered this
    // synchronously by confirming.
    useAccountStore.getState().debitWithdraw(quote.debitAmount, {
      kind: "withdraw-sent",
      title: "To bank account",
      subtitle: "ACH · Chase ••4821",
    });
    return mockDelay({ transactionId: "txn_withdraw_mock_1" });
  },
};
