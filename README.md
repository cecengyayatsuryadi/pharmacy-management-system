# Apotek Management System (Pharmacy SaaS)

A comprehensive, multi-tenant pharmacy management system designed for modern pharmacy operations. It handles everything from medicine master data and multi-level unit conversions to inventory tracking, point-of-sale transactions, and procurement workflows. Built with a SaaS-first architecture, it ensures strict data isolation between organizations while providing a polished, efficiency-focused user experience.

## Documentation
Detailed documentation is available in the `docs/` directory:
- [Architecture Guide](./docs/ARCHITECTURE.md) - Deep dive into system design and data flow.
- [API Documentation](./docs/API_DOCUMENTATION.md) - Reference for Server Actions (API layer).
- [Operational Runbook](./docs/RUNBOOK.md) - Maintenance, backups, and troubleshooting.

## Key Features
- **Multi-Tenant Authentication:** Strict organization-level data isolation using Auth.js v5.
- **Advanced Medicine Master Data:** Tracking of pharmaceutical fields, generic names, manufacturers, and status.
- **Medicine Groups & Formularies:** Categorize medicines into therapeutic groups and manage Formularium Nasional (Fornas) or hospital-specific lists.
- **Medicine Substitutions:** Define alternative medicines for out-of-stock items.
- **Smart Inventory (3 Pillars):**
  - **Ledger:** Absolute tracking of stock balances before and after every movement.
  - **Segmentation:** Physical, Reserved (POS queue), and Quarantine (expired/damaged) stock separation.
  - **Conversion:** Automated unit splitting (e.g., Box → Strip → Tablet).
- **Point of Sale (POS):** Efficient, keyboard-navigable checkout interface with real-time stock validation.
- **Procurement Module:** Formal procurement workflow (PO → Invoice → Stock In).
- **Reporting & Analytics:** Real-time dashboard and sales reports.

## Prerequisites
- **Node.js:** v20 or higher
- **npm:** v11 or higher
- **Docker:** For local PostgreSQL database
- **Turbo:** Monorepo management (included in devDependencies)
- **OpenSSL:** Required by Auth.js for secret generation

## Installation
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd apotek
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Setup Database:**
   ```bash
   docker compose up -d
   ```

## Configuration
Create a `.env` file in the root directory.

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5433/apotek` |
| `AUTH_SECRET` | Secret key for Auth.js | `generate-a-random-string-here` |

> **Tip:** You can generate an `AUTH_SECRET` using `openssl rand -base64 32`.

## How to Run Locally
1. **Push Database Schema:**
   ```bash
   npm run db:push --workspace=@workspace/database
   ```
2. **Apply Migrations (Production-like):**
   ```bash
   # If you want to test migrations locally
   npm run db:generate --workspace=@workspace/database
   ```
3. **Seed Initial Data (Optional but recommended):**
   ```bash
   npm run db:seed --workspace=@workspace/database
   ```
4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Access the application at `http://localhost:3000`.

## How to Run Tests
- **Unit Tests (Vitest):** `npm run test` (Runs in workspace)
- **Individual Action Tests:** `npm run test -- <path-to-test-file>`
- **E2E Tests (Playwright):** `npx playwright test`
- **Type Checking:** `npm run typecheck`

## Deployment
This project is optimized for deployment on **Vercel**. 
1. Connect your repository to Vercel.
2. Set the root directory to the project root.
3. Configure environment variables in the Vercel dashboard.
4. The build command is `npm run build` and the output directory is managed by Next.js.

## Contributing
1. Create a feature branch from `master`: `git checkout -b feat/your-feature`.
2. Follow the **Pro-Git Protocol**: use conventional commits and atomic changes.
3. Ensure all tests pass and `tsc --noEmit` returns no errors.
4. Submit a Pull Request for review.

## License
Private / Proprietary.
