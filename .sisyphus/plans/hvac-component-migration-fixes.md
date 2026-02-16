# HVAC Component Library V2 & Migration Wizard Fixes

## TL;DR

> **Quick Summary**: Fix two critical issues: (1) Component library V2 is never initialized, leaving Services panel empty and tools without active components, and (2) Migration Wizard only works with in-memory data and requires a hard reload.
>
> **Deliverables**:
> - [1] V2 store initializer that seeds components from legacy serviceStore with persistence
> - [2] Default active component set on bootstrap to prevent null `getActiveComponent()`
> - [3] Migration Wizard updated to load from persisted projects, not just in-memory stores
> - [4] Auto-detection of legacy data versions during app/project load
> - [5] Store rehydration from migrated payload without hard reload
>
> **Estimated Effort**: Medium
> **Parallel Execution**: NO - Sequential (Comment 1 first, then Comment 2 due to overlapping concerns)
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4

---

## Context

### Original Request
Two verification comments require implementation:
1. **Component library V2 initialization**: The V2 store is created but never populated with baseline components
2. **Migration Wizard improvements**: Currently only works with in-memory data and forces a hard reload

### Interview Summary
**Key Discussions**:
- Implementation must follow verbatim instructions in verification comments
- Both fixes affect the same core areas (store initialization, project loading)
- Changes must be backwards compatible

**Research Findings**:
- `componentLibraryStoreV2.ts` has empty `components: []` in initialState (line 74)
- `serviceStore.ts` contains 4 baseline ServiceTemplates ready to be converted
- `adaptServiceToComponent()` function exists for conversion
- `VersionDetector.ts` has `detectVersion()` and `needsMigration()` methods
- `FileMenu.tsx` passes `buildProjectFileFromStores()` to MigrationWizard (in-memory data)
- MigrationWizard uses `window.location.reload()` for rehydration (line 619 in FileMenu.tsx)

### Metis Review
**Identified Gaps** (addressed in plan):
- Store persistence strategy: Use zustand's persist middleware with localStorage
- Default component selection: Use first converted service (LOW_PRESSURE_SUPPLY)
- Auto-detection timing: Check version during AppInitializer storage initialization
- Store rehydration: Replace hard reload with direct store hydration from migrated data

---

## Work Objectives

### Core Objective
Implement both verification comments verbatim: initialize component library V2 with converted legacy services and fix Migration Wizard to work with persisted projects without requiring hard reloads.

### Concrete Deliverables
1. `componentLibraryStoreV2.ts`: Add persist middleware and initialization logic
2. `CanvasPage.tsx`: Add V2 store initialization on mount
3. `componentServiceInterop.ts` (if needed): Export initialization helper
4. `AppInitializer.tsx`: Add legacy version detection and auto-migration trigger
5. `FileMenu.tsx`: Update MigrationWizard integration for persisted projects
6. `MigrationWizard.tsx`: Add rehydration method for stores

### Definition of Done
- [ ] ServicesPanel displays components without requiring user interaction
- [ ] Canvas tools (DuctTool, EquipmentTool, FittingTool) have non-null `getActiveComponent()`
- [ ] V2 components persist across page reloads
- [ ] Legacy projects auto-detect and trigger MigrationWizard
- [ ] Migration Wizard works from dashboard (loads persisted project data)
- [ ] After migration, stores rehydrate without `window.location.reload()`

### Must Have
- Baseline components from serviceStore converted and seeded
- Default active component automatically set
- Persist middleware for V2 store
- Version detection on app/project load
- Auto-open MigrationWizard for legacy versions
- Store rehydration without hard reload

### Must NOT Have (Guardrails)
- Do NOT modify serviceStore structure (only read from it)
- Do NOT break existing project load flow
- Do NOT require manual user action before seeing components
- Do NOT change MigrationWizard UI/UX, only data loading
- Do NOT break existing canvas tool behavior (maintain compatibility)

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (Vitest configured)
- **Automated tests**: Tests-after (add verification tests as part of implementation)
- **Framework**: vitest

### Agent-Executed QA Scenarios (MANDATORY - ALL tasks)

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Add persist middleware to componentLibraryStoreV2
└── Task 2: Add store hydration from migrated data in MigrationWizard

