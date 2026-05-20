# [UJ-FM-009] Recover Project (Tauri Offline)

## Overview
This user journey covers recovering a project after an application crash or power loss in the **Native Desktop Environment**.

## Prerequisites
- **Storage**: Temp Files usage enabled.

## User Journey Steps

### Step 1: Detect AutoSaves
**System Action**: App Initializes.
**System Response**:
- **Check**: Scans `%APPDATA%/SizeWise/AutoSaves/` directory.
- **Match**: Finds `MyProject.hvac` (AutoSave) newer than `MyProject.hvac` (Original).
- **Prompt**: "Newer AutoSave found. Would you like to recover it?"

### Step 2: Recover
**User Action**: User confirms.
**System Response**:
- **Action**: Loads AutoSave file.
- **Save**: User must explicitly Save to overwrite original.

## Related Documentation
- [Auto-Save](./UJ-FM-002-AutoSave.md)
