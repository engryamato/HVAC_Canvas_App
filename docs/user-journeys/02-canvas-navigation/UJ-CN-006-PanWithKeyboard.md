# UJ-CN-006: Pan with Keyboard

## Overview

This user journey describes how users navigate the canvas by panning using keyboard arrow keys. Keyboard panning provides precise, consistent movement without requiring mouse interaction, making it ideal for fine-grained positioning and accessible navigation workflows.

## PRD References

- **FR-CN-005**: Keyboard-based canvas panning with arrow keys
- **FR-AC-002**: Accessibility features including keyboard-only navigation
- **US-CN-006**: As a user, I want to pan the canvas with arrow keys so that I can navigate without using the mouse
- **AC-CN-006-01**: Arrow keys (↑↓←→) pan viewport in corresponding directions
- **AC-CN-006-02**: Default pan increment is 50px per keypress
- **AC-CN-006-03**: Holding Shift key increases pan increment to 200px (fast pan)
- **AC-CN-006-04**: Holding arrow key repeats pan operation at OS key-repeat rate
- **AC-CN-006-05**: Ctrl+Arrow keys pan by one screen width/height (page navigation)
- **AC-CN-006-06**: Pan operations create single undoable command per pan sequence

## Prerequisites

- User has Canvas page open with active project
- Canvas viewport is focused (not Inspector panel or other UI element)
- Project contains entities or reference content to navigate
- Understanding of basic canvas navigation concepts

## User Journey Steps

### Step 1: Focus Canvas Viewport

**User Actions**:
1. Click on canvas background or any entity to ensure canvas has focus
2. Observe canvas focus indicator (subtle border highlight or cursor change)
3. Verify other UI panels (Inspector, sidebar) are not focused
4. Keyboard input now directs to canvas

**System Response**:
- Canvas viewport receives keyboard focus
- Focus ring rendered around canvas (2px subtle blue outline, accessible)
- Other panels lose focus state
- Keyboard event listeners activated for canvas
- Status bar shows "Canvas focused" indicator (optional)

**Validation**:
- document.activeElement references canvas element
- Canvas focus event handler triggered
- Keyboard shortcuts active and responsive
- Other panels' keyboard handlers inactive

**Data**:

```
Focus State:
- activeElement: <canvas id="main-canvas">
- focusTimestamp: 2025-12-29T16:20:33.450Z
- focusSource: mouse-click
- previousFocus: null

Canvas State:
- hasFocus: true
- keyboardNavigationEnabled: true
- panVelocity: { x: 0, y: 0 }
- isPanning: false
```

**Substeps**:
1. User clicks on canvas element
2. Browser fires focus event on canvas
3. Canvas focus handler captures event
4. Focus state updated in ViewportStore
5. Focus indicator rendered
6. Keyboard event listeners attached
7. Other panels notified of focus loss

### Step 2: Press Arrow Key to Initiate Pan

**User Actions**:
1. Press one arrow key (↑, ↓, ←, or →)
2. Observe immediate viewport movement in corresponding direction
3. Key remains pressed or is released for single increment
4. Visual feedback shows canvas content shifting

**System Response**:
- Keydown event captured by canvas keyboard handler
- Arrow key code identified (ArrowUp, ArrowDown, ArrowLeft, ArrowRight)
- Modifier keys checked (Shift, Ctrl, Alt)
- Pan increment determined based on modifiers:
  - No modifiers: 50px (default)
  - Shift held: 200px (fast pan)
  - Ctrl held: viewport width/height (page pan)
- Pan offset calculated in world coordinates
- ViewportStore.pan updated with new offset
- Canvas re-renders with updated viewport

**Validation**:
- Arrow key identified correctly from event.key or event.code
- Pan increment is positive value
- Pan offset update is atomic (no partial updates)
- Canvas re-render triggered immediately

**Data**:

```
Keyboard Event:
- key: "ArrowRight"
- code: "ArrowRight"
- shiftKey: false
- ctrlKey: false
- altKey: false
- repeat: false (first keypress)
- timestamp: 2025-12-29T16:20:34.100Z

Pan Calculation:
- Direction: right (+X)
- Increment: 50px (default)
- Current pan: { x: -200, y: -100 }
- Delta: { x: +50, y: 0 }
- New pan: { x: -150, y: -100 }

Viewport Update:
- zoom: 1.0 (unchanged)
- pan: { x: -150, y: -100 }
- visibleBounds updated based on new pan
```

**Substeps**:
1. User presses arrow key
2. Browser fires keydown event
3. Canvas keydown handler receives event
4. Event.key checked for arrow key
5. Modifier state extracted (shift, ctrl, alt)
6. Pan increment selected based on modifiers
7. Delta calculated: { x: increment * direction, y: 0 } or { x: 0, y: increment * direction }
8. ViewportStore.pan updated: current + delta
9. Canvas render scheduled (requestAnimationFrame)
10. Canvas re-renders with new pan offset

### Step 3: Continue Pan with Key Repeat

**User Actions**:
1. Hold arrow key down continuously
2. Observe viewport continuing to pan in direction
3. Pan repeats at OS-configured key repeat rate (typically ~30 repeats/second after initial delay)
4. Release key to stop panning
5. Viewport settles at final position

