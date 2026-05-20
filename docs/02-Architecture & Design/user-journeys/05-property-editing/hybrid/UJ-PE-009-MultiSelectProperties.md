# User Journey: Bulk Editing Multiple Entities

## 1. Overview

### Purpose
This document describes how users efficiently edit properties for multiple selected entities simultaneously through bulk editing operations. Bulk editing enables users to apply common property changes across many equipment items or connections at once, dramatically reducing repetitive manual work and ensuring consistency across similar entities in HVAC system designs.

### Scope
- Selecting multiple entities for bulk editing
- Understanding bulk edit modes and limitations
- Editing common properties across selections
- Handling mixed values in bulk selections
- Applying changes to all selected entities
- Selective property updates in bulk mode
- Bulk validation and error handling
- Undo/redo for bulk operations
- Performance optimization for large selections

### User Personas
- **Primary**: HVAC designers working with repetitive equipment layouts
- **Secondary**: Engineers standardizing equipment specifications
- **Tertiary**: Project coordinators updating project-wide settings

### Success Criteria
- User can select and bulk edit 10+ entities efficiently
- Mixed property values clearly indicated
- Changes apply consistently to all selected entities
- Validation handles bulk operations appropriately
- Single undo operation reverts entire bulk change
- Bulk editing performs smoothly for 100+ entities
- User understands which properties will change
- Selective updates allow partial bulk changes

## 2. PRD References

### Related PRD Sections
- **Section 3.2: Selection System** - Multi-entity selection
- **Section 3.5: Properties Panel** - Property editing interface
- **Section 4.4: Entity Management** - Bulk property operations
- **Section 4.10: Batch Operations** - Bulk editing architecture
- **Section 5.4: Right Sidebar** - Bulk properties display

### Key Requirements Addressed
- REQ-BE-001: Users must be able to edit properties for multiple selected entities
- REQ-BE-002: Bulk edit must clearly indicate mixed property values
- REQ-BE-003: Changes must apply atomically to all selected entities
- REQ-BE-004: Bulk operations must support selective property updates
- REQ-BE-005: Validation must work correctly for bulk operations
- REQ-BE-006: Single undo must revert entire bulk change
- REQ-BE-007: Bulk editing must perform efficiently for 100+ entities
- REQ-BE-008: Type-filtered bulk edit for same entity types only

## 3. Prerequisites

### User Prerequisites
- User has multiple entities on canvas to select
- User understands multi-selection techniques
- User knows which properties to modify in bulk

### System Prerequisites
- Canvas Page loaded with entities
- Properties Panel available
- EntityStore populated with entity data
- Multi-selection enabled

### Data Prerequisites
- Multiple entities of compatible types exist
- Entities have common editable properties
- Entity data structure supports bulk updates

### Technical Prerequisites
- Batch update command system operational
- Validation service handles bulk operations
- Performance optimizations for large selections active

## 4. User Journey Steps

### Step 1: Selecting Multiple Entities for Bulk Editing

**User Actions:**
1. User holds Ctrl key (Windows/Linux) or Cmd key (Mac)
2. User clicks on multiple entities on canvas
3. User observes multiple entities highlighted
4. User reviews selection count in status bar
5. User opens Properties Panel to begin bulk editing

**System Response:**
1. When user holds Ctrl/Cmd and clicks entity:
   - System adds entity to `selectedEntities` array in EntityStore
   - Does not clear previous selection (additive selection)
   - Visual highlight applied to newly selected entity

2. System tracks all selected entities:
   - Selection count: Updates in real-time
   - Status bar shows: "5 entities selected"
   - All selected entities highlighted with blue outline

3. Alternative selection methods:

   **Drag-Select (Marquee Selection):**
   - User clicks and drags on empty canvas area
   - System shows selection rectangle
   - All entities within rectangle selected on mouse release

   **Shift-Click Range Selection:**
   - User clicks first entity
   - User holds Shift and clicks last entity
   - System selects all entities between first and last

   **Select All (Ctrl+A):**
   - Selects all entities of currently selected type
   - If AHU selected, Ctrl+A selects all AHUs
   - Status bar shows: "12 Air Handler Units selected"

4. When user opens Properties Panel with multi-selection:
   - System analyzes selected entities
   - Determines if all same type or mixed types
   - Loads appropriate bulk editing interface

**Visual State:**

```
Canvas - Multiple Selection:

┌────────────────────────────────────────────────┐
│                                                │
│   ╔════════╗      ╔════════╗      ╔════════╗  │
│   ║ AHU-1  ║      ║ AHU-2  ║      ║ AHU-3  ║  │
│   ║ Selected      ║ Selected      ║ Selected  │
│   ╚════════╝      ╚════════╝      ╚════════╝  │
│                                                │
│   ╔════════╗      □────────□                  │
│   ║ AHU-4  ║      │ VAV-1  │ Not selected    │
│   ║ Selected      └────────┘                  │
│   ╚════════╝                                  │
│                                                │
└────────────────────────────────────────────────┘

Status Bar:
┌────────────────────────────────────────────────┐
│ 4 Air Handler Units selected | Zoom: 100%     │
└────────────────────────────────────────────────┘

Marquee Selection:

┌────────────────────────────────────────────────┐
│                                                │
│   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐      │
│   │  ┌────────┐      ┌────────┐        │      │
│      │ AHU-1  │      │ AHU-2  │        │      │
│   │  └────────┘      └────────┘        │      │
│                                                │
│   │  ┌────────┐                        │      │
│      │ AHU-3  │                                │
│   │  └────────┘                        │      │
│   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘      │
│      ↑ Selection rectangle (dashed)            │
└────────────────────────────────────────────────┘
```

**User Feedback:**
- Visual selection highlight on all selected entities
- Status bar shows count and type of selection
- Properties Panel title reflects multi-selection
- Selection rectangle provides visual feedback during drag

**Related Elements:**
- Components: `SelectionManager`, `MarqueeSelector`, `StatusBar`
- Stores: `EntityStore` (selectedEntities array)
- Services: `SelectionService`
- Events: `SelectionChangedEvent`

