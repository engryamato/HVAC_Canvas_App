# [UJ-PM-003] Edit Project Metadata (Hybrid/Web)

## Overview

### Purpose
This document describes how users edit existing project metadata in the canvas editor (Hybrid/Web platform). Changes are persisted to IndexedDB and synchronized with the dashboard list.

### Scope
- Editing project details (Name, Location, Client)
- Editing Local Scope and Site Conditions
- Update propagation to IndexedDB and application state

### User Personas
- **Primary**: HVAC designers updating project details
- **Secondary**: Project managers reviewing info

### Success Criteria
- Metadata changes persist to IndexedDB
- Dashboard and browser title update without reload
- Invalid input prevented (e.g. empty name)

### Platform Summary (Hybrid/Web)
- **Storage**: IndexedDB (Active Project & Project List)
- **Persistence**: Auto-save triggers IDB update transaction
- **Sync**: Changes available immediately to other tabs (via storage events)
- **Offline**: Fully functional offline (local IDB)

## PRD References
- **FR-PM-003**: Edit project metadata
- **AC-PM-003-004**: Changes save immediately to store and IndexedDB

## Prerequisites
- User is in Canvas Editor
- Project loaded in memory

## User Journey Steps

### Step 1: Open Edit Project Metadata
**User Action**: Click "Edit" icon in Left Sidebar (Project Details).
**System Response**: Sidebar switches to edit mode or opens modal.

### Step 2: Edit Details
**User Action**: Update Name, Location, Client.
**System Response**: Input fields validate limits (max 100 chars).

### Step 3: Save Changes
**User Action**: Click "Save".
**System Response**:
1. Validate inputs.
2. Update `ProjectStore` (React State).
3. Update `ProjectListStore` (React State).
4. **Persist**: Write updated object to IndexedDB.
5. Update Browser Title.
6. Show "Saved" toast.

### Step 4: Verify Updates
**User Action**: Navigate to Dashboard.
**System Response**: Project card shows new name/details (loaded from IDB).

## Edge Cases
- **Quota Exceeded**: Save fails if IDB is full (Show error).
- **Concurrency**: If open in another tab, last save generally wins in simple IDB implementations (unless versioning is used).

## Related Elements
- `EditProjectDialog`
- `ProjectStore`
- `IndexedDBService`
