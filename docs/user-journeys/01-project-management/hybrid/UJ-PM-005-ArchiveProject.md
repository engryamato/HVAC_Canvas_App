# [UJ-PM-005] Archive Project (Hybrid/Web)

## Overview

### Purpose
Document archive behavior when archive metadata is stored in browser storage.

### Scope
**In Scope:**
- Updating archive flags in IndexedDB/localStorage
- Active vs archived list filters
- Restoring archived projects

**Out of Scope:**
- Desktop file persistence (see Tauri version)

### Key Differences (Hybrid/Web)
- Archive metadata persisted in browser storage
- Quota considerations for metadata updates

## Primary Flow Notes (Hybrid/Web)
- Update `isArchived` and `archivedAt` in IndexedDB.
- Refresh list view from cached metadata.

## Related Base Journey
- [Archive Project](../UJ-PM-005-ArchiveProject.md)

## Related Components
- `projectListStore`
- `IDBService`
- `ArchiveDialog`
