# [UJ-PM-002] Open Existing Project (Hybrid/Web)

## Overview

### Purpose
Describe opening projects via browser storage, uploads, and downloads in a hybrid/web context.

### Scope
**In Scope:**
- Opening projects from IndexedDB
- Importing `.sws` files via browser upload
- Managing recent projects in browser storage

**Out of Scope:**
- Native file dialogs and file associations (see Tauri version)

### Key Differences (Hybrid/Web)
- Browser file upload for external `.sws` files
- Recent list stored in localStorage/IndexedDB
- File system access is indirect via downloads/uploads

## Primary Flow Notes (Hybrid/Web)
- Use file input to import `.sws` files.
- Cache metadata in IndexedDB for search and previews.

## Related Base Journey
- [Open Existing Project](../UJ-PM-002-OpenExistingProject.md)

## Related Components
- `ProjectIO` (web storage)
- `IDBService`
- `RecentProjectsStore`
