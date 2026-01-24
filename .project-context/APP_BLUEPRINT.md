# APP BLUEPRINT: LearnInk (The Second Brain)

> **Dokumen Hidup** | Versi: 1.0
> **Status**: Draft Pembahasan

Dokumen ini merangkum visi, misi, arsitektur, dan fitur inti dari aplikasi LearnInk. Tujuannya adalah menyamakan persepsi sebelum kita menulis kode lebih lanjut.

---

## 1. Identitas & Filosofi (The Core)

### Visi: "Personal Learning Journey"
LearnInk bukan sekadar "Platform Kursus online" biasa. Ini adalah **dokumentasi perjalanan belajar Anda**.
*   **Dinamis**: Fokus utama saat ini adalah **AI & Automation**, namun slogan dan konten akan bergeser sesuai tren masa depan dan minat Anda.
*   **Transparan**: Tidak sok tahu. Kita jujur tentang apa yang sudah dikuasai dan apa yang masih dipelajari.

### Filosofi Utama
1.  **Kurasi > Generasi**
    *   *Masalah*: AI Generatif membuat internet banjir sampah informasi (kuantitas naik, kualitas turun).
    *   *Solusi Kita*: LearnInk tidak menjanjikan "Materi Terbanyak", tapi "Materi Terbaik". Kita mengkurasi (memilih) sumber belajar terbaik dari internet, memfilternya, dan menyajikannya ulang dengan konteks pengalaman nyata.
2.  **Belajar dari Kesalahan (Lessons Learned)**
    *   Materi tidak hanya teori "How-To", tapi juga "How-Not-To". Anda membagikan kegagalan dan kesalahan konfigurasi agar user lain tidak perlu mengulanginya.
3.  **Full Free Architecture**
    *   Menggunakan tool Free Tier (Supabase Free, Vercel/VPS murah, n8n self-hosted) untuk membangun sistem canggih tanpa biaya langganan mahal. Semangat ini ditularkan ke user.

---

## 2. Struktur Konten (The Infinite Tech Tree)

Kita membagi materi menjadi dua jalur utama agar fokus tetap terjaga namun jujur terhadap kehidupan nyata.

### Cluster A: The Specialist (Fokus Utama)
*Materi teknis mendalam dimana Anda berbagi kode, konfigurasi, dan best practice.*

1.  **Agnostic Automation (Otomasi Tanpa Batas)**
    *   **Fokus**: Bukan fanatik tool tertentu (n8n/Make/Zapier). Kita pakai tool terbaik untuk masalah yang dihadapi.
    *   **Konten**: Studi kasus nyata (misal: "Cara hemat API Cost", "Menghubungkan Notion ke Web").
2.  **Artificial Intelligence**
    *   Penerapan LLM Lokal, Prompt Engineering, dan Integrasi AI ke workflow sehari-hari.
3.  **Modern Stack Building**
    *   Dokumentasi pembuatan LearnInk itu sendiri (React, Supabase, Bun).

### Cluster B: Life OS (Pendukung)
*Catatan pinggir tentang kehidupan.*
1.  **Finance & Management**: Literasi keuangan dasar.
2.  **Relationship & Productivity**: Cara mengatur waktu kuliah vs ngoding.

---

## 3. Fitur Utama (Core Features)

### A. Silabus Dinamis & Sumber Terintegrasi
*   **Masalah**: Materi belajar tersebar di YouTube, TikTok, Dokumentasi resmi, dan Blog.
*   **Solusi**:
    *   Setiap modul punya bagian "Learning Sources" yang jelas.
    *   **Integrasi Notion**: Jika Anda menyimpan link bagus di Notion (properti URL), sistem bisa otomatis mengambil (fetch) dan menampilkannya di web.
    *   User bisa klik link asli untuk belajar dari sumber aslinya.

### B. Belajar "On-Demand" (Request System)
*   User tidak menemukan apa yang mereka cari? Mereka bisa klik **"Request Material"**.
*   **Workflow Otomasi**: Request masuk -> n8n memproses -> **Notifikasi langsung masuk ke Telegram pribadi Anda**.
*   Sistem ini memastikan Anda tidak melewatkan permintaan user dan bisa merespons dengan cepat (approve/reject).

### C. Smart Code Snippets (Lightweight Playground)
*   **Konteks**: Banyak user memakai device spesifikasi rendah ("Laptop Kentang").
*   **Solusi**:
    *   Hindari Editor Kode berat (seperti StackBlitz full) yang memakan RAM browser.
    *   Gunakan tampilan kode yang bersih, sintaks berwarna (highlighting), dengan tombol **Copy** yang reliabel.
    *   Kode disajikan dalam potongan-potongan kecil yang bisa langsung dicoba plug-and-play.

### D. Sistem Status (Transparansi)
Memberikan label pada setiap modul agar user tahu tingkat kepercayaan materi:
*   🟢 **Mastered (Dikuasai)**: Materi sudah lengkap, teruji, dan saya pakai di production.
*   🟡 **Exploring (Sedang Belajar)**: Catatan aktif, mungkin ada perubahan, saya sedang mempelajari ini.
*   ⚪ **Queue (Antrian)**: Rencana belajar masa depan.

---

## 4. Rencana Teknis & Integrasi

### Tech Stack
*   **Frontend**: React (Vite) + Tailwind + Shadcn/UI (Ringan & Cepat).
*   **Backend**: Supabase (Database, Auth).
*   **Jembatan**: n8n (untuk logika bisnis yang rumit).

### Integrasi Ekosistem & Eksperimen
Membangun web yang "siap masa depan" dengan prinsip **Integrability over Hype**.
*   **Dynamic Tooling**: Kita tidak terpaku pada satu alat selamanya. Jika ada tool baru yang bagus (contoh: GPT Atlas), kita coba.
*   **Syarat Mutlak**: Tool tersebut WAJIB bisa dintegrasikan. Bagus saja tidak cukup, harus bisa ngobrol dengan sistem lain.
*   **The Next Big Thing**: Eksplorasi standar baru seperti **MCP (Model Context Protocol)** agar AI agent bisa lebih leluasa berinteraksi dengan data kita.

---

## Diskusi Selanjutnya
Bagian mana dari dokumen ini yang perlu dikoreksi atau dipertajam lagi?
