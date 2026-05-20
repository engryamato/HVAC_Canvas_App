# [UJ-SM-002] Multi-Select (Marquee)

## Overview

This user journey covers selecting multiple entities simultaneously using the marquee selection tool (click-drag rectangle), enabling bulk operations on groups of entities for efficient editing and manipulation.

## PRD References

- **FR-SM-002**: User shall be able to select multiple entities using marquee selection
- **US-SM-002**: As a designer, I want to select multiple entities at once so that I can move or edit them together
- **AC-SM-002-001**: Click-drag on empty space creates selection rectangle
- **AC-SM-002-002**: All entities within rectangle are selected
- **AC-SM-002-003**: Partially overlapping entities can be included (configurable)
- **AC-SM-002-004**: Selection count shown in status bar
- **AC-SM-002-005**: Inspector shows multi-entity summary

## Prerequisites

- User is in Canvas Editor with Select tool active
- Multiple entities exist on canvas (at least 2)
- Entities are visible in current viewport

## User Journey Steps

### Step 1: Begin Marquee Selection

**User Action**: Click on empty canvas area and hold mouse button

**Expected Result**:
- Click detected on empty space (no entity hit)
- Marquee mode activated
- Starting point recorded (anchor point)
- No immediate visual feedback yet
- Mouse cursor remains default arrow
- Status bar: "Drag to select multiple entities"

**Validation Method**: E2E test - Verify marquee starts on empty space click

---

### Step 2: Drag to Create Selection Rectangle

**User Action**: Drag mouse from starting point (100, 100) to endpoint (400, 300)

**Expected Result**:
- Visual selection rectangle appears:
  - **Border**: Dashed blue line (2px)
  - **Fill**: Semi-transparent blue (rgba(59, 130, 246, 0.1))
  - **Dimensions**: Dynamically updates with mouse position
  - **Rectangle**: Drawn from anchor to current mouse position
- Rectangle bounds calculated:
  - Top-left: (100, 100)
  - Width: 300px
  - Height: 200px
- Entities within rectangle highlighted in real-time (preview)
- Entity count updates: "3 entities in selection"
- Rectangle updates smoothly at 60fps

**Validation Method**: Integration test - Verify rectangle dimensions and preview highlighting

---

### Step 3: Release to Complete Selection

**User Action**: Release mouse button at endpoint

**Expected Result**:
- Marquee rectangle finalized
- Hit detection performed on all entities
- Selection criteria applied:
  - **Full containment mode** (default): Entity fully inside rectangle
  - **Partial overlap mode** (Alt held): Any part of entity touches rectangle
- Entities meeting criteria selected:
  - Example: 2 rooms + 1 duct + 3 notes = 6 entities
  - `selectionStore.selectedIds = ['room-1', 'room-2', 'duct-1', 'note-1', 'note-2', 'note-3']`
- Marquee rectangle disappears
- Selected entities show highlights:
  - Blue outlines on all selected entities
  - Selection handles on bounding box of entire group
- Status bar: "6 entities selected"
- Success feedback (subtle)

**Validation Method**: E2E test - Verify correct entities selected based on rectangle bounds

---

### Step 4: View Multi-Selection Summary

**User Action**: (Automatic after selection completes)

**Expected Result**:
- Inspector panel updates to multi-selection mode:
  - **Header**: "Multiple Entities Selected (6)"
  - **Section 1: Selection Summary**
    - Entity breakdown: "2 Rooms, 1 Duct, 3 Notes"
    - Total area (rooms only): 450 sq ft
    - Total CFM (rooms + ducts): 850 CFM
  - **Section 2: Common Properties** (editable)
    - Only properties shared by all selected entities shown
    - Example: All have 'name' property → Bulk rename option
    - Mixed values shown as "(Multiple values)"
  - **Section 3: Bulk Actions**
    - "Delete All" button
    - "Group" button
    - "Align" dropdown (Left, Right, Top, Bottom, Center)
    - "Distribute" dropdown (Horizontal, Vertical)
  - **Section 4: Individual Entities** (expandable list)
    - Each entity listed with icon + name
    - Click to select individual entity from group
- Status bar shows selection actions available

**Validation Method**: E2E test - Verify inspector displays correct summary and options

---

### Step 5: Perform Bulk Operation

**User Action**: Click "Align Left" in inspector panel

**Expected Result**:
- All selected entities aligned to leftmost entity's X position
- Alignment operation:
  - Find minimum X coordinate among selected: x = 100
  - Move all entities so their left edge aligns at x = 100
  - Vertical positions (Y) unchanged
  - Relative spacing between entities changes
