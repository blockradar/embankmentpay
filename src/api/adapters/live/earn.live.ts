import type { EarnService } from "../../operations/earn.service";

const notImplemented = (): never => {
  throw new Error("Live Blockradar earn adapter not implemented yet");
};

export const earnLiveAdapter: EarnService = {
  listProducts: notImplemented,
  getPosition: notImplemented,
  deposit: notImplemented,
  withdraw: notImplemented,
};
