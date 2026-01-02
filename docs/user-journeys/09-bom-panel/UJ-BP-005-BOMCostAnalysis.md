# UJ-BP-005: BOM Cost Analysis

## Overview

This user journey describes how users analyze BOM costs through visualizations, breakdowns by category, cost variance tracking, and budget comparisons. Cost analysis features help users understand project expenses, identify cost-saving opportunities, and make informed decisions about equipment selections and budget allocation.

## PRD References

- **FR-BOM-013**: Cost breakdown visualization by category
- **FR-BOM-014**: Budget tracking and variance analysis
- **FR-BOM-015**: Cost trend analysis and historical comparison
- **US-BOM-005**: As a user, I want to analyze BOM costs so that I can understand spending distribution and stay within budget
- **AC-BOM-005-01**: Cost breakdown chart shows spending by category (pie/bar chart)
- **AC-BOM-005-02**: Budget comparison shows actual vs. budgeted costs with variance
- **AC-BOM-005-03**: Cost trends visualize changes over project timeline
- **AC-BOM-005-04**: Export cost analysis reports (PDF, Excel)
- **AC-BOM-005-05**: Drill-down from chart to detailed line items
- **AC-BOM-005-06**: Cost alerts when exceeding budget thresholds

## Prerequisites

- User has BOM panel open with calculated line items
- Project contains equipment with costs (non-zero BOM total)
- Optional: Budget defined for project or categories
- Understanding of basic cost analysis concepts

## User Journey Steps

### Step 1: Access Cost Analysis View

**User Actions**:
1. User wants to understand cost distribution across equipment categories
2. User clicks "Analysis" tab or button in BOM panel header
3. Alternatively, selects "View > Cost Analysis" from menu
4. Cost analysis panel opens showing visualizations

**System Response**:
- Cost Analysis panel slides in or expands (replaces or overlays BOM table)
- Display cost breakdown visualizations:
  - Pie chart: Category cost distribution
  - Bar chart: Category costs ranked high to low
  - Summary cards: Total cost, item count, average cost per item
- Load budget data (if configured)
- Calculate cost statistics and metrics
- Render interactive charts with hover tooltips

**Validation**:
- BOM data available and valid (non-empty)
- Cost calculations complete
- Charts render correctly with proper scaling
- Interactive features (hover, click) functional

**Data**:

```
BOM Cost Summary:
- Total Cost: $19,560.00
- Total Items: 12 line items
- Total Units: 23 units
- Average Cost per Item: $1,630.00
- Average Cost per Unit: $850.43

Category Breakdown:
1. Air Handling Units: $12,100.00 (61.9%)
2. VAV Boxes: $6,615.00 (33.8%)
3. Diffusers: $1,720.00 (8.8%)
4. Grilles: $510.00 (2.6%)
5. Dampers: $0.00 (0% - none in project)

Budget (if configured):
- Budgeted Total: $22,000.00
- Actual Total: $19,560.00
- Variance: -$2,440.00 (11.1% under budget) ✓
- Status: Within budget

Cost Analysis Panel Layout:
┌──────────────────────────────────────────────────────┐
│ Cost Analysis                         [Table View ↶] │ ← Toggle back to table
├──────────────────────────────────────────────────────┤
│ ┌────────────┬────────────┬────────────┬──────────┐ │
│ │ Total Cost │ Items      │ Avg/Item   │ Budget   │ │ ← Summary cards
│ │ $19,560    │ 12         │ $1,630     │ 89% used │ │
│ └────────────┴────────────┴────────────┴──────────┘ │
│                                                      │
│ ┌──────────────────┐  ┌──────────────────────────┐ │
│ │   Pie Chart      │  │   Bar Chart              │ │
│ │   (Category %)   │  │   (Category $)           │ │
│ │                  │  │                          │ │
│ │     [Chart]      │  │     [Chart]              │ │
│ │                  │  │                          │ │
│ └──────────────────┘  └──────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ Budget Comparison                              │ │
│ │ [Progress bar visualization]                   │ │
│ └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

**Substeps**:
1. User clicks "Analysis" button/tab
2. BOMStore.calculateCostAnalysis() invoked
3. Aggregate costs by category
4. Calculate summary statistics
5. Retrieve budget data (if exists)
6. Calculate variances and percentages
7. Render Cost Analysis panel
8. Initialize chart libraries (Chart.js, D3, etc.)
9. Render pie chart with category percentages
10. Render bar chart with category amounts
11. Render summary cards with key metrics
12. If budget exists, render budget comparison

### Step 2: Explore Cost Breakdown Charts

**User Actions**:
1. User reviews pie chart showing category distribution
2. User hovers over pie slice (e.g., "Air Handling Units")
3. Tooltip appears with details: "Air Handling Units: $12,100 (61.9%)"
4. User clicks on pie slice
5. Drills down to see detailed line items in that category

**System Response**:
- Pie chart segments sized proportionally to costs
- Color-coded by category (consistent colors throughout UI)
- Hover interaction:
  - Highlight hovered segment (enlarge slightly, brighten)
  - Show tooltip with category name, amount, percentage
- Click interaction:
  - Filter BOM table to show only selected category
  - Update other charts to reflect filtered view
  - Show "Viewing: Air Handling Units (2 items)" indicator
  - Provide "Clear Filter" button to return to full view
- Bar chart similarly interactive (hover/click)

**Validation**:
- Chart data matches BOM totals (no discrepancies)
- Percentages sum to 100%
- Colors distinct and accessible (colorblind-safe palette)
- Interactions smooth and responsive

**Data**:

```
Pie Chart Data:
[
  { category: "Air Handling Units", amount: 12100, percent: 61.9, color: "#1976D2" },
  { category: "VAV Boxes", amount: 6615, percent: 33.8, color: "#388E3C" },
  { category: "Diffusers", amount: 1720, percent: 8.8, color: "#F57C00" },
  { category: "Grilles", amount: 510, percent: 2.6, color: "#7B1FA2" }
]