### Step 2: Understanding Bulk Edit Interface and Mixed Values

**User Actions:**
1. User observes Properties Panel in bulk edit mode
2. User reviews which properties show common values
3. User identifies fields with mixed values (different across selection)
4. User understands implications of editing mixed value fields
5. User decides which properties to update

**System Response:**
1. System analyzes all selected entities:
   - Compares property values across selection
   - Identifies properties with same value (common values)
   - Identifies properties with different values (mixed values)

2. Properties Panel displays bulk edit mode:
   - Title: "Multiple Items (4) - Air Handler Unit"
   - Subtitle: "Changes will apply to all 4 selected items"

3. For each property field:

   **Common Value (All Same):**
   - Display actual value: "5000 CFM"
   - Field appears normal, editable
   - No special indicator needed

   **Mixed Values (Different):**
   - Display placeholder: "(Mixed values)"
   - Grayed text, italicized
   - Info icon (ⓘ) with tooltip showing all values
   - Checkbox appears: "Update this field"

4. Tooltip for mixed value field shows:
   - List of unique values in selection
   - Count for each value
   - Example: "AHU-1: 5000 CFM, AHU-2: 6000 CFM, AHU-3: 5000 CFM, AHU-4: 7000 CFM"

5. Update behavior:
   - **Common value field:** Any edit updates all entities
   - **Mixed value field:** Only updates if user explicitly checks "Update this field"

6. System provides bulk edit guidance:
   - Warning banner: "⚠ Editing properties will update all 4 selected entities"
   - Checkbox: "Show confirmation before applying bulk changes"

**Visual State:**

```
Properties Panel - Bulk Edit Mode:

┌────────────────────────────────────────────────┐
│ Multiple Items (4) - Air Handler Unit     [×] │
├────────────────────────────────────────────────┤
│ ⚠ Changes will apply to all 4 selected items  │
├────────────────────────────────────────────────┤
│                                                │
│ ▼ Performance Specifications                   │
│                                                │
│   Airflow (CFM): * ⓘ                           │
│   ┌──────────────────────────────────────────┐ │
│   │ (Mixed values)                           │ │ ← Grayed
│   └──────────────────────────────────────────┘ │
│   ☐ Update this field                          │
│   ℹ Values: 5000 (×2), 6000 (×1), 7000 (×1)   │
│                                                │
│   Cooling Capacity (Tons): * ⓘ                 │
│   ┌──────────────────────────────────────────┐ │
│   │ 5                                        │ │ ← Common value
│   └──────────────────────────────────────────┘ │
│   (All items have same value)                  │
│                                                │
│   Voltage: *                                   │
│   ┌──────────────────────────────────────────┐ │
│   │ 480V ▼                                   │ │ ← Common value
│   └──────────────────────────────────────────┘ │
│                                                │
│   Manufacturer: *                              │
│   ┌──────────────────────────────────────────┐ │
│   │ (Mixed values)                           │ │
│   └──────────────────────────────────────────┘ │
│   ☐ Update this field                          │
│   ℹ Values: York (×3), Trane (×1)             │
│                                                │
│            [Apply to All]  [Reset]             │
└────────────────────────────────────────────────┘

Mixed Value Tooltip (on hover ⓘ):

┌────────────────────────────────────┐
│ Airflow Values Across Selection    │
│ ──────────────────────────────     │
│ • AHU-1: 5000 CFM                  │
│ • AHU-2: 6000 CFM                  │
│ • AHU-3: 5000 CFM                  │
│ • AHU-4: 7000 CFM                  │
│                                    │
│ To set all to same value, check    │
│ "Update this field" and enter      │
│ desired value.                     │
└────────────────────────────────────┘
```

**User Feedback:**
- Clear indication of bulk edit mode in title
- Warning banner emphasizes impact of changes
- Mixed values clearly distinguished from common values
- Tooltip provides full visibility into current values
- Update checkbox gives explicit control over mixed fields

**Related Elements:**
- Components: `BulkPropertiesPanel`, `MixedValueField`, `ValueDistributionTooltip`
- Services: `BulkEditService`, `PropertyComparator`
- Utils: `findCommonValues`, `detectMixedValues`

### Step 3: Editing Properties in Bulk Mode

**User Actions:**
1. User modifies common value field (e.g., changes Voltage to 208V)
2. User checks "Update this field" for mixed value property
3. User enters new value for mixed field (e.g., Airflow: 6000 CFM)
4. User reviews summary of pending changes
5. User clicks "Apply to All"

**System Response:**
1. When user edits common value field:
   - System marks field as dirty with orange indicator
   - Value will apply to all selected entities
   - No additional confirmation needed

2. When user checks "Update this field" on mixed value:
   - Field becomes editable (no longer grayed)
   - Placeholder changes to: "Enter value for all items"
   - User can now input value

3. When user enters value in updated mixed field:
   - System validates input normally
   - Value will replace all different values in selection
   - Field marked as dirty

4. System tracks all pending changes:
   - List of modified properties
   - Old values (if common) or "(mixed)" indicator
   - New values to apply

5. Before applying, system may show confirmation:
   - "Apply changes to 4 Air Handler Units?"
   - List of properties being changed
   - Before/After preview for common values

6. When user clicks "Apply to All":
   - System validates all changes
   - Creates BulkPropertyChangeCommand
   - Applies changes to all selected entities atomically
   - Updates EntityStore for all entities
   - Triggers dependent updates (BOM, calculations) once for batch

7. Success feedback:
   - Toast: "4 entities updated successfully"
   - Properties Panel refreshes showing new common values
   - Canvas entities re-render with updated properties

**Visual State:**

