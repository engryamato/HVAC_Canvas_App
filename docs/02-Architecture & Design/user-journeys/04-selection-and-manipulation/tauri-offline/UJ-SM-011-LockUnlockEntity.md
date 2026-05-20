# [UJ-SM-011] Lock/Unlock Entity

## Overview

This user journey covers locking entities to prevent accidental modifications, enabling designers to protect completed work while continuing to design other parts of the system.

## PRD References

- **FR-SM-011**: User shall be able to lock/unlock entities
- **US-SM-011**: As a designer, I want to lock entities so that I can prevent accidental modifications to completed work
- **AC-SM-011-001**: Locked entities not selectable by click
- **AC-SM-011-002**: Locked entities not included in marquee selection
- **AC-SM-011-003**: Lock icon visible on locked entities
- **AC-SM-011-004**: Locked entities still visible and render normally
- **AC-SM-011-005**: Lock/unlock via Inspector or right-click menu
- **AC-SM-011-006**: Lock state persists in project file

## Prerequisites

- User is in Canvas Editor with Select tool active
- At least one entity exists on canvas
- Entity selected for locking
- User has permission to modify entity

## User Journey Steps

### Step 1: Select Entity to Lock

**User Action**: Click on Room A to select it

**Expected Result**:
- Room A selected:
  - Selection state: `selectedIds: ['room-a']`
  - Single entity selected
- Visual feedback:
  - Blue selection outline on Room A
  - Resize handles visible
  - Entity fully interactive
- Inspector displays:
  - **Room Properties**
  - Name: "Office"
  - Dimensions, CFM, color, etc.
  - **Lock Status**: 🔓 Unlocked
  - Lock toggle available:
    - Checkbox: ☐ Lock Entity
    - Or: Lock button [🔓 Lock]
- Right-click menu:
  - "Lock Entity" option available
  - Keyboard shortcut: Ctrl/Cmd+L
- Entity state:
  - `locked: false`
  - Fully editable
  - Can be moved, resized, deleted
- Status bar:
  - "1 entity selected"

**Validation Method**: E2E test - Verify entity selection and lock controls

---

### Step 2: Lock Entity

**User Action**: Click "Lock" button in Inspector (or press Ctrl/Cmd+L)

**Expected Result**:
- Lock command triggered:
  - Entity: 'room-a'
  - Action: Lock
- Entity property updated:
  - `entityStore.updateEntity('room-a', { locked: true })`
  - Lock status: `locked: false → true`
- Visual updates:
  - Lock icon appears:
    - Position: Top-right corner of entity
    - Icon: 🔒 (padlock, 16×16 px)
    - Color: Gray or theme color
    - Always visible when locked
  - Selection outline: Blue → Gray (dimmed)
  - Or: Outline changes to dashed
  - Optional: Entity slightly transparent (90% opacity)
- Inspector updates:
  - **Lock Status**: 🔒 Locked
  - Lock toggle: ☑️ Lock Entity
  - Or: Unlock button [🔒 Unlock]
  - Other properties: Grayed out (read-only)
- Interaction changes:
  - Cannot move entity (drag disabled)
  - Cannot resize entity (handles disabled)
  - Cannot delete entity (Delete key ignored)
  - Properties read-only in Inspector
- Selection behavior:
  - Entity remains selected (for now)
  - Can view properties
  - Cannot edit
- Command created:
  - `LockEntityCommand` with entity ID
  - Added to history stack
- Status bar:
  - "Room A locked"

**Validation Method**: Integration test - Verify lock state change

---

### Step 3: Attempt to Select Locked Entity

**User Action**: Click outside to deselect, then click on locked Room A

**Expected Result**:
- Click detection:
  - User clicks on Room A
  - Hit-test detects Room A at click position
  - Lock check: `entity.locked === true`
- Selection prevented:
  - Entity NOT selected
  - Click ignored
  - Or: Click passes through to entity behind
- Selection state:
  - `selectedIds: []` - empty
  - No selection
