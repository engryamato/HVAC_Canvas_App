# PSR-08: App Initialization Integration
- Phase: Phase 4: UI Integration
- Dependencies: PSR-04, PSR-06, PSR-07
- Status: ❌ **NOT STARTED**

## Objective
Integrate storage initialization into app startup order before integrity checks.

## Spec References
- **Core Flows**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="c67b5d33-0683-432c-a167-6eef71ca51f2" title="Core Flows - Persistent Storage Root">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/c67b5d33-0683-432c-a167-6eef71ca51f2`</traycer-spec>
  - Flow 1: First Launch with Storage Initialization
  - Flow 2: Subsequent App Launches with Validation
  - Storage Initialization Timing: "During splash screen - silent background initialization"
- **Tech Plan**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="09530bad-8225-4708-82bf-8b821aca0b7d" title="">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/09530bad-8225-4708-82bf-8b821aca0b7d`</traycer-spec>
  - Section: Component Architecture → Layer 5: UI Components → App Initializer Extension
  - Section: Architectural Approach → Decision 7: Storage Root Initialization Hook Point

## Implementation Details

### File Location
- `hvac-design-app/src/components/onboarding/AppInitializer.tsx` (to be modified)

### Initialization Sequence (Required Order)
```typescript
1. Environment detection (isTauri(), platform capabilities)
2. ⭐ Storage initialization (NEW - performStorageInitialization())
   - Load storage settings
   - Resolve/validate root
   - Run migration if needed
   - Ensure directories exist
3. Integrity checks (now safe, storage is stable)
4. Continue app boot (auto-open last project, route to dashboard)
```

### New Function to Add
```typescript
async function performStorageInitialization(): Promise<void> {
  const service = await getStorageRootService();
  const result = await service.initialize();
  
  if (!result.success) {
    // Show critical error dialog
    // Block app startup
    throw new Error(result.error || 'Storage initialization failed');
  }
  
  // Run validation after initialization
  const validation = await service.validate();
  if (!validation.is_valid) {
    // Log warnings but don't block startup
    console.warn('Storage validation warnings:', validation.errors);
  }
}
```

### Error Handling
- **Critical Failure**: No writable storage location → Block app startup with error dialog
- **Non-Critical Warnings**: Low disk space, path inconsistency → Log and continue
- **Migration Errors**: Partial migration failure → Log errors, continue with successful migrations

## Checklist
- [ ] Add `performStorageInitialization()` in `AppInitializer` flow
- [ ] Execute storage init after environment detection, before integrity checks
- [ ] Handle critical init failures with blocking UI path
- [ ] Ensure non-critical warnings do not block app boot
- [ ] Add integration tests for startup sequencing
- [ ] Document startup behavior in relevant docs

## Acceptance Criteria
- [ ] Storage initialization runs during splash screen (silent, non-blocking UI)
- [ ] Initialization completes before dashboard/canvas loads
- [ ] Migration runs automatically on first launch
- [ ] Critical errors (no writable storage) block app with clear message
- [ ] Non-critical warnings (low disk) don't block startup
- [ ] Validation runs after initialization
- [ ] User sees splash screen during initialization (no frozen UI)

## Test Cases
- [ ] Integration: init order is environment → storage → integrity
- [ ] Integration: fatal storage failure triggers blocking error path
- [ ] Integration: successful init continues normal app boot
- [ ] E2E: first-launch migration flow completes before dashboard/canvas loads
- [ ] E2E: subsequent launches validate storage and continue quickly
- [ ] E2E: low disk space shows warning toast after dashboard loads
- [ ] E2E: deleted storage root is recreated on next launch

## Definition of Done
- [ ] Implementation merged with passing targeted tests
- [ ] Acceptance criteria from Core Flows and Tech Plan satisfied
- [ ] Startup sequence documented
- [ ] Error handling tested for all failure scenarios

## Implementation Notes
**Priority: HIGH** - This is the critical integration point that makes storage root functional for users.

**Implementation Steps**:
1. Import `getStorageRootService` in `AppInitializer.tsx`
2. Add `performStorageInitialization()` function
3. Call it in the correct sequence (after env detection, before integrity checks)
4. Add error handling for critical failures
5. Test first launch and subsequent launch flows
6. Verify migration runs silently during splash screen

**Related Files**:
- `hvac-design-app/src/components/onboarding/AppInitializer.tsx`
- `hvac-design-app/src/core/services/StorageRootService.ts`