- Command created for undo: `AlignEntitiesCommand`
- Visual update immediate (all entities shift)
- Selection maintained after operation
- Toast confirmation: "6 entities aligned left"
- Undo available (Ctrl+Z)

**Validation Method**: Integration test - Verify all entities have same X coordinate after alignment

---

## Edge Cases

### 1. Marquee Drag in Reverse Direction

**User Action**: Drag from bottom-right (400, 300) to top-left (100, 100)

**Expected Behavior**:
- Rectangle normalized automatically
- Top-left calculated as min(x1, x2), min(y1, y2)
- Bottom-right calculated as max(x1, x2), max(y1, y2)
- Rectangle drawn correctly regardless of drag direction
- Same selection logic applies
- No difference in user experience

**Validation Method**: Unit test - Verify rectangle normalization

---

### 2. Marquee Over Empty Area

**User Action**: Draw marquee rectangle in area with no entities

**Expected Behavior**:
- Rectangle drawn normally
- No entities selected
- Selection cleared (if previous selection existed)
- Inspector shows empty state: "No entities selected"
- Status bar: "0 entities selected"
- No error or warning message
- User can try again

**Validation Method**: E2E test - Verify empty selection clears previous selection

---

### 3. Partial Overlap Mode (Alt Key)

**User Action**: Hold Alt key while dragging marquee rectangle

**Expected Behavior**:
- Selection mode changes to "partial overlap"
- Visual indicator: Rectangle border changes to orange
- Status bar: "Partial overlap mode: Any touching entities will be selected"
- Entities partially overlapping rectangle are included
- More entities typically selected than full containment mode
- Useful for selecting entities that extend beyond rectangle

**Validation Method**: Integration test - Compare selection counts between modes

---

### 4. Very Large Marquee (Entire Canvas)

**User Action**: Drag from (0, 0) to (10000, 10000) selecting all entities

**Expected Behavior**:
- All visible entities selected
- Performance optimization: Only check entities in viewport first
- Selection count may be high: "87 entities selected"
- Inspector shows summary
- Bulk operations still work
- No performance degradation
- Warning if > 100 entities: "Large selection. Some operations may be slow."

**Validation Method**: Performance test - Ensure selection completes in <100ms

---

### 5. Marquee Over Locked Entities

**User Action**: Draw marquee over entities marked as "locked" (future feature)

**Expected Behavior**:
- Locked entities highlighted but not selected
- Only unlocked entities added to selection
- Status bar: "3 entities selected (2 locked entities ignored)"
- Locked entities show lock icon
- User can unlock if needed

---

## Error Scenarios

### 1. Selection State Corruption

**Scenario**: Selected entity IDs include non-existent entities

**Expected Handling**:
- Validation runs after selection
- Invalid IDs filtered out automatically
- Console warning: "Removed invalid entity IDs from selection"
- Valid entities remain selected
- No visual glitch or error dialog
- Inspector shows only valid entities

**Validation Method**: Unit test - Verify selection cleanup removes invalid IDs

---

### 2. Memory Pressure (1000+ Entities)

**Scenario**: Marquee selection attempts to select 1500 entities

**Expected Handling**:
- Selection limit enforced: Maximum 500 entities
- Warning dialog: "Selection too large. Only first 500 entities selected."
- Suggest filtering or selecting smaller groups
- Performance maintained
- Bulk operations restricted appropriately

---

### 3. Inspector Rendering Failure

**Scenario**: Multi-selection summary calculation throws error

**Expected Handling**:
- Error caught in inspector component
- Fallback display: "Selection summary unavailable"
- Individual entity list still shown
- Bulk actions still available
- Error logged to console
- User can still deselect or work with selection

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Start Marquee Selection | Click-drag on empty space |
| Partial Overlap Mode | Hold `Alt` while dragging |
| Add to Selection (Multi-Marquee) | Hold `Shift` while dragging |
| Deselect All | `Ctrl/Cmd + Shift + A` or click empty space |
| Select All in Viewport | `Ctrl/Cmd + A` |

---

## Related Elements

- [SelectTool](../../elements/04-tools/SelectTool.md) - Marquee selection implementation
- [MarqueeRenderer](../../elements/05-renderers/MarqueeRenderer.md) - Selection rectangle rendering
- [selectionStore](../../elements/02-stores/selectionStore.md) - Multi-selection state
- [InspectorPanel](../../elements/01-components/inspector/InspectorPanel.md) - Multi-selection summary
- [AlignCommand](../../elements/09-commands/AlignCommand.md) - Bulk alignment operations

---

## Visual Diagram