- Visual feedback:
  - No selection outline on Room A
  - Lock icon remains visible
  - Entity renders normally
  - Cursor: Default (not pointer)
- Cursor hover:
  - Hover over locked entity
  - Cursor: 🚫 Not-allowed icon
  - Or: Lock cursor 🔒
  - Tooltip: "Room A (Locked)"
- Inspector:
  - Shows empty state or canvas properties
  - Entity properties not accessible
- Alternative behavior (configurable):
  - **Option A (No Selection)**: Click ignored (default)
  - **Option B (View-Only Selection)**: Entity selected but read-only
    - Can view properties
    - Cannot edit
    - Unlock button available
- Status bar:
  - "Room A is locked"
  - Or: No message (silent)

**Validation Method**: E2E test - Verify locked entity not selectable

---

### Step 4: Unlock Entity

**User Action**: Right-click locked Room A, select "Unlock Entity"

**Expected Result**:
- Right-click menu on locked entity:
  - Context menu appears
  - Options:
    - **Unlock Entity** (Ctrl/Cmd+Shift+L)
    - View Properties (read-only)
    - Select via Layers Panel
  - No edit/delete options (entity locked)
- Unlock triggered:
  - User clicks "Unlock Entity"
  - Unlock command executed
- Entity property updated:
  - `entityStore.updateEntity('room-a', { locked: false })`
  - Lock status: `locked: true → false`
- Visual updates:
  - Lock icon disappears
  - Selection outline: Gray → Blue (normal)
  - Opacity: 90% → 100% (if dimmed)
  - Entity fully visible
- Interaction restored:
  - Can now select by click
  - Can move, resize, delete
  - Properties editable
  - Full interactivity
- Inspector (if viewing):
  - **Lock Status**: 🔓 Unlocked
  - All properties editable again
  - Normal color/enabled state
- Command created:
  - `UnlockEntityCommand` with entity ID
  - Added to history stack
- Undo/redo:
  - Undo: Re-locks entity
  - Redo: Unlocks again
- Status bar:
  - "Room A unlocked"

**Validation Method**: Integration test - Verify unlock restores interaction

---

### Step 5: Bulk Lock Multiple Entities

**User Action**: Select 5 rooms, click "Lock" button

**Expected Result**:
- Multi-selection:
  - 5 rooms selected
  - `selectedIds: ['room-a', 'room-b', 'room-c', 'room-d', 'room-e']`
- Inspector shows:
  - "Multiple Entities (5)"
  - **Lock Status**: Mixed or Unlocked
  - Bulk lock option:
    - ☐ Lock All Selected
    - Or: [🔓 Lock All] button
- Bulk lock triggered:
  - User clicks "Lock All"
- All entities locked:
  - `entityStore.updateEntity('room-a', { locked: true })`
  - `entityStore.updateEntity('room-b', { locked: true })`
  - ... (all 5 entities)
  - Single transaction (batched)
- Visual updates:
  - Lock icons appear on all 5 rooms
  - All outlines dimmed/dashed
  - All show locked state
- Selection cleared:
  - After locking, selection auto-clears
  - `selectedIds: []`
  - Cannot select locked entities
- Command created:
  - `BulkLockCommand` with all 5 entity IDs
  - Single undo unlocks all 5
- Status bar:
  - "5 entities locked"

**Validation Method**: Integration test - Verify bulk lock operation

---

## Edge Cases

### 1. Lock Entity with Connected Ducts

**User Action**: Lock room that has connected ducts

**Expected Behavior**:
- Setup:
  - Room A: Has supply duct connected
  - Duct endpoint at Room A connection point
- Lock Room A:
  - Room A becomes locked
  - Duct remains unlocked
- Connection behavior:
  - Connection preserved
  - Duct endpoint still at Room A
  - If duct moved:
    - Duct can be moved (unlocked)
    - Endpoint disconnects from locked Room A
    - Or: Connection breaks (locked entity unmovable)