Wave 2 (After Wave 1):
├── Task 3: Add V2 store initialization on CanvasPage mount
└── Task 4: Update FileMenu.tsx MigrationWizard integration

Wave 3 (After Wave 2):
└── Task 5: Add legacy version detection in AppInitializer

Wave 4 (After Wave 3):
└── Task 6: Integration testing and verification

Critical Path: Task 1 → Task 3 → Task 5 → Task 6
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3 | 2 |
| 2 | None | 4 | 1 |
| 3 | 1 | 5, 6 | 4 |
| 4 | 2 | 5 | 3 |
| 5 | 3, 4 | 6 | None |
| 6 | 1, 2, 3, 4, 5 | None | None |

---

## TODOs

### Task 1: Add Persist Middleware to componentLibraryStoreV2

**What to do**:
1. Import `persist` middleware from zustand/middleware
2. Wrap the store creation with persist middleware
3. Configure storage to use localStorage
4. Add name: 'component-library-v2' for the storage key
5. Partialize state to persist: components, categories, templates, activeComponentId
6. Add migration/merge strategy for persisted state

**Must NOT do**:
- Do NOT persist ephemeral state (isLoading, error, searchQuery, filterTags, hoverComponentId)
- Do NOT change the store interface or API
- Do NOT remove immer middleware (compose with persist)

**Recommended Agent Profile**:
- **Category**: `quick` (single-file middleware addition)
- **Skills**: [`typescript`, `zustand`]
- **Skills Evaluated but Omitted**: `frontend-ui-ux` (no UI changes)

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with Task 2)
- **Blocks**: Task 3 (initialization needs persistence)
- **Blocked By**: None (can start immediately)

**References** (CRITICAL):
- `componentLibraryStoreV2.ts:1-310` - Current store implementation
- `zustand/middleware` - Persist middleware API
- `serviceStore.ts:1-227` - Baseline templates to seed from

**Acceptance Criteria**:
- [ ] Store is wrapped with persist middleware
- [ ] Storage key is 'component-library-v2'
- [ ] Only `components`, `categories`, `templates`, `activeComponentId`, `isEnabled` are persisted
- [ ] Ephemeral state is NOT persisted
- [ ] npm test passes (existing tests)

**Agent-Executed QA Scenarios**:
```
Scenario: Store persists to localStorage
  Tool: Bash (curl)
  Preconditions: None
  Steps:
    1. Check localStorage key 'component-library-v2' exists after app load
    2. Verify JSON structure includes components array
    3. Reload page and verify components are restored
  Expected Result: localStorage contains persisted component data
  Evidence: Terminal output showing localStorage contents
```

**Commit**: YES
- Message: `feat(store): add persist middleware to componentLibraryStoreV2`
- Files: `src/core/store/componentLibraryStoreV2.ts`

---

### Task 2: Add Store Hydration from Migrated Data in MigrationWizard

**What to do**:
1. Add `onRehydrateStores: (data: ProjectFile) => void` prop to MigrationWizard
2. In MigrationWizard, call `onRehydrateStores` instead of `onMigrationComplete` when migration succeeds
3. Implement rehydration logic that sets stores directly from migrated data:
   - `entityStore.hydrate(migratedData.entities)`
   - `componentLibraryStoreV2` - set components from migratedData.components
   - `settingsStore` - apply settings from migratedData
   - Any other stores that need hydration
4. Keep `onMigrationComplete` for backwards compatibility if needed

**Must NOT do**:
- Do NOT remove `onMigrationComplete` prop entirely (may break other usages)
- Do NOT change the UI or flow of MigrationWizard
- Do NOT skip the migration steps (backup, migrate, review)

**Recommended Agent Profile**:
- **Category**: `quick` (single-file prop addition and callback)
- **Skills**: [`typescript`, `react`]
- **Skills Evaluated but Omitted**: `frontend-ui-ux` (no UI changes)

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with Task 1)
- **Blocks**: Task 4 (FileMenu needs new prop)
- **Blocked By**: None (can start immediately)

**References**:
- `MigrationWizard.tsx:1-427` - Current wizard implementation
- `entityStore.ts` - hydrate method pattern
- `useAutoSave.ts` - store hydration patterns used in project loading

