/**
 * /api/wallets/:network/* — read a master wallet and create deposit addresses.
 *
 * Every handler follows the same shape: look up the wallet for the
 * network in the URL, call Blockradar, map the response into the app's
 * own types (shared/types.ts), and return JSON.
 */
import { Router } from "express";
import type { Balance, DepositAddress, Transaction } from "../../shared/types";
import * as blockradar from "../blockradar";
import { getWallet } from "../wallets";

export const walletsRouter = Router();

/** Balance: the master wallet's USDC. */
walletsRouter.get("/wallets/:network/balance", async (req, res) => {
  const wallet = getWallet(req.params.network);
  const { convertedBalance } = await blockradar.getWalletBalance(wallet.walletId, wallet.usdcAssetId);

  const availableUsd = Number.parseFloat(convertedBalance) || 0;
  const balance: Balance = { totalUsd: availableUsd, availableUsd, network: wallet.network, asset: "USDC" };
  res.json(balance);
});

/** Recent transactions, newest first. */
walletsRouter.get("/wallets/:network/transactions", async (req, res) => {
  const wallet = getWallet(req.params.network);
  const limit = Math.min(Number(req.query.limit) || 5, 50);
  const transactions = await blockradar.getWalletTransactions(wallet.walletId, limit);

  res.json(transactions.map(toTransaction).filter((t) => t !== null));
});

/** Create a deposit address. */
walletsRouter.post("/wallets/:network/deposit-addresses", async (req, res) => {
  const wallet = getWallet(req.params.network);
  const created = await blockradar.createAddress(wallet.walletId, { name: "embankmentpay-deposit" });

  const address: DepositAddress = {
    id: created.id,
    address: created.address,
    blockchain: wallet.network,
    asset: "USDC",
  };
  res.status(201).json(address);
});

/**
 * Blockradar's `type` says what a transaction is. This app only moves money
 * two ways — deposits in, withdrawals out — so other types (swaps, Earn,
 * off-ramps made elsewhere on the account) are skipped.
 */
function toTransaction(tx: blockradar.BlockradarTransaction): Transaction | null {
  if (tx.type !== "DEPOSIT" && tx.type !== "WITHDRAW") return null;

  const isDeposit = tx.type === "DEPOSIT";
  const amountUsd = Number.parseFloat(tx.amountUSD) || 0;
  const symbol = tx.asset?.symbol ?? "USDC";

  return {
    id: tx.id,
    kind: isDeposit ? "deposit-received" : "withdraw-sent",
    title: isDeposit ? "Deposit received" : "Sent",
    // Surface anything that isn't final yet, e.g. "USDC · PENDING".
    subtitle: tx.status === "SUCCESS" ? symbol : `${symbol} · ${tx.status}`,
    amountUsd: isDeposit ? amountUsd : -amountUsd,
    timestampLabel: new Date(tx.createdAt).toLocaleDateString(),
    occurredAt: tx.createdAt,
  };
}
