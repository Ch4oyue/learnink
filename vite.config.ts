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
      registerType: 'prompt',
      injectRegister: 'auto',
      strategies: 'generateSW',
      includeAssets: ['favicon.ico', 'placeholder.svg', 'apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: 'LearnInk',
        short_name: 'LearnInk',
        description: 'Platform Belajar AI & Automation Terdepan',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['education', 'productivity'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Materi Saya',
            short_name: 'Materi',
            description: 'Lanjutkan belajar modul Anda',
            url: '/dashboard/courses',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Request Materi',
            short_name: 'Request',
            description: 'Ajukan topik materi baru',
            url: '/dashboard/requests',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          }
        ],
        screenshots: [
          {
            src: 'https://ik.imagekit.io/focustimerin/learnink_landing?updatedAt=1757343104763',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'LearnInk Landing Page'
          },
          {
            src: 'https://ik.imagekit.io/focustimerin/learnink_mobile?updatedAt=1757343104763',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'LearnInk Mobile Interface'
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
    target: "es2020",
    sourcemap: false,
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
            if (id.includes("date-fns") || id.includes("zod") || id.includes("react-hook-form") || id.includes("clsx") || id.includes("tailwind-merge")) {
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