Pie Chart Rendering:
       AHUs (61.9%)
      ╱────────────╲
     ╱              ╲
    │      Blue      │
    │   $12,100      │
     ╲              ╱
      ╲────────────╱
         ╲       ╱
      VAVs ╲   ╱ Diffusers
      (33.8%) ╲╱ (8.8%)
        Green  Orange

Hover Tooltip (on AHU segment):
┌─────────────────────────────┐
│ Air Handling Units          │
│ $12,100.00 (61.9%)          │
│ 2 items, 3 units            │
│                             │
│ Click to view details →     │
└─────────────────────────────┘

Bar Chart Data (sorted by amount, descending):
┌──────────────────────────────────────┐
│ Air Handling Units  ████████████████ │ $12,100
│ VAV Boxes          ████████          │ $6,615
│ Diffusers          ██                │ $1,720
│ Grilles            ▌                 │ $510
└──────────────────────────────────────┘
  0                               $15,000

Click Interaction (User clicks AHU):
- Set filter: category = "Air Handling Units"
- Update BOM table to show only AHU items (2 items)
- Update other charts to highlight AHU segment
- Show filter indicator banner:
  ┌────────────────────────────────────┐
  │ ⓘ Viewing: Air Handling Units     │
  │   2 items • $12,100 total          │
  │   [✕ Clear Filter]                 │
  └────────────────────────────────────┘
```

**Substeps**:
1. User hovers mouse over pie chart segment
2. Segment highlight animation (scale 1.0 → 1.05)
3. Tooltip appears at cursor position
4. Tooltip displays category details
5. User moves away, tooltip disappears
6. User clicks segment
7. Set category filter in BOMStore
8. Filter BOM line items by category
9. Update table view (if visible)
10. Update all charts to reflect filter
11. Show filter indicator banner
12. Provide clear filter action

### Step 3: Compare Actual vs. Budget

**User Actions**:
1. User has defined project budget: $22,000
2. User scrolls to Budget Comparison section in analysis panel
3. Reviews budget progress bar showing 89% used
4. Examines category-level budget variances
5. Identifies categories over/under budget

**System Response**:
- Display overall budget comparison:
  - Progress bar: 0% to 100% (or beyond if over budget)
  - Current spending: $19,560 of $22,000 (89%)
  - Remaining budget: $2,440 (11%)
  - Color coding: Green (under budget), Yellow (90-100%), Red (over budget)
- Display per-category budget comparison:
  - Table with columns: Category, Budgeted, Actual, Variance, %
  - Sort by variance (largest over/under first)
  - Highlight rows over budget in red
- Show budget alerts if thresholds exceeded
- Calculate projected total if trends continue

**Validation**:
- Budget data exists and is valid
- Actual costs sum correctly
- Variances calculated accurately (budgeted - actual)
- Percentages relative to budgeted amounts

**Data**:

```
Budget Configuration:
{
  projectBudget: 22000.00,
  categoryBudgets: {
    "Air Handling Units": 13000.00,
    "VAV Boxes": 7000.00,
    "Diffusers": 1500.00,
    "Grilles": 500.00
  }
}

Budget Comparison Summary:
- Project Budget: $22,000.00
- Actual Cost: $19,560.00
- Variance: -$2,440.00 (under budget) ✓
- Percent Used: 88.9%
- Remaining: $2,440.00

Budget Progress Bar:
┌─────────────────────────────────────────────────┐
│ Project Budget:                    $19,560      │
│ ████████████████████▓▓▓▓                        │ 89%
│ 0                   $19,560     $22,000         │
│ └─ Actual (Green)   └─ Remaining (Light Gray)  │
└─────────────────────────────────────────────────┘

Category Budget Comparison Table:
┌────────────────────┬──────────┬──────────┬──────────┬────────┬────────┐
│ Category           │ Budgeted │ Actual   │ Variance │ % Used │ Status │
├────────────────────┼──────────┼──────────┼──────────┼────────┼────────┤
│ Air Handling Units │ $13,000  │ $12,100  │  -$900   │  93.1% │   ✓    │ ← Under
│ VAV Boxes          │  $7,000  │  $6,615  │  -$385   │  94.5% │   ✓    │
│ Diffusers          │  $1,500  │  $1,720  │  +$220   │ 114.7% │   ⚠    │ ← Over!
│ Grilles            │    $500  │    $510  │   +$10   │ 102.0% │   ⚠    │
├────────────────────┼──────────┼──────────┼──────────┼────────┼────────┤
│ TOTAL              │ $22,000  │ $19,560  │ -$2,440  │  88.9% │   ✓    │
└────────────────────┴──────────┴──────────┴──────────┴────────┴────────┘

