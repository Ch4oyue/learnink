# User Preferences & Decisions Log

Dokumen ini berisi kumpulan preferensi pengguna, keputusan desain, dan aturan bisnis yang telah disepakati dari interaksi sebelumnya. Gunakan ini sebagai referensi utama dalam pengembangan fitur.

## 1. UI/UX Design System

### Tema: "Glass Liquid"
*   **Style:** Terinspirasi dari VisionOS/iOS.
*   **Karakteristik:**
    *   Transparansi (Glassmorphism).
    *   Border tipis dan halus.
    *   Corner Radius besar: `rounded-[24px]` atau `rounded-[32px]` untuk container utama.
    *   Interaksi: Button/Input menggunakan `rounded-xl` (squircle).
    *   Animasi: `active:scale-95` pada elemen interaktif (tombol).

### Mobile First Experience
*   **Navigasi:**
    *   **Desktop:** Sidebar floating (Glass).
    *   **Mobile:** Sidebar DISEMBUYIKAN (`hidden`). Gunakan **MobileBottomNav** + **Sheet** (Drawer) untuk menu lengkap.
*   **Content Layout:**
    *   Tabel data harus di-wrap `overflow-x-auto` agar tidak merusak layout mobile.
    *   Hindari horizontal scrolling pada container utama (`SidebarInset`).
*   **Address Bar:** Gunakan `min-height: 100dvh` untuk mencegah konten tertutup address bar browser mobile.

### Future Improvement (Module Learn Page)
*   User merasa halaman module learning saat ini kurang optimal.
*   **Target:** Layout yang lebih **dinamis**, **customizable**, dan **responsif**.

## 2. Technical Preferences

### Performance Optimization ("HP Kentang" Priority)
*   **Target Device:** Device low-end (Android entry-level).
*   **Strategi:**
    *   Minimalkan main thread work.
    *   **No Layout Thrashing:** Hindari membaca properti layout (offsetHeight, scrollTop) berulang saat scroll event. Gunakan `ResizeObserver` + `requestAnimationFrame`.
    *   **Virtualization:** Gunakan virtual scroll untuk list panjang jika perlu.

### Data & Backend
*   **Aggregation:** Gunakan **RPC (Server-side)** untuk hitungan statistik berat (progress, streaks), jangan hitung di client.
*   **Python Execution:** WAJIB menggunakan **Web Worker** (Pyodide) agar UI tidak freeze. Load Pyodide secara dinamis (`import()`).
*   **Security:**
    *   Fungsi DB wajib set `search_path`.
    *   RLS Public Content: Pisahkan policy `SELECT` (public) dengan `INSERT/UPDATE` (admin only).

### Development Workflow
*   **Bahasa:** Dokumentasi dan Percakapan dalam **Bahasa Indonesia**.
*   **Release:** Proses rilis dan bump version harus **OTOMATIS** (Automated CI/CD).
*   **Documentation:** Update file context secara berkala.

## 3. Business Logic & User Flow

### Course & Learning Flow
1.  **Enrollment (Pendaftaran):**
    *   User bebas mengambil (enroll) Track/Course mana saja secara bersamaan.
    *   Tidak ada urutan wajib antar-course (Random Access level Course).
2.  **Learning Process (Inside Course):**
    *   **Sequential Modules:** Pengerjaan modul di dalam satu course harus **BERURUTAN** (Module 1 -> Module 2). User tidak bisa lompat ke Module 3 sebelum Module 2 selesai.
3.  **Completion Logic:**
    *   **Kuis Wajib:** Kuis selalu ada (mandatory) sebelum modul/course dianggap selesai ("Complete").
    *   Tombol "Complete" hanya aktif setelah kuis lulus.

## 4. Known Issues & Legacy
*   **Bug `user_tracks`:** Isu sinkronisasi schema tabel `user_tracks` yang menyebabkan error saat "Ambil Kursus". Perlu investigasi tabel pengganti (refactor schema).
