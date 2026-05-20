# [UJ-SM-006] Move Entity

## Overview

This user journey covers moving entities across the canvas using click-drag interaction with the Select tool, including snap-to-grid assistance, real-time position feedback, collision avoidance (optional), and undo support.

## PRD References

- **FR-SM-006**: User shall be able to move entities by dragging with mouse
- **US-SM-006**: As a designer, I want to move entities so that I can arrange my HVAC layout
- **AC-SM-006-001**: Click-drag on selected entity moves it
- **AC-SM-006-002**: Movement respects snap-to-grid if enabled
- **AC-SM-006-003**: Real-time position display during drag
- **AC-SM-006-004**: Multi-entity selection moves all entities together
- **AC-SM-006-005**: Undo restores original positions

## Prerequisites

- User is in Canvas Editor with Select tool active
- At least one entity exists and is selected
- Entity is not locked (future feature)

## User Journey Steps

### Step 1: Begin Drag on Selected Entity

**User Action**: Click on selected room entity and hold mouse button

**Expected Result**:
- Mouse down detected on selected entity
- Drag mode activated for move operation
- Starting position recorded:
  - Entity original position: (200, 150)
  - Mouse starting position: (250, 175) - relative to entity
  - Offset calculated: (50, 25)
- Cursor changes to "move" cursor (four arrows)
- Entity remains selected
- No visual change yet (waiting for mouse movement)
- Status bar: "Drag to move entity"

**Validation Method**: Integration test - Verify drag mode activates on selected entity

---

### Step 2: Drag Entity to New Position

**User Action**: Drag mouse from (250, 175) to (450, 325) - delta: (200, 150)

**Expected Result**:
- Mouse movement tracked continuously
- Entity position updated in real-time:
  - New position = starting position + delta - offset
  - Entity moves from (200, 150) to (400, 300)
- Visual feedback during drag:
  - **Entity renders at new position** (live preview)
  - **Ghost outline** at original position (semi-transparent)
  - **Dashed line** connecting original to new position (optional)
  - **Grid snap indicators** if snap-to-grid enabled
- Position display shown:
  - Tooltip near cursor: "X: 33.3 ft, Y: 25.0 ft"
  - Or status bar: "Position: (33.3, 25.0)"
- Connected entities update:
  - Ducts connected to room stretch/update endpoints
  - Notes attached to entity move with it
- Movement smooth at 60fps
- No lag or stuttering

**Validation Method**: E2E test - Verify entity position updates during drag

---

### Step 3: Snap to Grid (If Enabled)

