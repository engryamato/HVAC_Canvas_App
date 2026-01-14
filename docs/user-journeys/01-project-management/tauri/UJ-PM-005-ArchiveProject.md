# [UJ-PM-005] Archive Project (Tauri Desktop)

## Overview

### Purpose
Document how archive status is persisted to disk in the Tauri runtime.

### Scope
**In Scope:**
- Updating `isArchived` and `archivedAt`
- Tabbed views of active vs archived projects
- Restore workflow with file updates

**Out of Scope:**
- Browser storage behavior (see hybrid version)

### Key Differences (Tauri)
- Archive status stored inside `.sws` metadata
- Archive updates write through to disk

## Primary Flow Notes (Tauri)
- Archive actions trigger a file write.
- Dashboard list re-queries file-backed metadata.

## Related Base Journey
- [Archive Project](../UJ-PM-005-ArchiveProject.md)

## Related Components
- `projectListStore`
- `ArchiveDialog`
- `ProjectIO` (metadata update)
