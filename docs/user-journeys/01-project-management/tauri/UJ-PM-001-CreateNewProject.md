# [UJ-PM-001] Create New Project (Tauri Desktop)

## Overview

### Purpose
Document the Tauri-specific behavior for creating new projects using the desktop runtime and native file system.

### Scope
**In Scope:**
- Creating a new project from the dashboard
- Persisting the `.sws` project file on disk
- Navigating to the canvas after file creation

**Out of Scope:**
- Browser storage behavior (see hybrid version)
- Project duplication (see UJ-PM-006)

### Key Differences (Tauri)
- Projects save to the file system with `.sws` extension
- Native dialogs handle file prompts when applicable
- Automatic backup file (`.sws.bak`) created on updates

## Primary Flow Notes (Tauri)
- Use `@tauri-apps/api/fs` to write the project file.
- Store the file under the app’s documents directory.
- Update the dashboard list from file-backed metadata.

## Related Base Journey
- [Create New Project](../UJ-PM-001-CreateNewProject.md)

## Related Components
- `ProjectService` (Tauri storage path)
- `NewProjectDialog` (desktop styling)
- `ProjectIO` (file persistence)
