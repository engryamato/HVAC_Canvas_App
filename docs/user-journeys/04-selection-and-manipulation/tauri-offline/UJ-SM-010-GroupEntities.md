# [UJ-SM-010] Group Entities

## Overview

This user journey covers creating logical groups from multiple selected entities, enabling designers to organize, move, and manipulate related elements as a single unit while preserving individual entity properties.

## PRD References

- **FR-SM-010**: User shall be able to group entities together
- **US-SM-010**: As a designer, I want to group entities so that I can organize and manipulate related elements together
- **AC-SM-010-001**: Ctrl/Cmd+G creates group from selection
- **AC-SM-010-002**: Group appears as single selectable unit
- **AC-SM-010-003**: Moving group moves all member entities
- **AC-SM-010-004**: Group can be ungrouped (Ctrl/Cmd+Shift+G)
- **AC-SM-010-005**: Groups can be nested (group of groups)
- **AC-SM-010-006**: Individual entities editable via double-click into group

## Prerequisites

- User is in Canvas Editor with Select tool active
- At least 2 entities selected for grouping
- Selected entities not already in incompatible groups
- User has permission to modify entities

## User Journey Steps

### Step 1: Select Multiple Entities for Grouping

**User Action**: Select 3 rooms and 2 ducts using Shift+Click

**Expected Result**:
- Multi-selection created:
  - 5 entities selected
  - Selection state: `selectedIds: ['room-a', 'room-b', 'room-c', 'duct-1', 'duct-2']`
  - Mixed types: rooms + ducts
- Visual feedback:
  - All 5 entities outlined in blue
  - Multi-selection bounding box
  - Selection handles visible
- Toolbar updates:
  - Group button enabled: [📁 Group]
  - Keyboard shortcut available: Ctrl/Cmd+G
- Inspector shows:
  - "Multiple Entities (5)"
  - Common properties editable
  - Group option available
- Status bar:
  - "5 entities selected"
- Grouping intention:
  - Related HVAC zone
  - Office wing layout
  - Reusable component

**Validation Method**: E2E test - Verify multi-select for grouping

---

### Step 2: Create Group

**User Action**: Press Ctrl/Cmd+G to create group

**Expected Result**:
- Group entity created:
  - **ID**: `group-uuid-123`
  - **Type**: `group`
  - **Name**: "Group 1" (auto-generated)
  - **Members**: ['room-a', 'room-b', 'room-c', 'duct-1', 'duct-2']
  - **Bounding Box**:
    - Calculate from all member positions/sizes
    - Top-left: (100, 100)
    - Bottom-right: (700, 400)
    - Width: 600, Height: 300
  - **Position**: (100, 100) - group origin
  - **Transform**: Identity (no scaling/rotation initially)
  - **Locked**: false
  - **Collapsed**: false (all members visible)
- Member entities updated:
  - Each entity: `parentGroup: 'group-uuid-123'`
  - Entities remain in `entityStore`
  - Not removed, just marked as grouped
  - Positions relative to group origin stored
- Group added to store:
  - `entityStore.addEntity('group-uuid-123', groupData)`
  - Group itself is an entity
- Selection updated:
  - Previous selection cleared
  - Group selected: `selectedIds: ['group-uuid-123']`
  - Single unit selection
- Visual update:
  - Group bounding box outline (dotted/dashed)
  - Label: "Group 1" at top-left
  - Member entities still visible
  - Group handles for resize/rotate
- Command created:
  - `GroupCommand` with:
    - Group ID: 'group-uuid-123'
    - Member IDs: ['room-a', 'room-b', 'room-c', 'duct-1', 'duct-2']
  - Added to history stack
- Status bar:
  - "Created group with 5 entities"

**Validation Method**: Integration test - Verify group creation

---

### Step 3: Move Group as Unit

**User Action**: Drag group from (100, 100) to (300, 200)

**Expected Result**:
- Group drag initiated:
  - User grabs group bounding box
  - Drag starts at (100, 100)
  - Move delta: (+200, +100)
- Group position updated:
  - `entityStore.updateEntity('group-uuid-123', { position: {x: 300, y: 200} })`
  - Group origin: (100, 100) → (300, 200)
- Member entities updated:
  - All member positions recalculated:
    - Room A: (100, 100) → (300, 200)
    - Room B: (300, 100) → (500, 200)
    - Room C: (500, 200) → (700, 300)
    - Duct 1 endpoints: both offset by (+200, +100)
    - Duct 2 endpoints: both offset by (+200, +100)
  - All members move together
  - Relative positions preserved
