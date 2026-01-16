# [UJ-PM-004] Delete Project (Tauri Offline)

## Overview

### Purpose
This document describes how users permanently delete projects in the Tauri Desktop platform.

### Scope
- Deleting `.sws` files from disk
- Cleaning up backup files and thumbnails
- Confirmation flow

### User Personas
- **Primary**: Designers managing local files

### Success Criteria
- `.sws` file removed from File System
- Backup (`.bak`) removed
- UI updates immediately

### Platform Summary (Tauri Offline)
- **Storage**: File System
- **Deletion**: `fs.removeFile` (Direct delete)
- **Recovery**: None (unless Recycle Bin integration added later)
- **Files**: Deletes Project (`.sws`), Backup (`.bak`), Thumbnail (`.png`)

## Prerequisites
- Project file exists and is writable

## User Journey Steps

### Step 1: Initiate Delete
**User Action**: Click "Delete" icon on Dashboard.
**System Response**: Show Confirmation Dialog. Show file path being deleted.

### Step 2: Confirm Deletion
**User Action**: Type Project Name.
**System Response**: Enable "Delete" button.

### Step 3: Execute Deletion
**User Action**: Click "Delete".
**System Response**:
1. Remove from `ProjectListStore`.
2. Tauri Command: `delete_project(path)`.
   - Delete `.sws`
   - Delete `.sws.bak`
   - Delete `.thumb.png`
3. Update specific "Recent Projects" config file.
4. Show Success Toast.

### Step 4: UI Update
**System Response**: Project card removed.

## Edge Cases
- **Permission Denied**: File read-only or system locked. Show "Access Denied" error.
- **File Missing**: If file already gone, just remove from list (silent success).

## Related Elements
- `DeleteConfirmDialog`
- `FileSystemService`