**System Response**:
- Keydown events continue firing while key held (event.repeat = true)
- Each repeat event triggers pan increment update
- Pan accumulates: pan.x += deltaX on each repeat
- Canvas re-renders at 60fps, smooth despite key repeat rate
- Pan velocity tracked for potential momentum scrolling
- Key-up event captures pan sequence end
- Single undo command created for entire pan sequence (not per increment)

**Validation**:
- event.repeat flag correctly identified
- Pan accumulation doesn't drift or skip
- Frame rate maintained at 60fps during rapid pan
- Undo command groups all pan increments into single action

**Data**:

```
Key Repeat Sequence (Arrow Right held for 1 second):

Event 0ms (initial):
  - repeat: false
  - pan: { x: -150, y: -100 }

Event 500ms (OS repeat delay):
  - repeat: true
  - pan: { x: -100, y: -100 }

Events 500-1000ms (30 repeats/sec):
  - repeat: true (each event)
  - pan increments by 50px each repeat
  - pan at 1000ms: { x: +900, y: -100 }
  - Total movement: 1050px right (21 increments)

Key Up at 1000ms:
  - Pan sequence ends
  - Final pan: { x: +900, y: -100 }
  - Undo command created:
    - type: PanCommand
    - startPan: { x: -150, y: -100 }
    - endPan: { x: +900, y: -100 }
    - duration: 1000ms
```

**Substeps**:
1. User holds arrow key down
2. OS key repeat mechanism triggers repeated keydown events
3. Each keydown event (with repeat=true) captured
4. Pan delta calculated and accumulated
5. ViewportStore.pan updated on each repeat
6. Canvas render loop maintains 60fps
7. Pan sequence tracked in temporary state
8. Key-up event fires when user releases key
9. Pan sequence finalized
10. Single PanCommand pushed to undo stack

### Step 4: Use Modifier Keys for Varied Pan Speed

**User Actions**:
1. Press and hold Shift key
2. Press arrow key while Shift held
3. Observe faster pan movement (200px per increment vs 50px default)
4. Release Shift, press Ctrl
5. Press arrow key while Ctrl held
6. Observe viewport panning by full screen width/height (page navigation)
7. Experiment with different modifier combinations

**System Response**:
- Shift modifier detected: increment = 200px (4x default speed)
  - Useful for traversing large designs quickly
  - Maintains control compared to mouse wheel
- Ctrl modifier detected: increment = viewport dimension
  - Right/Left: increment = canvas.width / zoom
  - Up/Down: increment = canvas.height / zoom
  - Effectively "pages" through design
- Modifiers apply to each key repeat event
- Visual indicator shows active pan mode (status bar or temporary overlay)
- Undo command captures modifier state for display in history

**Validation**:
- Modifier keys detected correctly from event object
- Increment calculation correct for each modifier
- Viewport dimension-based increment accounts for current zoom
- Multiple modifiers handled (Shift+Ctrl combines effects or prioritizes one)

**Data**:

```
Pan Increment by Modifier:

No Modifier (default):
  - Increment: 50px
  - Use case: Precise positioning
  - Example: Pan right 50px

Shift Modifier (fast pan):
  - Increment: 200px
  - Use case: Quick traversal
  - Example: Pan right 200px

Ctrl Modifier (page pan):
  - Increment: viewport width or height in world coords
  - Canvas: 1920x1080, Zoom: 1.0
  - Right/Left increment: 1920px
  - Up/Down increment: 1080px
  - Use case: Move one screen over
  - Example: Pan right 1920px (one full screen)

Ctrl Modifier at Different Zoom:
  - Canvas: 1920x1080, Zoom: 2.0
  - Right/Left increment: 1920 / 2.0 = 960px world coords
  - Up/Down increment: 1080 / 2.0 = 540px world coords
  - Effect: Pan by visible area in world space

Shift+Ctrl Combined:
  - Behavior: Ctrl takes priority (page pan)
  - Rationale: Page navigation is more specialized
```

**Substeps**:
1. User presses and holds Shift
2. Canvas keydown handler detects shiftKey=true
3. Increment set to 200px
4. Status bar shows "Fast Pan" indicator
5. User presses arrow key
6. Pan delta = 200px in arrow direction
7. Viewport updates with larger increment
8. User releases Shift, presses Ctrl
9. Canvas keydown handler detects ctrlKey=true
10. Increment calculated from viewport dimensions / zoom
11. Status bar shows "Page Pan" indicator
12. User presses arrow key
13. Pan delta = viewport dimension
14. Viewport "pages" one screen over

### Step 5: Stop Panning and Create Undo Command

**User Actions**:
1. Release arrow key to stop panning
2. Observe viewport settling at final position
3. Optionally press Ctrl+Z to undo entire pan sequence
4. Observe viewport smoothly animating back to pre-pan position

**System Response**:
- Key-up event detected for arrow key
- Pan sequence marked complete
- Total pan delta calculated (end position - start position)
- PanCommand created with start and end states
- Command pushed to HistoryStore undo stack
- Status bar clears pan mode indicator
- Viewport state marked dirty for next project save
- If undo triggered:
  - PanCommand.undo() executes
  - Viewport animates from end position to start position (250ms)
  - Redo becomes available

