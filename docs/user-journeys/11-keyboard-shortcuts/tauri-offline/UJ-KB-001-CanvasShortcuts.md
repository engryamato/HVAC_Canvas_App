# User Journey: Canvas Shortcuts (Tauri Offline)

## 1. Overview

### Purpose
This user journey describes the keyboard shortcuts available for interacting with elements on the canvas in the **Desktop (Tauri)** environment.

### Scope
- Undo/Redo actions using Ctrl + Z / Ctrl + Y
- Delete selected features (Del / Backspace)
- Pan canvas (Space + Drag)
- Zoom canvas (Ctrl + Scroll)
- **Native Menu Integration** (Ctrl+N, Ctrl+S, Ctrl+O)

### User Personas
- **Primary**: HVAC Designer
- **Secondary**: Project Manager

### Success Criteria
- Keyboard shortcuts feel "Native"
- **App overrides system shortcuts where appropriate** (e.g. Ctrl+N creates new Project, not new Window)
- Shortcuts work globally even if specific focus is lost, unless in input field

## 2. PRD References

### Related PRD Sections
- **Section 5.1: Canvas Navigation**
- **Section 5.0: Native Integration**

### Key Requirements Addressed
- REQ-KB-001: Undo/Redo
- REQ-native-002: Implement standard OS shortcuts (New, Open, Save)

## 3. Prerequisites

### User Prerequisites
- App is running

### System Prerequisites
- `Tauri` global shortcuts registered

## 4. User Journey Steps

### Step 1: Undo/Redo Using Ctrl + Z / Ctrl + Shift + Z
**User Actions:**
1. Make changes
2. Press "Ctrl/Cmd + Z" (Undo)
3. Press "Ctrl/Cmd + Shift + Z" (Redo - Standard Desktop Convention)

**System Response:**
1. Tauri Menu bar flashes "Edit" menu
2. Native Undo stack modified

### Step 2: Global Project Actions (Native)
**User Actions:**
1. Press **Ctrl + N**
2. Press **Ctrl + O**
3. Press **Ctrl + S**

**System Response:**
1. **Ctrl + N**: Triggers "New Project" workflow (Dialog) - *Not new window*
2. **Ctrl + O**: Opens Native File Picker - *Not open file in browser*
3. **Ctrl + S**: Saves to Disk - *Not Save Page As*

### Step 3: Pan & Zoom
**User Actions:**
1. Space + Drag
2. Pinch to Zoom (Trackpad)

**System Response:**
1. Native gesture support enabled
2. Smooth 60fps rendering in Web View

## 5. Edge Cases and Handling

1. **System Conflicts**
   - **Scenario**: OS-level global shortcuts (e.g. Win+L).
   - **Handling**: App cannot override OS security keys.

## 6. Error Scenarios and Recovery

1.  **Menu Bar Disconnected**
    - **Recovery**: Shortcuts still work via JS event listeners as fallback.

## 7. Performance Considerations
- Shortcuts handled in Rust process are sent to Webview immediately.

## 8. Keyboard Shortcuts (Desktop)
| Action | Windows | macOS | Context |
|--------|---------|-------|---------|
| New Project | Ctrl + N | Cmd + N | Global |
| Open Project | Ctrl + O | Cmd + O | Global |
| Save Project | Ctrl + S | Cmd + S | Global |
| Save As | Ctrl + Shift + S | Cmd + Shift + S | Global |
| Undo | Ctrl + Z | Cmd + Z | Global |
| Redo | Ctrl + Y | Cmd + Shift + Z | Global |
| Settings | Ctrl + , | Cmd + , | Global |
| Quit App | Alt + F4 | Cmd + Q | Global |

## 9. Accessibility & Internationalization
- Menu Bar items show shortcuts visually.

## 10. Key UI Components & Interactions
- `Menu Bar`: Native OS menu
- `Tauri Global Shortcut API`: Registers keys

## 11. Related Documentation
- [Prerequisites]: ../08-file-management/UJ-FIL-001-OpenProject.md

## 12. Automation & Testing
### E2E Tests
- Playwright cannot test Native Menus easily.
- Use `tauri-driver` for native menu tests.

## 13. Notes
- **Native Power**: We have full control over `Ctrl+W`, `Ctrl+N` etc. unlike the Web version.