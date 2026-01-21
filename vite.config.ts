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
          // Radix UI components
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-tabs",
            "@radix-ui/react-select",
            "@radix-ui/react-popover",
            "@radix-ui/react-avatar",
            "@radix-ui/react-slot",
          ],
          // Animation libraries
          "vendor-motion": ["framer-motion"],
          // Charts library
          "vendor-charts": ["recharts"],
          // Data fetching
          "vendor-query": ["@tanstack/react-query"],
          // Supabase client
          "vendor-supabase": ["@supabase/supabase-js"],
          // Date utilities
          "vendor-date": ["date-fns"],
        },
      },
    },
  },
}));
