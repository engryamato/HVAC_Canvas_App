# UJ-BP-004: Edit BOM Line Items

## Overview

This user journey describes how users manually edit BOM line items to override automatically calculated values, adjust costs, modify quantities, and add notes. Manual editing capabilities allow users to account for special pricing, bulk discounts, substitutions, and project-specific adjustments that automated calculations cannot capture.

## PRD References

- **FR-BOM-010**: Manual editing of BOM line item properties
- **FR-BOM-011**: Cost override functionality with audit trail
- **FR-BOM-012**: Quantity adjustment for non-standard scenarios
- **US-BOM-004**: As a user, I want to manually edit BOM line items so that I can adjust costs, quantities, and specifications for special circumstances
- **AC-BOM-004-01**: Double-click line item to enter edit mode
- **AC-BOM-004-02**: Editable fields: description, specifications, quantity, unit cost, notes
- **AC-BOM-004-03**: Cost overrides marked with indicator icon (manual entry badge)
- **AC-BOM-004-04**: Edit history tracked with timestamp and user
- **AC-BOM-004-05**: Revert to calculated value option available
- **AC-BOM-004-06**: Changes trigger BOM recalculation and undo command

## Prerequisites

- User has BOM panel open with line items displayed
- Project contains equipment/fitting entities (non-empty BOM)
- User has edit permissions for BOM data
- Understanding of BOM structure and calculations

## User Journey Steps

### Step 1: Initiate Line Item Edit

**User Actions**:
1. User identifies line item needing adjustment (e.g., negotiated lower cost from supplier)
2. User double-clicks on line item row to enter edit mode
3. Alternatively, user right-clicks row and selects "Edit Line Item" from context menu
4. Edit mode activates for selected row

**System Response**:
- Detect double-click or context menu selection
- Line item row enters edit mode (background color changes to light yellow)
- Editable fields become text inputs or selects:
  - Description: Text input
  - Specifications: Text input
  - Quantity: Number input
  - Unit Cost: Currency input
  - Notes: Text area (expandable)
- Non-editable fields remain read-only:
  - Item # (sequential numbering)
  - Unit (derived from entity type)
  - Total Cost (calculated from qty × unit cost)
- "Save" and "Cancel" buttons appear at end of row
- Focus set to first editable field (Description)

**Validation**:
- Edit mode active only for one row at a time
- Other rows remain in view mode
- Save button disabled until valid changes made
- Cancel button always enabled

**Data**:

```
Line Item Before Edit:
{
  id: "bom-item-003",
  itemNumber: 3,
  description: "VAV - Trane TZHS",
  specifications: "400-1200 CFM",
  quantity: 5,
  unit: "ea",
  unitCost: 875.00,
  totalCost: 4375.00,
  category: "VAV Boxes",
  isManuallyEdited: false,
  editHistory: []
}

Edit Mode State:
{
  editingItemId: "bom-item-003",
  editMode: true,
  originalValues: {
    description: "VAV - Trane TZHS",
    specifications: "400-1200 CFM",
    quantity: 5,
    unitCost: 875.00
  },
  currentValues: { ... }, // Initially same as original
  hasChanges: false,
  validationErrors: []
}

UI Rendering:
┌────┬─────────────────────┬──────────────────┬─────────────┬──────┬───────────┬────────────┬─────────┐
│ #  │ Description         │ Specifications   │ Quantity    │ Unit │ Unit Cost │ Total Cost │ Actions │
├────┼─────────────────────┼──────────────────┼─────────────┼──────┼───────────┼────────────┼─────────┤
│ 3  │[VAV - Trane TZHS ]  │[400-1200 CFM  ]  │[5        ]▲▼│  ea  │[$875.00 ] │  $4,375.00 │[✓][✗]  │
│    │                     │                  │             │      │           │ (calc)     │Save Cncl│
└────┴─────────────────────┴──────────────────┴─────────────┴──────┴───────────┴────────────┴─────────┘
     └─ Text input         └─ Text input      └─ Number    └─RO  └─ Currency  └─ Read-only
        (editable)            (editable)          spinner         (editable)      (auto-calc)

Background: Light yellow (#FFFACD) indicating edit mode
Border: 2px solid blue around editable row
```

**Substeps**:
1. User double-clicks line item row
2. RowEdit event handler captures event
3. BOMStore.setEditMode(itemId) called
4. Store captures original values for cancel/revert
5. Row component re-renders in edit mode
6. Replace static text with input components
7. Apply edit mode styling (background, border)
8. Render Save/Cancel buttons
9. Set focus to first editable field
10. Initialize validation state

### Step 2: Modify Unit Cost (Override)

**User Actions**:
1. User clicks into Unit Cost field
2. User clears current value ($875.00)
3. User types new negotiated cost: $750.00
4. Field shows manual entry indicator (asterisk or badge)
5. Total Cost updates automatically: 5 × $750 = $3,750

