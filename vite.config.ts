import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// The dev server proxies /ao3/* to archiveofourown.org so "Fetch details"
// works locally without a CORS proxy. In production set VITE_AO3_PROXY to a
// proxy base URL (see README) or fill the fields in by hand.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/ao3": {
        target: "https://archiveofourown.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ao3/, ""),
      },
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
