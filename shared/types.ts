/**
 * Shapes shared by the server (which produces them) and the React app
 * (which renders them). These are OUR app's types, not Blockradar's raw
 * responses — server/blockradar.ts maps one into the other, so the
 * frontend never depends on Blockradar's API shape directly.
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

/** A dedicated deposit address (a Blockradar child address under a master wallet). */
export interface DepositAddress {
  id: string;
  address: string;
  blockchain: SettlementNetwork;
  asset: "USDC";
}

/** A deposit our webhook has credited to the user. */
export interface CreditedDeposit {
  id: string;
  /** Decimal string, exactly as Blockradar reported it. */
  amount: string;
  asset: string;
  hash: string | null;
  creditedAt: string;
}

export interface CryptoWithdrawFee {
  networkFeeUsd: number;
  estimatedArrivalSeconds: number;
}

export interface CryptoWithdrawResult {
  id: string;
  hash: string;
}
