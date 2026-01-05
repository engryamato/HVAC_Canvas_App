# User Journey: Canvas Shortcuts

## 1. Overview

### Purpose
This user journey describes the keyboard shortcuts available for interacting with and manipulating elements on the canvas in SizeWise HVAC Canvas App.

### Scope
- Undo/Redo actions using Ctrl + Z / Ctrl + Y
- Delete selected features (Del / Backspace)
- Pan canvas (Space + Drag)
- Zoom canvas (Ctrl + Scroll)

### User Personas
- **Primary**: HVAC Designer
- **Secondary**: Project Manager

### Success Criteria
- Keyboard shortcuts respond instantly to user input
- All shortcut combinations are clearly defined and visible in UI if possible
- Shortcuts do not conflict with system or browser-level hotkeys

## 2. PRD References

### Related PRD Sections
- **Section 5.1: Canvas Navigation** - This document implements keyboard navigation tools used during canvas interactions.
- **Section 3.3: Selection Tools** - The delete and selection shortcuts rely on these components for full functionality.

### Key Requirements Addressed
- REQ-KB-001: User must be able to undo/redo actions with Ctrl + Z / Ctrl + Y
- REQ-KB-002: Users must be able to delete selected elements using Del or Backspace keys
- REQ-KB-003: Canvas panning should respond to Space key held and mouse drag
- REQ-KB-004: Canvas zooming should work with Ctrl + scroll wheel (mouse)

## 3. Prerequisites

### User Prerequisites
- A project is open with canvas visible and active

### System Prerequisites
- Canvas component initialized and rendered on screen
- Keyboard event listeners set up globally in app context 

### Data Prerequisites
- None required (shortcuts are system-level behaviors)

### Technical Prerequisites
- `useKeyboardShortcuts.ts` hook available for handling key events
- `Canvas` component handles panning and zooming logic internally

## 4. User Journey Steps

### Step 1: Undo/Redo Using Ctrl + Z / Ctrl + Y
**User Actions:**
1. Make changes to canvas (e.g., draw a duct)
2. Press "Ctrl" key + "Z" simultaneously (Undo) or 
3. Press "Ctrl" key + "Y" (Redo)

**System Response:**
1. System tracks all actions in stack of undo/redo history
2. When Ctrl+Z is pressed, the last action is reverted and removed from redo stack
3. When Ctrl+Y is pressed, the last undone action is restored to redo stack
4. Canvas reflects the state before or after the action respectively
5. Visual indicator appears on UI (e.g., undo/redo icons change)

**Visual State:**
```
[Canvas]
  [Duct drawn] 
    Undo: Ctrl + Z 
    Redo: Ctrl + Y
```

**User Feedback:**
- Immediate visual update on canvas after each action
- Button states reflect undo/redo availability
- Toast notification shown when history changes (optional)

**Related Elements:**
- Components: `Canvas`, `Toolbar` 
- Stores: None
- Services: `useKeyboardShortcuts.ts`
- Events: `onUndo`, `onRedo`, `onKeyDown`

### Step 2: Delete Selected Features Using Del / Backspace
**User Actions:**
1. Click on one or multiple elements to select them (e.g., RTU, Duct)
2. Press "Del" key or "Backspace" key from keyboard

**System Response:**
1. System checks if any objects are currently selected in canvas state
2. Removes all selected entities from `EntityStore`
3. Updates UI to reflect removal of elements
4. Triggers a re-render of the canvas with updated entities list
5. If no selection exists, does nothing or shows notification (optional)

**Visual State:**
```
[Canvas]
  [RTU-01] 
    [Duct-123] Selected <- Del pressed
    [Entity Removed From Canvas]
```

**User Feedback:**
- Elements disappear from canvas immediately upon key press
- Tooltips or icons appear to confirm deletion in UI (if enabled)

**Related Elements:**
- Components: `Canvas`, `Toolbar` 
- Stores: `EntityStore` (for managing selections and removal)
- Services: `useKeyboardShortcuts.ts`
- Events: `onDeleteSelected`, `onKeyDown`

