# [UJ-PM-003] Edit Project Metadata (Hybrid/Web)

## Overview

### Purpose
Describe metadata edits when persistence is backed by browser storage.

### Scope
**In Scope:**
- Editing metadata from the canvas sidebar
- Writing changes to IndexedDB/localStorage
- Updating dashboard list from cached metadata

**Out of Scope:**
- Desktop file persistence (see Tauri version)

### Key Differences (Hybrid/Web)
- Writes update IndexedDB/localStorage
- Quota limits may affect save operations

## Primary Flow Notes (Hybrid/Web)
- Persist edits via IndexedDB transactions.
- Surface quota errors with recovery guidance.

## Related Base Journey
- [Edit Project Metadata](../UJ-PM-003-EditProjectMetadata.md)

## Related Components
- `EditProjectDialog`
- `IDBService`
- `projectListStore`
