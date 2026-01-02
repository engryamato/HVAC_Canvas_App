# UJ-BP-002: Filter and Sort BOM

## Overview

This user journey describes how users filter and sort the Bill of Materials to find specific equipment, analyze costs by category, and organize data for different workflows. Filtering and sorting capabilities make large BOMs manageable and support various analysis and reporting needs.

## PRD References

- **FR-BOM-004**: BOM filtering by category, cost range, manufacturer
- **FR-BOM-005**: BOM sorting by any column (description, quantity, cost)
- **FR-BOM-006**: Search functionality for finding specific equipment
- **US-BOM-002**: As a user, I want to filter and sort the BOM so that I can focus on specific equipment types or cost ranges
- **AC-BOM-002-01**: Filter controls accessible via button in BOM header
- **AC-BOM-002-02**: Filter by category (AHU, VAV, Diffusers, etc.)
- **AC-BOM-002-03**: Filter by cost range (min/max values)
- **AC-BOM-002-04**: Search box filters by text match in description or specifications
- **AC-BOM-002-05**: Column headers clickable to sort ascending/descending
- **AC-BOM-002-06**: Multiple filters combine with AND logic

## Prerequisites

- User has BOM panel open with line items displayed
- Project contains multiple equipment types and categories for filtering
- Understanding of BOM structure (categories, descriptions, costs)
- Familiarity with table sorting concepts

## User Journey Steps

### Step 1: Open Filter Controls

**User Actions**:
1. User identifies need to narrow BOM focus (e.g., view only diffusers)
2. User clicks "Filter" button (funnel icon) in BOM panel header
3. Filter panel expands below header, showing filter options
4. User reviews available filter criteria

**System Response**:
- Filter panel slides down with 200ms animation
- Filter controls displayed:
  - Search box (text input with magnifying glass icon)
  - Category checkboxes (AHU, VAV, Diffusers, Grilles, etc.)
  - Cost range sliders (min/max)
  - Manufacturer dropdown (if applicable)
  - "Clear Filters" button
  - Active filter count badge on Filter button
- Filter panel overlays top of BOM table
- Table remains visible below filter panel

**Validation**:
- Filter panel visible and properly positioned
- All filter controls functional and responsive
- Initial state: no filters applied, all line items visible
- Filter state synchronized with displayed line items

**Data**:

```
Filter Panel State:
- visible: true
- expanded: true
- animationDuration: 200ms

Available Filters:
- Search: "" (empty)
- Categories:
  - Air Handling Units: ✓ (checked)
  - Rooftop Units: ✓
  - VAV Boxes: ✓
  - Diffusers: ✓
  - Grilles: ✓
  - Dampers: ✓
  - Accessories: ✓
- Cost Range:
  - Min: $0 (slider at left)
  - Max: $10,000 (slider at right, project max cost)
- Manufacturer: "All" (dropdown selection)

Active Filters: 0
- No filters currently applied
- All line items visible (12 items)

Filter Panel Layout:
┌────────────────────────────────────────┐
│ Search: [________________] 🔍          │
│                                        │
│ Categories:                            │
│ ☑ Air Handling Units                  │
│ ☑ VAV Boxes                            │
│ ☑ Diffusers                            │
│ ☑ Grilles                              │
│ ☑ Dampers                              │
│                                        │
│ Cost Range: $0 ━━●━━━━━━ $10,000      │
│                                        │
│ Manufacturer: [All ▼]                  │
│                                        │
│ Active Filters: 0 │ [Clear Filters]   │
└────────────────────────────────────────┘
```

**Substeps**:
1. User clicks Filter button
2. FilterPanel component state: visible = true
3. Panel animation starts (slide down, 200ms)
4. Render filter controls:
   - Search input field
   - Category checkbox list (from BOMStore.categories)
   - Cost range dual slider
   - Manufacturer dropdown (from entity data)
5. Initialize filter state (all categories checked, full cost range)
6. Animation completes, panel fully visible
7. Focus search input for immediate typing

### Step 2: Apply Category Filter

**User Actions**:
1. User wants to view only diffusers and grilles
2. User unchecks all category checkboxes except "Diffusers" and "Grilles"
3. Observes BOM table updating to show only selected categories
4. Filter button shows active filter count badge (2 filters)

**System Response**:
- Track category checkbox state changes
- On checkbox change:
  - Update filter state: categories = ["Diffusers", "Grilles"]
  - Apply filters to BOM line items
  - Filter logic: keep line items where category IN selectedCategories
  - Update table with filtered results
  - Animate row transitions (fade out excluded, keep selected)
  - Update totals to reflect filtered items only
- Active filter count badge updates: "2" (2 categories selected of 7 total)
- Status message: "Showing 2 of 12 line items"

**Validation**:
- Only line items from selected categories visible
- Excluded categories completely hidden
- Category subtotals recalculated for visible items only
- Grand total reflects filtered selection only

**Data**:

