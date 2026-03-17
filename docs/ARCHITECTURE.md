# Arsitektur Sistem - Apotek Management System (SaaS Multi-Tenant)

## 1. Prinsip Arsitektur
- **Tenant Isolation:** Semua data operasional wajib scoped ke `organizationId`.
- **Boundary yang jelas:**
  - `apps/web` -> app layer
  - `packages/database` -> schema dan query layer
  - `packages/ui` -> shared UI
- **Auditability:** perubahan transaksi stok/penjualan harus bisa ditelusuri.

## 2. Model SaaS Plan
- Plan disimpan di `organizations.plan` (`gratis` | `pro`).
- Session tetap dipakai untuk identitas user (`userId`, `organizationId`, role).
- Untuk gating fitur kritikal plan, sumber kebenaran adalah DB (hindari stale snapshot session).

## 3. Skema Inti (Ringkas)
- `organizations`: tenant + plan
- `users`: akun user per organization
- `memberships`: relasi user-organisasi (multi-branch)
- `categories`, `medicines`: master data
- `stock_movements`: audit mutasi stok
- `sales`, `sale_items`: transaksi POS

## 4. Aturan Teknis
- Gunakan transaksi DB untuk operasi stok/penjualan.
- Validasi input server-side wajib (`zod`) pada setiap action mutasi.
- Operasi sensitif wajib RBAC (`admin`/`staff`) dan tenant scope.

## 5. Arah Arsitektur Berikutnya
- Tambah domain procurement:
  - `suppliers`
  - pembelian
  - retur supplier
- Setelah data procurement matang, lanjutkan ke rules-based lalu ML procurement intelligence.

---
Last Updated: 16 Maret 2026
