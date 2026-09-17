import type { CryptoWithdrawFee, CryptoWithdrawResult, SettlementNetwork } from "../types";

export interface WithdrawService {
  /**
   * Mirrors POST .../withdraw/network-fee — a same-chain on-chain send has
   * no session/expiry concept, just a point-in-time fee/arrival estimate.
   */
  getCryptoWithdrawFee(params: {
    network: SettlementNetwork;
    address: string;
    amountUsd: number;
  }): Promise<CryptoWithdrawFee>;
  /** Mirrors POST .../withdraw — sends on-chain to an external address on the same chain. */
  executeCryptoWithdraw(params: {
    network: SettlementNetwork;
    address: string;
    amountUsd: number;
  }): Promise<CryptoWithdrawResult>;
}
