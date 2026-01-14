# [UJ-PM-004] Delete Project (Hybrid/Web)

## Overview

### Purpose
Describe deletion behavior for browser-stored projects.

### Scope
**In Scope:**
- Confirmation dialog workflow
- Removing project entries from IndexedDB/localStorage
- Updating dashboard list

**Out of Scope:**
- File system deletion (see Tauri version)

### Key Differences (Hybrid/Web)
- Deletes entries from browser storage only
- No OS-level file permission errors

## Primary Flow Notes (Hybrid/Web)
- Remove project records in IndexedDB.
- Clear cached thumbnails and recent list entries.

## Related Base Journey
- [Delete Project](../UJ-PM-004-DeleteProject.md)

## Related Components
- `DeleteConfirmDialog`
- `IDBService`
- `projectListStore`
