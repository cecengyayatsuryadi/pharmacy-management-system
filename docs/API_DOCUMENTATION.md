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

## Medicine Actions (`apps/web/lib/actions/medicine.ts`)

### `createMedicineAction`
- **Description:** Adds a new medicine to the master data.
- **Request (FormData):**
  - `name`: string
  - `genericName`: string
  - `manufacturer`: string
  - `categoryId`: UUID
  - `baseUnitId`: UUID
  - `description`: string (optional)
- **Response:**
  - `message`: string
  - `errors`: validation errors

---

## Procurement Actions (`apps/web/lib/actions/procurement.ts`)

### `createProcurementAction`
- **Description:** Creates a Purchase Order / Stock-In transaction from a supplier.
- **Request (FormData):**
  - `supplierId`: UUID
  - `invoiceNumber`: string
  - `items`: array (JSON stringified in FormData)
  - `note`: string (optional)
- **Response:**
  - `message`: string
  - `errors`: validation errors
