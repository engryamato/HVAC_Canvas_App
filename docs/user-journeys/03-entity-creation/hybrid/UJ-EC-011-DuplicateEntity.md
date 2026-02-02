# [UJ-EC-011] Duplicate Entity

## Overview

This user journey covers duplicating selected entities to create identical copies at offset positions, providing a quick way to replicate common elements without manual recreation.

## PRD References

- **FR-EC-011**: User shall be able to duplicate selected entities
- **US-EC-011**: As a designer, I want to duplicate entities so that I can quickly create similar elements
- **AC-EC-011-001**: Ctrl/Cmd+D duplicates selected entities
- **AC-EC-011-002**: Duplicates appear at offset position (20px right, 20px down)
- **AC-EC-011-003**: All entity properties preserved in duplicate
- **AC-EC-011-004**: Duplicates automatically selected after creation
- **AC-EC-011-005**: Can duplicate multiple times in succession
- **AC-EC-011-006**: Single undo command removes all duplicates

## Prerequisites

- User is in Canvas Editor with Select tool active
- At least one entity exists and is selected
- Sufficient canvas space for duplicate placement
- Entities are duplicatable (not locked or protected)

## User Journey Steps

### Step 1: Select Entity to Duplicate

**User Action**: Select Room A (200×150 at position 100, 100)

**Expected Result**:
- Room A selected
- Selection state:
  - `selectedIds`: ['room-a']
  - Selection count: 1
- Entity properties:
  - ID: `room-a`
  - Type: `room`
  - Position: (100, 100)
  - Size: 200×150
  - Properties: Name "Office", color #E0E0E0, etc.
- Visual feedback:
  - Blue selection outline on Room A
  - Resize handles visible
  - Inspector shows Room A properties
- Duplicate command available:
  - Edit menu → Duplicate (enabled)
  - Keyboard shortcut: Ctrl/Cmd+D (ready)
  - Context menu → Duplicate
- Status bar: "1 entity selected"

**Validation Method**: E2E test - Verify entity selection before duplicate

---

### Step 2: Trigger Duplicate Command

**User Action**: Press Ctrl/Cmd+D

**Expected Result**:
- Duplicate command triggered
- Source entity data collected:
  - Full entity object copied: Room A
  - All properties preserved
  - Connection data noted (for handling)
- New entity created:
  - **ID**: `room-uuid-new-123` (NEW unique ID)
  - **Type**: `room` (same as original)
  - **Position**: (120, 120) - offset +20, +20 from original
  - **Size**: 200×150 (same as original)
  - **Properties**: All copied from original
    - Name: "Office Copy" (auto-renamed)
    - Color: #E0E0E0 (same)
    - All other properties identical
- Duplicate command created:
  - `DuplicateEntityCommand` with:
    - Source ID: 'room-a'
    - Duplicate ID: 'room-uuid-new-123'
    - Offset: (20, 20)
  - Added to history stack
- Entity added to store:
  - `entityStore.addEntity(newId, duplicateData)`
  - Appears in `allIds` array
  - Available in `byId` object

**Validation Method**: Integration test - Verify duplicate entity created

---

### Step 3: Render Duplicate on Canvas

**User Action**: (Automatic)

**Expected Result**:
- Duplicate rendered on canvas:
  - Appears at offset position (120, 120)
  - Rendered with same appearance as original
  - Size: 200×150 (identical)
  - Visual style matches original
- Both entities visible:
  - Original Room A at (100, 100)
  - Duplicate Room at (120, 120)
  - Offset creates stair-step pattern
  - No overlap (20px gap)
- Auto-selection:
  - Original Room A deselected
  - Duplicate Room selected automatically
  - Selection highlight on duplicate
  - Resize handles on duplicate
- Inspector updates:
  - Shows duplicate properties
  - Name: "Office Copy"
  - Can immediately edit duplicate
- Canvas re-renders:
  - New entity displayed
  - Proper z-index ordering
  - Grid snapping (if enabled)

**Validation Method**: E2E test - Verify duplicate appears at offset position

---

### Step 4: Duplicate Again (Progressive Offset)

**User Action**: Press Ctrl/Cmd+D again (duplicate the duplicate)

**Expected Result**:
- Second duplicate triggered
- Source: Current selection (first duplicate)
- New entity created:
  - ID: `room-uuid-new-456`
  - Position: (140, 140) - offset +20, +20 from first duplicate
  - Same properties as original
  - Name: "Office Copy 2" (incremented)
