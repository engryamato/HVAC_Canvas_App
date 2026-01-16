# User Journey: Editing Equipment Properties

## 1. Overview

### Purpose
This document describes the complete workflow for viewing and editing properties of equipment entities on the HVAC Canvas. Users can modify equipment specifications, model numbers, performance characteristics, and custom properties through the Properties Panel. Changes are validated in real-time and automatically reflected in calculations and BOM.

### Scope
- Selecting equipment to view properties
- Understanding the Properties Panel layout
- Editing standard equipment properties (name, model, CFM, voltage, etc.)
- Using property type-specific controls (dropdowns, number inputs, text fields)
- Real-time validation and error feedback
- Applying or canceling property changes
- Undo/redo support for property edits
- Property change propagation to calculations and BOM
- Batch editing multiple equipment items
- Custom property creation and editing

### User Personas
- **Primary**: HVAC designers specifying equipment characteristics
- **Secondary**: Engineers adjusting technical specifications
- **Tertiary**: Estimators updating cost and model information

### Success Criteria
- User can easily locate and select equipment to edit properties
- Properties Panel displays all relevant editable fields
- Input validation prevents invalid values
- Changes apply immediately with visual feedback
- Undo/redo works correctly for property changes
- BOM and calculations update automatically after edits
- User understands which properties are required vs. optional
- Batch editing enables efficient multi-equipment updates

## 2. PRD References

### Related PRD Sections
- **Section 3.1: Canvas-Based Design** - Entity selection and interaction
- **Section 3.5: Properties Panel** - Property editing interface
- **Section 4.4: Entity Management** - Equipment data model
- **Section 4.5: Validation** - Input validation rules
- **Section 5.4: Right Sidebar** - Properties Panel location
- **Section 6.3: Calculations Engine** - Property impact on calculations

### Key Requirements Addressed
- REQ-PE-001: Users must be able to edit all equipment properties via Properties Panel
- REQ-PE-002: Properties Panel must display context-appropriate fields for selected equipment type
- REQ-PE-003: Real-time validation must prevent invalid property values
- REQ-PE-004: Property changes must trigger calculation and BOM updates
- REQ-PE-005: Undo/redo must support property edits
- REQ-PE-006: Batch editing must allow updating multiple equipment items simultaneously
- REQ-PE-007: Required properties must be clearly indicated
- REQ-PE-008: Property changes must persist automatically

## 3. Prerequisites

### User Prerequisites
- User has created or opened a project with equipment on canvas
- User understands basic equipment types and their properties
- User has equipment selected or knows how to select equipment

### System Prerequisites
- Canvas Page loaded with at least one equipment entity
- Properties Panel visible in right sidebar
- EntityStore populated with equipment data
- Validation service initialized

### Data Prerequisites
- Equipment entity exists with valid data structure
- Equipment type definition includes property schema
- Manufacturer and model data available for dropdowns

### Technical Prerequisites
- Form validation library initialized (Zod schemas)
- Property change events properly wired to stores
- Undo/redo command system active

## 4. User Journey Steps

### Step 1: Selecting Equipment to Edit Properties

**User Actions:**
1. User locates equipment item on canvas to edit
2. User clicks on equipment entity to select it
3. User observes equipment highlight and Properties Panel update
4. User confirms correct equipment selected by checking panel title

**System Response:**
1. System detects click on equipment entity
2. System updates EntityStore selection state:
   - Previous selection cleared
   - Clicked entity added to `selectedEntities` array
3. System applies visual selection indicator to entity:
   - Blue outline (2px solid) around equipment
   - Selection handles at corners (for resize, if applicable)
4. System retrieves entity data from EntityStore by ID
5. System determines entity type: "Air Handler Unit"
6. System loads property schema for entity type
7. System updates Properties Panel in right sidebar:
   - Panel title: "Air Handler Unit Properties"
   - Displays all editable properties for AHU type
   - Populates form fields with current values
8. System highlights right sidebar to draw attention (brief pulse animation)
9. System enables property editing mode

**Visual State:**

```
Canvas with Selected Equipment:

┌────────────────────────────────────────────────────────┐
│                                                        │
│           ┌─────────────────────┐                     │
│           │ ╔═══════════════╗   │ ← Blue selection    │
│           │ ║               ║   │    outline          │
│           │ ║   AHU-1       ║   │                     │
│           │ ║  York MCA     ║   │                     │
│           │ ║  5000 CFM     ║   │                     │
│           │ ╚═══════════════╝   │                     │
│           └─────────────────────┘                     │
│                  ▪ ▪ ▪ ← Selection handles            │
│                                                        │
└────────────────────────────────────────────────────────┘

Properties Panel (Right Sidebar):

┌────────────────────────────────────┐
│ Air Handler Unit Properties        │
│ ──────────────────────────────     │
│                                    │
│ Equipment ID: AHU-1                │
│                                    │
│ Name: *                            │
│ ┌────────────────────────────────┐ │
│ │ AHU-1                          │ │
│ └────────────────────────────────┘ │
│                                    │
│ Manufacturer: *                    │
│ ┌────────────────────────────────┐ │
│ │ York ▼                         │ │
│ └────────────────────────────────┘ │
│                                    │
│ Model: *                           │
│ ┌────────────────────────────────┐ │
│ │ MCA Series ▼                   │ │
│ └────────────────────────────────┘ │
│                                    │
│ Airflow (CFM): *                   │
│ ┌────────────────────────────────┐ │
│ │ 5000                           │ │
│ └────────────────────────────────┘ │
│                                    │
│ [More properties below...]         │
└────────────────────────────────────┘
```

**User Feedback:**
- Visual selection highlight confirms correct equipment selected
- Properties Panel title shows equipment type
- Equipment ID displayed for reference
- Form fields populated with current values
- Required fields marked with asterisk (*)

**Related Elements:**
- Components: `CanvasEntity`, `PropertiesPanel`, `SelectionOutline`
- Stores: `EntityStore` (selectedEntities), `LayoutStore`
- Services: `SelectionService`, `PropertyService`
- Events: `EntitySelectedEvent`

### Step 2: Viewing and Understanding Property Fields

**User Actions:**
1. User scrolls through Properties Panel to review all available properties
2. User identifies required vs. optional fields
3. User notes field types: text inputs, dropdowns, number inputs, checkboxes
4. User reads field labels and help tooltips

