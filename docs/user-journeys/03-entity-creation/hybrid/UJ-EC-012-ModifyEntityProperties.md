# [UJ-EC-012] Modify Entity Properties

## Overview

This user journey covers editing entity properties through the Inspector panel, enabling users to customize entity characteristics such as name, dimensions, airflow, color, and other type-specific attributes.

## PRD References

- **FR-EC-012**: User shall be able to modify entity properties via Inspector
- **US-EC-012**: As a designer, I want to edit entity properties so that I can customize entities for my design
- **AC-EC-012-001**: Inspector displays all editable properties for selected entity
- **AC-EC-012-002**: Property changes update entity in real-time
- **AC-EC-012-003**: Property changes are undoable
- **AC-EC-012-004**: Invalid property values show validation errors
- **AC-EC-012-005**: Multi-select shows common properties
- **AC-EC-012-006**: Property changes trigger canvas re-render

## Prerequisites

- User is in Canvas Editor with entity selected
- Inspector panel visible on right sidebar
- Selected entity type has editable properties
- User has permission to edit entity

## User Journey Steps

### Step 1: Select Entity to Edit

**User Action**: Click on Room A (200×150 at position 100, 100)

**Expected Result**:

- Room A selected
- Selection state:
  - `selectedIds`: ['room-a']
  - Selection count: 1
- Inspector panel activates:
  - Title: "Room Properties"
  - Entity type indicator: "Room"
  - Property sections expanded
- Property fields populated:
  - **Name**: "Office" (text input)
  - **Width**: "200\"" (number input)
  - **Height**: "150\"" (number input)
  - **Supply CFM**: "500" (number input)
  - **Return CFM**: "450" (number input)
  - **Color**: #E0E0E0 (color picker)
  - **Fill Opacity**: 80% (slider)
  - **Border Width**: 2px (number input)
  - **Notes**: "" (text area)
- All fields editable:
  - Cursor changes on hover
  - Click activates input
  - Tab navigation between fields
- Visual feedback:
  - Blue selection outline on canvas
  - Inspector synchronized with entity

**Validation Method**: E2E test - Verify Inspector populates with entity properties

---

### Step 2: Modify Name Property

**User Action**: Change name from "Office" to "Conference Room"

**Expected Result**:

- Name field interaction:
  - Click in name field
  - Field becomes focused (blue border)
  - Text cursor appears
  - Select all existing text
  - Type "Conference Room"
- Real-time update:
  - Entity name updates as user types (debounced)
  - Or: Updates on blur/Enter key
- Entity store updated:
  - `entityStore.updateEntity(roomId, { name: "Conference Room" })`
  - Entity object modified
  - Re-render triggered
- Canvas updates:
  - Room label displays "Conference Room"
  - Label resizes to fit new text
  - Layout adjusts if necessary
- Undo command created:
  - `UpdatePropertyCommand` with:
    - Entity ID: 'room-a'
    - Property: 'name'
    - Old value: "Office"
    - New value: "Conference Room"
  - Added to history stack
- Status feedback:
  - Status bar: "Property updated"
  - Or: No message (silent update)

**Validation Method**: Integration test - Verify name property update

---

### Step 3: Modify Dimension Properties

**User Action**: Change width from 200" to 250"

**Expected Result**:

- Width field interaction:
  - Click in width field
  - Field focused
  - Current value: "200"
  - Type "250"
- Validation:
  - Input: "250"
  - Parsed as number: 250
  - Validation rules:
    - Minimum: 12" (1 foot)
    - Maximum: 1200" (100 feet)
    - Value 250 is valid
  - No error displayed
- Entity updates:
  - `entityStore.updateEntity(roomId, { width: 250 })`
  - Room resizes on canvas
  - Position: (100, 100) - unchanged
  - New size: 250×150
- Visual update:
  - Room grows 50" to the right
  - Resize handles reposition
  - Grid snapping (if enabled)
  - Connected ducts adjust endpoints