- Three rooms now:
  - Original: (100, 100)
  - Duplicate 1: (120, 120)
  - Duplicate 2: (140, 140)
  - Stair-step pattern
- Selection updates:
  - Duplicate 1 deselected
  - Duplicate 2 selected
- Rapid duplication workflow:
  - Hold Ctrl+D, press D multiple times
  - Creates chain of duplicates
  - Each offset by (20, 20) from previous
  - Quick array creation

**Validation Method**: Integration test - Verify progressive duplication

---

### Step 5: Duplicate Multiple Entities

**User Action**: Select 3 rooms (A, B, C), press Ctrl/Cmd+D

**Expected Result**:
- Multi-entity duplicate:
  - All 3 selected rooms duplicated
  - 3 new entities created simultaneously
- Duplicate properties:
  - Room A → Room A Copy at (120, 120)
  - Room B → Room B Copy at (220, 170)
  - Room C → Room C Copy at (170, 270)
  - Each offset +20, +20 from original
  - Relative positions preserved
- Group layout maintained:
  - If original rooms in triangle pattern
  - Duplicates also in triangle pattern
  - Same spatial relationships
- All duplicates selected:
  - Multi-selection on 3 new rooms
  - Original 3 rooms deselected
  - Inspector shows "3 entities selected"
- Single undo command:
  - One Ctrl+Z removes all 3 duplicates
  - Grouped operation
  - Efficient history usage

**Validation Method**: Integration test - Verify multi-entity duplication

---

## Edge Cases

### 1. Duplicate Entity with Connections

**User Action**: Duplicate Room A which has supply duct connected

**Expected Behavior**:
- Original: Room A with duct connected to right edge
- Duplicate operation:
  - Room A duplicated → Room A Copy
  - Connected duct NOT duplicated (only room)
  - Connection metadata not copied
- Result:
  - Room A Copy created (no connections)
  - Original Room A still has duct
  - Duplicate standalone
- User must manually:
  - Draw new duct to duplicate room
  - Or duplicate both room AND duct together
- Alternative workflow:
  - Select room AND duct
  - Duplicate both (Ctrl+D)
  - Both duplicated with connection preserved
  - Connection remapped to new IDs

**Validation Method**: Integration test - Verify connection handling

---

### 2. Duplicate with Smart Naming

**User Action**: Duplicate room named "Conference Room"

**Expected Behavior**:
- Original name: "Conference Room"
- Duplicate naming logic:
  - Check if name ends with number
  - If no number: Append " Copy"
  - Result: "Conference Room Copy"
- Duplicate again:
  - Previous: "Conference Room Copy"
  - New: "Conference Room Copy 2"
- Duplicate again:
  - Previous: "Conference Room Copy 2"
  - New: "Conference Room Copy 3"
- Intelligent incrementing:
  - Detects existing copy numbers
  - Increments appropriately
  - Avoids name collisions
- User can rename:
  - Edit name in inspector
  - Remove "Copy" suffix if desired
  - Custom naming preserved

**Validation Method**: Unit test - Verify smart naming logic

---

### 3. Duplicate at Canvas Edge

**User Action**: Duplicate entity near canvas boundary

**Expected Behavior**:
- Original at (1880, 1060) - near bottom-right
- Standard offset: +20, +20
- Calculated position: (1900, 1080)
- Edge handling:
  - **Option A (Allow)**: Place at calculated position
    - May be off-canvas or near edge
    - User can pan to see
    - Valid placement
  - **Option B (Wrap)**: Wrap to other side
    - Place at (20, 20) - top-left
    - Cycling behavior
  - **Option C (Offset Back)**: Reverse offset
    - Place at (-20, -20) from original
    - Keeps on canvas
- Default: Option A (allow off-canvas)
- User can move duplicate after creation
- No automatic constraint to canvas bounds

**Validation Method**: Unit test - Verify edge placement

---

### 4. Duplicate Locked/Protected Entity

**User Action**: Attempt to duplicate entity marked as protected

**Expected Behavior**:
- Protected entity selected
- Duplicate command triggered
- Protection check: `entity.protected === true`
- Duplicate allowed:
  - Creates duplicate of protected entity
  - Duplicate NOT protected (new entity)
  - Source remains protected
- Rationale:
  - Duplication is copy operation
  - Copy not inherently protected
  - User can protect duplicate separately if needed
- Alternative behavior (configurable):
  - Duplicate inherits protection status
  - Both original and duplicate protected
  - Consistent security model

