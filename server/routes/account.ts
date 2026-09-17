/**
 * /api/me/:network/{balance,transactions} — the signed-in user's money.
 *
 * Each user has their own Blockradar deposit address (see
 * routes/deposit.ts), so their balance and history are that address's
 * balance and history — not the master wallet's, which holds everyone's.
 */
import { Router } from "express";
import type { Balance, Transaction } from "../../shared/types";
import { currentUserId } from "../auth";
import * as blockradar from "../blockradar";
import { store } from "../store";
import { getWallet } from "../wallets";

export const accountRouter = Router();

accountRouter.get("/me/:network/balance", async (req, res) => {
  const wallet = getWallet(req.params.network);
  const address = store.getDepositAddress(currentUserId(req), wallet.network);

  let availableUsd = 0;
  let available = "0";
  // No deposit address yet means nothing has ever been deposited.
  if (address) {
    const result = await blockradar.getAddressBalance(wallet.walletId, address.id, wallet.usdcAssetId);
    availableUsd = Number.parseFloat(result.convertedBalance) || 0;
    available = result.balance;
  }

  const balance: Balance = {
    totalUsd: availableUsd,
    availableUsd,
    available,
    network: wallet.network,
    asset: "USDC",
  };
  res.json(balance);
});

accountRouter.get("/me/:network/transactions", async (req, res) => {
  const wallet = getWallet(req.params.network);
  const address = store.getDepositAddress(currentUserId(req), wallet.network);
  if (!address) {
    res.json([]);
    return;
  }

  const limit = Math.min(Number(req.query.limit) || 5, 50);
  const transactions = await blockradar.getAddressTransactions(wallet.walletId, address.id, limit);
  res.json(transactions.map((tx) => toTransaction(tx, wallet.address)).filter((t) => t !== null));
});

/**
 * Blockradar's `type` says what a transaction is. This app only moves money
 * two ways — deposits in, withdrawals out — so other types are skipped.
 */
function toTransaction(tx: blockradar.BlockradarTransaction, masterWalletAddress: string): Transaction | null {
  if (tx.type !== "DEPOSIT" && tx.type !== "WITHDRAW") return null;

  const isDeposit = tx.type === "DEPOSIT";
  const amountUsd = Number.parseFloat(tx.amountUSD) || 0;
  const symbol = tx.asset?.symbol ?? "USDC";
  // ARC GOTCHA: a "deposit" from our own master wallet is the gas top-up for
  // a gasless withdrawal (gas is USDC on Arc) — label it, don't call it a deposit.
  const isGasTopUp = isDeposit && tx.senderAddress?.toLowerCase() === masterWalletAddress.toLowerCase();
  const title = isGasTopUp ? "Gas top-up" : isDeposit ? "Deposit received" : "Sent";
  const detail = isGasTopUp ? `${symbol} · paid by Embankment Pay` : symbol;

  return {
    id: tx.id,
    kind: isDeposit ? "deposit-received" : "withdraw-sent",
    title,
    // Surface anything that isn't final yet, e.g. "USDC · PENDING".
    subtitle: tx.status === "SUCCESS" ? detail : `${detail} · ${tx.status}`,
    amountUsd: isDeposit ? amountUsd : -amountUsd,
    amount: tx.amount,
    asset: symbol,
    timestampLabel: new Date(tx.createdAt).toLocaleDateString(),
    occurredAt: tx.createdAt,
  };
}
