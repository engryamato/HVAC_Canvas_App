# User Journey: Application Settings (Core)

## 1. Overview

### Purpose
To document the configuration of global application preferences that affect the user experience across all platforms (Web and Desktop).

### Scope
- Changing Theme (Dark/Light)
- Setting configurations (Autosave, Units)
- Persisting state via Core Store

### User Personas
- **Primary**: All Users

### Success Criteria
- Settings changes are reflected immediately in the UI
- Settings are persisted across sessions

## 2. PRD References

### Related PRD Sections
- **Section 4.8: User Settings** - Default preferences and configuration.

## 3. Prerequisites

### System Prerequisites
- `PreferencesStore` initialized.

## 4. User Journey Steps

### Step 1: Access Settings

**User Actions:**
1. Click the "Settings" gear icon in the toolbar or sidebar.

**System Response:**
1. Settings modal/panel opens.
2. Current values loaded from `PreferencesStore`.

### Step 2: Modify Theme

**User Actions:**
1. Toggle "Dark Mode" switch.

**System Response:**
1. `PreferencesStore.toggleTheme()` is called.
2. Application root CSS class changes (e.g., `.dark-theme`).
3. UI colors update instantly.

### Step 3: Modify Autosave Interval

**User Actions:**
1. Select a new interval from dropdown (e.g., "5 mins").

**System Response:**
1. `PreferencesStore.setAutosaveInterval(5)` is called.
2. Autosave timer is reset with new duration.

**Related Elements:**
- Stores: `src/core/store/preferencesStore.ts`

## 11. Related Documentation
- [Hybrid Implementation](./hybrid/UJ-SET-001-ApplicationSettings.md)
- [Tauri Implementation](./tauri-offline/UJ-SET-001-ApplicationSettings.md)
