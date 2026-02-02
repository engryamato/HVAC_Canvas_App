# [UJ-PM-006] Duplicate Project (Hybrid/Web)

## 1. Overview

### Purpose
This document describes duplicating projects in the browser, including quota checks, IndexedDB persistence, and dashboard updates.

### Scope
- Initiating duplication from the dashboard
- Copying metadata, entities, and settings
- Generating a new ID and name
- Persisting duplicate in IndexedDB

### User Personas
- **Primary**: Designers creating project variants
- **Secondary**: Project managers creating templates
- **Tertiary**: QA reviewers generating test copies

### Success Criteria
- Duplicate created without modifying source project
- New project receives unique ID and name
- Duplicate appears in dashboard list
- Quota issues surfaced with recovery guidance

### Platform Summary (Hybrid/Web)
- Storage: IndexedDB/localStorage
- File I/O: No disk copy
- Offline: Works for cached projects
- Quota: Check before duplication

## 2. PRD References

### Related PRD Sections
- **Section 4.1: Project Management** - Duplicate projects
- **Section 6.2: Project Persistence** - Browser storage

### Key Requirements Addressed
- FR-PM-006: Duplicate projects from dashboard
- AC-PM-006-002: "- Copy" name suffix
- AC-PM-006-003: Unique UUID

## 3. Prerequisites

### User Prerequisites
- User can access dashboard list
- User understands duplication creates a new project

### System Prerequisites
- Duplicate action enabled
- IndexedDB initialized

### Data Prerequisites
- Source project exists in IndexedDB

### Technical Prerequisites
- `ProjectService` and `IDBService` available
- `projectListStore` for list updates

## 4. User Journey Steps

### Step 1: Duplicate from Dashboard

**User Actions:**
1. Click overflow menu → Duplicate

**System Response:**
1. Show loading state on card ("Duplicating...")
2. Read source project from IndexedDB
3. Deep clone entities and metadata
4. Generate new UUID and "- Copy" name
5. Check quota before write
6. Write duplicate to IndexedDB
7. Copy thumbnail blob (if present)
8. Add duplicate to `projectListStore`

**Visual State:**
```
┌──────────┐      ┌──────────┐
│ Project  │  ->  │ Project  │
│          │      │ - Copy   │
└──────────┘      └──────────┘
```

**User Feedback:**
- Success toast: "Project duplicated"
- New project appears immediately in list

## 5. Edge Cases and Handling

### Edge Case 1: Quota Exceeded
- Show "Storage full" and block duplication

### Edge Case 2: IDB Transaction Error
- Roll back duplicate and restore UI state

### Edge Case 3: Duplicate Name Collision
- Append incremental suffix ("Copy 2", "Copy 3")

## 6. Error Scenarios and Recovery

### Error Scenario 1: IndexedDB Write Failure
- Message: "Unable to duplicate project"
- Recovery: Retry or reduce storage usage

### Error Scenario 2: Thumbnail Copy Failure
- Message: "Duplicate created without thumbnail"
- Recovery: Regenerate thumbnail on next open

## 7. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Duplicate (when focused) | `D` |

## 8. Related Elements

### Components
- [ProjectCard](../../../elements/01-components/dashboard/ProjectCard.md)
- `ProjectMenu`

### Stores
- [projectListStore](../../../elements/02-stores/projectListStore.md)

### Services
- [ProjectIO](../../../elements/10-persistence/ProjectIO.md)

## 9. Visual Diagrams

### Duplicate Project Flow (Hybrid/Web)
```
Project Menu → Clone in IDB → Add to List
```

## Related Base Journey
- [Duplicate Project](../UJ-PM-006-DuplicateProject.md)
