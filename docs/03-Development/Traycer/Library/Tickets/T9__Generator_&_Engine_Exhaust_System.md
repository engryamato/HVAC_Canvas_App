# T9: Generator & Engine Exhaust System

## Summary

Implement the complete Generator & Engine Exhaust engineering system — catalog entries, entity schema variant, placement strategies, and calculation engine.

## Spec References

- `spec:53796a94-d8d9-413d-971d-997461b5bb4f/d948bff0-d701-4808-86e5-a2cac5bce758` — Flow 2 (specialty tool drawing)
- `spec:53796a94-d8d9-413d-971d-997461b5bb4f/50508448-82bd-4cd3-9406-fdb8de4b2e1e` — Entity schema variants (GeneratorExhaustProps), Decisions 2/4/5

## Dependencies

- **T4** — Placement strategy system.
- **T5** — Calculation engine interfaces.

## Scope

### Catalog Entries (17 items)

All with `engineeringSystem: 'generator_exhaust'`, `categoryId: 'generator_exhaust'`:

| Sub-Group | Components |
|---|---|
| **Routing (2)** | Flanged Exhaust Pipe, Slip-Fit Exhaust Pipe |
| **Fittings (5)** | 90° Long Radius Elbow, 45° Elbow, Engine Wye/Lateral, Flanged Reducer/Expander, Flange Gasket & Hardware Kit |
| **Equipment (3)** | Engine Silencer (Industrial/Residential/Hospital), Diesel Particulate Filter (DPF), Catalytic Converter |
| **Accessories (7)** | Stainless Steel Bellows/Expansion Joint, High-Temp Insulation Blanket, Wall Sleeve/Ventilated Thimble, Roof Flashing & Storm Collar, Flip-Top Rain Cap, Exhaust Mitre/Slash Cut Termination, Spring Isolation Hanger |

### Entity Schema — `GeneratorExhaustProps`

- `engineeringSystem: z.literal('generator_exhaust')`
- System-specific fields: `connectionType` (flanged/slip_fit), `backpressureLimit`, `exhaustTempF`, `engineModel`

### Placement Strategies (2)

- **FlangedExhaustPipeStrategy** — `resolveSnapBehavior()`: flanged connection snap semantics (flange-to-flange alignment); `augmentPreview()`: flanged connection markers.
- **SlipFitExhaustPipeStrategy** — slip-fit-specific snap and preview behavior.

### Calculation Engine — `GeneratorExhaustEngine`

- `ISizingEngine`: pipe sizing based on engine specs and exhaust flow.
- `IPressureDropEngine`: backpressure calculations, DPF pressure drop.
- `IComplianceEngine`: temperature derating validation, backpressure limit checks.
- Capabilities: `['sizing', 'pressure_drop', 'compliance']`.

### System Profile

- `defaultSystemType: 'exhaust'`
- `supportedArchetypes` with generator-exhaust-specific archetypes.

## Out of Scope

- Other specialty systems (T7, T8).
- Universal Components (T10).

## Acceptance Criteria

1. All 17 Generator Exhaust entries appear in Catalog under Specialty Exhaust → Generator & Engine Exhaust.
2. Flanged pipe strategy uses custom snap behavior for flange-to-flange alignment.
3. Preview shows flanged connection markers or slip-fit indicators per strategy.
4. Placed entity uses `GeneratorExhaustProps` schema variant with correct discriminator.
5. `GeneratorExhaustEngine` performs backpressure calculations and temperature derating validation.
6. Engine warns when backpressure exceeds engine-spec limits.
7. Service dropdown auto-sets to "Exhaust" with override warning behavior.