**Validation**:
- Pan sequence duration tracked correctly
- Single undo command created regardless of number of key repeats
- Undo/redo correctly restores exact viewport positions
- Viewport animation smooth and responsive

**Data**:

```
Pan Sequence Complete:
- Start time: 2025-12-29T16:20:34.100Z
- End time: 2025-12-29T16:20:35.100Z
- Duration: 1000ms
- Start pan: { x: -150, y: -100 }
- End pan: { x: +900, y: -100 }
- Total delta: { x: +1050, y: 0 }
- Key repeats: 21

Undo Command Created:
- type: PanCommand
- commandName: "Pan Right"
- previousPan: { x: -150, y: -100 }
- newPan: { x: +900, y: -100 }
- timestamp: 2025-12-29T16:20:35.100Z
- modifiers: none

Undo Execution (Ctrl+Z):
- PanCommand.undo() called
- Animation: { x: +900, y: -100 } -> { x: -150, y: -100 }
- Duration: 250ms
- Easing: ease-in-out
- Result: Viewport returns to pre-pan position
```

**Substeps**:
1. User releases arrow key
2. Browser fires keyup event
3. Canvas keyup handler captures event
4. Pan sequence finalized
5. Calculate total delta (end - start)
6. Create PanCommand with start/end states
7. Push command to HistoryStore
8. Clear pan mode indicators
9. Mark viewport dirty for save
10. If undo triggered:
    - Retrieve PanCommand from undo stack
    - Execute PanCommand.undo()
    - Animate viewport to previous position
    - Move command to redo stack

## Edge Cases

### Edge Case 1: Pan Beyond Viewport Bounds

**Scenario**: User pans beyond reasonable limits, attempting to navigate thousands of pixels away from content.

**Expected Behavior**:
- Viewport bounds enforced (configurable limits)
- Default bounds: ±10,000px from origin if no content
- If project has content: ±2,000px beyond content bounding box
- Pan clamped to maximum bounds
- Visual indicator shows bounds reached (gentle rubber-band effect)
- Key continues to register but pan stops at limit
- Toast notification: "Maximum pan distance reached"

**Handling**:
- After each pan increment, check if new pan exceeds bounds
- Clamp pan.x to [minX, maxX] and pan.y to [minY, maxY]
- If clamped, show visual feedback (temporary red border)
- Sound effect or haptic feedback (if enabled)
- User can pan back in opposite direction normally

### Edge Case 2: Rapid Direction Changes

**Scenario**: User rapidly alternates between opposite arrow keys (left-right-left-right).

**Expected Behavior**:
- Each direction change creates new pan segment
- Undo stack captures each directional segment separately
- OR: Intelligent merging of rapid bi-directional pans into single undo
- Viewport responds immediately to each direction change
- No lag or input queue buildup

**Handling**:
- Track time between direction changes
- If <500ms: consider same pan sequence, merge into single undo
- If >=500ms: create separate undo commands
- User can undo all rapid changes at once or step through
- Preference setting: "Merge Rapid Pans" (default: true)

### Edge Case 3: Pan While Zooming

**Scenario**: User holds arrow key while simultaneously zooming with mouse wheel.

**Expected Behavior**:
- Pan and zoom operations execute simultaneously
- Pan increment remains constant in world coordinates
- Visual pan speed changes as zoom changes (screen space velocity varies)
- Undo stack contains separate commands for pan and zoom
- Undo restores both pan and zoom to pre-operation state

**Handling**:
- Pan calculations use world coordinates (unaffected by zoom)
- Zoom calculations maintain current pan position
- Both operations update ViewportStore independently
- Rendering accounts for both pan and zoom each frame
- Undo order: most recent operation first (zoom, then pan, or vice versa)

### Edge Case 4: Canvas Loses Focus During Pan

**Scenario**: User holds arrow key, then clicks outside canvas (Inspector panel, menu bar).

**Expected Behavior**:
- Focus loss immediately stops pan operation
- Current pan position captured and finalized
- Undo command created for partial pan
- Key-up event may not fire (focus lost before release)
- Canvas keyboard handlers deactivated until focus regained

**Handling**:
- Canvas blur event handler detects focus loss
- Current pan sequence finalized immediately
- PanCommand created with current position as end state
- Keyup handler won't fire, so blur handler must clean up
- If user refocuses canvas and arrow key still held, new pan sequence starts

### Edge Case 5: Multiple Arrow Keys Held Simultaneously

**Scenario**: User holds both Right and Down arrows simultaneously (diagonal pan).

**Expected Behavior**:
- Diagonal panning supported (both X and Y components)
- Pan increment applied in both directions simultaneously
- Delta calculated as { x: +50, y: +50 } (or current increment value)
- Smooth diagonal movement
- Single undo command captures diagonal pan sequence

**Handling**:
- Track state of all four arrow keys (up/down/left/right)
- Calculate combined delta on each frame:
  - deltaX = (rightPressed ? increment : 0) - (leftPressed ? increment : 0)
  - deltaY = (downPressed ? increment : 0) - (upPressed ? increment : 0)
