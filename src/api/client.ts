/**
 * The browser only ever talks to OUR server (/api/*), never to Blockradar
 * directly. There is no API key anywhere in the frontend — in dev, Vite
 * proxies /api to the server (see vite.config.ts).
 */
export async function apiRequest<T>(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: options.method ?? "GET",
    headers: { "content-type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    // The server only ever sends a user-safe `error` message (server/errors.ts).
    throw new Error(json?.error ?? `Request failed (${res.status})`);
  }
  return json as T;
}
