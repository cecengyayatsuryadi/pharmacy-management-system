# Sentinel Journal

Tambahkan entri hanya untuk pembelajaran security yang kritikal dan reusable.

## 2026-03-17 - Server Action Error Leakage
**Vulnerability:** Beberapa server action mengembalikan detail `getErrorMessage(error)` langsung ke user.
**Learning:** Pola ini muncul karena reuse util error untuk UX, tapi berisiko membocorkan detail internal DB/infrastruktur.
**Prevention:** Untuk response ke client gunakan pesan generik; detail error simpan di server log saja.
