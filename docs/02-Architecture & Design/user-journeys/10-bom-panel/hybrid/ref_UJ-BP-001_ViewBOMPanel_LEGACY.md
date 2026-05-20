# UJ-BP-001: View BOM Panel

## Overview

This user journey describes how users access and view the Bill of Materials (BOM) panel, which provides a comprehensive inventory of all equipment, fittings, and components in the HVAC design project. The BOM panel automatically aggregates quantities, specifications, and costs for accurate material takeoffs and project estimates.

## PRD References

- **FR-BOM-001**: Automatic BOM generation from canvas entities
- **FR-BOM-002**: Real-time BOM updates as entities added/removed/modified
- **FR-BOM-003**: BOM panel display with sortable, filterable table
- **US-BOM-001**: As a user, I want to view a complete bill of materials so that I can understand project requirements and costs
- **AC-BOM-001-01**: BOM panel accessible via sidebar tab or menu command
- **AC-BOM-001-02**: BOM displays all equipment and fittings grouped by category
- **AC-BOM-001-03**: Each BOM line item shows: description, quantity, unit, unit cost, total cost
- **AC-BOM-001-04**: BOM updates in real-time as entities added/removed from canvas
- **AC-BOM-001-05**: Total project cost displayed at bottom of BOM panel
- **AC-BOM-001-06**: BOM panel resizable and collapsible

## Prerequisites

- User has Canvas page open with active project
- Project contains at least one equipment or fitting entity (BOM shows empty state if none)
- BOM calculation service initialized and running
- Understanding of HVAC component types (diffusers, grilles, VAV boxes, etc.)

## User Journey Steps

### Step 1: Open BOM Panel

**User Actions**:
1. User identifies need to review material quantities and costs
2. User opens BOM panel via one of three methods:
   - Click "BOM" tab in right sidebar, OR
   - Select "View > Bill of Materials" from menu bar, OR
   - Press Ctrl+B keyboard shortcut
3. Observe BOM panel sliding into view or expanding
4. Panel displays in right sidebar (default 400px width)

**System Response**:
- BOM panel component mounts or becomes visible
- Panel slides in from right with 200ms animation (if collapsed)
- Panel header displays: "Bill of Materials" with entity count
- Loading indicator shown briefly while BOM calculates (if large project)
- Table populated with line items from current project entities
- Scroll bars appear if content exceeds panel height
- Total cost section displayed at bottom

**Validation**:
- BOM panel visible and properly positioned
- Panel does not obscure critical canvas content
- All entity types included in BOM calculation
- Panel state synchronized with project entities

**Data**:

```
Project State:
- Total entities: 47
- Equipment entities: 8 (RTUs, AHUs, VAV boxes)
- Fitting entities: 15 (diffusers, grilles, dampers)
- Duct entities: 24 (not included in BOM - labor/materials separate)
- Total BOM line items: 12 (grouped by type/model)

BOM Panel Configuration:
- Position: Right sidebar
- Width: 400px (default)
- Height: 100% of viewport (minus header/footer)
- Visible: true
- Collapsed: false

BOM Panel Header:
- Title: "Bill of Materials"
- Subtitle: "12 line items • 23 total units"
- Refresh button: Manual recalculation trigger
- Export button: CSV/Excel export
- Filter button: Show filter controls

Panel State:
- loading: false (calculation complete)
- error: null
- lastUpdated: 2025-12-29T18:30:45.123Z
- autoUpdate: true (real-time updates enabled)
```

**Substeps**:
1. User triggers BOM panel open action
2. UI state updates: bomPanelVisible = true
3. BOMPanel component renders or becomes visible
4. Panel animation starts (slide-in, 200ms)
5. BOMStore.calculateBOM() invoked
6. Iterate all equipment/fitting entities
7. Group entities by type, model, specifications
8. Calculate quantities and costs
9. Generate BOM line items array
10. Render table with line items
11. Calculate and display total cost
12. Animation completes, panel fully visible

### Step 2: Review BOM Table Structure

**User Actions**:
1. User scans BOM table header row for column labels
2. User scrolls through BOM line items
3. User identifies key information: descriptions, quantities, costs
4. User notices grouping by equipment category
5. User locates total cost at bottom of panel

**System Response**:
- Table header displays column labels:
  - Item # (sequential numbering)
  - Description (equipment type and model)
  - Specifications (size, capacity, features)
  - Quantity (count of identical units)
  - Unit (each, pair, set)
  - Unit Cost (price per unit)
  - Total Cost (quantity × unit cost)
- Line items grouped by category:
  - Air Handling Units
  - Rooftop Units
  - VAV Boxes
  - Diffusers
  - Grilles
  - Dampers
  - Accessories
- Category headers styled with bold text and light background
- Alternating row colors for readability (white/light gray)
- Total cost row at bottom with bold styling

**Validation**:
- All columns visible and properly aligned
- Column headers clearly labeled
- Data formatted correctly (currency, numbers, text)
- Scrolling smooth and responsive

**Data**:

```
BOM Table Structure:

Header Row:
┌────┬─────────────────────┬──────────────────┬─────┬──────┬───────────┬────────────┐
│ #  │ Description         │ Specifications   │ Qty │ Unit │ Unit Cost │ Total Cost │
├────┼─────────────────────┼──────────────────┼─────┼──────┼───────────┼────────────┤

Category: Air Handling Units
│ 1  │ AHU - York MCA      │ 5000 CFM, 3-ton  │ 2   │ ea   │ $3,450.00 │  $6,900.00 │
│ 2  │ AHU - Carrier 48TC  │ 7500 CFM, 5-ton  │ 1   │ ea   │ $5,200.00 │  $5,200.00 │
├────┴─────────────────────┴──────────────────┴─────┴──────┴───────────┼────────────┤
│ Subtotal: Air Handling Units                                         │ $12,100.00 │
├────┬─────────────────────┬──────────────────┬─────┬──────┬───────────┼────────────┤

Category: VAV Boxes
│ 3  │ VAV - Trane TZHS    │ 400-1200 CFM     │ 4   │ ea   │   $875.00 │  $3,500.00 │
│ 4  │ VAV - Price SC      │ 600-1800 CFM     │ 2   │ ea   │ $1,120.00 │  $2,240.00 │
├────┴─────────────────────┴──────────────────┴─────┴──────┴───────────┼────────────┤
│ Subtotal: VAV Boxes                                                   │  $5,740.00 │
├────┬─────────────────────┬──────────────────┬─────┬──────┬───────────┼────────────┤

Category: Diffusers
│ 5  │ Diffuser - 4-way    │ 24"x24", 500 CFM │ 8   │ ea   │   $125.00 │  $1,000.00 │
│ 6  │ Diffuser - Linear   │ 48", 300 CFM     │ 4   │ ea   │   $180.00 │    $720.00 │
├────┴─────────────────────┴──────────────────┴─────┴──────┴───────────┼────────────┤
│ Subtotal: Diffusers                                                   │  $1,720.00 │
├────┴─────────────────────┴──────────────────┴─────┴──────┴───────────┼────────────┤

Footer Row (Grand Total):
│ TOTAL PROJECT COST:                                                   │ $19,560.00 │
└───────────────────────────────────────────────────────────────────────┴────────────┘

Formatting:
- Currency: USD with $ symbol, 2 decimal places
- Quantities: Integer, right-aligned
- Descriptions: Left-aligned, truncated with ellipsis if too long
- Category headers: Bold, light blue background (#E3F2FD)
- Alternating rows: White (#FFFFFF) / Light gray (#F5F5F5)
- Total row: Bold, dark blue background (#1976D2), white text
```

