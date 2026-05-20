# Phase 5.2: Validation Dashboard with Issue Navigation


## Overview

Build validation dashboard that displays aggregated validation issues, supports filtering by severity, and enables navigation to problematic components.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 12: Design Validation and Error Resolution)

## Scope

**In Scope**:
- Validation Dashboard UI in right sidebar (Validation tab)
- Issue list grouped by severity (Errors, Warnings, Info)
- Click issue → navigate to component on canvas
- Filter by severity, category, entity type
- "Validate Design" button to trigger full validation
- Issue count badges
- Suggested fix display and "Apply Fix" button

**Out of Scope**:
- Automatic validation (already handled by ParametricUpdateService)
- Custom validation rules (use existing)

## Key Files

**Create**:
- `file:hvac-design-app/src/features/canvas/components/ValidationDashboard.tsx`
- `file:hvac-design-app/src/features/canvas/components/Validation/IssueList.tsx`
- `file:hvac-design-app/src/features/canvas/components/Validation/IssueItem.tsx`
- `file:hvac-design-app/src/features/canvas/components/Validation/ValidationFilters.tsx`

**Reference**:
- `file:hvac-design-app/src/core/store/validationStore.ts` (from Phase 2.3)

## Acceptance Criteria

- [ ] Dashboard shows issues grouped by severity (Errors: 3, Warnings: 7, Info: 2)
- [ ] Each issue shows: entity name, violation type, message, suggested fix
- [ ] Clicking issue selects entity on canvas and opens Properties panel
- [ ] Filter dropdown: All, Errors Only, Warnings Only, Info Only
- [ ] "Validate Design" button triggers full validation refresh
- [ ] Issue count badges update in real-time
- [ ] "Apply Fix" button applies suggested fix and clears issue
- [ ] Empty state: "✓ No validation issues. Design is ready for export."
- [ ] Matches flow description from Flow 12

## Dependencies

- **Requires**: Phase 2.3 (validation store)
- **Requires**: Phase 2.4 (Properties panel for navigation)

## Technical Notes

**Navigation Flow**:
1. User clicks issue in dashboard
2. validationStore.selectIssue(issueId)
3. Canvas selects entity
4. Properties panel opens
5. Engineering tab shows violation details
