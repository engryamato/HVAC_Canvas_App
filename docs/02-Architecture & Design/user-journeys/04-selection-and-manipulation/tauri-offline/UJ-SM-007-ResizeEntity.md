# [UJ-SM-007] Resize Entity

## Overview

This user journey covers resizing entities (rooms, equipment) by dragging resize handles, including proportional scaling, minimum size constraints, real-time dimension feedback, and undo support.

## PRD References

- **FR-SM-007**: User shall be able to resize entities by dragging corner/edge handles
- **US-SM-007**: As a designer, I want to resize rooms and equipment so that I can match real-world dimensions
- **AC-SM-007-001**: Resize handles appear on selected entity (8 handles: 4 corners, 4 edges)
- **AC-SM-007-002**: Corner handles resize proportionally or freely based on modifier key
- **AC-SM-007-003**: Edge handles resize single dimension only
- **AC-SM-007-004**: Real-time dimension display during resize
- **AC-SM-007-005**: Minimum size constraints enforced (e.g., 1ft minimum)
- **AC-SM-007-006**: Undo restores original dimensions

## Prerequisites

- User is in Canvas Editor with Select tool active
- At least one resizable entity exists (room or equipment)
- Entity is selected (showing resize handles)
- Entity is not locked (future feature)

## User Journey Steps

### Step 1: Select Entity and Show Resize Handles

**User Action**: Click on room entity to select it

**Expected Result**:
- Entity selected successfully
- Selection highlight rendered (blue outline)
- 8 resize handles appear:
  - **4 corner handles**: Top-left, top-right, bottom-left, bottom-right
  - **4 edge handles**: Top, right, bottom, left
- Handle appearance:
  - Visual: 8px × 8px white squares with blue border
  - Position: On entity bounding box edges/corners
  - Cursor: Bidirectional resize cursor on hover
  - z-index: Above entity, below cursor
- Entity properties shown in inspector:
  - Current dimensions: Width 20ft, Height 15ft
  - Position: X 100ft, Y 50ft
- Resize mode ready

**Validation Method**: E2E test - Verify resize handles appear on selection

---

### Step 2: Begin Resize on Corner Handle

**User Action**: Click and hold bottom-right corner handle

**Expected Result**:
- Mouse down detected on resize handle
- Resize mode activated
- Handle type identified: Corner (bottom-right)
- Starting state recorded:
  - Original dimensions: 20ft × 15ft
  - Original position: (100, 50)
  - Mouse starting position: (120, 65) in world coordinates
  - Opposite corner anchored: Top-left (100, 50)
- Cursor changes to diagonal resize cursor (↘)
- Handle highlights (increases size or changes color)
- Status bar: "Drag to resize entity"
- Ghost outline appears at original size (semi-transparent)

**Validation Method**: Integration test - Verify resize mode activates on handle drag

---

### Step 3: Drag Handle to New Size

**User Action**: Drag mouse from (120, 65) to (140, 75) - delta: (+20ft, +10ft)

**Expected Result**:
- Mouse movement tracked continuously
- Entity dimensions updated in real-time:
  - New width = original width + deltaX = 20 + 20 = 40ft
  - New height = original height + deltaY = 15 + 10 = 25ft
  - Top-left corner remains anchored at (100, 50)
- Visual feedback during drag:
  - **Entity renders at new size** (live preview)
  - **Ghost outline** at original size (semi-transparent)
  - **Dimension lines** showing width and height
  - **Dimension labels**: "40.0 ft" (width), "25.0 ft" (height)
- Dimension display shown:
  - Tooltip near cursor: "W: 40.0 ft, H: 25.0 ft"
  - Or inspector panel updates in real-time
- Modifier keys affect behavior:
  - **Shift key**: Maintain aspect ratio (proportional resize)
  - **Alt key**: Resize from center (not corner anchor)
  - **No modifiers**: Free resize
- Resize smooth at 60fps
- No lag or stuttering

**Validation Method**: E2E test - Verify entity dimensions update during drag

---

### Step 4: Apply Constraints and Validation

**User Action**: (Automatic during drag)

**Expected Result**:
- Minimum size constraints enforced:
  - Minimum width: 1ft (configurable)
  - Minimum height: 1ft (configurable)
  - If drag would make entity smaller: Clamp to minimum
  - Visual feedback: Handle stops moving even if mouse continues
- Maximum size constraints (optional):
  - Maximum width: 1000ft (sanity check)
  - Maximum height: 1000ft
  - Prevents accidental huge entities
- Grid snap (if enabled):
  - Dimensions snap to grid multiples
  - Example: 12" grid → dimensions in 1ft increments
  - Snap occurs during drag (real-time feedback)