Status Indicators:
- ✓ (Green checkmark): Under budget or within 5%
- ⚠ (Yellow warning): Over budget

Budget Alert (if over budget):
┌────────────────────────────────────────────┐
│ ⚠ Budget Alert                             │
│ Diffusers category is 14.7% over budget   │
│ ($1,720 actual vs. $1,500 budgeted)       │
│                                            │
│ [View Details]  [Adjust Budget]  [Dismiss]│
└────────────────────────────────────────────┘
```

**Substeps**:
1. Retrieve budget data from project settings
2. Calculate actual costs by category (already done)
3. For each category:
   - Compare actual to budgeted
   - Calculate variance (budgeted - actual)
   - Calculate percent used (actual / budgeted)
4. Determine status based on variance
5. Render overall budget progress bar
6. Render category comparison table
7. Sort table by variance or percent used
8. Highlight over-budget categories
9. Check for budget threshold alerts
10. Display alerts if thresholds exceeded

### Step 4: Analyze Cost Trends Over Time

**User Actions**:
1. User wants to see how costs evolved throughout project
2. User clicks "Cost Trends" tab in analysis panel
3. Reviews line chart showing cost changes by date
4. Identifies cost spikes or reductions
5. Correlates changes with edit history events

**System Response**:
- Display cost trend line chart:
  - X-axis: Timeline (dates)
  - Y-axis: Total cost ($)
  - Line graph showing cost progression
  - Data points at each BOM edit event
- Mark significant events on timeline:
  - Entity additions (cost increases)
  - Manual cost overrides (adjustments)
  - Bulk edits (large changes)
- Show trend statistics:
  - Initial cost (first BOM calculation)
  - Current cost
  - Peak cost (highest point)
  - Cost reduction events
- Allow date range filtering (last week, month, all time)

**Validation**:
- Edit history data available
- Timeline data sorted chronologically
- Cost values accurate at each point in time
- Chart scales appropriately for data range

**Data**:

```
Cost History Timeline:
[
  { date: "2025-12-20", cost: 18000, event: "Initial BOM" },
  { date: "2025-12-22", cost: 19500, event: "+3 diffusers added" },
  { date: "2025-12-25", cost: 20400, event: "+2 VAV boxes added" },
  { date: "2025-12-27", cost: 19560, event: "AHU cost override (-$840)" },
  { date: "2025-12-29", cost: 19685, event: "VAV quantity +1, cost override" }
]

Cost Trend Chart:
$20,500 │                    ●
        │                   ╱ ╲
$20,000 │                  ╱   ╲
        │                 ╱     ╲
$19,500 │           ●────╯       ●───●
        │          ╱
$19,000 │         ╱
        │        ╱
$18,500 │       ╱
        │      ╱
$18,000 │●────╯
        └──────┬────┬────┬────┬────┬──
             12/20 12/22 12/25 12/27 12/29

Event Markers:
● Initial BOM ($18,000)
● +3 diffusers ($19,500)
● +2 VAV boxes ($20,400) ← Peak
● AHU override ($19,560) ← Cost reduction
● Current ($19,685)

Trend Statistics:
- Starting Cost: $18,000.00
- Current Cost: $19,685.00
- Peak Cost: $20,400.00 (2025-12-25)
- Total Change: +$1,685.00 (+9.4%)
- Largest Increase: +$1,500 (12/22, diffusers)
- Largest Decrease: -$840 (12/27, AHU override)

Date Range Filter:
( ) Last 7 days
( ) Last 30 days
(●) All time
( ) Custom range
```

**Substeps**:
1. Retrieve BOM edit history from HistoryStore
2. Extract cost values at each historical point
3. Sort events chronologically
4. Calculate cost at each timestamp
5. Prepare chart data (date, cost pairs)
6. Identify significant events (large changes)
7. Render line chart with timeline
8. Add event markers and labels
9. Calculate trend statistics
10. Display statistics summary
11. Provide date range filter controls

### Step 5: Export Cost Analysis Report

**User Actions**:
1. User wants to share cost analysis with stakeholders
2. User clicks "Export Report" button in analysis panel
3. Selects report format: PDF or Excel
4. Configures report options (include charts, budget comparison, etc.)
5. Exports report file

**System Response**:
- Open export dialog with format options:
  - PDF: Professional report with charts and tables
  - Excel: Data tables with embedded charts
- Report configuration options:
  - Include summary cards
  - Include cost breakdown charts (pie, bar)
  - Include budget comparison table
  - Include cost trend chart
  - Include detailed line items
- Generate report with selected content:
  - Header: Project name, date, exported by
  - Sections: Summary, Breakdown, Budget, Trends, Details
  - Charts rendered as images (PNG) or vector (SVG)
  - Professional formatting and branding
- Trigger download with filename: "Cost_Analysis_ProjectName_Date.pdf"
- Success notification shown

**Validation**:
- Report generation completes successfully
- All selected sections included
- Charts render correctly in export
- File downloads to user's system
- Report opens correctly in target application

**Data**:

```
Export Configuration:
{
  format: "pdf",
  includeOptions: {
    summary: true,
    costBreakdown: true,
    budgetComparison: true,
    costTrends: true,
    detailedLineItems: false
  }
}

PDF Report Structure:

Page 1: Cover & Summary
┌─────────────────────────────────────────┐
│ COST ANALYSIS REPORT                    │
│ Commercial Office HVAC                  │
│ December 29, 2025                       │
│                                         │
│ Summary:                                │
│ • Total Cost: $19,560                   │
│ • Items: 12                             │
│ • Budget Status: 89% used (✓)          │
│ • Variance: -$2,440 under budget        │
└─────────────────────────────────────────┘

Page 2: Cost Breakdown
┌─────────────────────────────────────────┐
│ Cost Distribution by Category           │
│                                         │
│ [Pie Chart Image]  [Bar Chart Image]   │
│                                         │
│ Breakdown Table:                        │
│ Air Handling Units:    $12,100 (61.9%) │
│ VAV Boxes:             $6,615 (33.8%)  │
│ Diffusers:             $1,720 (8.8%)   │
│ Grilles:               $510 (2.6%)     │
└─────────────────────────────────────────┘

Page 3: Budget Comparison
┌─────────────────────────────────────────┐
│ Budget vs. Actual                       │
│                                         │
│ [Budget Progress Bar Image]            │
│                                         │
│ Category Comparison:                    │
│ [Table with variance data]             │
└─────────────────────────────────────────┘

Page 4: Cost Trends
┌─────────────────────────────────────────┐
│ Cost Evolution Timeline                 │
│                                         │
│ [Line Chart Image]                     │
│                                         │
│ Key Events:                             │
│ • 12/20: Initial BOM ($18,000)         │
│ • 12/25: Peak cost ($20,400)           │
│ • 12/27: Cost reduction (-$840)        │
└─────────────────────────────────────────┘

Footer (all pages):
┌─────────────────────────────────────────┐
│ Exported by: John Smith                │
│ Export Date: 2025-12-29 19:45:12       │
│                            Page N of M  │
└─────────────────────────────────────────┘

Filename: "Cost_Analysis_Commercial_Office_HVAC_2025-12-29.pdf"
File Size: ~150 KB (with images)
```

**Substeps**:
1. User clicks "Export Report" button
2. Export dialog opens
3. User selects format (PDF)
4. User configures report sections
5. Click "Generate Report"
6. Initialize PDF document (jsPDF/pdfmake)
7. Add cover page with project info
8. For each selected section:
   - Render charts to images
   - Add section header
   - Insert chart images
   - Add supporting tables/text
9. Add footer with metadata
10. Generate PDF buffer
11. Trigger download
12. Show success notification
13. Close export dialog

## Edge Cases

### Edge Case 1: No Budget Defined

**Scenario**: User accesses cost analysis but no project budget configured.

**Expected Behavior**:
- Budget comparison section shows message: "No budget defined for this project"
- "Set Budget" button provided
- Clicking opens budget configuration dialog
- Other analysis sections (breakdown, trends) work normally
- Budget comparison charts/tables hidden or grayed out

**Handling**:
- Check for budget data on analysis load
- If null/undefined, show placeholder UI
- Provide call-to-action to define budget
- Partial analysis still useful without budget

### Edge Case 2: Single Category BOM

**Scenario**: BOM contains only one category (e.g., only diffusers, no AHUs or VAVs).

**Expected Behavior**:
- Pie chart shows 100% single slice (not very informative)
- Bar chart shows single bar at 100%
- Alternative view suggested: "Show by manufacturer" or "Show by model"
- Analysis still provides total cost and item count
- Budget comparison works normally

**Handling**:
- Detect single-category scenario
- Suggest alternative breakdown dimensions
- Provide different visualizations (manufacturer, model, cost range)

### Edge Case 3: Cost Trend with No History

**Scenario**: New project, BOM just created, no edit history yet.

**Expected Behavior**:
- Cost trend chart shows single data point (current cost)
- Message: "Cost history will appear as project evolves"
- Placeholder timeline with current cost marked
- Trend statistics show only current values
- Section remains accessible (not hidden)

**Handling**:
- Render chart with single point
- Provide helpful message about future data
- Ensure UI doesn't break with minimal data

### Edge Case 4: Extremely High Cost Variance

**Scenario**: Actual cost drastically exceeds budget (e.g., 200% over budget).

**Expected Behavior**:
- Progress bar extends beyond 100%, clearly showing over-budget
- Status changes to red "OVER BUDGET" alert
- Variance highlighted prominently: "+$20,000 over budget (200%)"
- Alert notification with suggested actions
- Report generation includes over-budget warning

**Handling**:
- Progress bar allows >100% display (e.g., red section beyond bar)
- Alert thresholds: Yellow at 90%, Red at 100%+
- Provide recommendations: "Review high-cost categories" or "Adjust budget"

### Edge Case 5: Export with Large Number of Line Items

**Scenario**: BOM has 500+ line items, detailed report export requested.

**Expected Behavior**:
- Export process shows progress indicator
- PDF paginated properly (50-100 items per page)
- Charts summarize categories (not individual items)
- Option to export summary only (exclude detailed line items)
- File size warning if >5 MB

**Handling**:
- Chunk export generation for large data sets
- Summarize where possible
- Provide export size estimate
- Allow summary-only export option

## Error Scenarios

### Error 1: Chart Rendering Failure

**Scenario**: Chart library fails to load or render (e.g., Chart.js error).

**Error Message**: "Unable to display chart. Showing data table instead."

**Recovery**:
1. Catch chart rendering exception
2. Fall back to tabular data display
3. Show error notification
4. Log error for debugging
5. Provide "Retry" button to reload chart
6. Data remains accessible in table format

### Error 2: Budget Data Corruption

**Scenario**: Budget values are corrupted (negative, NaN, or invalid).

**Error Message**: "Budget data is invalid. Please reconfigure project budget."

**Recovery**:
1. Validate budget values on load
2. Detect invalid data (NaN, negative, null)
3. Display error message
4. Hide budget comparison section
5. Offer "Reconfigure Budget" action
6. Log error with details
7. Other analysis sections remain functional

### Error 3: Export Generation Timeout

**Scenario**: Large report export takes >30 seconds, times out.

**Error Message**: "Report generation timed out. Try exporting a smaller date range."

**Recovery**:
1. Set 30s timeout on export generation
2. If timeout, cancel operation
3. Show error notification with suggestion
4. Offer reduced export options (summary only, date range)
5. User can retry with smaller scope
6. Log timeout for performance analysis

## Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Shift+A` | Toggle Cost Analysis View | BOM panel visible |
| `Ctrl+Shift+E` | Export Cost Analysis Report | Analysis view open |
| `Esc` | Close Analysis, Return to BOM Table | Analysis view open |
| `←/→` | Navigate Analysis Tabs | Analysis view focused |
| `C` | Toggle Chart Type (Pie ↔ Bar) | Chart focused |

