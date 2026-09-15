import type { WithdrawService } from "../../operations/withdraw.service";

const notImplemented = (): never => {
  throw new Error("Live Blockradar withdraw adapter not implemented yet");
};

export const withdrawLiveAdapter: WithdrawService = {
  getFiatWithdrawQuote: notImplemented,
  executeFiatWithdraw: notImplemented,
};
