# Phase 5.6: Calculation Settings Dialog UI


## Overview

Create Calculation Settings dialog UI for configuring labor rates, markup, waste factors, and engineering limits with template support.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 7: Calculation Settings Configuration)

## Scope

**In Scope**:
- Settings dialog modal UI
- Template selector dropdown
- Settings sections: Labor Rates, Markup & Overhead, Waste Factors, Engineering Limits
- "Save as Template" functionality
- Quick access from BOM tab "Settings" button
- Settings apply immediately to calculations

**Out of Scope**:
- Settings persistence (handled by settingsStore from Phase 1.3)
- Cost recalculation (handled by Phase 4.1)

## Key Files

**Create**:
- `file:hvac-design-app/src/components/settings/CalculationSettingsDialog.tsx`
- `file:hvac-design-app/src/components/settings/SettingsSection.tsx`
- `file:hvac-design-app/src/components/settings/TemplateSelector.tsx`

**Reference**:
- `file:hvac-design-app/src/core/store/settingsStore.ts` (from Phase 1.3)

## Acceptance Criteria

- [ ] Dialog accessible from BOM tab "Settings" button
- [ ] Template dropdown: Commercial Standard, Residential Budget, Industrial Heavy, Custom
- [ ] Selecting template populates all fields
- [ ] Editing any field switches to "Custom" template
- [ ] Labor Rates section: Base rate, overtime multiplier, regional adjustment
- [ ] Markup section: Material %, Labor %, Overhead %
- [ ] Waste Factors section: Duct %, Fitting %, Equipment %, Accessories %
- [ ] Engineering Limits section: Max velocity, target pressure drop
- [ ] "Save as Template" button creates new reusable template
- [ ] "Apply Settings" button closes dialog and triggers BOM recalculation
- [ ] "Cancel" button discards changes
- [ ] Matches wireframe from Flow 7

## Dependencies

- **Requires**: Phase 1.3 (calculation settings store and templates)
- **Requires**: Phase 4.2 (BOM panel for "Settings" button)

## Technical Notes

**Settings Application Flow**:
1. User opens settings dialog
2. User selects template or edits values
3. User clicks "Apply Settings"
4. settingsStore updates
5. BOM recalculates with new settings
6. Dialog closes