```
Editing in Progress:

┌────────────────────────────────────────────────┐
│ Multiple Items (4) - Air Handler Unit         │
├────────────────────────────────────────────────┤
│                                                │
│   Voltage: *                                   │
│   ┌──────────────────────────────────────────┐ │
│   │ 208V ▼                               ●   │ │ ← Dirty
│   └──────────────────────────────────────────┘ │
│   Was: 480V → Will be: 208V                    │
│                                                │
│   Airflow (CFM): *                             │
│   ┌──────────────────────────────────────────┐ │
│   │ 6000                                 ●   │ │ ← Dirty
│   └──────────────────────────────────────────┘ │
│   ☑ Update this field                          │
│   Was: Mixed → Will be: 6000 for all           │
│                                                │
│            [Apply to All]  [Reset]             │
└────────────────────────────────────────────────┘

Confirmation Dialog:

┌────────────────────────────────────────────────┐
│ Apply Changes to Multiple Entities?           │
├────────────────────────────────────────────────┤
│                                                │
│ The following changes will be applied to       │
│ 4 Air Handler Units:                           │
│                                                │
│ • Voltage: 480V → 208V                         │
│ • Airflow (CFM): (Mixed) → 6000                │
│                                                │
│ Affected entities:                             │
│ AHU-1, AHU-2, AHU-3, AHU-4                     │
│                                                │
│ ⚠ This action cannot be undone except via     │
│   Undo button (Ctrl+Z)                         │
│                                                │
│ ☐ Don't show this confirmation again           │
│                                                │
│        [Apply to All]     [Cancel]             │
└────────────────────────────────────────────────┘

After Apply - Success:

┌────────────────────────────────────┐
│ ✓ 4 entities updated successfully  │
└────────────────────────────────────┘

Properties Panel (after apply):
┌────────────────────────────────────────────────┐
│ Multiple Items (4) - Air Handler Unit         │
├────────────────────────────────────────────────┤
│                                                │
│   Voltage: *                                   │
│   ┌──────────────────────────────────────────┐ │
│   │ 208V ▼                                   │ │ ← No longer dirty
│   └──────────────────────────────────────────┘ │
│   (All items now have same value)              │
│                                                │
│   Airflow (CFM): *                             │
│   ┌──────────────────────────────────────────┐ │
│   │ 6000                                     │ │ ← Now common
│   └──────────────────────────────────────────┘ │
│   (All items now have same value)              │
│                                                │
└────────────────────────────────────────────────┘
```

**User Feedback:**
- Dirty indicators show which properties will change
- Before/After preview confirms changes
- Confirmation dialog summarizes bulk operation
- Success toast confirms completion
- Properties Panel updates to show new common values

**Related Elements:**
- Components: `BulkEditConfirmDialog`, `ChangePreview`, `Toast`
- Commands: `BulkPropertyChangeCommand`
- Services: `BulkUpdateService`
- Stores: `EntityStore`, `HistoryStore`

### Step 4: Selective Bulk Updates and Advanced Options

**User Actions:**
1. User wants to update only specific properties for selected entities
2. User uses "Quick Actions" for common bulk operations
3. User applies preset to multiple entities
4. User uses "Copy Properties" to duplicate settings
5. User performs incremental bulk updates

**System Response:**
1. **Selective Property Update:**
   - User can modify subset of properties
   - Unchecked mixed value fields remain unchanged
   - Only dirty fields updated on apply

2. **Quick Actions Menu:**
   System provides common bulk operations:

   **Set Manufacturer:**
   - Quick dropdown to set manufacturer for all
   - Automatically updates model options

   **Standardize Voltage:**
   - One-click to set all to common voltage
   - Options: 120V, 208V, 240V, 480V

   **Match First Selected:**
   - Copies all properties from first selected entity
   - Applies to rest of selection

   **Apply Preset:**
   - Opens preset browser
   - Applies selected preset to all entities
   - Single batch operation

3. **Copy Properties to Multiple:**
   - User selects source entity
   - User selects target entities
   - User chooses which properties to copy:
     - All properties
     - Performance only
     - Electrical only
     - Custom selection
   - System copies selected properties to all targets

4. **Incremental Updates:**
   - Add value: Increase all airflows by 500 CFM
   - Multiply value: Scale all capacities by 1.1x
   - Formula: Apply calculation to all

5. **Conditional Bulk Update:**
   - Update only entities matching condition
   - Example: "Set voltage to 480V for units >5 tons"
   - Filter selection, then bulk edit

**Visual State:**

```
Quick Actions Menu:

┌────────────────────────────────────────────────┐
│ Bulk Edit Quick Actions                       │
├────────────────────────────────────────────────┤
│                                                │
│ ⚡ Set Manufacturer                            │
│   ┌──────────────────────────────────────────┐ │
│   │ York ▼                                   │ │
│   └──────────────────────────────────────────┘ │
│   [Apply to All 4 Items]                       │
│                                                │
│ ⚡ Standardize Voltage                         │
│   ⦿ 120V  ○ 208V  ⦿ 240V  ○ 480V              │
│   [Apply to All 4 Items]                       │
│                                                │
│ ⚡ Match First Selected (AHU-1)                │
│   Copy all properties from AHU-1 to others     │
│   [Match Properties]                           │
│                                                │
│ ⚡ Apply Preset                                │
│   Apply saved preset to all selected items     │
│   [Browse Presets]                             │
│                                                │
└────────────────────────────────────────────────┘

Copy Properties Dialog:

┌────────────────────────────────────────────────┐
│ Copy Properties from AHU-1                     │
├────────────────────────────────────────────────┤
│                                                │
│ Copy to: 3 other Air Handler Units            │
│ (AHU-2, AHU-3, AHU-4)                          │
│                                                │
│ Select properties to copy:                     │
│                                                │
│ Quick Select:                                  │
│ [All] [Performance] [Electrical] [Custom]      │
│                                                │
│ ☑ Airflow (CFM): 5000                          │
│ ☑ Cooling Capacity (Tons): 5                   │
│ ☑ Voltage: 480V                                │
│ ☑ Manufacturer: York                           │
│ ☑ Model: MCA Series                            │
│ ☐ Equipment Tag: AHU-1    ← Excluded          │
│ ☐ Unit Cost: $3,500       ← Excluded          │
│                                                │
│ 5 of 7 properties selected                     │
│                                                │
│      [Copy to Selected]     [Cancel]           │
└────────────────────────────────────────────────┘

Incremental Update:

┌────────────────────────────────────────────────┐
│ Incremental Bulk Update                        │
├────────────────────────────────────────────────┤
│                                                │
│ Property: Airflow (CFM)                        │
│                                                │
│ Operation:                                     │
│ ⦿ Add          ○ Subtract                      │
│ ○ Multiply by  ○ Divide by                     │
│                                                │
│ Value:                                         │
│ ┌──────────────────────────────────────────┐   │
│ │ 500                                      │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ Preview:                                       │
│ • AHU-1: 5000 → 5500 CFM                       │
│ • AHU-2: 6000 → 6500 CFM                       │
│ • AHU-3: 5000 → 5500 CFM                       │
│ • AHU-4: 7000 → 7500 CFM                       │
│                                                │
│        [Apply]     [Cancel]                    │
└────────────────────────────────────────────────┘
```