- Visual update:
  - Entire group moves as unit
  - All 5 entities reposition
  - Group bounding box follows
  - Smooth animation (optional)
- Connected entities:
  - If ducts connect to entities outside group
  - External connections maintained
  - Endpoints update to follow group members
- Undo handling:
  - `MoveEntityCommand` for group
  - Single undo moves entire group back
  - Not separate commands for each member
- Status bar:
  - "Moved group"

**Validation Method**: E2E test - Verify group movement

---

### Step 4: Edit Group Member (Enter Group)

**User Action**: Double-click on Room A within group

**Expected Result**:
- Enter group mode:
  - Group becomes editable
  - Focus enters group context
  - Individual members selectable
- Visual changes:
  - Group bounding box: Dotted → Solid
  - Group label: "Group 1" → "Group 1 (Editing)"
  - Other entities dimmed/grayed (outside group)
  - Member entities normal brightness
- Room A selected:
  - Individual selection within group
  - `selectedIds: ['room-a']`
  - Context: Inside 'group-uuid-123'
- Inspector shows:
  - Room A properties (individual)
  - Can edit: name, dimensions, CFM, color
  - Changes apply to Room A only
- Editing capabilities:
  - Move individual member
  - Resize individual member
  - Edit properties
  - Delete individual member
  - Add entities to group (drag into)
- Exit group mode:
  - Click outside group
  - Press Escape
  - Double-click canvas background
  - Group mode exits, return to normal
- Status bar:
  - "Editing Group 1 • Click outside to exit"

**Validation Method**: Integration test - Verify group edit mode

---

### Step 5: Ungroup Entities

**User Action**: Select group, press Ctrl/Cmd+Shift+G to ungroup

**Expected Result**:
- Ungroup command triggered:
  - Group: 'group-uuid-123'
  - Members: 5 entities
- Group dissolution:
  - Group entity deleted:
    - Remove from `entityStore`
    - Group ID no longer valid
  - Member entities updated:
    - Clear `parentGroup` property
    - Entities become independent again
    - Positions remain at current locations
    - Properties unchanged
- Selection updated:
  - Group no longer selectable
  - All 5 member entities selected:
    - `selectedIds: ['room-a', 'room-b', 'room-c', 'duct-1', 'duct-2']`
    - Multi-selection of former members
- Visual update:
  - Group bounding box disappears
  - Member entities remain visible
  - Entities now individually selectable
  - No group label
- Command created:
  - `UngroupCommand` with:
    - Group ID: 'group-uuid-123'
    - Member IDs and positions
  - Added to history
- Undo support:
  - Undo: Re-creates group
  - Redo: Ungroups again
- Status bar:
  - "Ungrouped 5 entities"

**Validation Method**: Integration test - Verify ungroup operation

---

## Edge Cases

### 1. Nested Groups (Group of Groups)

**User Action**: Create group, then create second group containing first group

**Expected Behavior**:
- First group created:
  - Group 1: Contains Room A, Room B
  - Group ID: 'group-1'
- Create second group:
  - Select: Group 1 + Room C
  - Press Ctrl+G
  - Group 2 created:
    - Members: ['group-1', 'room-c']
    - Nested structure
- Hierarchy:
  ```
  Group 2
  ├─ Group 1
  │  ├─ Room A
  │  └─ Room B
  └─ Room C
  ```
- Moving Group 2:
  - Moves Group 1 and Room C
  - Transitively moves Room A and Room B
  - All 3 rooms move together
- Edit mode:
  - Double-click Group 2: Enter Group 2 context
    - Can select Group 1 or Room C
  - Double-click Group 1: Enter Group 1 context
    - Can select Room A or Room B
  - Breadcrumb: "Group 2 > Group 1"
- Ungroup Group 2:
  - Releases Group 1 and Room C
  - Group 1 remains intact
  - Room C independent
- Maximum nesting:
  - Limit: 10 levels (prevent infinite recursion)
  - Warning if exceeded

**Validation Method**: Integration test - Verify nested groups

---

### 2. Group Across Layers

**User Action**: Select entities from different layers, create group

**Expected Behavior**:
- Selection:
  - Room A: Supply layer
  - Room B: Return layer
  - Equipment: Equipment layer