- Aspect ratio lock (if Shift held):
  - Width/height ratio maintained
  - Original ratio: 20:15 = 1.33
  - If width increases to 40ft → height auto-adjusts to 30ft
  - Both dimensions update together

**Validation Method**: Unit test - Verify minimum size constraints enforced

---

### Step 5: Release Handle and Finalize Resize

**User Action**: Release mouse button at final position

**Expected Result**:
- Resize operation finalized
- Entity dimensions committed to store:
  - `updateEntity(roomId, { props: { width: 40, height: 25 } })`
  - Store triggers re-render
- Resize command created for undo:
  - `ResizeEntityCommand` with old size (20×15) and new size (40×25)
  - Added to history stack
- Visual updates:
  - Ghost outline disappears
  - Dimension lines removed
  - Entity remains at new size
  - Selection highlight and handles update to new size
  - Resize handles repositioned for new dimensions
- Connected entities updated:
  - Ducts connected to room edges update endpoints
  - Notes attached to entity reposition
  - Connection calculations refreshed
- Inspector panel shows final dimensions:
  - Width: 40.0 ft
  - Height: 25.0 ft
  - Area: 1000 sq ft (calculated)
- Cursor returns to default select cursor
- Status bar: "Entity resized"
- Brief toast confirmation: "Room 1 resized to 40×25 ft" (optional)

**Validation Method**: Integration test - Verify entity dimensions persisted to store

---

## Edge Cases

### 1. Resize with Shift Key (Proportional)

**User Action**: Select room (20×15), hold Shift, drag bottom-right corner to increase width by 10ft

**Expected Behavior**:
- Aspect ratio maintained: 20:15 = 1.33
- Width increases: 20 → 30ft
- Height auto-adjusts: 15 → 22.5ft (maintains 1.33 ratio)
- Both dimensions change simultaneously
- Visual indicator: "Proportional resize" tooltip
- Release Shift during drag → switches to free resize
- Smooth transition between modes

**Validation Method**: Integration test - Verify aspect ratio maintained with Shift key

---

### 2. Resize with Alt Key (From Center)

**User Action**: Select room at (100, 50, 20×15), hold Alt, drag bottom-right corner

**Expected Behavior**:
- Entity resizes from center point (110, 57.5)
- Opposite corner also moves (mirror effect)
- Width increases equally on both sides
- Height increases equally top and bottom
- Center position remains fixed
- Visual indicator: "Resize from center" tooltip
- Useful for symmetrical adjustments

**Validation Method**: Unit test - Verify center-based resize calculations

---

### 3. Resize Below Minimum Size

**User Action**: Try to drag corner handle to make 1ft × 1ft room smaller

**Expected Behavior**:
- Dimensions clamped to minimum: 1ft × 1ft
- Handle stops moving even if mouse continues dragging
- Visual feedback:
  - Handle changes color (red) to indicate constraint
  - Tooltip: "Minimum size: 1 ft"
- Audible beep (optional)
- Cannot make entity smaller than minimum
- Prevents invisible or zero-size entities

**Validation Method**: Unit test - Verify size clamping to minimum

---

### 4. Resize Edge Handle (Single Dimension)

**User Action**: Drag right edge handle (not corner)

