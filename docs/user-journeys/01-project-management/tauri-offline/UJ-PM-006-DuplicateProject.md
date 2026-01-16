# [UJ-PM-006] Duplicate Project (Tauri Offline)

## Overview

### Purpose
This document describes how users duplicate projects in the Tauri Desktop platform.

### Scope
- Cloning project files on disk
- Generating unique filenames

### User Personas
- **Primary**: Designers creating variants

### Success Criteria
- New `.sws` file created
- New project appears in Dashboard

### Platform Summary (Tauri Offline)
- **Storage**: File System
- **Process**: Read File -> Parse -> Update Metadata -> Write New File
- **Naming**: Ensure filename uniqueness (prevent overwrite)

## Prerequisites
- Source file readable
- Destination directory writable

## User Journey Steps

### Step 1: Initiate Duplication
**User Action**: Click "Duplicate".
**System Response**: Show "Duplicating...".

### Step 2: Processing
**System Response**:
1. Read source file.
2. Generate new ID.
3. Generate new Name.
4. Generate new Filename (`name-copy.sws`).
5. Write new file.
6. Copy thumbnail file (`.thumb.png`).

### Step 3: Completion
**System Response**:
1. Add new file to `ProjectListStore`.
2. Show Success Toast.

## Edge Cases
- **Disk Full**: Write fails. Show error.
- **Filename Collision**: Auto-increment counter (Copy 2, Copy 3).

## Related Elements
- `ProjectCard`
- `FileSystemService`
