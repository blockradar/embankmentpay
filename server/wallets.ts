/**
 * Loads each configured master wallet from Blockradar once, at startup,
 * and refuses to boot if anything doesn't match what we expect.
 *
 * This is the mainnet safety net: a testnet key, a wallet on the wrong
 * chain, or a wallet without USDC stops the server here — before it can
 * show a user a deposit address that won't work.
 */
import type { SettlementNetwork } from "../shared/types";
import * as blockradar from "./blockradar";
import { config, EXPECTED_NETWORK } from "./config";
import { HttpError } from "./errors";

export interface LoadedWallet {
  network: SettlementNetwork;
  walletId: string;
  /** The master wallet's own on-chain address. */
  address: string;
  /** Wallet-scoped USDC asset id, needed by balance and withdraw calls. */
  usdcAssetId: string;
  /** The chain's gas token — "USDC" on Arc, "ETH" on Base. */
  gasToken: string;
}

const wallets = new Map<SettlementNetwork, LoadedWallet>();

export async function loadWallets(): Promise<void> {
  for (const [network, walletId] of Object.entries(config.walletIds) as [SettlementNetwork, string | undefined][]) {
    if (!walletId) continue;

    let wallet: blockradar.BlockradarWallet;
    try {
      wallet = await blockradar.getWallet(walletId);
    } catch (err) {
      if (err instanceof blockradar.BlockradarError && err.status === 401) {
        throw new Error(
          `Blockradar rejected the API key (401) for the ${network} wallet. Check that ` +
            `BLOCKRADAR_API_KEY is a Live Mode key and this machine's IP is on its allowlist.`,
        );
      }
      throw err;
    }

    // Check 1: right environment. A testnet wallet here means a testnet key.
    if (wallet.network !== EXPECTED_NETWORK) {
      throw new Error(
        `The ${network} wallet "${wallet.name}" is on ${wallet.network}, expected ${EXPECTED_NETWORK}.`,
      );
    }
    // Check 2: right chain. Catches swapped wallet IDs between networks.
    if (wallet.blockchain.slug !== network) {
      throw new Error(
        `BLOCKRADAR_WALLET_ID_${network.toUpperCase()} points at a ${wallet.blockchain.slug} wallet.`,
      );
    }
    // Check 3: USDC is enabled on the wallet.
    const usdc = wallet.assets.find((a) => a.asset.symbol === "USDC" && a.isActive);
    if (!usdc) {
      throw new Error(`USDC isn't enabled on the ${network} wallet — add it under Assets in the dashboard.`);
    }

    const loaded: LoadedWallet = {
      network,
      walletId,
      address: wallet.address,
      usdcAssetId: usdc.id,
      gasToken: wallet.blockchain.symbol.toUpperCase(),
    };
    wallets.set(network, loaded);
    console.log(`✓ ${network}: "${wallet.name}" ${wallet.address} · ${wallet.network} · gas paid in ${loaded.gasToken}`);
  }
}

/** Looks up a loaded wallet by the `:network` URL param. */
export function getWallet(network: string): LoadedWallet {
  const wallet = wallets.get(network as SettlementNetwork);
  if (!wallet) {
    throw new HttpError(404, `No ${network} wallet is configured.`);
  }
  return wallet;
}
