# [UJ-SM-005] Align Entities

## Overview

This user journey covers aligning multiple selected entities to common edges or centers, including left, right, top, bottom, horizontal center, and vertical center alignment options for precise positioning.

## PRD References

- **FR-SM-005**: User shall be able to align multiple selected entities
- **US-SM-005**: As a designer, I want to align entities so that I can create organized, professional-looking layouts
- **AC-SM-005-001**: Align toolbar provides 6 alignment options (left, center, right, top, middle, bottom)
- **AC-SM-005-002**: Requires 2+ entities selected
- **AC-SM-005-003**: Alignment based on selection bounding box or first-selected entity
- **AC-SM-005-004**: Entities move to aligned positions immediately
- **AC-SM-005-005**: Single undo command restores all entity positions
- **AC-SM-005-006**: Connected entities (ducts) update endpoints after alignment

## Prerequisites

- User is in Canvas Editor with Select tool active
- At least 2 entities selected
- Entities are movable (not locked)
- Sufficient canvas space for alignment

## User Journey Steps

### Step 1: Select Multiple Entities

**User Action**: Select 3 rooms using Shift+Click (Room A, Room B, Room C)

**Expected Result**:
- Three entities selected:
  - Room A: Position (100, 100), Size 200×150
  - Room B: Position (350, 250), Size 200×150
  - Room C: Position (150, 400), Size 200×150
- Selection state:
  - `selectedIds`: ['room-a', 'room-b', 'room-c']
  - Selection count: 3
- Visual indicators:
  - All three rooms show blue selection outline
  - Bounding box encompasses all rooms
  - Resize handles on bounding box corners
- Alignment toolbar appears:
  - Location: Top toolbar or context menu
  - 6 alignment buttons visible:
    - Align Left | Align Center | Align Right
    - Align Top | Align Middle | Align Bottom
  - All buttons enabled (have sufficient selection)
- Status bar: "3 entities selected"

**Validation Method**: E2E test - Verify multi-entity selection enables alignment

---

### Step 2: Choose Alignment Type (Align Left)

**User Action**: Click "Align Left" button in toolbar

**Expected Result**:
- Align Left command triggered
- Alignment reference calculated:
  - **Option A (Bounding Box)**: Leftmost edge of selection bounding box
    - Left edge X = min(100, 350, 150) = 100
  - **Option B (First Selected)**: Left edge of first selected entity (Room A)
    - Left edge X = 100
  - Default: Option A (bounding box)
- Target alignment position: X = 100
- Room positions will be updated:
  - Room A: Already at X=100 (no move)
  - Room B: Move from X=350 to X=100 (delta: -250)
  - Room C: Move from X=150 to X=100 (delta: -50)
- Alignment preview (optional):
  - Ghost outlines show where rooms will move
  - Dashed lines indicate alignment edge
  - Preview for 500ms before applying
- User can confirm or cancel preview (if enabled)

**Validation Method**: Unit test - Verify alignment calculation logic

---

### Step 3: Execute Alignment

**User Action**: (Automatic after button click, or confirm if preview enabled)

**Expected Result**:
- Alignment command created: `AlignEntitiesCommand`
  - Command type: Align Left
  - Entity IDs: ['room-a', 'room-b', 'room-c']
  - Old positions: [(100, 100), (350, 250), (150, 400)]
  - New positions: [(100, 100), (100, 250), (100, 400)]
- Entity positions updated in store:
  - `updateEntity('room-a', { x: 100 })` - No change
  - `updateEntity('room-b', { x: 100 })` - Moved left 250px
  - `updateEntity('room-c', { x: 100 })` - Moved left 50px
- Batch update for performance:
  - All three updates in single transaction
  - Single re-render after all moves
- Visual updates:
  - Room B slides from X=350 to X=100 (animation optional)
  - Room C slides from X=150 to X=100
  - All rooms now have left edges aligned vertically
  - Selection remains on all three rooms
- Canvas re-renders:
  - Rooms at new positions
  - Selection bounding box recalculated
  - Alignment grid guides removed (if shown)

**Validation Method**: Integration test - Verify entity positions updated correctly