**User Feedback:**
- Quick actions provide one-click bulk operations
- Copy properties interface clear about what's copying
- Incremental update shows preview of changes
- Multiple paths to accomplish bulk updates efficiently

**Related Elements:**
- Components: `QuickActionsMenu`, `CopyPropertiesDialog`, `IncrementalUpdateDialog`
- Services: `BulkEditService`, `PropertyCopyService`
- Utils: `incrementalCalculator`

### Step 5: Bulk Validation and Undo

**User Actions:**
1. User applies bulk changes
2. System validates changes for all entities
3. User reviews any validation errors
4. User corrects errors or proceeds with warnings
5. User performs undo if needed to revert bulk change

**System Response:**
1. **Bulk Validation:**
   - System validates each entity individually
   - Collects all validation errors/warnings
   - Groups similar errors for display

2. Validation results display:

   **All Pass:**
   - Proceed with bulk update normally
   - Success toast after application

   **Some Fail:**
   - Show validation summary
   - List failed entities with errors
   - Options:
     - Fix errors and retry
     - Apply to valid entities only (skip failed)
     - Cancel entire operation

   **All Fail:**
   - Block bulk update
   - Show all errors
   - User must fix before proceeding

3. Validation summary example:
   ```
   Validation Results for 4 entities:

   ✓ 2 entities valid (AHU-1, AHU-3)
   ✗ 2 entities have errors (AHU-2, AHU-4)

   Errors:
   • AHU-2: Airflow below minimum for cooling capacity
   • AHU-4: Voltage incompatible with current amperage
   ```

4. **Partial Application:**
   - If user selects "Apply to Valid Only"
   - System creates batch command for valid entities only
   - Failed entities remain unchanged
   - Summary: "2 of 4 entities updated. 2 skipped due to errors."

5. **Undo Bulk Changes:**
   - User presses Ctrl+Z or clicks Undo
   - System retrieves BulkPropertyChangeCommand from undo stack
   - Single undo reverts ALL entities in bulk operation
   - Toast: "Undone: Bulk edit of 4 Air Handler Units"
   - All entities restore previous values simultaneously

6. **Redo Bulk Changes:**
   - User presses Ctrl+Shift+Z or clicks Redo
   - System reapplies bulk changes to all entities
   - Toast: "Redone: Bulk edit of 4 Air Handler Units"

**Visual State:**

```
Bulk Validation Results:

┌────────────────────────────────────────────────┐
│ Validation Results - Bulk Update              │
├────────────────────────────────────────────────┤
│                                                │
│ ✓ 2 entities valid                            │
│ ✗ 2 entities have errors                      │
│                                                │
│ Valid Entities:                                │
│ • AHU-1 ✓                                      │
│ • AHU-3 ✓                                      │
│                                                │
│ Invalid Entities:                              │
│ ┌────────────────────────────────────────────┐ │
│ │ AHU-2                                   ✗  │ │
│ │ ⚠ Airflow (6000 CFM) below minimum for    │ │
│ │   cooling capacity (8 tons)                │ │
│ │   Required: ≥7000 CFM                      │ │
│ │ [Fix] [Skip]                               │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │ AHU-4                                   ✗  │ │
│ │ ⚠ Voltage (208V) may be insufficient for  │ │
│ │   Full Load Amps (45 FLA)                  │ │
│ │   Consider 480V for this amperage          │ │
│ │ [Fix] [Skip]                               │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Options:                                       │
│ [Apply to Valid Only (2)]  [Fix Errors]  [Cancel]│
└────────────────────────────────────────────────┘

Partial Application Result:

┌────────────────────────────────────┐
│ ⚠ Partial Update Complete          │
│                                    │
│ 2 of 4 entities updated:           │
│ ✓ AHU-1, AHU-3                     │
│                                    │
│ 2 entities skipped due to errors:  │
│ ✗ AHU-2, AHU-4                     │
│                                    │
│ [Review Skipped Entities]          │
└────────────────────────────────────┘

Undo Toast:

┌────────────────────────────────────┐
│ ↶ Undone: Bulk edit                │
│   Updated 4 Air Handler Units      │
└────────────────────────────────────┘
```

**User Feedback:**
- Validation results clearly show valid vs. invalid entities
- Specific errors for each failed entity
- Option to proceed with partial update
- Undo provides safety net for bulk changes
- Clear summary of what was updated/skipped

**Related Elements:**
- Components: `BulkValidationResults`, `PartialUpdateDialog`, `UndoToast`
- Commands: `BulkPropertyChangeCommand` (with undo/redo)
- Services: `BulkValidationService`
- Stores: `HistoryStore`

## 5. Edge Cases and Handling

### Edge Case 1: Mixed Entity Types in Selection

**Scenario:**
User selects entities of different types (e.g., 3 AHUs and 2 VAVs).

**Handling:**
1. System detects mixed entity types in selection
2. System shows warning in Properties Panel:
   - "Mixed entity types selected (3 AHU, 2 VAV)"
   - "Only common properties can be edited"
3. System identifies properties common to all types:
   - Name, Description, Tags (universal properties)
   - Custom properties if defined for both types
4. System hides type-specific properties
5. Alternative: Provide tabs for each type
   - "Air Handler Units (3)" tab
   - "VAV Boxes (2)" tab
   - User edits each type separately