**System Response:**
1. System displays properties organized into logical sections:

   **Section: Basic Information**
   - Name (text input, required)
   - Equipment Tag (text input, optional)
   - Description (textarea, optional)

   **Section: Manufacturer & Model**
   - Manufacturer (dropdown, required)
   - Model (dropdown, required - filtered by manufacturer)
   - Series (text input, optional)

   **Section: Performance Specifications**
   - Airflow (CFM) (number input, required)
   - Static Pressure (in. w.g.) (number input, optional)
   - Cooling Capacity (Tons) (number input, required for cooling units)
   - Heating Capacity (BTU/h) (number input, optional)

   **Section: Electrical**
   - Voltage (dropdown: 120V, 208V, 240V, 480V, required)
   - Phase (dropdown: Single, Three, required)
   - Full Load Amps (FLA) (number input, calculated or manual)

   **Section: Physical**
   - Width (inches) (number input, optional)
   - Height (inches) (number input, optional)
   - Depth (inches) (number input, optional)
   - Weight (lbs) (number input, optional)

   **Section: Cost & Procurement**
   - Unit Cost ($) (number input, optional)
   - Lead Time (days) (number input, optional)
   - Supplier (text input, optional)

   **Section: Custom Properties**
   - [User-defined fields]
   - [+ Add Custom Property] button

2. System displays field-level help:
   - Info icons (ⓘ) next to labels
   - Hover shows tooltip with description and valid ranges
   - Required fields marked with red asterisk (*)

3. System shows current values for all fields:
   - Populated from entity data
   - Empty fields show placeholder text
   - Calculated fields show "Auto" badge if not manually set

4. System displays validation hints:
   - Minimum/maximum ranges shown below number inputs
   - Dropdown options filtered based on context
   - Format examples for text inputs

**Visual State:**

```
Properties Panel - Full View:

┌────────────────────────────────────┐
│ Air Handler Unit Properties    [×] │
│ ──────────────────────────────     │
│                                    │
│ ▼ Basic Information                │
│   Name: * ⓘ                        │
│   ┌──────────────────────────────┐ │
│   │ AHU-1                        │ │
│   └──────────────────────────────┘ │
│                                    │
│   Equipment Tag:                   │
│   ┌──────────────────────────────┐ │
│   │ AHU-FLOOR-2-ZONE-A           │ │
│   └──────────────────────────────┘ │
│                                    │
│ ▼ Manufacturer & Model             │
│   Manufacturer: * ⓘ                │
│   ┌──────────────────────────────┐ │
│   │ York ▼                       │ │
│   └──────────────────────────────┘ │
│                                    │
│   Model: * ⓘ                       │
│   ┌──────────────────────────────┐ │
│   │ MCA 500 ▼                    │ │
│   └──────────────────────────────┘ │
│                                    │
│ ▼ Performance Specifications       │
│   Airflow (CFM): * ⓘ               │
│   ┌──────────────────────────────┐ │
│   │ 5000                         │ │
│   └──────────────────────────────┘ │
│   Range: 500 - 50,000 CFM          │
│                                    │
│   Cooling Capacity (Tons): * ⓘ     │
│   ┌──────────────────────────────┐ │
│   │ 3.5                          │ │
│   └──────────────────────────────┘ │
│                                    │
│ ▼ Electrical                       │
│   Voltage: * ⓘ                     │
│   ┌──────────────────────────────┐ │
│   │ 480V ▼                       │ │
│   └──────────────────────────────┘ │
│                                    │
│   Phase: *                         │
│   ⦿ Single  ◯ Three-Phase          │
│                                    │
│   Full Load Amps: ⓘ [Auto]        │
│   ┌──────────────────────────────┐ │
│   │ 12.5  (calculated)           │ │
│   └──────────────────────────────┘ │
│                                    │
│ ▶ Physical (collapsed)             │
│ ▶ Cost & Procurement (collapsed)   │
│ ▶ Custom Properties (collapsed)    │
│                                    │
│         [Apply]  [Reset]           │
│                                    │
└────────────────────────────────────┘

Tooltip Example (on hover ⓘ):

┌────────────────────────────────────┐
│ Airflow (CFM)                      │
│ ──────────────────────────────     │
│ The rated airflow capacity of the  │
│ air handler in cubic feet per      │
│ minute. This affects duct sizing   │
│ and system calculations.           │
│                                    │
│ Valid range: 500 - 50,000 CFM      │
└────────────────────────────────────┘
```

**User Feedback:**
- Collapsible sections organize properties logically
- Required fields clearly marked with asterisks
- Info icons provide detailed field explanations
- Range hints prevent out-of-bounds entries
- Calculated fields indicated with "Auto" badge
- Empty state shows helpful placeholder text

**Related Elements:**
- Components: `PropertySection`, `PropertyField`, `FieldTooltip`, `DropdownField`, `NumberField`
- Services: `PropertySchemaService`, `ValidationService`
- Types: `EquipmentPropertySchema`, `PropertyField`

### Step 3: Editing Property Values

**User Actions:**
1. User clicks into a property field (e.g., Airflow CFM)
2. User modifies the value (changes 5000 to 6000)
3. User observes real-time validation feedback
4. User edits additional fields as needed
5. User uses dropdown to change Manufacturer
6. User notices Model dropdown updates with manufacturer-specific options
7. User completes all desired edits

**System Response:**
1. When user focuses field:
   - System highlights field border (blue)
   - System selects existing text for easy replacement
   - System displays field-specific keyboard hints if applicable

2. As user types in number field (Airflow):
   - System validates input on every keystroke (debounced 300ms)
   - System allows only numeric characters and decimal point
   - System prevents invalid characters (letters, special chars)

3. When user changes value from 5000 to 6000:
   - System validates against min/max range (500 - 50,000)
   - System validates against data type (number)
   - System shows validation feedback:
     - Valid: Green checkmark icon appears
     - Invalid: Red X icon with error message below field

4. System tracks dirty state:
   - Changed fields marked with orange dot indicator
   - "Apply" button enables (changes from gray to blue)
   - "Reset" button enables to discard changes
   - Window close warning triggers if unsaved changes exist

5. When user changes Manufacturer dropdown:
   - System captures change event
   - System marks manufacturer field as dirty
   - System queries available models for selected manufacturer
   - System updates Model dropdown options dynamically
   - System clears Model field if current value not valid for new manufacturer
   - System shows loading indicator briefly while fetching models

6. Calculated field behavior:
   - If user manually edits FLA (Full Load Amps):
     - System removes "Auto" badge
     - System marks as manually overridden
     - System shows "Manual Override" indicator
     - System stops auto-calculating this field

7. System validates all fields on blur (when user leaves field):
   - Runs comprehensive validation
   - Checks required field constraints
   - Validates data types and formats
   - Cross-validates related fields (e.g., cooling capacity matches airflow)

**Visual State:**

