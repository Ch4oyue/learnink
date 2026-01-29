# Custom Rules
- Setiap kali selesai memberikan solusi/perbaikan kode, berikan blok perintah git (add, commit, push) yang relevan agar saya bisa langsung menyalinnya.
- Setiap kali selesai memberikan solusi/perbaikan kode, update @CHANGELOG.md dan @README.md.
- **PENTING**: Sebelum mengupdate CHANGELOG/Versi, Jules WAJIB melakukan `git log` atau analisis kode mendalam untuk memastikan semua perubahan teknis (bukan hanya yang ada di chat saat ini) tercatat dengan akurat. Jangan mengandalkan memori sesi chat saja.
- Gunakan kategori: **Improvements**, **Fixes**, dan **Patches** untuk pencatatan yang konsisten di CHANGELOG. 
- Setiap update besar wajib menyinkronkan status di @.project-context agar roadmap tetap akurat.
- Gunakan perintah `bun` untuk build/install di lingkungan Windows demi stabilitas.

# Versioning & Changelog Rules
1. **Timezone Accuracy**: Selalu baca tanggal dengan akurat menggunakan timezone Jakarta (WIB, UTC+7) saat menentukan tanggal rilis.
2. **Single Daily Release**: 1 hari hanya boleh ada 1 versi latest. Jika ada update susulan di hari yang sama, pertimbangkan patch level atau penggabungan changelog (kecuali ada instruksi spesifik lain).
3. **Categories**: Patuhi struktur kategori `Improvements`, `Fixes`, dan `Patches`.
4. **Real-time Accuracy**: Changelog harus mencerminkan update yang benar-benar terjadi secara real-time. Jangan memanipulasi tanggal historis (mundur/maju) yang merusak integritas riwayat versi.
