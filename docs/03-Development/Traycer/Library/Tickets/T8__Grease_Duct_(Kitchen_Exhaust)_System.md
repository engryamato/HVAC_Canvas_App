# T8: Grease Duct (Kitchen Exhaust) System

## Summary

Implement the complete Grease Duct (Kitchen Exhaust) engineering system — catalog entries, entity schema variant, placement strategies, and calculation engine.

## Spec References

- `spec:53796a94-d8d9-413d-971d-997461b5bb4f/d948bff0-d701-4808-86e5-a2cac5bce758` — Flow 2 (specialty tool drawing)
- `spec:53796a94-d8d9-413d-971d-997461b5bb4f/50508448-82bd-4cd3-9406-fdb8de4b2e1e` — Entity schema variants (GreaseDuctProps), Decisions 2/4/5

## Dependencies

- **T4** — Placement strategy system.
- **T5** — Calculation engine interfaces.

## Scope

### Catalog Entries (18 items)

All with `engineeringSystem: 'grease_duct'`, `categoryId: 'grease_duct'`:

| Sub-Group | Components |
|---|---|
| **Routing (3)** | Factory-Built Round Duct, Welded Rectangular Duct, Zero-Clearance Duct |
| **Fittings (5)** | Standard Elbow (Round/Rect), Mitered Elbow with Access, Tee Fitting, Square-to-Round Transition, Increaser/Reducer |
| **Equipment (4)** | Commercial Exhaust Hood Connection, Upblast Roof Fan, Utility Set Exhaust Fan, Pollution Control Unit (PCU) |
| **Accessories (6)** | High-Temp/Fire-Rated Access Door, Fire Suppression Nozzle Coupling, Grease Trap/Reservoir, Roof Curb/Curb Hinge, Wall/Floor Penetration Wrap, Vented Roof Thimble |

### Entity Schema — `GreaseDuctProps`

- `engineeringSystem: z.literal('grease_duct')`
- System-specific fields: `constructionType` (factory_built/welded/zero_clearance), `fireRating`, `liquidTight`, `weldSpec`

### Placement Strategies (3)

- **FactoryBuiltRoundDuctStrategy** — `augmentPreview()`: clearance indicator; `validatePlacement()`: NFPA 96 velocity limit check.
- **WeldedRectDuctStrategy** — similar with weld-point indicators.
- **ZeroClearanceDuctStrategy** — `augmentPreview()`: "Clearance: 0 in" label; enforces zero-clearance construction type.

### Calculation Engine — `GreaseDuctEngine`

- `IComplianceEngine`: NFPA 96 / IMC velocity limits, fire-rating validation.
- `ISizingEngine`: grease-duct-specific sizing rules.
- Capabilities: `['sizing', 'compliance']`.

### System Profile

- `defaultSystemType: 'exhaust'`
- `supportedArchetypes` with grease-duct-specific archetypes.

## Out of Scope

- Other specialty systems (T7, T9).
- Universal Components (T10).

## Acceptance Criteria

1. All 18 Grease Duct entries appear in Catalog under Specialty Exhaust → Grease Duct.
2. Selecting a Grease Duct routing entry activates the correct specialty strategy.
3. Preview shows clearance indicators and construction-type-specific visuals.
4. `validatePlacement()` warns when velocity exceeds NFPA 96 limits.
5. Placed entity uses `GreaseDuctProps` schema variant with correct discriminator.
6. `GreaseDuctEngine` validates fire-rating compliance and velocity limits.
7. Service dropdown auto-sets to "Exhaust" with override warning behavior.