**System Response**:
- Track cursor focus in Unit Cost field
- On value change:
  - Parse input as currency (remove $, commas)
  - Validate numeric value (positive, max 2 decimals)
  - Mark field as manually edited (isManuallyEdited flag)
  - Display manual entry indicator (yellow badge with "M" or asterisk)
  - Recalculate total cost: quantity × new unit cost
  - Update total cost display (read-only, auto-calculated)
  - Enable Save button (changes detected)
- Provide tooltip on indicator: "Manually edited. Original: $875.00"

**Validation**:
- Unit cost must be numeric and positive
- Maximum value: $1,000,000 (sanity check)
- Minimum value: $0.01 (prevent zero cost unless intentional)
- Format: 2 decimal places for currency

**Data**:

```
Unit Cost Field Edit:

Initial State:
  value: 875.00
  formatted: "$875.00"
  isManual: false

User Types "750":
  rawInput: "750"
  parsedValue: 750.00
  formatted: "$750.00"
  isManual: true

Validation:
  isNumeric: ✓ (750.00)
  isPositive: ✓ (> 0)
  inRange: ✓ (0.01 to 1,000,000)
  validFormat: ✓ (2 decimals)

Total Cost Recalculation:
  quantity: 5
  unitCost: 750.00
  totalCost: 5 × 750.00 = 3,750.00
  formatted: "$3,750.00"
  delta: -$625.00 (savings from original $4,375)

Edit Indicator Display:
┌──────────────────┐
│ [$750.00] [M]    │  ← Manual edit badge (yellow)
└──────────────────┘
      ↑        ↑
   Value   Indicator

Tooltip on Hover:
"Manually edited from $875.00
 User: John Smith
 Date: 2025-12-29 19:15:23"

Updated Row State:
{
  currentValues: {
    unitCost: 750.00,
    totalCost: 3750.00
  },
  hasChanges: true,
  changedFields: ["unitCost"],
  isManuallyEdited: true,
  validationErrors: []
}
```

**Substeps**:
1. User focuses Unit Cost field
2. Input component activates
3. User types new value
4. On each keystroke:
   - Parse input to numeric value
   - Validate value
   - Update current value state
5. On blur or change complete:
   - Format as currency ($750.00)
   - Mark field as manually edited
   - Add manual indicator badge
   - Recalculate total cost
   - Update totals downstream
   - Enable Save button
6. Store edit metadata (user, timestamp)

### Step 3: Adjust Quantity

**User Actions**:
1. User clicks into Quantity field
2. User changes value from 5 to 6 (one additional unit needed)
3. Uses spinner controls (up/down arrows) or types directly
4. Total Cost updates: 6 × $750 = $4,500

**System Response**:
- Quantity field becomes number input with spinner controls
- On value change:
  - Parse as integer (quantities are whole numbers)
  - Validate: positive integer, reasonable range (1-10,000)
  - Recalculate total cost with new quantity
  - Update total cost display
  - Enable Save button
- Spinner controls increment/decrement by 1
- Direct typing allows any valid integer

**Validation**:
- Quantity must be positive integer (≥ 1)
- Maximum: 10,000 (configurable, sanity check)
- No decimals allowed (quantities are whole units)

**Data**:

```
Quantity Field Edit:

Initial Value: 5

User Increments to 6:
  rawInput: "6"
  parsedValue: 6
  isInteger: ✓
  isPositive: ✓ (> 0)
  inRange: ✓ (1 to 10,000)

Total Cost Recalculation:
  quantity: 6 (was 5)
  unitCost: 750.00 (manual override)
  totalCost: 6 × 750.00 = 4,500.00
  delta: +$750.00 (increase from 5 units)

Updated Row State:
{
  currentValues: {
    quantity: 6,
    unitCost: 750.00,
    totalCost: 4500.00
  },
  hasChanges: true,
  changedFields: ["unitCost", "quantity"],
  validationErrors: []
}

Quantity Input UI:
┌──────────────┐
│ [6      ] ▲  │  ← Spinner up button
│           ▼  │  ← Spinner down button
└──────────────┘

Note: Quantity change may indicate actual entity mismatch
System can offer to sync: "Add 1 more VAV entity to canvas?"
(Optional feature for entity-BOM synchronization)
```

**Substeps**:
1. User focuses Quantity field
2. Number input with spinner activates
3. User clicks spinner up arrow OR types "6"
4. On value change:
   - Parse input to integer
   - Validate value (positive, in range)
   - Update quantity in state
5. Recalculate total cost
6. Update Total Cost display
7. Enable Save button
8. Optionally prompt entity sync if divergence

### Step 4: Add Notes to Line Item

**User Actions**:
1. User scrolls to Notes column (may be hidden, needs to be shown)
2. User clicks into Notes field (text area)
3. User types: "Negotiated discount. Supplier: ACME HVAC. PO#: 12345"
4. Notes saved with line item for reference

**System Response**:
- Notes field expands to accommodate text (multi-line text area)
- Character count displayed: "75 / 500 characters"
- Real-time character counter updates as user types
- No validation errors (notes are optional free text)
- Enable Save button if not already enabled

