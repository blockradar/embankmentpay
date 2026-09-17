/**
 * POST /api/me/:network/deposit-address — the user's deposit address.
 *
 * STEP 1 of the core flow: wallet → address.
 *   • The master wallet was created once, in the Blockradar dashboard.
 *   • Each user gets ONE child address under it, created on first use and
 *     reused forever after. Deposits to it are credited to that user.
 */
import { Router } from "express";
import type { DepositAddress } from "../../shared/types";
import { currentUserId } from "../auth";
import * as blockradar from "../blockradar";
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
  const created = await blockradar.createAddress(wallet.walletId, {
    name: `user:${userId}`,
    // Blockradar echoes metadata back on every transaction and webhook for
    // this address — handy for tracing a deposit back to a user.
    metadata: { userId },
    // Keep the user's USDC on their own address, so they can withdraw from it.
    disableAutoSweep: true,
    // THE ARC HOOK: the master wallet pays this address's withdrawal gas.
    // On Arc, gas is paid in USDC — so the platform needs only USDC, and the
    // user never needs a separate gas token.
    enableGaslessWithdraw: true,
  });

  const stored: StoredAddress = {
    id: created.id,
    address: created.address,
    network: wallet.network,
    createdAt: new Date().toISOString(),
  };
  store.saveDepositAddress(userId, stored);

  console.log(
    `✓ created ${wallet.network} deposit address ${created.address} for ${userId} ` +
      `(gasless: ${created.configurations.enableGaslessWithdraw}, auto-sweep off: ${created.configurations.disableAutoSweep})`,
  );
  return stored;
}
