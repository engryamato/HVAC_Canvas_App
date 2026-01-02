# [UJ-SM-008] Rotate Entity

## Overview

This user journey covers rotating selected entities around their center point using a rotation handle, including angle snapping, visual feedback, connection updates, and keyboard shortcuts for precise rotation.

## PRD References

- **FR-SM-008**: User shall be able to rotate entities using rotation handle
- **US-SM-008**: As a designer, I want to rotate equipment and entities so that I can match installation orientations
- **AC-SM-008-001**: Rotation handle appears on selected entity (circular arrow icon)
- **AC-SM-008-002**: Drag rotation handle to rotate entity around center
- **AC-SM-008-003**: Angle snaps to 15° increments (hold Shift for free rotation)
- **AC-SM-008-004**: Real-time rotation preview during drag
- **AC-SM-008-005**: Connected entities update endpoints after rotation
- **AC-SM-008-006**: Rotation angle displayed during operation

## Prerequisites

- User is in Canvas Editor with Select tool active
- At least one rotatable entity exists and is selected
- Entity type supports rotation (equipment, notes, some fittings)
- Room entities typically don't rotate (rectangular alignment)

## User Journey Steps

### Step 1: Select Entity Showing Rotation Handle

**User Action**: Select RTU equipment entity

**Expected Result**:
- RTU equipment selected
- Selection state:
  - `selectedIds`: ['rtu-1']
  - Selection count: 1
- Visual feedback:
  - Blue selection outline around RTU
  - 8 resize handles (corners and edges)
  - **Rotation handle** appears above entity:
    - Position: 20px above top edge, centered
    - Icon: Circular arrow (↻)
    - Color: Blue (matching selection highlight)
    - Size: 16px × 16px
    - Cursor on hover: Rotation cursor (circular arrows)
- Inspector panel:
  - Shows RTU properties
  - Rotation field: Current angle (e.g., "0°")
  - Can manually input rotation angle
- Entity properties:
  - Current rotation: 0° (default, not rotated)
  - Rotation center: Entity center point (calculated)
  - Connections: 2 ducts attached (supply and return)
- Ready for rotation operation

**Validation Method**: E2E test - Verify rotation handle appears on selection

---

### Step 2: Begin Rotation

**User Action**: Click and hold rotation handle, begin dragging clockwise

**Expected Result**:
- Mouse down detected on rotation handle
- Rotation mode activated
- Starting state recorded:
  - Original rotation: 0°
  - Mouse starting position: (500, 100) in screen coordinates
  - Entity center point: (500, 150) - rotation pivot
  - Radius from center to mouse: 50px
- Cursor changes to rotation cursor (↻)
- Visual feedback:
  - Rotation handle highlights (larger, brighter)
  - Entity center point marked (small circle)
  - Rotation arc appears (partial circle from start)
- Status bar: "Drag to rotate entity"
- Ghost outline appears:
  - Semi-transparent version at original rotation
  - Shows starting position for comparison
- Rotation calculation initialized:
  - Track mouse angle relative to center
  - Starting angle: 0°

**Validation Method**: Integration test - Verify rotation mode activates on handle drag

---

### Step 3: Drag to Rotate with Angle Snap

**User Action**: Drag mouse clockwise, rotating approximately 47° (without Shift key)

**Expected Result**:
- Mouse movement tracked continuously
- Angle calculated from mouse position:
  - Mouse current position: (547, 115)
  - Angle from center: atan2(dy, dx)
  - Raw rotation: 47.3°
- Angle snapping applied (default: 15° increments):
  - Raw angle: 47.3°
  - Snapped to: 45° (nearest 15° multiple: 45°)
  - Snap tolerance: ±2° (within range, snaps)
- Entity rotates in real-time:
  - RTU rendered at 45° rotation
  - Equipment symbol rotated
  - Visual updates at 60fps
