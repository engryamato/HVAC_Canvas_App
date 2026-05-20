# [UJ-SM-009] Distribute Entities

## Overview

This user journey covers distributing selected entities with equal spacing horizontally or vertically, enabling designers to create organized, evenly-spaced layouts automatically.

## PRD References

- **FR-SM-009**: User shall be able to distribute entities evenly
- **US-SM-009**: As a designer, I want to distribute entities evenly so that I can create organized layouts
- **AC-SM-009-001**: Distribute horizontally (equal X spacing)
- **AC-SM-009-002**: Distribute vertically (equal Y spacing)
- **AC-SM-009-003**: Requires minimum 3 entities selected
- **AC-SM-009-004**: Preserves first and last entity positions
- **AC-SM-009-005**: Calculates spacing based on bounding boxes
- **AC-SM-009-006**: Distribution is undoable

## Prerequisites

- User is in Canvas Editor with Select tool active
- At least 3 entities selected (minimum for distribution)
- Entities have different positions (not overlapping)
- Sufficient canvas space for distribution

## User Journey Steps

### Step 1: Select Multiple Entities

**User Action**: Select 5 rooms using marquee selection

**Expected Result**:
- Multi-selection created:
  - 5 rooms selected
  - Selection state: `selectedIds: ['room-a', 'room-b', 'room-c', 'room-d', 'room-e']`
  - Selection count: 5
- Room positions (unsorted):
  - Room A: (100, 100) - 200×150
  - Room B: (200, 100) - 200×150
  - Room C: (450, 100) - 200×150
  - Room D: (550, 100) - 200×150
  - Room E: (900, 100) - 200×150
- Visual feedback:
  - All 5 rooms outlined in blue
  - Multi-selection bounding box:
    - Top-left: (100, 100)
    - Bottom-right: (1100, 250)
    - Width: 1000, Height: 150
  - Resize handles on bounding box
- Toolbar updates:
  - Distribute buttons enabled:
    - [Distribute Horizontal] ⬌
    - [Distribute Vertical] ⬍
  - Align buttons also available
- Status bar:
  - "5 entities selected"

**Validation Method**: E2E test - Verify multi-select and toolbar state

---

### Step 2: Trigger Distribute Horizontally

**User Action**: Click "Distribute Horizontal" button in toolbar

**Expected Result**:
- Distribute command triggered:
  - Direction: Horizontal (X-axis)
  - Selected entities: 5 rooms
- Sort entities by X position:
  - Leftmost: Room A (100)
  - Room B (200)
  - Room C (450)
  - Room D (550)
  - Rightmost: Room E (900)
- Calculate distribution:
  - **First entity**: Room A at (100, 100) - FIXED
  - **Last entity**: Room E at (900, 100) - FIXED
  - **Total span**: 900 - 100 = 800 px
  - **Number of gaps**: 5 - 1 = 4 gaps
  - **Entity widths** (to account for):
    - Room A: 200 px
    - Room B: 200 px
    - Room C: 200 px
    - Room D: 200 px
    - Room E: 200 px
    - Total entity width: 1000 px
  - **Available space**: Span - first width - last width = 800 - 200 - 200 = 400 px
  - **Gap size**: 400 / 3 = 133.33 px (between inner entities)
- New positions calculated:
  - Room A: (100, 100) - unchanged (leftmost)
  - Room B: 100 + 200 + 133.33 = (433.33, 100)
  - Room C: 433.33 + 200 + 133.33 = (766.66, 100)
  - Room D: 766.66 + 200 + 133.33 = (1100, 100) - wait, this exceeds...

  **Recalculation** (center-to-center method):
  - **First center**: Room A center = 100 + 100 = 200
  - **Last center**: Room E center = 900 + 100 = 1000
  - **Center span**: 1000 - 200 = 800 px
  - **Gaps**: 4
  - **Gap size**: 800 / 4 = 200 px
  - **New centers**:
    - Room A: 200 (unchanged)
    - Room B: 200 + 200 = 400
    - Room C: 400 + 200 = 600
    - Room D: 600 + 200 = 800
    - Room E: 1000 (unchanged)
  - **New positions** (center - width/2):
    - Room A: 200 - 100 = (100, 100) ✓
    - Room B: 400 - 100 = (300, 100)
    - Room C: 600 - 100 = (500, 100)
    - Room D: 800 - 100 = (700, 100)
    - Room E: 1000 - 100 = (900, 100) ✓

**Validation Method**: Unit test - Verify distribution calculation

---

