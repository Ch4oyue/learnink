# Strategi Pemisahan Environment (Prod vs Dev)

Dokumen ini menjelaskan cara mengelola pemisahan database antara lingkungan Development dan Production di LearnInk.

## 1. Konfigurasi Supabase
Sangat disarankan untuk memiliki **dua project Supabase yang berbeda**:
- **LearnInk-Dev**: Untuk pengujian fitur baru, migrasi eksperimental, dan data dummy.
- **LearnInk-Prod**: Untuk pengguna asli dan data produksi.

## 2. Penggunaan File Environment (.env)
Vite secara otomatis memuat variabel lingkungan berdasarkan mode build.

### Development (.env.development)
Buat file `.env.development` di root direktori:
```env
VITE_SUPABASE_URL=https://dev-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_dev_anon_key
```

### Production (.env.production)
Buat file `.env.production` di root direktori (atau atur di Vercel/Hosting provider):
```env
VITE_SUPABASE_URL=https://prod-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_prod_anon_key
```

## 3. Menjalankan Aplikasi
- **Mode Dev**: `bun run dev` (akan otomatis menggunakan `.env.development`).
- **Mode Build Prod**: `bun run build` (akan otomatis menggunakan `.env.production`).

## 4. Sinkronisasi Skema
Gunakan Supabase CLI untuk mengelola migrasi agar kedua lingkungan tetap sinkron:
1. Lakukan perubahan di lokal/dev.
2. Buat file migrasi: `supabase migration new your_change_name`.
3. Terapkan ke dev: `supabase db push --linked`.
4. Setelah divalidasi, terapkan ke prod.

## 5. Pengujian di VM (Self-Hosted Logic)
Jika ingin menjalankan logika (seperti API Key Generator) di luar Supabase (misal di VM):
1. Pastikan Node.js/Bun/Python terinstall di VM.
2. Gunakan tool di `scripts/` atau `self_created_tools/`.
3. Gunakan Service Role Key hanya di sisi server (VM) dan jangan pernah memaparkannya di frontend (VITE_*).