```
During Editing - Valid Input:

┌────────────────────────────────────┐
│ Airflow (CFM): * ⓘ                 │
│ ┌──────────────────────────────────┐│
│ │ 6000                           ✓││ ← Green checkmark
│ └──────────────────────────────────┘│
│ Range: 500 - 50,000 CFM     ● Edited│
│                              ↑ Orange dot
└────────────────────────────────────┘

During Editing - Invalid Input:

┌────────────────────────────────────┐
│ Airflow (CFM): * ⓘ                 │
│ ┌──────────────────────────────────┐│
│ │ 75000                          ✗││ ← Red X
│ └──────────────────────────────────┘│
│ ⚠ Value must be between 500-50,000 │ ← Error message
│                           ● Edited  │
└────────────────────────────────────┘

Manufacturer Change - Cascade Update:

Before:
┌────────────────────────────────────┐
│ Manufacturer: *                    │
│ ┌──────────────────────────────────┐│
│ │ York ▼                           ││
│ └──────────────────────────────────┘│
│                                    │
│ Model: *                           │
│ ┌──────────────────────────────────┐│
│ │ MCA 500 ▼                        ││
│ └──────────────────────────────────┘│
└────────────────────────────────────┘

User changes Manufacturer to "Trane":

After:
┌────────────────────────────────────┐
│ Manufacturer: *                    │
│ ┌──────────────────────────────────┐│
│ │ Trane ▼                      ●   ││ ← Dirty indicator
│ └──────────────────────────────────┘│
│                                    │
│ Model: *                           │
│ ┌──────────────────────────────────┐│
│ │ [Loading models...] ⟳            ││ ← Loading state
│ └──────────────────────────────────┘│
│                                    │
│ ↓ After load completes              │
│                                    │
│ Model: *                           │
│ ┌──────────────────────────────────┐│
│ │ Select model ▼                   ││ ← Reset, new options
│ ├──────────────────────────────────┤│
│ │ TAM7 Series                      ││
│ │ TUA Series                       ││
│ │ TEM Series                       ││
│ └──────────────────────────────────┘│
└────────────────────────────────────┘

Manual Override on Calculated Field:

Before (Auto-calculated):
┌────────────────────────────────────┐
│ Full Load Amps: ⓘ      [Auto]     │
│ ┌──────────────────────────────────┐│
│ │ 12.5  (calculated)               ││
│ └──────────────────────────────────┘│
└────────────────────────────────────┘

After User Edits:
┌────────────────────────────────────┐
│ Full Load Amps: ⓘ  [Manual Override││
│ ┌──────────────────────────────────┐│
│ │ 15.0                         ●   ││ ← Edited
│ └──────────────────────────────────┘│
│ ⓘ Manual value - auto-calc disabled│
└────────────────────────────────────┘
```

**User Feedback:**
- Real-time validation with visual indicators (✓ ✗)
- Error messages clearly explain validation failures
- Dirty indicators show which fields changed
- Apply/Reset buttons enable when changes made
- Loading indicators during async operations
- Manual override clearly indicated on calculated fields
- Field highlighting shows focus state

**Related Elements:**
- Components: `NumberField`, `DropdownField`, `ValidationMessage`, `DirtyIndicator`
- Stores: `EntityStore` (entity data), `ValidationStore`
- Services: `ValidationService`, `ManufacturerDataService`
- Hooks: `useFieldValidation`, `useFormState`

### Step 4: Applying Property Changes

**User Actions:**
1. User reviews all edited fields for accuracy
2. User clicks "Apply" button to save changes
3. User observes confirmation feedback
4. User sees changes reflected on canvas entity
5. User notices BOM and calculations update

**System Response:**
1. When user clicks "Apply":
   - System performs final validation on all fields
   - System checks all required fields populated
   - System validates cross-field constraints

2. If validation passes:
   - System creates PropertyChangeCommand for undo/redo
   - System captures before/after state:
     - Previous values: {airflow: 5000, manufacturer: "York", ...}
     - New values: {airflow: 6000, manufacturer: "Trane", ...}
   - System pushes command to HistoryStore

3. System updates EntityStore:
   - Retrieves entity by ID from store
   - Applies new property values to entity object
   - Triggers entity update event: `EntityPropertiesChangedEvent`

4. System propagates changes:
   - **Canvas Rendering**: Entity re-renders with updated label (if airflow shown)
   - **BOM Update**: BOMStore recalculates affected line items
     - Model change updates BOM description
     - Cost updates if manufacturer/model affects unit cost
   - **Calculations Update**: CalculationsStore re-runs dependent calculations
     - Airflow change affects duct sizing calculations
     - Electrical changes affect load calculations
   - **Dependencies Check**: Identifies connected entities that may be affected
     - Ducts connected to AHU may need recalculation

5. System provides user feedback:
   - Shows success toast: "Equipment properties updated successfully"
   - Clears dirty indicators from all fields
   - Disables "Apply" and "Reset" buttons
   - Updates "Last Modified" timestamp on entity

6. System auto-saves project:
   - Triggers debounced auto-save (5 seconds)
   - Shows "Saving..." indicator in status bar
   - Updates project modified timestamp

7. If validation fails:
   - System displays error summary at top of panel
   - Scrolls to first invalid field
   - Highlights all invalid fields in red
   - Keeps "Apply" button enabled for correction
   - Shows detailed error messages per field

**Visual State:**

```
After Clicking Apply - Success:

┌────────────────────────────────────┐
│ ✓ Properties updated successfully  │ ← Success toast
└────────────────────────────────────┘

Properties Panel (changes applied):

┌────────────────────────────────────┐
│ Air Handler Unit Properties        │
│ ──────────────────────────────────  │
│                                    │
│ Airflow (CFM): *                   │
│ ┌──────────────────────────────────┐│
│ │ 6000                             ││ ← No more dirty indicator
│ └──────────────────────────────────┘│
│                                    │
│ Manufacturer: *                    │
│ ┌──────────────────────────────────┐│
│ │ Trane ▼                          ││
│ └──────────────────────────────────┘│
│                                    │
│         [Apply]  [Reset]           │ ← Buttons disabled (gray)
│                                    │
│ Last updated: Just now             │
└────────────────────────────────────┘

Canvas - Entity Updated:

┌────────────────────────────────────┐
│         ┌─────────────────┐        │
│         │  AHU-1          │        │
│         │  Trane TAM7     │ ← Updated label
│         │  6000 CFM       │ ← Updated airflow
│         └─────────────────┘        │
└────────────────────────────────────┘

BOM Panel - Updated:

┌────────────────────────────────────┐
│ Bill of Materials                  │
│ ──────────────────────────────     │
│                                    │
│ Item              Qty  Unit  Total │
│ AHU - Trane TAM7   1   $4,200 $4,200│ ← Updated
│ (was: AHU - York MCA)              │
│                                    │
└────────────────────────────────────┘

Validation Failure Example:

┌────────────────────────────────────┐
│ ⚠ Please correct errors below:     │ ← Error summary
│   • Airflow must be 500-50,000     │
│   • Model is required              │
└────────────────────────────────────┘

Properties Panel:
│ Airflow (CFM): *                   │
│ ┌──────────────────────────────────┐│
│ │ 75000                          ✗ ││ ← Highlighted in red
│ └──────────────────────────────────┘│
│ ⚠ Value must be between 500-50,000 │
│                                    │
│ Model: *                           │
│ ┌──────────────────────────────────┐│
│ │                                ✗ ││ ← Required field empty
│ └──────────────────────────────────┘│
│ ⚠ Model is required                │
```

