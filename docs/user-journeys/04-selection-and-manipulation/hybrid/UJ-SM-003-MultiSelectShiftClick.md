# [UJ-SM-003] Multi-Select (Shift+Click)

## Overview

This user journey covers adding or removing entities from the current selection using Shift+Click, enabling incremental multi-selection without marquee dragging.

## PRD References

- **FR-SM-003**: User shall be able to add/remove entities from selection with Shift+Click
- **US-SM-003**: As a designer, I want to build selections incrementally so that I can select non-adjacent entities
- **AC-SM-003-001**: Shift+Click on unselected entity adds to selection
- **AC-SM-003-002**: Shift+Click on selected entity removes from selection (toggle)
- **AC-SM-003-003**: Selection highlight updates for all selected entities
- **AC-SM-003-004**: Inspector shows multi-entity summary
- **AC-SM-003-005**: Works with all entity types (rooms, ducts, equipment, etc.)

## Prerequisites

- User is in Canvas Editor with Select tool active
- At least two entities exist on canvas
- Zero or more entities currently selected
- Shift key available on keyboard

## User Journey Steps

### Step 1: Select First Entity (Base Selection)

**User Action**: Click on Room A (without Shift key)

**Expected Result**:
- Room A selected as base selection
- Selection state:
  - `selectedIds`: ['room-a']
  - Selection count: 1
- Visual feedback:
  - Room A shows selection highlight (blue outline)
  - Selection handles appear (8 resize handles)
  - Other entities not highlighted
- Inspector panel:
  - Shows Room A properties
  - Title: "Room A"
  - Properties: Width, height, position, etc.
- Status bar: "1 entity selected"
- Ready for Shift+Click to add more

**Validation Method**: E2E test - Verify single entity selection

---

### Step 2: Add Second Entity with Shift+Click

**User Action**: Hold Shift key, click on Duct B

**Expected Result**:
- Shift key detected during click
- Multi-select mode activated
- Duct B state checked: Currently unselected
- Add operation performed:
  - Duct B added to selection: `selectedIds.push('duct-b')`
  - Selection count: 2
- Visual feedback:
  - Room A remains highlighted (blue outline)
  - Duct B now highlighted (blue outline)
  - Both entities show selection state
  - Bounding box calculated for both entities
  - Resize handles shown on bounding box (not individual entities)
- Inspector panel updates:
  - Switches to multi-entity view
  - Title: "2 entities selected"
  - Summary: "1 Room, 1 Duct"
  - Common properties shown (if any)
  - Mixed properties shown as "(Multiple values)"
- Status bar: "2 entities selected"
- Shift key can be released (selection persists)

**Validation Method**: Integration test - Verify entity added to selection

---

### Step 3: Add Third Entity with Shift+Click

**User Action**: Hold Shift key, click on Equipment C

**Expected Result**:
- Shift key detected again
- Multi-select mode continues
- Equipment C state checked: Currently unselected
- Add operation performed:
  - Equipment C added: `selectedIds.push('equipment-c')`
  - Selection count: 3
- Visual feedback:
  - All three entities highlighted (Room A, Duct B, Equipment C)
  - Bounding box recalculated for all three
  - Resize handles updated for new bounding box
- Inspector panel updates:
  - Title: "3 entities selected"
  - Summary: "1 Room, 1 Duct, 1 Equipment"
  - Bulk actions available:
    - Delete all
    - Align all
    - Distribute all
    - Group all (future feature)
- Status bar: "3 entities selected"
- Selection maintains chronological order (order clicked)

**Validation Method**: Integration test - Verify multiple additions

---

### Step 4: Remove Entity with Shift+Click (Toggle)

**User Action**: Hold Shift key, click on Duct B (already selected)

**Expected Result**:
- Shift key detected
- Duct B state checked: Currently selected
- Remove operation performed (toggle off):
  - Duct B removed: `selectedIds = selectedIds.filter(id => id !== 'duct-b')`
  - Selection count: 2 (now Room A and Equipment C only)
- Visual feedback:
  - Duct B selection highlight removed
  - Duct B returns to unselected state
  - Room A and Equipment C remain highlighted
  - Bounding box recalculated for remaining two entities
  - Resize handles updated
- Inspector panel updates:
  - Title: "2 entities selected"
  - Summary: "1 Room, 1 Equipment"
  - Properties reflect remaining entities only
- Status bar: "2 entities selected"
- Toggle behavior provides precise selection control

**Validation Method**: Unit test - Verify toggle removes entity from selection

---

### Step 5: Perform Bulk Operation on Selection

**User Action**: With Room A and Equipment C selected, press Delete key

