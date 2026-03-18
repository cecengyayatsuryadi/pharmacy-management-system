# CHECKPOINT - Apotek Management System

## Snapshot
- **Tanggal:** 18 Maret 2026
- **Status:** Core Architecture Upgrade (Merged to Master)
- **Kondisi Workspace:** Bersih (Branch: `master`, Hard-Reset dari eksperimen UI).

## Milestone Terbaru (Done)
1. **Navigasi Pro (Dual-Sidebar):**
   - Implementasi sistem Rail + Panel (Offcanvas) yang lebih efisien.
   - Migrasi Logo, Switcher, dan Search ke TopNav (h-14).
   - Breadcrumb dinamis di bawah TopNav (h-10).
2. **Advanced Inventory (3 Pilar):**
   - **Pilar 1 (Ledger):** Tracking saldo sebelum dan sesudah mutasi secara absolut.
   - **Pilar 2 (Segmentation):** Pemisahan stok Fisik, Reserved (antrean), dan Quarantine (rusak/expired).
   - **Pilar 3 (Conversion):** Fondasi logic pecah satuan otomatis (Box -> Strip -> Tablet).
3. **Build Stability:**
   - Resolusi type mismatches pada modul Units, Warehouse, dan Medicines.
   - Standarisasi Server Action return format `{ data, metadata }`.

## Sudah Stabil
- Auth & Multi-tenancy filter `organizationId` di level query.
- Master Data (Obat, Kategori, Supplier, Gudang, Satuan).
- Inventori Dasar & Lanjutan (Historical Ledger).
- POS dasar (transaksi tunai).

## Belum Selesai (Next Focus)
- **UI Standardization:** Menyelaraskan seluruh tabel dan control bar dengan `docs/DESIGN_SYSTEM.md` (Tertunda karena isu token/performa agent).
- **Export Laporan:** PDF/Excel untuk pelaporan keuangan.
- **Procurement Module:** Pembelian stok formal ke supplier.

## Catatan Senior Dev
- **Warning:** Jangan melakukan perubahan UI massal dalam satu sesi jika context window sudah penuh. Prioritaskan atomic changes.
- **UI Rule:** Tabel wajib menggunakan `TableInfoCell` untuk identitas dan `tabular-nums` untuk angka.

## Next Session Target
1. Lanjutkan penyeragaman visual tabel (secara bertahap/atomic).
2. Implementasi modul pembelian (Procurement) menggunakan fondasi 3 Pilar Inventory.
3. Tambahkan fitur "Pecah Satuan" (Manual Trigger) di UI Inventori.
