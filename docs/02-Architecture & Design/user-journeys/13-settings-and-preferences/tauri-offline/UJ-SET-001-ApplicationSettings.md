# [UJ-SET-001] Application Settings (Tauri Offline)

## Overview
This user journey covers configuring application preferences in the **Native Desktop Environment**.

## Prerequisites
- **Storage**: JSON File (`settings.json`).
- **Location**: `%APPDATA%/SizeWise/` (Windows), `~/Library/Application Support/SizeWise/` (macOS).

## User Journey Steps

### Step 1: Open Settings
**User Action**: Click Settings Gear.
**System Response**:
- **Read**: Reads file from disk.
- **Parse**: Decodes JSON.

### Step 2: Change Preference
**User Action**: Change "Auto-Save Interval".
**System Response**:
- **Action**: Update State.
- **Write**: Writes to `settings.json` immediately.

## Edge Cases

### 1. Corrupted Config
**Scenario**: User manually edits JSON and breaks syntax.
**Handling**:
- **Error**: Parse fails.
- **Reset**: App backs up broken file (`settings.json.bak`) and creates fresh default config.
- **Notify**: "Settings reset due to corruption."

## Related Documentation
- [Open Project](../08-file-management/tauri-offline/UJ-FM-004-LoadProjectFromFile.md)