**Validation Method**: Unit test - Verify protected entity duplication

---

### 5. Rapid Duplication (10 Times)

**User Action**: Press Ctrl+D ten times rapidly

**Expected Behavior**:
- Rapid duplicate commands:
  - 10 duplicate operations in 2 seconds
  - Each creates new entity
  - Each offsets from previous
- Result:
  - 11 total entities (1 original + 10 duplicates)
  - Diagonal line pattern
  - Positions: (100,100), (120,120), (140,140), ..., (300,300)
- Performance:
  - All duplicates created efficiently
  - Canvas renders at 60fps
  - No lag or stuttering
- Undo handling:
  - 10 separate undo commands
  - Or: Grouped if within time window (500ms)
  - Can undo all with 1-10 Ctrl+Z presses
- Use case:
  - Create array of identical elements
  - Quick layout duplication
  - Repetitive pattern creation

**Validation Method**: Performance test - Verify rapid duplication

---

## Error Scenarios

### 1. Duplicate with No Selection

**Scenario**: Press Ctrl+D with nothing selected

**Expected Handling**:
- Duplicate command triggered
- Selection check: `selectedIds.length === 0`
- No selection to duplicate
- No action taken:
  - No entities created
  - No canvas changes
- User feedback:
  - Status bar: "Nothing to duplicate"
  - Or: No message (silent no-op)
  - Duplicate menu item already disabled
- No error dialog:
  - Common enough scenario
  - Not an error condition
- User can select entity and try again

**Validation Method**: Unit test - Verify no-selection handling

---

### 2. Duplicate Creates Name Collision

**Scenario**: Entity named "Room 1" duplicated, but "Room 1 Copy" already exists

**Expected Handling**:
- Naming conflict detection
- Smart resolution:
  - Check if "Room 1 Copy" exists
  - Increment: "Room 1 Copy 2"
  - Check if "Room 1 Copy 2" exists
  - Continue until unique name found
- Result:
  - Unique name guaranteed
  - No collisions
  - Predictable naming
- Maximum iterations:
  - Check up to 1000 increments
  - Fallback to UUID if needed
  - Prevent infinite loops

**Validation Method**: Unit test - Verify name uniqueness

---

### 3. Duplicate During Background Operation

**Scenario**: User duplicates entity while auto-save writing file

**Expected Handling**:
- Duplicate operation independent of save:
  - Duplicate creates entity in memory
  - Save writes snapshot to disk
  - No conflict
- Both complete successfully:
  - Duplicate created immediately
  - Save continues in background
- Save timing:
  - If save started before duplicate: Excludes new entity
  - If save snapshots after duplicate: Includes new entity
- Next auto-save captures duplicate
- No data corruption

**Validation Method**: Integration test - Verify duplicate during background tasks

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Duplicate Selected Entities | `Ctrl/Cmd + D` |
| Duplicate in Place | `Ctrl/Cmd + Shift + D` (same position) |
| Duplicate with Offset Dialog | `Alt + Ctrl/Cmd + D` (custom offset) |

---

## Related Journeys

- [Copy/Paste Entity](./UJ-EC-009-CopyPasteEntity.md)
- [Select Single Entity](../04-selection-and-manipulation/UJ-SM-001-SelectSingleEntity.md)
- [Select Multiple Entities](../04-selection-and-manipulation/UJ-SM-002-SelectMultipleEntities.md)

---

## Related Elements

### Components
- [SelectTool](../../elements/04-tools/SelectTool.md)

### Services
- [NamingService](../../elements/11-services/NamingService.md)
- [ClipboardService](../../elements/11-services/ClipboardService.md)

### Stores
- [entityStore](../../elements/02-stores/entityStore.md)

### Core
- [DuplicateCommand](../../elements/09-commands/DuplicateCommand.md)

---

## Visual Diagram

