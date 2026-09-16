import type { WithdrawService } from "../../operations/withdraw.service";
import { truncateAddress } from "../../../lib/format";
import { mockDelay } from "./delay";
import { useAccountStore } from "./accountStore";

const NETWORK_LABEL: Record<string, string> = { base: "Base", arc: "Arc" };

export const withdrawMockAdapter: WithdrawService = {
  getCryptoWithdrawFee: () =>
    // Base (and presumably Arc) is a cheap L2 — a few cents of gas, arrives
    // within a block or two. Not tied to `network`/`address` in the mock
    // since we're not estimating real gas yet.
    mockDelay({ networkFeeUsd: 0.02, estimatedArrivalSeconds: 30 }),
  executeCryptoWithdraw: ({ network, address, amountUsd }) => {
    useAccountStore.getState().debitWithdraw(amountUsd, {
      kind: "withdraw-sent",
      title: "Sent",
      subtitle: `To ${truncateAddress(address)} · ${NETWORK_LABEL[network] ?? network}`,
    });
    return mockDelay({ id: `txn_withdraw_mock_${Date.now()}`, hash: `0x${"mock".repeat(16)}` });
  },

  getWithdrawSession: () => mockDelay({ sessionId: `sess_mock_${Date.now()}` }),
  resolvePaymentAccount: ({ institutionIdentifier, accountIdentifier }) => {
    const routing = institutionIdentifier.trim();
    const account = accountIdentifier.trim();
    // Loose mock validation (a real US ABA routing number is 9 digits) so the
    // Recipient screen has a genuine error path to exercise, not just a
    // happy path.
    if (!/^\d{9}$/.test(routing)) {
      return Promise.reject(new Error("Enter a valid 9-digit routing number."));
    }
    if (account.length < 4) {
      return Promise.reject(new Error("Enter a valid account number."));
    }
    // Self-withdrawal to the signed-in user's own bank account — same
    // persona name shown in the sidebar.
    return mockDelay({ accountName: "Ana Ramos" });
  },
  getFiatWithdrawQuote: ({ sessionId, amountUsd }) =>
    mockDelay({
      sessionId,
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
  executeFiatWithdraw: ({ quote, recipient }) => {
    // In mock mode, "execute" is the whole simulation — a real withdrawal is
    // debited server-side once Blockradar confirms it, but there's no
    // separate async step to fake here the way Deposit's push-based
    // "simulate arriving" needed, since the user already triggered this
    // synchronously by confirming.
    useAccountStore.getState().debitWithdraw(quote.debitAmount, {
      kind: "withdraw-sent",
      title: "To bank account",
      subtitle: `ACH · ••${recipient.accountIdentifier.slice(-4)}`,
    });
    return mockDelay({ transactionId: "txn_withdraw_mock_1" });
  },
};
