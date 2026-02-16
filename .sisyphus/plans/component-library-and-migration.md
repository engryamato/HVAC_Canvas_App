# Work Plan: Component Library V2 Initialization and Migration Wizard Fixes

## TL;DR

**Objective**: Fix two critical issues:
1. **Comment 1**: Component library V2 is never populated with baseline duct/equipment/fitting components, leaving Services panel empty and tools without an active service/component
2. **Comment 2**: Migration Wizard only operates on in-memory canvas data and is unusable from dashboard or for persisted projects

**Key Changes**:
- Create `initializeComponentLibraryV2()` function to seed V2 store from legacy `serviceStore` baseline templates
- Add persistence support to `componentLibraryStoreV2` using Zustand persist middleware
- Auto-activate first component after seeding to ensure tools have an active component
- Modify `FileMenu` to pass persisted project data (not `{}`) to `MigrationWizard`
- Add version detection during project load in `AppInitializer` or repository
- Auto-open `MigrationWizard` when legacy data detected
- Rehydrate stores from migrated payload instead of hard-reloading

**Effort**: Medium (2-3 focused tasks)

---

## Context

### Comment 1: Empty Component Library V2

**Current State**:
- `componentLibraryStoreV2.ts` defines a store with `components: []` as initial state (line 74)
- `ServicesPanel.tsx` reads from V2 store and filters components with `systemType` (line 21)
- Tools (`DuctTool.ts`, `EquipmentTool.ts`, `FittingTool.ts`) call `getActiveComponent()` which returns `undefined` when no components exist
- Legacy `serviceStore.ts` has baseline templates (`LOW_PRESSURE_SUPPLY`, `MEDIUM_PRESSURE_SUPPLY`, `LOW_PRESSURE_RETURN`, `EXHAUST_AIR`) that are never migrated to V2
- `adaptServiceToComponent()` function exists in `componentServiceInterop.ts` but is unused for seeding

**Problem**: Users see empty Services panel and tools cannot function without an active component

**Required Solution**:
1. Initialize V2 store with baseline components converted from legacy service templates
2. Persist V2 state so components survive reloads
3. Set default active component after seeding

### Comment 2: Migration Wizard Limitations

**Current State**:
- `FileMenu.tsx` line 593: `data={migrationWizardOpen ? buildProjectFileFromStores() : {}}` - only passes in-memory data
- `MigrationWizard.tsx` operates on the `data` prop which is `{}` when not on canvas
- No version detection during app/project load
- `onMigrationComplete` (line 594-628) does hard reload: `window.location.reload()`
- Project loading in `CanvasPageWrapper.tsx` and `ProjectRepository.ts` doesn't check for legacy versions

**Problem**: 
- Migration from dashboard opens wizard with empty data `{}`
- Persisted legacy projects load without migration
- Hard reload loses unsaved changes and is jarring UX

**Required Solution**:
1. Guard File menu "Migrate Data" to load selected/persisted project file instead of `{}`
2. Add version detection during app/project load using `VersionDetector`
3. Auto-open `MigrationWizard` when legacy version detected
4. Rehydrate stores from migrated payload instead of hard-reloading

---

## Execution Strategy

### Wave 1: Component Library V2 Initialization
**Parallel Tasks**: Tasks 1-3 can run in parallel after Task 0
**Dependencies**: None (can start immediately)

### Wave 2: Migration Wizard Enhancement
**Parallel Tasks**: Tasks 4-6 build on Wave 1
**Dependencies**: Requires Wave 1 completion

### Wave 3: Integration & Testing
**Sequential**: Task 7 integrates both features
**Dependencies**: Requires Wave 1 and Wave 2

---

## TODOs

### Task 0: Create Component Library V2 Initializer Utility

