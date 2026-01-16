# User Journey: Canvas Shortcuts (Hybrid/Web)

## 1. Overview

### Purpose
This user journey describes the keyboard shortcuts available for interacting with elements on the canvas in the Web/Hybrid environment.

### Scope
- Undo/Redo actions using Ctrl + Z / Ctrl + Y
- Delete selected features (Del / Backspace)
- Pan canvas (Space + Drag)
- Zoom canvas (Ctrl + Scroll)
- **Warning: Browser Conflict Management**

### User Personas
- **Primary**: HVAC Designer
- **Secondary**: Project Manager

### Success Criteria
- Keyboard shortcuts respond instantly
- **Browser default actions (e.g., Ctrl+P) are prevented where possible**
- Conflicts are clearly documented for the user

## 2. PRD References

### Related PRD Sections
- **Section 5.1: Canvas Navigation**
- **Section 3.3: Selection Tools**

### Key Requirements Addressed
- REQ-KB-001: Undo/Redo with Ctrl+Z/Y
- REQ-KB-WEB-001: Gracefully handle browser reserved keys

## 3. Prerequisites

### User Prerequisites
- A project is open with canvas visible and active

### System Prerequisites
- Browser focus is on the Canvas DOM element

## 4. User Journey Steps

### Step 1: Undo/Redo Using Ctrl + Z / Ctrl + Y
**User Actions:**
1. Make changes to canvas (e.g., draw a duct)
2. Press "Ctrl" key + "Z" simultaneously (Undo) or 
3. Press "Ctrl" key + "Y" (Redo)

**System Response:**
1. System intercepts keydown event via `preventDefault()`
2. Executes Undo/Redo logic
3. **Note**: Ctrl+Shift+Z is also supported as Redo on some browsers

### Step 2: Delete Selected Features Using Del / Backspace
**User Actions:**
1. Select elements
2. Press "Del" or "Backspace"

**System Response:**
1. Deletes entities
2. **Note**: Backspace must NOT trigger "Back" navigation in browser

### Step 3: Pan Canvas Using Space + Drag
**User Actions:**
1. Hold "Space"
2. Drag mouse

**System Response:**
1. Panning mode active
2. **Note**: Spacebar must NOT trigger "Page Down" scroll on body

### Step 4: Zoom Canvas Using Ctrl + Scroll
**User Actions:**
1. Hold "Ctrl" and Scroll

**System Response:**
1. Zoom active
2. **Note**: Browser may attempt to zoom the entire page text. App must intercept `wheel` event with `{ passive: false }`.

## 5. Edge Cases and Handling

1. **Conflicting Browser Shortcuts**
   - **Scenario**: User presses **Ctrl+W** (Close Tab), **Ctrl+N** (New Window), **Ctrl+T** (New Tab), **Ctrl+P** (Print)
   - **Handling**: 
     - These are **Trusted Browser Shortcuts** and CANNOT be overridden by Javascript security policy.
     - App must NOT rely on these for critical functions in the Web version.
     - **Recommendation**: Use `Alt` modifiers or specific UI buttons for these actions.
   - **Test Case**: `tests/e2e/shortcuts/browser-conflicts`

2. **Focus Management**
   - **Scenario**: Focus is on URL bar or DevTools
   - **Handling**: App shortcuts will NOT fire. User must click canvas to refocus.

## 6. Error Scenarios and Recovery

1. **Shortcuts Disabled by Focus**
   - **Recovery**: User clicks canvas to restore focus.

## 7. Performance Considerations
- Input interception must happen in `<16ms` to prevent default browser paint.

## 8. Keyboard Shortcuts
| Action | Shortcut | Context | Notes |
|--------|----------|---------|-------|
| Undo | Ctrl + Z | Canvas | Intercepts Browser Undo |
| Redo | Ctrl + Y | Canvas | Intercepts Browser Redo |
| Delete | Del / Bksp | Canvas | Prevents Back Navigation |
| Pan | Space + Drag | Canvas | Prevents Page Scroll |
| Zoom | Ctrl + Scroll | Canvas | Prevents Page Zoom |

## 9. Accessibility & Internationalization
- Screen readers may intercept navigation keys. Canvas must implement `role="application"` to pass keys through.

## 10. Key UI Components & Interactions
- `Canvas`: Main focus target
- `useKeyboardShortcuts.ts`: Calls `event.preventDefault()`

## 11. Related Documentation
- [Prerequisites]: ../08-file-management/UJ-FIL-001-OpenProject.md

## 12. Automation & Testing
### E2E Tests
- `tests/e2e/shortcuts/canvas-shortcuts.e2e.js`

## 13. Notes
- **Web Limitations**: We cannot override `Ctrl+W`, `Ctrl+N`, `Ctrl+T`. Users should be educated via "Keyboard Shortcuts" modal.