**Substeps**:
1. Table component renders header row
2. Iterate BOM line items from BOMStore
3. Group line items by category
4. For each category:
   - Render category header row
   - Render line items in category
   - Calculate and render category subtotal
5. Calculate grand total across all categories
6. Render total row at bottom
7. Apply styling (colors, fonts, alignment)
8. Enable vertical scrolling if needed

### Step 3: Understand BOM Calculations

**User Actions**:
1. User examines individual line item costs
2. User verifies quantity calculations (counts of same equipment type)
3. User checks unit costs against expectations
4. User reviews total cost calculation
5. User compares subtotals across categories

**System Response**:
- Quantity aggregation logic:
  - Entities with identical type, model, and specs grouped together
  - Quantity = count of grouped entities
  - Example: 8 identical 4-way diffusers → Qty: 8
- Unit cost retrieval:
  - Fetched from equipment database by model number
  - Fallback to manual entry if not in database
  - User can override unit costs in entity properties
- Total cost calculation:
  - Line total = Quantity × Unit Cost
  - Category subtotal = Sum of line totals in category
  - Grand total = Sum of all category subtotals
- Precision: All costs rounded to 2 decimal places

**Validation**:
- Quantity counts accurate (manual verification possible)
- Unit costs match equipment database or user overrides
- Math calculations correct (totals sum properly)
- No duplicate counting or missing entities

**Data**:

```
Example Calculation: 4-way Diffusers

Canvas Entities:
- Entity ID: diff-001, Type: Diffuser, Model: 4-way 24x24, Size: 24"x24", CFM: 500
- Entity ID: diff-002, Type: Diffuser, Model: 4-way 24x24, Size: 24"x24", CFM: 500
- Entity ID: diff-003, Type: Diffuser, Model: 4-way 24x24, Size: 24"x24", CFM: 500
- Entity ID: diff-004, Type: Diffuser, Model: 4-way 24x24, Size: 24"x24", CFM: 500
- Entity ID: diff-005, Type: Diffuser, Model: 4-way 24x24, Size: 24"x24", CFM: 500
- Entity ID: diff-006, Type: Diffuser, Model: 4-way 24x24, Size: 24"x24", CFM: 500
- Entity ID: diff-007, Type: Diffuser, Model: 4-way 24x24, Size: 24"x24", CFM: 500
- Entity ID: diff-008, Type: Diffuser, Model: 4-way 24x24, Size: 24"x24", CFM: 500

Grouping Logic:
- Compare all diffuser entities
- Match criteria: Type=Diffuser, Model=4-way 24x24, Size=24"x24", CFM=500
- 8 entities match criteria → Group together

Quantity Calculation:
- Grouped entity count: 8
- BOM Quantity: 8 ea

Unit Cost Retrieval:
- Query equipment database: SELECT unitCost FROM equipment WHERE model='4-way 24x24' AND size='24"x24"'
- Result: $125.00
- Check for user override in entity properties: None
- Final unit cost: $125.00

Total Cost Calculation:
- Line total: 8 × $125.00 = $1,000.00

Category Subtotal (Diffusers):
- 4-way diffusers: $1,000.00
- Linear diffusers: $720.00
- Subtotal: $1,000.00 + $720.00 = $1,720.00

Grand Total:
- AHUs: $12,100.00
- VAV Boxes: $5,740.00
- Diffusers: $1,720.00
- (other categories)
- Grand Total: $19,560.00
```

**Substeps**:
1. BOMStore retrieves all equipment/fitting entities
2. For each entity, extract: type, model, size, CFM, specifications
3. Create grouping key: hash(type, model, size, specs)
4. Group entities by grouping key into buckets
5. For each bucket:
   - Count entities → Quantity
   - Retrieve unit cost from database or entity override
   - Calculate line total: Quantity × Unit Cost
6. Organize line items by category
7. Calculate category subtotals
8. Calculate grand total
9. Store results in BOMStore.lineItems array

### Step 4: Observe Real-Time Updates

**User Actions**:
1. User keeps BOM panel open
2. User adds new equipment entity to canvas (e.g., VAV box)
3. Observes BOM panel updating automatically
4. New line item appears or existing quantity increments
5. Total cost updates to reflect new entity

**System Response**:
- Subscribe to EntityStore change events
- On entity added:
  - Determine if entity type included in BOM (equipment/fitting)
  - If yes, recalculate BOM
  - Check if entity matches existing line item (same specs)
  - If match: Increment quantity, update total
  - If new: Add new line item to category
  - Update category subtotal
  - Update grand total
  - Re-render table (smooth transition, no flicker)
- Highlight changed row briefly (yellow background flash, 1s fade)
- Update panel subtitle with new counts

**Validation**:
- BOM updates within 100ms of entity change
- Correct line item identified for update (match logic)
- Quantities and costs accurate after update
- Visual feedback indicates what changed

**Data**:

```
Initial State:
BOM line item for "VAV - Trane TZHS":
- Quantity: 4 ea
- Unit Cost: $875.00
- Total: $3,500.00
- Grand Total: $19,560.00

User Action: Add VAV box to canvas
- Entity added: vav-009
- Type: VAV Box
- Model: Trane TZHS
- Size: 400-1200 CFM

BOM Update Triggered:
Event: entity-added (vav-009)
- Timestamp: 2025-12-29T18:32:10.456Z
- Check entity type: VAV Box → Include in BOM ✓
- Extract specs: Model=Trane TZHS, Size=400-1200 CFM

Match Existing Line Item:
- Search BOM for matching specs
- Match found: Line item #3 (VAV - Trane TZHS, 400-1200 CFM)
- Action: Increment quantity

Updated Line Item:
- Quantity: 4 → 5 ea
- Unit Cost: $875.00 (unchanged)
- Total: $3,500.00 → $4,375.00 (+$875.00)

Category Subtotal Update:
- VAV Boxes subtotal: $5,740.00 → $6,615.00 (+$875.00)

Grand Total Update:
- Previous: $19,560.00
- New: $20,435.00 (+$875.00)

Visual Feedback:
- Line item #3 background: white → yellow (flash)
- Fade to white over 1000ms
- Quantity cell: "4" → "5" (animated counter)
- Total cell: "$3,500.00" → "$4,375.00" (animated)
- Grand total: "$19,560.00" → "$20,435.00" (animated, bold)

Panel Header Update:
- Subtitle: "12 line items • 23 total units" → "12 line items • 24 total units"
```

**Substeps**:
1. EntityStore emits entity-added event
2. BOMStore event listener receives notification
3. Check if entity type relevant to BOM
4. Extract entity specifications for grouping
5. Search existing line items for match
6. If match found:
   - Increment quantity
   - Recalculate line total
   - Update category subtotal
   - Update grand total
7. If no match:
   - Create new line item
   - Insert into appropriate category
   - Recalculate subtotals and grand total
8. Trigger table re-render with animation
9. Highlight changed row(s) with flash effect
10. Update panel header with new counts

### Step 5: Resize and Collapse Panel

**User Actions**:
1. User finds default panel width too wide/narrow
2. User hovers over left edge of BOM panel
3. Cursor changes to resize indicator (horizontal arrows)
4. User clicks and drags edge to resize panel
5. Panel width adjusts in real-time during drag
6. User releases mouse to finalize width
7. Alternatively, user clicks collapse button (arrow icon in header)
8. Panel collapses to narrow tab showing only "BOM" label

**System Response**:
- Detect hover over panel edge (8px hit zone)
- Change cursor to col-resize
- On mousedown, enter resize mode
- Track mouse position during drag (mousemove events)
- Update panel width each frame (requestAnimationFrame)
- Clamp width to [300px, 800px] range
- Re-flow table content to fit new width
- On mouseup, finalize width and save preference
- Collapse button toggles panel between full width and 40px tab
- Collapsed state shows vertical "BOM" label
- Re-opening restores previous width

**Validation**:
- Resize smooth and responsive (60fps)
- Width constraints enforced (min/max)
- Table content reflows without breaking layout
- Preference persists across sessions
- Collapse/expand animation smooth (200ms)

**Data**:

```
Resize Operation:

Initial State:
- Panel width: 400px (default)
- Min width: 300px
- Max width: 800px

User Drag Sequence:
Mousedown at X: 1520 (canvas width: 1920)
- Panel left edge: 1520
- Start resize mode
- Capture initial width: 400px

Mousemove events:
- Frame 1: X = 1500 → width = 420px (dragged left 20px)
- Frame 2: X = 1480 → width = 440px
- Frame 3: X = 1450 → width = 470px
- ... (continues)
- Frame N: X = 1320 → width = 600px

Mouseup at X: 1320
- Final width: 600px
- End resize mode
- Save preference: bomPanelWidth = 600
- Persist to SettingsStore → localStorage

Width Clamping Example:
- User drags to X = 1100 → calculated width = 820px
- Exceeds max (800px) → clamp to 800px
- Visual: Panel stops growing at 800px, cursor continues

Collapse Operation:

User Clicks Collapse Button:
- Previous state: width = 600px, collapsed = false
- Animation: width 600px → 40px over 200ms (ease-in-out)
- BOM table fades out (opacity 1.0 → 0) during collapse
- Vertical "BOM" label fades in (opacity 0 → 1.0)
- Final state: width = 40px, collapsed = true

User Clicks Expand (Tab Click):
- Previous state: width = 40px, collapsed = true
- Animation: width 40px → 600px over 200ms (ease-in-out)
- Vertical label fades out
- BOM table fades in
- Final state: width = 600px, collapsed = false

Preference Storage:
- bomPanelWidth: 600
- bomPanelCollapsed: false
- bomPanelVisible: true
- Saved to localStorage
- Restored on next session
```

**Substeps**:
1. User hovers over panel edge
2. Hit test determines hover within resize zone
3. Cursor changes to col-resize
4. User presses mouse button
5. Resize mode activated
6. On mousemove:
   - Calculate new width from mouse X position
   - Clamp to [300, 800] range
   - Update panel width style
   - Trigger table reflow
7. User releases mouse
8. Resize mode deactivated
9. Save width preference to SettingsStore
10. Persist to localStorage

For collapse:
1. User clicks collapse button
2. Toggle collapsed state
3. Start width animation (600px → 40px or reverse)
4. Fade table content in/out
5. Show/hide vertical label
6. Complete animation
7. Save collapsed state preference

## Edge Cases

### Edge Case 1: Empty BOM (No Equipment/Fittings)

**Scenario**: User opens BOM panel on new project or project with only ducts/rooms (no countable equipment).

**Expected Behavior**:
- BOM panel displays empty state placeholder
- Shows icon (clipboard or document icon)
- Text: "No equipment or fittings in project"
- Subtitle: "Add equipment to canvas to populate BOM"
- Total cost shows $0.00
- Table structure still visible (headers) but no data rows
- User can still export (empty CSV/Excel)

**Handling**:
- Check BOMStore.lineItems.length === 0
- Render empty state component instead of table rows
- Provide helpful message encouraging entity addition
- Panel remains functional (resize, collapse still work)

### Edge Case 2: Large BOM (Hundreds of Line Items)

**Scenario**: Complex commercial project with 500+ equipment entities resulting in 100+ BOM line items.