### Step 3: Pan Canvas Using Space + Drag
**User Actions:**
1. Hold down "Space" key on keyboard 
2. Click and drag mouse cursor across canvas area

**System Response:**
1. System detects Space key press in global listener (from `useKeyboardShortcuts.ts`)
2. Starts panning mode when Space is held during mouse movement
3. Updates scroll position of canvas container based on mouse movement vector
4. Canvas moves smoothly with visual feedback showing dragging effect
5. Reverts back to normal cursor after releasing Space key

**Visual State:**
```
[Canvas]
  [Space Key Held] 
    Mouse Dragged: [Dragging View]
```

**User Feedback:**
- Cursor changes to hand icon when Space is held (panning mode)
- Smooth scroll updates without jitter during dragging

**Related Elements:**
- Components: `Canvas`, `Toolbar` 
- Stores: None
- Services: `useKeyboardShortcuts.ts`
- Events: `onPanStart`, `onPanning`, `onPanEnd`

### Step 4: Zoom Canvas Using Ctrl + Scroll
**User Actions:**
1. Position cursor over canvas area (not UI elements)
2. Hold down "Ctrl" key on keyboard and scroll mouse wheel up or down

**System Response:**
1. System listens for `wheel` event in canvas container with specific modifiers (Ctrl+scroll)
2. Calculates zoom factor based on delta Y from scroll
3. Applies scale transformation to entire canvas view using internal scaling logic
4. Maintains focus point at cursor position during zooming (if supported by implementation)
5. Updates canvas state to reflect new zoom level in UI

**Visual State:**
```
[Canvas]
  [Zoomed Out] 
    Zoom Level: 80%

[Canvas]
  [Zoomed In] 
    Zoom Level: 120%
```

**User Feedback:**
- Smooth zoom animation (if implemented)
- Zoom indicator shows current level in UI bottom bar (e.g., "Zoom: 75%")
- Visual feedback of scale change during scroll interaction

**Related Elements:**
- Components: `Canvas`, `Toolbar` 
- Stores: None
- Services: `useKeyboardShortcuts.ts`
- Events: `onZoomIn`, `onZoomOut`, `onKeyDown`

### Step 5: Validate Shortcut Conflicts and Accessibility
**User Actions:**
1. Test all shortcuts in combination with browser or OS hotkeys (e.g., Ctrl+Shift+E)
2. Ensure proper behavior is maintained even when UI elements are focused
3. Confirm accessibility support for screen readers

**System Response:**
1. Keyboard listeners only activate when canvas area has focus or global context allows input
2. Shortcut handlers ignore conflicting system-level shortcuts in default browser context (e.g., Ctrl+T, Ctrl+W)
3. Visual indicators appear on UI if shortcut is available and active (if applicable)
4. Screen reader support added for all actions using aria-labels 

**Visual State:**
```
[UI Context]
  [Canvas Has Focus] <- Shortcuts Enabled
    Shortcut Legend Visible: Ctrl+Z, Del, Space+Drag etc.
```

**User Feedback:**
- Visual hint or legend on UI if shortcut keys are active (e.g., in toolbar)
- No interference with standard OS/browser key combinations 

**Related Elements:**
- Components: `Canvas`, `Toolbar` 
- Stores: None
- Services: `useKeyboardShortcuts.ts`
- Events: `onFocusChange`, `onKeyDownConflictDetected`

## 5. Edge Cases and Handling

1. **Conflicting Browser Shortcuts**
   - **Scenario**: User presses Ctrl+T while in canvas (should not interfere with browser tab opening)
   - **Handling**: System does not intercept or override system shortcuts unless explicitly marked as intended for app use
   - **Test Case**: `tests/e2e/shortcuts/conflict-browsers`

2. **Multiple Canvas Windows**
   - **Scenario**: Application has multiple canvas windows open simultaneously in different tabs
   - **Handling**: Each canvas window maintains separate keyboard listener context, so actions only affect focused instance
   - **Test Case**: `tests/e2e/shortcuts/multiple-windows`