```
Filter State Before:
- categories: ["AHU", "RTU", "VAV", "Diffusers", "Grilles", "Dampers", "Accessories"]
- selectedCategories: all (default)
- filteredItemCount: 12 (all items)

User Action: Uncheck all except Diffusers and Grilles

Filter State After:
- categories: ["AHU", "RTU", "VAV", "Diffusers", "Grilles", "Dampers", "Accessories"]
- selectedCategories: ["Diffusers", "Grilles"]
- filteredItemCount: 2 (only diffuser/grille items)

Filtering Logic:
lineItems.filter(item => selectedCategories.includes(item.category))

Filtered Results:
┌────┬─────────────────────┬──────────────────┬─────┬──────┬───────────┬────────────┐
│ 5  │ Diffuser - 4-way    │ 24"x24", 500 CFM │  8  │  ea  │   $125.00 │  $1,000.00 │
│ 6  │ Diffuser - Linear   │ 48", 300 CFM     │  4  │  ea  │   $180.00 │    $720.00 │
├────┴─────────────────────┴──────────────────┴─────┴──────┴───────────┼────────────┤
│ Subtotal: Diffusers                                                   │  $1,720.00 │
├────┬─────────────────────┬──────────────────┬─────┬──────┬───────────┼────────────┤
│ 7  │ Grille - Return     │ 24"x12"          │  6  │  ea  │    $85.00 │    $510.00 │
├────┴─────────────────────┴──────────────────┴─────┴──────┴───────────┼────────────┤
│ Subtotal: Grilles                                                     │    $510.00 │
├────┴─────────────────────────────────────────────────────────────────┼────────────┤
│ FILTERED TOTAL:                                                       │  $2,230.00 │
└───────────────────────────────────────────────────────────────────────┴────────────┘

Active Filters Display:
- Badge on Filter button: "2"
- Status: "Showing 2 of 12 line items"
- Filter panel categories:
  - ☐ Air Handling Units
  - ☐ VAV Boxes
  - ☑ Diffusers ← Selected
  - ☑ Grilles ← Selected
  - ☐ Dampers
```

**Substeps**:
1. User clicks Diffusers checkbox (check)
2. User clicks Grilles checkbox (check)
3. User clicks all other checkboxes (uncheck)
4. Filter state updates: selectedCategories = ["Diffusers", "Grilles"]
5. Trigger filter application
6. Filter line items array by category
7. Recalculate subtotals for visible categories
8. Recalculate filtered grand total
9. Update table display with filtered results
10. Update active filter count badge
11. Show status message with filtered count

### Step 3: Apply Cost Range Filter

**User Actions**:
1. User wants to see only items costing $500-$2000
2. User drags min slider right to $500
3. User drags max slider left to $2000
4. Observes BOM updating to show only items in range
5. Items outside range hidden from view

**System Response**:
- Track slider position changes (mousemove during drag)
- Update cost range values in real-time as sliders move
- On slider release (mouseup):
  - Apply cost filter to line items
  - Filter logic: keep items where totalCost >= min AND totalCost <= max
  - Combine with existing category filter (AND logic)
  - Update table with results matching ALL active filters
  - Update totals for filtered selection
- Status message updates: "Showing 1 of 12 line items • Filters: Categories (2), Cost Range"

**Validation**:
- Only line items with total cost in [$500, $2000] range visible
- Items outside range excluded
- Cost filter combines correctly with category filter
- Slider values display current selection ($500 - $2000)

**Data**:

```
Cost Range Filter Initial State:
- minCost: $0
- maxCost: $10,000 (project maximum)
- sliderMin: 0% (left position)
- sliderMax: 100% (right position)

User Drags Min Slider:
- Mouse drag to 5% position
- Calculate cost: $0 + (5% * $10,000) = $500
- Update minCost: $500
- Display: "$500"

User Drags Max Slider:
- Mouse drag to 20% position
- Calculate cost: $0 + (20% * $10,000) = $2,000
- Update maxCost: $2,000
- Display: "$2,000"

Cost Range Filter Final State:
- minCost: $500
- maxCost: $2,000
- sliderMin: 5%
- sliderMax: 20%

Combined Filter Logic:
lineItems
  .filter(item => selectedCategories.includes(item.category))
  .filter(item => item.totalCost >= minCost && item.totalCost <= maxCost)

Filtered Results (Category: Diffusers/Grilles + Cost: $500-$2000):
┌────┬─────────────────────┬──────────────────┬─────┬──────┬───────────┬────────────┐
│ 5  │ Diffuser - 4-way    │ 24"x24", 500 CFM │  8  │  ea  │   $125.00 │  $1,000.00 │
│ 6  │ Diffuser - Linear   │ 48", 300 CFM     │  4  │  ea  │   $180.00 │    $720.00 │
│ 7  │ Grille - Return     │ 24"x12"          │  6  │  ea  │    $85.00 │    $510.00 │
├────┴─────────────────────────────────────────────────────────────────┼────────────┤
│ FILTERED TOTAL:                                                       │  $2,230.00 │
└───────────────────────────────────────────────────────────────────────┴────────────┘

Note: All 3 items fall within $500-$2000 range, so all remain visible

Active Filters:
- Categories: ["Diffusers", "Grilles"]
- Cost Range: [$500, $2000]
- Count: 3 active filters
- Badge: "3"
- Status: "Showing 3 of 12 line items"
```

**Substeps**:
1. User clicks and holds min slider handle
2. Drag event tracking starts
3. On mousemove:
   - Calculate slider percentage from mouse position
   - Convert percentage to cost value
   - Update minCost display
4. User releases mouse (mouseup)
5. Repeat for max slider (steps 1-4)
6. Apply cost range filter:
   - Filter by minCost <= totalCost <= maxCost
   - Combine with category filter (AND)
7. Update table with filtered results
8. Recalculate filtered totals
9. Update active filter count and status

### Step 4: Search for Specific Equipment

**User Actions**:
1. User wants to find all "Trane" equipment
2. User clicks search box in filter panel
3. User types "Trane"
4. Observes BOM filtering to show only items containing "Trane" in description or specifications
5. Search highlights matched text in results

**System Response**:
- Focus search input on click
- Track keystrokes as user types
- Debounce search application (300ms after last keystroke)
- Apply search filter:
  - Search in: description, specifications, model, manufacturer fields
  - Case-insensitive matching
  - Partial match (substring search)
  - Combine with existing filters (AND logic)
- Highlight search term in results (bold or yellow background)
- Update status: "Showing 2 of 12 line items • Search: 'Trane'"

**Validation**:
- Search matches any part of relevant text fields
- Case-insensitive (finds "trane", "Trane", "TRANE")
- Debouncing prevents excessive filter updates during typing
- Search combines correctly with other active filters

**Data**:

```
Search Filter State:
- searchTerm: "Trane"
- searchFields: ["description", "specifications", "model", "manufacturer"]
- caseSensitive: false
- debounceMs: 300

Search Logic:
lineItems.filter(item => {
  const searchableText = [
    item.description,
    item.specifications,
    item.model,
    item.manufacturer
  ].join(' ').toLowerCase();

  return searchableText.includes(searchTerm.toLowerCase());
})

Combined Filter (Category + Cost + Search):
lineItems
  .filter(item => selectedCategories.includes(item.category))
  .filter(item => item.totalCost >= minCost && item.totalCost <= maxCost)
  .filter(item => matchesSearch(item, searchTerm))

Filtered Results (Search: "Trane"):
┌────┬─────────────────────┬──────────────────┬─────┬──────┬───────────┬────────────┐
│ 3  │ VAV - Trane TZHS    │ 400-1200 CFM     │  5  │  ea  │   $875.00 │  $4,375.00 │
├────┴─────────────────────────────────────────────────────────────────┼────────────┤
│ FILTERED TOTAL:                                                       │  $4,375.00 │
└───────────────────────────────────────────────────────────────────────┴────────────┘
           ↑
      Highlighted "Trane" in description

Active Filters:
- Search: "Trane"
- Count: 1 (search overrides other filters in this example)
- Status: "Showing 1 of 12 line items • Search: 'Trane'"
```

**Substeps**:
1. User clicks search input
2. Input receives focus
3. User types 'T', 'r', 'a', 'n', 'e'
4. On each keystroke:
   - Update searchTerm state
   - Reset debounce timer (300ms)
5. After 300ms of no typing:
   - Apply search filter
   - Search across description, specs, model, manufacturer
   - Combine with other active filters
6. Filter line items by search match
7. Update table with search results
8. Highlight search term in visible results
9. Update status message

### Step 5: Sort by Column

**User Actions**:
1. User wants to see highest-cost items first
2. User clicks "Total Cost" column header
3. Observes BOM sorting by cost descending (high to low)
4. Sort indicator appears in column header (down arrow)
5. User clicks header again to reverse sort (ascending)

**System Response**:
- Detect click on sortable column header
- Determine current sort state:
  - If unsorted: sort descending
  - If descending: sort ascending
  - If ascending: clear sort (return to default order)
- Apply sort to filtered line items:
  - Sort by totalCost (numeric sort)
  - Maintain category grouping (sort within categories)
  - Update table row order
- Display sort indicator in header:
  - ▼ (down arrow) for descending
  - ▲ (up arrow) for ascending
  - No indicator for unsorted
- Animate row reordering (smooth transitions)

**Validation**:
- Line items correctly sorted by selected column
- Numeric sorting for cost/quantity columns (not alphabetic)
- String sorting for description/specification columns
- Sort indicator accurately reflects current sort state
- Multiple clicks cycle through: desc → asc → unsorted

**Data**:

```
Sort State Initial:
- sortColumn: null
- sortDirection: null
- defaultOrder: by category, then item number

User Clicks "Total Cost" Header (First Time):
- sortColumn: "totalCost"
- sortDirection: "desc" (descending)

Sort Logic:
lineItems.sort((a, b) => {
  if (sortDirection === 'desc') {
    return b.totalCost - a.totalCost; // High to low
  } else {
    return a.totalCost - b.totalCost; // Low to high
  }
})

Sorted Results (Total Cost Descending):
┌────┬─────────────────────┬──────────────────┬─────┬──────┬───────────┬────────────┐
│ 2  │ AHU - Carrier 48TC  │ 7500 CFM, 5-ton  │  1  │  ea  │ $5,200.00 │  $5,200.00 │ ← Highest
│ 1  │ AHU - York MCA      │ 5000 CFM, 3-ton  │  2  │  ea  │ $3,450.00 │  $6,900.00 │
│ 3  │ VAV - Trane TZHS    │ 400-1200 CFM     │  5  │  ea  │   $875.00 │  $4,375.00 │
│ 4  │ VAV - Price SC      │ 600-1800 CFM     │  2  │  ea  │ $1,120.00 │  $2,240.00 │
│ 5  │ Diffuser - 4-way    │ 24"x24", 500 CFM │  8  │  ea  │   $125.00 │  $1,000.00 │
│ 6  │ Diffuser - Linear   │ 48", 300 CFM     │  4  │  ea  │   $180.00 │    $720.00 │
│ 7  │ Grille - Return     │ 24"x12"          │  6  │  ea  │    $85.00 │    $510.00 │ ← Lowest
└────┴─────────────────────┴──────────────────┴─────┴──────┴───────────┴────────────┘

Column Header Display:
┌────┬─────────────┬──────────────┬─────┬──────┬───────────┬──────────────┐
│ #  │ Description │ Specs        │ Qty │ Unit │ Unit Cost │ Total Cost ▼ │ ← Sort indicator
└────┴─────────────┴──────────────┴─────┴──────┴───────────┴──────────────┘

User Clicks "Total Cost" Header (Second Time):
- sortColumn: "totalCost"
- sortDirection: "asc" (ascending)
- Results reverse order (lowest to highest)
- Indicator changes to ▲

User Clicks "Total Cost" Header (Third Time):
- sortColumn: null
- sortDirection: null
- Results return to default order (by category/item #)
- Indicator removed
```

**Substeps**:
1. User clicks column header (e.g., "Total Cost")
2. Detect click event on header cell
3. Determine current sort state for this column
4. Cycle to next state: null → desc → asc → null
5. Update sort state in BOMStore
6. Apply sort to current filtered line items
7. Numeric sort for cost/quantity columns
8. Alphabetic sort for text columns
9. Update table with sorted order
10. Animate row transitions (smooth reordering)
11. Update column header with sort indicator
12. Scroll to top of table (optional)

### Step 6: Clear All Filters

**User Actions**:
1. User has multiple filters active (category, cost, search)
2. User wants to return to full BOM view
3. User clicks "Clear Filters" button in filter panel
4. Observes all filters resetting and full BOM displaying

