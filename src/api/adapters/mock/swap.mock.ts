import type { SwapService } from "../../operations/swap.service";
import { mockDelay } from "./delay";
import { useAccountStore } from "./accountStore";

/** "eth-base" → "Base" — used for the review screen's "Executed on <chain>" note. */
function chainLabel(assetId: string): string {
  const chain = assetId.split("-").slice(1).join("-");
  return chain.length > 0 ? chain.charAt(0).toUpperCase() + chain.slice(1) : "";
}

export const swapMockAdapter: SwapService = {
  getHoldings: () => mockDelay(useAccountStore.getState().holdings),
  getSwapQuote: ({ fromAssetId, amount }) => {
    const source = useAccountStore.getState().holdings.find((h) => h.assetId === fromAssetId);
    const rate = source?.priceUsd ?? 1;
    const toAmount = amount * rate;
    return mockDelay({
      fromAssetSymbol: source?.symbol ?? "?",
      toAssetSymbol: "USDC",
      amount,
      fromAmount: amount,
      toAmount,
      minAmount: toAmount * 0.995,
      rate,
      impactPct: 0.02,
      slippagePct: 0.5,
      networkFee: 0.8,
      networkFeeInUsd: 0.8,
      estimatedArrivalSeconds: 12,
      // Much shorter than the fiat withdraw's 20-minute session, since this
      // is a live market price, not a routed bank rate.
      quoteValidSeconds: 15,
    });
  },
  executeSwap: ({ fromAssetId, amount }) => {
    const source = useAccountStore.getState().holdings.find((h) => h.assetId === fromAssetId);
    const symbol = source?.symbol ?? "?";
    const toAmountUsd = amount * (source?.priceUsd ?? 1);
    useAccountStore.getState().recordSwap(fromAssetId, amount, toAmountUsd, {
      kind: "swap",
      title: `${symbol} → USDC`,
      subtitle: `${amount} ${symbol} on ${chainLabel(fromAssetId)}`,
    });
    return mockDelay({ transactionId: "txn_swap_mock_1" });
  },
};
