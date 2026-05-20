# [UJ-PM-006] Duplicate Project (Tauri Offline)

## 1. Overview

### Purpose
This document describes duplicating projects on desktop, including file copy, metadata updates, and dashboard refresh.

### Scope
- Initiating duplication from the dashboard
- Reading source `.sws` file
- Writing new `.sws` and `.sws.bak`
- Updating dashboard list

### User Personas
- **Primary**: Designers creating variants
- **Secondary**: Project managers creating templates
- **Tertiary**: QA reviewers generating test copies

### Success Criteria
- Duplicate created without modifying source project
- New `.sws` file created with unique ID
- Duplicate appears in dashboard list
- File errors surface with recovery guidance

### Platform Summary (Tauri Offline)
- Storage: `.sws` file + `.sws.bak` backup
- File I/O: Direct disk read/write via Tauri
- Offline: Full offline support
- Naming: Ensure file name uniqueness

## 2. PRD References

### Related PRD Sections
- **Section 4.1: Project Management** - Duplicate projects
- **Section 4.2: File Operations** - File system integration

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
- File system access configured

### Data Prerequisites
- Source `.sws` file exists on disk

### Technical Prerequisites
- `ProjectIO` available for file operations
- `projectListStore` for list updates

## 4. User Journey Steps

### Step 1: Duplicate from Dashboard

**User Actions:**
1. Click overflow menu → Duplicate

**System Response:**
1. Show loading state on card ("Duplicating...")
2. Read source `.sws` file
3. Clone metadata and entities
4. Generate new UUID and "- Copy" name
5. Write new `.sws` file
6. Create `.sws.bak` backup
7. Copy thumbnail if present
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

### Edge Case 1: Disk Full
- Show "Storage full" and block duplication

### Edge Case 2: File Name Collision
- Append incremental suffix ("Copy 2", "Copy 3")

### Edge Case 3: Backup Write Failure
- Warn user but keep main file intact

## 6. Error Scenarios and Recovery

### Error Scenario 1: File Write Failure
- Message: "Unable to duplicate project"
- Recovery: Retry or choose a different directory

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
- [FileSystem](../../../elements/10-persistence/FileSystem.md)

## 9. Visual Diagrams

### Duplicate Project Flow (Tauri Offline)
```
Project Menu → Copy .sws → Add to List
```

## Related Base Journey
- [Duplicate Project](../UJ-PM-006-DuplicateProject.md)
