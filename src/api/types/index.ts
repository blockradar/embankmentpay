/**
 * Types mirror confirmed Blockradar response shapes (see docs.blockradar.co)
 * so screens can render API data without caring how it was fetched.
 */

/** The networks this app has a Blockradar mainnet master wallet for. */
export type SettlementNetwork = "arc" | "base";

export interface Balance {
  totalUsd: number;
  availableUsd: number;
  network: SettlementNetwork;
  asset: "USDC";
}

export type TransactionKind = "deposit-received" | "withdraw-sent";

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
  asset: "USDC";
}

/**
 * Blockradar POST /wallets/{id}/withdraw/network-fee response (partial —
 * only the fields this app displays). Confirmed field names verbatim.
 */
export interface CryptoWithdrawFee {
  networkFeeUsd: number;
  estimatedArrivalSeconds: number;
}

/**
 * Blockradar POST /wallets/{id}/withdraw response (partial). A same-chain
 * on-chain send.
 */
export interface CryptoWithdrawResult {
  id: string;
  hash: string;
}