```
Duplicate Operation Flow
┌────────────────────────────────────────────────────────┐
│  1. Select Entity                                      │
│     ┌─────┐                                            │
│     │  A  │ ← Selected                                 │
│     └─────┘                                            │
│     Position: (100, 100)                               │
│                                                        │
│  2. Press Ctrl+D                                       │
│     ↓                                                  │
│  3. Duplicate Created                                  │
│     ┌─────┐                                            │
│     │  A  │ ← Original (deselected)                    │
│     └─────┘                                            │
│        ┌─────┐                                         │
│        │  A' │ ← Duplicate (selected)                  │
│        └─────┘                                         │
│     Position: (120, 120) - offset +20, +20             │
│                                                        │
│  4. Press Ctrl+D Again                                 │
│     ↓                                                  │
│  5. Second Duplicate Created                           │
│     ┌─────┐                                            │
│     │  A  │ ← Original                                 │
│     └─────┘                                            │
│        ┌─────┐                                         │
│        │  A' │ ← Duplicate 1                           │
│        └─────┘                                         │
│           ┌─────┐                                      │
│           │  A" │ ← Duplicate 2 (selected)             │
│           └─────┘                                      │
│     Position: (140, 140) - progressive offset          │
└────────────────────────────────────────────────────────┘

Multi-Entity Duplication:
┌────────────────────────────────────────────────────────┐
│  Original Selection (3 rooms):                         │
│  ┌───┐                                                 │
│  │ A │  (100, 100)                                     │
│  └───┘                                                 │
│         ┌───┐                                          │
│         │ B │  (200, 150)                              │
│         └───┘                                          │
│    ┌───┐                                               │
│    │ C │  (150, 250)                                   │
│    └───┘                                               │
│                                                        │
│  ↓ Duplicate (Ctrl+D)                                  │
│                                                        │
│  Result (6 rooms total):                               │
│  ┌───┐                                                 │
│  │ A │  Original                                       │
│  └───┘                                                 │
│    ┌───┐                                               │
│    │ A'│  Duplicate (+20, +20)                         │
│    └───┘                                               │
│         ┌───┐                                          │
│         │ B │  Original                                │
│         └───┘                                          │
│            ┌───┐                                       │
│            │ B'│  Duplicate (+20, +20)                 │
│            └───┘                                       │
│    ┌───┐                                               │
│    │ C │  Original                                     │
│    └───┘                                               │
│       ┌───┐                                            │
│       │ C'│  Duplicate (+20, +20)                      │
│       └───┘                                            │
│                                                        │
│  Relative positions preserved in duplicates            │
└────────────────────────────────────────────────────────┘

Smart Naming Logic:
┌────────────────────────────────────────────────────────┐
│  Original Name       →  Duplicate Name                 │
│  ──────────────────────────────────────────────────    │
│  "Office"            →  "Office Copy"                  │
│  "Office Copy"       →  "Office Copy 2"                │
│  "Office Copy 2"     →  "Office Copy 3"                │
│  "Room 1"            →  "Room 1 Copy"                  │
│  "Conference Room"   →  "Conference Room Copy"         │
│                                                        │
│  Naming Algorithm:                                     │
│  1. Check if name ends with " Copy" or " Copy N"       │
│  2. If yes: Increment N (or add " 2" if just "Copy")   │
│  3. If no: Append " Copy"                              │
│  4. Ensure uniqueness (check existing names)           │
│  5. Increment until unique name found                  │
└────────────────────────────────────────────────────────┘

Offset Patterns:
┌────────────────────────────────────────────────────────┐
│  Standard Offset (+20, +20):                           │
│  ┌───┐                                                 │
│  │ 1 │ ← Original                                      │
│  └───┘                                                 │
│    ┌───┐                                               │
│    │ 2 │ ← Duplicate 1                                 │
│    └───┘                                               │
│      ┌───┐                                             │
│      │ 3 │ ← Duplicate 2                               │
│      └───┘                                             │
│  Diagonal stair-step pattern                           │
│                                                        │
│  Custom Offset (e.g., +100, 0):                        │
│  ┌───┐     ┌───┐     ┌───┐                            │
│  │ 1 │     │ 2 │     │ 3 │                            │
│  └───┘     └───┘     └───┘                            │
│  Horizontal array pattern                              │
│                                                        │
│  Custom Offset (0, +100):                              │
│  ┌───┐                                                 │
│  │ 1 │                                                 │
│  └───┘                                                 │
│  ┌───┐                                                 │
│  │ 2 │                                                 │
│  └───┘                                                 │
│  ┌───┐                                                 │
│  │ 3 │                                                 │
│  └───┘                                                 │
│  Vertical stack pattern                                │
└────────────────────────────────────────────────────────┘

Duplicate vs Copy/Paste:
┌────────────────────────────────────────────────────────┐
│  Duplicate (Ctrl+D):                                   │
│  - Creates immediate copy at offset                    │
│  - No clipboard involved                               │
│  - Single operation                                    │
│  - Progressive offset on repeat                        │
│  - Quick workflow                                      │
│                                                        │
│  Copy/Paste (Ctrl+C, Ctrl+V):                          │
│  - Two-step operation                                  │
│  - Uses clipboard                                      │
│  - Can paste multiple times                            │
│  - Can paste in different project                      │
│  - More flexible                                       │
│                                                        │
│  Use Duplicate when:                                   │
│  - Quick copy needed in same location                  │
│  - Creating array of identical elements                │
│  - Rapid duplication workflow                          │
│                                                        │
│  Use Copy/Paste when:                                  │
│  - Copying to different location/project               │
│  - Multiple pastes from single copy                    │
│  - Cross-project duplication                           │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/commands/DuplicateCommand.test.ts`