- Dependent calculations:
  - Area: 250×150 = 37,500 sq in = 260 sq ft
  - Perimeter: 2(250+150) = 800"
  - CFM/sq ft: 500/260 = 1.92
- Inspector updates:
  - Calculated fields refresh
  - Area displayed: "260 sq ft"
- Undo command:
  - `UpdatePropertyCommand` (width: 200 → 250)
  - Added to history

**Validation Method**: Integration test - Verify dimension update and canvas resize

---

### Step 4: Modify Airflow Properties

**User Action**: Change Supply CFM from 500 to 750

**Expected Result**:

- CFM field interaction:
  - Click in Supply CFM field
  - Type "750"
  - Press Enter or Tab
- Validation:
  - Input: "750"
  - CFM validation rules:
    - Minimum: 0 CFM
    - Maximum: 50,000 CFM (reasonable limit)
    - Value 750 is valid
  - No errors
- Entity updates:
  - `entityStore.updateEntity(roomId, { supplyCFM: 750 })`
  - Property saved
- Downstream effects:
  - **BOM Recalculation**: Equipment sizing may change
  - **Duct Sizing**: Connected supply duct resizes
    - 750 CFM at 800 FPM = 1.13 sq ft = 12" diameter
    - Duct updates from 10" to 12"
  - **Airflow Balance**: Total CFM updated in calculations
- Visual updates:
  - Connected duct thickens (10" → 12")
  - BOM panel updates equipment
  - Calculations panel refreshes
- Inspector updates:
  - CFM/sq ft: 750/260 = 2.88
  - Warning if exceeds 3 CFM/sq ft: "High airflow density"
- Undo command:
  - `UpdatePropertyCommand` (supplyCFM: 500 → 750)

**Validation Method**: Integration test - Verify airflow update and dependent calculations

---

### Step 5: Modify Color Property

**User Action**: Change color from #E0E0E0 (light gray) to #B3D9FF (light blue)

**Expected Result**:

- Color picker interaction:
  - Click on color swatch
  - Color picker modal opens
  - Current color: #E0E0E0
  - User selects blue: #B3D9FF
  - Click "Apply" or click outside
- Color picker closes
- Entity updates:
  - `entityStore.updateEntity(roomId, { color: "#B3D9FF" })`
  - Color property saved
- Canvas re-renders:
  - Room fill color changes to light blue
  - Border color adjusts (darker blue)
  - Label text color adjusts for contrast
  - Immediate visual feedback
- Accessibility:
  - Contrast ratio checked
  - If text unreadable, auto-adjust text color
  - WCAG AA compliance
- Undo command:
  - `UpdatePropertyCommand` (color: "#E0E0E0" → "#B3D9FF")
- Status feedback:
  - Color swatch in Inspector shows new color

**Validation Method**: E2E test - Verify color picker and canvas color update

---

## Edge Cases

### 1. Invalid Property Value

**User Action**: Enter width "-50" (negative number)

**Expected Behavior**:

- Input validation triggers:
  - Value: -50
  - Minimum: 12
  - Validation fails: value < minimum
- Error displayed:
  - Field border turns red
  - Error message below field: "Width must be at least 12\""
  - Icon indicator (⚠️)
- Value not saved:
  - Entity not updated
  - Canvas unchanged
  - No undo command created
- User must correct:
  - Type valid value (e.g., 200)
  - Or: Press Escape to revert to original
- Field reverts on blur:
  - If invalid value on blur, revert to previous valid value
  - Show toast: "Invalid value reverted"

**Validation Method**: Unit test - Verify validation prevents invalid values

---

### 2. Multi-Select Property Edit

**User Action**: Select 3 rooms, change Supply CFM to 600

**Expected Behavior**:

- Multi-selection: Rooms A, B, C selected
- Inspector shows:
  - Title: "Multiple Rooms (3)"
  - Common properties only
  - **Name**: "(Multiple values)" (disabled)
  - **Supply CFM**: 500, 450, 500 → "Mixed"
  - User changes to 600
- Bulk update:
  - All 3 rooms updated: `supplyCFM: 600`
  - Single transaction
  - Single undo command
