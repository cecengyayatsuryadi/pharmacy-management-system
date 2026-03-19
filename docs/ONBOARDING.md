# Onboarding Report: Apotek Management System

Welcome to the **Apotek Management System**! This report provides a comprehensive technical overview to help you get up to speed quickly.

---

## 1. PROJECT OVERVIEW
- **Purpose:** A multi-tenant SaaS (Software as a Service) platform designed to manage modern pharmacy operations.
- **Domain:** Retail Pharmacy, Inventory Management, Point of Sale (POS), and Procurement.
- **Likely Users:** Pharmacy owners, pharmacists, and inventory managers.
- **Maturity:** **Mid-stage.** The core infrastructure (auth, multi-tenancy, master data, basic inventory) is solid. However, some complex modules like *Unit Conversion* and *Advanced Reporting* are currently undergoing refactoring or are in the early implementation phase.

## 2. TECH STACK
- **Core Framework:** Next.js 15/16 (App Router) + React 19.
- **Monorepo Tooling:** [Turborepo](https://turbo.build/) for managing multiple packages and apps.
- **Database & ORM:** PostgreSQL managed via [Drizzle ORM](https://orm.drizzle.team/).
- **Authentication:** [Auth.js v5](https://authjs.dev/) (NextAuth.js) with custom organization-level scoping.
- **UI & Styling:** Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com/) components.
- **Validation:** [Zod](https://zod.dev/) for strict runtime schema validation.
- **Local Dev:** Docker (for PostgreSQL).

## 3. ARCHITECTURE MAP
The project is a monorepo structured to promote code reuse and strict separation of concerns:

- `apps/web/`: The main Next.js application.
  - `app/`: Next.js App Router (Routes & UI Layouts).
  - `lib/actions/`: **The API Layer.** Contains Next.js Server Actions for all business logic.
  - `components/`: Feature-specific UI components.
- `packages/database/`: Shared database package.
  - `src/schema.ts`: The "Source of Truth" for the data model.
  - `src/seed.ts`: Initial data for development.
- `packages/ui/`: A shared library of primitive UI components based on Tailwind and Radix UI.
- `packages/eslint-config/` & `packages/typescript-config/`: Standardized project-wide settings.

**Entry Points:**
- **App Bootstrap:** `apps/web/app/layout.tsx` (Global providers and layouts).
- **Auth Layer:** `apps/web/auth.ts` (Session and organization context).
- **Data Source:** `packages/database/src/index.ts` (Drizzle client instance).

## 4. DATA FLOW
1. **Request:** A user interacts with a UI component (e.g., submits a sale form).
2. **Action Trigger:** The component invokes a **Server Action** (found in `apps/web/lib/actions/`).
3. **Authentication:** The Action calls `auth()` to verify the session and extract the `organizationId`.
4. **Validation:** Input data is validated against a **Zod schema**.
5. **Persistence:** Drizzle ORM executes the query or transaction. **CRITICAL:** Every query must include a filter for `organizationId` to ensure data isolation.
6. **UI Update:** The Action returns a result and calls `revalidatePath()` to refresh the server-side cache.

## 5. KEY CONVENTIONS
- **Naming Pattern:** Server Actions are named `[verb][Entity]Action` (e.g., `createSaleAction`, `updateMedicineAction`).
- **Tenant Isolation:** All tables (except core auth/organizations) have an `organizationId` column. Never query without it.
- **Error Handling:** Errors are handled via a central `getErrorMessage` utility. Actions return an object like `{ message: string, errors?: Record<string, string[]> }`.
- **Atomic Operations:** All operations affecting stock (sales, procurement, adjustments) must use `db.transaction`.

## 6. PAIN POINTS & TECH DEBT
- **Test Isolation:** There is a known conflict if Vitest (unit tests) and Playwright (E2E) share the same directory. Vitest files must be kept separate from the `tests/` folder scanned by Playwright.
- **ESM Resolution:** `next-auth` v5 can sometimes cause module resolution errors (`next/server`) when running tests in a pure Node environment.
- **Mocking Drizzle:** Mocking the database layer is difficult due to complex query builders. Prefers using a real Docker DB with `npm run db:seed`.
- **Lock Files:** Occasional Next.js dev server crashes require manual deletion of `apps/web/.next/dev/lock`.

## 7. GETTING STARTED GUIDE
1. **Setup Env:** Copy `.env.example` to `.env` (check `docs/RUNBOOK.md` for required keys).
2. **Install:** Run `npm install` in the root.
3. **Database:** 
   - Start Postgres: `docker compose up -d`
   - Push Schema: `npm run db:push --workspace=@workspace/database`
   - Seed Data: `npm run db:seed --workspace=@workspace/database`
4. **Run App:** `npm run dev`
5. **Run Tests:** 
   - Unit: `npm run test`
   - E2E: `npx playwright test`

---

### Top 5 Things to Understand First
- **Organization Scoping:** Every bit of data belongs to an organization. Always verify the `organizationId` in your actions.
- **Server Actions:** This is where 90% of the "real work" happens. Study `apps/web/lib/actions/inventory.ts` as a gold standard.
- **Git Management (Local):** NEVER commit directly to `master`. Always use `feat/` branches and merge with `--no-ff`.
- **The 3-Pillar Inventory:** Understand the difference between the **Ledger** (history), **Segmentation** (physical vs reserved), and **Conversion** (Satuan).
- **Drizzle Schema:** The file `packages/database/src/schema.ts` is the best way to understand the business domain.

---

## 8. PRO-GIT PROTOCOL (LOCAL WORKFLOW)
To maintain a high-quality codebase and clear history, follow these rules strictly:

1. **Branching:** Start every task from a clean `master` branch.
   `git checkout -b feat/your-feature-name`
2. **Atomic Commits:** Commit small, functional changes. Use Conventional Commits (`feat:`, `fix:`, `refactor:`).
3. **Pre-Merge Review:** Before merging, run `npm run lint` and verify the logic locally.
4. **Merge Strategy:** Always use `--no-ff` (no-fast-forward) to create a merge commit.
   `git checkout master && git merge --no-ff feat/your-feature-name`
5. **Cleanup:** Delete the feature branch locally once merged.
   `git branch -d feat/your-feature-name`

