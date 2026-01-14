# [UJ-PM-001] Create New Project (Hybrid/Web)

## Overview

### Purpose
Document the browser-based flow for creating new projects using IndexedDB/localStorage.

### Scope
**In Scope:**
- Creating a new project from the dashboard
- Persisting metadata to browser storage
- Navigating to the canvas after creation

**Out of Scope:**
- Desktop file system behavior (see Tauri version)
- Project duplication (see UJ-PM-006)

### Key Differences (Hybrid/Web)
- Projects stored in IndexedDB/localStorage
- Storage quota warnings may appear
- No native file system access

## Primary Flow Notes (Hybrid/Web)
- Persist metadata in IndexedDB and sync dashboard list.
- Surface quota warnings when storage nears limits.

## Related Base Journey
- [Create New Project](../UJ-PM-001-CreateNewProject.md)

## Related Components
- `ProjectService` (web storage path)
- `NewProjectDialog`
- `IDBService`
