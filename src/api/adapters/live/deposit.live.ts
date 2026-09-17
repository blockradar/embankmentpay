import type { DepositService } from "../../operations/deposit.service";
import type {
  Balance,
  DepositAddress,
  SettlementNetwork,
  Transaction,
} from "../../types";
import { blockradarRequest } from "../../client";
import { env } from "../../../config/env";

function requireWalletId(chain: SettlementNetwork): string {
  const { walletId, label } = env.networks[chain];
  if (!walletId) {
    throw new Error(`No ${label} master wallet is configured — set its wallet ID in .env.`);
  }
  return walletId;
}

interface BlockradarAssetEntry {
  id: string; // wallet-scoped asset id, used as ?assetId= on balance calls
  asset: { symbol: string };
}

interface BlockradarWalletDetails {
  id: string;
  address: string; // the wallet's own on-chain address, used to derive tx direction
  assets: BlockradarAssetEntry[];
}

// Memoized per walletId for the life of the session — a wallet's own
// address and asset-id list don't change while the app is running.
const walletDetailsCache = new Map<string, Promise<BlockradarWalletDetails>>();

function getWalletDetails(walletId: string): Promise<BlockradarWalletDetails> {
  let cached = walletDetailsCache.get(walletId);
  if (!cached) {
    cached = blockradarRequest<{ data: BlockradarWalletDetails }>(`/wallets/${walletId}`).then(
      (res) => res.data,
    );
    walletDetailsCache.set(walletId, cached);
  }
  return cached;
}

async function getUsdcAssetId(walletId: string): Promise<string> {
  const details = await getWalletDetails(walletId);
  const usdc = details.assets.find((a) => a.asset.symbol === "USDC");
  if (!usdc) {
    throw new Error(`No USDC asset configured on wallet ${walletId}`);
  }
  return usdc.id;
}

interface BlockradarTransaction {
  id: string;
  senderAddress: string | null;
  recipientAddress: string | null;
  amountUSD: string;
  hash: string | null;
  createdAt: string;
  asset: { symbol: string } | null;
}

/**
 * Maps a real Blockradar transaction into our Transaction type, using the
 * wallet's own address to tell incoming from outgoing.
 */
function mapTransaction(tx: BlockradarTransaction, ownAddress: string): Transaction {
  const amountUsd = Number.parseFloat(tx.amountUSD) || 0;
  const isOutgoing = tx.senderAddress?.toLowerCase() === ownAddress.toLowerCase();
  const isIncoming = tx.recipientAddress?.toLowerCase() === ownAddress.toLowerCase();
  const symbol = tx.asset?.symbol ?? "USDC";

  return {
    id: tx.id,
    kind: isIncoming ? "deposit-received" : "withdraw-sent",
    title: isIncoming ? "Deposit received" : "Sent",
    subtitle: symbol,
    amountUsd: isOutgoing && !isIncoming ? -amountUsd : amountUsd,
    timestampLabel: new Date(tx.createdAt).toLocaleDateString(),
    occurredAt: tx.createdAt,
  };
}

export const depositLiveAdapter: DepositService = {
  async getBalance(): Promise<Balance> {
    const walletId = requireWalletId(env.defaultNetwork);
    const assetId = await getUsdcAssetId(walletId);
    const res = await blockradarRequest<{
      data: { balance: string; convertedBalance: string };
    }>(`/wallets/${walletId}/balance?assetId=${assetId}`);

    const availableUsd = Number.parseFloat(res.data.convertedBalance) || 0;
    return {
      totalUsd: availableUsd,
      availableUsd,
      network: env.defaultNetwork,
      asset: "USDC",
    };
  },

  async getRecentTransactions(limit = 5): Promise<Transaction[]> {
    const walletId = requireWalletId(env.defaultNetwork);
    const [details, res] = await Promise.all([
      getWalletDetails(walletId),
      blockradarRequest<{ data: BlockradarTransaction[] }>(
        `/wallets/${walletId}/transactions?limit=${limit}`,
      ),
    ]);
    return res.data.map((tx) => mapTransaction(tx, details.address));
  },

  async createStablecoinAddress(chain): Promise<DepositAddress> {
    const walletId = requireWalletId(chain);
    const res = await blockradarRequest<{
      data: { id: string; address: string };
    }>(`/wallets/${walletId}/addresses`, {
      method: "POST",
      body: JSON.stringify({ name: "embeddedpay-deposit" }),
    });
    return {
      id: res.data.id,
      address: res.data.address,
      blockchain: chain,
      asset: "USDC",
    };
  },
};