**User Impact:**
- Medium: Limited to common properties only
- Clear indication of limitation
- Tab option provides workaround

### Edge Case 2: Performance Degradation with Large Selection (200+ entities)

**Scenario:**
User selects 200+ entities for bulk editing, causing UI lag.

**Handling:**
1. System detects large selection (>100 entities)
2. System implements performance optimizations:
   - Disable real-time property comparison (too expensive)
   - Use "All values will be updated" instead of detecting mixed
   - Batch UI updates using requestAnimationFrame
   - Show progress indicator during apply
3. System warns user:
   - "Large selection (215 entities). Bulk update may take a moment."
4. System processes in background with Web Worker
5. Progress indicator: "Updating entities... 143/215"
6. Cancel option available during long operation

**User Impact:**
- Low: Performance maintained through optimization
- User informed of slower operation
- Progress visibility reduces perceived wait time

### Edge Case 3: Circular Dependencies in Bulk Edit

**Scenario:**
Bulk editing creates circular dependency where Entity A's property affects Entity B, which affects Entity A.

**Handling:**
1. System detects potential circular dependencies before applying
2. System analyzes entity relationships in selection
3. If circular dependency found:
   - Show warning: "Circular dependency detected in selection"
   - Explain: "Entity A's property affects Entity B, which affects Entity A"
   - Recommend: "Edit entities individually or break dependency"
4. System prevents application until resolved
5. User options:
   - Cancel bulk operation
   - Remove problematic entities from selection
   - Edit in multiple passes

**User Impact:**
- Medium: Unusual scenario, clear guidance provided
- Prevention of invalid state

### Edge Case 4: Bulk Edit During Active Calculation

**Scenario:**
User applies bulk edit while calculations are running for some entities in selection.

**Handling:**
1. System checks calculation state before bulk update
2. If calculations in progress:
   - Show warning: "Calculations in progress for some entities"
   - Option: "Cancel calculations and proceed" or "Wait for calculations"
3. If user proceeds:
   - System cancels active calculations
   - Applies bulk changes
   - Re-triggers calculations after update complete
4. System ensures no race conditions between update and calculation

**User Impact:**
- Low: Automatic handling with user choice
- Prevents data inconsistency

### Edge Case 5: Partial Network Failure During Cloud Sync

**Scenario:**
Bulk changes apply locally but cloud sync fails for some entities.

**Handling:**
1. System applies all changes locally first (fast, atomic)
2. System attempts cloud sync in background
3. If sync fails for subset of entities:
   - Show notification: "2 of 4 entities failed to sync to cloud"
   - List failed entities
   - Retry option available
4. System queues failed syncs for retry
5. Periodic retry with exponential backoff
6. User can continue working; sync happens in background

**User Impact:**
- Low: Local changes immediate and reliable
- Background sync doesn't block workflow

## 6. Error Scenarios and Recovery

### Error Scenario 1: Bulk Update Transaction Fails Midway

**Error Condition:**
Bulk update succeeds for first 5 entities but fails on 6th due to unexpected error.

**System Detection:**
1. BulkUpdateService processes entities sequentially
2. Error thrown during 6th entity update
3. Transaction integrity check fails

**Error Message:**
```
⚠ Bulk Update Failed
Update succeeded for 5 entities but failed for remaining entities.
Error: [Specific error message]
```

**Recovery Steps:**
1. System implements transactional bulk updates:
   - All changes applied in memory first
   - Validation performed on all before commit
   - If any fail, none commit (all-or-nothing)
2. If partial update detected:
   - System rolls back successful changes
   - Restores all entities to previous state
   - Reports which entity caused failure
3. User options:
   - "Retry All" - Attempt bulk update again
   - "Skip Failed Entity" - Exclude problem entity and retry
   - "Cancel" - Abandon bulk update
4. System logs error for debugging

**User Recovery Actions:**
- Review error message for problematic entity
- Exclude or fix problem entity
- Retry bulk operation
- Contact support if error persists

**Prevention:**
- Comprehensive pre-validation before commit
- Transactional updates (all-or-nothing)
- Entity isolation to prevent cascade failures

### Error Scenario 2: Undo Fails to Revert Bulk Changes

**Error Condition:**
User attempts undo after bulk edit, but undo operation fails to restore previous values.

**System Detection:**
1. User presses Ctrl+Z after bulk edit
2. BulkPropertyChangeCommand.undo() called
3. Undo operation throws error or state mismatch detected

**Error Message:**
```
⚠ Undo Failed
Unable to revert bulk changes. Some entities may not have been restored.
Error Code: ERR_UNDO_BULK_FAILED
```

**Recovery Steps:**
1. System captures before-state for all entities in command:
   - Each entity's previous property values stored
   - Deep copy to prevent reference issues
2. On undo failure:
   - System identifies which entities failed to restore
   - System shows affected entities
   - System offers manual revert
3. Manual revert option:
   - Shows before/after values for each entity
   - User selects which entities to manually restore
   - System applies selected reverts
4. System prevents further undo/redo until resolved

**User Recovery Actions:**
- Use manual revert for affected entities
- Reload project from last saved state
- Restore from auto-save backup
- Contact support with error code

**Prevention:**
- Thorough testing of undo/redo logic
- Deep copying of before-states
- Validation of undo operation success
- Auto-save before bulk operations

### Error Scenario 3: Memory Exhaustion on Extremely Large Bulk Edit

**Error Condition:**
User selects 1000+ entities, exhausting browser memory during bulk update.

**System Detection:**
1. System attempts to process bulk update
2. Browser memory usage spikes
3. System becomes unresponsive or crashes

**Error Message:**
```
⚠ Selection Too Large
Bulk editing 1000+ entities may exhaust system memory.
Recommended: Select fewer entities (<500) at a time.
```

**Recovery Steps:**
1. System detects selection size before processing:
   - Count selected entities
   - Estimate memory requirements
2. If selection exceeds safe threshold (500 entities):
   - Show warning before proceeding
   - Recommend chunking selection
3. If user proceeds anyway:
   - Process in chunks (100 entities at a time)
   - Show progress: "Processing entities 1-100 of 1247"
   - Yield to browser between chunks to prevent freeze