**Validation**:
- Optional field (can be empty)
- Maximum length: 500 characters (configurable)
- Accept any text including line breaks
- Sanitize for XSS (strip HTML tags)

**Data**:

```
Notes Field:

Initial Value: "" (empty)

User Types Note:
  rawInput: "Negotiated discount. Supplier: ACME HVAC. PO#: 12345"
  length: 55 characters
  maxLength: 500
  withinLimit: ✓

Sanitization:
  Input: "Negotiated <script>alert('xss')</script> discount"
  Sanitized: "Negotiated discount"
  (HTML tags stripped for security)

Updated Row State:
{
  currentValues: {
    quantity: 6,
    unitCost: 750.00,
    totalCost: 4500.00,
    notes: "Negotiated discount. Supplier: ACME HVAC. PO#: 12345"
  },
  hasChanges: true,
  changedFields: ["unitCost", "quantity", "notes"],
  validationErrors: []
}

Notes Field UI:
┌─────────────────────────────────────────┐
│ Negotiated discount. Supplier: ACME    │
│ HVAC. PO#: 12345                        │
│                                         │
│                         55 / 500 chars  │  ← Character counter
└─────────────────────────────────────────┘

Auto-expanding text area grows with content
```

**Substeps**:
1. User clicks Notes field
2. Text area activates and expands
3. User types note content
4. On each keystroke:
   - Update character count
   - Validate length (≤ 500)
   - Sanitize input (strip HTML)
5. Store notes value in state
6. Enable Save button

### Step 5: Save Changes and Update BOM

**User Actions**:
1. User reviews all changes made:
   - Unit Cost: $875 → $750
   - Quantity: 5 → 6
   - Notes: Added
   - Total Cost: $4,375 → $4,500 (calculated)
2. User clicks "Save" button (checkmark icon)
3. Changes committed to BOM

**System Response**:
- Validate all fields one final time
- If validation passes:
  - Update BOMStore line item with new values
  - Mark line item as manually edited (isManuallyEdited = true)
  - Create edit history entry:
    - Timestamp: 2025-12-29T19:15:45.123Z
    - User: John Smith
    - Changes: { unitCost: 875→750, quantity: 5→6, notes: added }
  - Recalculate category subtotal (VAV Boxes)
  - Recalculate grand total
  - Create BOMEditCommand for undo stack
  - Exit edit mode (return to view mode)
  - Show success notification: "Line item updated"
  - Highlight row briefly (green flash, 2s fade)
- If validation fails:
  - Show error messages inline
  - Keep edit mode active
  - Highlight invalid fields in red

**Validation**:
- All edited fields pass individual validation
- Unit cost positive and in valid range
- Quantity positive integer
- Notes within character limit
- Total cost calculated correctly

**Data**:

```
Final Validation:
  unitCost: 750.00 ✓
  quantity: 6 ✓
  notes: "Negotiated discount..." ✓ (55 chars)
  totalCost: 4500.00 ✓ (calculated)

Edit History Entry:
{
  timestamp: "2025-12-29T19:15:45.123Z",
  user: "John Smith",
  userId: "user-123",
  changes: [
    { field: "unitCost", oldValue: 875.00, newValue: 750.00 },
    { field: "quantity", oldValue: 5, newValue: 6 },
    { field: "notes", oldValue: "", newValue: "Negotiated discount..." }
  ],
  reason: "Manual override"
}

Updated Line Item:
{
  id: "bom-item-003",
  itemNumber: 3,
  description: "VAV - Trane TZHS",
  specifications: "400-1200 CFM",
  quantity: 6,  // Changed
  unit: "ea",
  unitCost: 750.00,  // Changed
  totalCost: 4500.00,  // Recalculated
  notes: "Negotiated discount. Supplier: ACME HVAC. PO#: 12345",  // Added
  category: "VAV Boxes",
  isManuallyEdited: true,  // Flag set
  editHistory: [
    { timestamp: "2025-12-29T19:15:45.123Z", user: "John Smith", changes: [...] }
  ]
}

BOM Recalculation:
  VAV Boxes Subtotal (before): $6,615.00
  VAV Boxes Subtotal (after): $6,740.00
    (Item #3: $4,500 + Item #4: $2,240)
  Delta: +$125.00

  Grand Total (before): $19,560.00
  Grand Total (after): $19,685.00
  Delta: +$125.00

Undo Command:
{
  type: "BOMEditCommand",
  itemId: "bom-item-003",
  previousValues: {
    quantity: 5,
    unitCost: 875.00,
    totalCost: 4375.00,
    notes: ""
  },
  newValues: {
    quantity: 6,
    unitCost: 750.00,
    totalCost: 4500.00,
    notes: "Negotiated discount..."
  }
}

Success Notification:
  message: "Line item #3 updated successfully"
  duration: 3000ms
  type: "success"

Row Visual Feedback:
  Background flash: white → light green (#E8F5E9)
  Fade duration: 2000ms
  Final state: white (normal)
  Manual edit badge: visible (yellow "M")
```