- Visual feedback during drag:
  - **Live rotation preview**: RTU at 45°
  - **Ghost outline**: Original position at 0° (semi-transparent)
  - **Rotation angle display**: Tooltip near cursor showing "45°"
  - **Rotation arc**: Visual arc from 0° to 45° (blue)
  - **Angle indicator lines**: Dashed lines at 15° intervals (0°, 15°, 30°, 45°, 60°...)
- Connection points rotate with entity:
  - Supply outlet rotates from top to top-right (45°)
  - Return inlet rotates from bottom to bottom-left (45°)
  - Connection indicators update position
- Inspector updates in real-time:
  - Rotation field shows: "45°"
  - Updates every 100ms during drag
- Smooth rotation (no stuttering or lag)

**Validation Method**: E2E test - Verify rotation angle snaps to 15° increments

---

### Step 4: Release to Finalize Rotation

**User Action**: Release mouse button at 45° rotation

**Expected Result**:
- Mouse up detected
- Rotation finalized
- Entity rotation committed to store:
  - `updateEntity('rtu-1', { transform: { rotation: 45 } })`
  - Rotation angle: 45° (stored in degrees)
- Rotation command created for undo:
  - `RotateEntityCommand` with:
    - Entity ID: 'rtu-1'
    - Old rotation: 0°
    - New rotation: 45°
  - Added to history stack
- Visual updates:
  - Ghost outline disappears
  - Rotation arc removed
  - Angle indicator lines hidden
  - Entity remains at 45° rotation
  - Selection highlight and handles update to rotated orientation
  - Rotation handle repositioned for rotated entity
- Connected entities updated:
  - Ducts connected to RTU update endpoints
  - Supply duct endpoint follows rotated connection point
  - Return duct endpoint follows rotated connection point
  - Ducts stretch/reposition to maintain connections
- Inspector shows final rotation:
  - Rotation: 45°
  - Can be manually edited if needed
- Status bar: "Entity rotated 45°"
- Cursor returns to default select cursor

**Validation Method**: Integration test - Verify rotation persisted to store

---

### Step 5: Update Connected Entities

**User Action**: (Automatic - if entity has connected ducts)

**Expected Result**:
- Connection system notified of entity rotation
- For each connection:
  - Identify connection point (e.g., "supply-outlet")
  - Calculate rotated position of connection point
  - Original supply position: (500, 140) - top center
  - Rotated 45° supply position: (513, 127) - top-right
- Update connected duct endpoints:
  - Supply duct endpoint: (500, 140) → (513, 127)
  - Return duct endpoint: (500, 160) → (487, 173)
  - Duct paths recalculated
- Visual result:
  - Ducts follow rotated RTU connection points
  - No gaps or disconnections
  - Ducts may change angle/length to accommodate
- Connection validation:
  - Check for excessive duct stretch (>50% length increase)
  - Warning if duct severely distorted: "Duct may require rerouting"
  - Suggest adding fittings or repositioning
- Batch update for performance:
  - All duct updates in single transaction
  - Single canvas re-render includes all changes

**Validation Method**: Integration test - Verify connected duct endpoints update

---

## Edge Cases

### 1. Free Rotation (No Angle Snap)

**User Action**: Hold Shift key while dragging rotation handle

**Expected Behavior**:
- Shift key detected during rotation
- Angle snapping disabled
- Entity rotates freely:
  - Raw angle: 47.3°
  - Applied rotation: 47.3° (exact, no snapping)
  - Can rotate to any arbitrary angle
- Visual feedback:
  - Angle display shows precise value: "47.3°"
  - No snap indicator lines shown
  - Smooth continuous rotation
- Useful for precise custom orientations:
  - Match specific installation angles
  - Fine-tune positioning
- Release Shift during drag:
  - Snapping re-enabled
  - Current angle snaps to nearest 15°
  - Smooth transition between modes

**Validation Method**: Unit test - Verify Shift key disables angle snapping

---

### 2. Rotate Multiple Selected Entities

**User Action**: Select 3 RTUs, rotate group by 90°