**Expected Behavior**:
- BOM calculation may take 1-2 seconds
- Show loading spinner during calculation
- Virtualized scrolling for large tables (render only visible rows)
- Search/filter becomes essential (covered in UJ-BP-003)
- Pagination option (show 50 items per page)
- Performance remains acceptable (no lag)

**Handling**:
- Debounce BOM recalculation (500ms after last entity change)
- Use virtual scrolling library (react-window or similar)
- Render only 20-30 visible rows, swap as user scrolls
- Background calculation in Web Worker for very large BOMs
- Progress indicator: "Calculating BOM... (347/521 items)"

### Edge Case 3: BOM Calculation Error

**Scenario**: Entity has corrupted data (missing model, invalid cost) preventing BOM calculation.

**Expected Behavior**:
- BOM calculation detects error entity
- Skip problematic entity with warning
- Continue processing other entities
- Display warning banner at top of BOM panel
- "BOM calculation warning: 2 entities skipped due to missing data"
- Click warning to see list of skipped entities
- User can fix entities and trigger manual refresh

**Handling**:
- Wrap entity processing in try-catch
- Log errors for debugging
- Track skipped entities in array
- Display warning UI with details
- "Refresh BOM" button to retry after fixes
- BOM shows partial results (all valid entities)

### Edge Case 4: Conflicting Unit Costs

**Scenario**: Same equipment model has different unit costs set on different entity instances.

**Expected Behavior**:
- BOM groups entities by model, but unit costs differ
- Split into separate line items based on unit cost
- OR: Show warning and use average/median/most common cost
- User preference determines behavior
- Warning indicator on line item(s) with cost conflicts
- Tooltip explains conflict: "3 entities @ $125, 2 entities @ $130"

**Handling**:
- Detect cost variance during grouping
- Check setting: "BOM Cost Conflict Resolution"
  - Option 1: Split line items (default)
  - Option 2: Use average cost (show warning)
  - Option 3: Use first entity cost (show warning)
- Display warning icon on affected line items
- Detailed tooltip with cost breakdown

### Edge Case 5: BOM Updates During Export

**Scenario**: User initiates BOM export, but entities change during export generation.

**Expected Behavior**:
- Export captures BOM snapshot at export start
- Changes during export don't affect exported file
- After export completes, show notification if BOM changed
- "BOM updated since export. Export may be outdated."
- User can re-export to get latest data
- Timestamp on export shows generation time

**Handling**:
- Clone BOMStore.lineItems array at export start
- Export from cloned snapshot (immutable)
- Track BOMStore.version at export start
- Compare version at export end
- If version changed, show warning notification
- Include export timestamp in file for reference

## Error Scenarios

### Error 1: Equipment Database Unavailable

**Scenario**: Equipment cost database fails to load or becomes unreachable during BOM calculation.

**Error Message**: "Equipment database unavailable. BOM showing estimated costs."

**Recovery**:
1. Detect database connection failure
2. Fall back to cached cost data (if available)
3. Use entity-level cost overrides (if set)
4. For missing costs, use placeholder: "$0.00" or "N/A"
5. Display error banner at top of BOM panel
6. "Some costs unavailable. Click to retry database connection."
7. User can manually enter costs or retry connection
8. BOM remains functional with available data

### Error 2: BOM Calculation Timeout

**Scenario**: Extremely large project (10,000+ entities) causes BOM calculation to exceed 10-second timeout.

**Error Message**: "BOM calculation timeout. Showing partial results."

**Recovery**:
1. BOM calculation runs with 10s timeout
2. If timeout, terminate calculation
3. Show partial results (entities processed before timeout)
4. Error banner: "Calculation incomplete. Processed 4,523/10,241 entities."
5. Progress bar showing completion percentage
6. Offer "Continue Calculation" button (resume where left off)
7. OR: "Simplify BOM" button (group more aggressively, reduce line items)
8. Background calculation continues if user allows

### Error 3: Invalid Currency Formatting

**Scenario**: Unit cost data contains invalid currency format (non-numeric, wrong delimiter).

**Error Message**: "Invalid cost data detected. Check entity properties."

**Recovery**:
1. Parse unit cost string with currency parser
2. If parse fails (NaN result), mark as invalid
3. Display line item with cost as "Invalid"
4. Highlight row in yellow (warning color)
5. Tooltip: "Entity ID: equip-045 has invalid unit cost: 'abc123'"
6. Exclude line total from grand total
7. Warning banner with count: "3 items have invalid costs"
8. User can click warning to jump to problematic entities

## Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+B` | Toggle BOM Panel Visibility | Canvas page active |
| `Ctrl+Shift+B` | Toggle BOM Panel Collapse | BOM panel visible |
| `Ctrl+E` | Export BOM to CSV | BOM panel focused |
| `Ctrl+F` | Focus BOM Search/Filter | BOM panel visible |
| `Ctrl+R` | Refresh BOM (manual recalculation) | BOM panel visible |
| `↑/↓` | Navigate BOM rows | BOM panel focused |
| `Home/End` | Jump to first/last BOM row | BOM panel focused |
| `Enter` | Select row, highlight entities on canvas | BOM row focused |

## Related Elements

### Components
- **BOMPanel.tsx**: Main BOM panel container
  - Manages panel visibility, size, collapse state
  - Renders header, table, footer
  - Handles resize and collapse interactions
- **BOMTable.tsx**: Table component displaying line items
  - Renders header, rows, category groups, totals
  - Handles sorting, row selection, virtualization
  - Applies styling and formatting
- **BOMRow.tsx**: Individual line item row
  - Displays item number, description, specs, quantity, costs
  - Highlights on hover, shows context menu
  - Handles row click (select entities on canvas)
- **BOMHeader.tsx**: Panel header with title, controls
  - Refresh button, export button, filter button
  - Collapse button, close button
  - Entity count and last updated timestamp
- **BOMFooter.tsx**: Total cost summary
  - Grand total display (bold, highlighted)
  - Subtotal breakdowns by category
  - Cost variance indicators
- **BOMEmptyState.tsx**: Placeholder when no BOM items
  - Icon and helpful message
  - "Add Equipment" button linking to toolbar

