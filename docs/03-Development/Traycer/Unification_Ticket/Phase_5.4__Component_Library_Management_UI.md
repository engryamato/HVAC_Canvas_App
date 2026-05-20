# Phase 5.4: Component Library Management UI


## Overview

Build dedicated Component Library Management view for adding, editing, and managing components, pricing, and engineering properties.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 6: Component Library Management)

## Scope

**In Scope**:
- Library Management view (full-page or modal)
- Component tree (left panel) + detail editor (right panel)
- Add/edit/delete/duplicate components
- Edit pricing (material cost, labor units)
- Edit engineering properties (friction factor, max velocity)
- Import/export component library (CSV, JSON)
- Access via Settings → "Manage Component Library"

**Out of Scope**:
- Custom component creation wizard (future enhancement)
- Component templates (future enhancement)

## Key Files

**Create**:
- `file:hvac-design-app/src/features/library/LibraryManagementView.tsx`
- `file:hvac-design-app/src/features/library/components/ComponentTree.tsx`
- `file:hvac-design-app/src/features/library/components/ComponentEditor.tsx`
- `file:hvac-design-app/src/features/library/components/ImportExportDialog.tsx`

**Reference**:
- `file:hvac-design-app/src/core/store/componentLibraryStoreV2.ts` (from Phase 1.1)

## Acceptance Criteria

- [ ] Library view shows component tree (left) + editor (right)
- [ ] Selecting component in tree shows details in editor
- [ ] Editor shows: Basic Info, Pricing & Labor, Engineering Properties, Available Materials
- [ ] "Add New Component" button opens creation form
- [ ] "Save Changes" button updates component in library
- [ ] "Duplicate Component" creates copy with "(Copy)" suffix
- [ ] "Delete" button removes component (with confirmation)
- [ ] Import button opens file picker → CSV/JSON import wizard
- [ ] Export button downloads component library as CSV/JSON
- [ ] Changes immediately available in Component Browser
- [ ] Matches wireframe from Flow 6

## Dependencies

- **Requires**: Phase 1.1 (unified component library store)
- **Requires**: Phase 3.3 (Component Browser to see changes)

## Technical Notes

**Import/Export**:
- CSV: Column mapping wizard
- JSON: Direct ComponentLibrary schema
- Validation before import
- Duplicate handling (skip, overwrite, rename)
