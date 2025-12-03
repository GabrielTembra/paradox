import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  assetsInclude: ["**/*.wasm", "**/*.json", "**/*.params"],

  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },

  optimizeDeps: {
    exclude: ["@mlc-ai/web-llm"],
  },
});