3. **Canvas Not Active**
   - **Scenario**: User presses a shortcut while UI element other than canvas has focus (e.g., settings modal)
   - **Handling**: System disables all keyboard shortcuts when non-canvas component is focused, allowing natural browser behavior
   - **Test Case**: `tests/e2e/shortcuts/non-active-canvas`

4. **Accessibility Issues**
   - **Scenario**: Screen reader user tries to use keyboard shortcuts while navigating via screen reader controls
   - **Handling**: All actions have proper ARIA labels and role descriptions for assistive technologies
   - **Test Case**: `tests/e2e/shortcuts/accessibility`

5. **Mouse Scroll Wheel Issues**
   - **Scenario**: User uses alternative mouse or touchpad that doesn't fully support scroll wheel events
   - **Handling**: System detects fallback methods like pinch gestures (if supported) and applies appropriate zoom behavior
   - **Test Case**: `tests/e2e/shortcuts/mouse-scroll`

## 6. Error Scenarios and Recovery

1. **Shortcuts Disabled by Focus**
   - **Scenario**: System fails to detect that canvas has lost focus or gained focus incorrectly
   - **Recovery**: System retries detection on next key stroke, re-enabling shortcuts once valid context is restored 
   - **User Feedback**: "Focus reset detected, keyboard controls enabled"

2. **Event Listener Errors**
   - **Scenario**: An unhandled exception occurs in the global `useKeyboardShortcuts` handler
   - **Recovery**: System logs error to console and disables all key listeners temporarily for stability (until reload)
   - **User Feedback**: "Keyboard input failed due to internal issue. Try reloading application."

3. **Zoom Behavior Failure**
   - **Scenario**: Zoom event does not respond properly or causes UI glitch
   - **Recovery**: System applies default zoom behavior with smooth animation and logs error for diagnostics
   - **User Feedback**: "Zoom failed, reverting to previous level"

## 7. Performance Considerations
- Keyboard shortcuts must trigger within 50 milliseconds of user input (for responsiveness)
- Panning should not block or delay other UI interactions during drag
- Zooming uses optimized canvas transformations for smooth performance 

## 8. Keyboard Shortcuts
| Action | Shortcut | Context |
|--------|----------|---------|
| Undo Last Change | Ctrl + Z | Canvas view has focus |
| Redo Last Undo | Ctrl + Y | Canvas view has focus |
| Delete Selected Element(s) | Del / Backspace | Canvas view has focus, selection present |
| Pan View | Space + Drag Mouse | Canvas view has focus |
| Zoom In/Out | Ctrl + Scroll Wheel | Canvas view has focus |

## 9. Accessibility & Internationalization
- All key combinations are visible in tooltips or legends on UI elements
- ARIA attributes applied to all interactive components for screen readers (e.g., `aria-label`)
- Language support includes English, Spanish, French as per UI localization standards

## 10. Key UI Components & Interactions
- `Canvas`: Renders canvas area and handles mouse/keyboard input during interaction
- `useKeyboardShortcuts.ts`: Global hook that listens for keyboard events across app context 

## 11. Related Documentation
- [Prerequisites]: ../08-file-management/UJ-FIL-001-OpenProject.md
- [Related Elements]: ./Canvas, useKeyboardShortcuts.ts
- [Next Steps]: None specified

## 12. Automation & Testing

### Unit Tests
- `src/__tests__/features/canvas/hooks/useKeyboardShortcuts.test.ts`

### Integration Tests
- `src/__tests__/integration/shortcuts/integration.test.ts`

### E2E Tests
- `tests/e2e/shortcuts/canvas-shortcuts.e2e.js`

## 13. Notes
- All shortcuts are context-sensitive and only active when the canvas is in focus (not modal or UI panel)
- Canvas panning and zooming are optimized for touchpad and mouse inputs respectively with minimal lag
- When multiple elements are selected, delete shortcut applies to all selected entities at once