- Apply combined delta to pan offset
- Undo command stores total delta in both axes

## Error Scenarios

### Error 1: Viewport Store Update Failure

**Scenario**: ViewportStore.setPan() fails due to store being locked or in invalid state.

**Error Message**: "Unable to update viewport. Please try again."

**Recovery**:
1. Error caught during pan update attempt
2. Operation aborted, viewport frozen at last valid position
3. Toast notification displays error message
4. Keyboard input temporarily disabled (100ms cooldown)
5. Error logged to console with stack trace
6. User can retry pan after cooldown
7. If persistent, app prompts to reload project

### Error 2: Undo Stack Overflow

**Scenario**: User pans extensively, creating hundreds of undo commands, exceeding undo stack limit.

**Error Message**: "Undo history full. Oldest pan operations will be removed."

**Recovery**:
1. HistoryStore detects stack limit reached (default: 100 commands)
2. Oldest commands removed from stack (FIFO)
3. Warning notification shown to user
4. Pan operation continues normally
5. User can still undo recent operations (within stack limit)
6. Preference to increase stack limit available in settings

### Error 3: Invalid Pan Calculation

**Scenario**: Pan calculation produces NaN or Infinity due to corrupted viewport state.

**Error Message**: "Viewport calculation error. Resetting to default view."

**Recovery**:
1. Pan update detects invalid values (NaN, Infinity)
2. Operation aborted before applying invalid state
3. Viewport reset to default: zoom=1.0, pan={0, 0}
4. Error logged with diagnostic data
5. Toast notification explains reset
6. User can manually navigate to desired position
7. Project integrity check offered

## Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `↑` | Pan Up (50px) | Canvas focused |
| `↓` | Pan Down (50px) | Canvas focused |
| `←` | Pan Left (50px) | Canvas focused |
| `→` | Pan Right (50px) | Canvas focused |
| `Shift+↑` | Fast Pan Up (200px) | Canvas focused |
| `Shift+↓` | Fast Pan Down (200px) | Canvas focused |
| `Shift+←` | Fast Pan Left (200px) | Canvas focused |
| `Shift+→` | Fast Pan Right (200px) | Canvas focused |
| `Ctrl+↑` | Page Pan Up | Canvas focused |
| `Ctrl+↓` | Page Pan Down | Canvas focused |
| `Ctrl+←` | Page Pan Left | Canvas focused |
| `Ctrl+→` | Page Pan Right | Canvas focused |
| `Home` | Pan to Origin (0, 0) | Canvas focused |
| `End` | Pan to Last Entity | Canvas focused |
| `Space+Drag` | Temporary Hand Tool Pan | Canvas focused, alternative to arrow keys |

## Related Elements

### Components
- **CanvasViewport.tsx**: Main canvas component handling keyboard events and viewport updates
- **KeyboardNavigationOverlay.tsx**: Visual indicator showing active pan mode and direction
- **StatusBar.tsx**: Displays current pan position and active pan mode
- **AccessibilityPanel.tsx**: Settings for keyboard navigation preferences

### Stores
- **ViewportStore**: Central state for zoom, pan, and bounds
  - `pan`: Current pan offset { x, y }
  - `setPan(newPan)`: Updates pan position
  - `incrementPan(delta)`: Adds delta to current pan
  - `bounds`: Maximum allowed pan range
- **HistoryStore**: Undo/redo stack for pan operations
  - Stores PanCommand instances
  - Groups rapid pan sequences
- **SettingsStore**: User preferences for keyboard navigation
  - `keyboardPanIncrement`: Default pan distance (default: 50px)
  - `keyboardFastPanIncrement`: Shift modifier distance (default: 200px)
  - `keyRepeatEnabled`: Allow key repeat for continuous pan (default: true)
  - `mergeRapidPans`: Combine quick direction changes into single undo (default: true)

### Hooks
- **useKeyboardNavigation**: Manages keyboard event handlers for arrow keys
  - Attaches/detaches listeners based on focus
  - Calculates pan increments based on modifiers
  - Tracks pan sequences for undo grouping
- **usePanVelocity**: Tracks pan speed for potential momentum scrolling
  - Calculates velocity from pan delta over time
  - Provides smooth deceleration when key released
- **useFocusManagement**: Ensures canvas focus for keyboard input
  - Programmatically focuses canvas on mount
  - Restores focus after dialog close
  - Visual focus indicators

### Commands
- **PanCommand**: Undo/redo command for pan operations
  - `execute()`: Applies new pan position (with optional animation)
  - `undo()`: Restores previous pan position (with reverse animation)
  - `previousPan`: Pan state before operation
  - `newPan`: Pan state after operation
  - `duration`: Time span of pan sequence (for display)

### Services
- **KeyboardEventHandler.ts**: Centralized keyboard event processing
  - Normalizes event.key and event.code across browsers
  - Provides modifier key utilities (isShift, isCtrl, isAlt)
  - Handles key repeat detection
- **ViewportBoundsCalculator.ts**: Calculates maximum pan range
  - Based on content bounding box
  - Configurable margin beyond content
  - Handles empty canvas default bounds

