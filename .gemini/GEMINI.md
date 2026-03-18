# Project Rules - Apotek Management System

> Dokumen ini adalah panduan wajib bagi AI Agent dalam mengelola kode di repositori ini.

## 1. Git Management (Pro-Git Protocol)
- **Branching:** Selalu gunakan feature branch (`feat/...`, `fix/...`) dari `master`. Jangan pernah commit langsung ke `master`.
- **Atomic Commits:** Commit setiap perubahan fungsional kecil. Jangan menunggu tugas selesai semua.
- **Conventional Commits:** Gunakan prefix `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`.
- **Workflow:** Selesaikan setiap fitur dengan Pull Request (PR).

## 2. Arsitektur & Data (Tenant Isolation)
- **Multi-Tenancy:** Setiap query wajib difilter menggunakan `organizationId`. Jangan pernah melakukan operasi data tanpa tenant scope.
- **DB Transactions:** Gunakan transaksi database untuk operasi yang melibatkan stok dan penjualan (POS) untuk menjamin integritas data.
- **Validation:** Semua input dari client (Server Actions) wajib divalidasi menggunakan Zod schema.

## 3. UI/UX Standards
- **Navigasi:** Gunakan sistem Dual-Sidebar (Rail + Panel).
- **Efisiensi:** Prioritaskan navigasi keyboard dan Command Palette (`⌘K`) untuk fitur operasional cepat.
- **Konsistensi:** Patuhi desain sistem shadcn/ui. Gunakan Tooltip pada setiap ikon navigasi di Rail.
- **Header:** Gunakan TopNav untuk Logo, Switcher, dan Search. Simpan Breadcrumb di bawah TopNav untuk orientasi user.

## 4. Engineering Standards
- **Clean Code:** Pisahkan logika bisnis (Server Actions/Lib) dari presentasi (UI Components).
- **Validation:** Selalu jalankan `npm run lint` dan `turbo typecheck` sebelum melakukan commit.
- **Testing:** Tambahkan unit test untuk logika harga, diskon, dan mutasi stok di folder `apps/web/tests` atau sesuai konfigurasi Vitest.

## 5. Domain Knowledge
- Pahami siklus hidup obat: Batch tracking -> Expired alert -> Stock movements.
- Metode akuntansi stok: Utamakan kebenaran data HPP dan saldo stok real-time.

---
*Last Updated: 17 Maret 2026*