4. If memory exhaustion detected:
   - System cancels operation gracefully
   - Shows out-of-memory error
   - Recommends reducing selection size

**User Recovery Actions:**
- Select fewer entities per bulk operation
- Use filters to create smaller targeted selections
- Break large update into multiple smaller operations
- Consider using preset application instead

**Prevention:**
- Hard limit on bulk selection size (e.g., max 500)
- Memory estimation before processing
- Chunked processing for large operations
- Performance mode for large projects

## 7. Keyboard Shortcuts

### Bulk Selection

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Click` | Add to selection | Add entity to existing selection |
| `Shift+Click` | Range select | Select range between first and last clicked |
| `Ctrl+A` | Select all type | Select all entities of currently selected type |
| `Ctrl+Shift+A` | Select all | Select absolutely all entities on canvas |
| `Ctrl+D` | Deselect all | Clear all selections |
| `Esc` | Deselect | Clear selection (alternative) |

### Bulk Editing

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Shift+E` | Open bulk editor | Open Properties Panel in bulk edit mode |
| `Ctrl+Enter` | Apply to all | Apply bulk changes (when valid) |
| `Alt+M` | Match first | Copy properties from first selected to others |
| `Ctrl+Shift+C` | Copy properties | Open copy properties dialog |
| `Ctrl+Shift+V` | Paste properties | Paste copied properties to selection |

### Bulk Operations

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Z` | Undo bulk edit | Revert entire bulk operation |
| `Ctrl+Shift+Z` | Redo bulk edit | Reapply bulk operation |
| `F8` | Next validation error | Jump to next entity with validation error |
| `Shift+F8` | Previous error | Jump to previous entity with error |

**Note:** All shortcuts respect current focus and context.

## 8. Related Elements

### Components
- `BulkPropertiesPanel`: Bulk editing interface
  - Location: `src/components/properties/BulkPropertiesPanel.tsx`
  - Props: `selectedEntities`, `onApply`, `onCancel`

- `MixedValueField`: Mixed value indicator field
  - Location: `src/components/properties/MixedValueField.tsx`
  - Props: `values`, `onUpdate`, `showDistribution`

- `BulkEditConfirmDialog`: Bulk update confirmation
  - Location: `src/components/bulk/BulkEditConfirmDialog.tsx`
  - Props: `changes`, `entityCount`, `onConfirm`, `onCancel`

- `BulkValidationResults`: Validation summary for bulk
  - Location: `src/components/bulk/BulkValidationResults.tsx`
  - Props: `results`, `onApplyValid`, `onFixErrors`

- `QuickActionsMenu`: Common bulk operations
  - Location: `src/components/bulk/QuickActionsMenu.tsx`
  - Props: `selectedEntities`, `onActionSelect`

- `CopyPropertiesDialog`: Property copying interface
  - Location: `src/components/bulk/CopyPropertiesDialog.tsx`
  - Props: `sourceEntity`, `targetEntities`, `onCopy`

- `MarqueeSelector`: Drag-select rectangle
  - Location: `src/components/selection/MarqueeSelector.tsx`
  - Props: `onSelectionComplete`, `bounds`

### Services
- `BulkEditService`: Bulk editing operations
  - Location: `src/services/BulkEditService.ts`
  - Methods: `applyBulkChanges()`, `validateBulk()`, `findCommonValues()`, `detectMixedValues()`

- `BulkValidationService`: Bulk validation logic
  - Location: `src/services/BulkValidationService.ts`
  - Methods: `validateAll()`, `partialValidation()`, `groupErrors()`

- `PropertyComparator`: Compare properties across entities
  - Location: `src/services/PropertyComparator.ts`
  - Methods: `compareProperties()`, `findDifferences()`, `getDistribution()`

- `BulkUpdateService`: Transaction management for bulk updates
  - Location: `src/services/BulkUpdateService.ts`
  - Methods: `beginTransaction()`, `commitAll()`, `rollbackAll()`, `processInChunks()`

### Commands
- `BulkPropertyChangeCommand`: Undo/redo for bulk edits
  - Location: `src/commands/BulkPropertyChangeCommand.ts`
  - Methods: `execute()`, `undo()`, `redo()`, `merge()`
  - Data: `entityIds[]`, `propertyChanges`, `beforeStates`, `afterStates`

### Stores
- `EntityStore`: Entity data management
  - Location: `src/stores/EntityStore.ts`
  - State: `entities`, `selectedEntities`
  - Actions: `bulkUpdateProperties()`, `selectMultiple()`, `clearSelection()`

- `BulkEditStore`: Bulk editing state
  - Location: `src/stores/BulkEditStore.ts`
  - State: `commonValues`, `mixedValues`, `pendingChanges`
  - Actions: `analyzeSelection()`, `trackChanges()`, `applyBulk()`

- `HistoryStore`: Undo/redo management
  - Location: `src/stores/HistoryStore.ts`
  - State: `undoStack`, `redoStack`
  - Actions: `pushBulkCommand()`, `undo()`, `redo()`

### Hooks
- `useBulkEdit`: Bulk editing logic
  - Location: `src/hooks/useBulkEdit.ts`
  - Returns: `commonValues`, `mixedValues`, `applyBulk()`, `analyzSelection()`

- `useBulkSelection`: Multi-selection management
  - Location: `src/hooks/useBulkSelection.ts`
  - Returns: `selectedEntities`, `selectMultiple()`, `clearSelection()`, `selectionCount`

- `useBulkValidation`: Bulk validation logic
  - Location: `src/hooks/useBulkValidation.ts`
  - Returns: `validationResults`, `validateBulk()`, `hasErrors`

### Utils
- `findCommonValues`: Identify common property values
  - Location: `src/utils/propertyComparison.ts`
  - Function: Compares values across entity array

- `detectMixedValues`: Identify properties with different values
  - Location: `src/utils/propertyComparison.ts`
  - Function: Returns properties with non-uniform values

- `chunkArray`: Split large arrays for processing
  - Location: `src/utils/arrayUtils.ts`
  - Function: Divides array into smaller chunks

## 9. Visual Diagrams

### Bulk Edit Flow

```
User Selects Multiple Entities
         │
         v