**Expected Result**:
- Delete command triggered for multi-selection
- Confirmation not required for 2 entities (below threshold)
- Delete operation:
  - Both entities removed from store
  - `entityStore.removeEntity('room-a')`
  - `entityStore.removeEntity('equipment-c')`
  - Single undo command created: `DeleteEntitiesCommand(['room-a', 'equipment-c'])`
- Visual feedback:
  - Both entities disappear from canvas
  - Selection cleared automatically
  - Canvas re-renders without entities
- Inspector panel:
  - Returns to empty state
  - Placeholder: "Select an entity to edit properties"
- Status bar: "2 entities deleted"
- Toast notification: "Deleted 2 entities"
- Undo available: Ctrl+Z restores both entities

**Validation Method**: Integration test - Verify bulk delete on multi-selection

---

## Edge Cases

### 1. Shift+Click on Empty Canvas Area

**User Action**: With 2 entities selected, Shift+Click on empty canvas space

**Expected Behavior**:
- Click on empty area (no entity hit)
- Two possible behaviors (configurable):
  - **Option A (Additive)**: Maintain current selection (ignore click)
  - **Option B (Replace)**: Clear selection (treat as new selection start)
- Default: Option A (maintain selection)
- Rationale: Shift key indicates "modify selection", not "replace"
- No entities added or removed
- Selection remains unchanged
- User can click specific entity or use Escape to clear

**Validation Method**: Unit test - Verify empty area Shift+Click behavior

---

### 2. Shift+Click on Overlapping Entities

**User Action**: Shift+Click on position where two entities overlap

**Expected Behavior**:
- Hit testing detects multiple entities at click position
- z-index priority determines which entity clicked:
  - Higher z-index entity selected (topmost)
  - Same logic as regular click
- Only topmost entity added to/removed from selection
- If topmost entity already selected:
  - Toggle removes it from selection
  - Does NOT select entity below
- User must click again (without Shift) to select underlying entity
- Visual feedback: Topmost entity highlights/unhighlights

**Validation Method**: Integration test - Verify z-index priority in multi-select

---

### 3. Shift+Click All Entities on Canvas

**User Action**: Shift+Click each entity until all 50 entities selected

**Expected Behavior**:
- Each Shift+Click adds entity to selection
- Selection count increases: 1, 2, 3, ..., 50
- All entities highlighted with selection outline
- Bounding box encompasses entire canvas content
- Inspector shows: "50 entities selected"
- Performance considerations:
  - Selection operations throttled if >100 entities
  - Bounding box calculation optimized
  - Render handles only on bounding box, not individual entities
- Bulk operations available:
  - Align all, distribute all, delete all
- Warning if attempting operation on >50 entities: "Are you sure?"

**Validation Method**: Performance test - Verify large selection handling

---

### 4. Shift+Click During Active Tool (Not Select Tool)

**User Action**: While using Room tool, Shift+Click on existing entity

**Expected Behavior**:
- Shift+Click ignored (not in Select mode)
- Room tool continues operation
- No selection modification
- Entity not added to selection
- User must switch to Select tool first
- Keyboard shortcut `V` switches to Select tool
- Then Shift+Click works normally

**Validation Method**: Unit test - Verify Shift+Click only works with Select tool

---

### 5. Shift+Click with Locked Entity (Future Feature)

**User Action**: Shift+Click on locked entity

**Expected Behavior**:
- Locked entity detected
- Warning: "Entity is locked and cannot be selected"
- Entity NOT added to selection
- Selection remains unchanged
- Visual indicator: Lock icon on entity
- User must unlock entity first (Inspector → Unlock button)
- After unlock, Shift+Click works normally

**Validation Method**: Integration test - Verify locked entity selection prevention

---

## Error Scenarios

### 1. Shift+Click Rapid Fire (Performance)

**Scenario**: User Shift+Clicks 20 entities in 1 second (very fast)

**Expected Handling**:
- Selection operations queued
- Debouncing applied: Max 10 selections per second
- Clicks faster than 100ms grouped into batch
- Single batch update to selection state
- Single re-render after batch complete
- All 20 entities selected after 2 seconds
- No UI freeze or lag
- No missed clicks

**Validation Method**: Performance test - Verify rapid Shift+Click handling

---

### 2. Selection State Corruption

**Scenario**: Selection state contains invalid entity ID

**Expected Handling**:
- Selection validation on each operation
- Invalid IDs detected: `entityStore.hasEntity(id) === false`
- Auto-cleanup: Remove invalid IDs from selection
- Warning logged: "Selection contained invalid entity IDs, cleaned up"
- User sees no error (silent correction)
- Selection continues to work normally
- Inspector shows only valid entities

