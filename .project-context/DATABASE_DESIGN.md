# DATABASE DESIGN & SCHEMA

> **Status**: Draft Proposal
> **Goal**: Mendukung fitur "Dynamic Syllabus", "Request System", dan "Second Brain".

## 1. Existing Core Tables (Analisis)
*   `profiles`: Data user (role, avatar).
*   `learning_sources`: Sumber belajar kurasi (Logo, URL).
*   `integrations`: API Keys & Webhooks.
*   `incoming_contents`: Staging area n8n.
*   `modules`: Materi pembelajaran (Perlu modifikasi).

## 2. Proposed Changes (Perubahan Database)

### A. Hirarki Baru: Tracks & Clusters
Agar dashboard bisa memisahkan "Core Skills" (AI/Dev) dan "Life OS" (Finance), kita butuh tabel pengelompokan.

**New Table: `tracks`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `name` | TEXT | e.g., "The Specialist", "Life OS" |
| `slug` | TEXT | URL friendly, e.g., "specialist" |
| `description` | TEXT | Penjelasan singkat |
| `icon` | TEXT | Icon name (Lucide) |
| `display_order` | INT | Urutan tampilan |

### B. Modifikasi Modules
Modul perlu status pembelajaran (Mastered/Exploring) dan link ke Track.

**Alter Table: `modules`**
*   Add `track_id`: UUID (FK to `tracks.id`).
*   Add `status`: ENUM (`'mastered'`, `'exploring'`, `'queue'`).
    *   *Note*: Ini adalah status materi DARI SISI USER (Anda sebagai pemilik).
    *   *Default*: `'queue'`.
*   Add `source_url`: TEXT (Link ke Notion/Sumber Asli jika ada).

### C. Request System (On-Demand)
Menampung permintaan materi dari Pengunjung.

**New Table: `material_requests`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `user_id` | UUID | FK to `users` (Siapa yang minta?) |
| `topic` | TEXT | Judul materi yang diminta |
| `description` | TEXT | Rincian kebutuhan |
| `status` | ENUM | `'pending'`, `'approved'`, `'rejected'` |
| `n8n_processed` | BOOL | Apakah sudah dikirim ke Telegram via n8n? |
| `created_at` | TIMESTAMPTZ | Waktu request |

### D. Second Brain (Notes)
Menyimpan catatan user per modul.

**New Table: `user_notes`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `user_id` | UUID | FK to `users` |
| `module_id` | UUID | FK to `modules` |
| `content` | TEXT | Isi catatan (Markdown enabled) |
| `is_public` | BOOL | Opsional: Jika user ingin share catatannya |
| `last_updated` | TIMESTAMPTZ | Waktu update terakhir |

## 3. Relasi & Flow Data

1.  **Dashboard Flow**:
    *   Fetch `tracks` ordered by `display_order`.
    *   For each track, fetch `modules` where `status` != 'hidden'.
2.  **Request Flow**:
    *   Insert ke `material_requests`.
    *   Trigger (Supabase Database Webhook) -> n8n Webhook -> Telegram Bot.
3.  **Learning Flow**:
    *   User buka `ModuleLearn.tsx`.
    *   Fetch `user_notes` where `user_id` = current_user AND `module_id` = current_module.

## 4. Next Steps (Action Plan)
1.  Buat file migrasi SQL baru: `supabase/migrations/YYYYMMDD_refactor_schema.sql`.
2.  Jalankan migrasi lokal & push ke remote.
3.  Update TypeScript types (Database Definitions).