**System Response**:
- Reset all filter states:
  - selectedCategories: all categories (reset checkboxes)
  - costRange: [$0, $10,000] (reset sliders)
  - searchTerm: "" (clear search input)
  - sortColumn: null (clear sort)
  - sortDirection: null
- Reapply default state (show all line items)
- Update table to show all 12 line items (unfiltered)
- Recalculate totals for full BOM
- Update status: "Showing 12 of 12 line items"
- Active filter badge: "0"

**Validation**:
- All filter controls reset to default state
- All line items visible again
- Totals match original unfiltered grand total
- Active filter count returns to 0

**Data**:

```
Filter State Before Clear:
- selectedCategories: ["Diffusers", "Grilles"]
- costRange: { min: $500, max: $2000 }
- searchTerm: "Trane"
- sortColumn: "totalCost"
- sortDirection: "desc"
- activeFilterCount: 4
- filteredItemCount: 1

User Clicks "Clear Filters":

Filter State After Clear:
- selectedCategories: ["AHU", "RTU", "VAV", "Diffusers", "Grilles", "Dampers", "Accessories"]
- costRange: { min: $0, max: $10,000 }
- searchTerm: ""
- sortColumn: null
- sortDirection: null
- activeFilterCount: 0
- filteredItemCount: 12 (all items)

UI Updates:
- All category checkboxes: checked ✓
- Cost sliders: min at 0%, max at 100%
- Search input: empty
- Column headers: no sort indicators
- Filter badge: "0" (or hidden)
- Status: "Showing 12 of 12 line items"

Full BOM Restored:
(All 12 line items visible in default category order)
Grand Total: $19,560.00
```

**Substeps**:
1. User clicks "Clear Filters" button
2. Reset selectedCategories to all
3. Reset costRange to [min, max] bounds
4. Clear searchTerm to empty string
5. Clear sortColumn and sortDirection
6. Update filter panel UI controls
7. Reapply filters (now all defaults = no filtering)
8. Update table with all line items
9. Recalculate grand total
10. Update status message and badge

## Edge Cases

### Edge Case 1: Filter Results in Zero Items

**Scenario**: User applies filters that exclude all line items (e.g., cost range with no items).

**Expected Behavior**:
- BOM table shows empty state within table area
- Message: "No items match current filters"
- Suggestion: "Try adjusting your filter criteria"
- Filter controls remain visible and editable
- Filtered total shows $0.00
- Status: "Showing 0 of 12 line items"
- "Clear Filters" button available to reset

**Handling**:
- Detect filteredItems.length === 0
- Render empty state in table body
- Keep filter panel open for easy adjustment
- Provide actionable feedback to user

### Edge Case 2: Search with No Matches

**Scenario**: User searches for equipment not in BOM (e.g., "Lennox" but all equipment is Trane/Carrier).

**Expected Behavior**:
- Table shows empty search results
- Message: "No items found matching 'Lennox'"
- Suggestion: "Check spelling or try different search terms"
- Search term remains in input (user can edit)
- Quick action: "Clear Search" link
- Other filters remain active (can remove search to see results)

**Handling**:
- Empty state specific to search (different message than filter)
- One-click search clear for quick recovery
- Preserve other filter states

### Edge Case 3: Sorting Filtered Results

**Scenario**: User has category filter active (showing 3 items) and sorts by cost.

**Expected Behavior**:
- Sort applies only to filtered results (3 items)
- Excluded items remain hidden (not shown at bottom)
- Sort indicator shows in column header
- Status reflects both filter and sort: "Showing 3 of 12 line items • Sorted by Total Cost ▼"
- Clearing filter maintains sort order for newly visible items

**Handling**:
- Apply sort to filteredItems array, not full lineItems
- Maintain sort state independent of filter state
- When filter cleared, apply existing sort to expanded results

### Edge Case 4: Cost Range Slider Edge Values

**Scenario**: User sets min and max sliders to same value (e.g., both at $1000).

**Expected Behavior**:
- Show only items with exact total cost of $1000
- If no items match exactly, show empty state
- Slider values display: "$1000 - $1000"
- Tooltip explains: "Showing items with total cost exactly $1000"
- Allow user to expand range by dragging either slider

**Handling**:
- Filter logic uses >= min AND <= max (includes equality)
- Single-value range is valid filter condition
- Provide helpful tooltip for clarity

### Edge Case 5: Conflicting Filter and Sort

**Scenario**: User filters to show only diffusers (3 items) and sorts by category (which is now uniform).

**Expected Behavior**:
- Sort by category has no effect (all visible items in same category)
- Secondary sort applies: item number or description
- Sort indicator still shows in category column header
- No error or warning displayed
- User can sort by other columns (quantity, cost) for meaningful ordering

**Handling**:
- Allow sort even if ineffective (user preference)
- Apply secondary sort criteria for tie-breaking
- No special handling needed (graceful degradation)

## Error Scenarios

### Error 1: Invalid Cost Range Input

**Scenario**: User manually enters cost value in slider input, enters invalid data ("abc" or negative number).

**Error Message**: "Invalid cost value. Please enter a positive number."

**Recovery**:
1. Detect non-numeric or negative input on blur
2. Display inline error message below input
3. Highlight input with red border
4. Revert to previous valid value
5. Focus input for correction
6. Filter not applied until valid input provided

### Error 2: Search Query Too Short

**Scenario**: User types single character in search, which could match thousands of items in large BOM.

**Error Message**: "Search term too short. Please enter at least 2 characters."

**Recovery**:
1. Detect searchTerm.length < 2
2. Display hint below search input
3. Do not apply filter (wait for more characters)
4. Grey out search results area with hint message
5. Auto-apply when 2+ characters entered

### Error 3: Filter Application Timeout

**Scenario**: Extremely large BOM (5000+ items) with complex filtering takes >5 seconds.

**Error Message**: "Filter taking longer than expected. Simplifying..."

