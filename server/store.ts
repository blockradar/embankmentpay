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

interface Db {
  /** userId → network → that user's one deposit address on that network. */
  depositAddresses: Record<string, Partial<Record<SettlementNetwork, StoredAddress>>>;
}

const DB_PATH = "data/db.json";

function load(): Db {
  if (!existsSync(DB_PATH)) return { depositAddresses: {} };
  return JSON.parse(readFileSync(DB_PATH, "utf8")) as Db;
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
};
