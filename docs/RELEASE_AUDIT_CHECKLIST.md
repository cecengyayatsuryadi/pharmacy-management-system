# Release Audit Checklist - Apotek SaaS

Tanggal: `____-__-__`
Versi: `________`
PIC: `________`

## A. Functional Gate
- [ ] Flow utama lolos: signup/login -> dashboard -> master data -> inventory -> POS -> reports.
- [ ] Tidak ada issue `CRITICAL/HIGH` terbuka.
- [ ] Smoke test akhir selesai.

## B. Quality Gate
- [ ] `npm run typecheck` (root turbo) pass.
- [ ] `npm run lint` (root turbo) pass.
- [ ] Test suite (jika ada) pass.

## C. Security & Isolation
- [ ] Tenant scope (`organizationId`) tervalidasi pada query/action kritikal.
- [ ] RBAC diverifikasi untuk route/action sensitif.
- [ ] Tidak ada hardcoded secret.

## D. Data & Migration
- [ ] Migrasi release diuji di staging.
- [ ] Backup DB tersedia sebelum release.
- [ ] Rollback plan siap diuji.

## E. Runtime Readiness
- [ ] Required env vars tersedia.
- [ ] Build artifact start normal.
- [ ] Error logging dan monitoring aktif.

## F. Go/No-Go
- Keputusan: `[ GO / NO-GO ]`
- Waktu: `____-__-__ __:__`
- Disetujui oleh: `____________________`
