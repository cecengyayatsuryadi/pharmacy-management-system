# API Documentation - Apotek Management System

The Apotek Management System primarily communicates between the frontend and backend using **Next.js Server Actions**. This provides end-to-end type safety without the need for traditional REST/GraphQL boilerplate.

## Overview
All API calls are authenticated via session-based cookies (Auth.js v5). Requests are automatically scoped to the user's `organizationId`.

## Authentication Actions (`apps/web/lib/actions/auth.ts`)

### `loginAction`
- **Description:** Authenticates a user and starts a session.
- **Request (FormData):**
  - `email`: string (required)
  - `password`: string (required)
- **Response:**
  - `error`: string (optional, error message)
  - `message`: string (optional, success message)

### `signupAction`
- **Description:** Registers a new organization and administrator.
- **Request (FormData):**
  - `name`: string (organization name)
  - `adminName`: string (admin's display name)
  - `email`: string (admin's email)
  - `password`: string (admin's password)
- **Response:**
  - `error`: string (optional)
  - `message`: string (optional)

---

## Inventory Actions (`apps/web/lib/actions/inventory.ts`)

### `createStockMovementAction`
- **Description:** Records a stock movement (entry, exit, or adjustment).
- **Request (FormData):**
  - `medicineId`: UUID string
  - `warehouseId`: UUID string
  - `type`: "in" | "out" | "adjustment"
  - `quantity`: number (positive)
  - `batchNumber`: string (required for 'in')
  - `expiryDate`: string (ISO date, required for new batches)
  - `batchId`: UUID (required for 'out' or 'adjustment')
  - `note`: string (optional)
- **Response:**
  - `message`: string
  - `errors`: field-level validation errors (Zod)

---

## Sale Actions (`apps/web/lib/actions/sale.ts`)

### `createSaleAction`
- **Description:** Processes a Point of Sale (POS) transaction.
- **Request (Object - `SaleInput`):**
  - `items`: array of:
    - `medicineId`: UUID
    - `quantity`: number
    - `priceAtSale`: number
  - `paymentMethod`: "cash" | "card" | "transfer"
  - `paidAmount`: number
  - `customerName`: string (optional)
  - `note`: string (optional)
- **Response:**
  - `error`: string (optional)
  - `details`: validation errors (optional)
  - `sale`: the created sale object (on success)

---

## Standard Response Format (`ActionResponse`)
All mutation actions return a consistent structure:
```typescript
{
  success: boolean;      // True if action completed successfully
  message: string;      // User-friendly feedback message
  errors?: Record<string, string[]>; // Field-level validation errors (if success: false)
  data?: T;             // Optional return data
}
```

---

## Medicine Actions (`apps/web/lib/actions/medicine.ts`)

### `getMedicines`
- **Description:** Retrieves a paginated list of medicines with filtering.
- **Request Parameters:**
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
  - `search`: string (filters name, generic name, sku, or code)
  - `categoryId`: UUID (optional)
  - `groupId`: UUID (optional)
  - `status`: "active" | "inactive" | ""

### `createMedicineAction`
- **Description:** Adds a new medicine. Handles plan limit check (100 items for 'gratis' plan).
- **Request (FormData):** `name`, `categoryId`, `baseUnitId`, `purchasePrice`, `price`, `stock`, `isActive`, etc.

### `updateMedicineAction`
- **Description:** Updates an existing medicine.
- **Arguments:** `id: string` (UUID), `formData: FormData`

---

## Category & Group Actions (`apps/web/lib/actions/category.ts`, `medicine-group.ts`)

### `getCategories` / `getMedicineGroups`
- **Description:** Lists categories or groups with a count of related medicines.

### `deleteCategoryAction` / `deleteMedicineGroupAction`
- **Description:** Deletes a record ONLY if it is not used by any medicine.

---

## Unit Actions (`apps/web/lib/actions/unit.ts`)

### `getUnitsAction`
- **Description:** Lists all units available for the organization.

---

## Formulary & Substitution Actions (`apps/web/lib/actions/formulary.ts`)

### `getFormulariesAction`
- **Description:** Lists medicine formularies. Uses optimized `exists` subquery for medicine name search.

### `upsertFormularyAction`
- **Description:** Creates or updates a formulary record based on the presence of an `id` in FormData.

### getSubstitutionsAction
- **Description:** Lists alternative medicines for a given medicine.

---

## Procurement Actions (`apps/web/lib/actions/procurement.ts`)

### `createProcurementAction`
- **Description:** Creates a Purchase Order / Stock-In transaction from a supplier.
- **Request (FormData):**
  - `supplierId`: UUID
  - `invoiceNumber`: string
  - `items`: array (JSON stringified in FormData)
  - `note`: string (optional)
- **Response:** Standard ActionResponse format.

