# Migration TODO from apotek-sandbox

Tujuan: pindahkan perubahan yang sudah stabil dari `apotek-sandbox` ke repo utama `apotek`.

## Sudah jadi di sandbox
1. Halaman Supplier + sidebar menu Supplier.
2. Backend CRUD Supplier (`apps/web/lib/actions/supplier.ts`).
3. Schema DB:
   - tabel `suppliers`
   - `stock_movements.supplier_id` (nullable)
   - field supplier: `phone`, `contact_person`, `lead_time_days`, `is_active`
4. Stok Masuk terhubung Supplier:
   - form pilih supplier (wajib untuk type `in`)
   - save `supplier_id` ke `stock_movements`
   - tampilkan supplier di riwayat stok masuk
   - search stok masuk bisa cari nama supplier
5. Package manager fix di sandbox:
   - `pnpm-workspace.yaml`
   - root `packageManager`
   - dependency internal pakai `workspace:*`

## Next (saat migrasi ke apotek)
1. Pilih file final yang mau dipindah (jangan copy semua file sandbox).
2. Apply schema migration ke DB utama setelah review.
3. Uji flow:
   - `/dashboard/suppliers`
   - `/dashboard/inventory/in` (create + history)
4. Lanjut modul `Procurement` (Pembelian, Retur Supplier, Rekomendasi).

## Session Progress (2026-03-17)
1. Dialog dipisah:
   - `Pengaturan` via sidebar.
   - `Profil Akun` via dropdown `NavUser`.
2. File dialog terpisah:
   - `apps/web/components/app-settings-dialog.tsx`
   - `apps/web/components/settings-dialog.tsx`
3. UI dialog dirapikan:
   - sidebar-dialog layout aktif
   - separator vertikal full-height
   - header sidebar kiri ditambahkan
   - tombol `Tutup` bawah dihapus (pakai `X`)
4. Dashboard dirapikan:
   - spacing header tabel kritis/expired dipendekkan
   - tabel dibuat full width
   - wording dashboard diperbarui
5. Navigasi sidebar diperbarui:
   - Data Master digabung ke submenu Inventori.
6. PR dibuat:
   - https://github.com/cecengyayatsuryadi/pharmacy-management-system/pull/19