**Expected Behavior**:
- Only width changes
- Height remains constant
- Left edge anchored (doesn't move)
- Right edge moves with mouse
- Cursor: Left-right resize cursor (↔)
- Dimension display shows only width changing
- Useful for precise single-dimension adjustments
- Same constraints apply (minimum/maximum)

**Validation Method**: E2E test - Verify edge handle only resizes one dimension

---

### 5. Resize Multiple Selected Entities

**User Action**: Select 3 rooms, attempt to resize

**Expected Behavior**:
- Resize handles appear on bounding box of all selected entities
- Dragging handle scales all entities proportionally:
  - Each entity scales by same percentage
  - Relative sizes maintained
  - Positions adjust to maintain group layout
- Example:
  - Room A: 20×15 → 40×30 (2x scale)
  - Room B: 10×10 → 20×20 (2x scale)
  - Room C: 30×20 → 60×40 (2x scale)
- Single undo command resizes all back
- Complex operation but consistent behavior

**Validation Method**: Integration test - Verify multi-entity resize maintains proportions

---

## Error Scenarios

### 1. Store Update Failure During Resize

**Scenario**: Entity store throws error during dimension update

**Expected Handling**:
- Error caught during drag operation
- Entity dimensions revert to original
- Error toast: "Cannot resize entity. Please try again."
- Resize operation cancelled
- No undo command created
- Entity remains selected
- Handles remain at original size
- Console error logged for debugging

**Validation Method**: Unit test - Verify error handling reverts dimensions

---

### 2. Invalid Dimensions Calculated

**Scenario**: Resize calculation produces NaN or negative dimensions

**Expected Handling**:
- Validation detects invalid dimensions
- Error prevented before store update
- Warning logged: "Invalid resize dimensions calculated"
- Resize operation cancelled
- Entity keeps current dimensions
- User can retry
- Bug report generated for investigation

**Validation Method**: Unit test - Verify dimension validation prevents invalid values

---

### 3. Connected Entity Update Failure

**Scenario**: Duct connected to resized room fails to update endpoint

**Expected Handling**:
- Resize completes successfully
- Connection update attempted
- If connection update fails:
  - Warning toast: "Some connections may need manual adjustment"
  - Room still resized correctly
  - Duct shows in error state (red outline)
  - User can manually reconnect duct
- Partial success approach (don't fail entire resize)

**Validation Method**: Integration test - Verify resize succeeds even if connection update fails

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Resize Entity | Drag resize handle with Select tool |
| Proportional Resize | Hold `Shift` while dragging corner handle |
| Resize from Center | Hold `Alt` while dragging any handle |
| Snap to Grid | Automatically applies if grid snap enabled |
| Disable Grid Snap | Hold `Alt` while dragging (temporary) |
| Undo Resize | `Ctrl/Cmd + Z` |
| Precise Resize | Use Inspector panel number inputs |

---

## Related Elements

- [SelectTool](../../elements/04-tools/SelectTool.md) - Resize operation implementation
- [ResizeCommand](../../elements/09-commands/ResizeCommand.md) - Undo/redo resize support
- [ResizeHandles](../../elements/01-components/canvas/ResizeHandles.md) - Handle rendering component
- [entityStore](../../elements/02-stores/entityStore.md) - Dimension updates
- [viewportStore](../../elements/02-stores/viewportStore.md) - Grid snap settings
- [HistoryStore](../../elements/09-commands/HistoryStore.md) - Command history
- [Inspector](../../elements/01-components/panels/Inspector.md) - Dimension display
- [UJ-SM-006](./UJ-SM-006-MoveEntity.md) - Move operation (related manipulation)

---

## Visual Diagram

```
Resize Handle Layout (Selected Room)
┌───────────────────────────────────────────────┐
│    TL────────T────────TR                      │
│    │                   │                       │
│    │                   │                       │
│    L      ROOM ENTITY  R  ← 8 handles         │
│    │     (20 ft × 15 ft)│                      │
│    │                   │                       │
│    BL────────B────────BR  ← Active handle     │
└───────────────────────────────────────────────┘

Handle Types:
- TL, TR, BL, BR: Corner handles (bidirectional resize)
- T, R, B, L: Edge handles (single-dimension resize)

Resize Operation Flow
┌────────────────────────────────────────────────────────┐
│  1. Click on Resize Handle (Bottom-Right)             │
│     ↓                                                  │
│  2. Record Starting State                             │
│     - Original size: 20 × 15                          │
│     - Anchor point: Top-left (100, 50)                │
│     - Mouse position: (120, 65)                       │
│     ↓                                                  │
│  3. Mouse Move (Drag)                                 │
│     ↓                                                  │
│  4. Calculate New Dimensions                          │
│     newWidth = anchorX + (mouseX - anchorX)           │
│     newHeight = anchorY + (mouseY - anchorY)          │
│     ↓                                                  │
│  5. Apply Constraints                                 │
│     - Minimum size: 1 ft                              │
│     - Aspect ratio (if Shift held)                    │
│     - Grid snap (if enabled)                          │
│     ↓                                                  │
│  6. Update Entity Dimensions (Preview)                │
│     entity.props.width = newWidth                     │
│     entity.props.height = newHeight                   │
│     ↓                                                  │
│  7. Render at New Size                                │
│     ↓                                                  │
│  8. Mouse Up (Release)                                │
│     ↓                                                  │
│  9. Finalize Dimensions in Store                      │
│     ↓                                                  │
│  10. Create Undo Command                              │
│     ResizeCommand(oldSize, newSize)                   │
└────────────────────────────────────────────────────────┘

Proportional Resize (Shift Key):
┌────────────────────────────────────┐
│  Before: 20 × 15 (ratio 1.33)     │
│  ┌──────────────┐                 │
│  │              │                 │
│  │    ROOM      │                 │
│  │              │                 │
│  └──────────────┘                 │
│                                    │
│  After: 40 × 30 (ratio 1.33)      │
│  ┌──────────────────────────────┐ │
│  │                              │ │
│  │          ROOM                │ │
│  │                              │ │
│  │                              │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘

Resize from Center (Alt Key):
┌────────────────────────────────────┐
│  Before:        After:             │
│                                    │
│      ┌─────┐    ┌─────────────┐   │
│      │RM 1 │    │             │   │
│      └─────┘    │    RM 1     │   │
│        +        │             │   │
│     (center)    └─────────────┘   │
│                       +            │
│              (same center)         │
└────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/tools/SelectTool.resize.test.ts`

**Test Cases**:
- Dimension calculation for corner handles
- Dimension calculation for edge handles
- Minimum size constraint enforcement
- Maximum size constraint enforcement
- Aspect ratio maintenance (Shift key)
- Center-based resize (Alt key)
- Grid snap during resize

**Assertions**:
- New dimensions = anchor + delta
- Dimensions never below minimum (1ft)
- Dimensions never above maximum (1000ft)
- Aspect ratio preserved when Shift held
- Center position unchanged when Alt held
- Grid-snapped dimensions are multiples of grid size

---

### Integration Tests
**File**: `src/__tests__/integration/entity-resize.test.ts`

**Test Cases**:
- Complete resize workflow
- Store persistence after resize
- Undo/redo functionality
- Connected entity updates (ducts, notes)
- Multi-entity group resize
- Area calculation updates

**Assertions**:
- Entity dimensions persisted to store
- Undo restores original dimensions
- Redo reapplies new dimensions
- Connected ducts update endpoints correctly
- History stack contains resize command
- Area recalculated based on new dimensions

---

### E2E Tests
**File**: `e2e/selection/resize-entity.spec.ts`

**Test Cases**:
- Visual resize handles rendering
- Corner handle drag operation
- Edge handle drag operation
- Dimension display during resize
- Ghost outline rendering
- Shift key proportional resize
- Alt key center resize
- Minimum size visual feedback

**Assertions**:
- 8 resize handles visible on selection
- Entity renders at new size during drag
- Ghost outline visible at original size
- Dimension labels show correct values
- Handles update to new size after release
- Proportional resize maintains ratio

---

## Common Pitfalls

### ❌ Don't: Update dimensions on every mouse move without throttling
**Problem**: 100+ dimension updates per second causes performance issues

**Solution**: Throttle updates to 60fps (every 16ms) maximum

---

### ❌ Don't: Forget to update connected entities
**Problem**: Ducts don't update when connected room resizes, appear disconnected

**Solution**: Always refresh connection endpoints when entity dimensions change

---

### ❌ Don't: Allow dimensions below minimum
**Problem**: Entities become invisible or unusable at very small sizes

**Solution**: Enforce minimum 1ft size constraint during drag

---

### ❌ Don't: Calculate area only on release
**Problem**: User can't see area changing during resize

**Solution**: Update area calculation in real-time during resize preview

---

### ✅ Do: Show ghost outline at original size
**Benefit**: User can see before/after comparison during resize

---

### ✅ Do: Provide visual feedback for constraints
**Benefit**: User understands why resize stopped (minimum reached, grid snap, etc.)

---

## Performance Tips

### Optimization: Defer Area Calculations
**Problem**: Recalculating area and all derived metrics during drag is expensive

**Solution**: Calculate only on mouse up (final size)
- Show approximate area during drag (cached)
- Recalculate precisely on release
- Maintains smooth 60fps resize performance

---

### Optimization: Batch Connected Entity Updates
**Problem**: Updating 20 connected ducts individually causes 20 store operations

**Solution**: Batch all connection updates into single store operation
- Collect all new endpoint positions
- Apply in one transaction
- Reduces re-renders from 20 to 1

---

### Optimization: Simplified Ghost Rendering
**Problem**: Rendering full ghost entity details slows down drag

**Solution**: Render ghost as simple outline only
- No fills, gradients, or text
- Just stroke outline
- 5-10x faster rendering

---

## Future Enhancements

- **Smart Resize**: Snap to nearby entity edges for alignment
- **Numeric Resize**: Click dimension label to type exact size
- **Resize Constraints**: Lock width or height with keyboard shortcut
- **Resize History**: Show list of recent sizes for quick revert
- **Resize Templates**: Common room sizes (10×10, 20×15, etc.) in dropdown
- **Visual Grid Alignment**: Show which grid lines dimensions align to
- **Resize Animation**: Smooth transition on undo/redo
- **Multi-Handle Drag**: Drag multiple handles simultaneously (advanced)