### Step 3: Apply Distribution

**User Action**: (Automatic after calculation)

**Expected Result**:
- Entity positions updated:
  - `entityStore.updateEntity('room-a', { position: {x: 100, y: 100} })` - unchanged
  - `entityStore.updateEntity('room-b', { position: {x: 300, y: 100} })` - moved from 200
  - `entityStore.updateEntity('room-c', { position: {x: 500, y: 100} })` - moved from 450
  - `entityStore.updateEntity('room-d', { position: {x: 700, y: 100} })` - moved from 550
  - `entityStore.updateEntity('room-e', { position: {x: 900, y: 100} })` - unchanged
- Visual update:
  - Rooms reposition on canvas
  - Smooth animation (optional):
    - 200ms transition
    - Rooms slide to new positions
    - Professional effect
  - Final result:
    - Evenly spaced rooms
    - Equal gaps: 200 px center-to-center
    - Aligned horizontally
- Connected ducts update:
  - If rooms have connected ducts
  - Duct endpoints recalculate
  - Follow entities to new positions
- Command created:
  - `DistributeCommand` with:
    - Direction: 'horizontal'
    - Entity IDs: ['room-a', 'room-b', 'room-c', 'room-d', 'room-e']
    - Old positions: [(100,100), (200,100), (450,100), (550,100), (900,100)]
    - New positions: [(100,100), (300,100), (500,100), (700,100), (900,100)]
  - Added to history stack
- Status bar:
  - "5 entities distributed horizontally"

**Validation Method**: Integration test - Verify distribution application

---

### Step 4: Distribute Vertically (Alternative)

**User Action**: Select same 5 rooms (now arranged horizontally), arrange vertically first, then distribute

**Expected Result**:
- Scenario: Rooms now at:
  - Room A: (100, 100)
  - Room B: (100, 200)
  - Room C: (100, 500)
  - Room D: (100, 600)
  - Room E: (100, 1000)
- User clicks "Distribute Vertical"
- Sort entities by Y position:
  - Topmost: Room A (100)
  - Room B (200)
  - Room C (500)
  - Room D (600)
  - Bottommost: Room E (1000)
- Calculate distribution (center-to-center):
  - **First center**: Room A center = 100 + 75 = 175
  - **Last center**: Room E center = 1000 + 75 = 1075
  - **Center span**: 1075 - 175 = 900 px
  - **Gaps**: 4
  - **Gap size**: 900 / 4 = 225 px
  - **New centers**:
    - Room A: 175
    - Room B: 175 + 225 = 400
    - Room C: 400 + 225 = 625
    - Room D: 625 + 225 = 850
    - Room E: 1075
  - **New positions** (center - height/2):
    - Room A: (100, 100) ✓
    - Room B: (100, 325)
    - Room C: (100, 550)
    - Room D: (100, 775)
    - Room E: (100, 1000) ✓
- Visual result:
  - Evenly spaced vertically
  - Equal gaps: 225 px center-to-center
  - Aligned vertically (same X)

**Validation Method**: Integration test - Verify vertical distribution

---

### Step 5: Undo Distribution

**User Action**: Press Ctrl+Z to undo distribution

**Expected Result**:
- Undo command executed:
  - `DistributeCommand.undo()` called
  - Restore original positions
- Entities repositioned:
  - Room A: (100, 100) - unchanged
  - Room B: (100, 325) → (100, 200) - restored
  - Room C: (100, 550) → (100, 500) - restored
  - Room D: (100, 775) → (100, 600) - restored
  - Room E: (100, 1000) - unchanged
- Visual update:
  - Rooms return to original positions
  - Optional animation
  - Previous spacing restored
- Connected ducts:
  - Endpoints follow entities back
  - Connections preserved
- Status bar:
  - "Undo: Distribute Vertical"
- Redo available:
  - Ctrl+Y redoes distribution
  - Full undo/redo support

**Validation Method**: Integration test - Verify undo/redo distribution

---

## Edge Cases

### 1. Distribute with Different Sized Entities

**User Action**: Distribute 3 rooms of different sizes

**Expected Behavior**:
- Room sizes:
  - Room A: 200×150 (small)
  - Room B: 300×150 (medium)
  - Room C: 400×150 (large)
- Positions before:
  - Room A: (100, 100)
  - Room B: (400, 100)
  - Room C: (900, 100)
