# [UJ-PM-007] Search and Filter Projects (Hybrid/Web)

## 1. Overview

### Purpose
This document describes how users search, sort, and filter projects in a browser, using IndexedDB-backed metadata cached in memory.

### Scope
- Typing search queries and seeing real-time results
- Sorting projects by name or date
- Filtering between active and archived lists
- Clearing search and resetting filters

### User Personas
- **Primary**: Designers managing large project lists
- **Secondary**: Project managers reviewing portfolios
- **Tertiary**: Admins auditing project lists

### Success Criteria
- Search filters results in real time
- Sort and filters work together without conflicts
- Clear search restores full list
- Large lists remain responsive

### Platform Summary (Hybrid/Web)
- Data Source: IndexedDB → `projectListStore`
- Search: Client-side filtering
- Offline: Works for cached projects
- Performance: In-memory filtering

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
- IndexedDB loaded into memory

### Data Prerequisites
- Project metadata indexed

### Technical Prerequisites
- `SearchService` available
- `projectListStore` populated

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

## 5. Edge Cases and Handling

### Edge Case 1: Large Lists
- Virtualized rendering for 100+ projects

### Edge Case 2: No Results
- Show empty state with clear search CTA

### Edge Case 3: Stale Cache
- Refresh metadata from IndexedDB on focus

## 6. Error Scenarios and Recovery

### Error Scenario 1: IndexedDB Load Failure
- Message: "Unable to load projects"
- Recovery: Prompt refresh or check browser storage

### Error Scenario 2: Filter Performance Degraded
- Message: "Large list, filtering may be slow"
- Recovery: Suggest narrowing filters

## 7. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Focus Search | `Ctrl+F` |
| Clear Search | `Esc` |

## 8. Related Elements

### Components
- `SearchBar`
- `SortDropdown`

### Stores
- `projectListStore`

### Services
- `SearchService`
- `IDBService`

## 9. Visual Diagrams

### Search and Filter Flow (Hybrid/Web)
```
IndexedDB Load → In-Memory Filter → Render List
```

## Related Base Journey
- [Search and Filter Projects](../UJ-PM-007-SearchFilterProjects.md)
