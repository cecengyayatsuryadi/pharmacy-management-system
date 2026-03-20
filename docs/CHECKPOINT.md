# CHECKPOINT - Apotek Management System

## [NEW] Snapshot - 19 Maret 2026 (Sesi 2)
- **Status:** Master Produk UI/UX Alignment & Formulary Module - Completed
- **Kondisi Workspace:** Branch `feat/inventory-formulary-substitution`.
- **Key Achievements:**
  1. **Formularium & Substitusi:** Fitur CRUD penuh, skema DB baru, dan pewarnaan semantik (Fornas/BPJS/RS).
  2. **Master Consistency:** Penyelarasan total seluruh sub-modul (Data Obat, Kategori, Satuan) ke "Gold Standard" (Header, Badge Opacity, Ikon).
  3. **Bug Fixes:** Perbaikan *type-error* pada `seed.ts` dan sinkronisasi data demo.
- **Next Session:** Merge ke master & Barcode Manager (Priority).

---

## Snapshot - 19 Maret 2026 (Sesi 1)
- **Status:** Full UI & Route Alignment - Completed (Local)
- **Kondisi Workspace:** Bersih (Branch: `master`). Seluruh fitur UI, rute, dan perbaikan root telah digabungkan.

## Milestone Terbaru (Done)
1. **Master Data Core Refactoring (Tuntas):**
   - Transformasi penuh modul **Medicines, Units, Conversions, Categories, dan Medicine Groups** ke standar Gold Standard.
   - Implementasi pola UI **Sidebar Dialog (Sheet)** dengan sistem `SheetHeader` -> `Tabs` -> `ScrollArea` -> `SheetFooter`.
   - Adopsi **Server-side Pagination & Search** yang terintegrasi dengan URL (`searchParams`) untuk efisiensi data besar.
   - Peningkatan visual hirarki: Badge netral untuk metadata, indikator warna untuk golongan, dan *debounced search* untuk performa.
   - Validasi build sistem 100% lulus tanpa *type-error*.
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

## 🔴 [CRITICAL FAILURE] SESSION LOGS
1. **Double Session Start Failure:** Sudah dua kali sesi (sesi 1 & 2) dimulai dengan kecerobohan fatal (modifikasi tanpa branch, salah path impor, regresi logika). DILARANG keras memulai aksi tulis sebelum riset tuntas.
2. **Branch Protocol Violation:** DILARANG melakukan modifikasi file sebelum membuat feature branch (`feat/...`). Selalu awali tugas dengan branch baru.
3. **Dependency & Path Verification:** DILARANG menggunakan path impor spekulatif (misal: `@/lib/utils` untuk `cn`). Selalu verifikasi lokasi utility di `packages/ui/src/lib/utils.ts` sebelum implementasi untuk menghindari build failure.
4. **Logic Regression (Side Effects):** DILARANG mengubah signature fungsi atau schema tanpa memetakan dampak ke seluruh modul. Modifikasi `updateMedicineAction` yang tidak hati-hati berisiko merusak data (reset field) jika UI lama belum disesuaikan.
5. **Validation Failure:** Wajib menjalankan `npm run build` dan memastikannya LULUS 100% sebelum menyatakan tugas selesai. Jangan abaikan error build "Module not found".
6. **Architectural Deviation:** Pastikan setiap modul baru (seperti Formularium) mengikuti struktur rute hierarkis yang sudah ada, bukan sekadar menempel pada modul lain tanpa perencanaan matang.

## 🛡️ MANDATORY START-OF-SESSION PROTOCOL
1. **Research First:** Lakukan `glob` dan `read_file` pada file-file kunci (Schema, Sidebar, Actions, UI Component) SEBELUM merencanakan aksi.
2. **Verify Context:** Pastikan pemahaman terhadap "Gold Standard" (pola Medicine) sudah 100% akurat.
3. **Strict Branching:** Perintah teknis pertama WAJIB: `git checkout -b feat/[nama-fitur]`.
4. **Zero Speculation:** Jika path impor atau signature fungsi tidak yakin, GUNAKAN `grep_search`. DILARANG menebak.
5. **Atomic Validation:** Gunakan `npm run build` atau `turbo typecheck` secara berkala, jangan menunggu di akhir tugas.

## Belum Selesai (Next Focus)
1. **Barcode Manager (Priority):** Pemulihan fungsionalitas manajemen & pencetakan barcode dari histori commit (`6268c8d`).
2. **Procurement Module:** Alur formal PO -> Invoice -> Stock In.

## Catatan Senior Dev
- **Design Pattern:** Pola `SheetHeader` -> `Tabs` -> `ScrollArea` -> `SheetFooter` resmi menjadi standar emas untuk form entitas di proyek ini.
- **Color Logic:** Gunakan `emerald-400` (dark) untuk data positif yang ingin ditonjolkan agar tidak redup.

## Next Session Target
1. Mulai sesi baru untuk mengosongkan *context window*.
2. Fokus pada Modul Satuan & Konversi.
3. Jalankan `npm run build` untuk validasi akhir seluruh perubahan rute.