**Acceptance Criteria**:
- [ ] MigrationWizard has new `onRehydrateStores` prop
- [ ] Prop is called with migrated data after successful migration
- [ ] Existing `onMigrationComplete` still works
- [ ] All stores can be rehydrated from the prop callback

**Agent-Executed QA Scenarios**:
```
Scenario: Migration wizard calls rehydrate callback
  Tool: Playwright (playwright skill)
  Preconditions: App running with legacy project
  Steps:
    1. Trigger MigrationWizard open
    2. Complete migration flow
    3. Verify onRehydrateStores callback is invoked with migrated data
  Expected Result: Callback receives ProjectFile-shaped data
  Evidence: Console log or test assertion
```

**Commit**: YES (groups with Task 1)
- Message: `feat(wizard): add store rehydration callback to MigrationWizard`
- Files: `src/components/dialogs/MigrationWizard.tsx`

---

### Task 3: Add V2 Store Initialization on CanvasPage Mount

**What to do**:
1. In `CanvasPage.tsx`, add useEffect for initialization:
   - Check if `componentLibraryStoreV2` components array is empty
   - If empty, convert services from `serviceStore.baselineTemplates` using `adaptServiceToComponent()`
   - Add each converted component to V2 store via `addComponent()`
   - Set first component as active via `activateComponent()`
   - Set `isEnabled = true`
2. Create a helper function `initializeComponentLibraryV2()` in a new file or inline
3. Ensure initialization only runs once (use ref or check state)

**Must NOT do**:
- Do NOT modify serviceStore (read-only)
- Do NOT seed if components already exist (preserve user data)
- Do NOT run initialization repeatedly (use useEffect with empty deps + ref check)

**Recommended Agent Profile**:
- **Category**: `quick` (single-file hook addition)
- **Skills**: [`typescript`, `react`]
- **Skills Evaluated but Omitted**: `frontend-ui-ux` (no UI changes)

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 2
- **Blocks**: Task 5, Task 6
- **Blocked By**: Task 1 (needs persistence configured)

**References**:
- `CanvasPage.tsx:1-247` - Current page implementation
- `componentServiceInterop.ts:128-173` - adaptServiceToComponent function
- `serviceStore.ts:17-90` - baseline templates to convert

**Acceptance Criteria**:
- [ ] useEffect checks if components array is empty
- [ ] If empty, converts serviceStore.baselineTemplates to V2 components
- [ ] Sets first converted component as active
- [ ] Sets isEnabled = true
- [ ] Only runs once per app lifecycle

**Agent-Executed QA Scenarios**:
```
Scenario: ServicesPanel shows seeded components
  Tool: Playwright (playwright skill)
  Preconditions: Fresh app start (no persisted components)
  Steps:
    1. Navigate to canvas page
    2. Open ServicesPanel (if not visible by default)
    3. Verify at least 4 service cards are displayed
    4. Verify first card is marked as "Active"
  Expected Result: ServicesPanel shows baseline services with active state
  Evidence: Screenshot: .sisyphus/evidence/task-3-services-panel.png
```

**Commit**: YES
- Message: `feat(canvas): initialize component library V2 on page mount`
- Files: `src/features/canvas/CanvasPage.tsx`

---

### Task 4: Update FileMenu.tsx MigrationWizard Integration

**What to do**:
1. In `handleMigration` function:
   - Check if on canvas route (`isCanvasRoute`)
   - If on canvas: use current `buildProjectFileFromStores()` (existing behavior)
   - If NOT on canvas: load from repository/file picker
     - Show file picker dialog
     - Load selected project file
     - Pass loaded data to MigrationWizard
2. Add state to track loaded project data when not on canvas
3. Update `onMigrationComplete` handler:
   - Replace `window.location.reload()` with store rehydration
   - Use the new `onRehydrateStores` prop from Task 2
   - After rehydration, navigate to canvas with the migrated project ID

**Must NOT do**:
- Do NOT break existing canvas migration flow
- Do NOT change the menu item text or position
- Do NOT skip file picker for non-canvas routes

**Recommended Agent Profile**:
- **Category**: `unspecified-low` (medium complexity, single file)
- **Skills**: [`typescript`, `react`]

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 2
- **Blocks**: Task 5
- **Blocked By**: Task 2 (needs onRehydrateStores prop)