- Distribution method:
  - **Center-to-center** (default):
    - First center: 100 + 100 = 200
    - Last center: 900 + 200 = 1100
    - Span: 900
    - Gaps: 2
    - Gap: 450 px
    - Centers: 200, 650, 1100
    - Positions:
      - Room A: 200 - 100 = (100, 100) ✓
      - Room B: 650 - 150 = (500, 100)
      - Room C: 1100 - 200 = (900, 100) ✓
  - **Edge-to-edge** (alternative):
    - Distribute gaps between edges
    - Account for different widths
    - More complex calculation
- Result:
  - Even spacing between centers
  - Visual: Larger entities have more "presence"
  - May not look "evenly spaced" visually
- User preference:
  - Default: Center-to-center
  - Option: Edge-to-edge spacing
  - Configurable in settings

**Validation Method**: Unit test - Verify different size handling

---

### 2. Distribute with Only 2 Entities Selected

**User Action**: Select 2 rooms, click Distribute Horizontal

**Expected Behavior**:
- Selection check:
  - Entity count: 2
  - Minimum required: 3
  - Insufficient for distribution
- No action taken:
  - Entities unchanged
  - No distribution applied
- User feedback:
  - Toolbar button: Disabled (grayed out)
  - Or: Error tooltip on hover
    - "Distribute requires 3+ entities"
  - If clicked anyway:
    - Status bar: "Distribute requires at least 3 entities"
    - Or: Dialog: "Please select 3 or more entities"
- Rationale:
  - 2 entities: No middle entities to distribute
  - First and last fixed, nothing to move
  - Minimum 3 for meaningful distribution

**Validation Method**: Unit test - Verify minimum entity check

---

### 3. Distribute Overlapping Entities

**User Action**: Distribute 4 entities that are overlapping or very close

**Expected Behavior**:
- Initial positions:
  - Room A: (100, 100)
  - Room B: (120, 100) - 20px from A
  - Room C: (140, 100) - 20px from B
  - Room D: (160, 100) - 20px from C
  - All very close, almost overlapping
- Distribution calculation:
  - First: Room A at 100
  - Last: Room D at 160
  - Span: 60 px (very small)
  - Gaps: 3
  - Gap: 20 px
  - Result: Same as before (already evenly spaced)
- Alternative scenario (expand):
  - User wants to spread out
  - Distribute to full selection bounds
  - Or: Set minimum gap (e.g., 100 px)
- Warning:
  - "Entities are very close. Distribution may have minimal effect."
  - User can proceed or cancel
- Best practice:
  - Manually position first and last entities far apart
  - Then distribute middle entities

**Validation Method**: Integration test - Verify close entity handling

---

### 4. Distribute Mixed Entity Types

**User Action**: Distribute rooms, equipment, and notes together

**Expected Behavior**:
- Selection:
  - 2 rooms
  - 2 equipment units
  - 1 note
  - Total: 5 entities (different types)
- Distribution:
  - Treat all as generic entities
  - Use bounding box for each
  - Calculate centers
  - Distribute evenly
- Result:
  - All entity types distributed
  - Equal spacing (center-to-center)
  - Type doesn't matter
- Visual consistency:
  - Mixed sizes: Rooms large, notes small
  - Center-to-center ensures even spacing
  - Professional layout
- Use case:
  - Distribute equipment along wall
  - Mix with notes for labeling
  - Organized presentation

**Validation Method**: Integration test - Verify mixed type distribution

---

### 5. Distribute with Grid Snapping Enabled

**User Action**: Distribute entities with grid snap active

**Expected Behavior**:
- Grid snap settings:
  - Grid size: 12" (1 foot)
  - Snap enabled: ✓
- Distribution calculation:
  - Calculate ideal positions (floating point)
  - Example: Room B center at 456.789 px