**Expected Behavior**:
- Multiple entities selected (RTU-1, RTU-2, RTU-3)
- Rotation handle appears:
  - Position: Above bounding box of all selected entities
  - Rotates group around group center (not individual centers)
- Drag rotation handle 90° clockwise
- Group rotation:
  - All 3 RTUs rotate 90° around shared center point
  - Each RTU also rotates 90° around its own center
  - Relative positions maintained
  - Group layout preserved
- Example:
  - Before: RTUs in horizontal line
  - After 90°: RTUs in vertical line (group rotated)
  - Each RTU also rotated 90° individually
- Single undo command:
  - `RotateEntitiesCommand` (plural)
  - Restores all 3 RTUs to original rotation
- All connections update for all entities

**Validation Method**: Integration test - Verify multi-entity rotation

---

### 3. Rotate Entity with Manual Angle Input

**User Action**: With RTU selected, type "30" in Inspector rotation field

**Expected Behavior**:
- Inspector rotation input field active
- User types "30" and presses Enter
- Rotation applied immediately:
  - Entity rotates from current angle to 30°
  - Smooth animation (optional) over 200ms
  - Or instant snap to 30°
- Same rotation logic as handle drag:
  - Rotation command created
  - Connections updated
  - Undo support
- Input validation:
  - Valid range: -360° to +360°
  - Values normalized: 370° → 10° (mod 360)
  - Negative values accepted: -90° = 270°
- Keyboard increment shortcuts:
  - Arrow up: Increase by 15°
  - Arrow down: Decrease by 15°
  - Shift+Arrow: Increase/decrease by 1° (fine control)

**Validation Method**: E2E test - Verify manual rotation input

---

### 4. Rotate 360° (Full Circle)

**User Action**: Drag rotation handle all the way around in circle

**Expected Behavior**:
- Rotation continues past 360°
- Angle normalization:
  - User drags to 390°
  - Stored as: 30° (390 mod 360)
  - Display shows: "30°"
- Visual feedback:
  - Rotation arc completes full circle
  - Continues into second rotation
  - Angle display wraps: "360°" → "0°" → "15°"
- Entity appears at final normalized angle:
  - 390° looks identical to 30°
  - No visual difference (360° = 0°)
- Useful for continuous rotation:
  - Can rotate multiple times in same direction
  - Stored angle always normalized 0-359°

**Validation Method**: Unit test - Verify angle normalization

---

### 5. Rotate Room Entity (Non-Rotatable)

**User Action**: Select rectangular room, attempt to rotate

**Expected Behavior**:
- Room entity selected
- Rotation handle NOT shown:
  - Rooms are axis-aligned rectangles
  - Rotation not supported (or restricted)
  - Only resize handles appear
- Attempt to rotate via inspector:
  - Rotation field disabled (grayed out)
  - Or shows: "N/A" (not applicable)
  - Tooltip: "Rooms cannot be rotated"
- Rationale:
  - HVAC room layouts typically axis-aligned
  - Rotated rectangles complicate grid snapping
  - Use polygon tool for angled rooms (future)
- Workaround:
  - Convert room to polygon entity (supports rotation)
  - Or use rotated equipment/notes instead

**Validation Method**: Unit test - Verify rotation disabled for room entities

---

## Error Scenarios

### 1. Rotation Calculation Error

**Scenario**: Rotation angle calculation produces NaN or invalid value

**Expected Handling**:
- Rotation angle calculated from mouse position
- Invalid value detected (NaN, Infinity)
- Error prevention:
  - Validation before applying rotation
  - Fallback to previous valid angle
  - Rotation operation cancelled
- Error logged: "Invalid rotation angle calculated"
- User sees no rotation (entity unchanged)
- Can retry rotation
- No crash or visual glitches

**Validation Method**: Unit test - Verify rotation validation prevents invalid angles

---

### 2. Connection Update Failure

**Scenario**: Duct connected to rotated RTU fails to update endpoint