**Substeps**:
1. User clicks Save button
2. Trigger final validation on all fields
3. If validation fails:
   - Display error messages
   - Focus first invalid field
   - Return (stay in edit mode)
4. If validation passes:
   - Collect all changed values
   - Create edit history entry
   - Update line item in BOMStore
   - Set isManuallyEdited flag
   - Recalculate affected totals
   - Create undo command
   - Push to HistoryStore
5. Exit edit mode
6. Re-render row in view mode
7. Apply success flash animation
8. Show success notification
9. Update panel totals display

## Edge Cases

### Edge Case 1: Cancel Edit (Discard Changes)

**Scenario**: User makes changes but decides not to save, clicks Cancel button.

**Expected Behavior**:
- All changes discarded
- Line item reverts to original values
- Edit mode exits, return to view mode
- No undo command created
- No BOM recalculation
- No notification shown (silent cancel)

**Handling**:
- Cancel button triggers revert action
- Restore originalValues from edit state
- Clear hasChanges flag
- Exit edit mode
- Re-render row with original data

### Edge Case 2: Edit While Filters Active

**Scenario**: User has BOM filtered (showing 3 of 12 items), edits visible line item.

**Expected Behavior**:
- Edit proceeds normally for visible item
- Changes saved to line item
- BOM totals recalculate (affects grand total, not filtered total)
- After save, item remains visible (filter still applied)
- Full BOM affected by edit (not just filtered view)
- If edit changes category, item may disappear from filtered view

**Handling**:
- Edit operates on underlying lineItem, not filtered view
- Recalculation affects full BOM
- Filtered view updates based on new values
- Item may move/disappear if filter no longer matches

### Edge Case 3: Edit Conflicts with Entity Changes

**Scenario**: User edits BOM line item quantity to 6, but only 5 VAV entities exist on canvas.

**Expected Behavior**:
- Edit allowed (BOM can diverge from canvas entities)
- Warning indicator shown: "Quantity mismatch with canvas (5 entities)"
- Tooltip suggests: "Add 1 VAV entity to canvas to sync"
- User can choose to sync or leave mismatched
- BOM reflects manual quantity override

**Handling**:
- Allow BOM manual overrides independent of entities
- Display sync warning for user awareness
- Provide "Sync to Canvas" button (optional action)
- If synced, add/remove entities to match BOM quantity

### Edge Case 4: Multiple Users Edit Same Item (Collaborative)

**Scenario**: In collaborative session, two users edit same line item simultaneously.

**Expected Behavior**:
- Last edit wins (optimistic locking)
- User B sees warning: "This item was updated by User A"
- User B can choose: "Overwrite" or "Cancel and Reload"
- Edit history shows both user's changes
- Conflict resolution UI provided

**Handling**:
- Detect version conflict on save (compare timestamps)
- Show conflict dialog with both versions
- User chooses resolution strategy
- Edit history records conflict and resolution

### Edge Case 5: Edit Invalid/Corrupted Line Item

**Scenario**: Line item has corrupted data (NaN cost, invalid category).

**Expected Behavior**:
- Edit mode detects corruption on entry
- Show warning banner: "Line item has invalid data"
- Allow edit to fix corruption
- Validation prevents saving invalid states
- After save, corruption resolved

**Handling**:
- Validation on edit mode entry
- Highlight corrupted fields in red
- Provide default valid values if needed
- Prevent save until all fields valid

## Error Scenarios

### Error 1: Invalid Unit Cost (Non-Numeric)

**Scenario**: User types "abc" in Unit Cost field.

**Error Message**: "Unit cost must be a valid number."

**Recovery**:
1. Parse input fails (NaN result)
2. Display inline error below field
3. Highlight field border in red
4. Disable Save button
5. Focus remains in field for correction
6. On valid input, error clears automatically

### Error 2: Quantity Exceeds Maximum

**Scenario**: User enters quantity 50,000 (exceeds max of 10,000).

**Error Message**: "Quantity cannot exceed 10,000 units."

**Recovery**:
1. Validation detects value > max
2. Show inline error message
3. Highlight field in red
4. Disable Save button
5. Suggest valid range: "Enter a value between 1 and 10,000"
6. User corrects to valid value

### Error 3: Save Fails (Database Error)

**Scenario**: Network error or database issue prevents save.

**Error Message**: "Failed to save changes. Please try again."

**Recovery**:
1. Catch save exception
2. Display error notification (red toast)
3. Keep edit mode active (changes not lost)
4. "Retry" button in notification
5. Log error for debugging
6. User can retry or cancel

## Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Enter` | Save Changes | Edit mode, all fields valid |
| `Esc` | Cancel Edit (discard changes) | Edit mode active |
| `Tab` | Navigate to next editable field | Edit mode |
| `Shift+Tab` | Navigate to previous editable field | Edit mode |
| `Ctrl+Z` | Undo last BOM edit | After save, BOM panel focused |
| `F2` | Enter edit mode for selected row | Row selected, view mode |

