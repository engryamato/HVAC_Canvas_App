# [UJ-EC-014] Set Entity Layer

## Overview

This user journey covers organizing entities into named layers for visibility control, enabling designers to isolate specific systems (supply, return, equipment) and reduce visual complexity.

## PRD References

- **FR-EC-014**: User shall be able to assign entities to layers
- **US-EC-014**: As a designer, I want to organize entities into layers so that I can manage complex designs
- **AC-EC-014-001**: Entities can be assigned to layers via Inspector
- **AC-EC-014-002**: Layers can be shown/hidden independently
- **AC-EC-014-003**: Default layers: Supply, Return, Equipment, Notes
- **AC-EC-014-004**: User can create custom layers
- **AC-EC-014-005**: Layer visibility controlled in left sidebar
- **AC-EC-014-006**: Hidden layer entities not selectable

## Prerequisites

- User is in Canvas Editor
- At least one entity exists on canvas
- Layers panel visible in left sidebar
- Entity selected for layer assignment

## User Journey Steps

### Step 1: Open Layers Panel

**User Action**: Click "Layers" tab in left sidebar

**Expected Result**:
- Layers panel opens:
  - Located in left sidebar
  - Replaces entity library view
  - Full panel height
- Default layers displayed:
  - ☑️ **Supply** (visible, 12 entities)
  - ☑️ **Return** (visible, 8 entities)
  - ☑️ **Equipment** (visible, 5 entities)
  - ☑️ **Notes** (visible, 3 entities)
  - ☐ **Background** (hidden, 1 entity)
- Layer controls:
  - Checkbox: Toggle visibility
  - Eye icon: Visual indicator
  - Entity count: Number in parentheses
  - Color swatch: Layer color
  - Lock icon: Lock/unlock layer
- Active layer indicator:
  - Current layer highlighted
  - New entities added to active layer
  - Default: Supply layer active
- Layer actions:
  - **+ New Layer**: Create custom layer
  - **Delete**: Remove custom layer
  - **Rename**: Rename layer
  - **Merge**: Combine layers
- Visual feedback:
  - Clean, organized list
  - Easy to scan
  - Tooltips on hover

**Validation Method**: E2E test - Verify layers panel display

---

### Step 2: Select Entity to Change Layer

**User Action**: Select Room A (currently on Supply layer)

**Expected Result**:
- Room A selected
- Selection state:
  - `selectedIds`: ['room-a']
  - Single entity selected
- Inspector displays:
  - Room properties
  - **Layer** dropdown:
    - Current: "Supply"
    - Options: Supply, Return, Equipment, Notes, Background, Custom1
    - Dropdown expandable