## Visual Diagrams

### Keyboard Pan Operation Flow

```
User Presses
Arrow Key
    |
    v
Canvas Has
Focus?
    |
    +--[No]--> Ignore,
    |          Focus Required
    |
    +--[Yes]
        |
        v
  Detect Modifier
  Keys (Shift/Ctrl)
        |
        v
  Calculate Pan
  Increment
        |
  +-----+-----+
  |     |     |
  v     v     v
 50px  200px  Viewport
(def) (fast)  (page)
  |     |     |
  +-----+-----+
        |
        v
  Calculate Delta
  Based on Arrow
  Direction
        |
        v
  Update ViewportStore
  pan += delta
        |
        v
  Trigger Canvas
  Re-render
        |
        v
  Key Held?
    |
    +--[Yes]--> Key Repeat
    |           Loop Back
    |
    +--[No]
        |
        v
  Create PanCommand
  for Undo Stack
        |
        v
  Operation Complete
```

### Pan Increment Calculation

```
Arrow Key Event
      |
      v
Check Modifiers
      |
      +-- Ctrl Held?
      |     |
      |     +--[Yes]--> Page Pan Mode
      |     |           |
      |     |           v
      |     |    Increment = Canvas Dimension / Zoom
      |     |           |
      |     |     Right/Left: canvas.width / zoom
      |     |     Up/Down: canvas.height / zoom
      |     |
      |     +--[No]
      |
      +-- Shift Held?
            |
            +--[Yes]--> Fast Pan Mode
            |           |
            |           v
            |    Increment = 200px
            |
            +--[No]--> Default Pan Mode
                        |
                        v
                 Increment = 50px

Apply Increment:
  Arrow Up:    delta = { x: 0, y: -increment }
  Arrow Down:  delta = { x: 0, y: +increment }
  Arrow Left:  delta = { x: -increment, y: 0 }
  Arrow Right: delta = { x: +increment, y: 0 }

Update Pan:
  newPan.x = currentPan.x + delta.x
  newPan.y = currentPan.y + delta.y
```

### Pan with Key Repeat Timeline

```
Timeline (Arrow Right held for 1 second):

0ms: Initial Keydown
     ↓
     pan.x: -150px
     [Canvas renders]

500ms: OS Key Repeat Delay
       ↓
       First repeat event
       pan.x: -100px (+50px)
       [Canvas renders]

533ms: Repeat event
       pan.x: -50px (+50px)
       [Canvas renders]

566ms: Repeat event
       pan.x: 0px (+50px)
       [Canvas renders]

600ms: Repeat event
       pan.x: +50px (+50px)
       [Canvas renders]

... (repeats continue every ~33ms)

1000ms: Key Released (Keyup)
        ↓
        Final pan.x: +900px
        Total delta: +1050px (21 increments)
        [Create PanCommand for undo]

Undo Stack:
┌──────────────────────────────────┐
│ PanCommand: "Pan Right"          │
│ Start: { x: -150, y: -100 }      │
│ End:   { x: +900, y: -100 }      │
│ Duration: 1000ms                 │
└──────────────────────────────────┘
```

### Diagonal Pan (Multiple Keys)

```
User Input:
  Arrow Right: HELD
  Arrow Down: HELD

State Tracking:
  rightPressed: true
  leftPressed: false
  upPressed: false
  downPressed: true

Delta Calculation (each frame):
  deltaX = (rightPressed ? 50 : 0) - (leftPressed ? 50 : 0)
         = 50 - 0 = +50

  deltaY = (downPressed ? 50 : 0) - (upPressed ? 50 : 0)
         = 50 - 0 = +50

  combined delta = { x: +50, y: +50 }

Pan Update:
  newPan.x = currentPan.x + 50
  newPan.y = currentPan.y + 50

Visual Result:
  Viewport moves diagonally
  toward bottom-right

       ↓
     ↘ (diagonal)
   →

Undo Command:
  PanCommand: "Pan Diagonal"
  Delta: { x: +500, y: +500 }
  (accumulated over sequence)
```

### Viewport Bounds Clamping

```
Content Bounding Box:
  minX: 0, maxX: 3000
  minY: 0, maxY: 2000

Maximum Pan Bounds (content + 2000px margin):
  minPanX: -2000
  maxPanX: +2000 (3000 - 1000, adjusted for canvas centering)
  minPanY: -2000
  maxPanY: +2000

User Pans Right Beyond Bounds:
  Current pan: { x: 1900, y: 0 }
  User presses Arrow Right (+50px)
  Calculated new pan: { x: 1950, y: 0 }

Bounds Check:
  newPan.x = Math.max(minPanX, Math.min(maxPanX, 1950))
  newPan.x = Math.max(-2000, Math.min(2000, 1950))
  newPan.x = 1950 (within bounds, allowed)

  User continues, reaches { x: 2050, y: 0 }
  Bounds check: Math.min(2000, 2050) = 2000
  Clamped to: { x: 2000, y: 0 }

Visual Feedback:
┌─────────────────────────────────┐
│ ████████████████████████████ ░░│ <- Red border flash
│ █ Content Area             █ ░░│
│ █                          █ ░░│
│ █        (can't pan       █ ░░│
│ █         further right)   █ ░░│
│ ████████████████████████████ ░░│
└─────────────────────────────────┘
  Toast: "Maximum pan distance reached"
```

