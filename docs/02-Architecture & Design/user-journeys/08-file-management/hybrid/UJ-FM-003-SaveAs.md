# [UJ-FM-003] Save As / Clone Project (Hybrid/Web)

## Overview
This user journey covers saving a copy of the current project within the Application's Internal Storage (localStorage). Since Web Apps cannot freely write to arbitrary file paths without user interaction every time, this "Save As" effectively functions as "Clone Project".

## Prerequisites
- **Storage**: localStorage available.

## User Journey Steps

### Step 1: Trigger Save As
**User Action**: `Ctrl + Shift + S`.
**System Response**:
- **Dialog**: "Save Copy As...".
- **Input**: New Project Name (e.g. "MyProject - Copy").
- **Action**: Duplicates the project record in `projectListStore` and localStorage.

### Step 2: Post-Save Action
**User Action**: User chooses "Open new copy".
**System Response**:
- **Navigation**: Redirects to `/canvas/{newProjectId}`.

## Edge Cases (Web Specific)

### 1. Quota Exceeded
**Scenario**: Storage full.
**Handling**:
- **Toast**: "Cannot create copy. Storage full."

## Related Documentation
- [Manual Save](./UJ-FM-001-ManualSave.md)
