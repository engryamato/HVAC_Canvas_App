# [UJ-FM-009] Recover Project (Hybrid/Web)

## Overview
This user journey covers recovering a project after a browser crash or accidental tab closure in the **Web Environment**.

## Prerequisites
- **Storage**: localStorage must persist.
- **Trigger**: App Startup.

## User Journey Steps

### Step 1: Detect Unsaved Work
**System Action**: App Initializes.
**System Response**:
- **Check**: Scans localStorage for projects with `hasUnsavedChanges: true` OR `isDirty: true`.
- **Found**: Shows "Recovery" Banner on Dashboard.

### Step 2: Restore
**User Action**: Click "Recover" on project card.
**System Response**:
- **Action**: Loads the state from localStorage directly.
- **Feedback**: "Recovered unsaved changes from {time}".

## Edge Cases

### 1. Corrupted localStorage
**Scenario**: User clears browser data.
**Handling**:
- **Loss**: Data is gone. Web apps cannot recover from cleared local data.

## Related Documentation
- [Auto-Save](./UJ-FM-002-AutoSave.md)