### Pan Mode Indicators

```
Default Pan Mode (50px increment):
┌────────────────────────────────────┐
│ Canvas                             │
│                                    │
│         [Content visible]          │
│                                    │
│                                    │
├────────────────────────────────────┤
│ Pan: (-150, -100) | Zoom: 100%     │
└────────────────────────────────────┘

Fast Pan Mode (Shift held, 200px):
┌────────────────────────────────────┐
│ Canvas                   ⚡ FAST   │
│                                    │
│         [Content visible]          │
│                                    │
│                                    │
├────────────────────────────────────┤
│ Pan: (-150, -100) | Zoom: 100% ⚡  │
└────────────────────────────────────┘

Page Pan Mode (Ctrl held, viewport):
┌────────────────────────────────────┐
│ Canvas                   📄 PAGE   │
│                                    │
│         [Content visible]          │
│                                    │
│                                    │
├────────────────────────────────────┤
│ Pan: (-150, -100) | Zoom: 100% 📄  │
└────────────────────────────────────┘
```

## Testing

### Unit Tests

**Test Suite**: ViewportStore.incrementPan()

1. **Test: Pan right by default increment**
   - Setup: pan = { x: 0, y: 0 }
   - Action: incrementPan({ x: 50, y: 0 })
   - Assert: pan = { x: 50, y: 0 }

2. **Test: Pan up by default increment**
   - Setup: pan = { x: 0, y: 0 }
   - Action: incrementPan({ x: 0, y: -50 })
   - Assert: pan = { x: 0, y: -50 }

3. **Test: Pan diagonally with both deltas**
   - Setup: pan = { x: 100, y: 100 }
   - Action: incrementPan({ x: 50, y: 50 })
   - Assert: pan = { x: 150, y: 150 }

4. **Test: Clamp pan to maximum bounds**
   - Setup: pan = { x: 1950, y: 0 }, maxPanX = 2000
   - Action: incrementPan({ x: 100, y: 0 })
   - Assert: pan = { x: 2000, y: 0 } (clamped)

5. **Test: Clamp pan to minimum bounds**
   - Setup: pan = { x: -1950, y: 0 }, minPanX = -2000
   - Action: incrementPan({ x: -100, y: 0 })
   - Assert: pan = { x: -2000, y: 0 } (clamped)

6. **Test: Fast pan increment (Shift modifier)**
   - Setup: pan = { x: 0, y: 0 }
   - Action: incrementPan({ x: 200, y: 0 }) [Shift held]
   - Assert: pan = { x: 200, y: 0 }

7. **Test: Page pan increment (Ctrl modifier)**
   - Setup: pan = { x: 0, y: 0 }, canvas = 1920x1080, zoom = 1.0
   - Action: incrementPan({ x: 1920, y: 0 }) [Ctrl held, right]
   - Assert: pan = { x: 1920, y: 0 }

### Integration Tests

**Test Suite**: Keyboard Pan Workflow

1. **Test: Pan sequence creates single undo command**
   - Setup: Canvas focused, pan = { x: 0, y: 0 }
   - Action: Press and hold Arrow Right for 1 second (20 increments)
   - Release key
   - Assert: Final pan = { x: 1000, y: 0 }
   - Assert: Undo stack has single PanCommand
   - Assert: PanCommand.previousPan = { x: 0, y: 0 }
   - Assert: PanCommand.newPan = { x: 1000, y: 0 }

2. **Test: Undo restores pan position**
   - Setup: After pan sequence (pan = { x: 1000, y: 0 })
   - Action: Trigger undo (Ctrl+Z)
   - Assert: Viewport animates to { x: 0, y: 0 }
   - Assert: Animation duration 250ms
   - Assert: Redo available

3. **Test: Rapid direction changes merge into single undo**
   - Setup: Canvas focused, pan = { x: 0, y: 0 }
   - Action: Press Right (50px), wait 100ms
   - Action: Press Left (50px), wait 100ms
   - Action: Press Right (50px)
   - Assert: All changes within 500ms window
   - Assert: Single undo command created
   - Assert: Can undo all changes at once

4. **Test: Canvas loses focus during pan**
   - Setup: Canvas focused, start pan sequence
   - Action: Press and hold Arrow Right
   - Action: After 500ms, click Inspector panel (focus loss)
   - Assert: Pan sequence finalizes immediately
   - Assert: PanCommand created with partial pan
   - Assert: Canvas keyboard handlers deactivated

5. **Test: Diagonal pan with simultaneous arrow keys**
   - Setup: Canvas focused, pan = { x: 0, y: 0 }
   - Action: Press and hold Arrow Right and Arrow Down simultaneously
   - Hold for 500ms (10 increments)
   - Assert: Pan = { x: 500, y: 500 } (diagonal movement)
   - Assert: Single undo command with both deltas

### End-to-End Tests

**Test Suite**: User Keyboard Navigation