**Expected Handling**:
- Rotation completes successfully
- Connection update attempted
- If connection update fails:
  - Warning toast: "Some connections may need manual adjustment"
  - RTU still rotated correctly
  - Duct shows error state (red outline)
  - User can manually reconnect duct
- Partial success approach:
  - Don't fail entire rotation if connection fails
  - Update what's possible
  - Flag failures for user review
- Error logged for debugging

**Validation Method**: Integration test - Verify rotation succeeds even if connection update fails

---

### 3. Rotation During Active Drag

**Scenario**: User starts dragging entity, then triggers rotation

**Expected Handling**:
- Move operation in progress
- Rotation attempted (keyboard shortcut)
- Move operation cancelled first:
  - Entity returns to drag start position
  - Drag state cleared
- Then rotation executes normally
- No conflict between operations
- Clean state transition
- User sees rotation after move cancelled

**Validation Method**: Integration test - Verify rotation cancels active move

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Rotate 90° Clockwise | `R` or `]` (while selected) |
| Rotate 90° Counter-Clockwise | `Shift + R` or `[` |
| Rotate 45° Clockwise | `Ctrl/Cmd + ]` |
| Rotate 45° Counter-Clockwise | `Ctrl/Cmd + [` |
| Free Rotation (No Snap) | Hold `Shift` while dragging handle |
| Undo Rotation | `Ctrl/Cmd + Z` |

---

## Related Elements

- [SelectTool](../../elements/04-tools/SelectTool.md) - Selection and rotation handle
- [RotateCommand](../../elements/09-commands/RotateCommand.md) - Rotation undo/redo
- [RotationHandle](../../elements/01-components/canvas/RotationHandle.md) - Handle rendering
- [entityStore](../../elements/02-stores/entityStore.md) - Rotation storage
- [ConnectionSystem](../../elements/08-systems/ConnectionSystem.md) - Endpoint updates
- [TransformCalculator](../../elements/06-calculations/TransformCalculator.md) - Rotation math
- [UJ-SM-006](./UJ-SM-006-MoveEntity.md) - Entity movement (related)
- [UJ-SM-007](./UJ-SM-007-ResizeEntity.md) - Entity resizing (related)

---

## Visual Diagram