---

### Step 4: Update Connected Entities

**User Action**: (Automatic - if rooms have connected ducts)

**Expected Result**:
- Connection system notified of entity position changes
- For each moved room:
  - Find all connected ducts
  - Update duct endpoints to follow room
- Example: Room B has supply duct connected
  - Old duct endpoint: (450, 325) - connected to Room B right edge
  - New duct endpoint: (200, 325) - follows Room B to new position
  - Duct length/angle recalculates
- Duct updates batched:
  - All duct endpoint updates in single operation
  - Single canvas re-render includes ducts
- Visual result:
  - Ducts stretch/move to maintain connections
  - No disconnected ducts
  - System remains valid
- Connection validation:
  - Check for duct stress (excessive stretch)
  - Warn if duct >50% longer than before
  - Suggest adding intermediate fitting

**Validation Method**: Integration test - Verify connected duct updates

---

### Step 5: Create Undo Command

**User Action**: (Automatic)

**Expected Result**:
- Single undo command created for entire alignment:
  - `AlignEntitiesCommand` with:
    - Alignment type: Left
    - Entity IDs: ['room-a', 'room-b', 'room-c']
    - Old positions: Store original positions
    - New positions: Store aligned positions
- Command added to history stack:
  - Undo stack size increases by 1
  - Redo stack cleared (new action branch)
- Undo/redo buttons update:
  - Undo button enabled: "Undo Align Left"
  - Redo button disabled (cleared)
- User can undo alignment:
  - Single Ctrl+Z restores all three rooms to original positions
  - Not three separate undos
  - Efficient history usage
- Status bar: "Aligned 3 entities left"
- Toast notification (optional): "3 rooms aligned" (2 seconds)

**Validation Method**: Integration test - Verify single undo restores all positions

---

## Edge Cases

### 1. Align Center (Horizontal)

**User Action**: Select 3 rooms with different widths, click "Align Center" (horizontal)

**Expected Behavior**:
- Alignment reference: Horizontal center of bounding box
  - Bounding box: X=100 to X=550, center X = 325
- Each room centered horizontally at X=325:
  - Room A (200px wide): Left edge at X=225 (325 - 100)
  - Room B (200px wide): Left edge at X=225
  - Room C (150px wide): Left edge at X=250 (325 - 75)
- Rooms of different widths aligned to common center line:
  - Centers all at X=325
  - Left/right edges differ based on width
- Visual result:
  - Vertical line through all room centers
  - Symmetrical appearance

**Validation Method**: Unit test - Verify center alignment with different sizes

---

### 2. Align with Single Entity Selected

**User Action**: Select only 1 room, try to align

**Expected Behavior**:
- Single entity selected
- Alignment buttons disabled:
  - Grayed out appearance
  - Tooltip: "Select 2 or more entities to align"
- Click on disabled button has no effect
- Status bar: "Alignment requires multiple entities"
- No error or crash
- User must select additional entities to enable alignment

**Validation Method**: E2E test - Verify alignment disabled with <2 entities

---

### 3. Align Mixed Entity Types

**User Action**: Select 2 rooms and 1 duct, align top

**Expected Behavior**:
- Mixed selection accepted:
  - Room A (rectangle)
  - Room B (rectangle)
  - Duct C (line)
- Alignment reference: Top of bounding box
  - Top Y = min(all top edges) = 100
- Alignment applied:
  - Room A top → Y=100
  - Room B top → Y=100
  - Duct C top → Y=100 (duct start/end point adjusted)
- Different entity types align correctly:
  - Rectangles align by top edge
  - Lines align by topmost point
  - Equipment aligns by top edge
- Visual result:
  - All entities with tops aligned horizontally
  - Mixed types look organized

**Validation Method**: Integration test - Verify mixed entity type alignment

---

### 4. Align to First Selected (Option)

**User Action**: Settings → "Align to first selected" enabled, align left

**Expected Behavior**:
- Alignment mode: First selected entity (not bounding box)
- First selected: Room A at X=100
- Alignment reference: Room A left edge (X=100)
- Other entities align to Room A:
  - Room B → X=100
  - Room C → X=100