**User Feedback:**
- Success toast confirms changes saved
- Canvas entity updates visually confirm changes applied
- BOM and calculations update automatically
- Dirty indicators cleared after successful save
- Error summary highlights issues if validation fails
- Auto-save indicator shows project being saved
- Timestamp shows when properties last updated

**Related Elements:**
- Components: `PropertiesPanel`, `Toast`, `ErrorSummary`
- Stores: `EntityStore`, `HistoryStore`, `BOMStore`, `CalculationsStore`
- Services: `PropertyService`, `ValidationService`, `AutoSaveService`
- Commands: `PropertyChangeCommand`
- Events: `EntityPropertiesChangedEvent`, `BOMUpdatedEvent`

### Step 5: Resetting or Undoing Changes

**User Actions:**
1. User realizes a mistake after editing properties
2. User has two options:
   - Option A: Click "Reset" button before applying (discards unsaved changes)
   - Option B: Use Undo after applying (reverts saved changes)
3. User chooses option and observes changes reverted

**System Response:**

**Option A: Reset Button (Before Applying)**

1. When user clicks "Reset" button:
   - System retrieves original entity values from EntityStore
   - System repopulates all form fields with original values
   - System clears all dirty indicators
   - System removes all validation errors
   - System disables "Apply" and "Reset" buttons
   - System shows brief toast: "Changes discarded"

**Option B: Undo (After Applying)**

1. When user presses Ctrl+Z or clicks Undo button:
   - System retrieves last command from HistoryStore undo stack
   - System identifies command as PropertyChangeCommand
   - System calls command.undo() method:
     - Restores previous property values from command's before state
     - Updates entity in EntityStore
     - Triggers EntityPropertiesChangedEvent with reverted values
   - System moves command from undo stack to redo stack

2. System propagates undo changes:
   - Properties Panel repopulates with reverted values
   - Canvas entity re-renders with original properties
   - BOM recalculates with original values
   - Calculations re-run with original values

3. System provides feedback:
   - Shows undo toast: "Undone: Edit AHU-1 properties"
   - Updates Properties Panel immediately
   - Redo button becomes enabled

4. If user wants to redo:
   - Press Ctrl+Shift+Z or click Redo button
   - System retrieves command from redo stack
   - System calls command.redo() method
   - Reapplies the property changes
   - Shows redo toast: "Redone: Edit AHU-1 properties"

**Visual State:**

```
Before Reset:

┌────────────────────────────────────┐
│ Airflow (CFM): *                   │
│ ┌──────────────────────────────────┐│
│ │ 6000                         ●   ││ ← Dirty
│ └──────────────────────────────────┘│
│                                    │
│         [Apply]  [Reset]           │ ← Both enabled
│              ↑ User clicks          │
└────────────────────────────────────┘

After Reset:

┌────────────────────────────────────┐
│ ✓ Changes discarded                │ ← Toast
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Airflow (CFM): *                   │
│ ┌──────────────────────────────────┐│
│ │ 5000                             ││ ← Reverted to original
│ └──────────────────────────────────┘│
│                                    │
│         [Apply]  [Reset]           │ ← Both disabled
└────────────────────────────────────┘

After Undo (Ctrl+Z):

┌────────────────────────────────────┐
│ ↶ Undone: Edit AHU-1 properties    │ ← Undo toast
└────────────────────────────────────┘

Properties Panel reverts to before state
Canvas entity reverts to original label
BOM reverts to original values

Toolbar:
┌────────────────────────────────────┐
│ [↶ Undo]  [↷ Redo]                 │
│   (disabled) (enabled) ← Redo now available
└────────────────────────────────────┘

After Redo (Ctrl+Shift+Z):

┌────────────────────────────────────┐
│ ↷ Redone: Edit AHU-1 properties    │ ← Redo toast
└────────────────────────────────────┘

Properties Panel reapplies changes
Canvas entity shows updated values again
```

**User Feedback:**
- Reset button provides quick discard before saving
- Toast messages confirm reset action
- Undo/redo buttons enable/disable based on availability
- Descriptive undo/redo toasts explain what was undone/redone
- All dependent systems update consistently during undo/redo
- Visual feedback matches action intent

**Related Elements:**
- Components: `PropertiesPanel`, `Toast`, `UndoRedoButtons`
- Stores: `HistoryStore`, `EntityStore`
- Commands: `PropertyChangeCommand` (with undo/redo methods)
- Services: `HistoryService`

## 5. Edge Cases and Handling

### Edge Case 1: Multiple Equipment Selected (Batch Edit)

**Scenario:**
User selects multiple equipment items (e.g., 5 VAV boxes) and wants to update common properties for all at once.

**Handling:**
1. System detects multiple entities selected (count > 1)
2. System analyzes selected entities:
   - Determines if all same type (e.g., all VAV boxes)
   - Identifies common properties across selections
   - Identifies properties with different values
3. System displays batch edit mode in Properties Panel:
   - Title: "Multiple Items (5) - VAV Box"
   - Shows only common properties
   - Fields with identical values show that value
   - Fields with different values show placeholder: "(Mixed values)"
4. When user edits field:
   - New value will apply to ALL selected items
   - System shows confirmation: "Update 5 items?"
5. System creates batch command:
   - Single undo operation for all changes
   - Efficient update: applies changes to all entities at once
6. System updates all selected entities simultaneously
7. System recalculates BOM and calculations for all affected items

**User Impact:**
- High value: Enables efficient bulk updates
- Clear indication of batch mode
- Mixed values clearly shown
- Single undo for entire batch operation

### Edge Case 2: Property Dependency Conflict

**Scenario:**
User changes cooling capacity to value that's incompatible with current airflow, creating a technical conflict.

**Handling:**
1. System validates property relationships on change
2. System detects conflict:
   - Cooling capacity of 10 tons requires minimum 4000 CFM
   - Current airflow is 2500 CFM (too low)
3. System shows validation warning:
   - Type: Warning (not blocking error)
   - Message: "⚠ Cooling capacity of 10 tons typically requires 4000+ CFM. Current airflow: 2500 CFM."
   - Suggestion: "Consider increasing airflow or reducing cooling capacity."
