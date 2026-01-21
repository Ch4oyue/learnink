# Analisis Alur Aplikasi dan Fitur Inti Repositori LearnInk

**Oleh:** Manus AI
**Tanggal:** 20 Januari 2026

## Pendahuluan

Dokumen ini menyajikan analisis komprehensif mengenai alur aplikasi (App Flow) dan fitur-fitur inti (Core Features) dari sistem LearnInk, berdasarkan peninjauan struktur repositori. Sesuai permintaan, analisis ini akan berfokus pada **sistem dan alur kerja** tanpa membahas detail implementasi teknis (seperti kerangka kerja atau kode spesifik). Tujuannya adalah memberikan pemahaman yang jelas tentang bagaimana sistem ini beroperasi dari perspektif pengguna dan manajemen konten, serta memberikan saran strategis untuk pengembangannya.

LearnInk dirancang sebagai Sistem Manajemen Pembelajaran (LMS) modern yang menekankan pengalaman interaktif dan personalisasi.

---

## 1. Alur Aplikasi (App Flow) Utama

Sistem LearnInk memiliki tiga alur utama yang mendefinisikan interaksi pengguna dengan platform: Permintaan Materi, Pembelajaran Modul, dan Penilaian (Kuis).

### 1.1. Alur Permintaan Materi (Content Request Flow)

Alur ini memungkinkan pengguna (Siswa) untuk secara aktif meminta materi pembelajaran yang belum tersedia, yang kemudian diproses oleh tim manajemen (Tutor/Admin) dengan bantuan otomatisasi AI.

| Langkah | Aktor | Deskripsi Sistem | Status Request |
| :--- | :--- | :--- | :--- |
| **1. Pengajuan Request** | Siswa | Pengguna mengisi formulir di Dashboard untuk mengajukan topik dan deskripsi materi yang diinginkan, serta memilih kategori. | `pending` |
| **2. Peninjauan Request** | Tutor/Admin | Request masuk ke daftar antrian. Tutor/Admin dapat melihat, mencari, dan memfilter request berdasarkan status dan prioritas. | `pending` |
| **3. Proses Generasi AI** | Tutor/Admin & Sistem AI | Tutor/Admin memilih request `pending` dan memicu fungsi **Generate Modul**. Sistem secara otomatis mengubah status request menjadi `reviewing`. | `reviewing` |
| **4. Pembuatan Konten** | Sistem AI | Fungsi *cloud* (seperti `generate-module` dan `generate-quiz`) dipanggil untuk membuat draf modul dan kuis berdasarkan topik request. | `reviewing` |
| **5. Finalisasi & Publikasi** | Tutor/Admin | Tutor/Admin meninjau draf modul yang dihasilkan AI, melakukan koreksi, dan mempublikasikannya ke katalog modul. Sistem dapat secara otomatis mengubah status request menjadi `completed`. | `completed` |
| **6. Notifikasi** | Sistem | Siswa yang mengajukan request menerima notifikasi bahwa materi telah tersedia. | `completed` |

### 1.2. Alur Pembelajaran Modul (Module Learning Flow)

Ini adalah alur inti di mana pengguna mengonsumsi konten pembelajaran. Sistem ini menggunakan tata letak "Hybrid View" 4-Panel yang sangat terstruktur untuk memaksimalkan fokus dan interaksi.

| Komponen Alur | Deskripsi Sistem | Interaksi Pengguna |
| :--- | :--- | :--- |
| **Akses Modul** | Modul dipecah menjadi seksi-seksi berdasarkan *heading* Markdown. Sistem memuat konten seksi pertama secara *default*. | Pengguna memilih modul dari katalog. |
| **Navigasi Seksional** | Terdapat *Table of Contents* (TOC) yang dapat disembunyikan untuk navigasi antar-seksi. Progres pengguna dilacak berdasarkan seksi yang telah diakses. | Pengguna mengklik seksi di TOC atau menggunakan tombol "Sebelumnya/Selanjutnya". |
| **Pelacakan Progres** | Setiap kali pengguna berpindah ke seksi baru, sistem secara otomatis menghitung dan menyimpan persentase progres (`progress_percent`) untuk modul tersebut. | Progres disimpan secara pasif di latar belakang. |
| **Interaksi Konten** | Konten disajikan dalam blok-blok bacaan yang interaktif. Fitur *In-Browser Coding* (Python) terintegrasi langsung di dalam konten. | Pengguna dapat menyorot teks dan menambahkannya ke Catatan, atau menjalankan kode Python langsung di halaman. |
| **Pencatatan (Notes)** | Panel Catatan terpisah dapat dibuka/ditutup. Catatan dapat dibuat secara manual atau otomatis dari teks yang disorot di konten. | Pengguna membuat, melihat, dan menghapus catatan pribadi mereka. |

### 1.3. Alur Penilaian (Assessment Flow)

Alur ini mengelola kuis dan penilaian untuk menguji pemahaman pengguna.