### Stores
- **BOMStore**: Central BOM state management
  - `lineItems`: Array of BOM line item objects
  - `categories`: Category groupings and subtotals
  - `grandTotal`: Total project cost
  - `lastUpdated`: Timestamp of last calculation
  - `loading`: Calculation in progress flag
  - `error`: Error message if calculation failed
  - `version`: Increments on each update (for change detection)
  - `calculateBOM()`: Main calculation method
  - `recalculate()`: Manual refresh trigger
  - `exportBOM(format)`: Export to CSV/Excel
- **EntityStore**: Source of equipment and fitting data
  - Emits entity-changed events for BOM updates
  - Provides equipment/fitting entities for BOM calculation
- **SettingsStore**: BOM preferences
  - `bomPanelWidth`: Panel width (300-800px)
  - `bomPanelCollapsed`: Collapse state
  - `bomPanelVisible`: Visibility state
  - `bomAutoUpdate`: Real-time updates enabled
  - `bomCostConflictResolution`: How to handle cost mismatches
  - `bomIncludeZeroCost`: Show items with $0.00 cost

### Hooks
- **useBOMCalculation**: Manages BOM calculation lifecycle
  - Subscribes to entity changes
  - Debounces recalculation (500ms)
  - Returns loading state and results
- **useBOMGrouping**: Groups entities into line items
  - Implements grouping logic (type, model, specs)
  - Returns grouped line items array
- **useBOMCosts**: Retrieves unit costs for equipment
  - Queries equipment database
  - Falls back to entity overrides
  - Handles currency formatting
- **usePanelResize**: Handles panel resize interaction
  - Tracks mouse drag for width adjustment
  - Enforces min/max constraints
  - Saves width preference

### Services
- **BOMCalculator.ts**: Core BOM calculation logic
  - `calculateBOM(entities)`: Main entry point
  - `groupEntities(entities)`: Grouping by specs
  - `calculateQuantities(groups)`: Count entities
  - `retrieveCosts(groups)`: Fetch unit costs
  - `calculateTotals(lineItems)`: Sum line and category totals
- **EquipmentDatabase.ts**: Equipment cost data provider
  - `getCost(model, size)`: Retrieve unit cost
  - `searchEquipment(query)`: Find equipment by keyword
  - `updateCost(model, cost)`: Admin function to update costs
- **CurrencyFormatter.ts**: Currency formatting utilities
  - `formatCurrency(value, locale)`: Format number as currency
  - `parseCurrency(string)`: Parse currency string to number
  - `roundCurrency(value)`: Round to 2 decimal places

### Commands
- **UpdateBOMCommand**: Undo/redo for manual BOM edits (if implemented)
  - Stores previous and new BOM state
  - Not typically used (BOM auto-generated)

## Visual Diagrams

### BOM Panel Layout

```
Right Sidebar (1920x1080 canvas):
┌────────────────────────────────────┬─────────────────────┐
│ Main Canvas                        │ BOM Panel           │
│                                    │ ┏━━━━━━━━━━━━━━━━━┓ │
│  [Entities, Grid, Viewport]        │ ┃ Bill of Materials┃ │
│                                    │ ┣━━━━━━━━━━━━━━━━━┫ │
│                                    │ ┃ 12 items • 23 u  ┃ │
│                                    │ ┃ [↻] [↓] [≡] [←]  ┃ │
│                                    │ ┗━━━━━━━━━━━━━━━━━┛ │
│                                    │ ┌─────────────────┐ │
│                                    │ │ # │ Description │ │
│                                    │ ├───┼─────────────┤ │
│                                    │ │ 1 │ AHU - York  │ │
│                                    │ │ 2 │ AHU - Carr  │ │
│                                    │ │ 3 │ VAV - Trane │ │
│                                    │ │ 4 │ VAV - Price │ │
│                                    │ │ 5 │ Diffuser 4w │ │
│                                    │ │ ...              │ │
│                                    │ └─────────────────┘ │
│                                    │ ┌─────────────────┐ │
│                                    │ │ TOTAL: $19,560  │ │
│                                    │ └─────────────────┘ │
└────────────────────────────────────┴─────────────────────┘
         1520px wide                      400px wide

Resize Handle:
│<-8px hit zone                      │
                                   ↔ Cursor changes here
```

### BOM Table Structure Detail

```
┌────┬─────────────────────────┬────────────────────┬─────┬──────┬───────────┬────────────┐
│ #  │ Description             │ Specifications     │ Qty │ Unit │ Unit Cost │ Total Cost │
├────┼─────────────────────────┼────────────────────┼─────┼──────┼───────────┼────────────┤
│    │ AIR HANDLING UNITS      │                    │     │      │           │            │ ← Category Header
├────┼─────────────────────────┼────────────────────┼─────┼──────┼───────────┼────────────┤  (Bold, Light Blue BG)
│ 1  │ AHU - York MCA          │ 5000 CFM, 3-ton    │  2  │  ea  │ $3,450.00 │  $6,900.00 │
├────┼─────────────────────────┼────────────────────┼─────┼──────┼───────────┼────────────┤
│ 2  │ AHU - Carrier 48TC      │ 7500 CFM, 5-ton    │  1  │  ea  │ $5,200.00 │  $5,200.00 │
├────┴─────────────────────────┴────────────────────┴─────┴──────┴───────────┼────────────┤
│ Subtotal: Air Handling Units                                               │ $12,100.00 │ ← Subtotal Row
├────┬─────────────────────────┬────────────────────┬─────┬──────┬───────────┼────────────┤  (Italic, Gray BG)
│    │ VAV BOXES               │                    │     │      │           │            │
├────┼─────────────────────────┼────────────────────┼─────┼──────┼───────────┼────────────┤
│ 3  │ VAV - Trane TZHS        │ 400-1200 CFM       │  4  │  ea  │   $875.00 │  $3,500.00 │
├────┼─────────────────────────┼────────────────────┼─────┼──────┼───────────┼────────────┤
│ 4  │ VAV - Price SC          │ 600-1800 CFM       │  2  │  ea  │ $1,120.00 │  $2,240.00 │
├────┴─────────────────────────┴────────────────────┴─────┴──────┴───────────┼────────────┤
│ Subtotal: VAV Boxes                                                         │  $5,740.00 │
├────┴─────────────────────────────────────────────────────────────────────────┼────────────┤
│ TOTAL PROJECT COST:                                                          │ $19,560.00 │ ← Grand Total
└──────────────────────────────────────────────────────────────────────────────┴────────────┘  (Bold, Dark Blue BG)

Column Widths:
- #: 40px (item number)
- Description: 200px (equipment name)
- Specifications: 180px (size, capacity)
- Qty: 60px (quantity, right-aligned)
- Unit: 50px (each, pair, set)
- Unit Cost: 100px (currency, right-aligned)
- Total Cost: 120px (currency, right-aligned, bold)
```

