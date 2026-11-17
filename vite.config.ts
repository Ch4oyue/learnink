import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// ============================================
// PRECACHE
// Install cost is paid on the first visit, so the precache holds the app shell
// only; everything else (route chunks, vendors, images) is runtime-cached on
// demand. `scripts/check-precache-budget.mjs` runs after the build and fails it
// if the shell grows past its budget or non-shell files sneak back in.
// ============================================

const PRECACHE_MAX_FILE_KB = Number(process.env.PRECACHE_MAX_FILE_KB ?? 512);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    tailwindcss(),
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      strategies: 'generateSW',
      includeAssets: ['favicon.ico'],
      // The OS fetches manifest icons when installing the app; they do not
      // belong in the install payload of the page.
      includeManifestIcons: false,
      workbox: {
        // App shell only: the HTML, the entry JS/CSS and the small public icons.
        // Route chunks, vendor bundles and images are cached on demand below.
        globPatterns: ['index.html', 'manifest.webmanifest', 'assets/index-*.js', 'assets/index-*.css', 'favicon.ico'],
        // Safety net for anything the globs above accidentally pick up.
        maximumFileSizeToCacheInBytes: PRECACHE_MAX_FILE_KB * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Hashed build output is immutable, so first use fills the cache and
            // repeat visits (including offline) are served from it.
            urlPattern: /\/assets\/.*\.(?:js|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'build-assets-cache',
              expiration: {
                maxEntries: 160,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|avif|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
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
        display_override: ['window-controls-overlay', 'standalone'],
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
        share_target: {
          action: '/dashboard/share-target',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url'
          }
        },
        protocol_handlers: [
          {
            protocol: 'web+learnink',
            url: '/learn/%s'
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
    }),
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
            // Only tiny helpers shared by the entry chunk live here. Dates, validation and
            // forms are grouped separately: the entry imports `cn()` (clsx + tailwind-merge),
            // so bundling them together forced date-fns/zod/react-hook-form onto the critical path.
            if (id.includes("date-fns")) {
              return "vendor-dates";
            }
            if (id.includes("zod") || id.includes("react-hook-form") || id.includes("@hookform")) {
              return "vendor-forms";
            }
            if (id.includes("clsx") || id.includes("tailwind-merge")) {
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