- Canvas updates:
  - All 3 rooms' connected ducts resize
  - BOM recalculates for all
  - All entities re-render
- Undo handling:
  - `BulkUpdateCommand` with:
    - Entity IDs: ['room-a', 'room-b', 'room-c']
    - Property: 'supplyCFM'
    - Old values: [500, 450, 500]
    - New value: 600
  - Single Ctrl+Z reverts all 3

**Validation Method**: Integration test - Verify bulk property update

---

### 3. Property Change Affects Connections

**User Action**: Resize room smaller, connected duct endpoint outside bounds

**Expected Behavior**:

- Original: Room 200×150, duct connects to right edge (200, 75)
- Resize: Width 200 → 120
- Connection issue:
  - Duct endpoint at (200, 75)
  - Room right edge now at (120, 75)
  - Endpoint outside room bounds
- Auto-adjustment:
  - **Option A (Snap to Edge)**: Move endpoint to (120, 75)
    - Duct endpoint snaps to new edge
    - Connection preserved
  - **Option B (Detach)**: Disconnect duct
    - Mark duct as orphaned
    - Show warning icon
    - User must manually reconnect
- Default: Option A (snap to edge)
- Validation:
  - Check all connected entities
  - Adjust endpoints as needed
  - Maintain connection integrity

**Validation Method**: Integration test - Verify connection handling on resize

---

### 4. Dependent Calculation Update

**User Action**: Change room dimensions, area-dependent properties recalculate

**Expected Behavior**:

- Original: 200×150 = 260 sq ft, 500 CFM = 1.92 CFM/sq ft
- Change: Width 200 → 300
- New area: 300×150 = 390 sq ft
- Recalculations:
  - CFM/sq ft: 500/390 = 1.28
  - Duct size unchanged (based on CFM, not area)
  - Equipment sizing may change if area-based
- Inspector updates:
  - Area: "260 sq ft" → "390 sq ft"
  - CFM/sq ft: "1.92" → "1.28"
  - All calculated fields refresh
- BOM updates:
  - If equipment sized by area, update
  - Recalculate tonnage if needed
- Performance:
  - Calculations debounced during drag
  - Final calculation on release
  - No lag during resize

**Validation Method**: Integration test - Verify dependent calculations

---

### 5. Rapid Property Changes

**User Action**: Type in width field rapidly: 200 → 210 → 220 → 230 → 240 → 250

**Expected Behavior**:

- Input debouncing:
  - User types: 2, 5, 0
  - Each keystroke triggers onChange
  - Debounce timer: 300ms
  - Only update entity after 300ms of inactivity
- Result:
  - Intermediate values (2, 25) not saved
  - Final value (250) saved after debounce
  - Single entity update
- Undo handling:
  - **Option A (Single Command)**: One undo for entire edit session
    - From focus to blur = single edit
    - Width 200 → 250 (one undo)
  - **Option B (Each Update)**: Multiple undos
    - Each debounced update creates undo
    - May have multiple commands
- Default: Option A (single command per field edit)
- Performance:
  - Canvas updates debounced
  - Smooth typing experience
  - No jank or lag

**Validation Method**: Performance test - Verify debouncing and smooth updates

---

## Error Scenarios

### 1. Property Update Fails Validation

**Scenario**: Enter invalid CFM value "abc" (non-numeric)

**Expected Handling**:

- Input: "abc"
- Parsing: parseInt("abc") = NaN
- Validation: isNaN(value) = true → invalid
- Error display:
  - Field border: red
  - Error message: "CFM must be a number"
  - Field value remains "abc" (allows correction)
- Entity not updated:
  - No store mutation
  - Canvas unchanged
- User corrects:
  - Clear "abc", type "600"
  - Validation passes
  - Entity updates
- Alternate: Auto-sanitize
  - Strip non-numeric characters
  - "abc" becomes ""
  - Show warning: "Invalid characters removed"

**Validation Method**: Unit test - Verify validation error handling

---

### 2. Circular Dependency in Calculations

**Scenario**: Property A depends on B, B depends on A (circular)

