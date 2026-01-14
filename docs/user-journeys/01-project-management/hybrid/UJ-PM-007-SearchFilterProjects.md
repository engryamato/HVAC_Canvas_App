# [UJ-PM-007] Search & Filter Projects (Hybrid/Web)

## Overview

### Purpose
Describe searching and filtering the project list in a browser context.

### Scope
**In Scope:**
- Searching project metadata stored in IndexedDB
- Sorting and filtering active vs archived projects

**Out of Scope:**
- Cloud or cross-user search

### Key Differences (Hybrid/Web)
- List sourced from browser storage
- Memory footprint depends on cached projects

## Primary Flow Notes (Hybrid/Web)
- Filter in memory after loading metadata from IndexedDB.

## Related Base Journey
- [Search and Filter Projects](../UJ-PM-007-SearchFilterProjects.md)

## Related Components
- `SearchService`
- `IDBService`
- `projectListStore`
