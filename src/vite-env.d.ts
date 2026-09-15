/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: "mock" | "live";
  readonly VITE_BLOCKRADAR_BASE_URL?: string;
  readonly VITE_BLOCKRADAR_API_KEY?: string;
  readonly VITE_DEFAULT_NETWORK?: "arc" | "base";
  readonly VITE_WALLET_ID_ARC?: string;
  readonly VITE_WALLET_ID_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
