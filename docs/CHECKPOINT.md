# CHECKPOINT - Apotek Management System

## [NEW] Snapshot - 20 Maret 2026 (Sesi 3 - Master Data Finalization)
- **Status:** Master Produk UI/UX Alignment & Barcode Manager - Completed
- **Kondisi Workspace:** Bersih (Branch: `master`). Seluruh fitur telah di-merge.
- **Key Achievements:**
  1. **Barcode Manager (CRUD):** Implementasi form pengelolaan SKU obat, fitur cetak label massal sederhana, dan validasi *Server Actions* React 19 (`useActionState`).
  2. **Type Safety & Build:** Memperbaiki semua *TypeScript Type Mismatch* antara relasi Drizzle (Database) dan kebutuhan tipe komponen *Client* (UI). Aplikasi berhasil melalui *build* 100%.
  3. **Global "Gold Standard" UI:** Menyelaraskan seluruh sub-modul (Data Obat, Kategori, Satuan, Formularium, Barcode) agar menggunakan pola yang sama:
     - Indikator total data dinamis (*Badge* hijau).
     - *Empty State* interaktif dengan ikon transparan dan tombol "Bersihkan Pencarian".
     - Pola `SheetHeader` (berbingkai + ikon) dan `SheetFooter`.
     - *Client-side Pagination* yang terhubung ke parameter URL.

---

## 🚀 NEW ROADMAP: INVENTORY & WMS BLUEPRINT
Disetujui untuk diimplementasikan pada tahap selanjutnya. Modul **Master Produk** sekarang bertindak sebagai fondasi (akar) untuk struktur Enterprise di bawah ini:

📦 **Inventory**
├── **Master Produk (SELESAI ✅)**
│   ├── Data Obat
│   ├── Kategori & Golongan
│   ├── Satuan & Konversi
│   ├── Barcode Manager
│   └── Formularium & Substitusi
├── **Stok**
│   ├── Stok Real-time
│   ├── Mutasi Stok
│   ├── Transfer Antar Gudang
│   ├── Stok Opname
│   ├── Reorder Point & Min-Max
│   ├── Reservasi Stok
│   └── Karantina Stok
├── **Batch & Kadaluarsa**
│   ├── Tracking Batch
│   ├── Alert Expired
│   ├── Aturan FEFO / FIFO (Kunci HPP Kasir)
│   ├── Dead Stock & Retur Expired
│   └── Pemusnahan Obat
├── **Narkotika & Psikotropika (Compliance)**
│   ├── Stok Narkotika & Psikotropika
│   └── Buku Defekta (Perencanaan)
└── **Gudang (WMS)**
    ├── Master Gudang
    ├── Zona Suhu & Kondisi
    ├── Lokasi Rak
    └── Bin / Slot Lokasi

---

## Snapshot - 19 Maret 2026 (Sesi 2)
- **Status:** Master Produk UI/UX Alignment & Formulary Module - Completed
- **Key Achievements:**
  1. **Formularium & Substitusi:** Fitur CRUD penuh, skema DB baru, dan pewarnaan semantik (Fornas/BPJS/RS).
  2. **Master Consistency:** Penyelarasan total seluruh sub-modul (Data Obat, Kategori, Satuan) ke "Gold Standard" (Header, Badge Opacity, Ikon).
  3. **Bug Fixes:** Perbaikan *type-error* pada `seed.ts` dan sinkronisasi data demo.

---

## Snapshot - 19 Maret 2026 (Sesi 1)
- **Status:** Full UI & Route Alignment - Completed (Local)
- **Milestone Terbaru (Done):**
  - Transformasi penuh modul **Medicines, Units, Conversions, Categories, dan Medicine Groups** ke standar Gold Standard.
  - Implementasi pola UI **Sidebar Dialog (Sheet)** dengan sistem `SheetHeader` -> `Tabs` -> `ScrollArea` -> `SheetFooter`.

---

## ⚠️ PELAJARAN KRITIS (Internal Blockers)
1. **Type Mismatch pada Relasi Drizzle:** Saat melakukan optimasi Drizzle dengan membatasi pemanggilan kolom (`columns: {...}`), pastikan komponen React tidak sedang mengharapkan tipe objek yang utuh (*Full Entity*). Ketidakselarasan ini menyebabkan aplikasi tidak bisa di-*build*. Solusinya: Hapus batasan kolom atau buat tipe antarmuka (interface) yang hanya menuntut parameter spesifik (Partial).
2. **Root Component Awareness:** Masalah keterbacaan seringkali bersumber dari desain dasar (root) komponen. Perbaiki di sumbernya (`packages/ui`) untuk konsistensi global daripada menimpa di level aplikasi.
3. **Monospace Visual Weight:** Font Monospace (`Geist Mono`) memiliki bobot visual lebih berat. Gunakan `text-sm` atau `font-semibold` (bukan bold) untuk menyeimbangkannya dengan font Sans di sebelahnya.
4. **Context Management:** Saat *context window* mulai penuh, segera lakukan "State Compression" via Checkpoint dan mulai sesi baru untuk menjaga akurasi logika.

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

## Catatan Senior Dev
- **Design Pattern:** Pola `SheetHeader` -> `Tabs` -> `ScrollArea` -> `SheetFooter` resmi menjadi standar emas untuk form entitas di proyek ini.
- **Color Logic:** Gunakan `emerald-400` (dark) untuk data positif yang ingin ditonjolkan agar tidak redup.

## Next Session Target
Mulai mengeksekusi Blueprint Inventory. Rekomendasi: Mulai dari penyempurnaan fitur **Stok & Mutasi**, atau menyelesaikan arsitektur **Gudang & Lokasi Rak** sebagai rumah fisik bagi barang sebelum mutasi dijalankan.