4. System allows user to proceed or adjust:
   - "Apply Anyway" - Saves despite warning
   - "Auto-Adjust Airflow" - Calculates and sets recommended airflow
   - "Cancel" - Reverts cooling capacity change
5. If user proceeds with warning:
   - System marks entity with warning badge
   - Warning shown in calculations panel
   - BOM includes note about potential issue

**User Impact:**
- Medium: User informed of technical issues but not blocked
- Recommendations help make correct decision
- Auto-adjust option provides quick fix
- Warnings tracked for review

### Edge Case 3: Manufacturer Discontinues Model During Edit

**Scenario:**
User has equipment with model "York MCA 500" which gets discontinued/removed from system while user is editing properties.

**Handling:**
1. System loads property form with current values including "York MCA 500"
2. When user changes manufacturer dropdown:
   - System fetches updated model list from server
   - "MCA 500" no longer in available models
3. System handles gracefully:
   - Keeps existing "MCA 500" value in field
   - Adds special indicator: "(Discontinued)"
   - Allows user to keep discontinued model or select new one
   - Shows warning: "⚠ This model is no longer available for new installations"
4. System provides options:
   - Keep existing: Value preserved for legacy equipment
   - Select replacement: Dropdown shows current models plus "(Discontinued) MCA 500"
5. BOM reflects discontinued status:
   - Shows "(Discontinued)" in description
   - May flag for review in procurement

**User Impact:**
- Low: Existing equipment not disrupted
- Clear indication of discontinued status
- Option to update or keep legacy value
- BOM accurately reflects status

### Edge Case 4: Extremely Long Property Values

**Scenario:**
User enters very long equipment name or description that exceeds reasonable limits or breaks layout.

**Handling:**
1. System enforces character limits on text fields:
   - Name: 100 characters
   - Description: 500 characters
   - Tag: 50 characters
2. System shows character count near limit:
   - At 80% capacity: Shows count "80/100"
   - At 100%: Prevents additional characters
   - Shows warning: "Maximum length reached"
3. System handles display in UI:
   - Properties Panel: Full text with scrolling if needed
   - Canvas Label: Truncates with ellipsis "Very Long Equipment Na..."
   - BOM: Truncates with tooltip showing full text on hover
4. System validates on paste:
   - If pasted text exceeds limit, truncates and shows warning
   - User can review and edit truncated text

**User Impact:**
- Low: Reasonable limits prevent issues
- Clear feedback when limits reached
- Truncation handles display gracefully
- Full text always accessible

### Edge Case 5: Property Change During Calculation

**Scenario:**
User changes equipment property while system is in the middle of running calculations based on current values.

**Handling:**
1. System detects calculation in progress when property changed
2. System handles race condition:
   - Calculation service tracks calculation state
   - New property change sets "calculation dirty" flag
   - Ongoing calculation continues with original values
3. When ongoing calculation completes:
   - System checks "calculation dirty" flag
   - If dirty, immediately queues recalculation with new values
   - Old calculation results discarded or marked stale
4. System shows status:
   - During first calc: "Calculating..."
   - After property change: "Calculation pending update..."
   - After recalc: "Calculations updated"
5. System debounces rapid changes:
   - If user makes multiple changes quickly (< 1 second apart)
   - Only final values trigger calculation
   - Prevents redundant calculations

**User Impact:**
- Low: Calculations eventually consistent
- No race conditions or invalid results
- Status messages keep user informed
- Performance optimized through debouncing

## 6. Error Scenarios and Recovery

### Error Scenario 1: Invalid Property Value Entered

**Error Condition:**
User enters value outside valid range or wrong data type (e.g., text in number field, airflow of 100,000 CFM when max is 50,000).

**System Detection:**
1. Real-time validation on input (debounced)
2. Zod schema validation catches type and range violations
3. Error detected before user attempts to apply

**Error Message:**
```
Field-level error:
⚠ Airflow must be between 500 and 50,000 CFM

Form-level error (on apply attempt):
⚠ Please correct the following errors:
  • Airflow: Value exceeds maximum (50,000 CFM)
  • Model: Selection is required
```

**Recovery Steps:**
1. System prevents applying invalid changes:
   - "Apply" button disabled while errors exist
   - Error messages displayed below each invalid field
   - First error field scrolled into view
2. System highlights all invalid fields with red border
3. System provides correction guidance:
   - Shows valid range/format below field
   - Examples of valid values if applicable
4. User corrects errors:
   - Real-time validation shows when errors cleared
   - "Apply" button enables when all errors resolved
5. System allows "Reset" to discard invalid changes entirely

**User Recovery Actions:**
- Read error message for guidance
- Correct value to within valid range
- Use Reset button if unsure of correct value
- Refer to equipment documentation for specs

**Prevention:**
- Input masks prevent invalid characters (numbers-only fields)
- Dropdowns eliminate invalid selections
- Tooltips show valid ranges proactively
- Placeholder text provides format examples

### Error Scenario 2: Required Property Left Empty

**Error Condition:**
User deletes value from required field (e.g., clears airflow CFM) and attempts to apply changes.

**System Detection:**
1. Required field validation on blur (field loses focus)
2. Form-level validation on "Apply" click
3. Zod schema marks field as required

**Error Message:**
```
⚠ Airflow (CFM) is required
```

**Recovery Steps:**
1. System prevents applying incomplete form:
   - "Apply" button disabled
   - Required field highlighted in red
   - Error message: "Airflow (CFM) is required"
2. System distinguishes required vs. optional:
   - Required fields marked with red asterisk (*)
   - Error message specific to required constraint
3. System provides default value hint if applicable:
   - Tooltip shows typical values for equipment type
   - Placeholder suggests common value: "e.g., 5000"
4. User enters valid value:
   - Validation clears error immediately
   - "Apply" button enables when all required fields populated

**User Recovery Actions:**
- Enter valid value in required field
- Refer to equipment specifications
- Use typical/default value if unsure
- Reset form to restore original value

**Prevention:**
- Required fields clearly marked upfront
- Confirmation dialog if user attempts to clear required field
- Validation on blur catches issue early

### Error Scenario 3: Property Update Fails to Propagate

**Error Condition:**
User applies property changes successfully, but BOM or calculations don't update due to system error.

**System Detection:**
1. Property change event dispatched successfully
2. Event listener in BOMStore/CalculationsStore fails
3. Error caught in event handler
4. Inconsistent state: entity updated but dependents not

**Error Message:**
```
⚠ Property saved, but calculations could not be updated
Error Code: ERR_CALC_UPDATE_FAILED
Click to retry update.
```

**Recovery Steps:**
1. System detects update propagation failure:
   - Entity change succeeded
   - BOM or calculation update threw error
   - Error logged with details