### Entity Grouping Logic

```
Canvas Entities (8 diffusers):

diff-001: Type=Diffuser, Model=4way, Size=24x24, CFM=500, Cost=$125
diff-002: Type=Diffuser, Model=4way, Size=24x24, CFM=500, Cost=$125
diff-003: Type=Diffuser, Model=4way, Size=24x24, CFM=500, Cost=$125
diff-004: Type=Diffuser, Model=linear, Size=48, CFM=300, Cost=$180
diff-005: Type=Diffuser, Model=4way, Size=24x24, CFM=500, Cost=$125
diff-006: Type=Diffuser, Model=linear, Size=48, CFM=300, Cost=$180
diff-007: Type=Diffuser, Model=4way, Size=24x24, CFM=500, Cost=$125
diff-008: Type=Diffuser, Model=linear, Size=48, CFM=300, Cost=$180

Grouping Step 1: Extract Grouping Key
diff-001 → key: "Diffuser|4way|24x24|500"
diff-002 → key: "Diffuser|4way|24x24|500"
diff-003 → key: "Diffuser|4way|24x24|500"
diff-004 → key: "Diffuser|linear|48|300"
diff-005 → key: "Diffuser|4way|24x24|500"
diff-006 → key: "Diffuser|linear|48|300"
diff-007 → key: "Diffuser|4way|24x24|500"
diff-008 → key: "Diffuser|linear|48|300"

Grouping Step 2: Bucket by Key
"Diffuser|4way|24x24|500": [diff-001, diff-002, diff-003, diff-005, diff-007]
"Diffuser|linear|48|300": [diff-004, diff-006, diff-008]

Grouping Step 3: Count and Calculate
Group 1:
  Description: "Diffuser - 4-way"
  Specifications: "24"x24", 500 CFM"
  Quantity: 5 ea
  Unit Cost: $125.00
  Total: 5 × $125 = $625.00

Group 2:
  Description: "Diffuser - Linear"
  Specifications: "48", 300 CFM"
  Quantity: 3 ea
  Unit Cost: $180.00
  Total: 3 × $180 = $540.00

BOM Output:
┌────┬─────────────────────┬──────────────────┬─────┬──────┬───────────┬────────────┐
│ 5  │ Diffuser - 4-way    │ 24"x24", 500 CFM │  5  │  ea  │   $125.00 │    $625.00 │
│ 6  │ Diffuser - Linear   │ 48", 300 CFM     │  3  │  ea  │   $180.00 │    $540.00 │
└────┴─────────────────────┴──────────────────┴─────┴──────┴───────────┴────────────┘
```

### Real-Time Update Flow

```
Timeline:

T=0ms: User adds VAV box to canvas
       │
       └──> EntityStore.addEntity(vav-009)
              │
              └──> emit("entity-added", vav-009)

T=1ms: BOMStore receives event
       │
       └──> Check entity type: VAV Box → Include in BOM ✓
              │
              └──> Debounce timer started (500ms)

T=2-499ms: User continues editing
           (Additional changes queue up, reset timer)

T=500ms: Debounce timer expires
         │
         └──> BOMStore.calculateBOM()
                │
                ├──> Extract all equipment/fitting entities
                ├──> Group by specs (hash key matching)
                ├──> Calculate quantities (count per group)
                ├──> Retrieve unit costs (database query)
                ├──> Calculate line totals (qty × cost)
                ├──> Calculate category subtotals
                ├──> Calculate grand total
                └──> Update BOMStore.lineItems array

T=515ms: BOM calculation complete (15ms duration)
         │
         └──> BOMStore.version++
                │
                └──> emit("bom-updated")

T=516ms: BOMTable receives update
         │
         ├──> Compare previous vs new lineItems
         ├──> Identify changed row: line #3 (VAV - Trane TZHS)
         │     - Quantity: 4 → 5
         │     - Total: $3,500 → $4,375
         │
         └──> Trigger table re-render with animation
                │
                ├──> Row #3 background flash (yellow, 1s fade)
                ├──> Quantity counter animation (4 → 5)
                ├──> Total currency animation ($3,500 → $4,375)
                └──> Grand total animation ($19,560 → $20,435)

T=1516ms: Animations complete
          Panel shows updated BOM in steady state
```

### Panel Resize Interaction

```
User Resize Sequence:

Initial State:
┌──────────────────────┬────────────┐
│ Canvas               │ BOM Panel  │
│                      │  400px     │
│                      │            │
└──────────────────────┴────────────┘
                     ↑
                  Edge at X=1520

User Hovers Over Edge:
┌──────────────────────┬────────────┐
│ Canvas               ║ BOM Panel  │  ← Cursor: ↔
│                      ║            │
└──────────────────────┴────────────┘
                     ↑
              Resize cursor shown

User Drags Left (Expand Panel):
┌──────────────────┬────────────────┐
│ Canvas           │ BOM Panel      │  ← Width increases
│                  │     600px      │     as drag continues
└──────────────────┴────────────────┘
                 ↑
              Edge at X=1320

Table Reflows During Drag:
Frame 1 (420px):     Frame 2 (500px):     Frame 3 (600px):
┌─────────┐          ┌─────────────┐       ┌──────────────────┐
│ # │ Des│           │ # │ Descrip │       │ # │ Description  │
│ 1 │ AHU│           │ 1 │ AHU - Y │       │ 1 │ AHU - York M │
│ 2 │ AHU│           │ 2 │ AHU - C │       │ 2 │ AHU - Carrie │
└─────────┘          └─────────────┘       └──────────────────┘
Text truncates        More text            Full descriptions
at narrow width       visible              visible

Mouseup (Finalize):
┌──────────────────┬────────────────┐
│ Canvas           │ BOM Panel      │
│                  │     600px      │  ← Final width
└──────────────────┴────────────────┘
                 ↑
              Edge at X=1320

Preference Saved:
localStorage.setItem('bomPanelWidth', 600)
```

## Testing

### Unit Tests

**Test Suite**: BOMCalculator

