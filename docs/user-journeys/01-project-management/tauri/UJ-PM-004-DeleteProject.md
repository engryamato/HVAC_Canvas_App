# [UJ-PM-004] Delete Project (Tauri Desktop)

## Overview

### Purpose
Describe deletion behavior in Tauri, including file system cleanup and backup removal.

### Scope
**In Scope:**
- Confirmation dialog workflow
- Deleting `.sws`, `.bak`, and thumbnail files
- Removing project from dashboard list

**Out of Scope:**
- Browser storage deletion (see hybrid version)

### Key Differences (Tauri)
- Permanent file deletion on disk
- Removal of backups and thumbnails
- OS-level file permission errors possible

## Primary Flow Notes (Tauri)
- Delete sequence should be atomic where possible.
- Report file permission errors in UI.

## Related Base Journey
- [Delete Project](../UJ-PM-004-DeleteProject.md)

## Related Components
- `DeleteConfirmDialog`
- `ProjectIO` (delete file)
- `projectListStore` (remove entry)
