import type { SwapService } from "../../operations/swap.service";

const notImplemented = (): never => {
  throw new Error("Live Blockradar swap adapter not implemented yet");
};

export const swapLiveAdapter: SwapService = {
  getHoldings: notImplemented,
  getSwapQuote: notImplemented,
  executeSwap: notImplemented,
};
