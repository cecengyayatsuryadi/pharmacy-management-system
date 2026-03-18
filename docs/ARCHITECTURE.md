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
3. **Authentication:** The Server Action calls `auth()` to verify the user's session and retrieve their `organizationId`.
4. **Validation:** Input data is validated using a **Zod schema**.
5. **Business Logic:** Logic is executed (e.g., checking stock levels, aggregating items).
6. **Persistence:** The action performs a **Database Transaction** using Drizzle ORM to ensure data integrity (e.g., updating stock and creating a sale record simultaneously).
7. **Response:** The Server Action returns a success/error message and triggers `revalidatePath` to update the UI.

## Key Design Decisions
### Multi-Tenancy (Row-Level Isolation)
- **Why:** To support multiple independent pharmacies on a single platform while ensuring data privacy.
- **Decision:** Every record is tagged with an `organization_id`. All queries MUST include a filter for this ID.
- **Implementation:** The `auth()` session provides the `organizationId` which is then passed to all database operations in Server Actions.

### Data Integrity & Stock Accuracy
- **Why:** Inventory accuracy is critical in pharmacy operations.
- **Decision:** All stock changes (Sale, Procurement, Adjustment) occur within **Database Transactions** to ensure that both the ledger and current balance remain in sync.

### UI/UX Consistency
- **Why:** To provide a professional tool that is easy to use in fast-paced retail environments.
- **Decision:** Using **shadcn/ui** and a **Dual-Sidebar** navigation system for quick access to various modules.

## Known Limitations
### 3-Pillar Inventory System
- **Decision:** Separate Ledger, Segmentation, and Conversion.
- **Why:** To provide an "audit-ready" stock history. The ledger ensures we always know *why* a number changed, segmentation handles the complexity of "locked" stock (reserved for pending sales), and conversion handles pharmaceutical packaging complexity.

### Server Actions as API
- **Decision:** Use Server Actions for all data mutations and most fetches.
- **Why:** Reduces boilerplate, provides end-to-end type safety, and aligns with Next.js App Router best practices.

## Known Limitations
- **Scaling:** Currently optimized for single-instance Node.js deployments. Large-scale horizontal scaling might require adjustment to how shared caches (if any) are handled.
- **Offline Mode:** The application is currently web-only and requires an active internet connection.
- **Legacy Browser Support:** Built with React 19 and modern CSS, targeting only evergreen browsers.
