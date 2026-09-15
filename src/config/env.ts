export type ApiMode = "mock" | "live";

export type SettlementNetwork = "arc" | "base";

interface NetworkConfig {
  label: string;
  /** Blockradar master walletId for this network. Empty until provisioned. */
  walletId: string;
  isTestnet: boolean;
}

type Operation = "deposit" | "withdraw" | "swap" | "earn";

function resolveMode(defaultMode: ApiMode, override: string | undefined): ApiMode {
  return override === "live" || override === "mock" ? override : defaultMode;
}

/**
 * Single source of truth for everything environment/endpoint related.
 *
 * Mode is per-operation, not global: VITE_API_MODE sets the shared default,
 * and VITE_API_MODE_<OPERATION> overrides it for just that operation. This
 * is what lets us flip Deposit to live while Withdraw/Swap/Earn stay on
 * mock data, one verified phase at a time, instead of an all-or-nothing
 * switch. No feature code should ever branch on mode itself, only
 * api/index.ts, which picks the adapter per operation from env.apiModes.
 */
const defaultMode: ApiMode = (import.meta.env.VITE_API_MODE as ApiMode) ?? "mock";

export const env = {
  apiMode: defaultMode,
  apiModes: {
    deposit: resolveMode(defaultMode, import.meta.env.VITE_API_MODE_DEPOSIT),
    withdraw: resolveMode(defaultMode, import.meta.env.VITE_API_MODE_WITHDRAW),
    swap: resolveMode(defaultMode, import.meta.env.VITE_API_MODE_SWAP),
    earn: resolveMode(defaultMode, import.meta.env.VITE_API_MODE_EARN),
  } satisfies Record<Operation, ApiMode>,
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
