# V2 Component Library Migration Plan

## Overview
Comprehensive migration plan to ensure the entire app uses version2 (V2) of the component library store exclusively.

## Current State Analysis

### Legacy Stores Still in Use:
1. **serviceStore.ts** - Still imported by:
   - `settingsStore.ts` (line 5)
   - `ServiceEditor.tsx` (line 8)

2. **catalogStore.ts** - Potentially still referenced

3. **componentLibraryStore.ts** (old) - Potentially still referenced

### Files Already Using V2 (Correct):
- All canvas tools (DuctTool, EquipmentTool, FittingTool)
- Library components (LibraryBrowserPanel, LibraryManagementView, ComponentBrowser)
- BOM and validation features
- Service interop layer (componentServiceInterop.ts)
- UnifiedComponentBrowser

## Migration Strategy

### Phase 1: Identify All Legacy Usage
**Goal**: Find every file importing from legacy stores
**Files to Check**:
- src/core/store/settingsStore.ts
- src/features/canvas/components/ServiceEditor.tsx
- Any other files importing useServiceStore
- Any files importing useCatalogStore
- Any files importing useComponentLibraryStore (old)

### Phase 2: Migrate settingsStore.ts
**Current Issue**: Uses `useServiceStore.getState()` at line 146
**Solution**:
- Replace serviceStore usage with componentLibraryStoreV2
- Map service concepts to V2 unified components
- Update validation logic to work with V2 store

### Phase 3: Migrate ServiceEditor.tsx
**Current Issue**: Uses serviceStore hooks for services/templates
**Solution**:
- Replace useServiceStore with useComponentLibraryStoreV2
- Adapt UI to work with UnifiedComponentDefinition
- Map service properties to component properties

### Phase 4: Migrate Remaining Components
**Files to Check**:
- Any other files using legacy stores
- Update imports and type references
- Ensure V2 store methods are used correctly

### Phase 5: Cleanup
- Remove legacy store exports from index.ts
- Keep legacy store files only for backward compatibility (if needed by migrations)
- Update all type imports to use UnifiedComponentDefinition

## Implementation Order

1. **Explore Phase**: Use explore agent to find ALL files using legacy stores
2. **Migrate settingsStore.ts**: Update to use V2 store
3. **Migrate ServiceEditor.tsx**: Update to use V2 store
4. **Verify All Other Files**: Ensure no legacy store usage remains
5. **Cleanup**: Remove exports, update types

## Verification Criteria

- [ ] No imports from `@/core/store/serviceStore` (except in migration code)
- [ ] No imports from `@/core/store/catalogStore` (except in migration code)
- [ ] No imports from `@/core/store/componentLibraryStore` (old)
- [ ] settingsStore.ts uses V2 store
- [ ] ServiceEditor.tsx uses V2 store
- [ ] All canvas tools use V2 store
- [ ] Type check passes for all migrated files
- [ ] Tests updated to use V2 mocks

## Risk Mitigation

1. **Backward Compatibility**: Keep legacy store files for project migration support
2. **Service Interop**: The componentServiceInterop.ts already adapts V2 to Service interface
3. **Testing**: Update all mocks to use V2 store structure

## Success Metrics

- Zero runtime dependencies on legacy stores
- All new code uses componentLibraryStoreV2
- TypeScript type check passes
- Application builds successfully
