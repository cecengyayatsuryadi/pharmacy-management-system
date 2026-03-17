# Project Roadmap - Apotek Management System (Multi-Tenant Ready)

## Status Saat Ini
- **Current Phase:** Phase 5 (In Progress)
- **Stack:** Turborepo, Next.js 16, React 19, Tailwind v4, shadcn/ui, Drizzle ORM, PostgreSQL.
- **Last Updated:** 16 Maret 2026

## Phase 1 - Fondasi Dasar [COMPLETE]
- [x] Setup monorepo dan struktur workspace.
- [x] Auth infrastructure (Auth.js / NextAuth v5).
- [x] Skema inti tenant: `organizations`, `users`.

## Phase 2 - Master Data Obat [COMPLETE]
- [x] CRUD kategori dan obat (search/filter/pagination).
- [x] Guardrail paket gratis (limit item obat).
- [x] Widget dashboard stok kritis dan distribusi kategori.

## Phase 3-4 - Inventori & POS [COMPLETE]
- [x] Mutasi stok: in/out/adjustment.
- [x] POS flow dan pencetakan struk.
- [x] Integrasi pengurangan stok dari transaksi penjualan.
- [x] Kolom finansial/stok ke tipe `numeric`.

## Phase 5 - Laporan & Analitik [IN PROGRESS]
- [x] Laporan penjualan dengan date-range filter.
- [x] Analisis laba: revenue, COGS, gross profit, margin.
- [~] Expiry warning tersedia di dashboard, tetapi modul alert otomatis dedicated belum selesai.
- [ ] Export laporan PDF/Excel (fitur Pro).

## Phase 6 - Procurement Foundation [PLANNED]
- [ ] Supplier master data (`Data Master`).
- [ ] Enrich `Stok Masuk` dengan konteks sumber (`sourceType`, `supplierId`, `referenceNumber`).
- [ ] Modul pembelian dasar.
- [ ] Retur ke supplier.

## Phase 7 - Procurement Intelligence [PLANNED]
- [ ] Rules-based reorder recommendation.
- [ ] Penguatan kualitas data procurement (price history, lead time aktual, supplier performance).
- [ ] ML procurement intelligence (forecasting + reorder recommendation + supplier ranking).

## Prioritas Eksekusi Berikutnya
1. Selesaikan export laporan (Phase 5).
2. Implement backend `Supplier` sebagai fondasi procurement.
3. Integrasikan supplier ke alur stok masuk sebelum modul pembelian penuh.