**Test Cases**:
- Duplicate single entity
- Duplicate multiple entities
- Smart naming logic
- Offset calculation
- New ID generation
- No-selection handling

**Assertions**:
- New entity created with unique ID
- All properties copied correctly
- Name incremented appropriately
- Position offset by (20, 20)
- Original entity unchanged
- Empty selection is no-op

---

### Integration Tests
**File**: `src/__tests__/integration/duplicate-entity.test.ts`

**Test Cases**:
- Complete duplicate workflow
- Progressive duplication (multiple Ctrl+D)
- Multi-entity group duplication
- Duplicate with connections
- Undo/redo duplication
- Performance with rapid duplication

**Assertions**:
- Duplicate appears in entity store
- Progressive offset applies correctly
- Group layout preserved in duplicates
- Connections not copied (standalone duplicates)
- Undo removes all duplicates
- 10 rapid duplicates perform well

---

### E2E Tests
**File**: `e2e/entity-creation/duplicate-entity.spec.ts`

**Test Cases**:
- Visual duplicate (Ctrl+D)
- Duplicate appears at offset
- Auto-selection of duplicate
- Inspector shows duplicate properties
- Progressive duplication visual
- Multi-entity duplication

**Assertions**:
- Duplicate visible on canvas
- Offset position (20px right, 20px down)
- Selection highlight on duplicate
- Inspector shows "Office Copy"
- Multiple Ctrl+D creates stair-step
- All duplicates selected after multi-duplicate

---

## Common Pitfalls

### ❌ Don't: Reuse original entity ID for duplicate
**Problem**: ID collision, data corruption

**Solution**: Always generate new UUID for duplicates

---

### ❌ Don't: Duplicate at exact same position
**Problem**: Overlapping entities, user can't see duplicate

**Solution**: Apply offset (+20, +20) to separate visually

---

### ❌ Don't: Copy connections when duplicating single entity
**Problem**: Duplicate connects to original entity's neighbors (confusing)

**Solution**: Duplicate entity only, leave connections orphaned

---

### ✅ Do: Auto-select duplicate after creation
**Benefit**: User can immediately move or edit duplicate

---

### ✅ Do: Smart naming with "Copy" suffix
**Benefit**: Clear indication of duplicate, organized naming

---

## Performance Tips

### Optimization: Shallow Copy Properties
**Problem**: Deep cloning large property objects is slow

**Solution**: Shallow copy immutable properties
- Properties are value types (safe to share)
- Only clone mutable references
- 10x faster duplication

---

### Optimization: Batch Multi-Entity Duplication
**Problem**: Duplicating 100 entities one-by-one is slow

**Solution**: Batch all duplicates into single store transaction
- Create all new entities
- Add to store in one operation
- Single re-render
- 100x faster for bulk duplication

---

### Optimization: Incremental Name Checking
**Problem**: Checking 1000 existing names for uniqueness is O(n)

**Solution**: Use Set for O(1) name lookups
- Maintain name index
- Fast uniqueness check
- Near-instant naming

---

## Future Enhancements

- **Array Duplication**: Duplicate in grid pattern (rows × columns)
- **Custom Offset Dialog**: User specifies exact offset before duplicate
- **Duplicate in Place**: Ctrl+Shift+D creates duplicate at same position
- **Smart Duplication**: Auto-connect duplicated entities based on original connections
- **Duplicate with Transform**: Rotate or scale during duplication
- **Duplicate History**: Track duplication chains for easy replication
- **Duplicate to Layer**: Duplicate to specific layer
- **Mirror Duplicate**: Duplicate with horizontal/vertical flip
- **Circular Duplicate**: Duplicate in circular pattern around point
- **Parametric Duplication**: Duplicate with incremental property changes
