import { env } from "../config/env";

/**
 * Single fetch wrapper used only by live/* adapters. Mock adapters never
 * import this — that's what makes API_MODE a true single-point switch.
 */
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

/** Blockradar v1 endpoints — wallets, addresses, balances, transactions, swaps, rewards. */
export function blockradarRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  return request<T>(env.blockradarBaseUrl, path, init);
}

/**
 * Blockradar v2 endpoints — virtual accounts, fiat withdraw. v2 replaces
 * /v1 with /v2 in the base URL (not appended), confirmed against the real
 * API: https://staging-api.blockradar.co/v1 -> https://staging-api.blockradar.co/v2.
 */
export function blockradarRequestV2<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrlV2 = env.blockradarBaseUrl.replace(/\/v1$/, "/v2");
  return request<T>(baseUrlV2, path, init);
}
