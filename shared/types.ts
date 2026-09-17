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

/** What a withdrawal will cost, shown on the review screen before sending. */
export interface WithdrawQuote {
  amount: string;
  address: string;
  /** Estimated gas, in `gasToken` units. */
  networkFee: string;
  networkFeeUsd: string;
  /** The chain's gas token: "USDC" on Arc, "ETH" on Base. */
  gasToken: string;
  /** "platform" when gasless is on: the master wallet pays, not the user. */
  gasPaidBy: "platform" | "user";
  estimatedArrivalSeconds: number;
}

export interface Withdrawal {
  id: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  amount: string;
  address: string;
  hash: string | null;
  /** Filled in by the withdraw.success webhook: the gas actually paid, and by whom. */
  networkFee: { amount: string; symbol: string; amountUsd: string | null; paidBy: string[] } | null;
  createdAt: string;
}
