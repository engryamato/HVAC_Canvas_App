# User Journey: Application Recovery

## 1. Overview

### Purpose
This user journey describes how a user recovers from application-level failures or crashes in the SizeWise HVAC Canvas App.

### Scope
- Crash handling with uncaught exception rendering the "Something went wrong" screen 
- Recovery process by clicking "Reload Application" to reset state
- System stability after failure event

### User Personas
- **Primary**: HVAC Designer
- **Secondary**: Project Manager

### Success Criteria
- Error screen is clearly displayed when app crashes 
- Clicking reload button resets all application components and returns to working state
- No persistent data corruption or loss of entities during recovery process

## 2. PRD References

### Related PRD Sections
- **Section 6.1: Application Stability** - This document implements error boundaries for unhandled exceptions in the app.

### Key Requirements Addressed
- REQ-ERR-001: The application must gracefully handle unexpected runtime errors
- REQ-ERR-002: When a crash occurs, the user should be able to reload and regain full functionality 

## 3. Prerequisites

### User Prerequisites
- A project is open with canvas visible and active

### System Prerequisites
- ErrorBoundary component initialized and wrapping core application layout
- UI components are structured to catch errors from child elements 

### Data Prerequisites
- None required (this journey focuses on runtime error recovery)

### Technical Prerequisites
- `ErrorBoundary.tsx` component is mounted at top-level app container
- System has mechanisms for logging crash reports and triggering reload behavior

## 4. User Journey Steps

### Step 1: Application Crashes Due to Unhandled Exception
**User Actions:**
1. Cause a runtime error (e.g., by clicking on invalid component, breaking code)
2. Wait for the UI to become unresponsive or display an error screen
3. Observe "Something went wrong" message appears in place of app interface 

**System Response:**
1. Error boundary intercepts JavaScript exception that isn't handled elsewhere
2. Displays error screen with clear message about failure (e.g., "Something went wrong")
3. Provides a prominent button labeled "Reload Application"
4. Logs the error to console and possibly an external crash reporting service 

**Visual State:**
```
[Error Screen]
  [Something went wrong] 
    Error ID: ER-2025-04-05-1349
    [Reload Application] <- Clickable Button
```

**User Feedback:**
- Clear error message stating what happened
- Notification toast or banner indicating crash occurred in UI (if enabled)

**Related Elements:**
- Components: `ErrorBoundary`, `AppRoot` 
- Stores: None
- Services: Error reporting service (e.g., Sentry)
- Events: `onApplicationCrash`, `onReloadClicked`

### Step 2: User Clicks "Reload Application"
**User Actions:**
1. Click the "Reload Application" button displayed on error screen

**System Response:**
1. Component triggers full application restart (page refresh or hot reload)
2. All state is reset to initial values 
3. Canvas resets to empty state or previous saved project if possible 
4. UI elements reinitialize from scratch with no cached errors

**Visual State:**
```
[App Restarting]
  [Loading...] 
    Initializing Core Services...
      EntityStore: Reset
      PreferencesStore: Reset
      Canvas Component: Re-rendered
```

**User Feedback:**
- Loading indicator or spinner during restart phase
- Visual feedback on UI that application is restoring itself

**Related Elements:**
- Components: `ErrorBoundary`, `AppRoot` 
- Stores: All stores reset to initial values (`EntityStore`, `PreferencesStore`) 
- Services: `reloadService`
- Events: `onReloadInitiated`, `onResetComplete`

### Step 3: Application Restarts and Returns to Normal State
**User Actions:**
1. Wait for restart process to complete (e.g., page reload finishes)
2. Observe that app initializes properly with default settings 
3. Check if any unsaved changes are restored or prompt to save them first

**System Response:**
1. Application fully reinitializes its state and components without error
2. Error boundary no longer intercepts anything as app is stable again
3. Default UI appears (e.g., main toolbar, canvas)
4. All previous user preferences are applied if persisted in localStorage
5. If there was an active project, it should be restored from local cache or last known good state 

**Visual State:**
```
[App Ready]
  [Main Toolbar Visible] 
    Canvas: Empty 
      No Error Messages Present 
```

**User Feedback:**
- App appears fully functional with no error indicators
- All expected UI components are present and responsive 

**Related Elements:**
- Components: `ErrorBoundary`, `AppRoot` 
- Stores: All stores reset to initial values (`EntityStore`, `PreferencesStore`) 
- Services: None (recovery handled by browser reload)
- Events: `onAppRestarted`, `onReadyState`

### Step 4: Validate Successful Recovery from Crash
**User Actions:**
1. Verify that no previous entities or preferences are corrupted after restart
2. Try a basic interaction like placing an RTU on the canvas 
3. Close application and reopen to ensure persistence is maintained

**System Response:**
1. UI components render correctly with fresh data state (no legacy errors)
2. User can perform basic actions without further crashes or issues
3. All previous settings are intact after restart if persisted in storage
4. Canvas reflects clean, stable starting point 

**Visual State:**
```
[Canvas]
  [RTU-01] Placed
    UI Operational: No Errors
```

**User Feedback:**
- No crash messages or error warnings present after restart
- Application feels fresh and responsive again

