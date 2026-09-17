/**
 * STEP 3 of the core flow: a transaction on Arc with gas paid in USDC.
 *
 *   POST /api/me/:network/withdraw/quote  — validate + estimate gas (moves nothing)
 *   POST /api/me/:network/withdrawals     — send ⚠️ real funds on mainnet
 *   GET  /api/me/:network/withdrawals/:id — status, updated by the webhook
 *
 * The user's address was created with enableGaslessWithdraw (routes/deposit.ts),
 * so the MASTER WALLET pays the gas. On Arc the gas token is USDC — the user
 * never needs to hold anything but USDC, and neither does the platform.
 */
import { Router, type Request } from "express";
import type { Withdrawal, WithdrawQuote } from "../../shared/types";
import { currentUserId } from "../auth";
import * as blockradar from "../blockradar";
import { config } from "../config";
import { HttpError } from "../errors";
import { parseUsdcAmount, toMicroUnits } from "../money";
import { store, type StoredAddress, type StoredWithdrawal } from "../store";
import { getWallet, type LoadedWallet } from "../wallets";

export const withdrawRouter = Router();

withdrawRouter.post("/me/:network/withdraw/quote", async (req, res) => {
  const { wallet, source, address, amount } = await validateWithdrawal(req);

  // Ask Blockradar what the gas will cost. This moves no funds.
  const fee = await blockradar.estimateAddressWithdrawFee(wallet.walletId, source.id, {
    assetId: wallet.usdcAssetId,
    address,
    amount,
  });

  const quote: WithdrawQuote = {
    amount,
    address,
    networkFee: fee.networkFee,
    networkFeeUsd: fee.networkFeeInUSD,
    gasToken: wallet.gasToken, // "USDC" on Arc
    gasPaidBy: "platform", // gasless is on for every address this app creates
    estimatedArrivalSeconds: fee.estimatedArrivalTime,
  };
  res.json(quote);
});

withdrawRouter.post("/me/:network/withdrawals", async (req, res) => {
  const userId = currentUserId(req);
  const idempotencyKey = typeof req.body?.idempotencyKey === "string" ? req.body.idempotencyKey : "";
  if (!/^[\w-]{8,64}$/.test(idempotencyKey)) {
    throw new HttpError(400, "Missing idempotencyKey.");
  }

  // Same key as an earlier request (double-click, retry after a timeout)?
  // Return that withdrawal instead of sending the money a second time.
  const previous = store.findWithdrawal(userId, { idempotencyKey });
  if (previous) {
    res.json(toWithdrawal(previous));
    return;
  }
  const inFlightKey = `${userId}:${idempotencyKey}`;
  if (inFlight.has(inFlightKey)) {
    throw new HttpError(409, "This withdrawal is already being sent.");
  }

  inFlight.add(inFlightKey);
  try {
    const { wallet, source, address, amount } = await validateWithdrawal(req);

    // ⚠️ Real funds move here. `reference` ties Blockradar's record to ours.
    const sent = await blockradar.withdrawFromAddress(wallet.walletId, source.id, {
      assetId: wallet.usdcAssetId,
      address,
      amount,
      reference: idempotencyKey,
      metadata: { userId },
    });

    const withdrawal: StoredWithdrawal = {
      id: sent.id,
      status: "PENDING", // final status arrives by webhook
      amount,
      address,
      hash: sent.hash,
      networkFee: null,
      createdAt: new Date().toISOString(),
      userId,
      network: wallet.network,
      idempotencyKey,
    };
    store.saveWithdrawal(withdrawal);
    console.log(`[withdraw] sent ${amount} USDC from ${userId} to ${address} (${sent.id}, ${sent.status})`);
    res.status(201).json(toWithdrawal(withdrawal));
  } finally {
    inFlight.delete(inFlightKey);
  }
});

withdrawRouter.get("/me/:network/withdrawals/:id", (req, res) => {
  const withdrawal = store.findWithdrawal(currentUserId(req), { id: req.params.id });
  if (!withdrawal) throw new HttpError(404, "Withdrawal not found.");
  res.json(toWithdrawal(withdrawal));
});

/** Requests currently sending, so two identical ones can't both reach Blockradar. */
const inFlight = new Set<string>();

/**
 * Every check runs on the server, again, at send time — never trust the
 * browser's validation or a quote the browser hands back.
 */
async function validateWithdrawal(req: Request): Promise<{
  wallet: LoadedWallet;
  source: StoredAddress;
  address: string;
  amount: string;
}> {
  const wallet = getWallet(String(req.params.network));
  const source = store.getDepositAddress(currentUserId(req), wallet.network);
  if (!source) throw new HttpError(400, "You don't have any funds to withdraw yet.");

  // Arc and Base are EVM chains: 0x + 40 hex characters.
  const address = typeof req.body?.address === "string" ? req.body.address.trim() : "";
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new HttpError(400, "Enter a valid address (0x followed by 40 characters).");
  }
  if (address.toLowerCase() === source.address.toLowerCase()) {
    throw new HttpError(400, "That's your own deposit address.");
  }

  const amount = parseUsdcAmount(req.body?.amount);
  if (toMicroUnits(amount) > toMicroUnits(config.maxWithdrawUsdc)) {
    throw new HttpError(400, `Withdrawals are limited to ${config.maxWithdrawUsdc} USDC.`);
  }

  const { balance } = await blockradar.getAddressBalance(wallet.walletId, source.id, wallet.usdcAssetId);
  if (toMicroUnits(amount) > toMicroUnits(balance)) {
    throw new HttpError(400, `Amount exceeds your balance of ${balance} USDC.`);
  }

  return { wallet, source, address, amount };
}

function toWithdrawal(w: StoredWithdrawal): Withdrawal {
  const { id, status, amount, address, hash, networkFee, createdAt } = w;
  return { id, status, amount, address, hash, networkFee, createdAt };
}
