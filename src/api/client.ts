import { env } from "../config/env";

/** Single fetch wrapper for every Blockradar call. */
async function request<T>(baseUrl: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-api-key": env.blockradarApiKey,
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Blockradar ${init.method ?? "GET"} ${path} failed: ${res.status} ${body}`);
  }

  return res.json() as Promise<T>;
}

/** Blockradar v1 endpoints — wallets, addresses, balances, transactions, withdrawals. */
export function blockradarRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  return request<T>(env.blockradarBaseUrl, path, init);
}
