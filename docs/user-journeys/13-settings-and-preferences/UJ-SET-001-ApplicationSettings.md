# User Journey: Application Settings

## 1. Overview

### Purpose
This user journey describes how a user accesses and modifies application-level settings for customization of the UI, behavior, and preferences.

### Scope
- Opening Settings Modal from File menu or toolbar
- Toggling "Dark Mode" (Theme)
- Changing specific application preferences (e.g., Autosave interval)
- System Response: Settings persisted to localStorage

### User Personas
- **Primary**: HVAC Designer
- **Secondary**: Project Manager

### Success Criteria
- Settings modal opens with all current preferences displayed
- Changes persist after closing and reopening the settings panel
- Preferences are stored in browser's `localStorage` or equivalent backend storage (if applicable)

## 2. PRD References

### Related PRD Sections
- **Section 3.1: User Customization** - This document implements customization options accessible through user profile access.

### Key Requirements Addressed
- REQ-SET-001: Users must be able to customize application theme (light/dark)
- REQ-SET-002: Users must configure autosave interval in minutes

## 3. Prerequisites

### User Prerequisites
- A project is open with canvas active and accessible

### System Prerequisites
- Application initialized properly with localStorage support

### Data Prerequisites
- None required (settings are independent of user data)

### Technical Prerequisites
- `preferencesStore.ts` service available for state management
- SettingsModal component initialized

## 4. User Journey Steps

### Step 1: Open Settings Modal
**User Actions:**
1. Click "File" menu in toolbar or main navigation bar
2. Select "Settings" from the dropdown list of options
3. Alternatively, use a dedicated keyboard shortcut (e.g., Ctrl + ,)

**System Response:**
1. Menu opens and displays settings options
2. Settings modal slides in with current saved preferences visible
3. UI provides visual feedback that settings are being loaded

**Visual State:**
```
[Toolbar]
  File ->
    [Settings] <- Selected
```

**User Feedback:**
- Modal appears smoothly on screen
- Current theme preference is reflected in toggle switch (e.g., dark mode)
- Autosave interval shown with selected value (default: 5 mins)

**Related Elements:**
- Components: `SettingsModal`, `Toolbar`
- Stores: `preferencesStore.ts` (for storing settings)
- Services: None
- Events: `onSettingsOpen`, `onThemeChange`, `onAutosaveIntervalChange`

### Step 2: Toggle Theme Preference
**User Actions:**
1. Click the "Dark Mode" toggle switch in the settings panel

**System Response:**
1. System updates theme preference state in `preferencesStore.ts` 
2. Applies CSS class to root container (e.g., `dark-theme`) to update UI appearance
3. Saves updated setting to browser's localStorage under key "appTheme"
4. Triggers re-render of entire UI components with new theme applied

**Visual State:**
```
[Settings Modal]
  Theme: [Dark Mode] 
    [ON] ✓
  [Light Mode] 
```

**User Feedback:**
- Immediate visual change in background and text elements to match selected mode
- Toast notification confirming theme update (e.g., "Theme changed to Dark")

**Related Elements:**
- Components: `SettingsModal`, `UIRoot` (canvas container)
- Stores: `preferencesStore.ts`
- Services: None
- Events: `onDarkModeToggle`, `onThemeApplied`

### Step 3: Change Autosave Interval
**User Actions:**
1. Locate "Autosave Interval" dropdown in settings panel
2. Select new value (e.g., 1, 5, or 10 minutes)

**System Response:**
1. System updates saved interval preference in `preferencesStore.ts`
2. Applies setting to all active project instances across app state
3. Saves updated configuration to browser's localStorage under key "autosaveInterval"
4. Shows confirmation toast when changed (e.g., "Autosave set to 5 mins")

**Visual State:**
```
[Settings Modal]
  Autosave Interval: [5 min] 
    [1 min] 
    [5 min] ✓
    [10 min] 
```

**User Feedback:**
- Dropdown menu opens to show all valid values
- Selected value is highlighted and confirmed in UI
- Toast notification indicates change has been applied

**Related Elements:**
- Components: `SettingsModal`, `Toolbar` (if applicable)
- Stores: `preferencesStore.ts`
- Services: None
- Events: `onAutosaveIntervalChange`, `onSaveConfig`

### Step 4: Close Settings Modal and Persist Changes
**User Actions:**
1. Click "Close" button or press Escape key on keyboard to exit settings panel

**System Response:**
1. Modal closes gracefully with smooth animation
2. All changes are persisted in localStorage across sessions
3. System updates all UI elements that depend on these preferences (e.g., theme)
4. No additional UI interaction required after closing modal

**Visual State:**
```
[Canvas]
  [UI Elements Updated With New Theme]
```

**User Feedback:**
- Modal closes without errors or warnings
- Changes persist when app reloads

