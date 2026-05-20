# [UJ-SET-001] Application Settings (Hybrid/Web)

## Overview
This user journey covers configuring application preferences in the **Web Environment**.

## Prerequisites
- **Storage**: `window.localStorage`.
- **Key**: `sizewise_prefs`.

## User Journey Steps

### Step 1: Open Settings
**User Action**: Click Settings Gear.
**System Response**:
- **Read**: `localStorage.getItem('sizewise_prefs')`.
- **Parse**: `JSON.parse`.
- **Fallback**: Default constants if null.

### Step 2: Change Preference
**User Action**: Toggle "Dark Mode".
**System Response**:
- **Action**: Update React Context / Store.
- **Persist**: `localStorage.setItem(...)`.
- **Apply**: CSS Class update.

## Edge Cases (Web Specific)

### 1. Cleared Data
**Scenario**: User clears Browser Cookies/Site Data.
**Handling**:
- **Result**: Settings reset to defaults.
- **Recovery**: None (Expected Web behavior).

## Related Documentation
- [Open Project](../08-file-management/hybrid/UJ-FM-004-LoadProjectFromFile.md)