- Room A doesn't move (it's the reference)
- Useful for precise alignment to specific entity
- Visual indicator:
  - Room A highlighted differently (reference entity)
  - Other rooms align to it
- Toggle setting changes alignment behavior globally

**Validation Method**: Unit test - Verify first-selected alignment mode

---

### 5. Align Overlapping Entities

**User Action**: Align 3 rooms center-center (both horizontal and vertical)

**Expected Behavior**:
- Horizontal center alignment: All centers at X=325
- Vertical center alignment: All centers at Y=325
- Result: All three rooms exactly overlapping
  - Stacked on top of each other
  - Only top room visible (z-index)
- Valid operation (no error):
  - User may want perfect overlap for specific reasons
  - Can undo if accidental
- Warning (optional):
  - "Alignment will cause entities to overlap. Continue?"
  - User confirms or cancels
- Visual feedback:
  - Show all three room outlines (different colors/dashing)
  - User sees overlap before it happens

**Validation Method**: Integration test - Verify overlap alignment allowed with warning

---

## Error Scenarios

### 1. Alignment Calculation Error

**Scenario**: Bounding box calculation fails (corrupted entity data)

**Expected Handling**:
- Alignment triggered
- Bounding box calculation encounters invalid position (NaN)
- Error caught before position updates
- Error message: "Cannot align entities. Invalid entity positions detected."
- No entities moved (safe failure)
- Selection maintained
- User can inspect entities for issues
- Error logged for debugging

**Validation Method**: Unit test - Verify error handling prevents invalid alignment

---

### 2. Undo Alignment Fails

**Scenario**: User undoes alignment but entity positions can't be restored

**Expected Handling**:
- Undo command executed
- Position restore fails for one entity (store error)
- Partial undo attempted:
  - Restore successful entities
  - Skip failed entity
- Warning: "Some entities could not be restored to original positions"
- User sees partial restoration
- Can manually move failed entity
- Error logged with entity ID

**Validation Method**: Integration test - Verify partial undo on failure

---

### 3. Align During Active Drag

**Scenario**: User starts dragging entity, then triggers align command

**Expected Handling**:
- Drag operation in progress
- Align command triggered (keyboard shortcut)
- Drag operation cancelled first:
  - Entity returns to drag start position
  - Drag state cleared
- Then alignment executed:
  - All selected entities align
  - Including entity that was being dragged
- No conflict between operations
- Clean state transition

**Validation Method**: Integration test - Verify align cancels active drag

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Align Left | `Ctrl/Cmd + Shift + L` |
| Align Center (Horizontal) | `Ctrl/Cmd + Shift + C` |
| Align Right | `Ctrl/Cmd + Shift + R` |
| Align Top | `Ctrl/Cmd + Shift + T` |
| Align Middle (Vertical) | `Ctrl/Cmd + Shift + M` |
| Align Bottom | `Ctrl/Cmd + Shift + B` |
| Undo Alignment | `Ctrl/Cmd + Z` |

---

## Related Elements

- [SelectTool](../../elements/04-tools/SelectTool.md) - Selection for alignment
- [AlignCommand](../../elements/09-commands/AlignCommand.md) - Alignment undo/redo
- [AlignmentToolbar](../../elements/01-components/canvas/AlignmentToolbar.md) - Alignment buttons
- [entityStore](../../elements/02-stores/entityStore.md) - Position updates
- [ConnectionSystem](../../elements/08-systems/ConnectionSystem.md) - Duct endpoint updates
- [HistoryStore](../../elements/09-commands/HistoryStore.md) - Command history
- [UJ-SM-003](./UJ-SM-003-MultiSelectShiftClick.md) - Multi-selection (prerequisite)
- [UJ-SM-006](./UJ-SM-006-MoveEntity.md) - Entity movement (related)

---

## Visual Diagram