## Related Elements

### Components
- **CostAnalysisPanel.tsx**: Main analysis container
- **CostBreakdownChart.tsx**: Pie/bar chart for category distribution
- **BudgetComparisonView.tsx**: Budget vs actual visualization
- **CostTrendChart.tsx**: Timeline cost evolution chart
- **AnalysisSummaryCards.tsx**: Key metrics display
- **ReportExportDialog.tsx**: Export configuration dialog

### Stores
- **BOMStore**: Extended with analysis capabilities
  - `costAnalysis`: Computed analysis data
  - `calculateCostAnalysis()`: Generate analysis metrics
  - `getCategoryBreakdown()`: Cost distribution by category
  - `getBudgetComparison()`: Budget vs actual data
  - `getCostHistory()`: Historical cost data points
- **BudgetStore**: Budget management
  - `projectBudget`: Overall project budget
  - `categoryBudgets`: Per-category budget allocations
  - `setBudget(amount)`: Configure budget
  - `updateCategoryBudget(category, amount)`: Adjust category budget

### Hooks
- **useCostAnalysis**: Analysis data and calculations
  - Returns breakdown, budget comparison, trends
  - Memoizes expensive calculations
- **useBudgetComparison**: Budget vs actual metrics
  - Calculates variances and percentages
  - Determines status (under/over budget)
- **useCostTrends**: Historical cost data
  - Retrieves edit history
  - Calculates cost at each point in time
  - Returns timeline data for charting

### Services
- **CostAnalyzer.ts**: Analysis calculation logic
  - `calculateBreakdown(items)`: Category distribution
  - `calculateBudgetVariance(actual, budgeted)`: Variance metrics
  - `analyzeTrends(history)`: Trend statistics
- **ChartGenerator.ts**: Chart configuration and rendering
  - `generatePieChart(data)`: Pie chart config
  - `generateBarChart(data)`: Bar chart config
  - `generateLineChart(data)`: Line chart config
  - Uses Chart.js or similar library
- **ReportGenerator.ts**: Analysis report export
  - `generatePDFReport(analysis, options)`: PDF generation
  - `generateExcelReport(analysis, options)`: Excel generation
  - `renderChartImage(chart)`: Chart to image conversion

## Visual Diagrams

### Cost Analysis Panel Layout

```
Cost Analysis View:

┌────────────────────────────────────────────────────────────┐
│ Cost Analysis                   [Table View ↶] [Export]    │
├────────────────────────────────────────────────────────────┤
│ ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│ │  Total   │  Items   │ Avg/Item │ Budget   │ Variance │  │ ← Summary Cards
│ │ $19,560  │    12    │  $1,630  │ 89% used │  -$2,440 │  │
│ │  ↑ 9.4%  │          │          │    ✓     │  (under) │  │
│ └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│                                                            │
│ ┌─────────────────────────┬──────────────────────────────┐│
│ │ Cost Distribution       │ Category Comparison          ││
│ │                         │                              ││
│ │   ┌─────────────┐       │ ┌─────────────────────────┐ ││
│ │   │ Pie Chart   │       │ │  Bar Chart              │ ││
│ │   │   AHU       │       │ │                         │ ││
│ │   │   62%       │       │ │ AHU  ████████████ 12K   │ ││
│ │   │    ●        │       │ │ VAV  ██████       6.6K  │ ││
│ │   │  ╱   ╲      │       │ │ Diff ██            1.7K │ ││
│ │   │●       ●    │       │ │ Grll ▌             510  │ ││
│ │   └─────────────┘       │ └─────────────────────────┘ ││
│ └─────────────────────────┴──────────────────────────────┘│
│                                                            │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Budget Comparison                                    │  │
│ │ ┌──────────────────────────────────────────────────┐ │  │
│ │ │ Project Budget:            $19,560 / $22,000     │ │  │
│ │ │ ████████████████████▓▓▓▓                   89%   │ │  │
│ │ └──────────────────────────────────────────────────┘ │  │
│ │                                                      │  │
│ │ By Category:                                         │  │
│ │ AHU:  $12,100 / $13,000 (93%)  ✓ -$900              │  │
│ │ VAV:   $6,615 / $7,000  (94%)  ✓ -$385              │  │
│ │ Diff:  $1,720 / $1,500 (115%)  ⚠ +$220 OVER         │  │
│ │ Grll:    $510 / $500   (102%)  ⚠ +$10 OVER          │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ [Cost Trends →]                                            │
└────────────────────────────────────────────────────────────┘
```