- Alternative: Lock propagation
  - **Option A (Independent)**: Duct remains unlocked (default)
  - **Option B (Cascade)**: Ask to lock connected entities
    - Dialog: "Lock connected ducts too?"
    - [Lock All] [Lock Room Only]
- Use case:
  - Lock completed room + ducts together
  - Or: Lock room, continue editing ducts

**Validation Method**: Integration test - Verify connection handling

---

### 2. Lock Group (Entire Group Locked)

**User Action**: Lock a group entity

**Expected Behavior**:
- Group selection:
  - Group 1 selected (contains 5 entities)
  - User locks group
- Group lock:
  - `group.locked = true`
  - Group entity locked
- Member behavior:
  - **Option A (Group Only)**: Members remain unlocked individually
    - Cannot select/move group as unit
    - Can enter group edit mode
    - Can edit individual members
  - **Option B (Cascade)**: All members locked too
    - Group and all members locked
    - Cannot edit anything in group
    - Must unlock group to edit members
- Default: Option B (cascade lock to members)
- Visual:
  - Lock icon on group bounding box
  - Optional: Lock icons on all members too
- Unlock group:
  - Unlocks group and all members
  - Or: Unlocks group, members retain individual lock state

**Validation Method**: Integration test - Verify group lock behavior

---

### 3. Locked Entity in Marquee Selection

**User Action**: Marquee select across locked and unlocked entities

**Expected Behavior**:
- Scenario:
  - Room A: Locked 🔒
  - Room B: Unlocked
  - Room C: Unlocked
  - User drags marquee over all 3
- Selection result:
  - **Option A (Exclude Locked)**: Select Room B, Room C only
    - Locked entities skipped
    - `selectedIds: ['room-b', 'room-c']`
    - Selection count: 2
  - **Option B (Include Locked)**: Select all 3
    - Locked entities included
    - `selectedIds: ['room-a', 'room-b', 'room-c']`
    - Selection count: 3
    - Locked entities view-only
- Default: Option A (exclude locked)
- Visual feedback:
  - Marquee box highlights unlocked entities only
  - Locked entities not highlighted
  - Clear visual distinction
- Use case:
  - Lock background/completed work
  - Marquee select only editable entities
  - Prevents accidental selection

**Validation Method**: E2E test - Verify marquee with locked entities

---

### 4. Lock Layer (All Entities on Layer)

**User Action**: Lock entire Background layer

**Expected Behavior**:
- Layers panel:
  - Background layer
  - Lock icon: 🔓 → 🔒
  - Layer locked
- Layer lock:
  - `layerStore.updateLayer('background', { locked: true })`
  - Layer property: `locked: true`
- Entity behavior:
  - All entities on Background layer:
    - Individually locked: `entity.locked = true`
    - Or: Layer lock checked during interaction
  - Cannot select any Background entities
  - All entities show lock icons
- Visual:
  - Lock icon on layer in layers panel
  - All Background entities show lock icons
  - Dimmed in layers list
- Unlock layer:
  - Layer lock: 🔒 → 🔓
  - All entities become unlocked again
- Independence:
  - Layer lock = all members locked
  - Individual entity lock = only that entity
  - Both mechanisms coexist

**Validation Method**: Integration test - Verify layer-wide lock

---

### 5. Lock Entity Prevents Property Changes

**User Action**: Select locked entity via layers panel, attempt to edit properties

**Expected Behavior**:
- Access locked entity:
  - Layers panel → Background layer
  - Click "Room A" in entity list
  - Entity selected (special case: via layers panel)
- Inspector shows:
  - Room A properties (read-only)
  - All fields disabled/grayed
  - Lock status: 🔒 Locked
  - Unlock button available
- Attempt to edit:
  - Click in Name field
  - Field: Disabled, no cursor
  - Or: Warning: "Entity is locked"
- Property protection:
  - Name: Read-only
  - Dimensions: Read-only
  - CFM: Read-only
  - All properties protected
- Unlock to edit:
  - User clicks [Unlock] button
  - Entity unlocks
  - Fields become editable
  - Can modify properties