- Snap application:
  - After distribution, snap to grid
  - Round to nearest grid increment
  - Room B: 456.789 → 456 (12" boundary)
- Result:
  - Distributed, then snapped
  - May not be perfectly equal spacing
  - But aligned to grid (cleaner)
- User preference:
  - **Option A**: Distribute, then snap
    - Cleaner grid alignment
    - Slightly uneven spacing
  - **Option B**: Distribute without snap
    - Perfect even spacing
    - May not align to grid
- Default: Option A (snap after distribute)

**Validation Method**: Integration test - Verify grid snap interaction

---

## Error Scenarios

### 1. Distribute with Locked Entities

**Scenario**: Selected entities include locked room

**Expected Handling**:
- Selection:
  - Room A: Unlocked
  - Room B: Locked 🔒
  - Room C: Unlocked
  - Room D: Unlocked
- Distribution attempt:
  - Check all entities for lock status
  - Room B is locked
- Lock handling:
  - **Option A (Skip)**: Distribute unlocked only
    - Treat locked as fixed points
    - Distribute others around it
  - **Option B (Prevent)**: Block entire operation
    - Error: "Cannot distribute locked entities"
    - User must unlock all first
- Default: Option B (prevent distribution)
- Error dialog:
  - "Cannot distribute: Room B is locked"
  - [Unlock and Distribute] [Cancel]
  - User can unlock automatically
- User action:
  - Unlock entities
  - Retry distribution

**Validation Method**: Unit test - Verify locked entity check

---

### 2. Distribute with Insufficient Space

**Scenario**: Try to distribute into negative spacing (first and last too close)

**Expected Handling**:
- Scenario:
  - First entity (Room A) at (100, 100)
  - Last entity (Room E) at (200, 100)
  - Span: 100 px
  - Entity width: 200 px each
  - 3 middle entities need to fit in 100 px span
- Calculation:
  - Center span: 200 - 100 = 100 px
  - Gaps: 4
  - Gap: 100 / 4 = 25 px
  - Room centers: 100, 125, 150, 175, 200
  - But room width is 200 px!
  - Entities would overlap heavily
- Warning:
  - "Insufficient space for distribution"
  - "Entities will overlap. Increase distance between first and last."
  - [Proceed Anyway] [Cancel]
- User options:
  - Cancel and reposition
  - Proceed with overlap (may be desired)
- Alternative: Auto-expand
  - Automatically move last entity
  - Create sufficient space
  - Ask user for confirmation

**Validation Method**: Unit test - Verify space validation

---

### 3. Distribute During Background Operation

**Scenario**: Distribute while autosave is running

**Expected Handling**:
- Distribution triggered:
  - Calculate new positions
  - Update entity positions
- Autosave running:
  - Background file write
  - Project snapshot in progress
- Concurrency handling:
  - Distribution updates entity store
  - Autosave reads entity store
  - Both access same data
- State consistency:
  - **Option A (Queue)**: Queue distribution until autosave completes
    - Wait for autosave
    - Then apply distribution
    - 1-2 second delay
  - **Option B (Concurrent)**: Allow both
    - Distribution updates store immediately
    - Autosave includes new positions (or not, depending on timing)
    - No blocking
- Default: Option B (concurrent, non-blocking)
- Data integrity:
  - Store mutations atomic
  - No corruption
  - Next autosave captures distributed state
- User experience:
  - No noticeable delay
  - Distribution instant
  - Autosave transparent

**Validation Method**: Integration test - Verify concurrent operations

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Distribute Horizontally | `Ctrl/Cmd + Shift + H` |
| Distribute Vertically | `Ctrl/Cmd + Shift + V` |
| Distribute Both (Grid) | `Ctrl/Cmd + Shift + G` |
| Undo Distribution | `Ctrl/Cmd + Z` |

---

## Related Elements

- [DistributeCommand](../../elements/09-commands/DistributeCommand.md) - Distribution undo/redo
- [SelectionService](../../elements/11-services/SelectionService.md) - Multi-selection
- [entityStore](../../elements/02-stores/entityStore.md) - Entity positions
- [TransformService](../../elements/11-services/TransformService.md) - Position calculation
- [UJ-SM-005](./UJ-SM-005-AlignEntities.md) - Entity alignment
- [UJ-SM-001](./UJ-SM-001-SelectSingleEntity.md) - Entity selection

---

## Visual Diagram

```
Distribute Horizontal Flow
┌────────────────────────────────────────────────────────┐
│  Before Distribution (Uneven spacing):                 │
│                                                        │
│  ┌───┐  ┌───┐         ┌───┐ ┌───┐            ┌───┐   │
│  │ A │  │ B │         │ C │ │ D │            │ E │   │
│  └───┘  └───┘         └───┘ └───┘            └───┘   │
│  100    200           450   550              900      │
│                                                        │
│  Gaps: 100px, 250px, 100px, 350px (uneven)            │
│                                                        │
│  ↓ Distribute Horizontal                               │
│                                                        │
│  After Distribution (Even spacing):                    │
│                                                        │
│  ┌───┐     ┌───┐     ┌───┐     ┌───┐     ┌───┐       │
│  │ A │     │ B │     │ C │     │ D │     │ E │       │
│  └───┘     └───┘     └───┘     └───┘     └───┘       │
│  100       300       500       700       900          │
│                                                        │
│  Gaps: 200px, 200px, 200px, 200px (even)              │
│  Center-to-center: 200px uniform spacing               │
└────────────────────────────────────────────────────────┘

Distribute Vertical Flow
┌────────────────────────────────────────────────────────┐
│  Before Distribution (Uneven):        After:           │
│                                                        │
│  ┌───┐                               ┌───┐            │
│  │ A │ 100                           │ A │ 100        │
│  └───┘                               └───┘            │
│                                                        │
│  ┌───┐                               ┌───┐            │
│  │ B │ 200                           │ B │ 325        │
│  └───┘                               └───┘            │
│        ← 300px gap                                     │
│  ┌───┐                               ┌───┐            │
│  │ C │ 500                           │ C │ 550        │
│  └───┘                               └───┘            │
│   ← 100px gap                                          │
│  ┌───┐                               ┌───┐            │
│  │ D │ 600                           │ D │ 775        │
│  └───┘                               └───┘            │
│        ← 400px gap                                     │
│  ┌───┐                               ┌───┐            │
│  │ E │ 1000                          │ E │ 1000       │
│  └───┘                               └───┘            │
│                                                        │
│  Uneven gaps: 100, 300, 100, 400     Even: 225 each   │
└────────────────────────────────────────────────────────┘

Center-to-Center Distribution Algorithm
┌────────────────────────────────────────────────────────┐
│  Step 1: Sort entities by position                     │
│  [A(100)] [B(200)] [C(450)] [D(550)] [E(900)]          │
│                                                        │
│  Step 2: Calculate centers                             │
│  A: 100 + 100 = 200 (center)                           │
│  E: 900 + 100 = 1000 (center)                          │
│                                                        │
│  Step 3: Calculate span and gap                        │
│  Span: 1000 - 200 = 800 px                             │
│  Gaps: 5 - 1 = 4                                       │
│  Gap size: 800 / 4 = 200 px                            │
│                                                        │
│  Step 4: Calculate new centers                         │
│  A: 200 (fixed)                                        │
│  B: 200 + 200 = 400                                    │
│  C: 400 + 200 = 600                                    │
│  D: 600 + 200 = 800                                    │
│  E: 1000 (fixed)                                       │
│                                                        │
│  Step 5: Convert to positions (center - width/2)       │
│  A: 200 - 100 = 100                                    │
│  B: 400 - 100 = 300                                    │
│  C: 600 - 100 = 500                                    │
│  D: 800 - 100 = 700                                    │
│  E: 1000 - 100 = 900                                   │
└────────────────────────────────────────────────────────┘

Different Sized Entities Distribution
┌────────────────────────────────────────────────────────┐
│  Entities:                                             │
│  A: 200px wide                                         │
│  B: 300px wide                                         │
│  C: 400px wide                                         │
│                                                        │
│  Before:                                               │
│  ┌────┐      ┌──────┐              ┌────────┐         │
│  │ A  │      │  B   │              │   C    │         │
│  └────┘      └──────┘              └────────┘         │
│  100         400                   900                │
│                                                        │
│  After (Center-to-Center):                             │
│  ┌────┐              ┌──────┐              ┌────────┐ │
│  │ A  │              │  B   │              │   C    │ │
│  └────┘              └──────┘              └────────┘ │
│  100                 500                   900        │
│                                                        │
│  Centers: 200, 650, 1100 (450px apart)                 │
│  Even center spacing, different entity sizes           │
└────────────────────────────────────────────────────────┘

Toolbar Controls
┌────────────────────────────────────────────────────────┐
│  Arrange Toolbar (5+ entities selected):               │
│  ┌──────────────────────────────────────┐              │
│  │ Align:  [⬅] [⬆] [➡] [⬇] [⊞] [⊟]    │              │
│  │ Distribute: [⬌] [⬍]                 │              │
│  └──────────────────────────────────────┘              │
│                 ▲    ▲                                 │
│                 │    │                                 │
│         Horizontal  Vertical                           │
│                                                        │
│  [⬌] = Distribute Horizontally                         │
│  [⬍] = Distribute Vertically                           │
│                                                        │
│  Disabled (grayed) when:                               │
│  - Less than 3 entities selected                       │
│  - Selected entities include locked entities           │
└────────────────────────────────────────────────────────┘

Grid Snap Interaction
┌────────────────────────────────────────────────────────┐
│  Distribution Calculated:                              │
│  Room B: 456.789 px                                    │
│  Room C: 623.456 px                                    │
│                                                        │
│  Grid Snap Enabled (12" = 12px):                       │
│  ↓                                                     │
│  After Snap:                                           │
│  Room B: 456 px (rounded to 12px boundary)             │
│  Room C: 624 px (rounded to 12px boundary)             │
│                                                        │
│  Result: Near-even spacing + grid alignment            │
└────────────────────────────────────────────────────────┘

Minimum Entity Warning
┌────────────────────────────────────────────────────────┐
│  Selection: 2 entities                                 │
│  ┌───┐                    ┌───┐                        │
│  │ A │                    │ B │                        │
│  └───┘                    └───┘                        │
│                                                        │
│  Distribute Button: [⬌] ← Grayed out/disabled          │
│                                                        │
│  Tooltip: "Distribute requires 3+ entities"            │
│                                                        │
│  If clicked:                                           │
│  Status bar: "Please select at least 3 entities"       │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/commands/DistributeCommand.test.ts`

**Test Cases**:
- Calculate horizontal distribution
- Calculate vertical distribution
- Sort entities by position
- Center-to-center spacing
- Minimum 3 entities check
- Undo/redo distribution

**Assertions**:
- New positions calculated correctly
- First and last entities unchanged
- Middle entities evenly spaced
- Entities sorted before distribution
- Error when < 3 entities
- Undo restores original positions

---

### Integration Tests
**File**: `src/__tests__/integration/distribute-entities.test.ts`

**Test Cases**:
- Complete distribute horizontal workflow
- Complete distribute vertical workflow
- Distribute different sized entities
- Distribute with grid snap
- Locked entity prevention
- Connected ducts update

**Assertions**:
- Entities repositioned evenly
- Vertical distribution works
- Different sizes use center-to-center
- Grid snap applied after distribution
- Error when locked entity selected
- Duct endpoints follow entities

---

### E2E Tests
**File**: `e2e/selection-manipulation/distribute-entities.spec.ts`

**Test Cases**:
- Select 5 entities visually
- Click distribute horizontal button
- Entities move to even positions
- Undo returns to original
- Distribute vertical button
- Minimum 3 entity enforcement

**Assertions**:
- Toolbar button enabled with 5 selected
- Visual spacing becomes uniform
- Animation smooth (if enabled)
- Ctrl+Z undoes distribution
- Button works for vertical
- Button disabled with 2 entities

---

## Common Pitfalls

### ❌ Don't: Distribute without sorting entities first
**Problem**: Random entity order leads to incorrect distribution

**Solution**: Always sort by X (horizontal) or Y (vertical) before calculating

---

### ❌ Don't: Use edge-to-edge for different sized entities
**Problem**: Visually uneven, larger entities dominate

**Solution**: Use center-to-center for consistent spacing

---

### ❌ Don't: Allow distribution with < 3 entities
**Problem**: Nothing to distribute between first and last

**Solution**: Disable/prevent distribution, require minimum 3 entities

---

### ✅ Do: Keep first and last entities fixed
**Benefit**: User control over distribution bounds, predictable results

---

### ✅ Do: Support undo/redo for distribution
**Benefit**: User can experiment, easily revert if unsatisfied

---

## Performance Tips

### Optimization: Batch Entity Position Updates
**Problem**: Updating 100 entities individually triggers 100 re-renders

**Solution**: Batch all position updates into single transaction
- Collect all new positions
- Apply all at once
- Single re-render
- 100x faster for large distributions

---

### Optimization: Skip Distribution Calculation for 2 Entities
**Problem**: Calculating distribution when impossible wastes CPU

**Solution**: Early return if entity count < 3
- Check count immediately
- Return error without calculation
- No wasted computation

---

### Optimization: Use Animation Sparingly
**Problem**: Animating 100 entity moves causes lag

**Solution**: Disable animation for large selections (>20 entities)
- Instant repositioning for bulk
- Smooth animation for small selections
- Better performance + UX

---

## Future Enhancements

- **Distribute by Edge**: Even spacing between edges (not centers)
- **Smart Distribution**: Avoid overlaps, minimum gap enforcement
- **Distribution Preview**: Show ghost positions before applying
- **Distribute in Grid**: 2D grid distribution (rows and columns)
- **Custom Spacing**: User specifies exact gap size
- **Distribute to Bounds**: Distribute within specific area
- **Distribute by Type**: Group by entity type, distribute each group
- **Circular Distribution**: Distribute entities in circle/arc
- **Path Distribution**: Distribute along custom path (spline, bezier)
- **Distribute with Constraints**: Maintain specific relationships (e.g., door spacing)