### Pie Chart with Drill-Down

```
Initial Pie Chart (Full BOM):

        Grilles (2.6%)
           ╱
    Diffusers (8.8%)
        ╱       ╲
       ╱         ╲
      ○───────────●
     ╱             ╲
    ╱   AHU 61.9%   ╲
   │       (Blue)    │
    ╲               ╱
     ╲             ╱
      ●───────────○
        ╲       ╱
      VAV ╲   ╱
      33.8% ╲╱
      (Green)

User Hovers on AHU Segment:
┌─────────────────────────────┐
│ Air Handling Units          │
│ $12,100 (61.9%)             │
│                             │
│ 2 items:                    │
│ • York MCA: $6,900          │
│ • Carrier 48TC: $5,200      │
│                             │
│ Click to view details →     │
└─────────────────────────────┘

User Clicks AHU Segment:
┌────────────────────────────────────┐
│ ⓘ Filtered to: Air Handling Units │
│   2 items • $12,100 total          │
│   [✕ Clear Filter]                 │
└────────────────────────────────────┘

Pie Chart Updates (showing AHU breakdown):

    York MCA (57%)
      ╱────╲
     ╱      ╲
    │        │
    │  Blue  │
     ╲      ╱
      ╲────●────╲
              Carrier 48TC (43%)
                 (Light Blue)

Bar Chart Also Updates:
┌────────────────────────┐
│ York MCA    ████████   │ $6,900
│ Carrier 48 █████       │ $5,200
└────────────────────────┘
```

### Budget Progress Indicators

```
Under Budget (Good):
┌─────────────────────────────────────────────┐
│ Project Budget: $19,560 / $22,000           │
│ ████████████████████▓▓▓▓                    │ 89%
│ └─ Actual (Green) └─ Remaining (Gray)      │
│                                             │
│ Status: ✓ Within Budget                    │
│ Remaining: $2,440 (11%)                     │
└─────────────────────────────────────────────┘

Approaching Budget (Warning):
┌─────────────────────────────────────────────┐
│ Project Budget: $21,500 / $22,000           │
│ ████████████████████████████████████▓       │ 98%
│ └─ Actual (Yellow) └─ Remaining (Gray)     │
│                                             │
│ Status: ⚠ Approaching Limit                │
│ Remaining: $500 (2%)                        │
└─────────────────────────────────────────────┘

Over Budget (Alert):
┌─────────────────────────────────────────────┐
│ Project Budget: $24,500 / $22,000           │
│ █████████████████████████████████████████░░░│ 111%
│ └─ Budgeted (Red)  └─ Over (Dark Red)      │
│                                             │
│ Status: ✗ OVER BUDGET                      │
│ Overage: +$2,500 (11% over)                │
└─────────────────────────────────────────────┘
```

### Cost Trend Timeline

```
Cost History Chart:

$20,500 │                    ●← Peak ($20,400)
        │                   ╱ ╲     12/25
$20,000 │                  ╱   ╲
        │                 ╱     ╲
$19,500 │           ●────╯       ●───●← Current ($19,685)
        │          ╱                    12/29
$19,000 │         ╱
        │        ╱
$18,500 │       ╱
        │      ╱
$18,000 │●────╯← Initial ($18,000)
        │         12/20
        └──────┬────┬────┬────┬────┬──
             12/20 12/22 12/25 12/27 12/29

Event Annotations:
● 12/20: Project started, initial BOM generated
● 12/22: Added 3 diffusers (+$1,500)
● 12/25: Added 2 VAV boxes (+$900) ← Peak cost
● 12/27: AHU cost negotiated (-$840)
● 12/29: VAV quantity adjusted (+$125)

Trend Statistics:
┌──────────────────────────────┐
│ Starting: $18,000            │
│ Current:  $19,685 (+9.4%)    │
│ Peak:     $20,400 (12/25)    │
│ Lowest:   $18,000 (12/20)    │
│ Range:    $2,400             │
│ Avg Change: +$421/event      │
└──────────────────────────────┘
```

### Category Budget Variance Heatmap

```
Budget Variance Heatmap (Color-Coded):

┌────────────────────┬──────────┬──────────┬──────────┬────────┐
│ Category           │ Budgeted │ Actual   │ Variance │ Status │
├────────────────────┼──────────┼──────────┼──────────┼────────┤
│ Air Handling Units │ $13,000  │ $12,100  │  -$900   │   ✓    │
│ [Green background] │          │          │  (6.9%)  │        │
├────────────────────┼──────────┼──────────┼──────────┼────────┤
│ VAV Boxes          │  $7,000  │  $6,615  │  -$385   │   ✓    │
│ [Green background] │          │          │  (5.5%)  │        │
├────────────────────┼──────────┼──────────┼──────────┼────────┤
│ Diffusers          │  $1,500  │  $1,720  │  +$220   │   ⚠    │
│ [Yellow background]│          │          │ (14.7%)  │        │
├────────────────────┼──────────┼──────────┼──────────┼────────┤
│ Grilles            │    $500  │    $510  │   +$10   │   ⚠    │
│ [Yellow background]│          │          │  (2.0%)  │        │
└────────────────────┴──────────┴──────────┴──────────┴────────┘

Color Legend:
- Green: Under budget (variance < 0)
- Yellow: Slightly over (0% < variance < 20%)
- Red: Significantly over (variance > 20%)
```