**Recovery**:
1. Detect filter execution time >5s
2. Show progress indicator: "Filtering 2,347/5,234 items..."
3. If timeout, apply partial results with warning
4. "Filter incomplete. Showing first 1000 results."
5. Offer "Continue Filtering" or "Simplify Filters" options
6. Background process continues if user allows

## Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+F` | Focus Search Input | BOM panel visible |
| `Esc` | Clear Search / Close Filter Panel | Search focused or filter panel open |
| `Ctrl+Shift+F` | Toggle Filter Panel | BOM panel visible |
| `Alt+C` | Clear All Filters | Filter panel open |
| `Ctrl+↑` | Sort Ascending (focused column) | BOM table focused |
| `Ctrl+↓` | Sort Descending (focused column) | BOM table focused |
| `Tab` | Navigate Filter Controls | Filter panel focused |
| `Enter` | Apply Filter (when editing filter control) | Filter control focused |

## Related Elements

### Components
- **FilterPanel.tsx**: Filter controls container
  - Search input
  - Category checkboxes
  - Cost range sliders
  - Clear filters button
- **SearchInput.tsx**: Debounced search input with clear button
- **CategoryFilter.tsx**: Checkbox list for category selection
- **CostRangeFilter.tsx**: Dual-handle slider for min/max cost
- **SortableColumnHeader.tsx**: Clickable column header with sort indicator
  - Cycles through sort states on click
  - Displays sort direction arrow
- **FilterBadge.tsx**: Active filter count indicator on Filter button
- **BOMTableSorted.tsx**: Table component with sorting capability

### Stores
- **BOMStore**: Extended with filter/sort state
  - `filterState`: Object containing all filter criteria
    - `selectedCategories`: Array of category names
    - `costRange`: { min, max }
    - `searchTerm`: String
  - `sortState`: Object containing sort configuration
    - `column`: Column name or null
    - `direction`: "asc" | "desc" | null
  - `filteredItems`: Computed property applying filters to lineItems
  - `sortedItems`: Computed property applying sort to filteredItems
  - `applyFilters()`: Applies current filter state
  - `applySort()`: Applies current sort state
  - `clearFilters()`: Resets all filters to defaults

### Hooks
- **useFilter**: Manages filter state and application
  - Returns filter controls, filteredItems, and filter functions
  - Handles debouncing for search
- **useSort**: Manages sort state and application
  - Returns sort handlers for column headers
  - Handles sort state cycling
- **useDebouncedSearch**: Debounces search input (300ms delay)
  - Prevents excessive filtering during typing
  - Returns debounced search term

### Services
- **FilterService.ts**: Filter logic implementation
  - `filterByCategory(items, categories)`: Category filtering
  - `filterByCostRange(items, min, max)`: Cost range filtering
  - `filterBySearch(items, searchTerm, searchFields)`: Text search
  - `combineFilters(items, filters)`: Apply multiple filters with AND logic
- **SortService.ts**: Sort logic implementation
  - `sortByColumn(items, column, direction)`: Generic column sorting
  - `numericSort(a, b, direction)`: Sort numeric values
  - `stringSort(a, b, direction)`: Sort string values (locale-aware)
  - `multiColumnSort(items, sortConfig)`: Secondary sort for tie-breaking

## Visual Diagrams

### Filter Panel Layout

```
BOM Panel with Filter Panel Expanded:

┌──────────────────────────────────────────────┐
│ Bill of Materials                            │
│ 12 items • 23 units      [↻][↓][≡][Filter●3]│ ← Filter button with badge
├──────────────────────────────────────────────┤
│ ╔══════════════════════════════════════════╗ │
│ ║ Search: [Trane_________] 🔍              ║ │ ← Filter Panel (expanded)
│ ║                                          ║ │
│ ║ Categories:                              ║ │
│ ║ ☐ Air Handling Units                    ║ │
│ ║ ☑ VAV Boxes                              ║ │
│ ║ ☐ Diffusers                              ║ │
│ ║ ☐ Grilles                                ║ │
│ ║                                          ║ │
│ ║ Cost Range: $500 ━━●━━━━━●━ $2000       ║ │
│ ║                                          ║ │
│ ║ Active: 3 filters │ [Clear Filters]     ║ │
│ ╚══════════════════════════════════════════╝ │
├──────────────────────────────────────────────┤
│ Showing 1 of 12 line items                   │ ← Status message
├──────────────────────────────────────────────┤
│ # │ Description │ Specs │ Qty │ Total Cost │ │ ← BOM Table (filtered)
├───┼─────────────┼───────┼─────┼────────────┤ │
│ 3 │ VAV - Trane │ 400-  │  5  │  $4,375.00 │ │
│   │    TZHS     │ 1200  │ ea  │            │ │
├───┴─────────────┴───────┴─────┴────────────┤ │
│ FILTERED TOTAL:                $4,375.00   │ │
└──────────────────────────────────────────────┘
```

### Search Filtering Flow

```
User Types in Search Box:

Keystroke Timeline:
0ms:   User types 'T'
       └─> searchTerm = "T"
       └─> Start 300ms debounce timer

50ms:  User types 'r'
       └─> searchTerm = "Tr"
       └─> Reset debounce timer (300ms from now)

100ms: User types 'a'
       └─> searchTerm = "Tra"
       └─> Reset debounce timer

150ms: User types 'n'
       └─> searchTerm = "Tran"
       └─> Reset debounce timer

200ms: User types 'e'
       └─> searchTerm = "Trane"
       └─> Reset debounce timer

500ms: (300ms after last keystroke)
       └─> Debounce timer expires
       └─> Apply search filter

Filter Application:
lineItems.filter(item => {
  const text = `${item.description} ${item.specifications}`.toLowerCase();
  return text.includes("trane");
})

Result: 1 item matches (VAV - Trane TZHS)

UI Update:
┌───────────────────────────────────────┐
│ Search: [Trane_________] 🔍 ×         │ ← Clear button appears
│                                       │
│ Results:                              │
│ ┌─────────────────────────────────┐   │
│ │ 3 │ VAV - Trane TZHS │ $4,375  │   │
│ │         └─┬─┘                   │   │
│ │     Highlighted match           │   │
│ └─────────────────────────────────┘   │
│                                       │
│ Showing 1 of 12 line items            │
└───────────────────────────────────────┘
```