**What to do**:
Create a new utility function `initializeComponentLibraryV2()` that:
1. Imports baseline templates from `serviceStore.ts` (`INITIAL_TEMPLATES`)
2. Converts each template to `UnifiedComponentDefinition` using `adaptServiceToComponent()`
3. Checks if V2 store already has components (to avoid duplicate seeding)
4. Adds converted components to V2 store via `addComponent()`
5. Sets the first component as active via `activateComponent()`
6. Persists the seeded state

**Must NOT do**:
- Don't duplicate baseline templates - import from existing `serviceStore.ts`
- Don't overwrite existing custom components if user has already created some
- Don't activate a component if one is already active

**Recommended Agent Profile**:
- **Category**: `quick` - focused file creation and store integration
- **Skills**: None needed - straightforward Zustand store integration
- **Skills Evaluated but Omitted**: 
  - `frontend-ui-ux`: Not needed - this is a utility function, not UI
  - `vitest`: Tests are separate task

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1
- **Blocks**: Task 1, Task 2
- **Blocked By**: None

**References**:
- `src/core/store/serviceStore.ts:85-90` - `INITIAL_TEMPLATES` array with baseline service templates
- `src/core/services/componentServiceInterop.ts:128-173` - `adaptServiceToComponent()` function
- `src/core/store/componentLibraryStoreV2.ts:92-95` - `addComponent()` action
- `src/core/store/componentLibraryStoreV2.ts:249-252` - `activateComponent()` action
- `src/core/store/componentLibraryStoreV2.ts:259-262` - `getActiveComponent()` getter
- `src/core/schema/unified-component.schema.ts` - `UnifiedComponentDefinition` type

**Acceptance Criteria**:
- [ ] New file created: `src/core/store/componentLibraryInitializer.ts`
- [ ] Function `initializeComponentLibraryV2()` exported
- [ ] Imports `INITIAL_TEMPLATES` from `serviceStore.ts`
- [ ] Uses `adaptServiceToComponent()` to convert each template
- [ ] Checks `useComponentLibraryStoreV2.getState().components.length` before seeding
- [ ] Calls `addComponent()` for each converted template
- [ ] Calls `activateComponent()` with first component ID after seeding
- [ ] Code compiles without errors

**Agent-Executed QA Scenarios**:

Scenario: Initializer utility is created and callable
  Tool: Bash (curl/node REPL)
  Preconditions: Code is written and project builds
  Steps:
    1. Run: `cd hvac-design-app && bun build 2>&1 | head -50`
    2. Assert: No TypeScript errors in new file
    3. Run: `grep -n "initializeComponentLibraryV2" src/core/store/componentLibraryInitializer.ts`
    4. Assert: Function is defined and exported
    5. Run: `grep -n "adaptServiceToComponent" src/core/store/componentLibraryInitializer.ts`
    6. Assert: Function imports and uses the adapter
  Expected Result: Utility file exists, compiles, and uses correct imports
  Evidence: Terminal output showing successful build

---

### Task 1: Add Persistence to Component Library Store V2

**What to do**:
Modify `componentLibraryStoreV2.ts` to add Zustand persist middleware:
1. Import `persist` from `zustand/middleware`
2. Wrap store creation with `persist()` middleware
3. Configure persist with:
   - `name: 'sws.componentLibrary.v2'` (storage key)
   - `partialize` to only persist: `components`, `categories`, `templates`, `activeComponentId`
   - `skipHydration: false` to allow SSR safety
4. Ensure store properly rehydrates from persisted state on app load

**Must NOT do**:
- Don't persist transient state: `isLoading`, `error`, `searchQuery`, `filterTags`, `hoverComponentId`
- Don't change the store API - all existing methods should work unchanged

**Recommended Agent Profile**:
- **Category**: `quick` - single file modification with well-known pattern
- **Skills**: None needed - standard Zustand persist pattern

**Parallelization**:
- **Can Run In Parallel**: YES (with Task 0, after Task 0 creates initializer)
- **Parallel Group**: Wave 1
- **Blocks**: Task 2
- **Blocked By**: Task 0 (conceptually, but technically independent)

