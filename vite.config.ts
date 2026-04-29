// Vercel deployment config
// Note: @lovable.dev/vite-tanstack-config includes cloudflare by default
// We override with a Vercel-compatible setup

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:   ["react", "react-dom"],
          router:   ["@tanstack/react-router"],
          supabase: ["@supabase/supabase-js"],
          ui:       ["lucide-react", "recharts"],
        },
      },
    },
  },
  resolve: {
    alias: { "@": "/src" },
  },
});