### Multi-Column Sort Logic

```
User Sorts by "Total Cost" Descending:

Original Order (by Item #):
┌────┬─────────────────────┬────────────┐
│ 1  │ AHU - York MCA      │  $6,900.00 │
│ 2  │ AHU - Carrier 48TC  │  $5,200.00 │
│ 3  │ VAV - Trane TZHS    │  $4,375.00 │
│ 4  │ VAV - Price SC      │  $2,240.00 │
│ 5  │ Diffuser - 4-way    │  $1,000.00 │
│ 6  │ Diffuser - Linear   │    $720.00 │
│ 7  │ Grille - Return     │    $510.00 │
└────┴─────────────────────┴────────────┘

After Sort (by Total Cost, Descending):
┌────┬─────────────────────┬────────────┐
│ 1  │ AHU - York MCA      │  $6,900.00 │ ← Highest
│ 2  │ AHU - Carrier 48TC  │  $5,200.00 │
│ 3  │ VAV - Trane TZHS    │  $4,375.00 │
│ 4  │ VAV - Price SC      │  $2,240.00 │
│ 5  │ Diffuser - 4-way    │  $1,000.00 │
│ 6  │ Diffuser - Linear   │    $720.00 │
│ 7  │ Grille - Return     │    $510.00 │ ← Lowest
└────┴─────────────────────┴────────────┘

Sort Indicator in Header:
┌────┬─────────────┬──────────────┐
│ #  │ Description │ Total Cost ▼ │ ← Down arrow
└────┴─────────────┴──────────────┘

User Clicks Again (Ascending):
┌────┬─────────────────────┬────────────┐
│ 7  │ Grille - Return     │    $510.00 │ ← Lowest
│ 6  │ Diffuser - Linear   │    $720.00 │
│ 5  │ Diffuser - 4-way    │  $1,000.00 │
│ 4  │ VAV - Price SC      │  $2,240.00 │
│ 3  │ VAV - Trane TZHS    │  $4,375.00 │
│ 2  │ AHU - Carrier 48TC  │  $5,200.00 │
│ 1  │ AHU - York MCA      │  $6,900.00 │ ← Highest
└────┴─────────────────────┴────────────┘

Sort Indicator:
┌────┬─────────────┬──────────────┐
│ #  │ Description │ Total Cost ▲ │ ← Up arrow
└────┴─────────────┴──────────────┘

User Clicks Third Time (Clear Sort):
Returns to original order (by Item #)
No sort indicator shown
```

### Cost Range Slider Interaction

```
Cost Range Slider:

Initial State (Full Range):
Min: $0                                    Max: $10,000
 ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●
 0%                                          100%

User Drags Min Handle Right:
Min: $500                                  Max: $10,000
      ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●
      5%                                      100%

User Drags Max Handle Left:
Min: $500                  Max: $2,000
      ●━━━━━━━━━━━━━━━━●
      5%                 20%

Selected Range Highlighted:
$0   $500              $2,000              $10,000
 ░░░░ ████████████████ ░░░░░░░░░░░░░░░░░░░░░░
      └─ Selected ─┘
      Shows only items with cost in this range

Slider Value Display:
┌─────────────────────────────────────┐
│ Cost Range:                         │
│                                     │
│ Min: [$500   ] Max: [$2,000  ]     │
│                                     │
│ $0 ●━━━━━━━━●                $10,000│
│   $500   $2,000                     │
│                                     │
│ Items in range: 3 of 12             │
└─────────────────────────────────────┘
```

### Combined Filter Example

```
Multiple Filters Applied:

Filter State:
- Categories: [VAV Boxes, Diffusers] (2 selected)
- Cost Range: [$500, $5,000]
- Search: "Trane"

Step 1: Filter by Category
12 items → 8 items (VAV + Diffuser categories)

Step 2: Filter by Cost Range
8 items → 6 items (within $500-$5,000)

Step 3: Filter by Search
6 items → 1 item (contains "Trane")

Final Result:
┌────┬─────────────────────┬──────────────────┬─────┬────────────┐
│ 3  │ VAV - Trane TZHS    │ 400-1200 CFM     │  5  │  $4,375.00 │
└────┴─────────────────────┴──────────────────┴─────┴────────────┘

Filter Logic (AND combination):
lineItems
  .filter(item => ["VAV Boxes", "Diffusers"].includes(item.category))
  .filter(item => item.totalCost >= 500 && item.totalCost <= 5000)
  .filter(item => item.description.toLowerCase().includes("trane"))

Active Filters Display:
┌──────────────────────────────────────┐
│ Active Filters: 3                    │
│ • Categories: VAV Boxes, Diffusers   │
│ • Cost Range: $500 - $5,000          │
│ • Search: "Trane"                    │
│                                      │
│ [Clear All Filters]                  │
└──────────────────────────────────────┘

Status:
"Showing 1 of 12 line items"
```

## Testing

### Unit Tests

**Test Suite**: FilterService

1. **Test: Filter by single category**
   - Setup: 12 items across 5 categories
   - Action: filterByCategory(items, ["Diffusers"])
   - Assert: Returns only 2 diffuser items

2. **Test: Filter by multiple categories**
   - Setup: 12 items
   - Action: filterByCategory(items, ["VAV Boxes", "Diffusers"])
   - Assert: Returns 6 items (4 VAV + 2 Diffusers)

3. **Test: Filter by cost range**
   - Setup: Items with costs: $500, $1000, $2000, $5000
   - Action: filterByCostRange(items, 800, 2500)
   - Assert: Returns 2 items ($1000, $2000)