**Related Elements:**
- Components: `AppRoot`, `Canvas` 
- Stores: All stores initialized correctly (`EntityStore`, `PreferencesStore`) 
- Services: None (recovery handled by browser)
- Events: `onStableState`, `onRecoverySuccessful`

### Step 5: Post Recovery Validation
**User Actions:**
1. Confirm that no data was lost during the crash and recovery process
2. Test additional features like export, undo/redo, sidebar interactions 
3. Check if any error logs were generated in console or external tools 

**System Response:**
1. No evidence of previous crashes (no stale errors)
2. All core application functions operate normally without issues 
3. Application continues to behave as expected with full functionality restored
4. User can proceed with design work seamlessly after recovery 

**Visual State:**
```
[App Fully Functional]
  [Canvas Active] 
    [Toolbar Available]
      [Export Menu Opened]
        PDF | CSV | JSON
```

**User Feedback:**
- Full app functionality restored and accessible
- No lingering issues or warnings after restart

**Related Elements:**
- Components: `AppRoot`, `Canvas`, `ExportMenu` 
- Stores: All stores reset properly (`EntityStore`, `PreferencesStore`) 
- Services: None (recovery handled by browser)
- Events: `onFullRecoveryCheckComplete`

## 5. Edge Cases and Handling

1. **Crash During Export**
   - **Scenario**: User is exporting a large PDF when crash occurs mid-process
   - **Handling**: System ensures no partial exports or corrupted files are saved, clears temporary data 
   - **Test Case**: `tests/e2e/error/crash-during-export`

2. **Persistent Error Loop**
   - **Scenario**: App keeps crashing repeatedly on reload due to faulty state in localStorage or cache
   - **Handling**: System displays advanced error message asking user to clear browser cache or contact support 
   - **Test Case**: `tests/e2e/error/crash-loop`

3. **Network Failure During Initialization**
   - **Scenario**: App fails to load required libraries from CDN during startup due to network issues 
   - **Handling**: System falls back to offline mode with minimal functionality if possible, shows retry options for connection retries
   - **Test Case**: `tests/e2e/error/network-failure`

4. **Critical Store Corruption**
   - **Scenario**: EntityStore or PreferencesStore is corrupted after a crash 
   - **Handling**: System detects corruption and resets these stores to defaults while preserving other data (e.g., canvas layout)
   - **Test Case**: `tests/e2e/error/store-corruption`

5. **Browser Compatibility Issues**
   - **Scenario**: Application uses features only supported in modern browsers, causing runtime failure on older versions 
   - **Handling**: System gracefully shows compatibility error and suggests using a newer browser version for full functionality 
   - **Test Case**: `tests/e2e/error/browser-compatibility`

## 6. Error Scenarios and Recovery

1. **Unhandled JavaScript Exception**
   - **Scenario**: An uncaught exception is thrown during render or interaction, causing app to freeze or crash
   - **Recovery**: System immediately displays error screen with reload button; logs detailed stack trace for debugging purposes 
   - **User Feedback**: "Something went wrong. Please try reloading the application."

2. **Memory Leak During Canvas Rendering**
   - **Scenario**: App uses excessive memory during large canvas render causing instability or browser tab crash
   - **Recovery**: System detects high memory usage and either throttles rendering or forces a hard reload if needed
   - **User Feedback**: "Performance issues detected. Restarting..."

3. **Critical Data Loss During Crash**
   - **Scenario**: User has unsaved changes that were lost during unexpected crash 
   - **Recovery**: System implements auto-save mechanism and/or prompt to confirm loss of unsaved data before recovery 
   - **User Feedback**: "You have unsaved changes. Restarting now may lose progress."

## 7. Performance Considerations
- Error handling should not block the UI thread for more than 50ms during crash detection or display
- Recovery process must be fast enough to prevent long wait times (ideally under 2 seconds)
- All error messages must be localized and accessible in multiple languages

## 8. Keyboard Shortcuts
| Action | Shortcut | Context |
|--------|----------|---------|
| Reload Application | F5 or Ctrl + R | When application is in crash state |

## 9. Accessibility & Internationalization
- All error messages are properly labeled for screen readers with ARIA roles 
- Error boundaries display error text clearly without requiring visual context 
- Language support includes English, Spanish, French as per UI localization standards

## 10. Key UI Components & Interactions
- `ErrorBoundary.tsx`: Catches errors in child components and displays recovery screen
- `AppRoot`: Top-level component that ensures error boundaries are applied correctly across app structure 

## 11. Related Documentation
- [Prerequisites]: ../08-file-management/UJ-FIL-001-OpenProject.md
- [Related Elements]: ./ErrorBoundary, AppRoot
- [Next Steps]: None specified

## 12. Automation & Testing

### Unit Tests
- `src/__tests__/components/ErrorBoundary.test.ts`

### Integration Tests
- `src/__tests__/integration/error/integration.test.ts`

### E2E Tests
- `tests/e2e/error/application-recovery.e2e.js`

## 13. Notes
- The system is designed to isolate crashes and prevent them from propagating beyond the error boundary to cause cascading failures 
- User experience during crash recovery focuses on minimizing disruption of workflow
- All crash data is logged for post-mortem analysis to improve future stability