# T10: Universal Components — Hangers, Supports & Seismic

## Summary

Implement the Universal Components system — catalog entries for hangers/supports/seismic, the HangerEngine (load + compliance), the Auto-Hanger Spacing tool, and the Continuous Trapeze Run tool.

## Spec References

- `spec:53796a94-d8d9-413d-971d-997461b5bb4f/d948bff0-d701-4808-86e5-a2cac5bce758` — Flow 3 (Auto-Hanger Placement), Flow 4 (Continuous Trapeze Run)
- `spec:53796a94-d8d9-413d-971d-997461b5bb4f/50508448-82bd-4cd3-9406-fdb8de4b2e1e` — Decision 4 (ILoadEngine)

## Dependencies

- **T5** — Calculation engine interfaces (`ILoadEngine`, `IComplianceEngine`, `CalculationEngineRegistry`).

## Scope

### Catalog Entries (16 items)

All with `engineeringSystem: 'universal'`, `categoryId: 'hangers_supports'`:

| Sub-Group | Components |
|---|---|
| **Auto-Rules (2)** | Auto-Calculate Hanger Spacing, Draw Continuous Trapeze Run |
| **Suspended Hangers (5)** | Clevis Hanger, Trapeze Hanger Assembly, Band/Strap Hanger, Gripple/Cable Suspension Kit, Spring Isolation Hanger |
| **Wall/Floor/Roof Supports (4)** | Wall Bracket/Cantilever Arm, Riser Clamp, Floor Pedestal/Saddle Support, Roof Block/Pipe Roller |
| **Seismic & Structural (4)** | Rigid Seismic Brace, Cable Seismic Brace, Concrete/Wedge Anchor, Beam Clamp |

### Auto-Hanger Spacing Tool

- Settings flyout inline in sidebar (not modal):
  - Code standard selector: SMACNA / IBC-ASCE 7 / ASHRAE
  - Hanger type selector
  - Max spacing override field (default from code table)
  - Seismic zone selector
  - Scope toggle: selected ducts vs all duct runs
- "Preview Placement" → canvas ghost markers at calculated intervals with spacing labels.
- Drag-to-adjust individual markers.
- "Apply" → place hangers as entities linked to parent duct runs.
- Seismic bracing auto-added when required by zone + duct size.
- Undo/Redo for entire batch as single action.

### Continuous Trapeze Run Tool (`ContinuousTrapezeRunTool`)

- Separate `BaseTool` subclass (not a DuctTool strategy — different interaction paradigm).
- Click on/near duct run → snap to centerline → preview trapeze assembly.
- Click second point → extend trapeze along duct with code-compliant intermediate supports.
- Placed as grouped entity (strut + rods + supports) linked to parent duct.
- Properties tab shows strut size, rod diameter/length, support count, total load rating.
- Mount height prompt when duct's mount height is not set.

### Calculation Engine — `HangerEngine`

- `ILoadEngine`: load calculations, hanger spacing tables.
- `IComplianceEngine`: SMACNA compliance, IBC/ASCE 7 seismic adequacy, ASHRAE vibration isolation.
- Capabilities: `['load', 'compliance']`.

### Compliance Tables

- SMACNA hanger spacing tables by duct size and type.
- IBC/ASCE 7 seismic brace interval and force calculations.
- ASHRAE vibration isolation recommendations.

### System Profile

- `engineeringSystem: 'universal'`
- `defaultSystemType: 'supply'` (hangers serve all service types)
- `supportedArchetypes` for hanger, support, and seismic component classes.

## Out of Scope

- Specialty exhaust systems (T7-T9).
- Modifications to DuctTool or PlacementStrategyRegistry (this uses its own tools).

## Acceptance Criteria

1. All 16 Universal Component entries appear in Catalog under Universal Components → Hangers, Supports & Seismic.
2. Auto-Hanger Spacing settings flyout opens inline in the sidebar.
3. Preview shows ghost markers at code-compliant intervals with spacing labels.
4. Individual markers are draggable with live spacing recalculation.
5. Apply places hangers as entities linked to parent duct runs.
6. Seismic bracing markers auto-appear when required by zone + duct size.
7. Undo removes entire batch as one action.
8. Validation tab shows compliance summary after Apply.
9. `ContinuousTrapezeRunTool` snaps to duct centerline and places grouped trapeze assembly.
10. Trapeze assembly properties (strut, rod, supports, load) appear in Properties tab.
11. Mount height prompt appears when duct has no mount height set.
12. `HangerEngine` performs load calculations and SMACNA/IBC/ASHRAE compliance checks.