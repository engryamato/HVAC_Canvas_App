# [UJ-PM-006] Duplicate Project (Hybrid/Web)

## Overview

### Purpose
Describe duplicating projects in the browser with quota-aware persistence.

### Scope
**In Scope:**
- Copying project data from IndexedDB
- Generating new IDs and names
- Persisting the duplicate in browser storage

**Out of Scope:**
- Desktop file duplication (see Tauri version)

### Key Differences (Hybrid/Web)
- Storage quota checks before writing
- Duplicate stored in IndexedDB

## Primary Flow Notes (Hybrid/Web)
- Estimate project size before duplication.
- Surface quota warnings when needed.

## Related Base Journey
- [Duplicate Project](../UJ-PM-006-DuplicateProject.md)

## Related Components
- `ProjectService` (web storage)
- `IDBService`
- `projectListStore`