```
Align Left Operation
┌────────────────────────────────────────────────────────┐
│  Before Alignment:                                     │
│                                                        │
│  ┌─────┐                                               │
│  │  A  │  X=100                                        │
│  └─────┘                                               │
│                    ┌─────┐                             │
│                    │  B  │  X=350                      │
│                    └─────┘                             │
│        ┌─────┐                                         │
│        │  C  │  X=150                                  │
│        └─────┘                                         │
│                                                        │
│  ↓ Align Left (reference: leftmost edge = 100)        │
│                                                        │
│  After Alignment:                                      │
│  ┌─────┐                                               │
│  │  A  │  X=100 (no change)                            │
│  └─────┘                                               │
│  ┌─────┐                                               │
│  │  B  │  X=100 (moved from 350)                       │
│  └─────┘                                               │
│  ┌─────┐                                               │
│  │  C  │  X=100 (moved from 150)                       │
│  └─────┘                                               │
│  │ ← Common left edge                                 │
└────────────────────────────────────────────────────────┘

Align Center (Horizontal):
┌────────────────────────────────────────────────────────┐
│  Before:                                               │
│  ┌─────┐     ┌─────┐     ┌─────┐                      │
│  │  A  │     │  B  │     │  C  │                      │
│  └─────┘     └─────┘     └─────┘                      │
│  X=100       X=300       X=200                         │
│                                                        │
│  Bounding Box: X=100 to X=500, Center=300              │
│                                                        │
│  After Alignment:                                      │
│      ┌─────┐                                           │
│      │  A  │  Center at X=300                          │
│      └─────┘                                           │
│      ┌─────┐                                           │
│      │  B  │  Center at X=300                          │
│      └─────┘                                           │
│      ┌─────┐                                           │
│      │  C  │  Center at X=300                          │
│      └─────┘                                           │
│        │ ← Common center line                          │
└────────────────────────────────────────────────────────┘

Alignment Options Grid:
┌────────────────────────────────────────────────────────┐
│  Horizontal Alignment:                                 │
│  ┌──────────┬──────────┬──────────┐                   │
│  │ Align    │ Align    │ Align    │                   │
│  │ Left     │ Center   │ Right    │                   │
│  │          │          │          │                   │
│  │ │A B C   │   A B C  │   A B C│ │                   │
│  └──────────┴──────────┴──────────┘                   │
│                                                        │
│  Vertical Alignment:                                   │
│  ┌──────────┬──────────┬──────────┐                   │
│  │ Align    │ Align    │ Align    │                   │
│  │ Top      │ Middle   │ Bottom   │                   │
│  │          │          │          │                   │
│  │ ─A─B─C─  │    A     │          │                   │
│  │          │    B     │          │                   │
│  │          │    C     │    A     │                   │
│  │          │          │    B     │                   │
│  │          │          │  ─C─     │                   │
│  └──────────┴──────────┴──────────┘                   │
└────────────────────────────────────────────────────────┘

Alignment Command Structure:
┌────────────────────────────────────────────────────────┐
│  AlignEntitiesCommand {                                │
│    type: "align-left",                                 │
│    entityIds: ["room-a", "room-b", "room-c"],          │
│    oldPositions: [                                     │
│      { id: "room-a", x: 100, y: 100 },                 │
│      { id: "room-b", x: 350, y: 250 },                 │
│      { id: "room-c", x: 150, y: 400 }                  │
│    ],                                                  │
│    newPositions: [                                     │
│      { id: "room-a", x: 100, y: 100 },                 │
│      { id: "room-b", x: 100, y: 250 },                 │
│      { id: "room-c", x: 100, y: 400 }                  │
│    ],                                                  │
│    execute() { /* Apply new positions */ },            │
│    undo() { /* Restore old positions */ }              │
│  }                                                     │
└────────────────────────────────────────────────────────┘

Connected Duct Update:
┌────────────────────────────────────────────────────────┐
│  Before Alignment:                                     │
│  ┌─────┐                    ┌─────┐                   │
│  │  A  │──────duct─────────→│  B  │                   │
│  └─────┘                    └─────┘                   │
│  X=100                      X=350                      │
│  Duct: (100, 150) to (350, 150)                        │
│                                                        │
│  After Align Left:                                     │
│  ┌─────┐                                               │
│  │  A  │                                               │
│  └─────┘                                               │
│  ┌─────┐                                               │
│  │  B  │                                               │
│  └─────┘                                               │
│  X=100 (both)                                          │
│                                                        │
│  Duct Updates:                                         │
│  - Start: (100, 150) - unchanged (Room A didn't move)  │
│  - End: (100, 250) - follows Room B to new position    │
│  - Length: Longer, now vertical instead of horizontal  │
│  - Warning: "Duct stretched significantly"             │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/commands/AlignCommand.test.ts`