- Layer highlighted in panel:
  - Supply layer highlighted (entity's current layer)
  - Visual connection between entity and layer
- Status bar:
  - "1 entity selected (Supply layer)"

**Validation Method**: Integration test - Verify layer property in Inspector

---

### Step 3: Change Entity Layer

**User Action**: Change layer from "Supply" to "Equipment" via Inspector dropdown

**Expected Result**:
- Layer dropdown interaction:
  - Click dropdown
  - Options displayed
  - Select "Equipment"
  - Dropdown closes
- Entity updated:
  - `entityStore.updateEntity(roomId, { layer: "equipment" })`
  - Layer property: "supply" → "equipment"
  - Entity data modified
- Visual updates:
  - Room A rendering unchanged (same appearance)
  - Still visible (Equipment layer visible)
  - Position, size, color unchanged
- Layers panel updates:
  - **Supply**: Count 12 → 11
  - **Equipment**: Count 5 → 6
  - Counts reflect layer change
- Active layer:
  - Equipment layer becomes active
  - Highlighted in panel
  - New entities will use Equipment layer
- Undo command:
  - `UpdatePropertyCommand` (layer: "supply" → "equipment")
  - Added to history
  - Can undo layer change
- Status bar:
  - "Entity moved to Equipment layer"

**Validation Method**: Integration test - Verify layer assignment

---

### Step 4: Toggle Layer Visibility

**User Action**: Uncheck "Equipment" layer in layers panel

**Expected Result**:
- Layer checkbox interaction:
  - Click checkbox next to Equipment
  - Checkbox: ☑️ → ☐
  - Eye icon: 👁️ → 👁️‍🗨️ (crossed out)
- Layer visibility state:
  - `layerStore.setLayerVisibility('equipment', false)`
  - Equipment layer hidden
- Visual changes:
  - All Equipment layer entities hidden:
    - Room A (just moved to Equipment)
    - RTU-1, RTU-2, AHU-1
    - All 6 equipment layer entities
  - Canvas re-renders without equipment
  - Other layers still visible
- Selection handling:
  - Room A was selected
  - Room A now hidden
  - Selection cleared (can't select hidden entity)
  - Inspector shows empty state
- Entity interaction:
  - Hidden entities not clickable
  - Not included in marquee selection
  - Not rendered in hit-testing
  - Effectively invisible
- Performance:
  - Entities skipped in render loop
  - Faster rendering with fewer entities
  - No memory freed (still in store)
- Status bar:
  - "Equipment layer hidden (6 entities)"

**Validation Method**: E2E test - Verify layer visibility toggle

---

### Step 5: Re-show Layer

**User Action**: Check "Equipment" layer to make visible again

**Expected Result**:
- Layer checkbox interaction:
  - Click checkbox
  - Checkbox: ☐ → ☑️
  - Eye icon: 👁️‍🗨️ → 👁️
- Layer visibility state:
  - `layerStore.setLayerVisibility('equipment', true)`
  - Equipment layer visible
- Visual changes:
  - All Equipment layer entities reappear:
    - Room A, RTU-1, RTU-2, AHU-1
    - All 6 entities visible
  - Canvas re-renders with equipment
  - Entities at same positions as before hiding
- Entity interaction:
  - Entities clickable again
  - Included in selections
  - Fully interactive
- Previous selection:
  - Room A NOT automatically re-selected
  - User must click to select again
  - Prevents unexpected behavior
- Undo/redo:
  - Layer visibility changes NOT in undo history
  - View state, not data change
  - Persistent within session
- Status bar:
  - "Equipment layer visible (6 entities)"

**Validation Method**: Integration test - Verify layer re-show

---

## Edge Cases

### 1. Bulk Layer Assignment (Multi-Select)

**User Action**: Select 5 rooms, change all to Return layer

**Expected Behavior**:
- Multi-selection: 5 rooms selected
- Rooms currently on different layers:
  - Room A: Supply
  - Room B: Supply
  - Room C: Equipment
  - Room D: Notes
  - Room E: Supply
- Inspector shows:
  - "Multiple Rooms (5)"
  - Layer: "Mixed" (different layers)
  - Dropdown available
- User selects "Return":
  - All 5 rooms updated: `layer: "return"`
  - Single bulk operation
- Layer counts update:
  - Supply: -3 entities
  - Equipment: -1 entity
  - Notes: -1 entity
  - Return: +5 entities
- Undo handling:
  - `BulkUpdateCommand` with:
    - Entity IDs: [room-a, room-b, ...]
    - Property: 'layer'
    - Old values: ['supply', 'supply', 'equipment', 'notes', 'supply']
    - New value: 'return'
  - Single Ctrl+Z reverts all 5
- Visual:
  - All 5 rooms remain visible (Return layer visible)
  - No appearance change

**Validation Method**: Integration test - Verify bulk layer assignment

---

### 2. Create Custom Layer

**User Action**: Click "+ New Layer" in layers panel

**Expected Behavior**:
- New layer dialog opens:
  - **Name**: "Untitled Layer" (editable)
  - **Color**: Default color picker
  - **Visibility**: Visible (default)
  - **Lock**: Unlocked (default)
  - [Create] [Cancel] buttons
- User enters:
  - Name: "Electrical"
  - Color: #FFFF00 (yellow)
  - Click Create
- New layer created:
  - `layerStore.addLayer({ id: 'electrical', name: 'Electrical', color: '#FFFF00', visible: true, locked: false })`
  - Added to layer list
- Layers panel updates:
  - New layer appears: ☑️ **Electrical** (0 entities)
  - Sorted alphabetically or at end
  - Color swatch shows yellow
- Layer available:
  - Appears in Inspector layer dropdown
  - Can assign entities to Electrical
  - Active layer changes to Electrical
- Undo handling:
  - `CreateLayerCommand` with layer data
  - Can undo to remove custom layer
  - Entities on deleted layer move to default (Supply)

**Validation Method**: Integration test - Verify custom layer creation

---

### 3. Delete Layer with Entities

**User Action**: Delete "Equipment" layer which has 6 entities

**Expected Behavior**:
- Delete action:
  - Right-click Equipment layer
  - Select "Delete Layer"
  - Or: Select layer, press Delete key
- Confirmation dialog:
  - "Delete Equipment layer?"
  - "6 entities will be moved to Supply layer"
  - [Delete] [Cancel]
- User confirms:
  - Layer deleted: `layerStore.removeLayer('equipment')`
  - Removed from layer list
- Entity reassignment:
  - All 6 entities moved to default layer (Supply)
  - `updateEntity(id, { layer: 'supply' })` for each
  - Entities remain visible
  - No visual change (still rendered)
- Layer counts:
  - Equipment layer removed
  - Supply: +6 entities
- Undo handling:
  - `DeleteLayerCommand` with:
    - Layer data
    - Affected entity IDs
    - Previous layer assignments
  - Undo restores layer and assignments
- Restrictions:
  - Cannot delete default layers (Supply, Return, Equipment, Notes)
  - Only custom layers deletable
  - Prevents accidental data loss

**Validation Method**: Integration test - Verify layer deletion

---

### 4. Lock Layer to Prevent Edits

**User Action**: Click lock icon on Background layer

**Expected Behavior**:
- Lock interaction:
  - Click lock icon (🔓)
  - Icon changes: 🔓 → 🔒
  - Layer state: `locked: true`
- Layer locked:
  - `layerStore.updateLayer('background', { locked: true })`
  - Entities on Background layer locked
- Entity interaction:
  - Background entities visible (if layer visible)
  - NOT selectable (click passes through)
  - NOT movable
  - NOT editable
  - NOT deletable
- Visual feedback:
  - Locked entities render normally
  - Optional: Dimmed or grayed out
  - Lock icon overlay on hover
- Use cases:
  - Lock background reference image
  - Lock completed sections
  - Prevent accidental edits
- Unlock:
  - Click lock icon again
  - 🔒 → 🔓
  - Entities become editable
- Undo:
  - Lock state NOT in undo history
  - View/interaction state, not data

**Validation Method**: E2E test - Verify layer locking

---

### 5. Layer Visibility Affects Connections

**User Action**: Hide Supply layer, ducts on Supply layer disappear

**Expected Behavior**:
- Supply layer hidden:
  - All supply ducts hidden
  - 12 duct entities not rendered
- Connected entities:
  - Rooms on Return layer still visible
  - Rooms have connection points for supply ducts
  - Connection points appear disconnected (dangling)
- Visual handling:
  - **Option A (Show Dangling)**: Show connection point, no duct
    - Visual indicator: ⚠️ missing connection
    - User aware of hidden duct
  - **Option B (Hide Connection)**: Hide connection point too
    - Clean appearance
    - No visual clutter
- Default: Option A (show dangling connections)
- Recalculations:
  - Skip hidden entities in airflow calculations
  - Or: Include hidden entities in calculations
  - Default: Include (calculations independent of visibility)
- User workflow:
  - Hide Supply to focus on Return system
  - Design/edit Return layout
  - Show Supply again to verify integration

**Validation Method**: Integration test - Verify layer visibility with connections

---

## Error Scenarios

### 1. Attempt to Delete Default Layer

**Scenario**: User tries to delete "Supply" layer

**Expected Handling**:
- Delete action triggered
- Layer type check: `layer.isDefault === true`
- Default layers protected
- Error displayed:
  - Dialog: "Cannot delete default layer 'Supply'"
  - Explanation: "Default layers are required for the design"
  - [OK] button only
- Layer NOT deleted
- Entities unchanged
- User can:
  - Hide layer if desired
  - Cannot delete default layers
- Protected layers:
  - Supply
  - Return
  - Equipment
  - Notes
  - Background

**Validation Method**: Unit test - Verify default layer protection

---

### 2. Layer Name Collision

**Scenario**: User creates custom layer named "Supply" (same as default)

**Expected Handling**:
- Layer creation dialog:
  - User enters name: "Supply"
  - Clicks Create
- Name validation:
  - Check existing layer names
  - "Supply" already exists
  - Name collision detected
- Error display:
  - Field border: red
  - Error message: "Layer name 'Supply' already exists"
  - Cannot create
- User must:
  - Choose different name: "Supply Custom"
  - Or: Cancel creation
- Name uniqueness enforced:
  - Case-insensitive: "supply" = "Supply"
  - Trimmed whitespace: " Supply " = "Supply"
  - No duplicates allowed

**Validation Method**: Unit test - Verify layer name uniqueness

---

### 3. Hidden Layer Entity in Selection

**Scenario**: Entity selected, then layer hidden via panel

**Expected Handling**:
- Initial state:
  - Room A selected
  - Room A on Equipment layer
  - Equipment layer visible
- User hides Equipment layer:
  - Checkbox unchecked
  - Layer hidden
- Selection handling:
  - Room A now on hidden layer
  - Room A automatically deselected
  - Selection cleared: `selectedIds: []`
  - Inspector: Empty state
- Visual:
  - Selection outline disappears
  - Room A not visible
  - Canvas updates
- Re-show layer:
  - Equipment layer visible again
  - Room A visible
  - Room A NOT automatically re-selected
  - User must select again if desired
- Alternative behavior:
  - Keep selection, but gray out
  - Show "Selected entity on hidden layer" warning
  - Not recommended (confusing)

**Validation Method**: Integration test - Verify selection handling on hide

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Toggle Layers Panel | `L` |
| Toggle Layer 1 (Supply) | `Alt + 1` |
| Toggle Layer 2 (Return) | `Alt + 2` |
| Toggle Layer 3 (Equipment) | `Alt + 3` |
| Toggle Layer 4 (Notes) | `Alt + 4` |
| Create New Layer | `Ctrl/Cmd + Shift + L` |
| Move Selection to Layer | `Ctrl/Cmd + Shift + M` |

---

## Related Elements

- [LayersPanel](../../elements/01-components/sidebar/LayersPanel.md) - Layer management UI
- [layerStore](../../elements/02-stores/layerStore.md) - Layer state management
- [Layer](../../elements/03-entities/Layer.md) - Layer data structure
- [UpdatePropertyCommand](../../elements/09-commands/UpdatePropertyCommand.md) - Layer assignment undo
- [RenderService](../../elements/05-renderers/RenderService.md) - Layer-aware rendering
- [SelectionService](../../elements/11-services/SelectionService.md) - Layer-aware selection
- Detailed layer management documentation (pending canonical sidebar journey)

---

## Visual Diagram

```
Layers Panel UI
┌────────────────────────────────────────────────────────┐
│  Left Sidebar - Layers Tab                             │
│  ┌──────────────────────────────┐                      │
│  │ LAYERS                    [+]│                      │
│  ├──────────────────────────────┤                      │
│  │ ☑️ 🟦 Supply         (12) 🔓│ ← Active, visible     │
│  │ ☑️ 🟥 Return          (8) 🔓│                       │
│  │ ☑️ 🟩 Equipment       (6) 🔓│                       │
│  │ ☑️ 🟨 Notes           (3) 🔓│                       │
│  │ ☐ ⬜ Background       (1) 🔒│ ← Hidden, locked      │
│  │ ☑️ 🟧 Electrical      (0) 🔓│ ← Custom layer        │
│  └──────────────────────────────┘                      │
│                                                        │
│  Legend:                                               │
│  ☑️/☐ = Visibility toggle                              │
│  🟦 = Layer color swatch                               │
│  (12) = Entity count                                   │
│  🔓/🔒 = Lock status                                    │
│  [+] = New layer button                                │
└────────────────────────────────────────────────────────┘

Layer Assignment via Inspector
┌────────────────────────────────────────────────────────┐
│  Entity Selected: Room A                               │
│  ┌──────────────────────────────┐                      │
│  │ Inspector - Room Properties  │                      │
│  ├──────────────────────────────┤                      │
│  │ Name:   Office               │                      │
│  │ Width:  200"                 │                      │
│  │ Height: 150"                 │                      │
│  │ Layer:  [Supply      ▼]     │ ← Dropdown            │
│  │         ┌────────────────┐   │                      │
│  │         │ Supply         │   │ ← Options            │
│  │         │ Return         │   │                      │
│  │         │ Equipment      │   │                      │
│  │         │ Notes          │   │                      │
│  │         │ Background     │   │                      │
│  │         │ Electrical     │   │                      │
│  │         └────────────────┘   │                      │
│  └──────────────────────────────┘                      │
│                                                        │
│  Select "Equipment" → Entity moved to Equipment layer  │
└────────────────────────────────────────────────────────┘

Layer Visibility Toggle Flow
┌────────────────────────────────────────────────────────┐
│  1. All Layers Visible                                 │
│     Canvas shows:                                      │
│     - 12 Supply ducts (blue)                           │
│     - 8 Return ducts (red)                             │
│     - 6 Equipment units (green)                        │
│     - 3 Notes (yellow)                                 │
│                                                        │
│  2. Hide Equipment Layer                               │
│     Uncheck ☑️ Equipment                               │
│              ↓                                         │
│     Canvas shows:                                      │
│     - 12 Supply ducts (blue)                           │
│     - 8 Return ducts (red)                             │
│     - 3 Notes (yellow)                                 │
│     [6 Equipment units HIDDEN]                         │
│                                                        │
│  3. Re-show Equipment Layer                            │
│     Check ☐ Equipment                                  │
│           ↓                                            │
│     Canvas shows:                                      │
│     - 12 Supply ducts (blue)                           │
│     - 8 Return ducts (red)                             │
│     - 6 Equipment units (green) ← Reappear             │
│     - 3 Notes (yellow)                                 │
└────────────────────────────────────────────────────────┘

Bulk Layer Assignment
┌────────────────────────────────────────────────────────┐
│  Multi-Select: 5 Rooms                                 │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                  │
│  │ A  │ │ B  │ │ C  │ │ D  │ │ E  │                  │
│  └────┘ └────┘ └────┘ └────┘ └────┘                  │
│  Layer: Supply Supply Equip Notes Supply               │
│                                                        │
│  Inspector Shows:                                      │
│  ┌──────────────────────────────┐                      │
│  │ Multiple Rooms (5)           │                      │
│  │ Layer: [Mixed        ▼]     │ ← Different layers   │
│  └──────────────────────────────┘                      │
│                                                        │
│  User Selects: "Return"                                │
│  ↓                                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                  │
│  │ A  │ │ B  │ │ C  │ │ D  │ │ E  │                  │
│  └────┘ └────┘ └────┘ └────┘ └────┘                  │
│  Layer: Return Return Return Return Return             │
│                                                        │
│  Single undo command reverts all 5                     │
└────────────────────────────────────────────────────────┘

Layer Lock Behavior
┌────────────────────────────────────────────────────────┐
│  Background Layer: Locked 🔒                           │
│                                                        │
│  ┌────────────────────┐                                │
│  │  Reference Image   │ ← Visible but not selectable  │
│  │  (Background)      │                                │
│  └────────────────────┘                                │
│                                                        │
│  User clicks on image:                                 │
│  - Click passes through                                │
│  - Selects entity behind (if any)                      │
│  - Cannot select, move, or edit                        │
│                                                        │
│  Unlock 🔓 to make editable again                      │
└────────────────────────────────────────────────────────┘

Custom Layer Creation
┌────────────────────────────────────────────────────────┐
│  Click [+] New Layer                                   │
│  ↓                                                     │
│  ┌────────────────────────────┐                        │
│  │ Create New Layer           │                        │
│  ├────────────────────────────┤                        │
│  │ Name:     [Electrical___]  │                        │
│  │ Color:    [🟧] ← Picker    │                        │
│  │ Visible:  [☑️] Default on  │                        │
│  │ Locked:   [☐] Default off  │                        │
│  │                            │                        │
│  │      [Create]  [Cancel]    │                        │
│  └────────────────────────────┘                        │
│  ↓ Create                                              │
│  New layer added to list:                              │
│  ☑️ 🟧 Electrical (0) 🔓                                │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/stores/layerStore.test.ts`

**Test Cases**:
- Add new layer
- Update layer properties
- Delete custom layer
- Toggle layer visibility
- Lock/unlock layer
- Get entities by layer

**Assertions**:
- Layer created with unique ID
- Layer properties updated
- Custom layer deleted, entities reassigned
- Visibility state toggles correctly
- Locked layer prevents edits
- Correct entities returned for layer

---

### Integration Tests
**File**: `src/__tests__/integration/entity-layers.test.ts`

**Test Cases**:
- Assign entity to layer
- Bulk layer assignment
- Hide layer, entities disappear
- Show layer, entities reappear
- Delete layer with entities
- Layer visibility affects selection

**Assertions**:
- Entity layer property updated
- All selected entities moved to layer
- Hidden layer entities not rendered
- Visible layer entities rendered
- Deleted layer entities moved to default
- Cannot select hidden layer entities

---

### E2E Tests
**File**: `e2e/entity-creation/entity-layers.spec.ts`

**Test Cases**:
- Open layers panel
- Change entity layer via Inspector
- Toggle layer visibility
- Create custom layer
- Lock layer, verify not editable
- Delete custom layer

**Assertions**:
- Layers panel visible
- Inspector layer dropdown works
- Entity disappears when layer hidden
- New layer appears in panel
- Locked layer entities not clickable
- Custom layer removed from list

---

## Common Pitfalls

### ❌ Don't: Render hidden layer entities
**Problem**: Wasted rendering, performance hit

**Solution**: Skip hidden layer entities in render loop

---

### ❌ Don't: Allow selection of locked layer entities
**Problem**: User can select but not edit (confusing)

**Solution**: Skip locked layer entities in hit-testing

---

### ❌ Don't: Delete layer without reassigning entities
**Problem**: Orphaned entities with invalid layer reference

**Solution**: Move entities to default layer on layer delete

---

### ✅ Do: Use layer colors for visual organization
**Benefit**: Quick identification of entity types

---

### ✅ Do: Preserve layer visibility across sessions
**Benefit**: User preferences maintained

---

## Performance Tips

### Optimization: Skip Hidden Layer Entities in Render Loop
**Problem**: Rendering hidden entities wastes GPU cycles

**Solution**: Filter entities by layer visibility before rendering
- Check `layer.visible` before render
- Skip entire entity
- 50% faster rendering with half layers hidden

---

### Optimization: Layer-Based Spatial Index
**Problem**: Hit-testing scans all entities, including hidden

**Solution**: Separate spatial indexes per layer
- Quadtree per layer
- Only query visible layers
- 10x faster hit-testing with multiple hidden layers

---

### Optimization: Batch Layer Visibility Changes
**Problem**: Toggling 5 layers triggers 5 separate re-renders

**Solution**: Batch visibility updates
- Collect all changes
- Apply in single transaction
- Single re-render
- 5x faster for multi-layer toggle

---

## Future Enhancements

- **Layer Groups**: Organize layers into collapsible groups (HVAC, Electrical, Plumbing)
- **Layer Opacity**: Adjust transparency per layer
- **Layer Blending Modes**: Overlay, multiply for visual effects
- **Layer Templates**: Save/load layer configurations
- **Layer Import/Export**: Share layer setups across projects
- **Layer Filters**: Filter entities by layer in search
- **Layer-Based Permissions**: Restrict editing by layer
- **Layer Snapshots**: Save layer visibility states as named views
- **Auto-Layer Assignment**: Assign entities to layers based on type
- **Layer Color Coding**: Auto-color entities based on layer