## Testing

### Unit Tests

**Test Suite**: CostAnalyzer

1. **Test: Calculate category breakdown**
   - Setup: BOM with 4 categories
   - Action: calculateBreakdown(lineItems)
   - Assert: Returns array with category amounts and percentages
   - Assert: Percentages sum to 100%

2. **Test: Calculate budget variance**
   - Setup: Budgeted $10,000, Actual $8,500
   - Action: calculateBudgetVariance(8500, 10000)
   - Assert: Returns { variance: -1500, percent: 85, status: "under" }

3. **Test: Analyze cost trends**
   - Setup: Cost history with 5 data points
   - Action: analyzeTrends(history)
   - Assert: Returns { starting, current, peak, lowest, avgChange }
   - Assert: Peak correctly identified

4. **Test: Handle empty BOM**
   - Setup: Empty line items array
   - Action: calculateBreakdown([])
   - Assert: Returns empty array or default structure
   - Assert: No errors thrown

### Integration Tests

**Test Suite**: Cost Analysis Workflow

1. **Test: Analysis panel loads with correct data**
   - Setup: BOM with 12 items, $19,560 total
   - Action: Open cost analysis panel
   - Assert: Summary cards show correct totals
   - Assert: Pie chart renders with category slices
   - Assert: Bar chart renders with category bars
   - Assert: Data matches BOM totals exactly

2. **Test: Budget comparison shows variance**
   - Setup: Budget $22,000, Actual $19,560
   - Action: View budget comparison section
   - Assert: Progress bar shows 89%
   - Assert: Variance displayed as -$2,440
   - Assert: Status shows "Within Budget" (green)

3. **Test: Click chart segment filters BOM**
   - Setup: Pie chart with 4 categories
   - Action: Click "Air Handling Units" segment
   - Assert: BOM table filters to AHU items only
   - Assert: Other charts update to highlight AHU
   - Assert: Filter indicator shown
   - Action: Click "Clear Filter"
   - Assert: All items restored

4. **Test: Cost trends chart displays timeline**
   - Setup: BOM with edit history (5 events)
   - Action: Open cost trends tab
   - Assert: Line chart with 5 data points
   - Assert: Events labeled on timeline
   - Assert: Trend statistics calculated

5. **Test: Export analysis report**
   - Setup: Cost analysis panel open
   - Action: Click "Export Report", select PDF
   - Assert: Export dialog opens
   - Action: Configure options, click Export
   - Assert: PDF generates and downloads
   - Assert: File contains charts and data

### End-to-End Tests

**Test Suite**: User Analysis Workflow

1. **Test: User analyzes cost distribution**
   - Setup: Project with multiple equipment types
   - Action: User clicks "Analysis" tab
   - Assert: Cost analysis panel opens
   - Assert: User sees pie chart with categories
   - Action: User hovers over largest slice
   - Assert: Tooltip shows category details
   - Action: User clicks slice
   - Assert: Drills down to category details

2. **Test: User reviews budget status**
   - Setup: Project with $22,000 budget
   - Action: User scrolls to budget comparison
   - Assert: Progress bar shows 89% used
   - Assert: User sees $2,440 remaining
   - Assert: All categories within budget except Diffusers
   - Assert: Over-budget categories highlighted

3. **Test: User examines cost trends**
   - Action: User clicks "Cost Trends" tab
   - Assert: Timeline chart appears
   - Assert: User sees cost evolution over project
   - Assert: Major events marked on timeline
   - Action: User hovers on peak point
   - Assert: Tooltip shows date and event

4. **Test: User exports cost report**
   - Action: User clicks "Export Report"
   - Assert: Dialog opens with format options
   - Action: User selects PDF, all sections
   - Action: User clicks "Generate Report"
   - Assert: PDF downloads
   - Action: User opens PDF
   - Assert: Report contains all selected sections
   - Assert: Charts rendered as images
   - Assert: Professional formatting

## Common Pitfalls

### Pitfall 1: Percentages Don't Sum to 100%

**Problem**: Rounding errors cause category percentages to sum to 99.9% or 100.1%.

**Symptom**: Pie chart slices don't quite close, or overlap slightly.

**Solution**: Adjust last category's percentage to make total exactly 100%. Calculate first N-1 percentages, assign remainder to last category.

### Pitfall 2: Chart Not Responsive to Container Resize

**Problem**: Chart renders at fixed size, doesn't adapt when panel resized.

**Symptom**: Chart appears clipped or too small after resize.

**Solution**: Use responsive chart configuration. Listen for container resize events, redraw chart at new dimensions.

### Pitfall 3: Budget Comparison Missing When Budget Zero

**Problem**: Project budget set to $0, causing division by zero errors.

**Symptom**: Budget comparison crashes or shows NaN/Infinity.

**Solution**: Validate budget > 0 before calculations. If $0, treat as "no budget defined", hide comparison section.

