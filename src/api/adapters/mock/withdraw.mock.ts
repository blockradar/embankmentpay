import type { WithdrawService } from "../../operations/withdraw.service";
import { mockDelay } from "./delay";

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
      expiresInSeconds: 60,
    }),
  executeFiatWithdraw: () => mockDelay({ transactionId: "txn_withdraw_mock_1" }),
};
