import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  worker: {
    format: "es",
    type: "module",
  },

  optimizeDeps: {
    exclude: ["@mlc-ai/web-llm"],
  },

  build: {
    chunkSizeWarningLimit: 2000,
    target: "esnext",
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },

  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  },
});