- Group creation:
  - Group created successfully
  - Members span multiple layers
- Layer assignment for group:
  - **Option A**: Group on "default" layer
  - **Option B**: Group on layer of first selected entity
  - **Option C**: Group creates virtual "group layer"
- Default: Option A (group layer agnostic)
- Layer visibility:
  - If Supply layer hidden:
    - Room A hidden
    - But Room B (Return) still visible
    - Group partially visible
  - If all member layers hidden:
    - Entire group hidden
- Layer reorganization:
  - User can move all group members to same layer
  - Bulk layer assignment

**Validation Method**: Integration test - Verify multi-layer groups

---

### 3. Group with Connected Ducts

**User Action**: Group rooms with ducts connecting to external entities

**Expected Behavior**:
- Setup:
  - Room A (in group) connected to Duct 1
  - Duct 1 connects to External Room (not in group)
- Group created:
  - Members: Room A, Room B, Duct 1
  - External connection: Duct 1 → External Room
- Move group:
  - Group moves: (+100, +50)
  - Room A, Room B, Duct 1 all move
  - Duct 1 start endpoint: Follows Room A
  - Duct 1 end endpoint: Still connected to External Room
    - Endpoint outside group updates
    - Duct stretches
- Connection preservation:
  - External connections maintained
  - Duct endpoints recalculate
  - No broken connections
- Visual:
  - Duct stretches from group to external entity
  - Connection dots visible
  - Clear relationship
- Use case:
  - Group partial system
  - Maintain connections to rest of design

**Validation Method**: Integration test - Verify external connections

---

### 4. Group Selection with Marquee

**User Action**: Marquee select across group boundary

**Expected Behavior**:
- Scenario:
  - Group 1 contains Room A, Room B
  - Room C outside group
  - User drags marquee over all 3 rooms
- Selection behavior:
  - **Option A (Group as Unit)**: Select Group 1 + Room C
    - Group selected as whole
    - Partial overlap selects entire group
  - **Option B (Individual Members)**: Select Room A, Room B, Room C
    - Drill into group
    - Select individual members
- Default: Option A (group as unit)
- Modifier: Ctrl+Marquee to select members directly
- Selection result:
  - `selectedIds: ['group-1', 'room-c']`
  - 2 entities (group counts as 1)
- Edit mode:
  - If in group edit mode: Select individual members
  - If in normal mode: Select group as unit

**Validation Method**: E2E test - Verify marquee group selection

---

### 5. Group Naming and Organization

**User Action**: Rename group, organize multiple groups

**Expected Behavior**:
- Group naming:
  - Default: "Group 1", "Group 2", etc.
  - User can rename:
    - Inspector: Name field
    - Type: "North Wing HVAC"
    - Group name updates
- Group organization:
  - Groups appear in entity list/hierarchy
  - Expandable/collapsible tree:
    ```
    ▼ North Wing HVAC (Group)
      ├─ Room A
      ├─ Room B
      └─ Duct 1
    ▼ South Wing HVAC (Group)
      ├─ Room C
      └─ Equipment 1
    ```
  - Easy navigation
- Group properties:
  - Name
  - Description (optional)
  - Color (group outline color)
  - Locked (prevent edits)
  - Collapsed (hide members)
- Search/filter:
  - Search by group name
  - Show/hide groups
  - Isolate specific groups

**Validation Method**: Integration test - Verify group naming

---

## Error Scenarios

### 1. Group Single Entity

**Scenario**: User selects single entity, attempts to group

**Expected Handling**:
- Selection: 1 entity (Room A)
- Group attempt: Press Ctrl+G
- Validation:
  - Minimum 2 entities required for grouping
  - Single entity = no purpose
- User feedback:
  - Toolbar button: Disabled (grayed)
  - Status bar: "Group requires at least 2 entities"
  - Or: Silent no-op
- Workaround:
  - Select additional entities
  - Then create group
- Rationale:
  - Group of 1 entity is redundant
  - Adds complexity without benefit

**Validation Method**: Unit test - Verify minimum entity check

---

### 2. Circular Group Reference

**Scenario**: Attempt to add group to itself (circular dependency)

**Expected Handling**:
- Setup:
  - Group 1 contains Room A, Room B
- Attempt:
  - Enter Group 1 edit mode
  - Select Group 1 itself
  - Attempt to add to its own members
- Validation:
  - Detect circular reference
  - Group cannot contain itself
  - Infinite recursion prevented