┌────────────────────────┐
│ Analyze selection:     │
│ - Count entities       │
│ - Check types match    │
│ - Compare property vals│
└──────────┬─────────────┘
           │
           v
┌──────────────────────────┐
│ Display Bulk Properties: │
│ - Common values          │
│ - Mixed values (grayed)  │
│ - Update checkboxes      │
└──────────┬───────────────┘
           │
    User edits properties
           │
           v
┌──────────────────────────┐
│ Track changes:           │
│ - Mark dirty fields      │
│ - Store new values       │
└──────────┬───────────────┘
           │
   User clicks "Apply to All"
           │
           v
┌──────────────────────────┐
│ Validate all changes:    │
│ - Field-level validation │
│ - Cross-field validation │
└──────────┬───────────────┘
           │
       ┌───┴────┐
       │        │
    Valid    Invalid
       │        │
       v        v
┌────────┐  ┌──────────────┐
│Create  │  │Show errors   │
│Bulk    │  │Offer partial │
│Command │  │application   │
└───┬────┘  └──────────────┘
    │
    v
┌────────────────────────┐
│ Apply atomically:      │
│ FOR EACH entity:       │
│   Update properties    │
│   Store before state   │
└──────────┬─────────────┘
           │
           v
┌────────────────────────┐
│ Post-update:           │
│ - Trigger BOM recalc   │
│ - Run calculations     │
│ - Re-render entities   │
│ - Show success toast   │
└────────────────────────┘
```

### Mixed Value Detection

```
Selected Entities:
  AHU-1: {airflow: 5000, voltage: "480V", manufacturer: "York"}
  AHU-2: {airflow: 6000, voltage: "480V", manufacturer: "York"}
  AHU-3: {airflow: 5000, voltage: "480V", manufacturer: "Trane"}
  AHU-4: {airflow: 7000, voltage: "208V", manufacturer: "York"}

         │
         v
┌────────────────────────────────────────┐
│ Property Comparison                    │
├────────────────────────────────────────┤
│ airflow:                               │
│   Values: [5000, 6000, 5000, 7000]     │
│   Unique: [5000, 6000, 7000]           │
│   Status: MIXED ⚠                      │
│                                        │
│ voltage:                               │
│   Values: ["480V", "480V", "480V", "208V"]│
│   Unique: ["480V", "208V"]             │
│   Status: MIXED ⚠                      │
│                                        │
│ manufacturer:                          │
│   Values: ["York", "York", "Trane", "York"]│
│   Unique: ["York", "Trane"]            │
│   Status: MIXED ⚠                      │
└────────────────────────────────────────┘
         │
         v
┌────────────────────────────────────────┐
│ Display in Bulk Properties Panel:      │
│                                        │
│ Airflow: (Mixed values)        [☐ Update]│
│ Voltage: (Mixed values)        [☐ Update]│
│ Manufacturer: (Mixed values)   [☐ Update]│
└────────────────────────────────────────┘
```

### Bulk Update Transaction

```
BEGIN TRANSACTION
       │
       v
┌────────────────────────┐
│ Validate all entities  │
│ before committing      │
└──────────┬─────────────┘
           │
       ┌───┴────┐
       │All valid?
       └───┬────┘
           │
      ┌────┴────┐
      │         │
    Yes        No
      │         │
      v         v
  ┌──────┐  ┌────────┐
  │Commit│  │Rollback│
  │All   │  │Show    │
  │      │  │Errors  │
  └──┬───┘  └────────┘
     │
     v
┌──────────────────────────┐
│ FOR EACH entity:         │
│   1. Store before state  │
│   2. Apply changes       │
│   3. Validate result     │
│   4. If valid, continue  │
│   5. If invalid, ABORT   │
└──────────┬───────────────┘
           │
       All succeed?
           │
      ┌────┴────┐
      │         │
    Yes        No
      │         │
      v         v
  ┌──────┐  ┌──────────────┐
  │COMMIT│  │ROLLBACK ALL  │
  │Save  │  │Restore states│
  │All   │  │Show error    │
  └──────┘  └──────────────┘