1. **Test: Group identical entities correctly**
   - Setup: 5 entities with same type, model, size, cost
   - Action: calculateBOM(entities)
   - Assert: Single line item with quantity 5

2. **Test: Separate line items for different specs**
   - Setup: 3 entities model A, 2 entities model B
   - Action: calculateBOM(entities)
   - Assert: Two line items (qty 3 and qty 2)

3. **Test: Calculate line totals correctly**
   - Setup: Line item qty=4, unit cost=$875
   - Action: calculateTotals(lineItems)
   - Assert: Line total = $3,500.00

4. **Test: Calculate category subtotals**
   - Setup: Category with 3 line items: $1000, $2000, $1500
   - Action: calculateTotals(lineItems)
   - Assert: Category subtotal = $4,500.00

5. **Test: Calculate grand total**
   - Setup: 3 categories with subtotals: $12,100, $5,740, $1,720
   - Action: calculateTotals(lineItems)
   - Assert: Grand total = $19,560.00

6. **Test: Handle zero-cost items**
   - Setup: Entity with unit cost = $0.00
   - Setting: bomIncludeZeroCost = true
   - Action: calculateBOM(entities)
   - Assert: Line item included with $0.00 cost

7. **Test: Exclude zero-cost items when configured**
   - Setup: Entity with unit cost = $0.00
   - Setting: bomIncludeZeroCost = false
   - Action: calculateBOM(entities)
   - Assert: Line item excluded from BOM

### Integration Tests

**Test Suite**: BOM Real-Time Updates

1. **Test: BOM updates when entity added**
   - Setup: BOM with 10 line items
   - Action: Add new entity to canvas (VAV box)
   - Assert: BOM recalculates within 500ms (debounce)
   - Assert: Matching line item quantity increments OR new line item added
   - Assert: Grand total increases by unit cost

2. **Test: BOM updates when entity removed**
   - Setup: BOM with line item qty=5
   - Action: Delete one entity from canvas
   - Assert: Line item quantity decrements to 4
   - Assert: Grand total decreases by unit cost

3. **Test: BOM updates when entity modified**
   - Setup: Entity with model A (in BOM)
   - Action: Change entity model to B
   - Assert: Model A line item quantity decrements
   - Assert: Model B line item quantity increments OR new line item created

4. **Test: Debouncing prevents excessive recalculations**
   - Setup: BOM panel open
   - Action: Add 10 entities rapidly (within 500ms)
   - Assert: BOM recalculates only once after last addition
   - Assert: Not 10 separate calculations

5. **Test: Panel resize updates table layout**
   - Setup: BOM panel at 400px width
   - Action: Resize to 600px
   - Assert: Table reflows smoothly
   - Assert: More description text visible
   - Assert: No broken layout

### End-to-End Tests

**Test Suite**: User BOM Workflow

1. **Test: User opens BOM panel and reviews costs**
   - Setup: Project with 20 equipment entities
   - Action: User presses Ctrl+B
   - Assert: BOM panel slides in from right
   - Assert: Table shows grouped line items
   - Assert: Grand total displayed at bottom
   - Assert: All categories visible with subtotals

2. **Test: User adds equipment and sees BOM update**
   - Setup: BOM panel open, showing 12 line items
   - Action: User adds 4-way diffuser to canvas
   - Assert: After 500ms, BOM recalculates
   - Assert: Diffuser line item quantity increases
   - Assert: Changed row highlights briefly (yellow flash)
   - Assert: Grand total increases

3. **Test: User resizes BOM panel for better view**
   - Setup: BOM panel at default 400px width
   - Action: User drags left edge to 600px
   - Assert: Panel expands smoothly
   - Assert: Table columns adjust proportionally
   - Assert: Full equipment descriptions visible
   - Assert: Resize preference saved

4. **Test: User collapses BOM to maximize canvas space**
   - Setup: BOM panel open at 600px
   - Action: User clicks collapse button
   - Assert: Panel animates to 40px width
   - Assert: Vertical "BOM" label visible
   - Assert: Table hidden during collapse
   - Action: User clicks tab to expand
   - Assert: Panel animates back to 600px
   - Assert: Table reappears with same data

5. **Test: Empty BOM shows helpful message**
   - Setup: New project with no equipment
   - Action: User opens BOM panel
   - Assert: Empty state displayed
   - Assert: Message: "No equipment or fittings in project"
   - Assert: Total shows $0.00
   - Assert: Panel structure intact (header, footer)

## Common Pitfalls

### Pitfall 1: Not Debouncing BOM Recalculation

**Problem**: BOM recalculates on every entity change event, even during rapid bulk operations.

**Symptom**: During CSV import of 100 entities, BOM recalculates 100 times, causing severe UI lag.

**Solution**: Debounce recalculation with 500ms delay:
- Start timer on first entity change
- Reset timer on subsequent changes within 500ms
- Execute calculation only after 500ms of inactivity
- Single calculation captures all changes

### Pitfall 2: Incorrect Grouping Key Leading to Duplicate Line Items

**Problem**: Grouping key doesn't include all relevant specifications, causing entities to group incorrectly.

**Symptom**: Two "identical" diffusers with different CFM ratings grouped together, leading to inaccurate BOM.

**Solution**: Comprehensive grouping key:
- Include: type, manufacturer, model, size, CFM, voltage, phase, any distinguishing spec
- Hash key: `${type}|${model}|${size}|${cfm}|${voltage}`
- Test edge cases (similar but not identical equipment)

### Pitfall 3: Not Handling Missing Cost Data

**Problem**: Entity missing unit cost, BOM calculation crashes or shows undefined/NaN.

**Symptom**: BOM panel shows error or blank costs, grand total is NaN.

**Solution**: Graceful fallback for missing costs:
- Check if unit cost exists and is valid number
- If missing: use $0.00 with warning indicator
- If invalid (NaN): show "Invalid" with error icon
- Exclude invalid costs from grand total
- Provide warning banner with count of items missing costs

### Pitfall 4: Panel Resize Breaking Table Layout

**Problem**: Table columns don't reflow properly when panel resized, causing overflow or overlapping text.

**Symptom**: At narrow widths, cost columns overlap descriptions. At wide widths, excessive whitespace.

**Solution**: Responsive column widths:
- Use percentage-based widths for flexible columns (description, specs)
- Fixed widths for numeric columns (qty, costs) to prevent wrapping
- Implement minimum panel width (300px) to prevent layout collapse
- Truncate long descriptions with ellipsis and tooltip