```
Rotation Handle and Operation
┌────────────────────────────────────────────────────────┐
│  Selected Entity with Rotation Handle:                 │
│                                                        │
│                ↻ ← Rotation handle (20px above)        │
│             ┌────┐                                     │
│             │    │ ← Entity center (pivot point)       │
│          TL │ RTU│ TR ← Resize handles                 │
│             │    │                                     │
│             └────┘                                     │
│          BL      BR                                    │
│                                                        │
│  Rotation Handle Properties:                           │
│  - Position: 20px above top edge, centered             │
│  - Icon: Circular arrow (↻)                            │
│  - Cursor: Rotation cursor on hover                    │
│  - Color: Blue (selection color)                       │
└────────────────────────────────────────────────────────┘

Rotation Operation Visualization:
┌────────────────────────────────────────────────────────┐
│  Before Rotation (0°):                                 │
│              ↻                                         │
│          ┌────────┐                                    │
│          │  RTU   │ ← Original orientation             │
│          │  [FAN] │                                    │
│          └────────┘                                    │
│             ↑  ↓                                       │
│          Supply Return                                 │
│                                                        │
│  During Rotation (45° preview):                        │
│                ↻                                       │
│             ╱──────╲                                   │
│            ╱  RTU   ╲ ← Live preview at 45°            │
│           ╱   [FAN]  ╲                                 │
│          ╱──────────╲                                  │
│         ↗          ↙ ← Rotated connection points       │
│                                                        │
│      [45°] ← Angle display                             │
│                                                        │
│    Ghost outline at 0° (dashed)                        │
│                                                        │
│  After Rotation (45° finalized):                       │
│                ↻                                       │
│             ╱──────╲                                   │
│            ╱  RTU   ╲ ← Final position                 │
│           ╱   [FAN]  ╲                                 │
│          ╱──────────╲                                  │
│         ↗          ↙                                   │
│      Supply    Return (rotated)                        │
└────────────────────────────────────────────────────────┘

Angle Snapping (15° increments):
┌────────────────────────────────────────────────────────┐
│              0°                                        │
│              │                                         │
│         345° │ 15°                                     │
│          ╲   │   ╱                                     │
│      330° ╲  │  ╱ 30°                                  │
│            ╲ │ ╱                                       │
│         315°─┼─45°  ← Mouse at 47° snaps to 45°        │
│             ╱│╲                                        │
│        300°╱ │ ╲60°                                    │
│          ╱   │   ╲                                     │
│      285°    │    75°                                  │
│         270° │ 90°                                     │
│                                                        │
│  Snap Increments: 0°, 15°, 30°, 45°, 60°, 75°, 90°... │
│  Snap Tolerance: ±2° (e.g., 43°-47° → 45°)            │
└────────────────────────────────────────────────────────┘

Connection Point Rotation:
┌────────────────────────────────────────────────────────┐
│  Before Rotation:                                      │
│  RTU at 0°, Supply at top (0°):                        │
│          (500, 140)                                    │
│              ↑                                         │
│          ┌────────┐                                    │
│          │  RTU   │ Center: (500, 150)                 │
│          └────────┘                                    │
│              ↓                                         │
│          (500, 160)                                    │
│                                                        │
│  After 45° Rotation:                                   │
│  Connection point rotates around center:               │
│                                                        │
│  Original: (500, 140) - 10px above center              │
│  Offset from center: (0, -10)                          │
│                                                        │
│  Rotated offset (45°):                                 │
│  x' = 0 * cos(45°) - (-10) * sin(45°) = 7.07          │
│  y' = 0 * sin(45°) + (-10) * cos(45°) = -7.07         │
│                                                        │
│  New position: (500 + 7.07, 150 - 7.07) = (507, 143)  │
│                                                        │
│            (507, 143)                                  │
│                ↗                                       │
│             ╱────╲                                     │
│            ╱ RTU  ╲                                    │
│           ╱────────╲                                   │
│              ↙                                         │
│          (493, 157)                                    │
└────────────────────────────────────────────────────────┘

Multi-Entity Rotation:
┌────────────────────────────────────────────────────────┐
│  Before: 3 RTUs in horizontal line                     │
│  [RTU-1]    [RTU-2]    [RTU-3]                         │
│     A           B           C                          │
│                                                        │
│  Group center: B (middle RTU position)                 │
│                                                        │
│  After 90° Rotation around group center:               │
│                                                        │
│        [RTU-1]  A'                                     │
│           ↕                                            │
│        [RTU-2]  B' ← Group center (unchanged)          │
│           ↕                                            │
│        [RTU-3]  C'                                     │
│                                                        │
│  Each RTU also rotated 90° individually                │
│  Relative positions maintained                         │
└────────────────────────────────────────────────────────┘

Rotation Command Structure:
┌────────────────────────────────────────────────────────┐
│  RotateEntityCommand {                                 │
│    entityId: "rtu-1",                                  │
│    oldRotation: 0,                                     │
│    newRotation: 45,                                    │
│    centerPoint: { x: 500, y: 150 },                    │
│                                                        │
│    execute() {                                         │
│      // Apply rotation to entity                       │
│      entity.transform.rotation = 45                    │
│      // Update connection points                       │
│      updateConnectionPoints(entity)                    │
│      // Re-render entity                               │
│    },                                                  │
│                                                        │
│    undo() {                                            │
│      // Restore original rotation                      │
│      entity.transform.rotation = 0                     │
│      // Restore connection points                      │
│      updateConnectionPoints(entity)                    │
│      // Re-render entity                               │
│    }                                                   │
│  }                                                     │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/tools/SelectTool.rotate.test.ts`

