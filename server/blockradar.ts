/**
 * Blockradar API client — every call to Blockradar goes through this file.
 * Docs: https://docs.blockradar.co
 *
 * The types below are partial: only the fields this app reads.
 */
import { config } from "./config";

// ─── Response shapes ──────────────────────────────────────────────────────

export interface BlockradarWallet {
  id: string;
  name: string;
  address: string;
  network: "mainnet" | "testnet";
  status: string;
  /** `symbol` is the chain's gas token: "usdc" on Arc, "eth" on Base. */
  blockchain: { slug: string; symbol: string };
  /** Wallet-scoped asset entries — `id` is the assetId other endpoints expect. */
  assets: { id: string; isActive: boolean; asset: { symbol: string } }[];
}

export interface BlockradarAddress {
  id: string;
  address: string;
  configurations: { disableAutoSweep: boolean; enableGaslessWithdraw: boolean };
}

export interface BlockradarTransaction {
  id: string;
  /** "DEPOSIT", "WITHDRAW", "SWAP", "OFFRAMP", ... */
  type: string;
  /** "PENDING", "PROCESSING", "SUCCESS", "FAILED", ... */
  status: string;
  amountUSD: string;
  createdAt: string;
  asset: { symbol: string } | null;
}

// ─── Transport ────────────────────────────────────────────────────────────

/** Thrown for any non-2xx response. `message` is Blockradar's own error text. */
export class BlockradarError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BlockradarError";
    this.status = status;
  }
}

async function request<T>(path: string, options: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${config.blockradar.baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      // Authenticates as your business. This header must never leave the server.
      "x-api-key": config.blockradar.apiKey,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    // Don't let a slow upstream hang our request forever.
    signal: AbortSignal.timeout(15_000),
  });

  // Every Blockradar response is wrapped: { message, statusCode, data }.
  const json = (await res.json().catch(() => null)) as { message?: string; data?: T } | null;
  if (!res.ok) {
    throw new BlockradarError(res.status, json?.message ?? `Request failed with ${res.status}`);
  }
  return json?.data as T;
}

// ─── Endpoints ────────────────────────────────────────────────────────────

/** GET /wallets/{walletId} — a master wallet: its network, chain, address and assets. */
export function getWallet(walletId: string) {
  return request<BlockradarWallet>(`/wallets/${walletId}`);
}

/**
 * POST /wallets/{walletId}/addresses — generate a child address under a
 * master wallet. Per-address settings override the master wallet's.
 */
export function createAddress(
  walletId: string,
  body: {
    name: string;
    /** Echoed back on every transaction and webhook for this address. */
    metadata: Record<string, string>;
    /** true → the user's funds stay on this address instead of moving to the master wallet. */
    disableAutoSweep: boolean;
    /** true → the master wallet pays gas when this address withdraws. */
    enableGaslessWithdraw: boolean;
  },
) {
  return request<BlockradarAddress>(`/wallets/${walletId}/addresses`, { method: "POST", body });
}

/** GET /wallets/{walletId}/addresses/{addressId}/balance — one address's balance of one asset. */
export function getAddressBalance(walletId: string, addressId: string, assetId: string) {
  return request<{ balance: string; convertedBalance: string }>(
    `/wallets/${walletId}/addresses/${addressId}/balance?assetId=${encodeURIComponent(assetId)}`,
  );
}

/** GET /wallets/{walletId}/addresses/{addressId}/transactions — newest first. */
export function getAddressTransactions(walletId: string, addressId: string, limit: number) {
  return request<BlockradarTransaction[]>(
    `/wallets/${walletId}/addresses/${addressId}/transactions?limit=${limit}&order=DESC`,
  );
}
