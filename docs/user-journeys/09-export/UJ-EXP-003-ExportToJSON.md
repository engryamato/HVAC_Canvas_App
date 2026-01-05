# User Journey: Export To JSON

## 1. Overview

### Purpose
This user journey describes how a user exports the entire project as a JSON file for archiving or transfer purposes.

### Scope
- Initiating "Save As" or "Export Project"
- System serializes EntityStore + ProjectStore state into structured JSON
- Resulting .json file structure overview

### User Personas
- **Primary**: HVAC Designer
- **Secondary**: Project Manager

### Success Criteria
- JSON file is successfully generated with full project data
- Download is initiated automatically with timestamped filename
- Export reflects current system state accurately

## 2. PRD References

### Related PRD Sections
- **Section 4.1: File Export Options** - This document implements the JSON export option under the main "File" menu.
- **Section 3.5: Project State Management** - The full project serialization is managed through this component

### Key Requirements Addressed
- REQ-EXP-005: User must be able to export entire project as JSON
- REQ-EXP-006: Export should preserve all entity, property, and configuration data

## 3. Prerequisites

### User Prerequisites
- A project is open with at least one entity on canvas

### System Prerequisites
- Canvas component is active with entities displayed
- Project state management UI accessible (e.g., Save As button in File menu)

### Data Prerequisites
- Entities and their properties have been saved to stores
- Any user preferences or settings are persisted correctly

### Technical Prerequisites
- `download.ts` service available for generating file from JSON string
- ProjectStore initialized with current project data
- EntityStore contains valid entity states

## 4. User Journey Steps

### Step 1: Initiate Save As/Export Project
**User Actions:**
1. Click "File" menu in toolbar
2. Select "Save As..."
3. Or select "Export Project" from submenu (if available)

**System Response:**
1. Menu opens and displays save/export options
2. System prepares file name with timestamped suffix
3. Shows progress indicator during serialization process

**Visual State:**
```
[Toolbar]
  File ->
    Save As... 
      [SizeWise_2025-04-05.json] <- Default filename shown
    Export Project 
```

**User Feedback:**
- Menu dropdown appears with options
- Visual indication of selected save/export type
- Progress spinner during file preparation

**Related Elements:**
- Components: `ExportMenu`, `Canvas`
- Stores: `ProjectStore` (for project metadata), `EntityStore` (entity data)
- Services: `download.ts` (export service)
- Events: `onSaveAsClick`, `onProjectExportClick`

### Step 2: Prepare JSON from Stores
**User Actions:**
1. System begins serialization process of entities and project metadata

**System Response:**
1. Collects all entity data from `EntityStore` (including properties)
2. Serializes `ProjectStore` state into JSON structure
3. Applies compression if enabled by user preferences
4. Generates full JSON string in memory

**Visual State:**
```
[Canvas]
  [JSON Serialization Process] 
    [Processing...] 
    [Ready to Download]
```

**User Feedback:**
- Visual loading indicator during serialization (e.g., progress bar)
- Confirmation toast that file is ready for download

**Related Elements:**
- Components: `ExportMenu`, `Canvas`
- Stores: `ProjectStore` (for project metadata), `EntityStore` (entity data)
- Services: `download.ts` (export service)
- Events: `onJSONSerializationComplete`

### Step 3: Download JSON File
**User Actions:**
1. Confirm download from dropdown or click "Save"

**System Response:**
1. System generates blob in browser memory with JSON string content
2. Triggers automatic download using `a` tag with `download=` attribute
3. Default filename is timestamped (e.g., `SizeWise_2025-04-05.json`)

**Visual State:**
```
[Browser Download Bar]
  [Download Started] 
  [File: SizeWise_2025-04-05.json] 
```

**User Feedback:**
- Browser downloads the file to default location
- Toast notification confirming successful export

**Related Elements:**
- Components: `ExportMenu`, `Canvas`
- Stores: None
- Services: `download.ts` (export service)
- Events: `onJSONDownloadComplete`

### Step 4: Post Export Confirmation
**User Actions:**
1. Observe download completion in browser interface

**System Response:**
1. No additional UI changes after successful download
2. Notification toast appears briefly if enabled
3. System logs export activity for audit trail (optional)

**Visual State:**
```
[Browser Download Bar]
  [Download Started] 
  [File: SizeWise_2025-04-05.json] 
```

**User Feedback:**
- Browser downloads the file to default location
- Optional notification of export success in UI (if applicable)

**Related Elements:**
- Components: `ExportMenu`, `Canvas`
- Stores: None
- Services: `download.ts` (export service), `historyService`
- Events: `onDownloadComplete`