**Test Cases**:
- Rotation angle calculation from mouse position
- Angle snapping to 15° increments
- Angle normalization (360° → 0°)
- Free rotation with Shift key (no snap)
- Connection point rotation calculation
- Rotation validation (NaN prevention)

**Assertions**:
- Angle = atan2(mouseY - centerY, mouseX - centerX)
- 47° snaps to 45° (nearest 15°)
- 370° normalized to 10°
- Shift key disables snapping
- Rotated connection points calculated correctly
- Invalid angles rejected

---

### Integration Tests
**File**: `src/__tests__/integration/rotate-entity.test.ts`

**Test Cases**:
- Complete rotation workflow
- Entity rotation persisted to store
- Connected ducts update endpoints
- Undo/redo rotation
- Multi-entity group rotation
- Manual angle input via inspector

**Assertions**:
- Entity rotation stored in transform.rotation
- Duct endpoints follow rotated connection points
- Undo restores original rotation
- All selected entities rotate together
- Inspector input applies rotation correctly

---

### E2E Tests
**File**: `e2e/selection/rotate-entity.spec.ts`

**Test Cases**:
- Visual rotation handle rendering
- Drag rotation handle to rotate
- Angle display during rotation
- Ghost outline at original position
- Snap indicator lines visible
- Connection updates after rotation

**Assertions**:
- Rotation handle visible above selected entity
- Entity rotates visually during drag
- Angle tooltip shows current rotation
- Ghost outline shows starting position
- Dashed lines at 15° intervals
- Ducts follow rotated entity

---

## Common Pitfalls

### ❌ Don't: Rotate entity around origin (0, 0)
**Problem**: Entity moves away from original position during rotation

**Solution**: Always rotate around entity center point

---

### ❌ Don't: Forget to update connection points
**Problem**: Ducts appear disconnected after rotation

**Solution**: Recalculate and update all connection point positions

---

### ❌ Don't: Allow unlimited decimal precision in rotation
**Problem**: 47.3892749234° difficult to work with, inconsistent snapping

**Solution**: Round to 1 decimal place (47.4°) or snap to increments

---

### ✅ Do: Show angle display during rotation
**Benefit**: User knows exact rotation angle before committing

---

### ✅ Do: Provide keyboard shortcuts for common angles (90°, 45°)
**Benefit**: Quick rotation without precision dragging

---

## Performance Tips

### Optimization: Defer Connection Recalculation
**Problem**: Recalculating all duct endpoints during drag is expensive

**Solution**: Mark connections dirty, recalculate on mouse up
- Rotation preview doesn't update connections (too slow)
- Connections update only when rotation finalized
- 60fps rotation performance maintained

---

### Optimization: Use Transform Matrix for Rendering
**Problem**: Recalculating every point position during rotation is slow

**Solution**: Use CSS transform or canvas rotation matrix
- Apply rotation transform to entire entity
- GPU-accelerated rendering
- No point-by-point recalculation
- 10x faster rendering

---

### Optimization: Throttle Angle Display Updates
**Problem**: Updating angle tooltip 60 times per second causes lag

**Solution**: Throttle display updates to 10fps
- Calculate angle at 60fps (smooth rotation)
- Update display text at 10fps
- User doesn't notice 100ms display delay
- Reduces DOM updates by 85%

---

## Future Enhancements

- **3D Rotation**: Rotate entities in 3D space (perspective view)
- **Rotation Animation**: Smooth animated rotation over time
- **Snap to Grid Rotation**: Rotate to align with grid lines
- **Rotation Constraints**: Limit rotation to specific angles (e.g., only 90°)
- **Rotation Gizmo**: More visual rotation control (like CAD software)
- **Rotate to Align**: Auto-rotate to align with nearby entities
- **Rotation History**: Quick access to recent rotation angles
- **Magnetic Rotation**: Snap to alignment with nearby entities
- **Rotation by Degrees**: Click handle, type angle directly
- **Mirror Rotation**: Flip entity horizontally or vertically
