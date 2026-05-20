# [UJ-FM-005] Close Project (Hybrid/Web)

## Overview
This user journey covers closing the current project and returning to the Dashboard in the **Web Environment**.

## Prerequisites
- **State**: Project is loaded.
- **Route**: User is at `/canvas/{id}`.

## User Journey Steps

### Step 1: Trigger Close
**User Action**: Click "Close Project" in Menu or `Ctrl+W` (Note: `Ctrl+W` usually closes Browser Tab, so App uses `Shift+W` or specific UI button).
**System Response**:
- **Check**: Are there unsaved changes? (`hasUnsavedChanges`).
  - **Yes**: Show Warning Dialog.
  - **No**: Proceed to Step 2.

### Step 2: Cleanup & Navigation
**System Action**:
1. Clear partial store states (`selection`, `history`).
2. Keeping `entities` cached for potentially quick re-open (optional) or full clear.
3. **Router**: Navigate to `/dashboard`.

## Edge Cases (Web Specific)

### 1. Browser Tab Close
**Scenario**: User clicks "X" on Browser Tab.
**Handling**:
- **Event**: `window.onbeforeunload`.
- **Warning**: Browser native "Leave site?" dialog appears (Standard Web behavior). App cannot customize this text.

## Related Documentation
- [Unsaved Changes Warning](./UJ-FM-006-HandleUnsavedChangesWarning.md)