**Expected Handling**:

- Example:
  - Room area = width × height
  - Width = area / height
  - Height = area / width
  - Potential circular calculation
- Prevention:
  - Calculation graph is acyclic
  - Direct properties (width, height) are inputs
  - Derived properties (area) are outputs
  - No reverse calculations
- If circular dependency exists:
  - Detect during calculation
  - Break cycle by caching previous value
  - Log warning: "Circular dependency detected"
  - Prevent infinite loop
- Fallback:
  - Use last valid calculated value
  - Show error in Inspector: "Calculation error"
  - Highlight affected fields

**Validation Method**: Unit test - Verify circular dependency prevention

---

### 3. Concurrent Property Updates

**Scenario**: User edits name while auto-calculation updates area

**Expected Handling**:

- Concurrent updates:
  - User types: name "Office" → "Conference Room"
  - Background: Area recalculates due to dimension change
- Store transaction handling:
  - Both updates merged:
    - `updateEntity({ name: "Conference Room", area: 390 })`
  - Atomic update
  - No race condition
- Undo handling:
  - Separate commands:
    - `UpdatePropertyCommand` (name)
    - `UpdatePropertyCommand` (area)
  - Sequential in history
  - Can undo independently
- No data loss:
  - Both changes preserved
  - Inspector shows both updates
  - Canvas reflects both

**Validation Method**: Integration test - Verify concurrent update handling

---

## Keyboard Shortcuts

| Action | Shortcut |
| :--- | :--- |
| Focus First Inspector Field | `Ctrl/Cmd + I` |
| Next Field | `Tab` |
| Previous Field | `Shift + Tab` |
| Apply Changes | `Enter` |
| Revert Changes | `Escape` |
| Toggle Inspector Panel | `Ctrl/Cmd + Shift + I` |

---

## Related Journeys

- [Select Single Entity](../04-selection-and-manipulation/UJ-SM-001-SelectSingleEntity.md)
- [Select Multiple Entities](../04-selection-and-manipulation/UJ-SM-002-SelectMultipleEntities.md)
- [Draw Room](./UJ-EC-001-DrawRoom.md)

---

## Related Elements

### Components

- [Inspector](../../../elements/01-components/inspector/Inspector.md)
- [PropertyEditor](../../../elements/01-components/inspector/PropertyEditor.md)

### Services

- [ValidationService](../../../elements/11-services/ValidationService.md)
- [CalculationEngine](../../../elements/11-services/CalculationEngine.md)

### Stores

- [entityStore](../../../elements/02-stores/entityStore.md)

### Commands

- [UpdatePropertyCommand](../../../elements/09-commands/UpdatePropertyCommand.md)

---

## Visual Diagram