```
Marquee Selection Workflow
┌─────────────────────────────────────────────────────────┐
│  1. Click Empty Space (Anchor Point)                   │
│     ↓                                                   │
│  2. Drag Mouse (Rectangle Grows)                       │
│     ↓                                                   │
│  3. Entities Within Rectangle Highlighted (Preview)    │
│     ↓                                                   │
│  4. Release Mouse (Finalize Selection)                 │
│     ↓                                                   │
│  5. Hit Test All Entities Against Rectangle            │
│     ↓                                                   │
│  6. Update Selection Store                             │
│     ↓                                                   │
│  7. Render Selection Highlights                        │
│     ↓                                                   │
│  8. Update Inspector Panel (Multi-Selection Mode)      │
└─────────────────────────────────────────────────────────┘

Selection Modes:
┌────────────────────┬────────────────────────────────────┐
│ Full Containment   │ Entity 100% inside rectangle       │
│ (Default)          │ ████████░░░░ = Not Selected        │
│                    │ ░░░░████░░░░ = Not Selected        │
│                    │ ░░░░░░██████ = Selected            │
├────────────────────┼────────────────────────────────────┤
│ Partial Overlap    │ Any part of entity touches         │
│ (Alt key)          │ ████████░░░░ = Selected            │
│                    │ ░░░░████░░░░ = Selected            │
│                    │ ░░░░░░██████ = Selected            │
└────────────────────┴────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/tools/SelectTool.marquee.test.ts`

**Test Cases**:
- Rectangle normalization (reverse drag)
- Hit detection within bounds
- Full vs partial containment logic
- Selection state updates
- Empty marquee handling

**Assertions**:
- Rectangle bounds calculated correctly
- Entities correctly identified as inside/outside
- Selection store updated with correct IDs
- Preview highlights render properly

---

### Integration Tests
**File**: `src/__tests__/integration/marquee-selection.test.ts`

**Test Cases**:
- Complete marquee workflow
- Multi-entity selection with various types
- Inspector panel multi-selection mode
- Bulk operations on selection
- Selection + undo/redo

**Assertions**:
- All workflow steps complete successfully
- Inspector displays correct entity count
- Bulk alignment moves all entities correctly
- Undo restores previous positions

---

### E2E Tests
**File**: `e2e/selection/marquee-selection.spec.ts`

**Test Cases**:
- Visual marquee rectangle appears
- Entities highlight during drag
- Final selection matches expected
- Status bar updates correctly
- Inspector bulk actions work
- Performance with 100+ entities

**Assertions**:
- Rectangle visible during drag
- Selected entities have blue outlines
- Status bar shows "X entities selected"
- Bulk delete removes all selected entities

---

## Common Pitfalls

### ❌ Don't: Trigger marquee on entity click
**Problem**: Starting marquee when clicking an entity confuses selection with dragging

**Solution**: Only start marquee on empty space click

---

### ❌ Don't: Include off-screen entities in selection
**Problem**: Selecting 1000s of entities outside viewport causes performance issues

**Solution**: Limit marquee selection to visible viewport area

---

### ✅ Do: Show preview highlighting during drag
**Benefit**: User sees which entities will be selected before releasing

---

### ✅ Do: Normalize rectangle coordinates
**Benefit**: Works correctly regardless of drag direction (reverse drag)

---

## Performance Tips

### Optimization: Spatial Indexing
**Problem**: Checking 1000 entities for marquee intersection is slow (O(n))

**Solution**: Use quadtree spatial index for O(log n) lookups
- Build quadtree of all entities once
- Query only entities in marquee bounds
- Typical speedup: 10-100x for large projects

---

### Optimization: Throttle Preview Updates
**Problem**: Preview highlighting updates every frame (16ms) causes lag

**Solution**: Throttle preview updates to every 50ms
- Still feels smooth to user
- Reduces render calls by 3x
- Maintains 60fps canvas rendering

---

### Optimization: Limit Selection Count
**Problem**: Selecting 500+ entities exhausts memory for bulk operations

**Solution**: Cap selection at 500 entities max
- Show warning if more would be selected
- Suggest filtering or multiple selections
- Prevents out-of-memory errors

---

## Future Enhancements

- **Lasso Selection**: Free-form polygon selection instead of rectangle
- **Invert Selection**: Select all entities NOT in marquee
- **Selection Filters**: Filter marquee by entity type (rooms only, ducts only)
- **Smart Selection**: Automatically select connected entities
- **Selection Memory**: Remember last selection for quick re-selection
- **Marquee Modifiers**: Circle marquee, polygon marquee
- **Selection Groups**: Save selections as named groups for later recall