4. **Test: Search filter case-insensitive**
   - Setup: Item with description "Trane TZHS"
   - Action: filterBySearch(items, "trane")
   - Assert: Item found (case-insensitive match)

5. **Test: Search filter partial match**
   - Setup: Item "VAV - Trane TZHS"
   - Action: filterBySearch(items, "TZ")
   - Assert: Item found (substring match)

6. **Test: Combine multiple filters (AND logic)**
   - Setup: 12 items
   - Filters: Category=Diffusers, Cost=$500-$2000, Search="4-way"
   - Action: combineFilters(items, filters)
   - Assert: Returns only items matching ALL criteria

7. **Test: Zero results from filters**
   - Setup: No items in cost range $10,000-$15,000
   - Action: filterByCostRange(items, 10000, 15000)
   - Assert: Returns empty array []

**Test Suite**: SortService

1. **Test: Sort by numeric column ascending**
   - Setup: Items with costs: $1000, $500, $2000
   - Action: sortByColumn(items, "totalCost", "asc")
   - Assert: Order: $500, $1000, $2000

2. **Test: Sort by numeric column descending**
   - Action: sortByColumn(items, "totalCost", "desc")
   - Assert: Order: $2000, $1000, $500

3. **Test: Sort by text column alphabetically**
   - Setup: Items: "VAV", "AHU", "Diffuser"
   - Action: sortByColumn(items, "description", "asc")
   - Assert: Order: "AHU", "Diffuser", "VAV"

4. **Test: Sort maintains filtered results**
   - Setup: 3 filtered items
   - Action: Sort descending by cost
   - Assert: Only 3 items sorted (not full 12)

### Integration Tests

**Test Suite**: Filter and Sort Workflow

1. **Test: Apply category filter updates table**
   - Setup: BOM with 12 items
   - Action: Select only "Diffusers" category
   - Assert: Table shows 2 items
   - Assert: Grand total reflects filtered items only
   - Assert: Filter badge shows "1"

2. **Test: Search updates filtered results**
   - Setup: No filters active
   - Action: Type "Trane" in search box
   - Wait 300ms (debounce)
   - Assert: Table shows only items with "Trane"
   - Assert: Search term highlighted in results

3. **Test: Sort applies to filtered results**
   - Setup: Category filter active (3 items visible)
   - Action: Click "Total Cost" header
   - Assert: 3 filtered items sort by cost
   - Assert: Excluded items remain hidden

4. **Test: Clear filters restores full BOM**
   - Setup: Multiple filters active (3 items visible)
   - Action: Click "Clear Filters"
   - Assert: All 12 items visible
   - Assert: Grand total matches original
   - Assert: Filter badge shows "0"

5. **Test: Debounce prevents rapid filter updates**
   - Setup: User typing in search box
   - Action: Type "T", "r", "a", "n", "e" rapidly (<300ms total)
   - Assert: Filter applied only once after 300ms
   - Assert: Not 5 separate filter operations

### End-to-End Tests

**Test Suite**: User Filter/Sort Workflow

1. **Test: User filters by category**
   - Setup: BOM panel open with 12 items
   - Action: User clicks Filter button
   - Assert: Filter panel expands
   - Action: User unchecks all except "Diffusers"
   - Assert: Table updates to show 2 diffuser items
   - Assert: Total updates to diffuser subtotal
   - Assert: Filter badge shows "1"

2. **Test: User searches for specific equipment**
   - Action: User types "Trane" in search box
   - Assert: After 300ms, table filters to Trane items
   - Assert: "Trane" highlighted in results
   - Assert: Status shows "Showing 1 of 12 items"

3. **Test: User sorts by cost (high to low)**
   - Action: User clicks "Total Cost" header
   - Assert: Items reorder highest to lowest cost
   - Assert: Down arrow appears in header
   - Action: User clicks header again
   - Assert: Items reverse (lowest to highest)
   - Assert: Up arrow appears

4. **Test: User clears all filters**
   - Setup: Category, cost, and search filters active
   - Action: User clicks "Clear Filters" button
   - Assert: All checkboxes reset to checked
   - Assert: Cost sliders reset to full range
   - Assert: Search box clears
   - Assert: All 12 items visible
   - Assert: Badge shows "0"

5. **Test: Filter results in zero items**
   - Action: User sets cost range $9,000-$10,000 (no items)
   - Assert: Table shows empty state
   - Assert: Message: "No items match current filters"
   - Assert: "Clear Filters" button available

## Common Pitfalls

### Pitfall 1: Not Debouncing Search Input

**Problem**: Search filter applied on every keystroke, causing excessive filter recalculations.

**Symptom**: Typing "Trane" triggers 5 separate filter operations, causing UI lag.

**Solution**: Debounce search with 300ms delay. Filter applied only after user stops typing for 300ms. Reduces filter calls by 80% during search.

### Pitfall 2: Incorrect Filter Combination Logic

**Problem**: Filters combined with OR instead of AND, showing too many results.

**Symptom**: User selects "Diffusers" category AND searches "Trane", but sees all diffusers OR all Trane items.

**Solution**: Implement AND logic correctly. Item must satisfy ALL active filters to be visible. Use chained .filter() calls or single filter function checking all conditions with &&.

### Pitfall 3: Not Applying Sort to Filtered Results

**Problem**: Sort applied to full lineItems array instead of filteredItems.

**Symptom**: Sorting reveals previously filtered items, breaking filter state.

**Solution**: Always sort the filteredItems array, not the original lineItems. Chain operations: filter THEN sort. Maintain separate filtered and sorted arrays.

### Pitfall 4: Forgetting to Update Totals After Filter

**Problem**: Grand total shows original BOM total even after filtering.

**Symptom**: Filtered to 2 items ($1,500 total) but grand total still shows $19,560 (full BOM).

