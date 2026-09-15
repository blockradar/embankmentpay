import type { OnChainAssetHolding, SwapAmountSide, SwapOrder, SwapQuote } from "../types";

export interface SwapService {
  getHoldings(): Promise<OnChainAssetHolding[]>;
  getSwapQuote(params: {
    fromAssetId: string;
    toAssetId: string;
    amount: number;
    amountSide?: SwapAmountSide;
    order?: SwapOrder;
  }): Promise<SwapQuote>;
  executeSwap(params: { fromAssetId: string; toAssetId: string; amount: number }): Promise<{
    transactionId: string;
  }>;
}