## Related Elements

### Components
- **BOMRowEdit.tsx**: Editable row component for line items
- **EditableCell.tsx**: Reusable editable cell with validation
- **CurrencyInput.tsx**: Specialized input for currency values
- **NumberSpinner.tsx**: Number input with increment/decrement controls
- **NotesTextArea.tsx**: Expandable text area for notes
- **ManualEditBadge.tsx**: Indicator for manually edited fields
- **EditControls.tsx**: Save/Cancel buttons for edit mode

### Stores
- **BOMStore**: Extended with edit functionality
  - `editingItemId`: Currently editing line item ID or null
  - `editMode`: Boolean flag for edit state
  - `originalValues`: Backup for cancel operation
  - `enterEditMode(itemId)`: Activate edit mode
  - `saveEdit(itemId, changes)`: Commit changes
  - `cancelEdit()`: Discard changes and exit edit mode
  - `updateLineItem(itemId, updates)`: Apply changes to line item
- **HistoryStore**: Undo/redo for BOM edits
  - Stores BOMEditCommand instances

### Hooks
- **useLineItemEdit**: Manages line item edit state
  - Returns edit handlers, validation state
  - Provides save/cancel functions
- **useEditValidation**: Field-level validation
  - Validates unit cost, quantity, notes
  - Returns validation errors and status
- **useEditHistory**: Tracks edit history
  - Logs changes with timestamp and user
  - Provides edit history retrieval

### Commands
- **BOMEditCommand**: Undo/redo command for line item edits
  - `execute()`: Apply edit changes
  - `undo()`: Revert to previous values
  - `previousValues`: State before edit
  - `newValues`: State after edit

### Services
- **BOMValidator.ts**: Validation logic for edits
  - `validateUnitCost(value)`: Currency validation
  - `validateQuantity(value)`: Integer validation
  - `validateNotes(value)`: Text validation
  - `validateLineItem(item)`: Complete item validation

## Visual Diagrams

### Edit Mode Activation

```
View Mode (Before Edit):
┌────┬─────────────────────┬──────────────────┬─────┬──────┬───────────┬────────────┐
│ 3  │ VAV - Trane TZHS    │ 400-1200 CFM     │  5  │  ea  │   $875.00 │  $4,375.00 │
└────┴─────────────────────┴──────────────────┴─────┴──────┴───────────┴────────────┘
                                                                  ↓
                                                        User double-clicks
                                                                  ↓
Edit Mode (Active):
┌────┬─────────────────────┬──────────────────┬─────────────┬──────┬─────────────┬────────────┬─────────┐
│ 3  │[VAV - Trane TZHS ]  │[400-1200 CFM  ]  │[5        ]▲▼│  ea  │[$875.00] [M]│  $4,375.00 │[✓][✗]  │
│    │                     │                  │             │      │             │ (calc)     │Sav Cncl │
└────┴─────────────────────┴──────────────────┴─────────────┴──────┴─────────────┴────────────┴─────────┘
      └─ Text input         └─ Text input      └─ Number    └─RO   └─ Currency   └─ Auto-calc └─ Actions
         (editable)            (editable)          spinner           (editable)

Background: Light yellow (#FFFACD)
Border: 2px solid blue
Focus: Description field (first editable)
```

### Cost Override Flow

```
Original Unit Cost: $875.00

User Edits to $750.00:
┌──────────────────────────┐
│ Unit Cost:               │
│ [$750.00] [M]            │  ← Manual edit badge appears
│           ↑              │
│      Yellow badge        │
└──────────────────────────┘

Hover Tooltip:
┌────────────────────────────────┐
│ Manually edited from $875.00   │
│ User: John Smith               │
│ Date: 2025-12-29 19:15:23      │
│                                │
│ [Revert to Original]           │  ← Click to restore $875
└────────────────────────────────┘

Total Cost Auto-Recalculation:
Quantity: 5 units (unchanged)
Unit Cost: $875.00 → $750.00
Total Cost: $4,375.00 → $3,750.00

Delta: -$625.00 (savings)

Visual Indicator:
┌────────────────────────────────┐
│ Total Cost: $3,750.00 ↓        │  ← Down arrow indicates decrease
│             (-$625)            │     Negative delta in green
└────────────────────────────────┘
```

### Edit History Timeline

```
Line Item Edit History:

┌─────────────────────────────────────────────────────────┐
│ Edit History for: VAV - Trane TZHS (Item #3)           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ⦿ 2025-12-29 19:15:45 - John Smith                     │  ← Most recent
│   ├─ Unit Cost: $875.00 → $750.00                      │
│   ├─ Quantity: 5 → 6                                   │
│   └─ Notes: Added "Negotiated discount..."            │
│                                                         │
│ ⦿ 2025-12-28 14:30:12 - Jane Doe                       │
│   └─ Unit Cost: $900.00 → $875.00                      │
│                                                         │
│ ⦿ 2025-12-27 10:15:00 - System (Auto-generated)        │  ← Initial
│   └─ Line item created from entities                   │
│                                                         │
└─────────────────────────────────────────────────────────┘

Access: Right-click line item → "View Edit History"
```

