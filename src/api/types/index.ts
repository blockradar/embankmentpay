/**
 * Types mirror confirmed Blockradar response shapes (see docs.blockradar.co)
 * so mock adapters and future live adapters can share one contract without
 * feature code caring which is active.
 */

export type SettlementNetwork = "arc" | "base";
export type StablecoinAsset = "USDC" | "USDT" | "EURC";

export interface Balance {
  totalUsd: number;
  availableUsd: number;
  inEarnUsd: number;
  todayDeltaUsd: number;
  network: SettlementNetwork;
  asset: StablecoinAsset;
}

export type TransactionKind =
  | "yield"
  | "deposit-received"
  | "withdraw-sent"
  | "swap"
  | "bank-deposit";

export interface Transaction {
  id: string;
  kind: TransactionKind;
  title: string;
  subtitle: string;
  amountUsd: number;
  timestampLabel: string;
  occurredAt: string; // ISO
}

/** Blockradar "Address" — dedicated child deposit address under a master wallet. */
export interface DepositAddress {
  id: string;
  address: string;
  blockchain: SettlementNetwork;
  asset: StablecoinAsset;
}

/** Blockradar Virtual Account — bank account number linked to an on-chain address. */
export interface VirtualAccount {
  id: string;
  currency: "USD";
  accountNumber: string;
  bankName: string;
  bankCode: string;
  reference: string;
  isActive: boolean;
}

/** Blockradar POST /v2/wallets/{id}/withdraw/fiat/quote response. */
export interface FiatWithdrawQuote {
  sessionId: string;
  debitAmount: number;
  minAmount: number;
  networkFee: number;
  networkFeeInUsd: number;
  transactionFee: number;
  estimatedArrivalSeconds: number;
  expiresInSeconds: number;
}

/** Blockradar POST /v1/wallets/{id}/swaps/quote response. */
export interface SwapQuote {
  fromAssetSymbol: string;
  toAssetSymbol: string;
  amount: number;
  fromAmount: number;
  toAmount: number;
  minAmount: number;
  rate: number;
  impactPct: number;
  slippagePct: number;
  networkFee: number;
  networkFeeInUsd: number;
  estimatedArrivalSeconds: number;
}

export type SwapAmountSide = "source" | "target";
export type SwapOrder = "FASTEST" | "CHEAPEST" | "RECOMMENDED" | "NO_SLIPPAGE";

export interface OnChainAssetHolding {
  assetId: string;
  symbol: string;
  name: string;
  balance: number;
  balanceUsd: number;
  priceUsd: number;
}

/** Blockradar GET /v1/rewards/products entry. */
export interface RewardProduct {
  id: string;
  protocol: "aave-v3" | "compound-v3";
  network: SettlementNetwork | "ethereum" | "arbitrum" | "optimism" | "polygon" | "bnb";
  asset: StablecoinAsset;
  apyPct: number;
  hasLockUp: false;
}

/** Blockradar GET /v1/wallets/{id}/rewards position. */
export interface RewardPosition {
  productId: string;
  principalUsd: number;
  accruedUsd: number;
  apyPct: number;
  todayYieldUsd: number;
  lifetimeYieldUsd: number;
}