### Pitfall 5: Stale BOM Data After Undo/Redo

**Problem**: User undoes entity deletion, but BOM doesn't recalculate to include restored entity.

**Symptom**: BOM shows fewer items than actually on canvas, grand total incorrect.

**Solution**: Subscribe to history events:
- Listen for undo/redo events from HistoryStore
- Trigger BOM recalculation after undo/redo completes
- Ensure entity change events fire even for undone operations
- Validate BOM entity count matches canvas entity count periodically

## Performance Tips

### Tip 1: Virtual Scrolling for Large BOMs

Rendering 500+ line items in DOM is expensive:

**Implementation**: Use react-window or similar virtualization library. Render only visible rows (20-30) based on scroll position. Swap row content as user scrolls.

**Benefit**: Reduces render time from 500ms (500 rows) to 50ms (30 rows). 10x improvement.

### Tip 2: Memoize Line Item Grouping

Regrouping all entities on every minor change is wasteful:

**Implementation**: Use memoization (useMemo in React). Cache grouped result based on entity array version. Only regroup when entity array changes.

**Benefit**: Eliminates redundant grouping when only costs change (not quantities).

### Tip 3: Background BOM Calculation in Web Worker

Large BOM calculations (10,000+ entities) block UI:

**Implementation**: Offload calculateBOM() to Web Worker. Send entity data to worker, receive line items back. UI remains responsive during calculation.

**Benefit**: Prevents UI freeze on very large projects. User can continue working while BOM calculates.

### Tip 4: Incremental BOM Updates

Full recalculation for single entity add is inefficient:

**Implementation**: Detect type of change (add/remove/modify single entity). For single entity changes, update only affected line item incrementally. Skip full recalculation.

**Benefit**: Single entity add updates BOM in 5ms vs 50ms for full recalculation.

### Tip 5: Cache Equipment Database Queries

Querying database for unit cost on every BOM calculation is slow:

**Implementation**: Cache equipment costs in memory (Map or object). Query database once per session. Use cached values for subsequent calculations. Invalidate cache on cost updates.

**Benefit**: BOM calculation time reduced from 100ms to 20ms by eliminating redundant database queries.

## Future Enhancements

### Enhancement 1: BOM Templates and Markups

**Description**: Apply percentage markups to categories or entire BOM for pricing estimates (labor, overhead, profit).

**User Value**: Generate customer-facing pricing from internal cost BOM.

**Implementation**:
- Markup configuration per category (e.g., Equipment: 25%, Fittings: 40%)
- "Show Markup" toggle adds Markup column to table
- Separate "Cost" and "Price" columns
- Grand total shows both cost and price
- Export includes both cost and price versions

### Enhancement 2: BOM Comparison Mode

**Description**: Compare BOMs from two project versions or revisions to see cost changes.

**User Value**: Understand cost impact of design changes.

**Implementation**:
- "Compare with..." button opens version selector
- Side-by-side or inline diff view
- Highlight added items (green), removed items (red), quantity changes (yellow)
- Cost delta shown (e.g., "+$2,450 from previous version")
- Export comparison report

### Enhancement 3: Custom BOM Grouping Rules

**Description**: Allow users to define custom grouping logic (group by supplier, location, install phase).

**User Value**: Organize BOM by procurement workflow or installation sequence.

**Implementation**:
- "Group By" dropdown: Type, Manufacturer, Supplier, Location, Layer, Custom Tag
- Custom grouping field on entities
- BOM reorganizes based on selected grouping
- Multiple grouping levels (e.g., Supplier > Type > Model)

### Enhancement 4: BOM Notes and Annotations

**Description**: Add notes to BOM line items (installation instructions, special requirements).

**User Value**: Include important context in material takeoffs.

**Implementation**:
- Notes column in BOM table (collapsible)
- Click to add/edit note on line item
- Notes persist in project file
- Include notes in BOM export
- Rich text formatting support

### Enhancement 5: BOM Cost History Tracking

**Description**: Track cost changes over time, show historical pricing trends.

**User Value**: Understand cost volatility, plan for price increases.

**Implementation**:
- Store historical unit costs with timestamps
- "Cost History" button on line items
- Chart showing cost trend over time
- Alert if current cost significantly higher than historical average
- "Lock Costs" option to freeze pricing at specific date

### Enhancement 6: BOM Integration with Suppliers

**Description**: Check real-time availability and pricing from supplier APIs.

**User Value**: Ensure accurate, up-to-date costs and lead times.

**Implementation**:
- Configure supplier API connections in settings
- "Check Availability" button queries suppliers
- Display in-stock status and lead times
- Update unit costs with real-time pricing
- Generate purchase orders directly from BOM

### Enhancement 7: BOM Alternates and Substitutions

**Description**: Define alternate equipment options for line items (substitute if primary unavailable).

**User Value**: Flexibility in procurement, cost optimization.

**Implementation**:
- "Alternates" column shows count of substitute options
- Click to view/manage alternates for line item
- Specify primary, secondary, tertiary options
- Costs update based on selected alternate
- "Optimize for Cost" auto-selects cheapest alternates

### Enhancement 8: BOM Labor Estimates

**Description**: Add labor hour estimates to BOM line items for total project cost.

**User Value**: Complete project cost including materials and labor.

**Implementation**:
- Labor hours column (install time per unit)
- Labor rate configuration ($/hour)
- Labor cost = hours × rate × quantity
- Grand total includes materials + labor
- Separate materials vs labor subtotals

### Enhancement 9: BOM Export with Images

**Description**: Include equipment images in exported BOM (PDF, Excel).

**User Value**: Visual reference in material takeoffs for client review.

**Implementation**:
- Retrieve equipment images from database
- PDF export includes thumbnail images
- Excel export with embedded images
- Configurable: images on/off, size
- "Image Sheet" separate page with large images

### Enhancement 10: BOM Approval Workflow

**Description**: Multi-user approval process for BOM finalization before procurement.

**User Value**: Ensures BOM reviewed and approved by stakeholders before ordering.

**Implementation**:
- "Submit for Approval" locks BOM editing
- Approval requests sent to designated reviewers
- Comments and change requests on line items
- Approval status: Pending, Approved, Rejected, Revision Requested
- Approval history log with timestamps and approvers