### Validation States

```
Valid State (All Fields OK):
┌────────────────────────────────────────────┐
│ Unit Cost: [$750.00] ✓                     │  ← Green checkmark
│ Quantity:  [6      ] ✓                     │
│ Notes:     [Negotiated...] ✓ (55/500)     │
│                                            │
│                  [Cancel]    [Save ✓]      │  ← Save enabled
└────────────────────────────────────────────┘

Invalid State (Validation Errors):
┌────────────────────────────────────────────┐
│ Unit Cost: [abc    ] ✗                     │  ← Red X mark
│            ↓                               │
│  ⚠ Unit cost must be a valid number       │  ← Error message (red)
│                                            │
│ Quantity:  [-5     ] ✗                     │
│            ↓                               │
│  ⚠ Quantity must be positive              │
│                                            │
│ Notes:     [Valid note] ✓                  │
│                                            │
│                  [Cancel]    [Save ✗]      │  ← Save disabled
└────────────────────────────────────────────┘

Fields with errors:
- Red border (2px solid #D32F2F)
- Error icon (✗) in red
- Inline error message below field
```

### Quantity Adjustment with Entity Sync

```
BOM Line Item (Edit Mode):
┌──────────────────────────────────────┐
│ Quantity: [6      ]▲▼                │
│                                      │
│ ⚠ Mismatch with canvas (5 entities) │  ← Warning
│   [Sync to Canvas]                   │  ← Optional action
└──────────────────────────────────────┘

User Clicks "Sync to Canvas":

Option 1: Add Missing Entity
┌──────────────────────────────────────┐
│ Add 1 VAV - Trane TZHS to canvas?   │
│                                      │
│ Current: 5 entities                  │
│ Required: 6 entities                 │
│                                      │
│         [Cancel]  [Add Entity]       │
└──────────────────────────────────────┘

Option 2: Remove Extra from BOM
┌──────────────────────────────────────┐
│ Adjust BOM to match canvas?          │
│                                      │
│ Canvas: 5 entities                   │
│ BOM: 6 units (edited)                │
│                                      │
│ Change BOM quantity to 5?            │
│                                      │
│         [Cancel]  [Update BOM]       │
└──────────────────────────────────────┘

After Sync:
BOM Quantity: 6
Canvas Entities: 6 (new entity added)
Warning cleared: ✓ Synced
```

### Save Confirmation with Recap

```
Save Changes Confirmation (Large Edits):

┌───────────────────────────────────────────┐
│ Confirm Changes                           │
├───────────────────────────────────────────┤
│                                           │
│ You are about to save the following      │
│ changes to Item #3:                       │
│                                           │
│ • Unit Cost: $875.00 → $750.00            │
│   (Savings: $625.00)                      │
│                                           │
│ • Quantity: 5 → 6 units                   │
│   (Cost increase: $750.00)                │
│                                           │
│ • Notes: Added                            │
│                                           │
│ ─────────────────────────────────────────│
│ Net Change: +$125.00                      │
│ New Line Total: $4,500.00                 │
│ New Grand Total: $19,685.00               │
│                                           │
│         [Cancel]    [Confirm Save]        │
└───────────────────────────────────────────┘

Optional: Only show for changes > $1000 or > 10% variance
```

## Testing

### Unit Tests

**Test Suite**: BOMValidator

1. **Test: Validate unit cost (valid)**
   - Input: 750.00
   - Action: validateUnitCost(750.00)
   - Assert: Valid, no errors

2. **Test: Validate unit cost (invalid - negative)**
   - Input: -100
   - Action: validateUnitCost(-100)
   - Assert: Invalid, error "Must be positive"

3. **Test: Validate unit cost (invalid - non-numeric)**
   - Input: "abc"
   - Action: validateUnitCost("abc")
   - Assert: Invalid, error "Must be a number"

4. **Test: Validate quantity (valid)**
   - Input: 10
   - Action: validateQuantity(10)
   - Assert: Valid, no errors

5. **Test: Validate quantity (invalid - decimal)**
   - Input: 5.5
   - Action: validateQuantity(5.5)
   - Assert: Invalid, error "Must be whole number"

6. **Test: Validate quantity (invalid - exceeds max)**
   - Input: 50000
   - Action: validateQuantity(50000)
   - Assert: Invalid, error "Cannot exceed 10,000"

7. **Test: Validate notes (valid)**
   - Input: "Negotiated discount" (55 chars)
   - Action: validateNotes(input)
   - Assert: Valid, no errors

8. **Test: Validate notes (invalid - too long)**
   - Input: 600-character string
   - Action: validateNotes(input)
   - Assert: Invalid, error "Max 500 characters"

