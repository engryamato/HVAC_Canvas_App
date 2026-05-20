# [UJ-FM-004] Load Project (Import) (Hybrid/Web)

## Overview
This user journey covers importing a project file (`.sws` / `.json`) from the User's Device into the Web Application.

## Prerequisites
- **API**: `FileReader` API.
- **UI**: `<input type="file">` hidden element or Drag-and-Drop zone.

## User Journey Steps

### Step 1: Trigger Import
**User Action**: Click "Import" button.
**System Response**:
- **Action**: Programmatically clicks hidden file input.
- **OS**: Opens Browser File Picker.

### Step 2: File Read
**User Action**: User selects file.
**System Response**:
- **Event**: `change` event on input.
- **Read**: `FileReader.readAsText(file)`.
- **Parse**: `JSON.parse`.
- **Validation**: Schema Check.

### Step 3: Hydration
**System Action**:
1. Clear current internal state.
2. Populate Stores with parsed data.
3. Save to localStorage as new "Open" project.

## Edge Cases (Web Specific)

### 1. Large Files
**Scenario**: 100MB+ JSON file.
**Handling**:
- **Blocks UI**: Warn user "Processing large file... this may freeze for a moment".
- **Optimization**: Use `Blob` slicing or `Stream API` if possible (advanced).

## Related Documentation
- [Manual Save](./UJ-FM-001-ManualSave.md)
