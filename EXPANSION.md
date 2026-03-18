📦 Inventory
├── Master Produk
│ ├── Data Obat
│ ├── Kategori & Golongan
│ ├── Satuan & Konversi
│ └── Barcode Manager
├── Stok
│ ├── Stok Real-time
│ ├── Mutasi Stok
│ ├── Transfer Antar Gudang
│ └── Stok Opname
├── Batch & Kadaluarsa
│ ├── Tracking Batch
│ ├── Alert Expired
│ └── Pemusnahan Obat
└── Gudang
    ├── Master Gudang
    └── Lokasi Rak

💊 Farmasi & Klinis
├── Resep
│ ├── Input Resep
│ ├── Antrian Resep
│ ├── Verifikasi Apoteker
│ └── Arsip Resep
├── Racikan / Compounding
│ ├── Formula Racikan
│ └── Riwayat Racikan
├── Klinis
│ ├── Drug Interaction Checker
│ ├── Kontraindikasi
│ └── Alergi Pasien
└── Etiket
    ├── Template Etiket
    └── Cetak Etiket

🛒 Penjualan
├── Point of Sale
│ ├── Transaksi Baru
│ ├── Riwayat Transaksi
│ ├── Void & Retur
│ └── Tutup Kasir
├── Harga & Diskon
│ ├── Daftar Harga
│ ├── Diskon & Promo
│ └── Harga Khusus (Member/Klinik)
└── Piutang Penjualan
    ├── Tagihan Kredit
    ├── Pembayaran Piutang
    └── Aging Piutang

🚚 Pembelian
├── Purchase Request (PR)
│ ├── Buat PR
│ └── Approval PR
├── Purchase Order (PO)
│ ├── Buat PO
│ ├── Approval PO
│ └── Riwayat PO
├── Penerimaan Barang
│ ├── Input Penerimaan
│ └── QC Barang
├── Retur Pembelian
└── Hutang Pembelian
    ├── Daftar Hutang
    ├── Pembayaran Hutang
    └── Aging Hutang

💰 Keuangan
├── Kas & Bank
│ ├── Kas Masuk
│ ├── Kas Keluar
│ ├── Mutasi Kas
│ └── Rekonsiliasi Bank
├── Akuntansi
│ ├── Jurnal Umum
│ ├── Buku Besar
│ ├── Neraca
│ └── Laba Rugi
├── Pajak
│ ├── PPN
│ └── PPh
└── Cash Flow

👥 CRM & Relasi
├── Pasien / Pelanggan
│ ├── Data Pelanggan
│ ├── Riwayat Pembelian
│ ├── Program Loyalitas
│ └── Reminder Refill
├── Dokter & Klinik
│ ├── Data Dokter
│ ├── Data Klinik Partner
│ └── Laporan Resep per Dokter
└── Supplier & Distributor
    ├── Data Supplier
    ├── Kontrak & Harga
    └── Performa Supplier

🔧 Operasional
├── Shift & Kasir
│ ├── Buka Shift
│ ├── Tutup Shift
│ └── Riwayat Shift
├── Antrian
│ ├── Antrian Umum
│ └── Antrian Resep
├── Perawatan Alat
│ ├── Jadwal Maintenance
│ └── Riwayat Maintenance
├── SOP & Dokumen
│ ├── Daftar SOP
│ └── Dokumen Regulasi
└── Komunikasi Internal
    ├── Pengumuman
    └── Catatan Operasional

📋 Laporan
├── Penjualan
│ ├── Laporan Harian
│ ├── Laporan Bulanan
│ └── Laporan per Produk
├── Inventory
│ ├── Laporan Stok
│ ├── Laporan Mutasi
│ └── Laporan Dead Stock
├── Keuangan
│ ├── Laporan Laba Rugi
│ ├── Laporan Cash Flow
│ └── Laporan Pajak
├── Regulasi
│ ├── Laporan Narkotika & Psikotropika (SIPNAP)
│ └── Laporan BPJS
└── Analitik
    ├── Dashboard Eksekutif
    ├── Tren Penjualan
    └── Segmentasi Pelanggan

👨‍💼 SDM
├── Karyawan
│ ├── Data Karyawan
│ ├── Jabatan & Role
│ └── Dokumen & Sertifikasi (SIPA, STRTTK)
├── Kehadiran
│ ├── Absensi
│ ├── Jadwal Shift
│ └── Izin & Cuti
└── Penggajian
    ├── Gaji Pokok
    ├── Komisi & Bonus
    └── Slip Gaji

🔗 Integrasi
├── BPJS
├── e-Resep / Telemedicine
├── Marketplace (Tokopedia, Shopee)
├── WhatsApp Notifikasi
└── Akuntansi Eksternal (Accurate, Jurnal)

⚙️ Pengaturan
├── Profil Apotek
├── Cabang
│ ├── Data Cabang
│ └── Sinkronisasi Cabang
├── Pengguna & Akses
│ ├── Manajemen User
│ ├── Role & Permission
│ └── Log Aktivitas
├── Konfigurasi Sistem
│ ├── Pajak & Harga Default
│ ├── Notifikasi & Alert
│ └── Backup & Restore
└── Hardware
    ├── Printer
    ├── Barcode Scanner
    └── Cash Drawer


Tipe: Departemen Baru
Nama: Konsultasi & Telefarma
Lokasi: Parent baru (sejajar dengan Farmasi & Klinis)
Deskripsi: Layanan konsultasi obat online antara apoteker dan pasien
Child yang dibutuhkan:
- Jadwal Konsultasi
- Sesi Chat / Video
- Riwayat Konsultasi
- Resep Digital dari Konsultasi
Alasan: Apotek ingin ekspansi ke layanan digital


Tipe: Ekspansi Departemen
Nama: Inventori
Lokasi: Parent lama (sejajar dengan Dasboard & Procurement)
Deskripsi: Melengkapi kebutuhan
Child yang dibutuhkan:
📦 Inventory
├── Master Produk
│ ├── Data Obat
│ ├── Kategori & Golongan
│ ├── Satuan & Konversi
│ └── Barcode Manager
├── Stok
│ ├── Stok Real-time
│ ├── Mutasi Stok
│ ├── Transfer Antar Gudang
│ └── Stok Opname
├── Batch & Kadaluarsa
│ ├── Tracking Batch
│ ├── Alert Expired
│ └── Pemusnahan Obat
└── Gudang
    ├── Master Gudang
    └── Lokasi Rak
Alasan: Apotek ingin ekspansi
