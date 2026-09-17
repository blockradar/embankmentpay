import type { SettlementNetwork } from "../api/types";

/**
 * Display-only network info. Nothing secret lives in the frontend — the
 * API key and wallet IDs are server-side (server/config.ts).
 */
export const DEFAULT_NETWORK: SettlementNetwork = "arc";

export const NETWORK_LABELS: Record<SettlementNetwork, string> = {
  arc: "Arc",
  base: "Base",
};