### Step 5: Error Handling During Export
**User Actions:**
1. Trigger export when no data is present or invalid state exists

**System Response:**
1. System displays error message if generation fails due to corrupted data or missing dependencies
2. Shows retry option in UI (if available)
3. Logs error for diagnostics and debugging purposes

**Visual State:**
```
[Export Menu]
  [Error Modal Appears] 
    "Export failed: Project state not ready"
    Retry Button
    Cancel Button
```

**User Feedback:**
- Error toast appears with details
- Option to retry or cancel export

**Related Elements:**
- Components: `ExportMenu`, `ErrorBoundary`
- Stores: None
- Services: `download.ts` (export service)
- Events: `onJSONGenerationError`

## 5. Edge Cases and Handling

1. **No Entities Present**
   - **Scenario**: User attempts to export when no entities have been added yet
   - **Handling**: System generates minimal JSON with project metadata only, not an error
   - **Test Case**: `tests/e2e/export/json/no-entities`

2. **Large Project Size**
   - **Scenario**: Exporting a very complex canvas (over 10k entities)
   - **Handling**: System processes large datasets asynchronously to prevent UI freezing
   - **Test Case**: `tests/e2e/export/json/large-project`

3. **Corrupted Entity Data**
   - **Scenario**: Some entity data is malformed or missing critical fields
   - **Handling**: System skips invalid entities but continues export of valid ones, logs warnings
   - **Test Case**: `tests/e2e/export/json/corrupted-data`

4. **File System Permission Error**
   - **Scenario**: Browser cannot save to user's default download location
   - **Handling**: Shows error modal and suggests manual download path
   - **Test Case**: `tests/e2e/export/json/permission-error`

5. **Invalid Store Data**
   - **Scenario**: ProjectStore or EntityStore contains invalid or malformed data before export
   - **Handling**: System validates integrity of all stored data before proceeding with JSON generation
   - **Test Case**: `tests/e2e/export/json/invalid-stores`

## 6. Error Scenarios and Recovery

1. **JSON Serialization Failed**
   - **Scenario**: An unhandled exception occurs during JSON serialization (e.g., circular reference)
   - **Recovery**: System displays error message in modal with option to retry or cancel the action
   - **User Feedback**: "Failed to export JSON: Please check your project for malformed data and try again."

2. **Memory Exhaustion**
   - **Scenario**: Export process exceeds browser memory limits due to too much entity data
   - **Recovery**: System breaks down large dataset into chunks, processes them separately with user notification of progress
   - **User Feedback**: "Processing large project... Please wait"

3. **Download Failure**
   - **Scenario**: Download fails due to browser restrictions or corrupted file output
   - **Recovery**: System attempts to regenerate the JSON and retry download, with user notification if it happens more than twice
   - **User Feedback**: "Download failed. Retrying..."

## 7. Performance Considerations
- JSON generation should complete within 30 seconds for standard projects (≤10MB)
- Memory usage should be under 1GB during export process to prevent browser freezing
- Asynchronous processing is used for large datasets, with progress indicators shown

## 8. Keyboard Shortcuts
| Action | Shortcut | Context |
|--------|----------|---------|
| Export Project (when menu open) | Ctrl + Shift + S | When File > Save submenu is active |

## 9. Accessibility & Internationalization
- All buttons in export dialog are labeled with ARIA attributes for screen readers
- Keyboard focus navigates correctly through export options in menus
- Language support includes English, Spanish, French as per UI localization standards

## 10. Key UI Components & Interactions
- `ExportMenu`: Dropdown menu that allows user to choose between PDF/CSV/JSON exports
- `download.ts` service: Handles conversion logic and triggers download via browser API
- `ProjectStore`: Manages project metadata for serialization
- `EntityStore`: Holds all entity data required for complete export

## 11. Related Documentation
- [Prerequisites]: ../08-file-management/UJ-FIL-001-OpenProject.md
- [Related Elements]: ./ExportMenu, download.ts, ProjectStore, EntityStore
- [Next Steps]: None specified

## 12. Automation & Testing

### Unit Tests
- `src/__tests__/features/export/json.test.ts`

### Integration Tests
- `src/__tests__/integration/export/json.integration.test.ts`

### E2E Tests
- `tests/e2e/export/json/export-json.e2e.js`

## 13. Notes
- JSON export supports all entities, including those created from templates or libraries
- Exported data preserves all user preferences and settings as part of ProjectStore state
- The system handles circular references in entity properties to avoid serialization errors