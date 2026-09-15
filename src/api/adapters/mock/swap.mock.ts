import type { SwapService } from "../../operations/swap.service";
import { mockDelay } from "./delay";

const holdings = [
  { assetId: "eth-base", symbol: "ETH", name: "Ether", balance: 0.42, balanceUsd: 1364.16, priceUsd: 3248.0 },
  { assetId: "usdt-base", symbol: "USDT", name: "Tether USD", balance: 850, balanceUsd: 850, priceUsd: 1 },
];

export const swapMockAdapter: SwapService = {
  getHoldings: () => mockDelay(holdings),
  getSwapQuote: ({ fromAssetId, toAssetId, amount }) => {
    const source = holdings.find((h) => h.assetId === fromAssetId);
    const rate = source?.priceUsd ?? 1;
    return mockDelay({
      fromAssetSymbol: source?.symbol ?? "?",
      toAssetSymbol: toAssetId,
      amount,
      fromAmount: amount,
      toAmount: amount * rate,
      minAmount: amount * rate * 0.995,
      rate,
      impactPct: 0.02,
      slippagePct: 0.5,
      networkFee: 0.8,
      networkFeeInUsd: 0.8,
      estimatedArrivalSeconds: 12,
    });
  },
  executeSwap: () => mockDelay({ transactionId: "txn_swap_mock_1" }),
};
