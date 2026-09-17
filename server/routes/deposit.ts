/**
 * POST /api/me/:network/deposit-address — the user's deposit address.
 * GET  /api/me/:network/deposits        — deposits the webhook has credited.
 *
 * STEP 1 of the core flow: wallet → address.
 *   • The master wallet was created once, in the Blockradar dashboard.
 *   • Each user gets ONE child address under it, created on first use and
 *     reused forever after. Deposits to it are credited to that user.
 */
import { Router } from "express";
import type { CreditedDeposit, DepositAddress } from "../../shared/types";
import { currentUserId } from "../auth";
import { HttpError } from "../errors";
import { store, type StoredAddress } from "../store";
import { getWallet, type LoadedWallet } from "../wallets";

export const depositRouter = Router();

depositRouter.post("/me/:network/deposit-address", async (req, res) => {
  const wallet = getWallet(req.params.network);
  const stored = await getOrCreateDepositAddress(currentUserId(req), wallet);

  const address: DepositAddress = {
    id: stored.id,
    address: stored.address,
    blockchain: stored.network,
    asset: "USDC",
  };
  res.json(address);
});

depositRouter.get("/me/:network/deposits", (req, res) => {
  const wallet = getWallet(req.params.network);
  const deposits: CreditedDeposit[] = store
    .listDeposits(currentUserId(req), wallet.network)
    .map((d) => ({ id: d.transactionId, amount: d.amount, asset: d.asset, hash: d.hash, creditedAt: d.creditedAt }));
  res.json(deposits);
});

/**
 * Two requests can arrive at once — a double-click, a retry, or React
 * running effects twice in dev. Without this map, both would see "no
 * address yet" and create two. Concurrent callers share one creation.
 *
 * (This only works within one server process. In production, back it with
 * a unique constraint on (user_id, network) in your database.)
 */
const inFlight = new Map<string, Promise<StoredAddress>>();

function getOrCreateDepositAddress(userId: string, wallet: LoadedWallet): Promise<StoredAddress> {
  const existing = store.getDepositAddress(userId, wallet.network);
  if (existing) return Promise.resolve(existing);

  const key = `${userId}:${wallet.network}`;
  let pending = inFlight.get(key);
  if (!pending) {
    pending = createDepositAddress(userId, wallet).finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }
  return pending;
}

async function createDepositAddress(userId: string, wallet: LoadedWallet): Promise<StoredAddress> {
  // 🧑‍💻 LIVE CODE — chapter 2.
  //
  //  1. blockradar.createAddress(wallet.walletId, { ... }) with:
  //       name: `user:${userId}`            (never an email — it's stored at a third party)
  //       metadata: { userId }              (echoed back on every webhook)
  //       disableAutoSweep: true            (funds stay on the user's address)
  //       enableGaslessWithdraw: true       (THE ARC HOOK: master wallet pays gas, in USDC)
  //  2. Build a StoredAddress { id, address, network, createdAt } and
  //     store.saveDepositAddress(userId, stored)
  //  3. Return it.
  //
  // Answer key: git show master:server/routes/deposit.ts
  throw new HttpError(501, `Chapter 2: create ${userId}'s gasless ${wallet.network} deposit address (server/routes/deposit.ts)`);
}
