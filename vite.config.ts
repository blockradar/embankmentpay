/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The browser calls /api/* on the Vite dev server, which forwards to our
    // API server (server/index.ts). The frontend never holds an API key.
    proxy: { "/api": "http://localhost:3001" },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
