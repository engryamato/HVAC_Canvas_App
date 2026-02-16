# Phase 7.3: Auto-Save and Crash Recovery


## Overview

Implement auto-save system with crash recovery, maintaining separate auto-save versions from manual saves.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Error Handling: Data Integrity and Recovery)

## Scope

**In Scope**:
- Auto-save every 60 seconds (configurable)
- Auto-save stored separately from manual saves in IndexedDB
- Keep up to 5 auto-save versions
- Crash recovery dialog on relaunch
- "Recover Auto-save" vs. "Open Last Save" options
- Auto-save disabled during export/migration

**Out of Scope**:
- Cloud sync (explicitly out of scope)
- Conflict resolution (single-user app)

## Key Files

**Create**:
- `file:hvac-design-app/src/core/persistence/autoSave.ts`
- `file:hvac-design-app/src/features/recovery/CrashRecoveryDialog.tsx`

**Modify**:
- `file:hvac-design-app/src/core/store/storageStore.ts` - Auto-save integration

## Acceptance Criteria

- [ ] Auto-save triggers every 60 seconds (configurable in settings)
- [ ] Auto-save stored in IndexedDB with timestamp
- [ ] Up to 5 auto-save versions kept (oldest pruned)
- [ ] Auto-save disabled during export and migration
- [ ] Crash recovery dialog appears on relaunch after crash
- [ ] Dialog shows: "Last saved: 2 minutes ago, Auto-save: 30 seconds ago"
- [ ] "Recover Auto-save" button loads most recent auto-save
- [ ] "Open Last Save" button loads last manual save
- [ ] "Discard" button skips recovery
- [ ] "View Details" shows list of auto-save versions
- [ ] Notification after recovery: "Project recovered. Review changes and save."
- [ ] Matches flow description from Error Handling section

## Dependencies

- **Requires**: Phase 1.4 (backup manager for auto-save storage)

## Technical Notes

**Auto-Save Flow**:
1. Timer triggers every 60 seconds
2. Check if project has unsaved changes
3. If yes, save to IndexedDB with timestamp
4. Keep last 5 versions, prune older
5. Continue timer

**Crash Detection**:
- Set flag on app start
- Clear flag on clean exit
- If flag still set on next start → crash detected