- Use case:
  - View locked entity properties
  - Unlock if need to edit
  - Re-lock after editing

**Validation Method**: Integration test - Verify property protection

---

## Error Scenarios

### 1. Attempt to Delete Locked Entity

**Scenario**: User selects locked entity (via layers), presses Delete

**Expected Handling**:
- Delete attempt:
  - Locked entity selected (via layers panel)
  - User presses Delete key
  - Or: Right-click → Delete
- Lock check:
  - Check: `entity.locked === true`
  - Delete prevented
- Error feedback:
  - Dialog: "Cannot delete locked entity"
  - Message: "Room A is locked. Unlock to delete."
  - [Unlock and Delete] [Cancel]
- User options:
  - Cancel (keep locked, no delete)
  - Unlock and Delete (unlock, then delete)
  - Manual: Unlock first, then delete separately
- Prevention:
  - Delete command checks lock status
  - Rejects locked entities
  - No command created
- Status bar:
  - "Cannot delete locked entity"

**Validation Method**: Unit test - Verify delete prevention

---

### 2. Locked Entity in Bulk Operation

**Scenario**: Bulk align 5 entities, 2 are locked

**Expected Handling**:
- Selection:
  - 5 entities selected (via layers panel)
  - Room A: Locked
  - Room B: Unlocked
  - Room C: Unlocked
  - Room D: Locked
  - Room E: Unlocked
- Bulk operation (Align Left):
  - User clicks "Align Left"
  - Lock check: 2 entities locked
- Handling:
  - **Option A (Error)**: Block entire operation
    - "Cannot align: 2 locked entities"
    - User must unlock or deselect
  - **Option B (Skip)**: Align unlocked only
    - Align Room B, C, E
    - Skip Room A, D
    - Warning: "2 locked entities skipped"
  - **Option C (Unlock)**: Ask to unlock
    - "Unlock 2 entities to proceed?"
    - [Unlock and Align] [Cancel]
- Default: Option B (skip locked)
- Result:
  - 3 entities aligned
  - 2 locked entities unmoved
  - Partial operation success
- Status bar:
  - "3 entities aligned (2 locked skipped)"

**Validation Method**: Integration test - Verify bulk operation handling

---

### 3. Undo Lock After Entity Modified

**Scenario**: Lock entity, unlock, edit, then undo past the edit

**Expected Handling**:
- Sequence:
  1. Room A unlocked
  2. Lock Room A (Cmd 1)
  3. Unlock Room A (Cmd 2)
  4. Edit Room A: Resize (Cmd 3)
  5. Undo (Cmd 3): Resize undone
  6. Undo (Cmd 2): Unlock undone → Room A locked
- After second undo:
  - Room A: Locked again
  - Lock icon visible
  - Cannot select
- Consistency:
  - Lock state restored correctly
  - Entity at pre-resize size (from undo)
  - All state consistent
- Redo:
  - Redo (Cmd 2): Unlocks Room A
  - Redo (Cmd 3): Resizes Room A
- History integrity:
  - Lock/unlock commands in history
  - Interleaved with edit commands
  - All commands reversible

**Validation Method**: Integration test - Verify lock undo/redo

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Lock Selected Entity | `Ctrl/Cmd + L` |
| Unlock Selected Entity | `Ctrl/Cmd + Shift + L` |
| Toggle Lock State | `Ctrl/Cmd + Alt + L` |
| Lock All on Layer | (Via layers panel context menu) |

---

## Related Elements

- [LockEntityCommand](../../elements/09-commands/LockEntityCommand.md) - Lock undo/redo
- [UnlockEntityCommand](../../elements/09-commands/UnlockEntityCommand.md) - Unlock undo/redo
- [entityStore](../../elements/02-stores/entityStore.md) - Entity lock state
- [SelectionService](../../elements/11-services/SelectionService.md) - Lock-aware selection
- [InteractionService](../../elements/11-services/InteractionService.md) - Lock enforcement
- [UJ-EC-014](../03-entity-creation/UJ-EC-014-SetEntityLayer.md) - Layer locking
- [UJ-SM-001](./UJ-SM-001-SelectSingleEntity.md) - Entity selection