- Error:
  - "Cannot add group to itself"
  - Or: Automatic rejection (no dialog)
- Prevention:
  - Membership validation
  - Check ancestry before adding
  - Reject if circular

**Validation Method**: Unit test - Verify circular reference prevention

---

### 3. Group Locked Entities

**Scenario**: Attempt to group locked and unlocked entities

**Expected Handling**:
- Selection:
  - Room A: Unlocked
  - Room B: Locked 🔒
- Group attempt:
  - Press Ctrl+G
- Lock handling:
  - **Option A (Prevent)**: Block group creation
    - "Cannot group locked entities"
    - User must unlock first
  - **Option B (Allow)**: Create group anyway
    - Locked entities remain locked within group
    - Group movable, but locked members stay in place (break group?)
  - **Option C (Inherit)**: Group inherits lock status
    - Entire group becomes locked
- Default: Option A (prevent grouping locked)
- User action:
  - Unlock entities
  - Create group
  - Re-lock group if desired

**Validation Method**: Unit test - Verify locked entity handling

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Group Selected Entities | `Ctrl/Cmd + G` |
| Ungroup Selected Group | `Ctrl/Cmd + Shift + G` |
| Enter Group Edit Mode | `Double-click` group |
| Exit Group Edit Mode | `Escape` |
| Select All in Group | `Ctrl/Cmd + A` (in edit mode) |

---

## Related Elements

- [GroupEntity](../../elements/03-entities/GroupEntity.md) - Group data structure
- [GroupCommand](../../elements/09-commands/GroupCommand.md) - Group creation undo/redo
- [UngroupCommand](../../elements/09-commands/UngroupCommand.md) - Ungroup undo/redo
- [entityStore](../../elements/02-stores/entityStore.md) - Entity storage
- [SelectionService](../../elements/11-services/SelectionService.md) - Group selection
- [TransformService](../../elements/11-services/TransformService.md) - Group transforms
- [UJ-SM-001](./UJ-SM-001-SelectSingleEntity.md) - Entity selection

---

## Visual Diagram

