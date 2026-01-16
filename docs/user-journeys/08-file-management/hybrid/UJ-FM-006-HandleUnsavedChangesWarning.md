# [UJ-FM-006] Handle Unsaved Changes (Hybrid/Web)

## Overview
This user journey covers preventing data loss when a user attempts to leave the application with unsaved work in the **Web Environment**.

## Prerequisites
- **Event**: `window.onbeforeunload`.
- **Router**: Navigation Guards (Blocking route change).

## User Journey Steps

### Step 1: Internal Navigation (Router)
**User Action**: User clicks "Dashboard" link in sidebar.
**System Response**:
- **Check**: `hasUnsavedChanges`.
- **Action**: Pause navigation.
- **UI**: Show Custom React Modal "Save Changes?".
- **Result**:
  - Save: Save -> Navigate.
  - Discard: Navigate.
  - Cancel: Stay.

### Step 2: External Navigation (Browser)
**User Action**: User reloads page (F5) or closes Tab.
**System Response**:
- **Event**: `beforeunload` fires.
- **Action**: `e.preventDefault()`, `e.returnValue = ''`.
- **UI**: Browser Native Dialog "Leave Site? Changes you made may not be saved." (Text not customizable).

## Related Documentation
- [Close Project](./UJ-FM-005-CloseProject.md)