**User Action**: Grid snap enabled (12" grid), drag continues

**Expected Result**:
- Entity position snapped to nearest grid intersection
- Snap occurs during drag (not just on release)
- Visual snap feedback:
  - Grid intersection highlights when entity nearby
  - Magnetic "pull" effect (entity jumps to grid)
  - Snap distance: 20px default (configurable)
- Position values align to grid:
  - Before snap: (401.7, 298.3)
  - After snap: (396, 300) - exact multiple of 12
- Snap can be temporarily disabled:
  - Hold `Alt` key during drag to disable snap
  - Status bar: "Grid snap disabled (Alt key)"
- Smooth snapping animation (5ms transition)

**Validation Method**: Unit test - Verify position snaps to grid multiples

---

### Step 4: Release to Complete Move

**User Action**: Release mouse button at final position

**Expected Result**:
- Drag operation finalized
- Entity position committed to store:
  - `updateEntity(roomId, { transform: { x: 396, y: 300 } })`
- Move command created for undo:
  - `MoveEntityCommand` with old position (200, 150) and new position (396, 300)
  - Added to history stack
- Visual updates:
  - Ghost outline disappears
  - Dashed guide line removed
  - Entity remains at new position
  - Selection highlight persists
- Connected entities finalized:
  - Duct endpoints updated permanently
  - Connection calculations refreshed
- Cursor returns to default select cursor
- Status bar: "Entity moved"
- Brief toast confirmation: "Room 1 moved" (optional)

**Validation Method**: Integration test - Verify entity position persisted to store

---

### Step 5: Verify Undo/Redo

**User Action**: Press Ctrl+Z to undo move

**Expected Result**:
- Undo command executed
- Entity returns to original position:
  - Position restored to (200, 150)
  - Transform updated in store
- Connected entities revert:
  - Ducts return to original endpoints
  - Notes return to original attachment points
- Visual update immediate (no animation on undo)
- Selection maintained on same entity
- History stack updated
- Status bar: "Undo: Move Entity"
- Redo available: Press Ctrl+Shift+Z to redo

**Validation Method**: E2E test - Verify undo/redo cycle restores positions correctly

---

## Edge Cases

### 1. Move Multiple Selected Entities

**User Action**: Select 5 entities (rooms, ducts, notes), drag one of them

**Expected Behavior**:
- All 5 entities move together as a group
- Relative positions between entities maintained
- Delta applied equally to all: `newPosition = oldPosition + delta`
- Bounding box of entire group shown during drag
- Position display shows group center point
- Single undo command moves all back
- All entities snap to grid (if enabled)
- Ghost outlines for all entities

**Validation Method**: Integration test - Verify multi-entity move maintains relative positions

---

### 2. Move Entity Off Canvas

**User Action**: Drag entity outside visible canvas bounds

**Expected Behavior**:
- Entity allowed to move off-screen (canvas is infinite)
- No clamping or boundary restrictions
- Entity still exists in store at off-screen position
- User can pan canvas to find entity
- Warning if entity moved very far: "Entity moved outside visible area"
- Minimap shows entity location (if available)
- "Fit to Screen" function will include off-screen entities

**Validation Method**: Unit test - Verify no position clamping applied

---

### 3. Drag Without Moving (Click-Release)

**User Action**: Click on entity and immediately release (no drag)

**Expected Behavior**:
- Mouse down → Mouse up with delta < 5px
- Interpreted as click, not drag
- No move operation
- No undo command created
- Entity selection maintained
- Inspector panel remains open
- No position change
- Avoids accidental micro-movements

**Validation Method**: Unit test - Verify clicks under 5px threshold don't trigger move

---

### 4. Drag During Pan Operation

**User Action**: Start dragging entity, then use middle mouse button to pan canvas

**Expected Behavior**:
- Move operation cancelled gracefully
- Entity returns to original position (or option: stays at current position)
- Pan operation takes priority
- No undo command created
- User can retry move after pan
- Alternative: Support simultaneous move + pan (advanced)

---

### 5. Move Very Large Entity (1000ft × 1000ft)

**User Action**: Drag extremely large room entity

**Expected Behavior**:
- Move operation works identically
- Performance maintained (entity size doesn't affect move speed)
- Canvas scrolls automatically if entity edge approaches viewport boundary
- Grid snap still applies to top-left corner (or center, configurable)
- Ghost outline may be partially visible
- Zoom out if entity too large to see during move

---

## Error Scenarios

### 1. Store Update Failure During Move

**Scenario**: Entity store throws error during position update

**Expected Handling**:
- Error caught during drag operation
- Entity position reverts to original
- Error toast: "Cannot move entity. Please try again."
- Move operation cancelled
- No undo command created
- Entity remains selected
- Console error logged for debugging

**Validation Method**: Unit test - Verify error handling reverts position

---

### 2. Concurrent Move Operations

**Scenario**: Two users editing same project (future collaborative feature)

**Expected Handling**:
- Conflict detection on move completion
- Warning: "Another user moved this entity. Your changes may overwrite theirs."
- Options:
  - "Use My Position" - Apply local move
  - "Use Their Position" - Discard local move
  - "Cancel" - Revert to before move
- Last-write-wins or merge strategy applied

---

### 3. Memory Pressure During Multi-Entity Move

**Scenario**: Moving 500 entities simultaneously

**Expected Handling**:
- Throttle position updates to every 16ms (60fps)
- Batch store updates for performance
- Ghost outlines may be simplified (outline only, no fill)
- If lag detected: Warning "Large selection may move slowly"
- Complete operation even if slow (5-10 seconds)
- No data loss or corruption

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Move Selected Entity | Click-drag with Select tool |
| Disable Grid Snap (Temporary) | Hold `Alt` while dragging |
| Constrain to Horizontal | Hold `Shift` while dragging |
| Constrain to Vertical | Hold `Shift` while dragging |
| Nudge Up | `↑` (1px) or `Shift+↑` (10px) |
| Nudge Down | `↓` (1px) or `Shift+↓` (10px) |
| Nudge Left | `←` (1px) or `Shift+←` (10px) |
| Nudge Right | `→` (1px) or `Shift+→` (10px) |
| Undo Move | `Ctrl/Cmd + Z` |

---

## Related Elements

- [SelectTool](../../elements/04-tools/SelectTool.md) - Move operation implementation
- [MoveCommand](../../elements/09-commands/MoveCommand.md) - Undo/redo move support
- [entityStore](../../elements/02-stores/entityStore.md) - Position updates
- [viewportStore](../../elements/02-stores/viewportStore.md) - Grid snap settings
- [HistoryStore](../../elements/09-commands/HistoryStore.md) - Command history
- [StatusBar](../../elements/01-components/canvas/StatusBar.md) - Position display

---

## Visual Diagram

```
Move Operation Flow
┌────────────────────────────────────────────────────────┐
│  1. Mouse Down on Selected Entity                     │
│     ↓                                                  │
│  2. Record Starting Positions                         │
│     - Entity: (200, 150)                              │
│     - Mouse: (250, 175)                               │
│     - Offset: (50, 25)                                │
│     ↓                                                  │
│  3. Mouse Move (Drag)                                 │
│     ↓                                                  │
│  4. Calculate New Position                            │
│     newPos = mousePos - offset                        │
│     ↓                                                  │
│  5. Apply Grid Snap (if enabled)                      │
│     snappedPos = roundToGrid(newPos, 12)              │
│     ↓                                                  │
│  6. Update Entity Position (Preview)                  │
│     entity.transform.x = snappedPos.x                 │
│     entity.transform.y = snappedPos.y                 │
│     ↓                                                  │
│  7. Render at New Position                            │
│     ↓                                                  │
│  8. Mouse Up (Release)                                │
│     ↓                                                  │
│  9. Finalize Position in Store                        │
│     ↓                                                  │
│  10. Create Undo Command                              │
│     MoveCommand(oldPos, newPos)                       │
└────────────────────────────────────────────────────────┘

Grid Snap Visualization:
┌────────────────────────────────────┐
│  Grid (12px spacing)               │
│  · · · · · · · · · · · · ·        │
│  · · · · ┌─────┐ · · · · ·        │
│  · · · · │Entity│ · · · · ·  ← Snapped to intersection
│  · · · · └─────┘ · · · · ·        │
│  · · · · · · · · · · · · ·        │
└────────────────────────────────────┘

Multi-Entity Move:
┌────────────────────────────────────┐
│  Before:                           │
│  ┌─┐     ┌─┐                       │
│  │A│     │B│  ← Two entities       │
│  └─┘     └─┘                       │
│                                    │
│  After (drag A by Δx, Δy):         │
│         ┌─┐     ┌─┐                │
│         │A│     │B│  ← Both moved  │
│         └─┘     └─┘    by same Δ  │
└────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/tools/SelectTool.move.test.ts`

**Test Cases**:
- Position delta calculation
- Grid snap logic
- Multi-entity relative position preservation
- Click vs drag threshold (5px)
- Boundary handling (off-screen moves)

**Assertions**:
- New position = old position + delta
- Grid-snapped position is multiple of grid size
- All entities in multi-selection moved by same delta
- Clicks under 5px don't trigger move
- No position clamping applied

---

### Integration Tests
**File**: `src/__tests__/integration/entity-move.test.ts`

**Test Cases**:
- Complete move workflow
- Store persistence after move
- Undo/redo functionality
- Connected entity updates (ducts, notes)
- Multi-entity group move

**Assertions**:
- Entity position persisted to store
- Undo restores original position
- Redo reapplies new position
- Connected ducts update endpoints
- History stack contains move command

---

### E2E Tests
**File**: `e2e/selection/move-entity.spec.ts`

**Test Cases**:
- Visual drag operation
- Grid snap visual feedback
- Position display during drag
- Ghost outline rendering
- Arrow key nudging
- Multi-entity move

**Assertions**:
- Entity renders at new position during drag
- Ghost outline visible at original position
- Position tooltip shows correct coordinates
- Grid highlights appear during snap
- Arrow keys move entity 1px per press

---

## Common Pitfalls

### ❌ Don't: Update position on every mouse move without throttling
**Problem**: 100+ position updates per second causes performance issues

**Solution**: Throttle updates to 60fps (every 16ms) maximum

---

### ❌ Don't: Forget to update connected entities
**Problem**: Ducts don't update when connected room moves, appear disconnected

**Solution**: Always refresh connection endpoints when entity moves

---

### ❌ Don't: Apply grid snap only on release
**Problem**: User can't see snap effect during drag, confusing experience

**Solution**: Snap position during drag for real-time feedback

---

### ✅ Do: Show ghost outline at original position
**Benefit**: User can see how far entity has moved and easily compare

---

### ✅ Do: Create single undo command for multi-entity move
**Benefit**: One undo operation restores all entities, not multiple undos needed

---

## Performance Tips

### Optimization: Batch Position Updates
**Problem**: Updating 100 entities individually causes 100 store operations

**Solution**: Batch all position updates into single store operation
- Collect all new positions
- Apply in one transaction
- Reduces re-renders from 100 to 1
- Speedup: 10-50x for large selections

---

### Optimization: Defer Connection Updates
**Problem**: Recalculating duct endpoints during drag is expensive

**Solution**: Update connections only on mouse up (final position)
- Show approximate connections during drag (cached)
- Recalculate precisely on release
- Maintains smooth 60fps drag performance

---

### Optimization: Simplified Ghost Rendering
**Problem**: Rendering full ghost entity details slows down drag

**Solution**: Render ghost as simple outline only
- No fills, gradients, or text
- Just stroke outline
- 5-10x faster rendering
- Still provides adequate visual feedback

---

## Future Enhancements

- **Smart Move Constraints**: Constrain to horizontal/vertical with Shift key
- **Magnetic Alignment**: Snap to other entity edges (alignment guides)
- **Move Animation**: Smooth transition animation on undo/redo
- **Collision Avoidance**: Warning when entity overlaps important entities
- **Move History**: Show path of recent moves with breadcrumb trail
- **Incremental Nudge**: Fine-tune position with arrow keys (1px increments)
- **Move Undo Preview**: Hover over undo to preview original position

