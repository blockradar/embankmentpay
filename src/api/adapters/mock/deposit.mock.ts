import type { DepositService } from "../../operations/deposit.service";
import { useAccountStore } from "./accountStore";
import { mockDelay } from "./delay";

export const depositMockAdapter: DepositService = {
  getBalance: () => mockDelay(useAccountStore.getState().balance),
  getRecentTransactions: (limit = 5) =>
    mockDelay(useAccountStore.getState().transactions.slice(0, limit)),
  createStablecoinAddress: (chain) =>
    mockDelay({
      id: "addr_mock_1",
      address: "0x8F3a41C9b2E7d5A06fB19cD3e84a7F2b6C0d9E15",
      blockchain: chain,
      asset: "USDC",
    }),
  createVirtualAccount: (currency) =>
    mockDelay({
      id: "va_mock_1",
      currency,
      accountNumber: "0000481124",
      bankName: "Column N.A.",
      bankCode: "021000021",
      reference: "EP-VA-MOCK-1",
      isActive: true,
    }),
};
