export type ApiMode = "mock" | "live";

export type SettlementNetwork = "arc" | "base";

interface NetworkConfig {
  label: string;
  /** Blockradar master walletId for this network. Empty until provisioned. */
  walletId: string;
  isTestnet: boolean;
}

/**
 * Single source of truth for everything environment/endpoint related.
 * Swapping API_MODE to "live" and filling in walletIds is the only change
 * needed to move any operation from mock to real Blockradar calls — no
 * feature code should ever branch on mode itself, only api/index.ts.
 */
export const env = {
  apiMode: (import.meta.env.VITE_API_MODE as ApiMode) ?? "mock",
  blockradarBaseUrl:
    import.meta.env.VITE_BLOCKRADAR_BASE_URL ?? "https://api.blockradar.co/v1",
  blockradarApiKey: import.meta.env.VITE_BLOCKRADAR_API_KEY ?? "",
  defaultNetwork: (import.meta.env.VITE_DEFAULT_NETWORK as SettlementNetwork) ?? "base",
  networks: {
    arc: {
      label: "Arc",
      walletId: import.meta.env.VITE_WALLET_ID_ARC ?? "",
      isTestnet: true,
    },
    base: {
      label: "Base",
      walletId: import.meta.env.VITE_WALLET_ID_BASE ?? "",
      isTestnet: false,
    },
  } satisfies Record<SettlementNetwork, NetworkConfig>,
};
