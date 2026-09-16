import type { DepositService } from "../../operations/deposit.service";
import type {
  Balance,
  DepositAddress,
  DepositSourceChain,
  Transaction,
  TransactionKind,
  VirtualAccount,
} from "../../types";
import { blockradarRequest, blockradarRequestV2 } from "../../client";
import { env } from "../../../config/env";

/**
 * "arc" and "base" have live walletIds configured (env.networks). Other
 * DepositSourceChain values (ethereum, polygon, solana, tron) each have
 * their own real Blockradar wallet on this account, but wiring those up is
 * out of scope for now — env.networks only models the two settlement
 * networks (arc|base), not every source chain a deposit can bridge from.
 * Expanding live support to another chain means adding its walletId to
 * env.networks and extending this map, not guessing here.
 */
const LIVE_WALLET_BY_CHAIN: Partial<Record<DepositSourceChain, string>> = {
  arc: env.networks.arc.walletId || undefined,
  base: env.networks.base.walletId || undefined,
};

function requireWalletId(chain: DepositSourceChain): string {
  const walletId = LIVE_WALLET_BY_CHAIN[chain];
  if (!walletId) {
    throw new Error(`${chain[0].toUpperCase()}${chain.slice(1)} deposits aren't live yet — try Base for now.`);
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
  type: string | null;
  reason: string | null;
  note: string | null;
  hash: string | null;
  createdAt: string;
  asset: { symbol: string } | null;
  metadata: { strategy?: string; apyAtTime?: string } | null;
}

/**
 * Maps a real Blockradar transaction into our Transaction type. Handles
 * the two types actually observed on this account (SWAP, REWARD_DEPOSIT)
 * with proper title/subtitle; anything else falls back to a generic
 * direction-based presentation rather than crashing or dropping the row —
 * real accounts will have DEPOSIT/WITHDRAWAL/REWARD_WITHDRAWAL etc. that
 * simply weren't present in this account's history to confirm shapes for.
 */
function mapTransaction(tx: BlockradarTransaction, ownAddress: string): Transaction {
  const amountUsd = Number.parseFloat(tx.amountUSD) || 0;
  const isOutgoing = tx.senderAddress?.toLowerCase() === ownAddress.toLowerCase();
  const isIncoming = tx.recipientAddress?.toLowerCase() === ownAddress.toLowerCase();

  let kind: TransactionKind;
  let title: string;
  let subtitle: string;

  if (tx.type === "SWAP") {
    kind = "swap";
    title = tx.asset ? `${tx.asset.symbol} swap` : "Swap";
    subtitle = tx.reason ?? tx.note ?? "Swap";
  } else if (tx.type === "REWARD_DEPOSIT") {
    kind = "earn-add";
    title = "Added to Earn";
    subtitle = tx.metadata?.apyAtTime ? `${tx.metadata.apyAtTime}% APY` : "Earn";
  } else if (tx.type === "REWARD_WITHDRAWAL") {
    kind = "earn-withdraw";
    title = "Moved out of Earn";
    subtitle = "Earn";
  } else if (isIncoming) {
    kind = "deposit-received";
    title = "Deposit received";
    subtitle = tx.asset?.symbol ?? "USDC";
  } else {
    kind = "withdraw-sent";
    title = "Sent";
    subtitle = tx.asset?.symbol ?? "USDC";
  }

  return {
    id: tx.id,
    kind,
    title,
    subtitle,
    amountUsd: isOutgoing && !isIncoming ? -amountUsd : amountUsd,
    timestampLabel: new Date(tx.createdAt).toLocaleDateString(),
    occurredAt: tx.createdAt,
  };
}

interface BlockradarVirtualAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  currency: string;
  reference: string;
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
      // Earn's live integration is a later phase — this wallet does have a
      // real auto-settlement Earn position (confirmed via the wallet's
      // configurations.autoSettlement), but reading it accurately belongs
      // to Earn's own live adapter, not guessed at here.
      inEarnUsd: 0,
      todayDeltaUsd: 0,
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

  async createVirtualAccount(currency): Promise<VirtualAccount> {
    // Deliberately pinned to Base, not env.defaultNetwork — confirmed via a
    // live check that the Arc wallet has zero virtual accounts provisioned
    // (an empty GET result) and creating one goes through the untested
    // POST-create fallback below. Base already has a real, working USD
    // virtual account, so bank-transfer deposits stay on Base until Arc's
    // fiat corridor is actually provisioned and verified.
    const walletId = requireWalletId("base");
    const existing = await blockradarRequestV2<{ data: BlockradarVirtualAccount[] }>(
      `/wallets/${walletId}/virtual-accounts`,
    );
    const match = existing.data.find((va) => va.currency === currency);
    if (match) {
      return {
        id: match.id,
        currency: "USD",
        accountNumber: match.accountNumber,
        bankName: match.bankName,
        bankCode: match.bankCode,
        reference: match.reference,
        isActive: true,
      };
    }

    // Fallback only — this account already has a USD virtual account
    // provisioned, so this path is untested against the real API. A real
    // failure here (e.g. missing compliance additionalData) surfaces as a
    // thrown error rather than a silent retry loop.
    const created = await blockradarRequestV2<{ data: BlockradarVirtualAccount }>(
      `/wallets/${walletId}/virtual-accounts`,
      { method: "POST", body: JSON.stringify({ currency }) },
    );
    return {
      id: created.data.id,
      currency: "USD",
      accountNumber: created.data.accountNumber,
      bankName: created.data.bankName,
      bankCode: created.data.bankCode,
      reference: created.data.reference,
      isActive: true,
    };
  },
};