---

## Visual Diagram

```
Lock Entity Flow
┌────────────────────────────────────────────────────────┐
│  1. Entity Unlocked (Normal State)                     │
│     ┌─────────────┐                                    │
│     │   Room A    │ ← Unlocked, fully editable         │
│     │   Office    │                                    │
│     └─────────────┘                                    │
│     • Selectable by click                              │
│     • Movable, resizable, deletable                    │
│     • Properties editable                              │
│                                                        │
│  2. Lock Entity (Ctrl+L)                               │
│     ↓                                                  │
│  3. Entity Locked                                      │
│     ┌─────────────┐                                    │
│     │   Room A  🔒│ ← Lock icon visible                │
│     │   Office    │                                    │
│     └─────────────┘                                    │
│     • NOT selectable by click                          │
│     • Cannot move, resize, delete                      │
│     • Properties read-only                             │
│     • Still visible and renders normally               │
│                                                        │
│  4. Unlock Entity (Right-click → Unlock)               │
│     ↓                                                  │
│  5. Entity Unlocked Again                              │
│     ┌─────────────┐                                    │
│     │   Room A    │ ← Lock icon removed                │
│     │   Office    │                                    │
│     └─────────────┘                                    │
│     • Fully editable again                             │
└────────────────────────────────────────────────────────┘

Lock Icon Placement
┌────────────────────────────────────────────────────────┐
│  Locked Entity with Icon:                              │
│  ┌─────────────────────────┐                           │
│  │                      🔒 │ ← Top-right corner        │
│  │                         │                           │
│  │      Room A             │                           │
│  │      Office             │                           │
│  │      500 CFM            │                           │
│  │                         │                           │
│  └─────────────────────────┘                           │
│                                                        │
│  Icon: 16×16px, gray or theme color                    │
│  Always visible when entity locked                     │
└────────────────────────────────────────────────────────┘

Cursor Feedback on Locked Entity
┌────────────────────────────────────────────────────────┐
│  Hover over Unlocked Entity:                           │
│  ┌─────────────┐                                       │
│  │   Room A    │ ← Cursor: Pointer 👆                  │
│  └─────────────┘                                       │
│  Tooltip: "Room A"                                     │
│  Click: Selects entity                                 │
│                                                        │
│  Hover over Locked Entity:                             │
│  ┌─────────────┐                                       │
│  │   Room A  🔒│ ← Cursor: Not-allowed 🚫             │
│  └─────────────┘                                       │
│  Tooltip: "Room A (Locked)"                            │
│  Click: Ignored, no selection                          │
└────────────────────────────────────────────────────────┘

Inspector - Lock Control
┌────────────────────────────────────────────────────────┐
│  Unlocked Entity:                                      │
│  ┌──────────────────────────────┐                      │
│  │ Room Properties              │                      │
│  ├──────────────────────────────┤                      │
│  │ Name: [Office__________]     │ ← Editable           │
│  │ Width: [200"___]             │                      │
│  │ Height: [150"___]            │                      │
│  │ Supply CFM: [500___]         │                      │
│  │                              │                      │
│  │ Lock: ☐ Lock Entity          │ ← Checkbox           │
│  │       [🔓 Lock]              │ ← Lock button        │
│  └──────────────────────────────┘                      │
│                                                        │
│  Locked Entity:                                        │
│  ┌──────────────────────────────┐                      │
│  │ Room Properties              │                      │
│  ├──────────────────────────────┤                      │
│  │ Name: Office                 │ ← Read-only (gray)   │
│  │ Width: 200"                  │                      │
│  │ Height: 150"                 │                      │
│  │ Supply CFM: 500              │                      │
│  │                              │                      │
│  │ Lock: ☑️ Lock Entity         │ ← Checked            │
│  │       [🔒 Unlock]            │ ← Unlock button      │
│  └──────────────────────────────┘                      │
└────────────────────────────────────────────────────────┘

Bulk Lock Multiple Entities
┌────────────────────────────────────────────────────────┐
│  Before Lock (5 entities selected):                    │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐              │
│  │ A  │  │ B  │  │ C  │  │ D  │  │ E  │              │
│  └────┘  └────┘  └────┘  └────┘  └────┘              │
│  All unlocked, all editable                            │
│                                                        │
│  ↓ Click "Lock All" in Inspector                       │
│                                                        │
│  After Lock:                                           │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐              │
│  │ A🔒│  │ B🔒│  │ C🔒│  │ D🔒│  │ E🔒│              │
│  └────┘  └────┘  └────┘  └────┘  └────┘              │
│  All locked, all protected                             │
│  Selection auto-clears (cannot select locked)          │
└────────────────────────────────────────────────────────┘

Marquee Selection with Locked Entities
┌────────────────────────────────────────────────────────┐
│  Canvas State:                                         │
│  ┌────┐           ┌────┐           ┌────┐             │
│  │ A🔒│           │ B  │           │ C  │             │
│  └────┘           └────┘           └────┘             │
│  Locked           Unlocked         Unlocked           │
│                                                        │
│  User drags marquee over all 3:                        │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐               │
│  │ ┌────┐           ┌────┐           ┌────┐ │         │
│  │ │ A🔒│           │ B  │           │ C  │ │         │
│  │ └────┘           └────┘           └────┘ │         │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘               │
│       ↑                 ↑                 ↑            │
│    Skipped          Selected          Selected        │
│                                                        │
│  Result: Only B and C selected (A excluded)            │
│  Selection: [room-b, room-c]                           │
└────────────────────────────────────────────────────────┘

Layers Panel - Layer Lock
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────┐                      │
│  │ LAYERS                    [+]│                      │
│  ├──────────────────────────────┤                      │
│  │ ☑️ 🟦 Supply         (12) 🔓│ ← Unlocked            │
│  │ ☑️ 🟥 Return          (8) 🔓│                       │
│  │ ☑️ 🟩 Equipment       (6) 🔓│                       │
│  │ ☑️ 🟨 Notes           (3) 🔓│                       │
│  │ ☐ ⬜ Background       (1) 🔒│ ← Layer locked        │
│  └──────────────────────────────┘                      │
│                                                        │
│  Click lock icon on Background:                        │
│  - All entities on Background locked                   │
│  - Cannot select any Background entities               │
│  - Lock icons appear on all Background entities        │
│                                                        │
│  Click lock icon again to unlock layer                 │
└────────────────────────────────────────────────────────┘

Right-Click Menu - Locked Entity
┌────────────────────────────────────────────────────────┐
│  Right-click on Locked Entity:                         │
│  ┌──────────────────────────────┐                      │
│  │ ✏️ Unlock Entity   Ctrl+Shift+L│                     │
│  │ 👁️ View Properties (read-only)│                     │
│  │ 🔍 Select in Layers Panel    │                     │
│  │ ──────────────────────────── │                     │
│  │ ❌ Cut              (disabled)│                     │
│  │ ❌ Copy             (disabled)│                     │
│  │ ❌ Delete           (disabled)│                     │
│  └──────────────────────────────┘                      │
│                                                        │
│  Edit operations disabled for locked entity            │
│  Unlock is primary action                              │
└────────────────────────────────────────────────────────┘

Lock with Connected Entities
┌────────────────────────────────────────────────────────┐
│  Before Lock:                                          │
│  ┌─────────┐                                           │
│  │ Room A  │───● Duct (unlocked)                       │
│  └─────────┘                                           │
│  Both unlocked, both editable                          │
│                                                        │
│  ↓ Lock Room A                                         │
│                                                        │
│  After Lock:                                           │
│  ┌─────────┐                                           │
│  │ Room A🔒│───● Duct (unlocked)                       │
│  └─────────┘                                           │
│  Room locked, duct remains editable                    │
│                                                        │
│  Options:                                              │
│  1. Lock room only (default)                           │
│  2. Ask: "Lock connected ducts too?"                   │
│     [Lock All] [Lock Room Only]                        │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/commands/LockEntityCommand.test.ts`

