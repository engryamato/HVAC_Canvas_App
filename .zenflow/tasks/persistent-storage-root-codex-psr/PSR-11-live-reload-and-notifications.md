# PSR-11: Live Reload & Notifications
- Phase: Phase 4: UI Integration
- Dependencies: PSR-04, PSR-05, PSR-08
- Status: 🟡 **PARTIALLY COMPLETED** (events exist, UI bridge incomplete)

## Objective
Bridge service events to UI state and notification flows.

## Spec References
- **Core Flows**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="c67b5d33-0683-432c-a167-6eef71ca51f2" title="Core Flows - Persistent Storage Root">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/c67b5d33-0683-432c-a167-6eef71ca51f2`</traycer-spec>
  - Flow 2: Subsequent App Launches (disk space warning)
  - Flow 4: Changing Storage Location (progress toast)
  - Flow 6: Disk Space Warning (toast notification)
  - Disk Space Warning Presentation: "Toast notification that auto-dismisses"
  - Storage Relocation Progress Feedback: "Non-blocking progress toast - background operation"
- **Tech Plan**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="09530bad-8225-4708-82bf-8b821aca0b7d" title="">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/09530bad-8225-4708-82bf-8b821aca0b7d`</traycer-spec>
  - Section: Architectural Approach → Decision 4: Event System for Live Reload
  - Section: Component Architecture → Layer 4: State Management → React Hooks

## Implementation Details

### File Locations
- `hvac-design-app/src/hooks/useStorageRoot.ts` (to be enhanced)
- Toast notification component (to be created or integrated)

### Events to Subscribe To
**From StorageRootService**:
- `storageRoot:changed` → Refresh project list, update UI
- `migration:state` → Show migration progress toast
- `operation:error` → Show error toast
- `validation:warning` → Show disk space warning toast
- `validation:error` → Show validation error toast

**From ProjectRepository**:
- `project:changed` → Refresh single project in list
- `projects:changed` → Refresh entire project list

### Hook Implementation
```typescript
function useStorageRoot() {
  const store = useStorageStore();
  const [service, setService] = useState<StorageRootService | null>(null);
  
  useEffect(() => {
    let mounted = true;
    
    getStorageRootService().then(svc => {
      if (!mounted) return;
      setService(svc);
      
      // Subscribe to events
      const handleStorageRootChanged = (e: CustomEvent) => {
        // Refresh project list
        useProjectListStore.getState().refreshProjects();
      };
      
      const handleValidationWarning = (e: CustomEvent) => {
        if (e.detail.type === 'low_disk_space') {
          showToast({
            type: 'warning',
            message: `Low disk space: ${e.detail.available} GB available`,
            duration: 5000,
            dismissible: true
          });
        }
      };
      
      const handleMigrationState = (e: CustomEvent) => {
        const { phase, processedFiles, totalFiles } = e.detail;
        if (phase === 'complete') {
          showToast({
            type: 'success',
            message: 'Migration complete',
            duration: 3000
          });
        }
      };
      
      svc.addEventListener('storageRoot:changed', handleStorageRootChanged);
      svc.addEventListener('validation:warning', handleValidationWarning);
      svc.addEventListener('migration:state', handleMigrationState);
      
      return () => {
        svc.removeEventListener('storageRoot:changed', handleStorageRootChanged);
        svc.removeEventListener('validation:warning', handleValidationWarning);
        svc.removeEventListener('migration:state', handleMigrationState);
      };
    });
    
    return () => { mounted = false; };
  }, []);
  
  return {
    storageRoot: store.storageRootPath,
    migrationState: store.migrationState,
    validationWarnings: store.validationWarnings,
  };
}
```

### Toast Notifications
**Types**:
- **Low Disk Space**: Warning toast, 5s auto-dismiss, dismissible
- **Migration Progress**: Info toast with spinner, auto-dismiss on complete
- **Relocation Progress**: Info toast with spinner, updates to success/error
- **Operation Error**: Error toast, 10s auto-dismiss, dismissible

**Toast Component** (if not exists):
```tsx
<Toast 
  type="warning" | "info" | "success" | "error" 
  message="..." 
  duration={5000} 
  dismissible={true} 
  onDismiss={() => {}}
/>
```

## Checklist
- [ ] Implement/finish `useStorageRoot()` event subscriptions
- [ ] Bridge service events into Zustand refresh and project list updates
- [ ] Add low-disk warning toast behavior
- [ ] Add relocation/migration progress toasts
- [ ] Ensure event listeners clean up on unmount
- [ ] Add tests for event-driven updates

## Acceptance Criteria
- [ ] `useStorageRoot()` hook subscribes to all relevant events
- [ ] Storage root change triggers project list refresh
- [ ] Low disk space shows warning toast after dashboard loads
- [ ] Migration progress shows toast during first launch
- [ ] Relocation shows progress toast with spinner
- [ ] Event listeners clean up on component unmount (no memory leaks)
- [ ] Toast notifications are non-blocking and dismissible

## Test Cases
- [ ] Hook: storageRoot change event updates consuming UI state
- [ ] Hook: listeners subscribe/unsubscribe correctly
- [ ] Integration: low-disk event triggers warning toast
- [ ] Integration: migration/relocation progress events surface notifications
- [ ] Integration: project list refreshes after storage root change
- [ ] Unit: event cleanup prevents memory leaks

## Definition of Done
- [ ] Implementation merged with passing targeted tests
- [ ] Acceptance criteria from Core Flows and Tech Plan satisfied
- [ ] Toast notifications functional and tested
- [ ] Event-driven updates verified in E2E tests

## Implementation Notes
🟡 **Partially complete**. Events are emitted from services, but UI bridge and toast notifications need implementation.

**Implementation Steps**:
1. Enhance `useStorageRoot()` hook with event subscriptions
2. Create or integrate toast notification component
3. Add event handlers for all service events
4. Implement project list refresh on storage events
5. Add toast notifications for warnings and progress
6. Test event cleanup on unmount
7. Verify no memory leaks with repeated mount/unmount

**Related Files**:
- `hvac-design-app/src/hooks/useStorageRoot.ts`
- `hvac-design-app/src/core/services/StorageRootService.ts`
- `hvac-design-app/src/core/persistence/ProjectRepository.ts`
- `hvac-design-app/src/features/dashboard/store/projectListStore.ts`
