import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React - cached for a long time
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Data fetching
          "vendor-query": ["@tanstack/react-query"],
          // Supabase client
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
  },
}));