```text
Property Update Flow
┌────────────────────────────────────────────────────────┐
│  1. User Selects Entity                                │
│     ┌─────────┐                                        │
│     │  Room   │ ← Selected                             │
│     └─────────┘                                        │
│          ↓                                             │
│  2. Inspector Populates                                │
│     ┌──────────────────┐                               │
│     │ Inspector Panel  │                               │
│     ├──────────────────┤                               │
│     │ Name: Office     │ ← Field populated             │
│     │ Width: 200"      │                               │
│     │ Height: 150"     │                               │
│     │ Supply: 500 CFM  │                               │
│     │ Color: #E0E0E0   │                               │
│     └──────────────────┘                               │
│          ↓                                             │
│  3. User Edits Field                                   │
│     Name: "Office" → "Conference Room"                 │
│          ↓                                             │
│  4. Validation                                         │
│     ✓ Valid string, length > 0                         │
│          ↓                                             │
│  5. Entity Store Update                                │
│     entityStore.updateEntity(id, { name: "..." })      │
│          ↓                                             │
│  6. Canvas Re-render                                   │
│     ┌─────────────────────┐                            │
│     │ Conference Room     │ ← Label updated            │
│     └─────────────────────┘                            │
│          ↓                                             │
│  7. Undo Command Created                               │
│     UpdatePropertyCommand(name: "Office" → "...")      │
└────────────────────────────────────────────────────────┘

Multi-Select Property Update:
┌────────────────────────────────────────────────────────┐
│  Selected: 3 Rooms                                     │
│  ┌────┐  ┌────┐  ┌────┐                               │
│  │ A  │  │ B  │  │ C  │                               │
│  └────┘  └────┘  └────┘                               │
│  CFM:      500     450     500                         │
│                                                        │
│  Inspector Shows:                                      │
│  ┌──────────────────┐                                 │
│  │ Multiple Rooms(3)│                                 │
│  ├──────────────────┤                                 │
│  │ Supply: Mixed    │ ← Different values              │
│  └──────────────────┘                                 │
│                                                        │
│  User Changes to: 600 CFM                              │
│           ↓                                            │
│  All 3 Rooms Updated:                                 │
│  ┌────┐  ┌────┐  ┌────┐                               │
│  │ A  │  │ B  │  │ C  │                               │
│  └────┘  └────┘  └────┘                               │
│  CFM:      600     600     600                         │
│                                                        │
│  Single Undo Command:                                 │
│  BulkUpdateCommand([A,B,C], CFM: [500,450,500]→600)   │
└────────────────────────────────────────────────────────┘

Validation Flow:
┌────────────────────────────────────────────────────────┐
│  User Input: "-50" (negative width)                    │
│       ↓                                                │
│  Parse: -50                                            │
│       ↓                                                │
│  Validate: -50 < 12 (minimum) → FAIL                   │
│       ↓                                                │
│  Display Error:                                        │
│  ┌──────────────────┐                                 │
│  │ Width: -50   ⚠️  │ ← Red border                     │
│  │ Min: 12"         │ ← Error message                  │
│  └──────────────────┘                                 │
│       ↓                                                │
│  User Corrects: "200"                                  │
│       ↓                                                │
│  Validate: 200 ≥ 12 → PASS                             │
│       ↓                                                │
│  Update Entity: width = 200                            │
│       ↓                                                │
│  Clear Error, Update Canvas                            │
└────────────────────────────────────────────────────────┘

Dependent Calculation Update:
┌────────────────────────────────────────────────────────┐
│  Initial State:                                        │
│  Width: 200", Height: 150"                             │
│  Area: 260 sq ft (calculated)                          │
│  Supply: 500 CFM                                       │
│  CFM/sq ft: 1.92 (calculated)                          │
│                                                        │
│  User Changes Width: 200" → 300"                       │
│       ↓                                                │
│  Trigger Recalculations:                               │
│  - Area: 300×150 = 390 sq ft                           │
│  - CFM/sq ft: 500/390 = 1.28                           │
│       ↓                                                │
│  Inspector Auto-Updates:                               │
│  ┌──────────────────┐                                 │
│  │ Width: 300"      │ ← User changed                   │
│  │ Height: 150"     │                                  │
│  │ Area: 390 sq ft  │ ← Recalculated                   │
│  │ Supply: 500 CFM  │                                  │
│  │ CFM/ft²: 1.28    │ ← Recalculated                   │
│  └──────────────────┘                                 │
│       ↓                                                │
│  BOM Updates (if area-based equipment)                 │
│  Canvas Re-renders with new dimensions                 │
└────────────────────────────────────────────────────────┘

Color Picker Interaction:
┌────────────────────────────────────────────────────────┐
│  Inspector Color Field:                                │
│  ┌────────────────────┐                                │
│  │ Color: ░░░░░░ ▼   │ ← Swatch (light gray)           │
│  └────────────────────┘                                │
│       ↓ Click                                          │
│  Color Picker Opens:                                   │
│  ┌────────────────────────┐                            │
│  │  Color Picker          │                            │
│  │  ┌──────────────────┐  │                            │
│  │  │   [Color Wheel]  │  │                            │
│  │  └──────────────────┘  │                            │
│  │  Hex: #E0E0E0          │                            │
│  │  RGB: 224, 224, 224    │                            │
│  │  [Apply] [Cancel]      │                            │
│  └────────────────────────┘                            │
│       ↓ Select Blue #B3D9FF                            │
│  Color Updates:                                        │
│  ┌────────────────────┐                                │
│  │ Color: ░░░░░░ ▼   │ ← Swatch (light blue)           │
│  └────────────────────┘                                │
│       ↓                                                │
│  Canvas Re-renders:                                    │
│  ┌─────────────────────┐                               │
│  │   Conference Room   │ ← Blue background             │
│  └─────────────────────┘                               │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/commands/UpdatePropertyCommand.test.ts`

