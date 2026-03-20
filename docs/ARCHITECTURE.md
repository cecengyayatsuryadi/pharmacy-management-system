# Architecture Documentation - Apotek Management System

## High-Level System Overview
The Apotek Management System is a multi-tenant SaaS application built using a modern monorepo architecture. It leverages Next.js for the application layer and Drizzle ORM for database interactions.

### High-Level Diagram Description
Imagine a diagram with three main layers:
1. **Client Layer (Next.js Frontend):** Browser-based UI using React 19, Tailwind CSS v4, and shadcn/ui. It communicates with the server via Next.js Server Actions.
2. **Server Layer (Next.js Backend):** Handles business logic, authentication (Auth.js), and data validation (Zod). It manages requests within organization-specific contexts.
3. **Data Layer (PostgreSQL):** A multi-tenant database where every table (except core auth) is scoped by `organization_id`.

## System Components and Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `apps/web` | Primary application. Contains UI components, Server Actions, and routing logic. |
| `packages/database` | Centralized database schema (Drizzle), migrations, and seed scripts. |
| `packages/ui` | Shared UI component library based on Tailwind CSS and shadcn/ui. |
| `packages/eslint-config` | Shared linting rules across all workspaces. |
| `packages/typescript-config` | Shared TypeScript configurations. |
## Data Flow Narrative
1. **Request Entry:** A user performs an action in the browser (e.g., creating a sale).
2. **Action Trigger:** The React component invokes a **Server Action** (e.g., `createSaleAction`).
3. **Authentication & Context:** The action uses `getAuthenticatedSession()` (from `action-utils.ts`) to verify the user and organization context.
4. **Validation:** Input data is validated using a **Zod schema**. We use `z.coerce` for `FormData` compatibility and `z.preprocess` for boolean checkbox handling.
5. **Business Logic:** Logic is executed (e.g., checking medicine plan limits within a transaction).
6. **Persistence:** The action performs a **Database Transaction** using Drizzle ORM to ensure data integrity.
7. **Error Handling:** Errors are caught by `handleActionError()`, which sanitizes database internal details and returns a standardized `ActionResponse`.
8. **Response:** The UI receives `{ success, message, errors, data }` and updates via `revalidatePath`.

## Key Design Decisions
### Standardized Server Actions (`ActionResponse`)
- **Decision:** All Server Actions return a consistent object.
- **Why:** Simplifies frontend toast notifications and form error state management. Centralizes error sanitization to prevent internal schema leakage.

### Optimized Data Fetching
- **Decision:** Use specific column selection (`columns: { ... }`) and `exists` subqueries for relational searches.
- **Why:** Minimizes network payload and database memory usage. Prevents N+1 query patterns common in complex relational searches (e.g., searching formularies by medicine name).

### Database Performance Layer
- **Decision:** Added composite and non-unique indices on `organization_id` combined with `category_id`, `is_active`, and `created_at`.
- **Why:** Ensures that as the system scales to thousands of organizations, list queries remain fast and efficient.

## Known Limitations
### 3-Pillar Inventory System
...
- **Decision:** Separate Ledger, Segmentation, and Conversion.
- **Why:** To provide an "audit-ready" stock history. The ledger ensures we always know *why* a number changed, segmentation handles the complexity of "locked" stock (reserved for pending sales), and conversion handles pharmaceutical packaging complexity.

### Server Actions as API
- **Decision:** Use Server Actions for all data mutations and most fetches.
- **Why:** Reduces boilerplate, provides end-to-end type safety, and aligns with Next.js App Router best practices.

## Known Limitations
- **Scaling:** Currently optimized for single-instance Node.js deployments. Large-scale horizontal scaling might require adjustment to how shared caches (if any) are handled.
- **Offline Mode:** The application is currently web-only and requires an active internet connection.
- **Legacy Browser Support:** Built with React 19 and modern CSS, targeting only evergreen browsers.
