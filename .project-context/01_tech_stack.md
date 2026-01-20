# LearnInk Tech Stack

## Frontend

### Build Tool: Vite
- **Versi**: 7.x
- **Alasan**: Hot Module Replacement (HMR) yang sangat cepat, native ESM support, dan build time yang optimal dibanding Webpack/CRA.

### Framework: React 18+
- **Alasan**: Ekosistem library yang luas, Concurrent Mode untuk performa rendering yang lebih baik, dan Suspense untuk lazy loading components.

### Language: TypeScript (Strict Mode)
- **Alasan**: Type safety mencegah runtime errors, better developer experience dengan IntelliSense, dokumentasi kode yang implisit.

### Styling: Tailwind CSS + Shadcn/UI
- **Tailwind**: Utility-first CSS framework untuk rapid UI development.
- **Shadcn/UI**: Component library yang customizable (bukan dependency, tapi copy-paste), berbasis Radix UI Primitives untuk accessibility.

### State Management
- **TanStack Query (React Query)**: Server state management dengan caching, background refetching, dan optimistic updates.
- **React Context**: Local/UI state untuk theme, auth, dll.

---

## Backend

### Supabase
Supabase adalah "Firebase open-source alternative" yang menyediakan:

| Fitur | Penggunaan di LearnInk |
|-------|------------------------|
| **PostgreSQL Database** | Data storage utama (users, modules, requests) |
| **Authentication** | Email/password + OAuth (Google, GitHub) |
| **Row Level Security (RLS)** | Otorisasi data level baris (penting untuk multi-tenant) |
| **Storage** | Upload avatar, materi PDF/video (coming soon) |
| **Edge Functions** | Serverless functions untuk logic kompleks (Deno runtime) |
| **Realtime** | Subscriptions untuk notifikasi real-time (planned) |

---

## Runtime: Bun
- **Alasan**: Runtime JavaScript yang sangat cepat, built-in bundler dan package manager, native TypeScript support.
- **Penggunaan**: Local development, running scripts.

---

## Automation: n8n
- **Fungsi**: Workflow automation berbasis webhook.
- **Integrasi**: Menerima konten dari sumber eksternal (YouTube summaries, artikel, dll.) dan memasukkannya ke `incoming_contents` untuk di-review admin.
- **Edge Function Terkait**: `ingest-content`

---

## Deployment: Vercel
- **Alasan**: Zero-config deployment untuk React/Next.js, global CDN, preview deployments untuk setiap PR.

---

## Package Manager
- **Primary**: npm (untuk kompatibilitas CI/CD)
- **Alternative**: bun install (untuk local development yang lebih cepat)

---

## Key Dependencies

```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^7.x",
  "@supabase/supabase-js": "^2.x",
  "@tanstack/react-query": "^5.x",
  "tailwindcss": "^3.x",
  "dompurify": "latest",
  "date-fns": "^3.x",
  "lucide-react": "latest"
}
```