### Integration Tests

**Test Suite**: Line Item Edit Workflow

1. **Test: Edit unit cost and save**
   - Setup: Line item with cost $875
   - Action: Enter edit mode, change to $750, save
   - Assert: Line item updated with new cost
   - Assert: Total cost recalculated: 5 × $750 = $3,750
   - Assert: Manual edit badge visible
   - Assert: Undo command created

2. **Test: Edit quantity and recalculate totals**
   - Setup: Line item qty 5, cost $750
   - Action: Edit quantity to 6, save
   - Assert: Quantity updated to 6
   - Assert: Total cost: 6 × $750 = $4,500
   - Assert: Category subtotal updated
   - Assert: Grand total updated

3. **Test: Cancel edit discards changes**
   - Setup: Enter edit mode, modify fields
   - Action: Click Cancel button
   - Assert: Original values restored
   - Assert: No changes saved
   - Assert: No undo command created
   - Assert: Edit mode exited

4. **Test: Validation prevents invalid save**
   - Setup: Edit mode active
   - Action: Enter invalid unit cost "abc", click Save
   - Assert: Validation error shown
   - Assert: Save button disabled
   - Assert: Edit mode remains active
   - Assert: No changes committed

5. **Test: Edit history tracks changes**
   - Setup: Line item with existing history
   - Action: Edit unit cost, save
   - Assert: New history entry added
   - Assert: Timestamp and user recorded
   - Assert: Old and new values stored
   - Assert: History accessible via UI

### End-to-End Tests

**Test Suite**: User Edit Workflow

1. **Test: User negotiates lower cost and updates BOM**
   - Setup: BOM with VAV line item at $875
   - Action: User double-clicks line item
   - Assert: Edit mode activates
   - Action: User changes cost to $750
   - Assert: Manual badge appears
   - Action: User adds note "Negotiated with supplier"
   - Action: User clicks Save
   - Assert: Changes saved
   - Assert: Success notification shown
   - Assert: BOM totals updated
   - Assert: Row exits edit mode

2. **Test: User adjusts quantity for additional units**
   - Setup: Line item with qty 5
   - Action: User enters edit mode
   - Action: User increments quantity to 6 via spinner
   - Assert: Quantity increases to 6
   - Assert: Total cost recalculates
   - Action: User saves
   - Assert: Changes committed
   - Assert: Warning shown about entity mismatch

3. **Test: User cancels edit after making changes**
   - Action: User enters edit mode
   - Action: User modifies cost and quantity
   - Action: User clicks Cancel
   - Assert: Confirmation dialog (if large changes)
   - Action: User confirms cancel
   - Assert: All changes discarded
   - Assert: Original values displayed
   - Assert: No notification shown

4. **Test: User undoes BOM edit**
   - Setup: Line item edited and saved
   - Action: User presses Ctrl+Z
   - Assert: Edit undone
   - Assert: Previous values restored
   - Assert: Manual badge removed if was auto-calculated
   - Assert: Totals recalculated

5. **Test: User views edit history**
   - Setup: Line item with multiple edits
   - Action: User right-clicks line item
   - Action: User selects "View Edit History"
   - Assert: History dialog opens
   - Assert: All edits listed chronologically
   - Assert: User names and timestamps shown
   - Assert: Old/new values displayed

## Common Pitfalls

### Pitfall 1: Not Recalculating Totals After Edit

**Problem**: Unit cost or quantity changed but total cost not updated.

**Symptom**: Line shows qty 6 × $750 but total still shows $4,375 (old value).

**Solution**: Auto-recalculate total cost on any unit cost or quantity change. Use computed property or immediate recalc on field change.

### Pitfall 2: Losing Changes on Cancel by Mistake

**Problem**: User accidentally clicks Cancel, losing significant edits.

**Symptom**: User spent time editing multiple fields, clicks Cancel instead of Save, all changes lost.

**Solution**: Show confirmation dialog before canceling if substantial changes made: "Discard unsaved changes? Unit Cost: $875→$750, Quantity: 5→6"

### Pitfall 3: Edit Mode Persists Across Row Selections

**Problem**: User edits one row, selects different row, edit mode stays on first row.

**Symptom**: Two rows appear in edit mode, unclear which is active.

**Solution**: Auto-save or prompt to save/cancel when user attempts to edit different row. Only one row editable at a time.

### Pitfall 4: Manual Edit Badge Not Cleared on Revert

**Problem**: User edits field, then manually reverts to original value, but badge remains.

**Symptom**: Badge shows "Manually edited" even though value equals original.

**Solution**: Compare current value to original on change. Clear manual flag if values match exactly.

### Pitfall 5: Validation Only on Save (Not Real-Time)

**Problem**: User enters invalid data, doesn't see errors until clicking Save.

**Symptom**: User tries to save, sees multiple validation errors, must fix each field.

**Solution**: Validate fields on blur (field exit). Show errors immediately so user can fix before attempting save.

