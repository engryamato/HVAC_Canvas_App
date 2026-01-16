# [UJ-PM-004] Delete Project (Hybrid/Web)

## Overview

### Purpose
This document describes how users permanently delete projects in the Hybrid/Web platform.

### Scope
- Deleting projects from IndexedDB
- Removing references from localStorage (Recent Projects)
- Confirmation flow

### User Personas
- **Primary**: Designers cleaning up local browser storage
- **Secondary**: Users freeing up quota space

### Success Criteria
- Project removed from IndexedDB
- Storage quota reclaimed
- UI updates immediately

### Platform Summary (Hybrid/Web)
- **Storage**: IndexedDB
- **Deletion**: Transactional delete from IDB object store
- **Recovery**: None (Irreversible) - unless project was synced to cloud
- **Quota**: Deletion frees up browser storage quota

## Prerequisites
- Project exists in IndexedDB

## User Journey Steps

### Step 1: Initiate Delete
**User Action**: Click "Delete" icon on Dashboard.
**System Response**: Show Confirmation Dialog ("This action cannot be undone").

### Step 2: Confirm Deletion
**User Action**: Type Project Name to confirm.
**System Response**: Enable "Delete" button.

### Step 3: Execute Deletion
**User Action**: Click "Delete".
**System Response**:
1. Remove from `ProjectListStore`.
2. Delete from `IndexedDB` (async).
3. Clear from `localStorage` ("Recent Projects").
4. Show Success Toast.

### Step 4: UI Update
**System Response**: Project card removed. Empty state shown if last project.

## Edge Cases
- **IDB Error**: Deletion fails (e.g. database locked). Show error toast.
- **Concurrent Tab**: If project open in another tab, that tab may crash or throw errors on next save.

## Related Elements
- `DeleteConfirmDialog`
- `IndexedDBService`
