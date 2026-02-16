# Phase 3.3: Unified Component Browser UI


## Overview

Build unified Component Browser that replaces Product Catalog and Services tabs with single component tree, supporting click-to-activate pattern for component placement.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 1: Component Selection and Placement)

## Scope

**In Scope**:
- Unified component tree UI (hierarchical categories)
- Search and filter components
- Click-to-activate pattern (click component → becomes active drawing tool)
- Visual feedback for active component
- Integration with componentLibraryStoreV2
- Replace existing ProductCatalogPanel

**Out of Scope**:
- Component Library Management UI (handled in Phase 5.4)
- System Templates (handled in Phase 5.5)

## Key Files

**Create**:
- `file:hvac-design-app/src/features/canvas/components/ComponentBrowser.tsx`
- `file:hvac-design-app/src/features/canvas/components/ComponentTree.tsx`
- `file:hvac-design-app/src/features/canvas/components/ComponentSearchBar.tsx`

**Replace**:
- `file:hvac-design-app/src/features/canvas/components/ProductCatalogPanel.tsx` (deprecated)

**Modify**:
- `file:hvac-design-app/src/features/canvas/tools/DuctTool.ts` - Use activated component
- `file:hvac-design-app/src/features/canvas/tools/EquipmentTool.ts` - Use activated component
- `file:hvac-design-app/src/features/canvas/tools/FittingTool.ts` - Use activated component

## Acceptance Criteria

- [ ] Component Browser shows hierarchical tree (Ducts → Rectangular → Straight Duct)
- [ ] Search filters components by name, material, category
- [ ] Clicking component activates it as drawing tool
- [ ] Active component highlighted in browser
- [ ] Cursor changes to component icon when active
- [ ] Status bar shows "Active tool: Rectangular Duct (18x12)"
- [ ] Pressing Escape deactivates component
- [ ] Clicking different component switches active tool
- [ ] Matches wireframe from Flow 1
- [ ] Integration test: Click component → draw on canvas → component placed

## Dependencies

- **Requires**: Phase 1.1 (unified component library store)
- **Requires**: Phase 1.5 (tools updated to use new store)

## Technical Notes

**Component Activation Flow**:
1. User clicks component in browser
2. componentLibraryStore.activateComponent(id)
3. Tool reads active component from store
4. Tool uses component properties for placement
5. User clicks canvas → tool creates entity from component
