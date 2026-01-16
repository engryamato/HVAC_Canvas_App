# [UJ-PM-005] Archive Project (Hybrid/Web)

## Overview

### Purpose
This document describes how users archive projects in the Hybrid/Web platform.

### Scope
- Hiding projects from Active list
- Showing projects in Archived list
- Updating `isArchived` flag in IndexedDB

### User Personas
- **Primary**: Designers organizing portfolio

### Success Criteria
- Project moves to Archived tab
- `isArchived` flag persists in IndexedDB
- Restore returns to Active tab

### Platform Summary (Hybrid/Web)
- **Storage**: IndexedDB (status flag)
- **Persistence**: Update object in IDB transaction
- **Recovery**: "Restore" button simply toggles flag back
- **Quota**: Archived projects still count towards storage quota

## Prerequisites
- Project exists in IndexedDB

## User Journey Steps

### Step 1: Initiate Archive
**User Action**: Click "Archive" icon.
**System Response**: Project Card fades out.

### Step 2: Confirm Archive
**User Action**: (Optional confirmation or immediate action).
**System Response**:
1. Update `ProjectListStore` state.
2. Update `IndexedDB` metadata (`isArchived: true`).
3. Show Toast: "Project Archived" with Undo.

### Step 3: View Archived
**User Action**: Click "Archived" tab.
**System Response**: Show list filtered by `isArchived: true`.

### Step 4: Restore
**User Action**: Click "Restore".
**System Response**: Update `IndexedDB` (`isArchived: false`). Move back to Active list.

## Edge Cases
- **Quota**: No change in quota usage (just a flag).
- **Clear Browsing Data**: archives lost along with active projects.

## Related Elements
- `ArchiveDialog` (Optional)
- `IndexedDBService`
