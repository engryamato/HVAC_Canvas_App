# [UJ-PM-003] Edit Project Metadata (Tauri Offline)

## Overview

### Purpose
This document describes how users edit existing project metadata in the canvas editor (Tauri Desktop platform). Changes are persisted immediately to the `.sws` file on disk.

### Scope
- Editing project details (Name, Location, Client)
- Editing Local Scope and Site Conditions
- Update propagation to File System (`.sws` header)

### User Personas
- **Primary**: HVAC designers updating project details
- **Secondary**: Project managers

### Success Criteria
- Metadata changes write to disk (`.sws`)
- Dashboard updates (re-scan or list update)
- Window title updates

### Platform Summary (Tauri Offline)
- **Storage**: Local File System (`.sws` JSON file)
- **Persistence**: Immediate write to disk on Save
- **Backup**: Optional `.bak` created before write (safety)
- **Offline**: Inherently offline

## PRD References
- **FR-PM-003**: Edit project metadata
- **AC-PM-003-004**: Changes save immediately to file

## Prerequisites
- User is in Canvas Editor
- Project file is writable (not read-only)

## User Journey Steps

### Step 1: Open Edit Project Metadata
**User Action**: Click "Edit" icon in Left Sidebar.
**System Response**: Sidebar switches to edit mode.

### Step 2: Edit Details
**User Action**: Update Name, Location, Client.
**System Response**: Input fields validate limits.

### Step 3: Save Changes
**User Action**: Click "Save".
**System Response**:
1. Validate inputs.
2. Update `ProjectStore`.
3. **Persist**: Use Tauri FS API to read file, update metadata section, write back to disk.
4. Update App Window Title.
5. Show "Saved" toast.

### Step 4: Verify Updates
**User Action**: Open file in text editor or navigate to Dashboard.
**System Response**: File header contains new metadata.

## Edge Cases
- **File Locked**: If file open in another app, save fails (Show "File Locked" error).
- **File Deleted**: If file deleted while open, save prompts to "Save As".

## Related Elements
- `EditProjectDialog`
- `ProjectStore`
- `FileSystemService` (Tauri)
