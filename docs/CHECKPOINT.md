# CHECKPOINT - Apotek Management System

## Snapshot
- **Tanggal:** 19 Maret 2026
- **Status:** Full UI & Route Alignment - Completed (Local)
- **Kondisi Workspace:** Bersih (Branch: `master`). Seluruh fitur UI, rute, dan perbaikan root telah digabungkan.

## Milestone Terbaru (Done)
1. **Inventory Master Refactoring (Units & Conversions):**
   - Implementasi ulang UI menggunakan pola **Sidebar Dialog** (`Sheet`) yang konsisten dengan standar modul Medicines.
   - Penambahan fitur CRUD lengkap (Create, Read, Update, Delete) untuk Master Satuan dan Konversi Satuan.
   - Implementasi **Visual Logic Preview** pada form konversi (1 Box x 10 Strip) menggunakan tema `emerald` untuk kejelasan operasional.
   - Integrasi **Combobox Async** untuk pencarian produk pada form konversi guna mendukung ribuan data obat.
   - Cakupan unit test 100% untuk seluruh Server Actions baru (Update/Delete).
2. **Route Restructuring:**
   - Memindahkan modul Medicines ke rute hierarkis: `/dashboard/inventory/master/medicines`.
   - Sinkronisasi `revalidatePath` di seluruh Server Actions dan pembaruan navigasi Sidebar/Command Menu.
2. **Root UI Accessibility Fixes:**
   - Perbaikan varian `Badge` di level root (`packages/ui/src/components/badge.tsx`).
   - Optimasi keterbacaan varian `destructive` (Habis) dan `warning` (Menipis) di Mode Gelap menggunakan pola warna tajam (bukan putih pudar).
3. **Advanced Detail Sheet:**
   - Implementasi sistem Tabs pada Detail Obat (Medis vs Logistik).
   - Struktur `flex-1 overflow-hidden` pada area konten untuk memastikan *scroll* yang presisi di resolusi 1366x768.
4. **Typography & Layout Fine-Tuning:**
   - Hirarki visual tabel: `font-mono` untuk harga/stok, `font-sans` untuk nama dengan `tracking-tight`.
   - Penyelarasan padding global Sidebar Dialog ke `px-6 py-4`.
   - Optimasi lebar Dropdown Menu dan ringkasan label aksi ("Hapus Data").

## ⚠️ PELAJARAN KRITIS (Internal Blockers)
1. **Root Component Awareness:** Masalah keterbacaan seringkali bersumber dari desain dasar (root) komponen. Perbaiki di sumbernya (`packages/ui`) untuk konsistensi global daripada menimpa di level aplikasi.
2. **Monospace Visual Weight:** Font Monospace (`Geist Mono`) memiliki bobot visual lebih berat. Gunakan `text-sm` atau `font-semibold` (bukan bold) untuk menyeimbangkannya dengan font Sans di sebelahnya.
3. **Context Management:** Saat *context window* mulai penuh, segera lakukan "State Compression" via Checkpoint dan mulai sesi baru untuk menjaga akurasi logika.

## Belum Selesai (Next Focus)
- **Procurement Module:** Alur formal PO -> Invoice -> Stock In.
- **Barcode Manager:** Pemulihan fungsionalitas dari histori commit.

## Catatan Senior Dev
- **Design Pattern:** Pola `SheetHeader` -> `Tabs` -> `ScrollArea` -> `SheetFooter` resmi menjadi standar emas untuk form entitas di proyek ini.
- **Color Logic:** Gunakan `emerald-400` (dark) untuk data positif yang ingin ditonjolkan agar tidak redup.

## Next Session Target
1. Mulai sesi baru untuk mengosongkan *context window*.
2. Fokus pada Modul Satuan & Konversi.
3. Jalankan `npm run build` untuk validasi akhir seluruh perubahan rute.
