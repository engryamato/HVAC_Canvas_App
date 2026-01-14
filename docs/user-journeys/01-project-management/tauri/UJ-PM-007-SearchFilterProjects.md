# [UJ-PM-007] Search & Filter Projects (Tauri Desktop)

## Overview

### Purpose
Describe project search and filtering when the project list is sourced from local files.

### Scope
**In Scope:**
- Searching project names and metadata
- Sorting and filtering active vs archived

**Out of Scope:**
- Cloud search or cross-user queries

### Key Differences (Tauri)
- Project list originates from file-backed metadata
- No browser storage quotas affect filtering

## Primary Flow Notes (Tauri)
- Filtering occurs in memory after file metadata load.

## Related Base Journey
- [Search and Filter Projects](../UJ-PM-007-SearchFilterProjects.md)

## Related Components
- `projectListStore`
- `SearchService`
