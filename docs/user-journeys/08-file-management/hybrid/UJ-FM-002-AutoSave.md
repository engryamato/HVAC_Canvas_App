# [UJ-FM-002] Auto-Save (Hybrid/Web)

## Overview
This user journey covers the automatic background saving of project changes to **localStorage** to ensure data persistence across page reloads.

## Prerequisites
- **Storage**: localStorage.
- **Settings**: Auto-Save Enabled (Default: On).

## User Journey Steps

### Step 1: Change Detection
**User Action**: User modifies an Entity.
**System Response**:
- **Store**: Marks `hasUnsavedChanges = true`.
- **Timer**: 300-second interval (configurable).

### Step 2: Persistence Execution
**System Action**: Timer fires.
**System Response**:
- **Serialization**: `JSON.stringify(project)`.
- **Storage**: `localStorage.setItem(storageKey, serializedProject)`.
- **Feedback**: Small indicator "Saved locally" in status bar.
- **Optimization**: Uses `requestIdleCallback` to avoid blocking UI during serialization.

## Edge Cases (Web Specific)

### 1. Quota Exceeded
**Scenario**: localStorage limit reached (browser typically allows ~5MB per origin).
**Handling**:
- **Error**: `QuotaExceededError`.
- **Fallback**: Show warning "Storage Full. Please Export your project."
- **Disable**: Auto-save pauses to prevent spamming errors.

### 2. Privacy Mode
**Scenario**: User in Incognito.
**Handling**:
- **Data Loss**: Data clears when window closes.
- **Warning**: App detects lack of persistence (if possible) or warns on startup.

## Related Documentation
- [Manual Save](./UJ-FM-001-ManualSave.md)