**References**:
- `FileMenu.tsx:311-317` - handleMigration function
- `FileMenu.tsx:589-629` - MigrationWizard component usage
- `FileMenu.tsx:83-172` - file picker pattern (handleOpenFromFileInternal)

**Acceptance Criteria**:
- [ ] handleMigration checks isCanvasRoute
- [ ] On canvas: uses buildProjectFileFromStores()
- [ ] Off canvas: shows file picker and loads selected project
- [ ] MigrationWizard receives correct data in both cases
- [ ] onMigrationComplete uses rehydration instead of reload
- [ ] Navigates to canvas after migration

**Agent-Executed QA Scenarios**:
```
Scenario: Migration from dashboard loads file picker
  Tool: Playwright (playwright skill)
  Preconditions: App on dashboard route with ENABLE_MIGRATION_WIZARD=true
  Steps:
    1. Click File menu
    2. Click "Migrate Data"
    3. Verify file picker opens (not MigrationWizard yet)
    4. Select legacy project file
    5. Verify MigrationWizard opens with selected file data
  Expected Result: File picker shown first, then wizard with correct data
  Evidence: Screenshot: .sisyphus/evidence/task-4-dashboard-migration.png
```

**Commit**: YES
- Message: `feat(filemenu): update migration to work from dashboard with file picker`
- Files: `src/components/layout/FileMenu.tsx`

---

### Task 5: Add Legacy Version Detection in AppInitializer

**What to do**:
1. Add state for `showMigrationWizard` and `migrationData`
2. During storage initialization (`performStorageInitialization`):
   - After storage is ready, check if there's a "current project" being loaded
   - If loading a project, use `VersionDetector.detectVersion()` on the loaded data
   - If `VersionDetector.needsMigration()` returns true:
     - Set `migrationData` with the loaded project
     - Set `showMigrationWizard = true`
3. Add MigrationWizard rendering in AppInitializer when `showMigrationWizard` is true
4. Add `onMigrationComplete` handler that:
   - Rehydrates stores from migrated data
   - Sets `showMigrationWizard = false`
   - Navigates to canvas

**Must NOT do**:
- Do NOT block app initialization waiting for migration
- Do NOT auto-migrate without user confirmation (show wizard)
- Do NOT check version on every render (only during project load)

**Recommended Agent Profile**:
- **Category**: `unspecified-low` (medium complexity)
- **Skills**: [`typescript`, `react`]

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 3
- **Blocks**: Task 6
- **Blocked By**: Task 3, Task 4 (needs initialization and rehydration patterns)

**References**:
- `AppInitializer.tsx:1-366` - Current initialization flow
- `VersionDetector.ts:76-102` - detectVersion and needsMigration methods
- `AppInitializer.tsx:194-217` - performStorageInitialization function

**Acceptance Criteria**:
- [ ] Version detection happens during project load
- [ ] If legacy version detected, MigrationWizard auto-opens
- [ ] MigrationWizard receives the loaded project data
- [ ] After migration, stores rehydrate and app navigates to canvas
- [ ] If no migration needed, app starts normally

**Agent-Executed QA Scenarios**:
```
Scenario: Auto-detection triggers migration for legacy project
  Tool: Playwright (playwright skill)
  Preconditions: App with legacy v1 project file available
  Steps:
    1. Open legacy project
    2. Verify AppInitializer detects legacy version
    3. Verify MigrationWizard auto-opens
    4. Complete migration
    5. Verify canvas loads with migrated data
  Expected Result: Legacy project auto-triggers migration flow
  Evidence: Screenshot: .sisyphus/evidence/task-5-auto-migration.png
```

**Commit**: YES
- Message: `feat(initializer): add auto-detection and migration for legacy projects`
- Files: `src/components/onboarding/AppInitializer.tsx`

---

### Task 6: Integration Testing and Verification

**What to do**:
1. Run existing tests to ensure no regressions: `npm test`
2. Verify ServicesPanel displays components after Task 3
3. Verify tools have active component after initialization
4. Test migration from canvas (existing flow)
5. Test migration from dashboard (new flow)
6. Test auto-detection on legacy project load
7. Test persistence: reload page and verify components survive

**Must NOT do**:
- Do NOT skip existing tests
- Do NOT commit with failing tests
- Do NOT rely on manual testing only

