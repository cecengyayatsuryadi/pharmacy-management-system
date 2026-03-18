# CHECKPOINT - Apotek Management System

## Snapshot
- **Tanggal:** 18 Maret 2026
- **Status:** Core Architecture Upgrade (Merged to Master)
- **Kondisi Workspace:** Bersih (Branch: `master`, Hard-Reset dari eksperimen UI).

## Milestone Terbaru (Done)
1. **Navigasi Pro (Dual-Sidebar):**
   - Implementasi sistem Rail + Panel (Offcanvas) yang lebih efisien.
   - Migrasi Logo, Switcher, dan Search ke TopNav.
2. **Advanced Medicine Master Data (Master Produk):**
   - CRUD lengkap dengan Pharmaceutical fields (Nama generik, Komposisi, Indikasi, Produsen, dll).
   - Auto-generate kode obat (MED-XXXXX) dan Status Aktif/Non-aktif.
   - UI Detail View khusus untuk informasi medis mendalam.
   - MedicineStockBadge untuk tracking status stok (Normal, Menipis, Habis).
3. **Advanced Inventory (3 Pilar):**
   - **Pilar 1 (Ledger):** Tracking saldo sebelum dan sesudah mutasi secara absolut.
   - **Pilar 2 (Segmentation):** Pemisahan stok Fisik, Reserved (antrean), dan Quarantine (rusak/expired).
   - **Pilar 3 (Conversion):** Fondasi logic pecah satuan otomatis (Box -> Strip -> Tablet).
4. **Build Stability:**
   - Resolusi total terhadap isu `db.query` relations dan `next-auth` v5 mocking di Unit Tests.
   - Standarisasi database schema berdasarkan domain domain (Core, Master, Inventory, Sales, Procurement).

## Belum Selesai (Next Focus)
- **Fitur Pecah Satuan (Unit Splitting):** UI & Action untuk eksekusi manual konversi satuan di gudang.
- **Procurement Module:** Alur pembelian formal (PO -> Invoice -> Stock In).
- **Export Laporan:** Fungsionalitas download PDF/Excel yang sebenarnya (bukan sekadar tombol UI).

## Catatan Senior Dev
- **Warning:** Database telah di-reset dengan skema domain-based. Jalankan `npm run db:seed --workspace=@workspace/database` untuk sinkronisasi data demo.
- **UI Rule:** Tabel wajib menggunakan `tabular-nums` untuk kolom angka (Harga/Stok).

## Next Session Target
1. Implementasi modul pembelian (Procurement) menggunakan fondasi 3 Pilar Inventory.
2. Tambahkan fitur "Pecah Satuan" (Manual Trigger) di UI Inventori.
3. Penyeragaman visual tabel yang tersisa secara bertahap.