**References**:
- `src/core/store/settingsStore.ts:1-10` - Example of persist middleware import and usage
- `src/core/store/storageStore.ts:74-108` - Example with partialize and rehydration
- `src/core/store/componentLibraryStoreV2.ts:88-305` - Store to modify
- `src/core/store/componentLibraryStoreV2.ts:73-86` - Initial state (reference for what to persist)

**Acceptance Criteria**:
- [ ] `persist` imported from `zustand/middleware`
- [ ] Store wrapped with `persist()` middleware
- [ ] `name` set to `'sws.componentLibrary.v2'`
- [ ] `partialize` function returns only: `{ components, categories, templates, activeComponentId }`
- [ ] Store exports `useComponentLibraryStoreV2` with persistence
- [ ] TypeScript types are preserved
- [ ] Code compiles without errors

**Agent-Executed QA Scenarios**:

Scenario: Store persists and rehydrates correctly
  Tool: Playwright (playwright skill) - or Bash for unit test
  Preconditions: Store modified and built
  Steps:
    1. If unit test exists: Run `bun test src/core/store/__tests__/componentLibraryStoreV2.test.ts`
    2. Assert: Tests pass with persistence
    3. Check localStorage key manually:
       - Run: `grep -A 5 "name:" src/core/store/componentLibraryStoreV2.ts`
       - Assert: Contains `'sws.componentLibrary.v2'`
    4. Verify partialize:
       - Run: `grep -A 10 "partialize" src/core/store/componentLibraryStoreV2.ts`
       - Assert: Only persists required fields
  Expected Result: Store has persistence configured correctly
  Evidence: Test output or grep results

---

### Task 2: Integrate Initializer into CanvasPage/AppInitializer

**What to do**:
Call `initializeComponentLibraryV2()` during app/canvas bootstrap:
1. Import `initializeComponentLibraryV2` in `CanvasPageWrapper.tsx`
2. Call initializer in a `useEffect` that runs once on mount (before project loading)
3. Alternative: Add to `AppInitializer.tsx` integrity checks phase
4. Ensure initializer only runs on client-side (`typeof window !== 'undefined'`)

**Must NOT do**:
- Don't call initializer on server-side (Next.js SSR)
- Don't block project loading on initialization (use async/non-blocking pattern)
- Don't re-run initializer if already seeded (the initializer function handles this)

**Recommended Agent Profile**:
- **Category**: `quick` - simple integration
- **Skills**: None needed

**Parallelization**:
- **Can Run In Parallel**: NO (depends on Task 0 and Task 1)
- **Parallel Group**: Wave 1
- **Blocks**: None
- **Blocked By**: Task 0, Task 1

**References**:
- `src/features/canvas/CanvasPageWrapper.tsx:47-48` - Component function entry point
- `src/features/canvas/CanvasPageWrapper.tsx:101-238` - useEffect for project loading
- `src/components/onboarding/AppInitializer.tsx:114-130` - Integrity checks phase
- `src/components/onboarding/AppInitializer.tsx:219-299` - `performIntegrityChecks()` function

**Acceptance Criteria**:
- [ ] `initializeComponentLibraryV2` imported in `CanvasPageWrapper.tsx`
- [ ] useEffect added in `CanvasPageWrapper.tsx` to call initializer
- [ ] useEffect runs once (empty dependency array or proper guards)
- [ ] Client-side check: `typeof window !== 'undefined'`
- [ ] Code compiles without errors

**Agent-Executed QA Scenarios**:

Scenario: Initializer is called during canvas page load
  Tool: Playwright (playwright skill)
  Preconditions: All tasks complete, app built and running
  Steps:
    1. Navigate to: `/canvas/test-project`
    2. Wait for: page to load (timeout: 10s)
    3. Open browser DevTools Console
    4. Run: `localStorage.getItem('sws.componentLibrary.v2')`
    5. Assert: Returns non-null string with components array
    6. Parse and verify: JSON.parse(result).state.components.length >= 4
  Expected Result: Components are persisted to localStorage after page load
  Evidence: Screenshot of console showing localStorage contents

