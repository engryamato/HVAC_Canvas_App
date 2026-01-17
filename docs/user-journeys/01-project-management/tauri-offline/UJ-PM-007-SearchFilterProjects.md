# [UJ-PM-007] Search and Filter Projects (Tauri Offline)

## 1. Overview

### Purpose
This document describes how users search, sort, and filter projects on desktop using file-backed metadata scanned into memory.

### Scope
- Typing search queries and seeing real-time results
- Sorting projects by name or date
- Filtering between active and archived lists
- Clearing search and resetting filters

### User Personas
- **Primary**: Designers managing local project lists
- **Secondary**: Project managers reviewing offline portfolios
- **Tertiary**: Admins auditing project lists

### Success Criteria
- Search filters results in real time
- Sort and filters work together without conflicts
- Clear search restores full list
- Large lists remain responsive

### Platform Summary (Tauri Offline)
- Data Source: File system scan → `projectListStore`
- Search: Client-side filtering of metadata headers
- Offline: Full offline access
- Rescan: Manual refresh to pick up external file changes

## 2. PRD References

### Related PRD Sections
- **Section 5.5: Search and Filters** - Project search
- **Section 4.1: Project Management** - List operations

### Key Requirements Addressed
- FR-PM-007: Search and filter projects
- AC-PM-007-002: Real-time results
- AC-PM-007-003: Sort by name and date

## 3. Prerequisites

### User Prerequisites
- User can access dashboard list
- User understands search basics

### System Prerequisites
- Search UI visible
- File scan completed at least once

### Data Prerequisites
- Project metadata indexed from disk

### Technical Prerequisites
- `SearchService` available
- `ProjectIO` metadata scan available

## 4. User Journey Steps

### Step 1: Enter Search Query

**User Actions:**
1. Type "Office" in search box

**System Response:**
1. Filter list by name, client, and project number
2. Update count "Showing X of Y"

**Visual State:**
```
┌──────────────────────────────────────────────┐
│ Search: [Office          ] (x)  Sort: [Name] │
│ Showing 3 of 10 projects                     │
└──────────────────────────────────────────────┘
```

---

### Step 2: Apply Sort Order

**User Actions:**
1. Select "Modified (Newest First)"

**System Response:**
1. Reorder list by modified date

---

### Step 3: Toggle Active/Archived

**User Actions:**
1. Click "Archived" tab

**System Response:**
1. Filter list by `isArchived`

---

### Step 4: Clear Search

**User Actions:**
1. Click clear (x)

**System Response:**
1. Reset query and show all projects

---

### Step 5: Rescan for External Changes

**User Actions:**
1. Click "Rescan Folder"

**System Response:**
1. Rebuild metadata index from disk
2. Refresh list and filters

## 5. Edge Cases and Handling

### Edge Case 1: File Deleted Externally
- Search result click shows "File not found"
- Remove entry from list on next scan

### Edge Case 2: Large Lists
- Virtualized rendering for 100+ projects

### Edge Case 3: Stale Metadata
- Provide rescan option to refresh metadata

## 6. Error Scenarios and Recovery

### Error Scenario 1: Disk Scan Failure
- Message: "Unable to scan project folder"
- Recovery: Retry or choose a different folder

### Error Scenario 2: Filter Performance Degraded
- Message: "Large list, filtering may be slow"
- Recovery: Suggest narrowing filters

## 7. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Focus Search | `Ctrl+F` |
| Clear Search | `Esc` |
| Rescan Folder | `Ctrl+R` |

## 8. Related Elements

### Components
- `SearchBar`
- `SortDropdown`

### Stores
- `projectListStore`

### Services
- `SearchService`
- `ProjectIO`

## 9. Visual Diagrams

### Search and Filter Flow (Tauri Offline)
```
File Scan → In-Memory Filter → Render List
```

## Related Base Journey
- [Search and Filter Projects](../UJ-PM-007-SearchFilterProjects.md)