TRANSACTION COMPLETE
```

## 10. Testing

### Unit Tests

**BulkEditService Tests:**
```
describe('BulkEditService', () => {
  test('findCommonValues identifies properties with same value across all entities')
  test('detectMixedValues identifies properties with different values')
  test('applyBulkChanges updates all entities atomically')
  test('applyBulkChanges rolls back on error')
  test('partial update applies only to valid entities')
  test('handles empty selection gracefully')
  test('handles single entity selection (degrades to normal edit)')
})
```

**PropertyComparator Tests:**
```
describe('PropertyComparator', () => {
  test('compareProperties detects identical values')
  test('compareProperties detects mixed values')
  test('getDistribution returns correct value counts')
  test('handles null and undefined values')
  test('deep compares object properties')
  test('handles arrays correctly')
})
```

**BulkPropertyChangeCommand Tests:**
```
describe('BulkPropertyChangeCommand', () => {
  test('execute applies changes to all entities')
  test('undo reverts all entities to before state')
  test('redo reapplies all changes')
  test('stores complete before/after state for all entities')
  test('handles partial execution failure')
})
```

### Integration Tests

**Bulk Edit Integration:**
```
describe('Bulk Edit Integration', () => {
  test('selecting multiple entities displays bulk properties panel')
  test('common values display actual value')
  test('mixed values display placeholder')
  test('editing common value updates all entities')
  test('checking update on mixed value enables editing')
  test('apply button applies changes to all selected')
  test('validation runs for all entities before commit')
  test('single undo reverts all bulk changes')
})
```

**Bulk Validation Integration:**
```
describe('Bulk Validation Integration', () => {
  test('validation errors shown for all failed entities')
  test('partial update applies to valid entities only')
  test('fix button navigates to problematic entity')
  test('bulk validation groups similar errors')
  test('validation summary shows count of valid/invalid')
})
```

### End-to-End Tests

**Complete Bulk Edit Workflow:**
```
test('E2E: Bulk edit multiple entities', async () => {
  // 1. Navigate to project with multiple entities
  await page.goto('http://localhost:3000/canvas/test-project')

  // 2. Select first entity
  await page.click('[data-entity-id="ahu-1"]')

  // 3. Ctrl+Click to add more entities to selection
  await page.keyboard.down('Control')
  await page.click('[data-entity-id="ahu-2"]')
  await page.click('[data-entity-id="ahu-3"]')
  await page.click('[data-entity-id="ahu-4"]')
  await page.keyboard.up('Control')

  // 4. Verify selection count in status bar
  await expect(page.locator('[data-testid="status-selection"]')).toHaveText('4 entities selected')

  // 5. Verify bulk properties panel appears
  await expect(page.locator('[data-testid="bulk-properties-panel"]')).toBeVisible()
  await expect(page.locator('[data-testid="panel-title"]')).toContainText('Multiple Items (4)')

  // 6. Identify mixed value field
  const airflowField = page.locator('[data-testid="field-airflow"]')
  await expect(airflowField).toHaveValue('(Mixed values)')

  // 7. Check "Update this field"
  await page.check('[data-testid="update-airflow-checkbox"]')

  // 8. Enter new value
  await page.fill('[data-testid="field-airflow"]', '6000')

  // 9. Edit common value field
  await page.selectOption('[data-testid="field-voltage"]', '208V')

  // 10. Click Apply to All
  await page.click('[data-testid="apply-to-all-btn"]')

  // 11. Confirm bulk update
  await page.click('[data-testid="confirm-bulk-update-btn"]')

  // 12. Verify success toast
  await expect(page.locator('[data-testid="toast"]')).toHaveText(/4 entities updated/)

  // 13. Verify properties updated for all entities
  for (const id of ['ahu-1', 'ahu-2', 'ahu-3', 'ahu-4']) {
    await page.click(`[data-entity-id="${id}"]`)
    await expect(page.locator('[data-testid="field-airflow"]')).toHaveValue('6000')
    await expect(page.locator('[data-testid="field-voltage"]')).toHaveValue('208V')
  }

  // 14. Test undo
  await page.keyboard.press('Control+z')

  // 15. Verify all entities reverted
  await page.click('[data-entity-id="ahu-1"]')
  await expect(page.locator('[data-testid="toast"]')).toHaveText(/Undone: Bulk edit/)
})
```

## 11. Common Pitfalls and Solutions

### Pitfall 1: Not Indicating Which Properties Will Change

**Problem:**
User edits field without realizing it will update ALL selected entities.

**Solution:**
- Prominent warning banner at top of panel
- "Changes will apply to all X selected items"
- Before/After preview in confirmation dialog
- Dirty indicators on changed fields
- Confirmation checkbox option for cautious users

### Pitfall 2: Confusing Mixed Value Behavior

**Problem:**
User doesn't understand that editing mixed value field requires checking "Update this field" checkbox.

**Solution:**
- Clear visual distinction (grayed out placeholder)
- Informative tooltip explaining mixed values
- Checkbox label: "Update this field" (explicit)
- Info message when hovering mixed field
- Tutorial or first-time help callout

### Pitfall 3: Accidental Bulk Edits

**Problem:**
User accidentally has multiple entities selected and doesn't realize edits will affect all.

**Solution:**
- Clear visual indication of selection count
- Status bar always shows: "X entities selected"
- Panel title emphasizes: "Multiple Items (X)"
- Optional confirmation before applying bulk changes
- Setting: "Always confirm bulk edits over X entities"

### Pitfall 4: Poor Performance with Large Selections

**Problem:**
Bulk editing 500+ entities causes UI freeze or crash.

**Solution:**
- Warn when selection exceeds 100 entities
- Process in chunks with progress indicator
- Disable real-time property comparison for large selections
- Limit selection to reasonable size (500 max)
- Suggest using filters for very large bulk operations

### Pitfall 5: Partial Validation Failures Not Clear

**Problem:**
Bulk update partially fails but user doesn't notice some entities weren't updated.

**Solution:**
- Prominent notification: "2 of 10 entities skipped"
- List of failed entities with errors
- Visual indicator on canvas for failed entities
- Option to review and fix skipped entities
- Summary report of bulk operation results

## 12. Performance Tips

### Tip 1: Lazy Property Comparison

Only compare properties when bulk panel opened, not on every selection change.

**Impact:** Selection performance improved by 60%

### Tip 2: Chunk Large Bulk Updates

Process bulk updates in chunks of 100 entities to avoid blocking UI thread.

**Impact:** UI remains responsive during large bulk operations

### Tip 3: Debounce Property Analysis

Debounce property comparison by 300ms when selection rapidly changing.

**Impact:** Prevents excessive computation during rapid clicking

### Tip 4: Virtual Scrolling for Validation Results

Use virtual scrolling when displaying validation results for 50+ entities.

**Impact:** Validation results dialog renders instantly regardless of count

### Tip 5: Batch DOM Updates

Batch all entity re-renders into single requestAnimationFrame after bulk update.

**Impact:** Bulk update visual feedback: 2s → 300ms for 50 entities

## 13. Future Enhancements

1. **Bulk Edit Templates**: Save common bulk edit patterns as templates for reuse

2. **Smart Bulk Suggestions**: AI suggests which entities to bulk edit based on similarities

3. **Bulk Edit Preview Mode**: See visual preview of all changes before applying

4. **Conditional Bulk Rules**: Apply different values based on entity conditions (if-then logic)

5. **Bulk Edit History**: View history of all bulk operations with ability to replay

6. **Cross-Project Bulk Edit**: Bulk edit similar entities across multiple projects

7. **Bulk Edit Macros**: Record and replay complex bulk editing sequences

8. **Collaborative Bulk Editing**: Real-time bulk editing with team conflict resolution

9. **Bulk Edit from Spreadsheet**: Import bulk property changes from Excel/CSV

10. **Visual Bulk Selection Tools**: Advanced selection tools (by property value, proximity, etc.)
