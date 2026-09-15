import type { EarnService } from "../../operations/earn.service";
import { mockRewardPosition, mockRewardProducts } from "./data";
import { mockDelay } from "./delay";

export const earnMockAdapter: EarnService = {
  listProducts: () => mockDelay(mockRewardProducts),
  getPosition: () => mockDelay(mockRewardPosition),
  deposit: () => mockDelay({ transactionId: "txn_earn_deposit_mock_1" }),
  withdraw: () => mockDelay({ transactionId: "txn_earn_withdraw_mock_1" }),
};