```
Group Creation Flow
┌────────────────────────────────────────────────────────┐
│  1. Select Multiple Entities                           │
│     ┌────┐  ┌────┐  ┌────┐                            │
│     │ A  │  │ B  │  │ C  │  ← All selected             │
│     └────┘  └────┘  └────┘                            │
│     ●────────────────● ← Duct                          │
│                                                        │
│  2. Press Ctrl+G                                       │
│     ↓                                                  │
│  3. Group Created                                      │
│     ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐                        │
│     ┊ Group 1                 ┊                        │
│     ┊ ┌────┐  ┌────┐  ┌────┐ ┊                        │
│     ┊ │ A  │  │ B  │  │ C  │ ┊                        │
│     ┊ └────┘  └────┘  └────┘ ┊                        │
│     ┊ ●────────────────●      ┊                        │
│     └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘                        │
│     Dotted outline = Group bounding box                │
│     All members move together as unit                  │
└────────────────────────────────────────────────────────┘

Group Movement
┌────────────────────────────────────────────────────────┐
│  Before Move:                                          │
│  ┌╌╌╌╌╌╌╌╌╌╌╌╌╌┐                                       │
│  ┊ Group 1     ┊                                       │
│  ┊ ┌──┐  ┌──┐  ┊                                       │
│  ┊ │A │  │B │  ┊                                       │
│  ┊ └──┘  └──┘  ┊                                       │
│  └╌╌╌╌╌╌╌╌╌╌╌╌╌┘                                       │
│  Position: (100, 100)                                  │
│                                                        │
│  ↓ Drag (+200, +100)                                   │
│                                                        │
│  After Move:                                           │
│              ┌╌╌╌╌╌╌╌╌╌╌╌╌╌┐                           │
│              ┊ Group 1     ┊                           │
│              ┊ ┌──┐  ┌──┐  ┊                           │
│              ┊ │A │  │B │  ┊                           │
│              ┊ └──┘  └──┘  ┊                           │
│              └╌╌╌╌╌╌╌╌╌╌╌╌╌┘                           │
│  Position: (300, 200)                                  │
│                                                        │
│  All members moved by (+200, +100)                     │
│  Relative positions preserved                          │
└────────────────────────────────────────────────────────┘

Group Edit Mode
┌────────────────────────────────────────────────────────┐
│  Normal Mode (Group as Unit):                          │
│  ┌╌╌╌╌╌╌╌╌╌╌╌╌╌┐                                       │
│  ┊ Group 1     ┊  ← Dotted outline                     │
│  ┊ ┌──┐  ┌──┐  ┊                                       │
│  ┊ │A │  │B │  ┊                                       │
│  ┊ └──┘  └──┘  ┊                                       │
│  └╌╌╌╌╌╌╌╌╌╌╌╌╌┘                                       │
│  Click group → Select entire group                     │
│                                                        │
│  ↓ Double-click to enter edit mode                     │
│                                                        │
│  Edit Mode (Individual Members):                       │
│  ┌────────────────┐                                    │
│  │ Group 1        │  ← Solid outline, edit mode        │
│  │ (Editing)      │                                    │
│  │ ┌──┐  ┌──┐    │                                    │
│  │ │A │  │B │    │  ← Individual selection possible   │
│  │ └──┘  └──┘    │                                    │
│  └────────────────┘                                    │
│  Click member → Select individual entity               │
│  Outside entities dimmed                               │
│                                                        │
│  Press Escape to exit edit mode                        │
└────────────────────────────────────────────────────────┘

Nested Groups
┌────────────────────────────────────────────────────────┐
│  Hierarchy:                                            │
│  ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐                        │
│  ┊ Group 2                     ┊                        │
│  ┊ ┌╌╌╌╌╌╌╌╌╌╌╌┐               ┊                        │
│  ┊ ┊ Group 1   ┊  ┌──┐         ┊                        │
│  ┊ ┊ ┌──┐ ┌──┐ ┊  │C │         ┊                        │
│  ┊ ┊ │A │ │B │ ┊  └──┘         ┊                        │
│  ┊ ┊ └──┘ └──┘ ┊               ┊                        │
│  ┊ └╌╌╌╌╌╌╌╌╌╌╌╌┘               ┊                        │
│  └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘                        │
│                                                        │
│  Tree View:                                            │
│  ▼ Group 2                                             │
│    ├─ ▼ Group 1                                        │
│    │  ├─ Room A                                        │
│    │  └─ Room B                                        │
│    └─ Room C                                           │
│                                                        │
│  Moving Group 2 moves all (A, B, C)                    │
│  Ungrouping Group 2 releases Group 1 and C             │
│  Group 1 remains intact                                │
└────────────────────────────────────────────────────────┘

Group with External Connections
┌────────────────────────────────────────────────────────┐
│  Before Group Move:                                    │
│  ┌╌╌╌╌╌╌╌╌╌╌╌╌╌┐                                       │
│  ┊ Group 1     ┊        ┌──────┐                       │
│  ┊ ┌──┐        ┊        │Ext   │                       │
│  ┊ │A │●───────┼───────●│Room  │  External connection  │
│  ┊ └──┘        ┊        └──────┘                       │
│  └╌╌╌╌╌╌╌╌╌╌╌╌╌┘                                       │
│                                                        │
│  ↓ Move Group (+200, 0)                                │
│                                                        │
│  After Group Move:                                     │
│              ┌╌╌╌╌╌╌╌╌╌╌╌╌╌┐                           │
│              ┊ Group 1     ┊    ┌──────┐               │
│              ┊ ┌──┐        ┊    │Ext   │               │
│              ┊ │A │●──────────●│Room  │               │
│              ┊ └──┘        ┊    └──────┘               │
│              └╌╌╌╌╌╌╌╌╌╌╌╌╌┘                           │
│                                                        │
│  Duct stretches to maintain external connection        │
│  Connection preserved, endpoint updates                │
└────────────────────────────────────────────────────────┘

Inspector - Group Properties
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────┐                      │
│  │ Group Properties             │                      │
│  ├──────────────────────────────┤                      │
│  │ Name: [Group 1__________]    │                      │
│  │                              │                      │
│  │ Members: 5 entities          │                      │
│  │   • Room A                   │                      │
│  │   • Room B                   │                      │
│  │   • Room C                   │                      │
│  │   • Duct 1                   │                      │
│  │   • Duct 2                   │                      │
│  │                              │                      │
│  │ Bounds:                      │                      │
│  │   X: 100", Y: 100"           │                      │
│  │   Width: 600", Height: 300"  │                      │
│  │                              │                      │
│  │ Locked: ☐                    │                      │
│  │ Collapsed: ☐                 │                      │
│  │                              │                      │
│  │ [Ungroup] [Edit Group]       │                      │
│  └──────────────────────────────┘                      │
└────────────────────────────────────────────────────────┘

Group Toolbar Controls
┌────────────────────────────────────────────────────────┐
│  Selection: 5 entities                                 │
│  ┌──────────────────────────────────────┐              │
│  │ [📁 Group]  [📂 Ungroup]             │              │
│  │  Ctrl+G     Ctrl+Shift+G             │              │
│  └──────────────────────────────────────┘              │
│                                                        │
│  Selection: Group 1                                    │
│  ┌──────────────────────────────────────┐              │
│  │ [📁 Group] (disabled)                │              │
│  │ [📂 Ungroup]  [✏️ Edit Group]        │              │
│  └──────────────────────────────────────┘              │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/commands/GroupCommand.test.ts`

