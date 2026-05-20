# [UJ-FM-010] Import Reference Image (Hybrid/Web)

## Overview
This user journey covers importing an image file (JPG/PNG) as a background reference in the **Web Environment**.

## Prerequisites
- **API**: `FileReader` / `URL.createObjectURL`.
- **Component**: Hidden `<input type="file">`.

## User Journey Steps

### Step 1: Trigger Import
**User Action**: Click "Import Image" button.
**System Response**:
- **Action**: Opens Browser File Picker.
- **Filter**: `image/*`.

### Step 2: Processing
**User Action**: Select image.
**System Response**:
- **Read**: Reads file into Blob.
- **Convert**: Creates Object URL (`blob:...`).
- **Render**: Adds Image Entity to Canvas.
- **Storage**: Converts to Base64 (or stores Blob in IDB) for persistence.

## Edge Cases

### 1. Large Image
**Scenario**: User uploads 20MB Raw photo.
**Handling**:
- **Resize**: Can optionally resize on client client-side (Canvas API) before storing to save IDB space.
- **Warning**: "Image is very large and may slow down the project."

## Related Documentation
- [Load Project](./UJ-FM-004-LoadProjectFromFile.md)