**Test Cases**:
- Align left calculation (leftmost edge)
- Align center calculation (horizontal center)
- Align right calculation (rightmost edge)
- Align top calculation (topmost edge)
- Align middle calculation (vertical center)
- Align bottom calculation (bottommost edge)
- Bounding box calculation for multiple entities
- Requires 2+ entities validation

**Assertions**:
- Left align moves entities to leftmost X
- Center align moves entities to center X
- Right align moves entities to rightmost X + width
- Top align moves entities to topmost Y
- Middle align moves entities to center Y
- Bottom align moves entities to bottommost Y + height
- Alignment rejected with <2 entities

---

### Integration Tests
**File**: `src/__tests__/integration/align-entities.test.ts`

**Test Cases**:
- Complete alignment workflow
- Entity positions updated in store
- Connected ducts update endpoints
- Single undo restores all positions
- Mixed entity type alignment
- Alignment with different-sized entities

**Assertions**:
- All entity positions match calculated alignment
- Store contains updated positions
- Duct endpoints follow moved entities
- Single undo command created
- Different entity types align correctly
- Alignment works regardless of entity sizes

---

### E2E Tests
**File**: `e2e/selection/align-entities.spec.ts`

**Test Cases**:
- Visual alignment button clicks
- Entities move to aligned positions
- Alignment toolbar appears with multi-selection
- Alignment disabled with single entity
- Status bar feedback
- Undo restores original positions

**Assertions**:
- Alignment buttons visible when 2+ selected
- Entities visually move to aligned edges
- Toolbar shows 6 alignment options
- Buttons grayed out with <2 entities
- Status shows "Aligned X entities"
- Ctrl+Z moves entities back

---

## Common Pitfalls

### ❌ Don't: Align each entity individually
**Problem**: N separate position updates cause N re-renders, poor performance

**Solution**: Batch all position updates into single transaction

---

### ❌ Don't: Forget to update connected entities
**Problem**: Ducts appear disconnected after alignment

**Solution**: Update all duct endpoints when entities move

---

### ❌ Don't: Create separate undo commands for each entity
**Problem**: User must undo N times to revert alignment

**Solution**: Single grouped undo command for entire alignment operation

---

### ✅ Do: Show alignment guides/preview before applying
**Benefit**: User sees result before committing, can cancel if wrong

---

### ✅ Do: Support both bounding box and first-selected alignment modes
**Benefit**: Flexibility for different use cases

---

## Performance Tips

### Optimization: Batch Position Updates
**Problem**: Updating 50 entity positions individually triggers 50 store updates

**Solution**: Collect all new positions, apply in single batch
- One store transaction
- One re-render
- 50x faster alignment

---

### Optimization: Spatial Hash for Connection Updates
**Problem**: Finding connected ducts for each moved entity is O(n×m)

**Solution**: Use spatial hash to quickly find connections
- O(1) lookup per entity
- Instant connection finding
- Scales to thousands of entities

---

### Optimization: Defer Duct Recalculation
**Problem**: Recalculating duct lengths/angles during alignment slows operation

**Solution**: Mark ducts dirty, recalculate after alignment completes
- Alignment executes instantly
- Duct calculations happen in background
- User sees responsive UI

---

## Future Enhancements

- **Smart Alignment**: Detect alignment intent from drag motion
- **Distribute**: Space entities evenly between first and last
- **Snap to Grid After Align**: Align then snap to grid for precision
- **Alignment Constraints**: Lock alignment for linked entities
- **Multi-Axis Align**: Align both horizontally and vertically in one command
- **Align to Canvas**: Align to canvas edges (not just selection)
- **Alignment History**: Show recent alignments for quick repeat
- **Custom Alignment**: Align to arbitrary line or point