| Langkah | Deskripsi Sistem | Hasil |
| :--- | :--- | :--- |
| **1. Mulai Kuis** | Sistem memuat kuis yang terkait dengan modul, termasuk daftar pertanyaan, jenis pertanyaan (Pilihan Ganda, Benar/Salah, Isian), dan batas waktu (`time_limit_minutes`). | Kuis dimulai, dan *timer* diaktifkan. |
| **2. Pengerjaan Kuis** | Pengguna menavigasi antar-soal. Sistem melacak jawaban yang telah diisi dan menampilkan peringatan untuk soal yang belum dijawab. | Jawaban pengguna disimpan sementara. |
| **3. Validasi Jawaban** | Setelah waktu habis atau pengguna menekan "Selesai", sistem memanggil fungsi *cloud* (`validate-quiz-answers`) untuk memproses jawaban. | Sistem menghitung skor, persentase, dan menentukan status kelulusan berdasarkan `passing_score`. |
| **4. Review Hasil** | Hasil kuis ditampilkan segera, termasuk skor, status kelulusan, dan *review* per soal. | Pengguna dapat melihat jawaban yang benar, jawaban mereka, dan penjelasan untuk setiap soal. |

---

## 2. Fitur Inti (Core Features) Sistem

Fitur-fitur inti LearnInk menunjukkan fokus pada otomatisasi, interaktivitas, dan pengalaman pengguna yang premium.

| Kategori Fitur | Fitur Inti | Deskripsi Sistem (Non-Teknis) |
| :--- | :--- | :--- |
| **Otomatisasi Konten Cerdas** | **AI-Powered Content Generation** | Sistem menggunakan layanan *cloud* (Supabase Functions) untuk mengotomatisasi pembuatan draf modul, kuis, dan ringkasan request materi, mempercepat siklus produksi konten. |
| | **Content Ingestion** | Terdapat fungsi `ingest-content` yang mengindikasikan kemampuan sistem untuk memproses dan mengubah sumber eksternal (misalnya, dokumen, URL) menjadi konten modul yang terstruktur. |
| **Pembelajaran Interaktif** | **In-Browser Coding** | Integrasi lingkungan eksekusi kode Python (Pyodide) memungkinkan pengguna untuk mempraktikkan konsep pemrograman langsung di dalam modul tanpa perlu instalasi perangkat lunak. |
| | **Hybrid Learning Layout** | Antarmuka pembelajaran menggunakan tata letak 4-panel yang dapat disesuaikan (TOC, Konten, Catatan) untuk mendukung berbagai gaya belajar dan meningkatkan fokus. |
| | **Dynamic Notes & Highlights** | Pengguna dapat membuat catatan pribadi yang terintegrasi dengan modul, termasuk kemampuan untuk menyimpan potongan teks yang disorot dari konten. |
| **Manajemen Pengguna** | **Role-Based Access Control (RBAC)** | Sistem membedakan akses dan fungsionalitas berdasarkan peran pengguna (Siswa, Tutor, Admin), memastikan setiap pengguna hanya melihat fitur yang relevan (misalnya, Tutor/Admin memiliki akses ke manajemen request). |
| | **Progress Tracking** | Sistem secara otomatis melacak kemajuan belajar (persentase modul selesai) dan riwayat kuis pengguna. |

---

## 3. Saran dan Rekomendasi Pengembangan

Berdasarkan analisis alur dan fitur, berikut adalah beberapa saran strategis untuk meningkatkan sistem LearnInk dari perspektif alur kerja dan pengalaman pengguna:

| Area | Saran Strategis | Justifikasi Alur Sistem |
| :--- | :--- | :--- |
| **Alur Request Materi** | **Implementasi Prioritas Otomatis** | Saat ini, prioritas request (`high`, `medium`) tampaknya diatur secara manual. Gunakan fungsi `summarize-request` (yang sudah ada) untuk menganalisis urgensi dan kompleksitas request, lalu tetapkan prioritas awal secara otomatis. Ini akan mengoptimalkan alokasi sumber daya Tutor/Admin. |
| **Interaksi Konten** | **Fitur "Clone Section" yang Fungsional** | Komponen `HybridContentRenderer` memiliki tombol "Clone Entire Section" yang saat ini tidak fungsional. Fitur ini harus diimplementasikan untuk memungkinkan pengguna menyimpan seksi modul ke dalam "Koleksi Pribadi" atau "Modul Ringkasan" mereka sendiri. |
| **Penilaian (Kuis)** | **Integrasi Umpan Balik Adaptif** | Setelah kuis selesai, gunakan hasil *review* per soal untuk menyarankan seksi modul yang perlu diulang atau materi tambahan yang relevan. Ini akan menutup lingkaran pembelajaran dan membuat alur penilaian menjadi adaptif. |
| **Manajemen Konten** | **Dashboard Kualitas Konten** | Buat dashboard untuk Admin/Tutor yang melacak metrik kualitas konten yang dihasilkan AI, seperti tingkat akurasi kuis yang dihasilkan, atau jumlah revisi yang diperlukan sebelum publikasi. Ini penting untuk mengelola dan meningkatkan kualitas output AI. |
| **Pengalaman Pengguna** | **Personalisasi Alur Belajar** | Kembangkan fitur yang menggunakan data `progress` dan `quiz` untuk merekomendasikan modul berikutnya atau jalur belajar yang disesuaikan, bukan hanya daftar modul statis. |

Secara keseluruhan, LearnInk memiliki fondasi sistem yang kuat, terutama dalam mengintegrasikan otomatisasi AI ke dalam siklus hidup konten (dari permintaan hingga publikasi) dan menyediakan lingkungan pembelajaran yang sangat interaktif. Fokus pengembangan selanjutnya harus pada penutupan lingkaran umpan balik (misalnya, dari kuis kembali ke konten) dan personalisasi alur pengguna.
