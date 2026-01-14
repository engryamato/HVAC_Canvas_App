# [UJ-PM-006] Duplicate Project (Tauri Desktop)

## Overview

### Purpose
Describe duplicating a project in the desktop runtime with file-based persistence.

### Scope
**In Scope:**
- Reading the source `.sws` file
- Writing a new `.sws` file with a new UUID
- Updating the dashboard list

**Out of Scope:**
- Browser quota handling (see hybrid version)

### Key Differences (Tauri)
- Uses file system read/write for duplication
- No storage quota constraints
- Optional thumbnail copy on disk

## Primary Flow Notes (Tauri)
- Clone the file contents and update identifiers.
- Ensure duplication is atomic to prevent partial files.

## Related Base Journey
- [Duplicate Project](../UJ-PM-006-DuplicateProject.md)

## Related Components
- `ProjectService` (duplicate)
- `ProjectIO` (read/write)
- `projectListStore` (add project)