**Test Cases**:
- Lock entity
- Unlock entity
- Toggle lock state
- Bulk lock multiple entities
- Undo/redo lock
- Prevent operations on locked entity

**Assertions**:
- Entity locked property set to true
- Unlock sets property to false
- All selected entities locked in bulk
- Undo unlocks, redo locks
- Delete/move commands reject locked entities

---

### Integration Tests
**File**: `src/__tests__/integration/lock-unlock-entity.test.ts`

**Test Cases**:
- Complete lock workflow
- Locked entity not selectable by click
- Marquee excludes locked entities
- Layer lock affects all entities
- Unlock restores full interaction
- Property editing prevented when locked

**Assertions**:
- Lock icon appears on entity
- Click on locked entity ignored
- Marquee selection skips locked
- All layer entities locked together
- Unlock removes restrictions
- Inspector fields disabled when locked

---

### E2E Tests
**File**: `e2e/selection-manipulation/lock-unlock-entity.spec.ts`

**Test Cases**:
- Visual lock button in Inspector
- Lock icon appears on entity
- Click on locked entity does nothing
- Cursor changes to not-allowed
- Unlock button removes lock icon
- Bulk lock via layers panel

**Assertions**:
- Lock button toggles state
- Lock icon visible at top-right
- No selection on click
- Cursor shows 🚫 icon
- Icon disappears after unlock
- All entities show lock icons