**Validation Method**: Unit test - Verify selection state validation

---

### 3. Shift Key Stuck (Hardware Issue)

**Scenario**: Shift key physically stuck, all clicks treated as Shift+Click

**Expected Handling**:
- Application detects abnormal Shift+Click pattern
- After 10 consecutive Shift+Clicks without regular click:
  - Suggestion toast: "Shift key may be stuck. Press Shift to reset."
- User can press Shift again to unstick software state
- Or restart application to reset
- Keyboard event listeners check for stuck modifier keys
- Graceful degradation (doesn't break selection)

**Validation Method**: Unit test - Verify stuck modifier key detection

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Add Entity to Selection | `Shift + Click` |
| Remove Entity from Selection | `Shift + Click` (on selected entity) |
| Select All Entities | `Ctrl/Cmd + A` |
| Deselect All | `Escape` or Click empty area |
| Select Similar Entities | `Ctrl/Cmd + Shift + Click` (future) |

---

## Related Elements

- [SelectTool](../../elements/04-tools/SelectTool.md) - Selection tool implementation
- [selectionStore](../../elements/02-stores/selectionStore.md) - Selection state management
- [SelectionHighlight](../../elements/01-components/canvas/SelectionHighlight.md) - Visual feedback
- [Inspector](../../elements/01-components/panels/Inspector.md) - Multi-entity property display
- [UJ-SM-001](./UJ-SM-001-SelectSingleEntity.md) - Single selection (prerequisite)
- [UJ-SM-002](./UJ-SM-002-MultiSelectMarquee.md) - Marquee selection (alternative)
- [UJ-SM-008](./UJ-SM-008-DeselectEntity.md) - Deselection operations

---

## Visual Diagram

```
Shift+Click Multi-Select Flow
┌────────────────────────────────────────────────────────┐
│  1. Base Selection (Click Room A)                     │
│     Selection: [Room A]                               │
│     ┌─────┐                                           │
│     │  A  │ ← Selected (blue outline)                 │
│     └─────┘                                           │
│      B  C  ← Not selected                             │
│                                                        │
│  2. Shift+Click Duct B (Add to selection)             │
│     Selection: [Room A, Duct B]                       │
│     ┌─────┐                                           │
│     │  A  │ ← Still selected                          │
│     └─────┘                                           │
│      ═══B═══ ← Now selected (blue outline)            │
│        C  ← Still not selected                        │
│                                                        │
│  3. Shift+Click Equipment C (Add to selection)        │
│     Selection: [Room A, Duct B, Equipment C]          │
│     ┌─────┐                                           │
│     │  A  │ ← Still selected                          │
│     └─────┘                                           │
│      ═══B═══ ← Still selected                         │
│      [  C  ] ← Now selected (blue outline)            │
│                                                        │
│  4. Shift+Click Duct B again (Remove from selection)  │
│     Selection: [Room A, Equipment C]                  │
│     ┌─────┐                                           │
│     │  A  │ ← Still selected                          │
│     └─────┘                                           │
│        B  ← Deselected (toggle off)                   │
│      [  C  ] ← Still selected                         │
└────────────────────────────────────────────────────────┘

Selection State Changes:
┌────────────────────────────────────────────────────────┐
│  Action              │ Selection State                 │
│──────────────────────┼─────────────────────────────────│
│  Click Room A        │ ['room-a']                      │
│  Shift+Click Duct B  │ ['room-a', 'duct-b']            │
│  Shift+Click Equip C │ ['room-a', 'duct-b', 'equip-c'] │
│  Shift+Click Duct B  │ ['room-a', 'equip-c']           │
│  Shift+Click Room A  │ ['equip-c']                     │
│  Shift+Click Equip C │ []                              │
└────────────────────────────────────────────────────────┘

Bounding Box Calculation (Multi-Selection):
┌────────────────────────────────────────────────────────┐
│  Individual Entities:                                  │
│    Room A: (100, 100, 200, 150)  ← x, y, width, height│
│    Duct B: (150, 200, 100, 20)                         │
│    Equip C: (250, 120, 50, 80)                         │
│                                                        │
│  Bounding Box Calculation:                             │
│    minX = min(100, 150, 250) = 100                     │
│    minY = min(100, 200, 120) = 100                     │
│    maxX = max(300, 250, 300) = 300                     │
│    maxY = max(250, 220, 200) = 250                     │
│                                                        │
│  Result: (100, 100, 200, 150) ← Bounding box           │
│                                                        │
│  Visual:                                               │
│  ┌──────────────────────────────┐                     │
│  │  ┌─────┐                     │ ← Bounding box      │
│  │  │  A  │     [C]             │                     │
│  │  └─────┘                     │                     │
│  │    ═══B═══                   │                     │
│  └──────────────────────────────┘                     │
│     Resize handles on bounding box                     │
└────────────────────────────────────────────────────────┘

Toggle Behavior Visualization:
┌────────────────────────────────────────────────────────┐
│  Entity State:  Unselected  →  Selected  →  Unselected │
│                    ↓              ↓             ↓      │
│  Shift+Click:    Add to       Remove from    Add to    │
│                 selection     selection     selection  │
│                    ↓              ↓             ↓      │
│  Visual:         Blue          Normal        Blue      │
│                 outline        outline       outline   │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/tools/SelectTool.multiselect.test.ts`

**Test Cases**:
- Shift+Click adds unselected entity
- Shift+Click removes selected entity (toggle)
- Selection state array updates correctly
- Bounding box calculation for multiple entities
- Empty area Shift+Click behavior
- Maximum selection limit handling

**Assertions**:
- `selectedIds` contains correct entity IDs
- Entity added when previously unselected
- Entity removed when previously selected
- Bounding box encompasses all selected entities
- Selection array maintains no duplicates

---

### Integration Tests
**File**: `src/__tests__/integration/multi-select.test.ts`

**Test Cases**:
- Complete Shift+Click workflow (add 3, remove 1)
- Multi-selection persistence across tool switches
- Inspector multi-entity summary display
- Bulk operations on multi-selection
- Selection state synchronization with store
- z-index priority in overlapping entities

**Assertions**:
- All selected entities highlighted
- Inspector shows correct entity count
- Bulk delete removes all selected entities
- Selection cleared after bulk operation
- History stack contains bulk command

---

### E2E Tests
**File**: `e2e/selection/shift-click-multiselect.spec.ts`

**Test Cases**:
- Visual Shift+Click entity addition
- Visual Shift+Click entity removal
- Selection highlights on multiple entities
- Bounding box rendering
- Inspector panel updates
- Status bar entity count
- Bulk operation (delete all selected)

**Assertions**:
- Blue outline appears on Shift+Clicked entity
- Outline disappears on Shift+Click toggle
- All selected entities show blue outline
- Bounding box contains all entities
- Inspector shows "X entities selected"
- Status bar shows correct count

---

## Common Pitfalls

### ❌ Don't: Clear selection on Shift+Click empty area
**Problem**: User loses selection unintentionally

**Solution**: Maintain selection when Shift+Clicking empty space (additive mode)

---

### ❌ Don't: Allow duplicate entity IDs in selection array
**Problem**: Same entity selected twice, causes rendering issues

**Solution**: Check if entity already in selection before adding

---

### ❌ Don't: Forget to recalculate bounding box after each change
**Problem**: Resize handles positioned incorrectly

**Solution**: Recalculate bounding box on every selection modification

---

### ✅ Do: Provide clear visual feedback for toggle action
**Benefit**: User knows whether entity was added or removed

---

### ✅ Do: Show selection count in status bar
**Benefit**: User always knows how many entities selected

---

## Performance Tips

### Optimization: Batch Selection Updates
**Problem**: Each Shift+Click triggers full re-render of all entities

**Solution**: Batch rapid Shift+Clicks (within 100ms) into single update
- Queue selection changes
- Apply all at once
- Single re-render
- 10x faster for rapid clicks

---

### Optimization: Incremental Bounding Box Calculation
**Problem**: Recalculating bounding box for 50 entities is expensive

**Solution**: Update bounding box incrementally
- When adding entity: Expand existing box to include new entity
- When removing entity: Only recalculate if entity was on boundary
- 90% of operations skip full recalculation
- Maintains O(1) complexity for additions

---

### Optimization: Limit Selection Highlights
**Problem**: Rendering 100 selection outlines slows down canvas

**Solution**: Render only bounding box outline when >20 entities selected
- Individual highlights for ≤20 entities
- Single bounding box for >20 entities
- Maintains 60fps performance
- User still sees what's selected

---

## Future Enhancements

- **Select Similar**: Ctrl+Shift+Click to select all entities of same type
- **Selection Groups**: Save and recall named selection sets
- **Selection Filters**: "Select all rooms", "Select all ducts", etc.
- **Invert Selection**: Select all unselected entities, deselect all selected
- **Grow/Shrink Selection**: Add/remove adjacent entities
- **Selection Lasso**: Freeform selection shape (alternative to marquee)
- **Selection History**: Undo/redo selection changes independently
- **Smart Selection**: Alt+Click to select entire connected system
