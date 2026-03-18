# CHECKPOINT - Apotek Management System

## Snapshot
- **Tanggal:** 18 Maret 2026
- **Status:** Workspace Reset - Recovery Mode (Post Infrastructure Blockers)
- **Kondisi Workspace:** Bersih (Branch: `master`). Branch fitur `feat/unit-conversion-module` dan `feat/barcode-manager` telah dihapus untuk reset strategi.

## Milestone Terbaru (Done)
1. **Navigasi Pro (Dual-Sidebar):** Rail + Panel (Offcanvas) & TopNav migration.
2. **Advanced Medicine Master Data:** Pharmaceutical fields, auto-code, status tracking.
3. **Master Kategori & Golongan:** CRUD, dynamic badges, deletion protection.
4. **Advanced Inventory (3 Pilar):** Ledger (absolute balance), Segmentation (Reserved/Quarantine), Conversion Foundation.
5. **Build Stability:** Standardized schema, resolved `db.query` relations in master branch.

## ⚠️ PELAJARAN KRITIS (Internal Blockers)
*Jangan ulangi kesalahan ini di sesi berikutnya:*

1. **Test File Isolation:** Playwright (E2E) dan Vitest (Unit) harus dipisahkan secara ketat. Jangan letakkan file `.test.ts/tsx` di folder yang dipindai Playwright (`apps/web/tests`) karena akan memicu error resolusi modul server-side (`next/server`).
   - *Solusi:* Gunakan `testMatch` di `playwright.config.ts` untuk hanya memproses `**/*.spec.ts`.
2. **ESM Module Resolution:** `next-auth` v5 sering gagal me-resolve `next/server` di lingkungan pengujian Node.js murni (Vitest/Playwright collection phase).
   - *Penyebab:* Node.js ESM tidak mendukung directory import tanpa ekstensi secara default.
3. **Database & Mocking:** Proyek ini menggunakan **Postgres Docker Lokal**. Mocking layer Drizzle di Vitest seringkali terlalu dangkal dan menyebabkan kegagalan saat integrasi.
   - *Strategi:* Utamakan ketersediaan data via `npm run db:seed` daripada mock object yang tidak lengkap.
4. **Next.js Dev Lock:** Jika server gagal start dengan error "Unable to acquire lock", hapus manual file `apps/web/.next/dev/lock`.

## Belum Selesai (Next Focus)
- **Modul Satuan & Konversi:** Perlu implementasi ulang (UI & Logic) dengan strategi tes yang lebih terisolasi.
- **Modul Barcode Manager:** Kode terakhir ada di commit `6268c8d`. Perlu dipulihkan secara selektif dan ditambahkan unit test sebelum merge.
- **Procurement Module:** Alur formal PO -> Invoice -> Stock In.

## Catatan Senior Dev
- **Warning:** Database wajib di-seed (`npm run db:seed --workspace=@workspace/database`) sebelum menjalankan tes apa pun yang membutuhkan login.
- **UI Rule:** Tabel wajib menggunakan `tabular-nums` untuk kolom angka (Harga/Stok).
- **Pro-Git:** Jangan biarkan file untracked menumpuk di folder `tests/`.

## Next Session Target
1. Inisiasi ulang branch `feat/unit-conversion-module` dengan struktur folder tes yang benar.
2. Pastikan `npm run dev` berjalan lancar tanpa konflik lock file.
3. Tambahkan unit test untuk setiap Server Action baru secara paralel dengan pengembangan UI.
