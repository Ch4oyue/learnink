import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'placeholder.svg'],
      manifest: {
        name: 'LearnAI',
        short_name: 'LearnAI',
        description: 'Platform Belajar AI Automation',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // 1. Core React (Critical Path)
            // Includes react, react-dom, router. Keeps the main bundle clean.
            if (id.includes("react-router-dom") || id.includes("@remix-run") || id.includes("react-dom") || id.includes("react/")) {
              return "vendor-react-core";
            }

            // 2. Heavy Animation Libraries
            // Separated because they are large and not needed for initial paint of static pages.
            // Lucide is removed from here to allow tree-shaking per route.
            if (id.includes("framer-motion") || id.includes("gsap")) {
              return "vendor-animation";
            }

            // 3. Data Fetching
            if (id.includes("@tanstack/react-query")) {
              return "vendor-query";
            }

            // 4. Supabase SDK
            if (id.includes("@supabase/supabase-js")) {
              return "vendor-supabase";
            }

            // 5. Charting Library (Very heavy, isolated)
            if (id.includes("recharts")) {
              return "vendor-charts";
            }

            // 6. Common Utilities
            // Separated so they don't bloat the UI chunks.
            if (id.includes("date-fns") || id.includes("zod")) {
              return "vendor-utils";
            }

            // NOTE: @radix-ui and lucide-react are intentionally NOT manually grouped.
            // Vite will automatically split them based on usage (route-based splitting),
            // ensuring users only download the specific dialogs/icons they actually need.
          }
        },
      },
    },
  },
}));
