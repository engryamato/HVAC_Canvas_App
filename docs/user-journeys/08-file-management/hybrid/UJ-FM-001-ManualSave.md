# [UJ-FM-001] Manual Save (Hybrid/Web)

## Overview

This user journey covers the workflow for manually saving an HVAC project in the Web/Hybrid environment. "Saving" in this context means committing the current project state to the browser's persistent storage (localStorage) to ensure it survives page reloads.

## Prerequisites

- User is in Canvas Editor page (`/canvas/{projectId}`)
- Project has been created or loaded
- localStorage is available
- Quota is available

## User Journey Steps

### Step 1: Trigger Manual Save

**User Action**: Press `Ctrl+S` (Windows/Linux) or `Cmd+S` (macOS) OR click "Save" button in toolbar

**Expected Result**:
- Save operation triggers `projectListStore` update
- Data serialized and stored in localStorage
- Toast notification: "Project saved locally"
- **Note**: This does NOT create a file on the user's hard drive (unless "Export" is used).

### Step 2: Persistence

**System Action**:
1. Serialize `ProjectFile` from robust stores.
2. Write to localStorage using `localStorage.setItem`.
3. Update `lastModified` timestamp.

**Validation**: E2E test verifying localStorage update.

---

## Edge Cases

### 1. Quota Exceeded
**Scenario**: Browser storage is full.
**Handling**: Show error toast "Storage quota exceeded. Please export to save your work."

### 2. Incognito Mode
**Scenario**: localStorage may be cleared on session close.
**Handling**: Warn user on startup that data clears on close.
