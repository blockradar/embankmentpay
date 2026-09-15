import type { DepositService } from "../../operations/deposit.service";

const notImplemented = (): never => {
  throw new Error("Live Blockradar deposit adapter not implemented yet");
};

export const depositLiveAdapter: DepositService = {
  getBalance: notImplemented,
  getRecentTransactions: notImplemented,
  createStablecoinAddress: notImplemented,
  createVirtualAccount: notImplemented,
};
