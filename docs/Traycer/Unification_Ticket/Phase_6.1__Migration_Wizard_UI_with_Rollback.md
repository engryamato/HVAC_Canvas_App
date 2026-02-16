# Phase 6.1: Migration Wizard UI with Rollback


## Overview

Build Migration Wizard UI that guides users through data migration with version detection, backup creation, migration execution, validation, and rollback capability.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/f52310a1-13a5-4d6f-b482-f30544acdb43` (Tech Plan - Decision 7)
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 13: Data Migration)

## Scope

**In Scope**:
- Multi-step migration wizard (Detect, Backup, Migrate, Validate, Complete)
- Version detection display
- Backup creation with progress
- Migration execution with progress bar
- Validation results display
- Rollback button (restore from backup)
- Error handling and recovery

**Out of Scope**:
- Migration logic (handled in Phase 1.4)
- Automatic migration on project open (future enhancement)

## Key Files

**Create**:
- `file:hvac-design-app/src/features/migration/MigrationWizard.tsx`
- `file:hvac-design-app/src/features/migration/steps/DetectStep.tsx`
- `file:hvac-design-app/src/features/migration/steps/BackupStep.tsx`
- `file:hvac-design-app/src/features/migration/steps/MigrateStep.tsx`
- `file:hvac-design-app/src/features/migration/steps/ValidateStep.tsx`
- `file:hvac-design-app/src/features/migration/steps/CompleteStep.tsx`

**Reference**:
- `file:hvac-design-app/src/core/services/migration/MigrationService.ts` (from Phase 1.4)
- `file:hvac-design-app/src/core/services/migration/BackupManager.ts` (from Phase 1.4)

## Acceptance Criteria

- [ ] Wizard shows 5 steps with progress indicator
- [ ] Detect step shows: "Current version: 1.0.0, Target version: 2.0.0"
- [ ] Backup step creates backup with progress: "Creating backup..."
- [ ] Migrate step runs migration with progress: "Migrating... 45%"
- [ ] Validate step shows validation results (errors, warnings)
- [ ] Complete step shows success: "✓ Migration complete. 150 components migrated."
- [ ] Rollback button available at any step
- [ ] Rollback restores from backup and closes wizard
- [ ] Error handling: Migration fails → show error → offer rollback
- [ ] Validation fails → show issues → offer rollback or continue
- [ ] Matches flow description from Flow 13

## Dependencies

- **Requires**: Phase 1.4 (migration infrastructure)
- **Requires**: Phase 1.1 (new component library for migration target)

## Technical Notes

**Wizard State Machine**:
```
Detect → Backup → Migrate → Validate → Complete
  ↓        ↓         ↓          ↓
  └────────┴─────────┴──────────┴─→ Rollback (any step)
```