2. System shows warning notification:
   - Explains property saved but calculations pending
   - Provides "Retry Update" button
   - Doesn't block further work
3. If user clicks "Retry Update":
   - System manually triggers recalculation
   - Success: Shows success toast, clears warning
   - Failure: Shows error details, offers bug report
4. System marks calculations as stale:
   - Warning badge on Calculations panel
   - Tooltip: "Calculations may be out of date"
5. System auto-retries in background:
   - Exponential backoff: 2s, 4s, 8s
   - Max 3 retry attempts
   - Success: Silently clears warning

**User Recovery Actions:**
- Click "Retry Update" to manually trigger
- Refresh page to force full recalculation
- Continue working (calculations marked stale)
- Report issue if persistent

**Prevention:**
- Robust error handling in event listeners
- Retry logic with exponential backoff
- Transaction-like updates where possible
- Comprehensive error logging

## 7. Keyboard Shortcuts

### Property Editing Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Tab` | Next field | Move to next property field |
| `Shift+Tab` | Previous field | Move to previous property field |
| `Enter` | Apply (when valid) | Save property changes (if no validation errors) |
| `Esc` | Cancel/Reset | Discard changes and close edit mode |
| `Ctrl+Enter` | Force Apply | Apply changes (shows confirmation if warnings) |
| `Alt+R` | Reset Form | Reset all fields to original values |

### Property Panel Navigation

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Shift+P` | Open Properties | Switch to Properties tab in right sidebar |
| `Ctrl+Shift+E` | Expand/Collapse All | Toggle all property sections |
| `Space` | Toggle Section | Expand/collapse focused property section |
| `↑` / `↓` | Navigate Sections | Move between collapsed sections |

### Batch Editing

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+A` | Select All (same type) | Selects all equipment of same type for batch edit |
| `Shift+Click` | Range Select | Select range of equipment for batch edit |
| `Ctrl+Click` | Add to Selection | Add/remove equipment from selection |

### Quick Actions

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+D` | Duplicate Properties | Copy current equipment with same properties |
| `Ctrl+Shift+C` | Copy Properties | Copy properties to clipboard |
| `Ctrl+Shift+V` | Paste Properties | Paste properties to selected equipment |
| `F2` | Edit Name | Focus equipment name field for quick rename |

**Note:** All shortcuts respect form field focus. When typing in text field, shortcuts don't trigger to avoid conflicts.

## 8. Related Elements

### Components
- `PropertiesPanel`: Main properties editing panel
  - Location: `src/components/properties/PropertiesPanel.tsx`
  - Props: `selectedEntity`, `onUpdate`, `onCancel`

- `PropertySection`: Collapsible property group
  - Location: `src/components/properties/PropertySection.tsx`
  - Props: `title`, `fields`, `collapsed`, `onToggle`

- `PropertyField`: Individual property input wrapper
  - Location: `src/components/properties/PropertyField.tsx`
  - Props: `field`, `value`, `onChange`, `validation`, `required`

- `NumberField`: Number input with validation
  - Location: `src/components/form/NumberField.tsx`
  - Props: `value`, `min`, `max`, `step`, `unit`, `onChange`

- `DropdownField`: Dropdown select input
  - Location: `src/components/form/DropdownField.tsx`
  - Props: `value`, `options`, `onChange`, `loading`, `searchable`

- `ValidationMessage`: Error/warning message display
  - Location: `src/components/form/ValidationMessage.tsx`
  - Props: `type`, `message`, `severity`

- `DirtyIndicator`: Visual indicator for changed fields
  - Location: `src/components/form/DirtyIndicator.tsx`
  - Props: `isDirty`, `position`

### Zustand Stores
- `EntityStore`: Entity data and selection state
  - Location: `src/stores/EntityStore.ts`
  - State: `entities`, `selectedEntities`, `updateEntity()`
  - Actions: `selectEntity()`, `updateProperties()`, `getEntityById()`

- `HistoryStore`: Undo/redo command management
  - Location: `src/stores/HistoryStore.ts`
  - State: `undoStack`, `redoStack`, `canUndo`, `canRedo`
  - Actions: `pushCommand()`, `undo()`, `redo()`

- `ValidationStore`: Validation state and errors
  - Location: `src/stores/ValidationStore.ts`
  - State: `errors`, `warnings`, `validationState`
  - Actions: `validateField()`, `clearErrors()`, `setError()`

- `BOMStore`: Bill of materials state
  - Location: `src/stores/BOMStore.ts`
  - State: `lineItems`, `totalCost`, `needsRecalculation`
  - Actions: `recalculateBOM()`, `updateLineItem()`

- `CalculationsStore`: Calculation results
  - Location: `src/stores/CalculationsStore.ts`
  - State: `results`, `isCalculating`, `lastCalculated`
  - Actions: `runCalculations()`, `markStale()`

### Hooks
- `usePropertyForm`: Property form state management
  - Location: `src/hooks/usePropertyForm.ts`
  - Returns: `values`, `errors`, `isDirty`, `handleChange()`, `handleSubmit()`, `reset()`

- `useFieldValidation`: Field-level validation logic
  - Location: `src/hooks/useFieldValidation.ts`
  - Returns: `validate()`, `error`, `isValid`, `validationState`

- `useBatchEdit`: Batch editing logic
  - Location: `src/hooks/useBatchEdit.ts`
  - Returns: `isBatchMode`, `commonProperties`, `mixedValueFields`, `applyBatch()`

### Services
- `PropertyService`: Property CRUD operations
  - Location: `src/services/PropertyService.ts`
  - Methods: `getProperties()`, `updateProperties()`, `validateProperties()`, `getPropertySchema()`

- `ValidationService`: Validation engine
  - Location: `src/services/ValidationService.ts`
  - Methods: `validate()`, `validateField()`, `getValidationRules()`, `formatError()`

- `ManufacturerDataService`: Manufacturer and model data
  - Location: `src/services/ManufacturerDataService.ts`
  - Methods: `getManufacturers()`, `getModels()`, `searchModels()`, `getSpecifications()`

- `PropertyPropagationService`: Change propagation
  - Location: `src/services/PropertyPropagationService.ts`
  - Methods: `propagateChanges()`, `updateDependentCalculations()`, `updateBOM()`

### Commands
- `PropertyChangeCommand`: Undo/redo for property edits
  - Location: `src/commands/PropertyChangeCommand.ts`
  - Methods: `execute()`, `undo()`, `redo()`, `merge()`
  - Data: `entityId`, `beforeState`, `afterState`

- `BatchPropertyChangeCommand`: Batch edit undo/redo
  - Location: `src/commands/BatchPropertyChangeCommand.ts`
  - Methods: `execute()`, `undo()`, `redo()`
  - Data: `entityIds[]`, `changes`, `beforeStates`

### Types & Schemas
- `EquipmentPropertySchema`: Property definition schema
  - Location: `src/types/PropertySchema.ts`
  - Zod schemas for each equipment type
  - Validation rules, ranges, dependencies

- `PropertyField`: Property field metadata
  - Location: `src/types/PropertyField.ts`
  - Fields: `name`, `label`, `type`, `required`, `validation`, `tooltip`

## 9. Visual Diagrams

### Property Edit Flow

```
User Selects Equipment
         │
         v
