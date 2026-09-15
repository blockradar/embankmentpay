import { env } from "../config/env";

/**
 * Single fetch wrapper used only by live/* adapters. Mock adapters never
 * import this — that's what makes API_MODE a true single-point switch.
 */
export async function blockradarRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${env.blockradarBaseUrl}${path}`, {
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
