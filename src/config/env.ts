import type { SettlementNetwork } from "../api/types";

interface NetworkConfig {
  label: string;
  /** Blockradar mainnet master walletId for this network. */
  walletId: string;
}

/** Single source of truth for everything environment/endpoint related. */
export const env = {
  blockradarBaseUrl:
    import.meta.env.VITE_BLOCKRADAR_BASE_URL ?? "https://api.blockradar.co/v1",
  blockradarApiKey: import.meta.env.VITE_BLOCKRADAR_API_KEY ?? "",
  defaultNetwork: (import.meta.env.VITE_DEFAULT_NETWORK as SettlementNetwork) ?? "arc",
  networks: {
    arc: {
      label: "Arc",
      walletId: import.meta.env.VITE_WALLET_ID_ARC ?? "",
    },
    base: {
      label: "Base",
      walletId: import.meta.env.VITE_WALLET_ID_BASE ?? "",
    },
  } satisfies Record<SettlementNetwork, NetworkConfig>,
};
