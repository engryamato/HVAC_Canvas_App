# User Journey: Export to JSON (Project Save)

## 1. Overview

### Purpose
To document the process of serializing the entire project state to a JSON file for backup, version control, or sharing between users.

### Scope
- Saving local project state to a file
- Serializing entity data, settings, and metadata

### User Personas
- **Primary**: All Users (Data backup)

### Success Criteria
- valid JSON file generated
- File can be re-imported (reference Import journey)

## 2. PRD References

### Related PRD Sections
- **Section 4.2: File Operations** - Save/Load functionality.

## 3. Prerequisites

### User Prerequisites
- Active project open.

## 4. User Journey Steps

### Step 1: Trigger Save/Export

**User Actions:**
1. Click "File" > "Save As" or "Export Project".

**System Response:**
1. System gathers state from `ProjectStore`, `EntityStore`, `SettingsStore`.
2. System constructs JSON object.
3. System triggers download of `[ProjectName].json`.

**Related Elements:**
- Modules: `src/features/export/json.ts`
- Stores: `ProjectStore`, `EntityStore`

## 6. Error Scenarios and Recovery

1. **Serialization Error**
   - **Scenario**: Circular reference or invalid data preventing JSON stringify.
   - **Handling**: Catch error, alert user "Failed to save project".

## 11. Related Documentation
- [UJ-EXP-001: Export to PDF](UJ-EXP-001-ExportToPDF.md)
