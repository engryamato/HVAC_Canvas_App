# User Journey: Export to CSV (Bill of Materials)

## 1. Overview

### Purpose
To document the process of generating a Bill of Materials (BOM) and exporting it as a CSV file for estimation and inventory.

### Scope
- Viewing the BOM panel
- Initiating CSV export
- verifying the exported data

### User Personas
- **Primary**: Estimator/Contractor
- **Secondary**: HVAC Designer

### Success Criteria
- CSV file is generated with correct column headers (Item, Quantity, Dimensions, etc.)
- Data accurately reflects the current state of the canvas

## 2. PRD References

### Related PRD Sections
- **Section 6.2: Bill of Materials** - Data export requirements.

### Key Requirements Addressed
- REQ-OUT-003: System must generate linear takeoff for ducts.
- REQ-OUT-004: System must count equipment instances.

## 3. Prerequisites

### User Prerequisites
- Project with entities (ducts, equipment) placed.

### System Prerequisites
- `EntityStore` populated with categorized entities.

## 4. User Journey Steps

### Step 1: Open BOM Panel

**User Actions:**
1. Click the "BOM" or "Materials" icon/tab in the UI (likely bottom or right panel).

**System Response:**
1. System calculates current counts and lengths.
2. System displays tabular view of materials.

**Related Elements:**
- Components: `BOMPanel`
- Modules: `src/features/export/bom.ts` (calculation logic)

### Step 2: Export to CSV

**User Actions:**
1. Click the "Export CSV" button within the BOM panel.

**System Response:**
1. System formats data into CSV string via `csv.ts`.
2. System triggers file download.

**Visual State:**
```
[BOM Panel]
| Item | Qty |
| AHU  | 1   |
| Duct | 10' |

[Export CSV Button]
```

**Related Elements:**
- Modules: `src/features/export/csv.ts`

## 5. Edge Cases and Handling

1. **Zero Items**
   - **Scenario**: Exporting BOM with no items.
   - **Handling**: Export a CSV with headers only, or disable button.

## 11. Related Documentation
- [UJ-EXP-001: Export to PDF](UJ-EXP-001-ExportToPDF.md)
