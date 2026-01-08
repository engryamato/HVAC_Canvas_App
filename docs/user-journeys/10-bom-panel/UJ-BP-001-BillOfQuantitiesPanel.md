# [UJ-BP-001] Bill of Quantities Panel

## Overview

This user journey covers the **Bill of Quantities (BoQ)** panel displayed in the Right Sidebar. The panel provides a tabular breakdown of all materials required for the HVAC project, grouped by category (Ducts, Fittings, Equipment, Accessories) with quantities, descriptions, and weights.

## PRD References

- **FR-BP-001**: User shall view Bill of Quantities in Right Sidebar
- **US-BP-001**: As a designer, I want to export material quantities so I can estimate costs and order supplies
- **AC-BP-001-001**: BoQ organized in table format with 4 columns
- **AC-BP-001-002**: Materials grouped by category
- **AC-BP-001-003**: Quantities auto-calculate from canvas entities

## Prerequisites

- User is in Canvas Editor
- Right Sidebar is visible
- At least one entity exists on canvas (room, duct, or equipment)

## User Journey Steps

### Step 1: Open BoQ Panel

**User Action**: Expand \"BillOf Quantities\" accordion in Right Sidebar

**Expected Result**:
- Accordion expands showing **Table** with 4 columns:
  
  | Quantity | Name | Description | Weight |
  |----------|------|-------------|--------|
  | 24 ft    | Duct - 12×8 | Galvanized Steel, G-90 | 45.2 lbs |
  | 3        | 90° Elbow - 12×8 | Galvanized Steel, G-90 | 3.8 lbs each |
  | 1        | AHU - 2000 CFM | Carrier Model 48XYZ | 350 lbs |
  
- **Column 1: Quantity**
  - Numeric count or length
  - Unit displayed (ft, pcs, ea)
- **Column 2: Name**
  - Item type and size
  - Separated by category with bold headers:
    * **Ducts**
    * **Fittings**
    * **Equipment**
    * **Accessories**
- **Column 3: Description**
  - Material type, grade, specifications
- **Column 4: Weight**
  - Individual or total weight
  - Unit: lbs or kg based on project settings

**Validation Method**: E2E test
```typescript
await page.click('button:has-text(\"Bill of Quantities\")');

await expect(page.locator('table.boq-table')).toBeVisible();
await expect(page.locator('th:has-text(\"Quantity\")')).toBeVisible();
await expect(page.locator('td:has-text(\"24 ft\")')).toBeVisible();
await expect(page.locator('td:has-text(\"Duct - 12×8\")')).toBeVisible();
```

---

### Step 2: Category Breakdown

**Expected Result**:
- Items grouped and subtotaled by category:
  
  **Ducts** (subtotal row):
  - Duct - 12×8: 24 ft (45.2 lbs)
  - Duct - 10×6: 18 ft (28.5 lbs)
  - **Subtotal**: 42 ft, 73.7 lbs
  
  **Fittings**:
  - 90° Elbow - 12×8: 3 pcs (11.4 lbs total)
  - Wye - 12×8×6: 2 pcs (8.6 lbs total)
 - **Subtotal**: 5 pcs, 20 lbs
  
  **Equipment**:
  -  AHU - 2000 CFM: 1 ea (350 lbs)
  - **Subtotal**: 1  ea, 350 lbs
  
  **Accessories**:
  - Dampers: 4 pcs (12 lbs total)
  - **Subtotal**: 4 pcs, 12 lbs
  
- **Grand Total** row at bottom: \"Total Weight: 455.7 lbs\"

---

### Step 3: Export BoQ

**User Action**: Click \"Export\" button at top of BoQ panel

**Expected Result**:
- Export modal opens with options:
  - CSV
  - Excel (.xlsx)
  - PDF
- User selects format and downloads
- File includes all table data with category headers

---

## Edge Cases

1. **Empty Canvas**: Shows \"No items to display. Add entities to generate BoQ.\"
2. **Missing Material Data**: Row shows \"Material: Not Specified\"
3. **Unit Conversion**: Toggles between English (ft, lbs) and Metric (m, kg)

## Related Elements

- [RightSidebar](../../elements/01-components/canvas/RightSidebar.md)
- [BoQCalculator](../../elements/06-calculators/BoQCalculator.md)
- [ExportService](../../elements/08-services/ExportService.md)

## Test Implementation

- E2E: `e2e/bom/boq-panel.spec.ts`
- Integration: BoQ calculation accuracy
- Unit: Table rendering, category grouping

---

## Error Scenarios

1. **Export Failure**: Error toast "Export failed" with retry button
2. **Weight Calculation Error**: Row shows "Weight: N/A" with warning icon
3. **Quantity Overflow**: Displays "1.2M ft" format with full value in tooltip

---

## Keyboard Shortcuts

| Action | Shortcut | Context |
|--------|----------|---------|
| Expand BoQ Panel | `Alt+B` | Sidebar visible |
| Export BoQ | `Ctrl/Cmd+Shift+E` | BoQ panel open |

---

## Performance Considerations

- **Lazy Calculation**: BoQ recalculates only when entities change
- **Expected Render Time**: <50ms for typical project

---

## Accessibility

- Table uses proper `<thead>`, `<tbody>` with `scope` attributes
- Export button has `aria-label="Export Bill of Quantities"`

---

## Notes

- Future: Cost estimation, vendor integration, revision tracking