## Performance Tips

### Tip 1: Debounce Total Cost Recalculation

Recalculating on every keystroke in cost field is excessive:

**Implementation**: Debounce recalculation with 300ms delay. Update display after user stops typing.

**Benefit**: Reduces calculation calls from 10+ to 1 per edit.

### Tip 2: Lazy Load Edit History

Loading full edit history on every row render is wasteful:

**Implementation**: Load edit history only when "View History" clicked. Store in separate collection, fetch on-demand.

**Benefit**: Faster BOM table rendering, reduces initial data load.

### Tip 3: Use Controlled Components for Inputs

Uncontrolled inputs can cause sync issues:

**Implementation**: Use React controlled components (value prop from state). Single source of truth prevents bugs.

**Benefit**: Predictable state management, easier validation and formatting.

### Tip 4: Memoize Validation Functions

Running complex validation on every render is slow:

**Implementation**: Memoize validation results based on field values (useMemo). Recalculate only when values change.

**Benefit**: Faster re-renders during editing, especially for large BOMs.

### Tip 5: Optimize Edit Mode Re-Renders

Full BOM table re-renders on every edit field change:

**Implementation**: Isolate editable row component. Use React.memo to prevent sibling row re-renders. Update only editing row.

**Benefit**: Smooth editing experience even with 100+ line items in BOM.

## Future Enhancements

### Enhancement 1: Bulk Edit Multiple Line Items

**Description**: Select multiple line items and edit common properties simultaneously.

**User Value**: Quickly apply same discount or cost adjustment to multiple items.

**Implementation**:
- Multi-select rows (Ctrl+Click or Shift+Click)
- "Bulk Edit" button appears
- Edit dialog with common fields
- Apply changes to all selected items
- Undo as single operation

### Enhancement 2: Cost Formula Support

**Description**: Enter formulas for unit cost (e.g., "=BaseCost * 0.9" for 10% discount).

**User Value**: Dynamic pricing based on variables, automatic updates.

**Implementation**:
- Formula input mode (starts with =)
- Reference variables (BaseCost, Quantity, etc.)
- Formula evaluates to numeric cost
- Recalculates on variable changes

### Enhancement 3: Approval Workflow for Large Edits

**Description**: Edits exceeding threshold (e.g., >$5000 impact) require manager approval.

**User Value**: Financial controls and accountability for significant cost changes.

**Implementation**:
- Detect edits exceeding threshold
- Submit for approval instead of immediate save
- Approval queue for managers
- Approve/reject with comments
- Edit applies after approval

### Enhancement 4: Inline Cost Justification

**Description**: Require justification/reason for manual cost overrides.

**User Value**: Audit trail and documentation for pricing decisions.

**Implementation**:
- Mandatory "Reason" field for cost changes >10%
- Dropdown with common reasons + "Other" free text
- Reason stored in edit history
- Searchable/filterable by reason

### Enhancement 5: Revert to Calculated Value

**Description**: One-click button to remove manual override and restore auto-calculated value.

**User Value**: Easy way to undo manual edits without full undo.

**Implementation**:
- "Revert" icon next to manual badge
- Click removes override
- Recalculates from current entities
- Asks confirmation if substantial change

### Enhancement 6: Edit Templates

**Description**: Save common edit patterns as templates (e.g., "10% Bulk Discount").

**User Value**: Quickly apply standard adjustments.

**Implementation**:
- Define template: cost adjustment formula, note template
- Apply template to line item(s)
- Library of organization templates
- Custom user templates

### Enhancement 7: Cost Variance Alerts

**Description**: Automatically flag line items with unusual cost variance from typical.

**User Value**: Catch errors, identify outliers requiring explanation.

**Implementation**:
- Calculate typical cost range from historical data
- Alert if manual edit outside ±20% of typical
- "Unusual cost. Verify accuracy" warning
- Require acknowledgment to proceed

### Enhancement 8: Mobile-Optimized Edit Mode

**Description**: Touch-friendly edit interface for tablets and mobile devices.

**User Value**: Edit BOM on job site or during site visits.

**Implementation**:
- Larger touch targets (buttons, inputs)
- Modal edit dialog (full-screen on mobile)
- Number pad for numeric inputs
- Gesture support (swipe to save/cancel)

### Enhancement 9: Edit Impact Preview

**Description**: Show real-time preview of how edit affects project totals before saving.

**User Value**: Understand financial impact before committing changes.

**Implementation**:
- Live preview panel during edit
- Shows: Line total change, category subtotal change, grand total change
- Color-coded: green (savings), red (increase)
- "What-if" analysis before save

### Enhancement 10: Collaborative Edit Comments

**Description**: Add comments/discussion thread on edited line items.

**User Value**: Team communication about pricing decisions and changes.

**Implementation**:
- Comment icon on manually edited items
- Click opens comment thread
- Team members reply and discuss
- Notifications on new comments
- Resolves when consensus reached
