/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Tests must never depend on network state or real credentials — force
    // every operation to mock mode regardless of what .env.local has set
    // for local dev, so a live-mode flag can never leak into a test run
    // (this bit us once already: a live VITE_API_MODE_DEPOSIT=live in
    // .env.local made a test suite hit the real Blockradar API).
    env: {
      VITE_API_MODE: "mock",
      VITE_API_MODE_DEPOSIT: "mock",
      VITE_API_MODE_WITHDRAW: "mock",
      VITE_API_MODE_SWAP: "mock",
      VITE_API_MODE_EARN: "mock",
    },
  },
});
