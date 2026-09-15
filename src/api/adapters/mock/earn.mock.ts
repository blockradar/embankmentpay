import type { EarnService } from "../../operations/earn.service";
import { useAccountStore } from "./accountStore";
import { mockRewardProducts } from "./data";
import { mockDelay } from "./delay";

export const earnMockAdapter: EarnService = {
  listProducts: () => mockDelay(mockRewardProducts),
  getPosition: () => mockDelay(useAccountStore.getState().rewardPosition),
  deposit: (amountUsd) => {
    useAccountStore.getState().moveToEarn(amountUsd, {
      kind: "earn-add",
      title: "Added to Earn",
      subtitle: "Earn · USDC",
    });
    return mockDelay({ transactionId: "txn_earn_deposit_mock_1" });
  },
  withdraw: (amountUsd) => {
    useAccountStore.getState().moveFromEarn(amountUsd, {
      kind: "earn-withdraw",
      title: "Moved out of Earn",
      subtitle: "Earn · USDC",
    });
    return mockDelay({ transactionId: "txn_earn_withdraw_mock_1" });
  },
};