┌────────────────────┐
│ EntityStore        │
│ updates selection  │
└─────────┬──────────┘
          │
          v
┌────────────────────────┐
│ PropertiesPanel loads  │
│ entity properties      │
└─────────┬──────────────┘
          │
          v
┌─────────────────────────────┐
│ Display property fields     │
│ - Name, Model, CFM, etc.    │
│ - Populated with values     │
│ - Validation rules applied  │
└──────────┬──────────────────┘
           │
   User edits field
           │
           v
┌──────────────────────────┐
│ Real-time validation     │
│ - Check type, range      │
│ - Show ✓ or ✗           │
│ - Mark field dirty       │
└──────────┬───────────────┘
           │
    User clicks Apply
           │
           v
┌──────────────────────────┐
│ Final validation         │
└────┬──────────────┬──────┘
     │              │
  Valid          Invalid
     │              │
     v              v
┌─────────────┐ ┌──────────────┐
│Create       │ │Show errors   │
│Property     │ │Highlight     │
│ChangeCommand│ │fields        │
└──────┬──────┘ └──────────────┘
       │
       v
┌───────────────────────────┐
│ Update EntityStore        │
│ - Apply new values        │
│ - Dispatch change event   │
└──────────┬────────────────┘
           │
           v
┌──────────────────────────────────┐
│ Propagate changes:               │
│ - Canvas re-render               │
│ - BOM recalculation              │
│ - Calculations update            │
│ - Auto-save trigger              │
└──────────────────────────────────┘
           │
           v
┌──────────────────────────┐
│ Show success feedback    │
│ Clear dirty indicators   │
└──────────────────────────┘
```

### Validation Pipeline

```
User Input Event
       │
       v
┌──────────────┐
│ Input Mask   │ (Prevent invalid characters)
│ Filter       │
└──────┬───────┘
       │
       v
┌──────────────────┐
│ Debounced        │ (300ms delay)
│ Validation       │
└──────┬───────────┘
       │
       v
┌─────────────────────────┐
│ Zod Schema Validation   │
│ - Type check            │
│ - Required check        │
│ - Range check           │
│ - Custom rules          │
└──────┬──────────────────┘
       │
   ┌───┴────┐
   │        │
Valid     Invalid
   │        │
   v        v
┌────┐  ┌─────────────┐
│ ✓  │  │ ✗ + Error   │
│Show│  │   Message   │
└────┘  └─────────────┘
   │        │
   └───┬────┘
       │
       v
┌──────────────────┐
│ Cross-Field      │ (On blur or apply)
│ Validation       │
│ - Dependencies   │
│ - Relationships  │
└──────┬───────────┘
       │
   ┌───┴────┐
   │        │
Valid     Warning/Error
   │        │
   v        v
┌────────┐ ┌─────────────┐
│Enable  │ │Show warning │
│Apply   │ │Allow or     │
│Button  │ │block apply  │
└────────┘ └─────────────┘
```

### Batch Edit Flow

```
User Selects Multiple Equipment (Ctrl+Click)
              │
              v
┌─────────────────────────────┐
│ EntityStore                 │
│ selectedEntities: [5 items] │
└──────────┬──────────────────┘
           │
           v
┌──────────────────────────────┐
│ Analyze selections:          │
│ - All same type? ✓ VAV Box   │
│ - Common properties?         │
│ - Value differences?         │
└──────────┬───────────────────┘
           │
           v
┌──────────────────────────────────┐
│ PropertiesPanel batch mode       │
│ Title: "Multiple Items (5)"     │
│                                  │
│ Fields:                          │
│ - CFM: 1200 (all same)           │
│ - Voltage: (Mixed values)        │
│ - Manufacturer: Trane (all same) │
└──────────┬───────────────────────┘
           │
    User edits field
    (e.g., Voltage → 480V)
           │
           v
┌──────────────────────────────┐
│ Show confirmation:           │
│ "Update 5 items?"            │
│ [Update All] [Cancel]        │
└──────────┬─────────────────── │
           │
    User clicks "Update All"
           │
           v
┌──────────────────────────────┐
│ Create                       │
│ BatchPropertyChangeCommand   │
│ - entityIds: [5 IDs]         │
│ - changes: {voltage: "480V"} │
└──────────┬───────────────────┘
           │
           v
┌──────────────────────────────┐
│ Update all entities:         │
│ FOR EACH entity:             │
│   - Update voltage to 480V   │
│   - Dispatch change event    │
└──────────┬───────────────────┘
           │
           v
┌──────────────────────────────┐
│ Propagate for all:           │
│ - Refresh all 5 on canvas    │
│ - Update BOM (5 items)       │
│ - Recalculate affected       │
└──────────┬───────────────────┘
           │
           v