**Test Cases**:
- Update single property
- Update multiple properties
- Property validation
- Invalid value rejection
- Undo/redo property change
- Bulk property update

**Assertions**:
- Entity property updated in store
- Old value preserved for undo
- Invalid values not saved
- Validation errors displayed
- Undo restores old value
- Bulk update affects all selected entities

---

### Integration Tests
**File**: `src/__tests__/integration/modify-entity-properties.test.ts`

**Test Cases**:
- Complete property edit workflow
- Dependent calculation updates
- Connection adjustments on resize
- Multi-select bulk edit
- Rapid property changes (debouncing)
- Canvas re-render on property change

**Assertions**:
- Inspector populates correctly
- Property changes persist
- Calculations update automatically
- Connections adjust with resize
- Bulk edits apply to all entities
- Canvas reflects property changes immediately

---

### E2E Tests
**File**: `e2e/entity-creation/modify-properties.spec.ts`

**Test Cases**:
- Edit room name via Inspector
- Change dimensions and verify canvas resize
- Update CFM and verify duct sizing
- Change color and verify visual update
- Multi-select edit
- Validation error display

**Assertions**:
- Inspector fields editable
- Name change visible on canvas
- Resize visible (entity grows/shrinks)
- Duct thickness changes with CFM
- Color change visible immediately
- Error messages appear for invalid values

---

## Common Pitfalls

### ❌ Don't: Update entity on every keystroke
**Problem**: Excessive re-renders, poor performance

**Solution**: Debounce input, update on blur or after 300ms inactivity

---

### ❌ Don't: Allow invalid values to be saved
**Problem**: Data corruption, calculation errors

**Solution**: Validate before saving, show errors, prevent save on invalid

---

### ❌ Don't: Forget to update dependent calculations
**Problem**: Stale calculated values, incorrect data

**Solution**: Trigger recalculation on any dependency change

---

### ✅ Do: Group related property changes into single undo
**Benefit**: Better undo/redo experience, cleaner history

---

### ✅ Do: Show real-time preview of property changes
**Benefit**: Immediate visual feedback, better user experience

---

## Performance Tips

### Optimization: Debounce Input Updates
**Problem**: Updating entity on every keystroke causes 60+ updates/second

**Solution**: Debounce input changes by 300ms
- Collect keystroke events
- Wait for 300ms pause
- Apply single update
- 95% fewer entity updates

---

### Optimization: Batch Dependent Calculations
**Problem**: Multiple property changes trigger multiple recalculations

**Solution**: Batch all calculations into single pass
- Collect all property changes
- Recalculate once
- Update all dependent fields
- 10x faster for multi-property edits

---

### Optimization: Selective Canvas Re-render
**Problem**: Property change re-renders entire canvas unnecessarily

**Solution**: Only re-render affected entity
- Identify changed entity
- Clear and redraw only that region
- Skip full canvas clear
- 50x faster for single entity updates

---

## Future Enhancements

- **Property Presets**: Save/load common property configurations
- **Property Templates**: Apply template to multiple entities
- **Property History**: View history of all changes to property
- **Property Linking**: Link properties across entities (change one, update all)
- **Advanced Validation**: Custom validation rules per entity type
- **Property Search**: Search entities by property value
- **Bulk Edit Dialog**: Edit multiple entities with advanced filters
- **Property Expressions**: Use formulas for calculated properties
- **Property Locking**: Lock individual properties to prevent editing
- **Property Comments**: Add notes explaining property values