---

### Task 3: Modify FileMenu to Load Project Data for Migration

**What to do**:
Modify `FileMenu.tsx` to load persisted project data for migration wizard:
1. Create helper function `loadProjectDataForMigration()` that:
   - Checks if currently on canvas route (`isCanvasRoute`)
   - If on canvas: uses `buildProjectFileFromStores()` (existing behavior)
   - If on dashboard: shows project picker or uses last active project
   - Loads project data from `ProjectRepository` or `loadProjectFromStorage`
2. Update `handleMigration()` to call helper and pass data to wizard
3. Update `MigrationWizard` props to handle loading state

**Must NOT do**:
- Don't change the wizard component props interface drastically
- Don't break existing in-memory canvas migration flow
- Don't auto-migrate without user confirmation

**Recommended Agent Profile**:
- **Category**: `unspecified-medium` - involves async project loading
- **Skills**: None needed

**Parallelization**:
- **Can Run In Parallel**: NO (Wave 2 start)
- **Parallel Group**: Wave 2
- **Blocks**: Task 4
- **Blocked By**: Wave 1 tasks

**References**:
- `src/components/layout/FileMenu.tsx:311-317` - `handleMigration()` function
- `src/components/layout/FileMenu.tsx:54` - `isCanvasRoute` check
- `src/components/layout/FileMenu.tsx:589-628` - `MigrationWizard` usage with `buildProjectFileFromStores()`
- `src/core/persistence/ProjectRepository.ts:82-155` - `loadProject()` method
- `src/features/canvas/hooks/useAutoSave.ts:492-539` - `loadProjectFromStorage()` function
- `src/components/layout/FileMenu.tsx:123-171` - `handleOpenFromFileInternal()` - pattern for loading projects

**Acceptance Criteria**:
- [ ] Helper function `loadProjectDataForMigration()` created in `FileMenu.tsx`
- [ ] Function checks `isCanvasRoute` to determine data source
- [ ] If on dashboard: loads from repository or storage
- [ ] If on canvas: uses `buildProjectFileFromStores()`
- [ ] `handleMigration()` updated to use helper
- [ ] Handles loading errors gracefully
- [ ] Code compiles without errors

**Agent-Executed QA Scenarios**:

Scenario: Migration loads persisted project from dashboard
  Tool: Playwright (playwright skill)
  Preconditions: App running with at least one saved project
  Steps:
    1. Navigate to: `/dashboard`
    2. Click: File menu button
    3. Click: "Migrate Data" option
    4. Wait for: MigrationWizard to open (timeout: 5s)
    5. Assert: Wizard shows detection step, not empty error
    6. Check: `data` prop passed to wizard is not `{}`
  Expected Result: Migration wizard receives project data from persisted storage
  Evidence: Screenshot of wizard open on dashboard

---

### Task 4: Add Version Detection During Project Load

**What to do**:
Add automatic version detection when projects are loaded:
1. Modify `CanvasPageWrapper.tsx` to use `VersionDetector` on loaded project data
2. OR modify `ProjectRepository.ts` `loadProject()` to return version info
3. If legacy version detected (`VersionDetector.needsMigration()` returns true):
   - Show migration dialog instead of loading project
   - Pass loaded data to migration wizard
4. Track migration state to prevent double-detection

**Must NOT do**:
- Don't block app initialization for version checks (async/non-blocking)
- Don't auto-migrate without user confirmation
- Don't lose loaded project data if migration is cancelled

**Recommended Agent Profile**:
- **Category**: `unspecified-medium` - async logic and state management
- **Skills**: None needed

