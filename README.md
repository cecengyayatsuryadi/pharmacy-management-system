# Pharmacy Management System (Apotek)

Monorepo aplikasi manajemen apotek berbasis Next.js, dengan fitur utama:
- autentikasi multi-tenant (organization)
- manajemen obat & kategori
- inventori (stok masuk/keluar/opname)
- POS (kasir)
- laporan penjualan dan analitik dasar

## Tech Stack
- Next.js 16 + React 19 (`apps/web`)
- Turborepo workspace
- PostgreSQL + Drizzle ORM (`packages/database`)
- Tailwind CSS v4 + shadcn/ui (`packages/ui`)
- Auth.js / NextAuth v5 beta

## Struktur Repo
- `apps/web` -> aplikasi web utama
- `packages/database` -> schema Drizzle, koneksi DB, script db/seed
- `packages/ui` -> shared UI components
- `docs` -> dokumentasi proyek (roadmap, checkpoint, arsitektur, audit)

## Dokumentasi
- `docs/DOCUMENTATION_INDEX.md` -> peta dokumentasi
- `docs/ROADMAP.md` -> rencana fase pengembangan
- `docs/CHECKPOINT.md` -> status teknis terkini
- `docs/ARCHITECTURE.md` -> prinsip arsitektur
- `docs/RELEASE_AUDIT_CHECKLIST.md` -> checklist release
- `docs/REPO_REVIEW.md` -> temuan teknis aktif

## Prerequisites
- Node.js >= 20
- npm >= 11
- Docker + Docker Compose

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Jalankan PostgreSQL lokal (Docker)
```bash
docker compose up -d
```

Service DB default:
- host: `localhost`
- port: `5433`
- db: `apotek`
- user: `postgres`
- password: `password`

### 3. Set environment variable
Buat file `.env` di root repo:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5433/apotek
AUTH_SECRET=replace-with-random-secret
```

> `AUTH_SECRET` wajib untuk Auth.js.

### 4. Push schema database
```bash
npm run db:push --workspace=@workspace/database
```

### 5. (Opsional) Seed data demo
```bash
npm run db:seed --workspace=@workspace/database
```

Akun demo seed:
- email: `demo@google.com`
- password: `demo123`

### 6. Jalankan aplikasi
```bash
npm run dev
```

Akses web: `http://localhost:3000`

## Script Penting
Di root repo:
- `npm run dev` -> jalankan seluruh workspace dev via Turbo
- `npm run build` -> build semua workspace
- `npm run lint` -> lint semua workspace
- `npm run typecheck` -> typecheck semua workspace

Di package database:
- `npm run db:generate --workspace=@workspace/database`
- `npm run db:push --workspace=@workspace/database`
- `npm run db:studio --workspace=@workspace/database`
- `npm run db:seed --workspace=@workspace/database`

## Catatan
- Plan organisasi tersimpan di tabel `organizations.plan` (`gratis` / `pro`).
- Untuk perubahan paket yang harus langsung tercermin, beberapa area sudah membaca plan live dari DB.
