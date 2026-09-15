import type { EarnService } from "../../operations/earn.service";
import { useAccountStore } from "./accountStore";
import { mockRewardProducts } from "./data";
import { mockDelay } from "./delay";

export const earnMockAdapter: EarnService = {
  listProducts: () => mockDelay(mockRewardProducts),
  getPosition: () => mockDelay(useAccountStore.getState().rewardPosition),
  deposit: () => mockDelay({ transactionId: "txn_earn_deposit_mock_1" }),
  withdraw: () => mockDelay({ transactionId: "txn_earn_withdraw_mock_1" }),
};