┌──────────────────────────────┐
│ Success: "Updated 5 items"   │
│ Single undo for all changes  │
└──────────────────────────────┘
```

## 10. Testing

### Unit Tests

**PropertyService Tests:**
```
describe('PropertyService', () => {
  test('getProperties returns correct schema for equipment type')
  test('updateProperties validates and updates entity')
  test('updateProperties rejects invalid values')
  test('validateProperties catches type errors')
  test('validateProperties catches range violations')
  test('validateProperties checks required fields')
  test('cross-field validation detects incompatible values')
  test('manufacturer change triggers model list update')
})
```

**PropertyChangeCommand Tests:**
```
describe('PropertyChangeCommand', () => {
  test('execute applies property changes to entity')
  test('undo reverts entity to previous state')
  test('redo reapplies property changes')
  test('merge combines sequential property changes')
  test('command stores before and after state correctly')
  test('command dispatches correct events')
})
```

**ValidationService Tests:**
```
describe('ValidationService', () => {
  test('validate returns errors for invalid values')
  test('validate passes for valid values')
  test('validateField checks single field correctly')
  test('number field validation enforces min/max')
  test('required field validation catches empty values')
  test('dropdown validation ensures value in options')
  test('cross-field validation checks dependencies')
})
```

### Integration Tests

**Property Edit Integration:**
```
describe('Property Edit Integration', () => {
  test('selecting equipment loads properties in panel')
  test('editing field shows real-time validation')
  test('applying changes updates entity in store')
  test('property changes trigger BOM recalculation')
  test('property changes trigger calculation updates')
  test('undo reverts property changes and dependent updates')
  test('reset button discards unsaved changes')
  test('canvas entity label updates after property change')
})
```

**Batch Edit Integration:**
```
describe('Batch Edit Integration', () => {
  test('selecting multiple items shows batch mode')
  test('common properties display correctly')
  test('mixed value fields show placeholder')
  test('batch update applies to all selected items')
  test('single undo reverts all batch changes')
  test('BOM updates for all items in batch')
})
```

### End-to-End Tests

**Complete Property Edit Flow:**
```
test('E2E: Edit equipment properties', async () => {
  // 1. Open project with equipment
  await page.goto('http://localhost:3000/canvas/test-project')

  // 2. Select equipment on canvas
  await page.click('[data-entity-id="ahu-1"]')

  // 3. Verify Properties Panel opens with equipment data
  await expect(page.locator('[data-testid="properties-panel"]')).toBeVisible()
  await expect(page.locator('[data-testid="panel-title"]')).toHaveText('Air Handler Unit Properties')

  // 4. Edit airflow field
  await page.fill('[data-testid="field-airflow"]', '6000')

  // 5. Verify real-time validation shows success
  await expect(page.locator('[data-testid="field-airflow-validation"]')).toHaveClass(/valid/)

  // 6. Change manufacturer
  await page.selectOption('[data-testid="field-manufacturer"]', 'Trane')

  // 7. Verify model dropdown updates
  await expect(page.locator('[data-testid="field-model"]')).toBeEnabled()
  await expect(page.locator('[data-testid="field-model"] option')).toContainText('TAM')

  // 8. Apply changes
  await page.click('[data-testid="apply-btn"]')

  // 9. Verify success toast
  await expect(page.locator('[data-testid="toast"]')).toHaveText(/updated successfully/)

  // 10. Verify canvas label updated
  await expect(page.locator('[data-entity-id="ahu-1"] [data-testid="entity-label"]')).toContainText('6000 CFM')

  // 11. Verify BOM updated
  await page.click('[data-testid="tab-bom"]')
  await expect(page.locator('[data-testid="bom-table"]')).toContainText('Trane')

  // 12. Test undo
  await page.keyboard.press('Control+z')

  // 13. Verify properties reverted
  await page.click('[data-entity-id="ahu-1"]')
  await expect(page.locator('[data-testid="field-airflow"]')).toHaveValue('5000')
  await expect(page.locator('[data-testid="field-manufacturer"]')).toHaveValue('York')
})
```

## 11. Common Pitfalls and Solutions

### Pitfall 1: Validation Runs Too Frequently

**Problem:**
Validation runs on every keystroke without debouncing, causing performance issues and flickering error messages.

**Why It Happens:**
- onChange handler triggers immediate validation
- No debouncing on rapid input
- Expensive validation logic (API calls, complex calculations)

**Solution:**
- Debounce validation by 300ms
- Use lightweight client-side validation during typing
- Run expensive validation only on blur or apply
- Cache validation results for identical inputs

### Pitfall 2: Lost Changes on Deselection

**Problem:**
User edits properties but clicks another entity before applying. Changes lost without warning.

**Why It Happens:**
- Selection change clears Properties Panel
- No dirty state check before clearing
- No auto-save on deselection

**Solution:**
- Check dirty state before allowing deselection
- Show confirmation: "You have unsaved changes. Save before switching?"
- Provide options: "Save & Continue", "Discard", "Cancel"
- Alternative: Auto-save changes on deselection

### Pitfall 3: Cascade Updates Cause Infinite Loop

**Problem:**
Property change triggers calculation update, which triggers property update, creating infinite loop.

**Why It Happens:**
- Bidirectional dependency between properties and calculations
- No check for actual value change before updating
- Event listeners trigger on every update, not just meaningful changes

**Solution:**
- Compare new value with current before updating
- Use event flags to prevent circular updates
- Implement update "depth" limit
- Use requestAnimationFrame to batch rapid updates

### Pitfall 4: Batch Edit Overwrites Unintended Fields

**Problem:**
User batch edits 5 items intending to change voltage, but accidentally changes other fields too.

**Why It Happens:**
- Batch mode updates all dirty fields, not just intentionally changed
- User doesn't realize other fields were touched
- No clear indication of which fields will update

**Solution:**
- Show clear summary before batch apply: "Update voltage for 5 items?"
- List exactly which properties will change
- Provide checkbox to select which properties to include in batch
- Highlight changed fields in batch mode

### Pitfall 5: Property Changes Not Persisted

**Problem:**
User applies property changes, sees success message, but changes disappear after page refresh.

**Why It Happens:**
- Auto-save didn't trigger
- EntityStore updated but not persisted to IndexedDB
- Error during save silently failed

**Solution:**
- Guarantee save after property change
- Wait for save confirmation before clearing dirty state
- Show persistent "Saving..." indicator until confirmed
- Retry failed saves with exponential backoff
- Warn user if save fails: "Changes saved locally but not synced"

## 12. Performance Tips

### Tip 1: Virtualize Long Property Lists

For equipment with 50+ properties, use virtual scrolling to render only visible fields.

**Impact:** Reduces initial render time from 500ms to <100ms for complex equipment

### Tip 2: Lazy Load Dropdown Options

Load dropdown options only when user opens dropdown, not on panel mount.

**Impact:** Panel load time reduced by 60% when multiple dropdowns present

### Tip 3: Debounce Validation Appropriately

Debounce real-time validation by 300ms. Use immediate validation only for critical fields.

**Impact:** Reduces validation calls by 90% during typing, prevents UI jank

### Tip 4: Memoize Property Schemas

Cache property schemas per equipment type to avoid recalculation on every render.

**Impact:** Property panel render time reduced by 40%

### Tip 5: Batch DOM Updates

When applying batch edits, batch all DOM updates into single requestAnimationFrame.

**Impact:** Batch edit of 20 items: 2 seconds → 300ms

## 13. Future Enhancements

1. **Property Templates**: Save and reuse common property configurations for quick equipment setup

2. **Smart Defaults**: AI-suggested property values based on equipment type and project context

3. **Property History**: View and revert to previous property values with full change history timeline

4. **Bulk Import**: Import equipment properties from CSV or Excel for large projects

5. **Property Locking**: Lock specific properties to prevent accidental changes during collaboration

6. **Conditional Properties**: Show/hide properties based on other property values (dynamic forms)

7. **Unit Conversion**: Automatic conversion between Imperial/Metric units inline

8. **Property Validation Rules Builder**: Allow admins to define custom validation rules per organization

9. **Property Comments**: Add comments/notes explaining why specific values were chosen

10. **Change Tracking**: Highlight which properties changed recently with visual indicators and timestamps