**Related Elements:**
- Components: `SettingsModal`, `Toolbar`
- Stores: `preferencesStore.ts` (persisted changes)
- Services: None
- Events: `onCloseSettings`, `onPersistChanges`

### Step 5: Validate Persistence Across Sessions
**User Actions:**
1. Close app entirely and reopen it later
2. Check if settings are preserved after restart

**System Response:**
1. App initializes with previously saved preferences
2. Settings modal reflects same values as before session ended
3. UI displays correctly according to persisted theme preference
4. Autosave interval is re-applied from localStorage 

**Visual State:**
```
[App Startup]
  [Preferences Restored From LocalStorage]
    Theme: Dark Mode
    Autosave Interval: 5 mins
```

**User Feedback:**
- App starts with previous user preferences intact
- No loss of theme or autosave settings over sessions

**Related Elements:**
- Components: `SettingsModal`, `UIRoot` (canvas container)
- Stores: `preferencesStore.ts`
- Services: None
- Events: `onAppStart`, `onPreferencesLoaded`

## 5. Edge Cases and Handling

1. **Invalid Settings in LocalStorage**
   - **Scenario**: User manually alters localStorage with invalid values or corrupts data
   - **Handling**: System defaults to standard theme (light mode) and autosave interval (5 mins) if corrupted settings are detected at startup
   - **Test Case**: `tests/e2e/settings/invalid-localstorage`

2. **Theme Change Not Applied**
   - **Scenario**: User switches theme but no UI elements change after reload
   - **Handling**: System logs error and displays notification to user about invalid preference, then reverts to default setting (light mode)
   - **Test Case**: `tests/e2e/settings/theme-change-failure`

3. **Autosave Interval Not Saved**
   - **Scenario**: User changes autosave interval but value does not persist after restart or reload
   - **Handling**: System reverts to default (5 min) and shows error message if save fails
   - **Test Case**: `tests/e2e/settings/autosave-not-saved`

4. **File Permissions Error**
   - **Scenario**: Browser blocks access to localStorage due to privacy settings or extensions
   - **Handling**: System falls back to inline styles for default UI theme and uses a minimal auto-save interval if preferences cannot be saved
   - **Test Case**: `tests/e2e/settings/localstorage-permission`

5. **Too Many Settings Loaded**
   - **Scenario**: App has hundreds of settings loaded from storage in one go
   - **Handling**: System loads settings asynchronously with loading indicators to avoid UI blocking
   - **Test Case**: `tests/e2e/settings/many-settings-load`

## 6. Error Scenarios and Recovery

1. **Failed To Save Preferences**
   - **Scenario**: An unhandled exception occurs while saving preferences to browser's localStorage
   - **Recovery**: System displays an alert with error details, logs the issue in console for debugging, and continues running without crashing app
   - **User Feedback**: "Settings failed to save due to storage limitation. Please try again later or contact support."

2. **Theme Change Invalidated**
   - **Scenario**: System detects an invalid CSS class name passed during theme update (e.g., wrong file path)
   - **Recovery**: Default light mode is applied as fallback; logs error to console for developers
   - **User Feedback**: "Theme update failed. Switching back to default settings."

3. **Autosave Configuration Not Applied**
   - **Scenario**: User changes autosave but timer doesn't fire on schedule
   - **Recovery**: App tries to reinitialize the interval based on new value, shows notification if it fails
   - **User Feedback**: "Autosave settings updated. Please verify your project is saving as expected."

## 7. Performance Considerations
- All setting changes should be applied within 100 milliseconds of user input to maintain responsive UI
- Preference persistence uses minimal DOM manipulation and only updates when necessary
- Theme switching should not block or delay other UI interactions during update process

## 8. Keyboard Shortcuts
| Action | Shortcut | Context |
|--------|----------|---------|
| Open Settings Modal | Ctrl + , | When main toolbar is visible |

## 9. Accessibility & Internationalization
- All input fields in settings modal are labeled for screen readers using ARIA attributes
- Theme switcher has accessible contrast ratios for both light and dark modes
- Language support includes English, Spanish, French as per UI localization standards

## 10. Key UI Components & Interactions
- `SettingsModal`: Panel with toggle switches and dropdowns to change application preferences
- `preferencesStore.ts`: Service managing persistent settings in localStorage

## 11. Related Documentation
- [Prerequisites]: ../08-file-management/UJ-FIL-001-OpenProject.md
- [Related Elements]: ./SettingsModal, preferencesStore.ts
- [Next Steps]: None specified

## 12. Automation & Testing

### Unit Tests
- `src/__tests__/core/store/preferencesStore.test.ts`

### Integration Tests
- `src/__tests__/integration/settings/integration.test.ts`

### E2E Tests
- `tests/e2e/settings/application-settings.e2e.js`

## 13. Notes
- Settings are stored separately from entity or project data to avoid unnecessary sync operations during exports
- UI theme updates happen in real-time without full page reload
- Default settings will be applied if localStorage keys are missing or malformed at app start