**Test Cases**:
- Create group from selection
- Calculate group bounding box
- Update member parentGroup property
- Ungroup releases members
- Undo/redo group creation
- Prevent grouping single entity

**Assertions**:
- Group entity created correctly
- Bounding box encompasses all members
- All members reference parent group
- Members become independent on ungroup
- Undo removes group, redo recreates
- Error when < 2 entities selected

---

### Integration Tests
**File**: `src/__tests__/integration/group-entities.test.ts`

**Test Cases**:
- Complete group creation workflow
- Move group moves all members
- Enter group edit mode
- Edit individual member in group
- Ungroup and re-select members
- Nested group creation
- Group with external connections

**Assertions**:
- Group created with correct members
- All members reposition on group move
- Edit mode allows individual selection
- Member properties editable in group
- Ungroup restores independent entities
- Nested group moves all descendants
- External connections preserved

---

### E2E Tests
**File**: `e2e/selection-manipulation/group-entities.spec.ts`

**Test Cases**:
- Select entities, press Ctrl+G visually
- Group outline appears
- Drag group, all members move
- Double-click to enter edit mode
- Ctrl+Shift+G ungroups
- Visual nested group hierarchy

**Assertions**:
- Group bounding box visible
- Dotted outline around group
- Members move together on drag
- Edit mode shows solid outline
- Ungroup removes outline
- Nested group outlines nested

---

## Common Pitfalls

### ❌ Don't: Forget to update member positions on group move
**Problem**: Group moves but members stay in place (visual disconnect)

**Solution**: Recalculate all member positions when group transforms

---

### ❌ Don't: Allow circular group references
**Problem**: Group contains itself, infinite recursion, crashes

**Solution**: Validate group membership, prevent circular dependencies

---

### ❌ Don't: Delete member entities when grouping
**Problem**: Members removed from store, data lost

**Solution**: Keep members in store, mark with parentGroup property

---

### ✅ Do: Preserve external connections on group move
**Benefit**: Ducts remain connected to entities outside group

---

### ✅ Do: Support nested groups for complex hierarchies
**Benefit**: Organize large designs with multi-level structure

---

## Performance Tips

### Optimization: Batch Member Updates on Group Move
**Problem**: Moving group with 100 members triggers 100 separate updates

**Solution**: Batch all member position updates
- Calculate all new positions
- Apply in single transaction
- Single re-render
- 100x faster for large groups

---

### Optimization: Cache Group Bounding Box
**Problem**: Recalculating bounding box from 100 members every frame

**Solution**: Calculate once, cache until members change
- Store bounding box in group
- Invalidate on member add/remove/move
- Reuse cached value
- 50x faster rendering

---

### Optimization: Lazy Load Group Members in UI
**Problem**: Rendering 1000-member group tree in sidebar is slow

**Solution**: Virtual scrolling + expand on demand
- Show group collapsed initially
- Expand when clicked
- Render visible items only
- Smooth UI with huge groups

---

## Future Enhancements

- **Group Templates**: Save/load group configurations as templates
- **Smart Grouping**: Auto-group by proximity, layer, or type
- **Group Symbols**: Convert group to reusable symbol/component
- **Group Constraints**: Lock relative positions within group
- **Group Libraries**: Shared group components across projects
- **Group Alignment**: Align members within group automatically
- **Visual Group Styles**: Custom outline colors, fill, icons
- **Group Descriptions**: Add detailed notes to groups
- **Group Filtering**: Show/hide groups by criteria
- **Group Analytics**: Track usage, modifications, hierarchy depth
