# Phase 5.5: System Template Application


## Overview

Implement system template functionality for applying HVAC system configurations (supply, return, exhaust) to ductwork with visual color coding.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 10: System Template Application)

## Scope

**In Scope**:
- System templates in Component Browser (Supply Air, Return Air, Exhaust, Custom)
- Click-to-activate template (like component activation)
- Apply system type to ducts (click duct → apply system)
- Visual color coding (Supply: blue, Return: green, Exhaust: red)
- Bulk application (select multiple ducts → apply system)
- System-specific settings (pressure class, insulation, sealing class)
- BOM grouping by system type

**Out of Scope**:
- Custom system template creation (future enhancement)
- System-level validation rules (future enhancement)

## Key Files

**Create**:
- `file:hvac-design-app/src/features/canvas/tools/SystemTemplateTool.ts`
- `file:hvac-design-app/src/features/canvas/components/SystemTemplateSelector.tsx`
- `file:hvac-design-app/src/core/schema/system-template.schema.ts`

**Modify**:
- `file:hvac-design-app/src/features/canvas/components/ComponentBrowser.tsx` - Add System Templates section
- `file:hvac-design-app/src/features/canvas/components/CanvasRenderer.tsx` - Color coding by system

## Acceptance Criteria

- [ ] Component Browser shows "System Templates" category
- [ ] Templates: Supply Air (blue), Return Air (green), Exhaust (red), Custom (gray)
- [ ] Clicking template activates it (like component activation)
- [ ] Clicking duct applies system type to duct
- [ ] Duct outline changes color based on system type
- [ ] Properties panel shows system-specific settings
- [ ] Bulk application: Select multiple ducts → right-click → "Apply System Template"
- [ ] BOM groups by system type when selected
- [ ] Warning: "Mixing supply and return in same duct run"
- [ ] Undo: "Undo: Apply Supply System to 12 ducts"
- [ ] Matches flow description from Flow 10

## Dependencies

- **Requires**: Phase 3.3 (Component Browser for template display)
- **Requires**: Phase 5.3 (bulk operations for bulk application)

## Technical Notes

**System Template Structure**:
```typescript
interface SystemTemplate {
  id: string;
  name: string;
  systemType: 'supply' | 'return' | 'exhaust' | 'custom';
  color: string;
  defaults: {
    pressureClass: 'low' | 'medium' | 'high';
    insulationRequired: boolean;
    sealingClass: 'A' | 'B' | 'C';
  };
}
```