**Solution**: Recalculate totals from filtered results only. Grand total = sum of visible line items. Display "FILTERED TOTAL" label to clarify.

### Pitfall 5: Slider Values Not Matching Filter Range

**Problem**: Slider position doesn't accurately represent selected cost range.

**Symptom**: Slider at 50% position but filter shows $2,000 instead of $5,000 (50% of $10,000).

**Solution**: Accurately convert slider percentage to cost value. cost = minCost + (percentage * (maxCost - minCost)). Display calculated value next to slider for verification.

## Performance Tips

### Tip 1: Memoize Filtered Results

Refiltering on every render is wasteful:

**Implementation**: Use useMemo to cache filtered results based on lineItems and filter state. Recalculate only when dependencies change.

**Benefit**: Eliminates redundant filtering during re-renders. 50% reduction in filter calls.

### Tip 2: Virtual Scrolling for Filtered Results

Large filtered results (100+ items) still need efficient rendering:

**Implementation**: Apply virtual scrolling to filtered table. Render only visible rows regardless of filter state.

**Benefit**: Maintains performance with large filtered results.

### Tip 3: Optimize Search with Index

Linear search through all items on every keystroke is slow:

**Implementation**: Build search index (inverted index mapping terms to items). Query index instead of full text search.

**Benefit**: Search time reduced from O(n) to O(1) for indexed terms.

### Tip 4: Parallel Filter Application

Filters currently applied sequentially (category, then cost, then search):

**Implementation**: Check all filter conditions in single pass. Single loop evaluates all criteria at once.

**Benefit**: Reduces iterations from 3N to N (3x speedup for large BOMs).

### Tip 5: Lazy Load Filter Options

Loading all filter options (manufacturers, models) upfront is expensive:

**Implementation**: Load filter options on-demand when filter panel opens. Use lazy loading for dropdown lists.

**Benefit**: Faster initial BOM panel load. Options load only when needed.

## Future Enhancements

### Enhancement 1: Saved Filter Presets

**Description**: Save commonly-used filter combinations as named presets for quick access.

**User Value**: Quickly apply standard views (e.g., "High Cost Items", "Diffusers Only", "Trane Equipment").

**Implementation**:
- "Save Current Filters" button in filter panel
- Name preset and store in user preferences
- Preset dropdown in filter panel for quick selection
- Edit/delete saved presets
- Share presets with team members

### Enhancement 2: Advanced Search with Operators

**Description**: Support search operators like AND, OR, NOT, exact match, wildcards.

**User Value**: More precise search queries (e.g., "Trane OR Carrier", "VAV NOT Trane").

**Implementation**:
- Parse search query for operators
- Tokenize and build search AST
- Evaluate complex queries against items
- Autocomplete suggestions for operators
- Syntax help tooltip

### Enhancement 3: Filter by Custom Properties

**Description**: Filter by user-defined entity properties (tags, zones, install phase).

**User Value**: Organize BOM by project-specific criteria beyond standard categories.

**Implementation**:
- Detect custom properties on entities
- Dynamically generate filter controls
- Multi-select dropdown for custom property values
- "Add Custom Filter" button
- Filter persistence with project

### Enhancement 4: Bulk Actions on Filtered Items

**Description**: Apply actions to all filtered items (adjust costs, assign tags, export subset).

**User Value**: Perform operations on specific equipment groups efficiently.

**Implementation**:
- "Actions" dropdown appearing when filters active
- Options: Adjust Cost by %, Export Filtered, Tag All, Delete All
- Confirmation dialog showing affected items
- Undo support for bulk operations

### Enhancement 5: Filter History and Undo

**Description**: Navigate backward/forward through filter states like browser history.

**User Value**: Easily return to previous filter configurations without reapplying manually.

**Implementation**:
- Track filter state changes in history stack
- Back/Forward buttons in filter panel
- Keyboard shortcuts: Alt+Left/Right
- History dropdown showing recent filters
- Limit to 20 historical states

### Enhancement 6: Visual Filter Builder

**Description**: Drag-and-drop interface for building complex filter expressions.

**User Value**: Easier creation of complex filters without learning syntax.

**Implementation**:
- Visual blocks for each filter criterion
- Drag to add/remove/reorder conditions
- AND/OR logic toggles between blocks
- Preview filtered results in real-time
- Export filter as shareable link

### Enhancement 7: Smart Filter Suggestions

**Description**: AI-powered filter suggestions based on user behavior and project patterns.

**User Value**: Discover useful filter combinations automatically.

**Implementation**:
- Track frequently-used filter combinations
- Analyze project for common groupings
- Suggest filters: "View high-cost items (>$2000)"
- One-click apply suggested filters
- Learn from user acceptance/rejection

### Enhancement 8: Multi-Level Grouping

**Description**: Group BOM by primary and secondary criteria (e.g., Category > Manufacturer > Model).

**User Value**: Hierarchical organization for complex BOMs with nested subtotals.

**Implementation**:
- "Group By" controls with primary/secondary/tertiary levels
- Collapsible group headers in table
- Subtotals at each grouping level
- Expand/collapse all groups button
- Remember expansion state per group

### Enhancement 9: Filter Templates by Project Type

**Description**: Pre-built filter sets for common HVAC project types (commercial, residential, industrial).

**User Value**: Quick setup of relevant filters based on project type.

**Implementation**:
- Template library in filter panel
- Templates: "Commercial Office", "Residential HVAC", "Industrial Warehouse"
- Each template has predefined categories, cost ranges, common equipment
- Customize and save as new template
- Share templates with team

### Enhancement 10: Export Filtered View

**Description**: Export current filtered/sorted BOM view as CSV/Excel/PDF.

**User Value**: Generate reports showing specific subsets of BOM.

**Implementation**:
- "Export Filtered" option in export dropdown
- Include filter criteria in export header
- Export maintains current sort order
- PDF includes filter summary section
- "Filtered Export" watermark for clarity
