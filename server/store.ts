/**
 * A deliberately tiny "database": one JSON file at data/db.json.
 *
 * ⚠️  Workshop-only. Use a real database in production (Postgres, etc.):
 * this has no locking, no transactions, and breaks as soon as you run
 * more than one server instance.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import type { SettlementNetwork } from "../shared/types";

export interface StoredAddress {
  /** Blockradar's address id — used in every address-level API call. */
  id: string;
  address: string;
  network: SettlementNetwork;
  createdAt: string;
}

export interface StoredDeposit {
  /** Blockradar's transaction id. */
  transactionId: string;
  userId: string;
  network: SettlementNetwork;
  /** Exactly as Blockradar sent it. Money stays a decimal string, never a float. */
  amount: string;
  asset: string;
  hash: string | null;
  creditedAt: string;
}

interface Db {
  /** userId → network → that user's one deposit address on that network. */
  depositAddresses: Record<string, Partial<Record<SettlementNetwork, StoredAddress>>>;
  /** Deposits credited by the webhook, oldest first. */
  deposits: StoredDeposit[];
  /** "event:transactionId" for every webhook already handled — makes retries harmless. */
  processedWebhooks: string[];
}

const DB_PATH = "data/db.json";

function load(): Db {
  const empty: Db = { depositAddresses: {}, deposits: [], processedWebhooks: [] };
  if (!existsSync(DB_PATH)) return empty;
  return { ...empty, ...(JSON.parse(readFileSync(DB_PATH, "utf8")) as Partial<Db>) };
}

function save(db: Db): void {
  mkdirSync("data", { recursive: true });
  // Write to a temp file, then rename: a crash mid-write can't corrupt the db.
  writeFileSync(`${DB_PATH}.tmp`, JSON.stringify(db, null, 2));
  renameSync(`${DB_PATH}.tmp`, DB_PATH);
}

export const store = {
  getDepositAddress(userId: string, network: SettlementNetwork): StoredAddress | undefined {
    return load().depositAddresses[userId]?.[network];
  },

  saveDepositAddress(userId: string, address: StoredAddress): void {
    const db = load();
    db.depositAddresses[userId] = { ...db.depositAddresses[userId], [address.network]: address };
    save(db);
  },

  /** Which user owns a Blockradar address id? Used to credit incoming deposits. */
  findDepositAddressById(addressId: string): { userId: string; address: StoredAddress } | undefined {
    for (const [userId, byNetwork] of Object.entries(load().depositAddresses)) {
      const address = Object.values(byNetwork).find((a) => a?.id === addressId);
      if (address) return { userId, address };
    }
    return undefined;
  },

  listDeposits(userId: string, network: SettlementNetwork): StoredDeposit[] {
    return load()
      .deposits.filter((d) => d.userId === userId && d.network === network)
      .reverse();
  },

  hasProcessedWebhook(key: string): boolean {
    return load().processedWebhooks.includes(key);
  },

  /**
   * Marks a webhook as handled — and, if it credited a deposit, records the
   * deposit — in ONE write, so a crash can't leave one without the other.
   */
  markWebhookProcessed(key: string, deposit?: StoredDeposit): void {
    const db = load();
    db.processedWebhooks.push(key);
    if (deposit) db.deposits.push(deposit);
    save(db);
  },
};