---

## Common Pitfalls

### ❌ Don't: Allow moving locked entities accidentally
**Problem**: Lock state not checked, entity moves despite being locked

**Solution**: Check `entity.locked` in all interaction handlers (click, drag, resize)

---

### ❌ Don't: Hide locked entities
**Problem**: User can't see locked entities, loses context

**Solution**: Render locked entities normally, just prevent interaction

---

### ❌ Don't: Forget to show lock status visually
**Problem**: User doesn't know which entities are locked

**Solution**: Always display lock icon on locked entities

---

### ✅ Do: Allow viewing locked entity properties
**Benefit**: User can see entity details without unlocking

---

### ✅ Do: Support undo/redo for lock operations
**Benefit**: User can revert lock state changes if needed

---

## Performance Tips

### Optimization: Cache Locked Entity List
**Problem**: Checking `entity.locked` for 1000 entities every click is slow

**Solution**: Maintain locked entity index
- Set of locked entity IDs
- Update on lock/unlock
- O(1) lookup during hit-test
- 100x faster selection

---

### Optimization: Skip Locked Entities in Hit-Test
**Problem**: Hit-testing locked entities wastes CPU cycles

**Solution**: Filter out locked entities before hit-test
- Exclude from spatial index query
- Or: Check lock status early
- Skip expensive bounds checks
- Faster click detection

---

### Optimization: Batch Lock Icon Rendering
**Problem**: Rendering 100 lock icons individually is slow

**Solution**: Batch all lock icons in single draw call
- Collect all locked entity positions
- Draw all icons together
- Single texture, multiple instances
- 10x faster rendering

---

## Future Enhancements

- **Partial Lock**: Lock position but allow property edits
- **Lock Layers**: Lock specific properties (e.g., lock CFM, allow resize)
- **Lock Expiration**: Time-based locks that auto-unlock
- **Lock Permissions**: User-based lock permissions (multi-user)
- **Lock Groups**: Lock templates for common protection patterns
- **Lock History**: Track who locked/unlocked and when
- **Lock Warnings**: Warn before locking many entities
- **Visual Lock Styles**: Different lock icon colors for different lock types
- **Lock Keyboard Shortcut**: Quick-lock hovered entity
- **Lock Inheritance**: Child entities inherit parent lock state
