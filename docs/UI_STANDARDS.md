# UI/UX Standards: Master Produk Blueprint

This document defines the "Gold Standard" for the Apotek Management System's Master module interfaces. Consistency across these patterns is mandatory.

## 1. Page Anatomy
All master sub-modules must follow this structural hierarchy:
- **Header Wrapper:** `flex flex-col gap-1`.
  - **Title:** `text-2xl font-bold tracking-tight`.
  - **Description:** `text-muted-foreground text-sm`.
- **Tabs (Optional):** `flex flex-col gap-4`.
  - **TabsList:** `w-fit` (No icons in tabs).
- **Control Bar (Search/Filter):**
  - Search input must include an `XIcon` clear button.
  - Primary Action Button (e.g., "Tambah ...") must be on the far right of the row.

## 2. Table Standards
- **Header:** `bg-muted/50` for the `TableHeader`.
- **Primary Info:** `font-semibold text-sm tracking-tight`.
- **Secondary Info:** `italic text-[10px] text-muted-foreground` with a left indentation (typically `pl-5`) to align under primary text.
- **Icons:**
  - `PillIcon`, `BoxIcon`, `BarcodeIcon` (Opacity: 40%).
  - `TagIcon`, `LayersIcon` (Opacity: 70%).
- **Semantic Badges:**
  - **Functional Tags:** `variant="outline"`, `text-[9px]`, bold uppercase, `rounded-[4px]`, with 10% BG opacity and 40% border opacity of the entity's color.
  - **Regulatory Groups:** Same as tags but with `rounded-full` (capsule style).
  - **Status Badges:** `h-5 text-[10px]`.
    - `success` for Active/Safe.
    - `secondary` for Inactive/Neutral.

## 3. Interaction Patterns
- **Forms:** Always use `Sheet` (Sidebar Dialog) for Create/Edit.
- **Scroll Area:** All sheets must wrap their content in a `ScrollArea` to ensure usability on smaller viewports.
- **Pagination:** Always use full numeric pagination links (`1, 2, 3...`) synchronized with URL Search Parameters.
- **Empty States:** Distinct messages for "No Data" vs "No Search Results Found".

## 4. Color Semantics
- **Primary (Blue):** Default system actions.
- **Emerald (Green):** Positive outcomes, safe stock, and **Substitution Medicines**.
- **Violet (Purple):** Internal or special classifications (e.g., RS Internal Formulary).
- **Destructive (Red):** Deletion and critical alerts.

---
*Last Verified: 19 March 2026*
