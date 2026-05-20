# Add Schema Extensions and Inspector Tooltips


## Overview

Add optional rendering preferences to entity schemas for future-proofing, and implement tooltips in the Inspector panel to help users discover insulation visualization features.

## Scope

**In Scope:**
- Add optional `RenderingPreferences` interface to schemas:
  - `DuctProps`
  - `EquipmentProps`
  - `FittingProps`
- Add tooltip to insulation properties in Inspector panel
- Tooltip shows visual preview of hatching pattern
- Update schema documentation
- Ensure backward compatibility (all fields optional)

**Out of Scope:**
- Rendering logic changes (already completed)
- UI for configuring rendering preferences (future work)
- Migration scripts (not needed - fields are optional)

## Spec References

- `spec:c42960f7-7816-4adf-8ef1-426a4646422e/3b890b83-0a21-447a-be3b-6d51afa86814` - Tech Plan: Data Model, Schema Extensions
- `spec:c42960f7-7816-4adf-8ef1-426a4646422e/0ee283f6-99b4-482d-8da8-b11e621920c5` - Core Flows: Flow 6 (Discovering Insulation Visualization)

## Key Implementation Details

**Schema Extension:**
```typescript
interface RenderingPreferences {
  detailLevel?: 'full' | 'simplified' | 'performance';
  customStyle?: string; // Reserved for future use
}

// Add to DuctProps, EquipmentProps, FittingProps
renderingPreferences?: RenderingPreferences;
```

**Inspector Tooltip:**
- Add tooltip icon next to "Insulated" checkbox
- Tooltip text: "Insulation will be shown with diagonal hatching pattern"
- Include small visual preview (mini canvas or SVG)
- Show example: "Standard engineering drawing style"

## Acceptance Criteria

- [ ] `RenderingPreferences` interface added to all entity schemas
- [ ] Fields are optional with proper TypeScript types
- [ ] Schema validation passes with and without rendering preferences
- [ ] Existing projects load without errors (backward compatible)
- [ ] Inspector panel shows tooltip icon next to insulation checkbox
- [ ] Tooltip displays on hover with clear explanation
- [ ] Tooltip includes visual preview of hatching pattern
- [ ] Tooltip is accessible (keyboard navigation, screen readers)
- [ ] Schema documentation updated
- [ ] No breaking changes to existing code

## Dependencies

None - Can be done in parallel with other tickets

## Files to Modify

- `hvac-design-app/src/core/schema/duct.schema.ts`
- `hvac-design-app/src/core/schema/equipment.schema.ts`
- `hvac-design-app/src/core/schema/fitting.schema.ts`
- `hvac-design-app/src/features/canvas/components/Inspector/InspectorPanel.tsx` (or relevant inspector component)
