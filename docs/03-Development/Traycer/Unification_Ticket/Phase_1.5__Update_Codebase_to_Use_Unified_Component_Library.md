# Phase 1.5: Update Codebase to Use Unified Component Library


## Overview

Update all code references from old stores (`catalogStore`, `serviceStore`, old `componentLibraryStore`) to use the new unified `componentLibraryStoreV2`. This is the breaking change ticket.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/f52310a1-13a5-4d6f-b482-f30544acdb43` (Tech Plan - Decision 1)

## Scope

**In Scope**:
- Find all usages of `useCatalogStore`, `useServiceStore`, `useComponentLibraryStore`
- Update to use `useComponentLibraryStoreV2`
- Update component props and hooks to use new schema
- Update tools (DuctTool, EquipmentTool, FittingTool) to use new store
- Update UI components (ProductCatalogPanel, etc.) to use new store
- Remove old store files after migration complete
- Update imports throughout codebase

**Out of Scope**:
- New UI features (handled in later phases)
- New functionality (just migration to new store)

## Key Files

**Modify** (all files using old stores):
- `file:hvac-design-app/src/features/canvas/tools/DuctTool.ts`
- `file:hvac-design-app/src/features/canvas/tools/EquipmentTool.ts`
- `file:hvac-design-app/src/features/canvas/tools/FittingTool.ts`
- `file:hvac-design-app/src/features/canvas/hooks/useBOM.ts`
- All components in `file:hvac-design-app/src/features/canvas/components/`

**Delete** (after migration):
- `file:hvac-design-app/src/core/store/catalogStore.ts`
- `file:hvac-design-app/src/core/store/serviceStore.ts`
- `file:hvac-design-app/src/core/store/componentLibraryStore.ts` (old version)

## Acceptance Criteria

- [ ] All references to old stores updated to new store
- [ ] No import errors or type errors
- [ ] Application builds successfully
- [ ] Existing functionality works with new store (component selection, BOM generation)
- [ ] Old store files removed from codebase
- [ ] Feature flag allows toggling between old and new stores during transition
- [ ] Integration tests pass with new store

## Dependencies

- **Requires**: Phase 1.1 (new store must exist)
- **Requires**: Phase 1.4 (migration infrastructure for data migration)

## Technical Notes

**Migration Checklist**:
- [ ] Search codebase for `useCatalogStore` → replace with `useComponentLibraryStoreV2`
- [ ] Search codebase for `useServiceStore` → replace with `useComponentLibraryStoreV2`
- [ ] Search codebase for `useComponentLibraryStore` → replace with `useComponentLibraryStoreV2`
- [ ] Update type imports from old schemas to new unified schema
- [ ] Test each updated file individually
- [ ] Run full test suite
