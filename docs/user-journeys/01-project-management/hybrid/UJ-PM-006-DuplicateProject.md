# [UJ-PM-006] Duplicate Project (Hybrid/Web)

## Overview

### Purpose
This document describes how users duplicate projects in the Hybrid/Web platform.

### Scope
- Cloning project data in IndexedDB
- Generating unique names (" - Copy")
- Quota management

### User Personas
- **Primary**: Designers creating variants

### Success Criteria
- Exact copy created in IndexedDB
- New project appears in Dashboard
- ID and CreatedAt updated

### Platform Summary (Hybrid/Web)
- **Storage**: IndexedDB
- **Process**: Read object -> Deep Clone (JSON) -> Write new object
- **Quota**: Check `navigator.storage.estimate()` before duplication. Fail if insufficient.

## Prerequisites
- Project exists in IndexedDB
- Sufficient storage quota

## User Journey Steps

### Step 1: Initiate Duplication
**User Action**: Click "Duplicate" in menu.
**System Response**: Show "Duplicating..." state.

### Step 2: Processing
**System Response**:
1. Read source from IDB.
2. Generate new ID (`uuid`).
3. Generate new Name (Append " - Copy").
4. Check Quota.
5. Write new object to IDB.
6. Copy Thumbnail (Blob).

### Step 3: Completion
**System Response**:
1. Add to `ProjectListStore`.
2. Show Success Toast.

## Edge Cases
- **Quota Exceeded**: Show error "Storage Full".
- **IDB Transaction Error**: Rollback.

## Related Elements
- `ProjectCard`
- `IndexedDBService`
