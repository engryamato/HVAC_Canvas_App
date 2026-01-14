# [UJ-PM-002] Open Existing Project (Tauri Desktop)

## Overview

### Purpose
Describe how Tauri users open existing projects using native file dialogs, recent projects, and file associations.

### Scope
**In Scope:**
- Opening projects from recent list
- Opening `.sws` files via native picker
- Handling file association launches

**Out of Scope:**
- Browser upload/download flows (see hybrid version)

### Key Differences (Tauri)
- Native file picker for `.sws` files
- File associations can launch the app
- Project thumbnails and metadata read from disk

## Primary Flow Notes (Tauri)
- Use Tauri dialog APIs for file selection.
- Resolve paths to `.sws` files and parse metadata.
- Update recent projects list after open.

## Related Base Journey
- [Open Existing Project](../UJ-PM-002-OpenExistingProject.md)

## Related Components
- `ProjectIO` (file load)
- `RecentProjectsStore`
- `FileDialogService` (Tauri)
