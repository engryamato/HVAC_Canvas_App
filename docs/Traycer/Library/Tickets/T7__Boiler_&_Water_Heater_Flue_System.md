# T7: Boiler & Water Heater Flue System

## Summary

Implement the complete Boiler & Water Heater Flue engineering system — catalog entries, entity schema variant, placement strategies, and calculation engine.

## Spec References

- `spec:53796a94-d8d9-413d-971d-997461b5bb4f/d948bff0-d701-4808-86e5-a2cac5bce758` — Flow 2 (specialty tool drawing)
- `spec:53796a94-d8d9-413d-971d-997461b5bb4f/50508448-82bd-4cd3-9406-fdb8de4b2e1e` — Entity schema variants (BoilerFlueProps), Decisions 2/4/5

## Dependencies

- **T4** — Placement strategy system (IPlacementStrategy, PlacementStrategyRegistry, DuctTool injection).
- **T5** — Calculation engine interfaces (ISizingEngine, IComplianceEngine, CalculationEngineRegistry).

## Scope

### Catalog Entries (19 items)

All with `engineeringSystem: 'boiler_flue'`, `categoryId: 'boiler_flue'`:

| Sub-Group | Components |
|---|---|
| **Routing (3)** | Single Wall Pipe, Double Wall Pipe, Flexible Liner |
| **Fittings (7)** | 90° Elbow, 45° Elbow, Boot Tee, Y-Fitting/Lateral, Increaser/Reducer, Condensate Drain Fitting, Test Port Length |
| **Equipment (3)** | Inline Draft Inducer/Fan, Barometric Draft Control, Boiler/Appliance Adapter |
| **Accessories (6)** | Condensate Trap, Wall Thimble/Penetration Sleeve, Roof Flashing & Storm Collar, Support Bracket/Guy Wire Band, Rain Cap/Termination Cone, Screened Termination |

### Entity Schema — `BoilerFlueProps`

- `engineeringSystem: z.literal('boiler_flue')`
- System-specific fields: `wallType` (single/double), `condensateSlope`, `btuRating`, `flueGasDewpoint`, `venting` (natural/forced)

### Placement Strategies (3)

- **SingleWallPipeStrategy** — `augmentPreview()`: condensate slope indicator (¼"/ft label); `getGhostFittingType()`: Boot Tee instead of generic elbow; `getSystemBannerInfo()`: orange banner "Boiler & Water Heater Flue — Single Wall Pipe".
- **DoubleWallPipeStrategy** — similar with double-wall-specific defaults.
- **FlexibleLinerStrategy** — similar with flexible-specific snap behavior.

### Calculation Engine — `BoilerFlueEngine`

- Composite engine with `engineeringSystem: 'boiler_flue'`.
- `ISizingEngine`: BTU-based pipe sizing.
- `IComplianceEngine`: condensate drain sizing validation, slope compliance checks.
- Capabilities: `['sizing', 'compliance']`.

### System Profile

- `defaultSystemType: 'exhaust'`
- `supportedArchetypes` for all four component classes with boiler-flue-specific archetypes.

## Out of Scope

- Other specialty systems (T8, T9).
- Universal Components (T10).

## Acceptance Criteria

1. All 19 Boiler Flue entries appear in Catalog under Specialty Exhaust → Boiler & Water Heater Flue.
2. Selecting a Boiler Flue routing entry morphs the toolbar and shows the system context banner.
3. Preview shows condensate slope indicator via `augmentPreview()`.
4. Ghost fitting suggests Boot Tee at appropriate connection angles.
5. Placed entity uses `BoilerFlueProps` schema variant with correct discriminator.
6. `BoilerFlueEngine` performs BTU-based sizing and slope compliance validation.
7. Service dropdown auto-sets to "Exhaust" when a Boiler Flue entry is selected.
8. Override warning appears if the user changes service context away from "Exhaust".