1. **Test: User pans canvas with arrow keys**
   - Setup: Open project with multiple entities
   - Action: User clicks canvas to focus
   - Action: User presses Arrow Right 5 times
   - Assert: Viewport shifts right 250px (5 * 50px)
   - Assert: Status bar shows updated pan position
   - Assert: Content shifts left on screen (viewport moved right)

2. **Test: User uses fast pan with Shift**
   - Setup: Canvas focused
   - Action: User holds Shift, presses Arrow Down 3 times
   - Assert: Viewport shifts down 600px (3 * 200px)
   - Assert: Status bar shows "Fast Pan" indicator
   - Assert: Larger incremental movement observed

3. **Test: User uses page pan with Ctrl**
   - Setup: Canvas focused, canvas = 1920x1080, zoom = 1.0
   - Action: User holds Ctrl, presses Arrow Right once
   - Assert: Viewport shifts right by 1920px (full screen width)
   - Assert: Status bar shows "Page Pan" indicator
   - Assert: Entire screen worth of content shifts

4. **Test: User pans and undoes operation**
   - Setup: Canvas focused, starting pan = { x: 0, y: 0 }
   - Action: User holds Arrow Up for 1 second
   - Assert: Viewport pans up significantly
   - Action: User presses Ctrl+Z (undo)
   - Assert: Viewport animates back to { x: 0, y: 0 }
   - Assert: Smooth reverse animation observed

5. **Test: User pans beyond bounds**
   - Setup: Canvas focused, pan near maximum bound
   - Action: User continues pressing arrow key at bound
   - Assert: Pan stops at maximum bound
   - Assert: Toast notification: "Maximum pan distance reached"
   - Assert: Visual feedback (red border flash)
   - Assert: Key continues to register but no further movement

## Common Pitfalls

### Pitfall 1: Not Grouping Pan Sequences into Single Undo

**Problem**: Each key repeat creates separate undo command, leading to undo stack pollution.

**Symptom**: User must press Ctrl+Z 20+ times to undo single pan sequence, frustrating UX.

**Solution**: Group all key repeats from single arrow key hold into one PanCommand:
- Track pan sequence start on initial keydown (repeat=false)
- Accumulate pan deltas during key repeats
- Finalize single command on keyup
- PanCommand stores start and end states, not intermediate steps

### Pitfall 2: Pan Increment Ignoring Current Zoom

**Problem**: Page pan (Ctrl+Arrow) uses canvas pixel dimensions instead of world coordinates.

**Symptom**: At zoom=2.0, page pan moves half the expected distance in world space.

**Solution**: Calculate page pan increment in world coordinates:
- increment = canvasWidth / currentZoom (for horizontal)
- increment = canvasHeight / currentZoom (for vertical)
- This ensures one full screen of content pans regardless of zoom

### Pitfall 3: Missing Focus Check Before Pan

**Problem**: Arrow key events processed even when canvas doesn't have focus.

**Symptom**: User typing in Inspector text field accidentally pans canvas, text input includes arrow characters.

**Solution**: Always check canvas focus before processing arrow keys:
- Check document.activeElement === canvasElement
- Attach keyboard listeners only when canvas focused
- Detach listeners on blur event
- Prevent default only when canvas has focus

### Pitfall 4: Not Clamping Pan to Reasonable Bounds

**Problem**: User can pan infinitely far from content, getting "lost" in empty space.

**Symptom**: User pans away, can't find content, must reset viewport or fit to window.

**Solution**: Implement maximum pan bounds based on content:
- Calculate content bounding box
- Allow 2000px margin beyond content in each direction
- Clamp pan to [contentMin - 2000, contentMax + 2000]
- Provide visual/audio feedback when bound reached
- Offer "Return to Content" shortcut (Home key)

### Pitfall 5: Inconsistent Key Repeat Behavior Across OS

**Problem**: Key repeat rate varies by operating system and user settings.

**Symptom**: Pan feels too fast on some systems, too slow on others. Inconsistent UX.

**Solution**: Implement internal pan rate limiting independent of OS:
- Track timestamp of last pan update
- Enforce minimum time between pan increments (e.g., 16ms for 60fps)
- Ignore key repeat events that arrive too quickly
- Provides consistent pan speed across all platforms
- Or: Use requestAnimationFrame loop while key held instead of relying on key repeat

## Performance Tips

### Tip 1: Throttle Canvas Re-renders During Rapid Pan

Avoid re-rendering canvas on every key repeat event. Throttle to 60fps:

**Implementation**: Use requestAnimationFrame to batch pan updates. Accumulate pan delta in temporary state, apply all deltas on next frame.

**Benefit**: Reduces CPU usage from 80% to 20% during rapid pan, maintains smooth 60fps.

### Tip 2: Use CSS Transform for Pan Instead of Canvas Re-render

For real-time pan feedback, use CSS transform on canvas element:

**Implementation**: Apply `transform: translate(${pan.x}px, ${pan.y}px)` to canvas container. Update actual canvas viewport on keyup (finalization).

**Benefit**: Hardware-accelerated transforms provide instant visual feedback, defer expensive canvas re-render until operation completes.

### Tip 3: Debounce Undo Command Creation

