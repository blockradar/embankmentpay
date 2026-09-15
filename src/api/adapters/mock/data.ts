import type { Balance, RewardPosition, RewardProduct, Transaction } from "../../types";

export const mockBalance: Balance = {
  totalUsd: 12480.32,
  availableUsd: 9280.32,
  inEarnUsd: 3200.0,
  todayDeltaUsd: 0.43,
  network: "base",
  asset: "USDC",
};

export const mockTransactions: Transaction[] = [
  {
    id: "txn_1",
    kind: "yield",
    title: "Yield paid",
    subtitle: "Earn · Today",
    amountUsd: 0.42,
    timestampLabel: "Today",
    occurredAt: new Date().toISOString(),
  },
  {
    id: "txn_2",
    kind: "deposit-received",
    title: "From Marco V.",
    subtitle: "USDC via Base → Arc",
    amountUsd: 250.0,
    timestampLabel: "Yesterday",
    occurredAt: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: "txn_3",
    kind: "withdraw-sent",
    title: "To bank account",
    subtitle: "ACH · USD",
    amountUsd: -1200.0,
    timestampLabel: "Sep 11",
    occurredAt: "2026-09-11T00:00:00.000Z",
  },
  {
    id: "txn_4",
    kind: "swap",
    title: "ETH → USDC",
    subtitle: "0.25 ETH on Base",
    amountUsd: 812.4,
    timestampLabel: "Sep 10",
    occurredAt: "2026-09-10T00:00:00.000Z",
  },
  {
    id: "txn_5",
    kind: "bank-deposit",
    title: "Bank deposit",
    subtitle: "ACH · Chase ••4821",
    amountUsd: 3000.0,
    timestampLabel: "Sep 8",
    occurredAt: "2026-09-08T00:00:00.000Z",
  },
];

export const mockRewardProducts: RewardProduct[] = [
  { id: "aave-base-usdc", protocol: "aave-v3", network: "base", asset: "USDC", apyPct: 4.85, hasLockUp: false },
  { id: "compound-eth-usdc", protocol: "compound-v3", network: "ethereum", asset: "USDC", apyPct: 4.32, hasLockUp: false },
];

export const mockRewardPosition: RewardPosition = {
  productId: "aave-base-usdc",
  principalUsd: mockBalance.inEarnUsd,
  accruedUsd: 418.2,
  apyPct: 4.85,
  todayYieldUsd: 0.43,
  lifetimeYieldUsd: 418.2,
};