### Pitfall 4: Cost Trends Chart with Single Data Point

**Problem**: Line chart looks broken with only one point, no line to draw.

**Symptom**: Empty chart or single dot, unclear to user.

**Solution**: Render as scatter plot for single point. Show message: "More data points will appear as project evolves." Provide context.

### Pitfall 5: Export Images Blurry or Low Resolution

**Problem**: Charts exported as low-res images, appear pixelated in PDF.

**Symptom**: Pie chart in PDF report looks blurry, text unreadable.

**Solution**: Render charts at higher resolution (2x or 3x) before exporting. Use SVG format when possible for vector quality.

## Performance Tips

### Tip 1: Memoize Cost Analysis Calculations

Recalculating breakdowns on every render is expensive:

**Implementation**: Use useMemo to cache analysis results. Recalculate only when BOM line items change.

**Benefit**: Eliminates redundant calculations, smooth UI interactions.

### Tip 2: Lazy Load Chart Libraries

Chart.js and similar libraries are large (100-200 KB):

**Implementation**: Dynamically import chart library only when analysis panel opened. Code split chart components.

**Benefit**: Faster initial app load, charts load only when needed.

### Tip 3: Throttle Chart Re-Renders

Chart re-rendering on every state change is slow:

**Implementation**: Throttle chart updates to 100ms intervals. Batch rapid changes.

**Benefit**: Smooth animations and interactions, especially during filters.

### Tip 4: Use Canvas Charts Instead of SVG for Large Data

SVG charts with 100+ elements perform poorly:

**Implementation**: Use canvas-based charts (Chart.js canvas mode) for large BOMs. SVG for small BOMs (<50 items).

**Benefit**: Better performance with large data sets, maintains interactivity.

### Tip 5: Optimize Export Image Generation

Converting charts to images for export is slow:

**Implementation**: Generate images at lower resolution for preview, full resolution only on final export. Cache generated images.

**Benefit**: Faster export preview, full quality final output.

## Future Enhancements

### Enhancement 1: AI-Powered Cost Insights

**Description**: Machine learning analyzes BOM and suggests cost optimizations.

**User Value**: Automated identification of cost-saving opportunities.

**Implementation**:
- Train model on historical project data
- Identify patterns (overpriced items, bulk discount opportunities)
- Suggest substitutions or negotiations
- "AI Recommendations" section in analysis

### Enhancement 2: Scenario Comparison

**Description**: Create and compare multiple BOM scenarios ("Base", "Budget", "Premium").

**User Value**: Evaluate trade-offs between different equipment selections.

**Implementation**:
- Save BOM snapshots as scenarios
- Side-by-side comparison view
- Difference highlighting
- Cost/benefit analysis between scenarios

### Enhancement 3: Real-Time Budget Alerts

**Description**: Push notifications when budget thresholds approached or exceeded.

**User Value**: Proactive budget management, prevent overruns.

**Implementation**:
- Configure alert thresholds (80%, 90%, 100%)
- Real-time monitoring of BOM changes
- Browser notifications or email alerts
- Dashboard widget showing budget health

### Enhancement 4: Customizable Dashboards

**Description**: Drag-and-drop dashboard builder with custom metrics and charts.

**User Value**: Tailor analysis to specific needs and preferences.

**Implementation**:
- Widget library (charts, tables, KPIs)
- Drag-and-drop layout editor
- Save custom dashboard configurations
- Share dashboards with team

### Enhancement 5: Cost Benchmarking

**Description**: Compare project costs against industry benchmarks or historical projects.

**User Value**: Context for whether costs are reasonable or inflated.

**Implementation**:
- Anonymous data aggregation across projects
- Industry standard cost ranges
- Percentile ranking (your cost vs. typical)
- Red flag items significantly above benchmark

### Enhancement 6: What-If Analysis Tool

**Description**: Adjust quantities or costs hypothetically to see impact on totals.

**User Value**: Explore alternatives without committing changes.

**Implementation**:
- Sandbox mode for temporary edits
- Sliders to adjust values
- Real-time total updates
- "Apply Changes" to commit or discard

### Enhancement 7: Predictive Cost Forecasting

**Description**: Based on trends, predict final project cost.

**User Value**: Early warning of potential budget overruns.

**Implementation**:
- Analyze cost growth rate
- Extrapolate to project completion
- Confidence intervals
- "At current rate, final cost: $X ± $Y"

### Enhancement 8: Supplier Price Comparison

**Description**: Integrate with supplier databases to compare pricing.

**User Value**: Ensure best pricing, identify negotiation opportunities.

**Implementation**:
- Connect to supplier APIs
- Retrieve current pricing for equipment
- Compare BOM costs to market rates
- Highlight potential savings

### Enhancement 9: Interactive Cost Allocation

**Description**: Drag-and-drop to reallocate budget between categories.

**User Value**: Visual budget planning and adjustment.

**Implementation**:
- Draggable budget sliders
- Transfer funds between categories
- Real-time validation (can't exceed total budget)
- "Optimized Allocation" AI suggestion

### Enhancement 10: Export to Financial Systems

**Description**: Export cost data directly to QuickBooks, SAP, or other accounting systems.

**User Value**: Seamless integration with business workflows.

**Implementation**:
- API connectors for popular accounting platforms
- Map BOM categories to GL accounts
- Push cost data as line items
- Sync updates automatically
