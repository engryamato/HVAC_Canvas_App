# Phase 1.4: Data Migration Infrastructure


## Overview

Build comprehensive data migration system with version detection, automatic backups, migration registry, and validation to safely migrate projects to new schema.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/f52310a1-13a5-4d6f-b482-f30544acdb43` (Tech Plan - Decision 7)
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 13: Data Migration)

## Scope

**In Scope**:
- Version detection system (detect schema version from project files)
- Migration registry (map version → migration function)
- Backup manager (create, restore, list backups in IndexedDB)
- Migration service (run migrations in sequence, handle failures)
- Validation after migration
- Add schemaVersion field to project file schema

**Out of Scope**:
- Migration wizard UI (handled in Phase 6)
- Specific migration functions (created as needed per schema change)
- Rollback UI (handled in Phase 6)

## Key Files

**Create**:
- `file:hvac-design-app/src/core/services/migration/VersionDetector.ts`
- `file:hvac-design-app/src/core/services/migration/MigrationRegistry.ts`
- `file:hvac-design-app/src/core/services/migration/MigrationService.ts`
- `file:hvac-design-app/src/core/services/migration/BackupManager.ts`
- `file:hvac-design-app/src/core/services/migration/migrations/v1-to-v2.ts` - First migration

**Modify**:
- `file:hvac-design-app/src/core/schema/project-file.schema.ts` - Add schemaVersion field

## Acceptance Criteria

- [ ] VersionDetector correctly identifies schema version from project files
- [ ] VersionDetector falls back to structure detection for old projects without version field
- [ ] MigrationRegistry supports registering and retrieving migration paths
- [ ] MigrationService runs migrations in sequence (v1 → v2 → v3)
- [ ] BackupManager creates backups in IndexedDB before migration
- [ ] BackupManager keeps last 10 backups, prunes older ones
- [ ] Migration validation runs after migration completes
- [ ] Failed migrations return original data (no partial state)
- [ ] Unit tests for all migration components
- [ ] Integration test: migrate v1.0.0 → v2.0.0 successfully

## Dependencies

- Requires Phase 1.1 (new schema) to define target migration format

## Technical Notes

**Version Detection Logic**:
1. Check for `schemaVersion` field in project file
2. If missing, detect from structure (presence of componentLibraryStore, etc.)
3. Default to '0.9.0' for legacy projects

**Migration Flow**:
```
Project File → VersionDetector → MigrationRegistry → MigrationService
                                                    ↓
                                              BackupManager (create backup)
                                                    ↓
                                              Run migrations in sequence
                                                    ↓
                                              Validate result
                                                    ↓
                                              Return migrated file or error
```
