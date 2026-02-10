# Plan: Fix Disk Space Reporting (0.0 GB)

## Context
The "Disk Space" indicator in the settings panel persists at 0.0 GB. Investigation revealed that `StorageRootService.validate()` is never called. This plan implements **Option A**: triggering validation on initialization and setting up a periodic check.

## Goal
Ensure the application accurately reports disk space usage by validating the storage root on startup and periodically updating the information.

## User Review Required
> [!NOTE]
> No breaking changes expected. This purely adds missing functionality (validation calls).

## Proposed Changes

### Phase 1: Backend Improvements
**Goal**: Improve error visibility for disk space checks.

#### [MODIFY] [storage_root.rs](file:///c:/Users/User/Downloads/GitHub/HVAC_Canvas_App/hvac-design-app/src-tauri/src/commands/storage_root.rs)
- Update `read_disk_space` to log errors to stderr/console before returning the default zeroed struct.
- This aids debugging if `fs2` fails due to permissions in the future.

### Phase 2: Frontend Initialization & Polling
**Goal**: Ensure disk space is fetched on app launch and kept fresh.

#### [MODIFY] [AppInitializer.tsx](file:///c:/Users/User/Downloads/GitHub/HVAC_Canvas_App/hvac-design-app/src/components/onboarding/AppInitializer.tsx)
- In `performStorageInitialization`, call `await service.validate()` immediately after successful `service.initialize()`.
- This ensures the UI has data as soon as the dashboard loads.

#### [MODIFY] [useStorageRoot.ts](file:///c:/Users/User/Downloads/GitHub/HVAC_Canvas_App/hvac-design-app/src/hooks/useStorageRoot.ts)
- Add a `useDiskSpaceMonitor` effect (or hook) that sets up a `setInterval` (e.g., every 60 seconds).
- It should call `validate()` to refresh disk stats.
- Change `StorageRootService`'s `validate` call to occur periodically.

### Phase 3: Verification & Testing
**Goal**: Prove the fix works and prevents regression.

#### [MODIFY] [StorageRootService.integration.test.ts](file:///c:/Users/User/Downloads/GitHub/HVAC_Canvas_App/hvac-design-app/src/core/services/__tests__/StorageRootService.integration.test.ts)
- Add a test case to `Integration with Store` suite:
  - Mock the backend `validateStorageRoot` command to return specific bytes.
  - Call `service.validate()`.
  - Assert `mockStoreState.diskSpace` is updated with those values.

## Verification Plan

### Automated Tests
- Run `npm run test -- StorageRootService` to verify the new integration test passes.
- Ensure existing tests in `StorageRootService.integration.test.ts` still pass.

### Manual Verification
1.  **Startup Check**:
    -   Launch the app (`npm run tauri:dev`).
    -   Open Settings > Storage.
    -   Verify "Disk Space" shows a non-zero value (e.g., "XX GB available").
2.  **Polling Check**:
    -   Verify the numbers update (if possible) or check logs for periodic calls.