**Recommended Agent Profile**:
- **Category**: `quick` (verification only)
- **Skills**: [`vitest`, `playwright`]

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 4 (final)
- **Blocks**: None (final task)
- **Blocked By**: Task 1, 2, 3, 4, 5 (all previous tasks)

**Acceptance Criteria**:
- [ ] All existing tests pass
- [ ] ServicesPanel shows components on fresh load
- [ ] DuctTool, EquipmentTool, FittingTool have non-null active component
- [ ] Components persist across page reload
- [ ] Migration works from dashboard (loads file picker)
- [ ] Auto-detection works on legacy project load
- [ ] No hard reload after migration (smooth transition)

**Agent-Executed QA Scenarios**:
```
Scenario: Full integration test
  Tool: Playwright (playwright skill)
  Preconditions: Clean environment with legacy project file
  Steps:
    1. Start app
    2. Open legacy project
    3. Verify MigrationWizard opens automatically
    4. Complete migration
    5. Verify canvas loads
    6. Verify ServicesPanel shows components
    7. Reload page
    8. Verify components persist
  Expected Result: End-to-end flow works seamlessly
  Evidence: Multiple screenshots at each step
```

**Commit**: NO (verification only)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 & 2 | `feat(store,wizard): add persist to V2 store and rehydration callback` | componentLibraryStoreV2.ts, MigrationWizard.tsx | npm test |
| 3 | `feat(canvas): initialize component library V2 on mount` | CanvasPage.tsx | npm test, manual check ServicesPanel |
| 4 | `feat(filemenu): update migration for dashboard file picker` | FileMenu.tsx | npm test, manual migration test |
| 5 | `feat(initializer): auto-detect legacy versions and trigger migration` | AppInitializer.tsx | npm test, full integration test |

---

## Success Criteria

### Verification Commands
```bash
# Run all tests
npm test

# Type check
npm run type-check

# Build check
npm run build
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] ServicesPanel shows components without user action
- [ ] Tools have non-null active component
- [ ] Components persist across reloads
- [ ] Migration works from dashboard
- [ ] Auto-detection works on legacy load
- [ ] No hard reload after migration

---

## Implementation Notes

### Key Code Patterns

**Persist Middleware Setup** (Task 1):
```typescript
import { persist } from 'zustand/middleware';

export const useComponentLibraryStoreV2 = create<ComponentLibraryState>()(
  persist(
    immer((set, get) => ({
      // ... store implementation
    })),
    {
      name: 'component-library-v2',
      partialize: (state) => ({
        components: state.components,
        categories: state.categories,
        templates: state.templates,
        activeComponentId: state.activeComponentId,
        isEnabled: state.isEnabled,
      }),
    }
  )
);
```

**V2 Store Initialization** (Task 3):
```typescript
// In CanvasPage.tsx
useEffect(() => {
  const { components, addComponent, activateComponent, setEnabled } = 
    useComponentLibraryStoreV2.getState();
  
  // Only seed if empty
  if (components.length === 0) {
    const { baselineTemplates } = useServiceStore.getState();
    
    baselineTemplates.forEach((template, index) => {
      const component = adaptServiceToComponent(template as Service);
      addComponent(component);
      
      // Set first as active
      if (index === 0) {
        activateComponent(component.id);
      }
    });
    
    setEnabled(true);
  }
}, []);
```

**Store Rehydration** (Task 2, 4, 5):
```typescript
// In MigrationWizard or consuming component
const handleRehydrateStores = (migratedData: ProjectFile) => {
  // Rehydrate entity store
  useEntityStore.getState().hydrate(
    migratedData.entities.allIds.map(id => migratedData.entities.byId[id]),
    migratedData.activeServiceId
  );
  
  // Rehydrate V2 component library
  useComponentLibraryStoreV2.setState({
    components: migratedData.components || [],
    activeComponentId: migratedData.activeComponentId || null,
  });
  
  // Apply settings
  if (migratedData.settings) {
    useSettingsStore.getState().setCalculationSettings(migratedData.settings);
  }
};
```

**Version Detection** (Task 5):
```typescript
// In AppInitializer during project load
const version = VersionDetector.detectVersion(projectData);
if (VersionDetector.needsMigration(version)) {
  setMigrationData(projectData);
  setShowMigrationWizard(true);
}
```
