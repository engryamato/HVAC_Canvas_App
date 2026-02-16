# Phase 4.2: Enhanced BOM Panel with Real-Time Updates


## Overview

Enhance BOM panel UI with real-time cost updates, detailed cost breakdown, grouping, filtering, and debounced recalculation.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 3: Real-Time Cost Estimation, Flow 14: Advanced BOM Operations)

## Scope

**In Scope**:
- Enhanced BOM table with unit cost, labor hours, total cost columns
- Real-time updates with debouncing (500ms for dimension changes)
- Cost breakdown popup (click item → see material/labor/markup breakdown)
- Grouping by category, system type, material, floor/zone
- Search and filter functionality
- Cost delta display (show what changed)
- "Last updated" timestamp

**Out of Scope**:
- Export functionality (handled in Phase 4.3)
- Cost analysis charts (future enhancement)
- Comparison mode (future enhancement)

## Key Files

**Modify**:
- `file:hvac-design-app/src/features/canvas/components/BOMPanel.tsx` - Enhance UI
- `file:hvac-design-app/src/features/canvas/components/BOMTable.tsx` - Add columns
- `file:hvac-design-app/src/features/canvas/hooks/useBOM.ts` - Add debouncing logic

**Create**:
- `file:hvac-design-app/src/features/canvas/components/BOM/CostBreakdownPopup.tsx`
- `file:hvac-design-app/src/features/canvas/components/BOM/BOMGrouping.tsx`
- `file:hvac-design-app/src/features/canvas/components/BOM/BOMFilters.tsx`

## Acceptance Criteria

- [ ] BOM table shows: Item, Qty, Unit Cost, Labor Hrs, Total Cost
- [ ] Real-time updates: Add component → BOM updates immediately
- [ ] Debounced updates: Change dimension → BOM updates after 500ms
- [ ] Cost breakdown popup shows material/labor/markup breakdown
- [ ] Grouping dropdown: Category, System Type, Material, Floor/Zone
- [ ] Search box filters BOM items by name/description
- [ ] Cost delta display: "+$145" when costs increase
- [ ] "Last updated: 2 seconds ago" timestamp
- [ ] Project totals: Material, Labor, Markup, Grand Total
- [ ] Matches wireframe from Flow 3
- [ ] Performance: Update BOM for 100 items in < 100ms

## Dependencies

- **Requires**: Phase 4.1 (enhanced cost calculation)
- **Requires**: Phase 2.2 (parametric updates trigger BOM recalculation)

## Technical Notes

**Debouncing Logic**:
- Immediate: Add/delete entity, quantity change
- Debounced (500ms): Dimension change, material change
- Manual: Settings change (user clicks "Recalculate")

**Grouping Implementation**:
Use existing BOM groupKey, add grouping UI controls