Don't create undo command on every keyup if user rapidly taps arrow keys:

**Implementation**: Track last keyup timestamp. If next keydown within 500ms, consider same pan sequence. Create undo only after 500ms of inactivity.

**Benefit**: Prevents undo stack pollution from rapid tapping, cleaner undo history.

### Tip 4: Cache Entity Rendering During Pan

Entities don't change during pan, only viewport position changes:

**Implementation**: Render entities to offscreen canvas once. During pan, composite offscreen canvas at offset position. Re-render entities only on keyup.

**Benefit**: Reduces per-frame render time from 40ms to 8ms for large projects (500+ entities).

### Tip 5: Progressive Grid Update During Pan

Full grid recalculation on every pan increment is expensive:

**Implementation**: Update grid only every 3rd frame during rapid pan. Use cached grid between updates. Full grid update on keyup.

**Benefit**: Reduces grid calculation overhead, improves frame rate during pan from 45fps to 60fps.

## Future Enhancements

### Enhancement 1: Momentum Scrolling for Keyboard Pan

**Description**: When user releases arrow key after rapid pan, viewport continues moving with deceleration (like mouse trackpad).

**User Value**: More natural, fluid navigation feel. Reduces repetitive key presses.

**Implementation**:
- Track pan velocity during key hold
- On keyup, calculate momentum based on velocity
- Animate deceleration over 500ms using ease-out curve
- User can interrupt momentum by pressing any key

### Enhancement 2: Adaptive Pan Increment Based on Zoom

**Description**: Automatically adjust pan increment based on current zoom level (larger increment at low zoom, smaller at high zoom).

**User Value**: Maintains consistent perceived pan speed regardless of zoom level.

**Implementation**:
- Default increment: 50px at zoom=1.0
- Scaled increment: 50 / zoom
- At zoom=2.0: increment=25px (slower, more precise)
- At zoom=0.5: increment=100px (faster, covers more area)

### Enhancement 3: Pan Path Recording and Playback

**Description**: Record user's pan path as series of waypoints, replay as animation.

**User Value**: Useful for creating project tours, demonstrations, and walkthroughs.

**Implementation**:
- "Start Recording" command captures pan path
- Pan waypoints stored with timestamps
- "Playback" animates viewport along recorded path
- Export as video or shareable tour file

### Enhancement 4: Joystick/Gamepad Support for Pan

**Description**: Support game controllers for canvas navigation (analog stick for pan, triggers for zoom).

**User Value**: Alternative input method, useful for presentation mode and accessibility.

**Implementation**:
- Detect connected gamepads via Gamepad API
- Map left analog stick to pan direction/speed
- Analog input provides variable speed (push harder = faster pan)
- Haptic feedback on bounds reached

### Enhancement 5: Pan to Search Result

**Description**: After searching for entity or location, keyboard shortcut pans directly to result.

**User Value**: Quick navigation to specific content without manual panning.

**Implementation**:
- Search dialog shows results with "Pan to Result" button
- Keyboard shortcut (Ctrl+Enter) in search dialog
- Animated pan from current position to result
- Highlight result entity briefly after pan

### Enhancement 6: Breadcrumb Trail for Pan History

**Description**: Visual trail showing recent pan positions, click to jump back to previous locations.

**User Value**: Easy backtracking after exploring distant areas of design.

**Implementation**:
- Store last 10 pan positions as user navigates
- Minimap shows breadcrumb dots at previous positions
- Click breadcrumb to animate viewport back
- Breadcrumbs fade after 5 minutes of inactivity

### Enhancement 7: Smart Pan Bounds Based on Layers

**Description**: Pan bounds adjust dynamically based on visible layers (ignore hidden layer content).

**User Value**: Prevents panning to areas with only hidden content.

**Implementation**:
- Calculate bounds from visible layer entities only
- Recalculate bounds when layer visibility changes
- Preference: "Clamp Pan to Visible Content" (default: on)
- Toast notification when attempting to pan beyond visible content

### Enhancement 8: Pan Speed Ramping

**Description**: Pan starts slow when key first pressed, gradually accelerates during sustained hold.

**User Value**: Precise positioning initially, fast traversal for long-distance panning.

**Implementation**:
- First 500ms: Use default 50px increment
- After 500ms: Linearly increase increment to 200px over next 1000ms
- After 1500ms: Maintain 200px increment (max speed)
- Reset ramp on direction change

### Enhancement 9: Pan Target Indicators

**Description**: Show compass rose or directional arrows indicating available pan directions and distance to content.

**User Value**: Helps users orient themselves, prevents getting lost in empty space.

**Implementation**:
- Arrows at edge of viewport point toward nearest content
- Arrow size indicates distance (larger = further)
- Compass rose in corner shows cardinal directions
- Toggle with 'C' key

### Enhancement 10: Voice-Controlled Pan

**Description**: Pan canvas using voice commands ("pan right", "move up slowly").

**User Value**: Hands-free navigation for accessibility and during presentations.

**Implementation**:
- Integrate Web Speech API for voice recognition
- Commands: "pan [direction]", "stop", "faster", "slower"
- Visual feedback shows recognized command
- Preference to enable/disable voice control
