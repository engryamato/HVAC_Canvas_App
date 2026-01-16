# [UJ-PM-005] Archive Project (Tauri Offline)

## Overview

### Purpose
This document describes how users archive projects in the Tauri Desktop platform.

### Scope
- Hiding projects from Active list
- Persisting `isArchived` status to `.sws` file header

### User Personas
- **Primary**: Designers organizing local files

### Success Criteria
- Project moves to Archived tab
- File metadata updated on disk
- Restore returns to Active tab

### Platform Summary (Tauri Offline)
- **Storage**: File System (`.sws` header)
- **Persistence**: Read-Modify-Write operation on file
- **Recovery**: Toggle flag and save file
- **File Location**: File remains in original folder (no physical move to "Archive" folder unless specified in future)

## Prerequisites
- Project file writable

## User Journey Steps

### Step 1: Initiate Archive
**User Action**: Click "Archive" icon.
**System Response**: Project Card fades out.

### Step 2: Confirm Archive
**User Action**: Confirm action.
**System Response**:
1. Update `ProjectListStore`.
2. Tauri Command: `update_project_metadata({ isArchived: true })`.
   - Writes to `.sws` file.
3. Show Toast.

### Step 3: View Archived
**User Action**: Click "Archived" tab.
**System Response**: List filtered by `isArchived: true` (read from file headers during scan).

### Step 4: Restore
**User Action**: Click "Restore".
**System Response**: Write `isArchived: false` to file. Update List.

## Edge Cases
- **File Read-Only**: Archive fails. Show error.
- **File Moved**: If file moved externally, might disappear from list entirely rather than stay archived (unless re-scanned).

## Related Elements
- `ArchiveDialog`
- `FileSystemService`
