/**
 * Types mirror confirmed Blockradar response shapes (see docs.blockradar.co)
 * so mock adapters and future live adapters can share one contract without
 * feature code caring which is active.
 */

export type SettlementNetwork = "arc" | "base";
export type StablecoinAsset = "USDC" | "USDT" | "EURC";

/**
 * Chains a stablecoin deposit can be *sent from* — broader than
 * SettlementNetwork, since Blockradar bridges deposits from many source
 * chains into the account's settlement network (arc|base).
 */
export type DepositSourceChain = "arc" | "base" | "ethereum" | "polygon" | "solana" | "tron";

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
  | "bank-deposit"
  | "earn-add"
  | "earn-withdraw";

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
  blockchain: DepositSourceChain;
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

/**
 * Blockradar's fiat-withdraw recipient identification. Field names
 * (`institutionIdentifier` = routing/bank code, `accountIdentifier` =
 * account number) are confirmed verbatim from Blockradar's docs. There is
 * no saved/reusable payout method in their API — this is collected fresh
 * on every withdrawal.
 */
export interface PaymentMethodData {
  institutionIdentifier: string;
  accountIdentifier: string;
}

/**
 * Response of POST .../withdraw/fiat/payment-method/resolve — Blockradar's
 * anti-fraud check, resolving a bank account to its holder's name before
 * the user can proceed with a withdrawal.
 */
export interface ResolvedRecipient extends PaymentMethodData {
  accountName: string;
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
  /** Original design copy: "Quote valid 15s" — a live market price, not
   * documented as a named response field in what we could scrape from
   * Blockradar's docs; verify the real field name against the live API
   * reference before building the live adapter. */
  quoteValidSeconds: number;
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