**Parallelization**:
- **Can Run In Parallel**: NO (depends on Task 3)
- **Parallel Group**: Wave 2
- **Blocks**: Task 5
- **Blocked By**: Task 3

**References**:
- `src/core/services/migration/VersionDetector.ts:76-102` - `detectVersion()` method
- `src/core/services/migration/VersionDetector.ts:154-156` - `needsMigration()` method
- `src/features/canvas/CanvasPageWrapper.tsx:126-194` - Tauri project loading
- `src/features/canvas/CanvasPageWrapper.tsx:197-228` - LocalStorage project loading
- `src/components/dialogs/MigrationWizard.tsx:22-27` - Props interface

**Acceptance Criteria**:
- [ ] `VersionDetector` imported in `CanvasPageWrapper.tsx`
- [ ] Version detection added to project load flow
- [ ] If legacy detected: show migration wizard instead of canvas
- [ ] Loaded data passed to migration wizard
- [ ] State tracking to prevent double-detection
- [ ] Code compiles without errors

**Agent-Executed QA Scenarios**:

Scenario: Legacy project triggers migration dialog on load
  Tool: Playwright (playwright skill)
  Preconditions: App with legacy v1 project in storage
  Steps:
    1. Create/mock a v1 project in localStorage (no `_version` field, has `services` array)
    2. Navigate to: `/canvas/legacy-project-id`
    3. Wait for: page to attempt loading (timeout: 5s)
    4. Assert: MigrationWizard appears instead of canvas
    5. Assert: Wizard shows "Detecting Data Version" step
  Expected Result: Legacy project auto-triggers migration dialog
  Evidence: Screenshot showing MigrationWizard over dashboard or canvas

---

### Task 5: Update MigrationWizard to Rehydrate Stores (No Hard Reload)

**What to do**:
Modify `MigrationWizard.tsx` and `FileMenu.tsx` to rehydrate stores instead of reloading:
1. In `FileMenu.tsx` `onMigrationComplete` callback (line 594-628):
   - Remove: `window.location.reload()` (line 619)
   - Add: Store rehydration logic
2. Create `rehydrateStoresFromMigratedData(migratedData)` function that:
   - Calls `useEntityStore.getState().hydrate()` with migrated entities
   - Calls `useComponentLibraryStoreV2.getState()` actions to set components
   - Updates `useProjectStore` with migrated project metadata
3. Update `MigrationWizard.tsx` to support a `onRehydrate` callback prop

**Must NOT do**:
- Don't hard reload the page (this loses unsaved changes)
- Don't replace store instances (use existing store actions)
- Don't break existing migration flow for in-memory data

**Recommended Agent Profile**:
- **Category**: `unspecified-medium` - store rehydration logic
- **Skills**: None needed

**Parallelization**:
- **Can Run In Parallel**: NO (depends on Task 4)
- **Parallel Group**: Wave 2
- **Blocks**: Task 6
- **Blocked By**: Task 4

**References**:
- `src/components/layout/FileMenu.tsx:594-628` - Current `onMigrationComplete` with hard reload
- `src/core/store/entityStore.ts` - Look for `hydrate` method
- `src/features/canvas/CanvasPageWrapper.tsx:57-98` - `hydrateFromPayload()` example
- `src/core/store/componentLibraryStoreV2.ts:40-70` - Store actions for setting state
- `src/core/store/project.store.ts` - Project store actions

**Acceptance Criteria**:
- [ ] `window.location.reload()` removed from `FileMenu.tsx`
- [ ] `rehydrateStoresFromMigratedData()` function created
- [ ] Function calls entity store hydrate with migrated entities
- [ ] Function updates component library store with migrated components
- [ ] Function updates project store with migrated metadata
- [ ] Migration wizard closes cleanly after rehydration
- [ ] Code compiles without errors

**Agent-Executed QA Scenarios**:

Scenario: Migration completes without page reload
  Tool: Playwright (playwright skill)
  Preconditions: App running with legacy project
  Steps:
    1. Start migration from dashboard
    2. Complete migration wizard steps
    3. Click: "Complete" button
    4. Assert: Page does NOT reload (no navigation, no flicker)
    5. Assert: Canvas appears with migrated data
    6. Assert: Entities are visible on canvas
    7. Assert: Components are available in Services panel
  Expected Result: Migration completes and stores rehydrate without reload
  Evidence: Screenshot sequence or video showing smooth transition

---

### Task 6: Handle Dashboard-Initiated Migration Flow

**What to do**:
Ensure migration works smoothly when initiated from dashboard:
1. Update `FileMenu.tsx` to redirect to canvas after dashboard-initiated migration
2. OR update `MigrationWizard` to handle post-migration navigation
3. Ensure project list is refreshed after migration (if project metadata changed)
4. Handle case where migration creates a new project (update project index)

**Must NOT do**:
- Don't leave user on dashboard after successful migration
- Don't lose project list state
- Don't create duplicate project entries

**Recommended Agent Profile**:
- **Category**: `quick` - flow completion
- **Skills**: None needed

**Parallelization**:
- **Can Run In Parallel**: NO (depends on Task 5)
- **Parallel Group**: Wave 2
- **Blocks**: Task 7
- **Blocked By**: Task 5

**References**:
- `src/components/layout/FileMenu.tsx:174-186` - `proceedAfterSaveOrDiscard()` pattern
- `src/components/layout/FileMenu.tsx:282-309` - `handleProjectSetupComplete()` - project creation pattern
- `src/features/dashboard/store/projectListStore.ts` - Project list actions

**Acceptance Criteria**:
- [ ] Dashboard-initiated migration redirects to canvas on completion
- [ ] Project list is refreshed after migration
- [ ] No duplicate project entries created
- [ ] User lands on migrated project's canvas
- [ ] Code compiles without errors

**Agent-Executed QA Scenarios**:

Scenario: Dashboard migration redirects to canvas
  Tool: Playwright (playwright skill)
  Preconditions: App on dashboard with legacy project
  Steps:
    1. Navigate to: `/dashboard`
    2. Click: File menu → Migrate Data
    3. Select/confirm legacy project
    4. Complete migration wizard
    5. Assert: URL changes to `/canvas/{projectId}`
    6. Assert: Canvas loads with migrated entities
  Expected Result: User redirected to canvas after dashboard migration
  Evidence: Screenshot of final canvas state

---

### Task 7: Integration Testing and Verification

**What to do**:
Run end-to-end verification of both features:
1. Clear localStorage/indexedDB to simulate fresh install
2. Open canvas page - verify baseline components appear in Services panel
3. Verify tools can select and use components
4. Create/save a project with entities
5. Simulate legacy version by modifying stored data
6. Reload and verify migration dialog appears
7. Complete migration and verify data is preserved
8. Verify no page reload occurred during migration

**Must NOT do**:
- Don't skip testing both fresh seeding and persistence scenarios
- Don't skip testing both canvas and dashboard migration entry points

**Recommended Agent Profile**:
- **Category**: `unspecified-low` - verification only
- **Skills**: `playwright` - for E2E verification

**Parallelization**:
- **Can Run In Parallel**: NO (final integration)
- **Parallel Group**: Wave 3
- **Blocks**: None
- **Blocked By**: All previous tasks

**References**:
- All files from previous tasks
- `src/features/canvas/components/ServicesPanel.tsx` - Verification target
- `src/features/canvas/tools/DuctTool.ts` - Tool verification

**Acceptance Criteria**:
- [ ] Fresh install: Services panel shows 4 baseline services
- [ ] Tools can select and use active component
- [ ] Legacy project: Migration dialog appears on load
- [ ] Migration completes without page reload
- [ ] Migrated data appears correctly on canvas
- [ ] No console errors during any scenario

**Agent-Executed QA Scenarios**:

Scenario: Full integration test - fresh install to migration
  Tool: Playwright (playwright skill)
  Preconditions: Clean browser state (fresh install simulation)
  Steps:
    1. Clear localStorage: `localStorage.clear()`
    2. Navigate to: `/canvas/new-project`
    3. Assert: Services panel shows 4 services (Low Pressure Supply, etc.)
    4. Click: First service to activate
    5. Select: Duct tool
    6. Draw: A duct on canvas
    7. Save: Project (Ctrl+S or auto-save)
    8. Simulate legacy: Modify localStorage to remove `_version` field
    9. Reload: Page
    10. Assert: Migration dialog appears
    11. Complete: Migration wizard
    12. Assert: Canvas appears with duct still present
    13. Assert: No page reload occurred during migration
  Expected Result: Complete flow works from seeding through migration
  Evidence: Screenshots at each step, final canvas state

---

## Files to Modify

### New Files:
1. `src/core/store/componentLibraryInitializer.ts` - Task 0

### Modified Files:
1. `src/core/store/componentLibraryStoreV2.ts` - Task 1 (add persist)
2. `src/features/canvas/CanvasPageWrapper.tsx` - Task 2 (call initializer), Task 4 (version detection)
3. `src/components/layout/FileMenu.tsx` - Task 3, Task 5, Task 6 (migration flow)
4. `src/components/dialogs/MigrationWizard.tsx` - Task 5 (rehydrate callback)

---

## Success Criteria

### Comment 1: Component Library V2 Initialization
- [x] Baseline duct/equipment/fitting components appear in Services panel on fresh install
- [x] Components persist across page reloads
- [x] Default active component is set so tools work immediately
- [x] `getActiveComponent()` returns non-null for tools

### Comment 2: Migration Wizard Enhancement
- [x] Migration wizard works from dashboard (not just canvas)
- [x] Persisted projects trigger migration when legacy version detected
- [x] No hard reload during migration completion
- [x] Stores rehydrate from migrated payload
- [x] Project data is preserved through migration

### Overall
- [ ] All TypeScript compiles without errors
- [ ] All existing tests pass
- [ ] New functionality verified via QA scenarios
- [ ] No console errors in production build

---

## Appendix: Key Code Patterns

### Zustand Persist Pattern (from settingsStore.ts):
```typescript
import { persist } from 'zustand/middleware';

export const useComponentLibraryStoreV2 = create<ComponentLibraryState>()(
  persist(
    immer((set, get) => ({
      // ... store implementation
    })),
    {
      name: 'sws.componentLibrary.v2',
      partialize: (state) => ({
        components: state.components,
        categories: state.categories,
        templates: state.templates,
        activeComponentId: state.activeComponentId,
      }),
    }
  )
);
```

### Service to Component Adaptation (from componentServiceInterop.ts):
```typescript
export function adaptServiceToComponent(service: Service): UnifiedComponentDefinition {
  const now = new Date();
  const primaryShape = service.dimensionalConstraints.allowedShapes?.[0] ?? 'round';

  return {
    id: service.id,
    name: service.name,
    category: 'duct',
    type: 'duct',
    subtype: primaryShape,
    description: service.description,
    systemType: service.systemType,
    pressureClass: toComponentPressureClass(service.pressureClass),
    // ... other fields
  };
}
```

### Version Detection (from VersionDetector.ts):
```typescript
const detectedVersion = VersionDetector.detectVersion(data);
if (VersionDetector.needsMigration(detectedVersion)) {
  // Show migration wizard
}
```

### Store Rehydration (from CanvasPageWrapper.tsx):
```typescript
if (payload?.project?.entities) {
  useEntityStore.getState().hydrate(payload.project.entities);
}
if (payload?.viewport) {
  useViewportStore.setState({
    panX: payload.viewport.panX,
    panY: payload.viewport.panY,
    zoom: payload.viewport.zoom,
  });
}
```
