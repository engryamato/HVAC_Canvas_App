# T5: Calculation Engine Interfaces + StandardDuctEngine

## Summary

Define the calculation engine plugin architecture — four sub-engine interfaces, the composite engine interface, and the engine registry — then refactor existing calculation code into the first registered engine.

## Spec References

- `spec:53796a94-d8d9-413d-971d-997461b5bb4f/50508448-82bd-4cd3-9406-fdb8de4b2e1e` — Decision 4 (Composite Calculation Engines), Component Architecture §7

## Dependencies

- **T1** — Entity schemas with `engineeringSystem` discriminator for engine dispatch.

## Scope

### Sub-Engine Interfaces

- **`ISizingEngine`** — `calculateSize(params: SizingInput): SizingResult`
- **`IPressureDropEngine`** — `calculatePressureDrop(params): PressureDropResult`, `calculateFrictionLoss(params): FrictionResult`
- **`IComplianceEngine`** — `validate(entity, profile: SystemProfile): ComplianceResult`
- **`ILoadEngine`** — `calculateLoad(params): LoadResult`, `calculateSpacing(params): SpacingResult`

### Composite Engine Interface

- **`ISystemEngine`** — `readonly engineeringSystem`, `readonly capabilities: string[]`, optional getters for each sub-engine (`getSizingEngine?()`, `getPressureDropEngine?()`, `getComplianceEngine?()`, `getLoadEngine?()`).

### Engine Registry

- **`CalculationEngineRegistry`** — `Map<EngineeringSystem, ISystemEngine>`, populated at app initialization.

### StandardDuctEngine

- Refactor existing `file:hvac-design-app/src/features/canvas/calculators/ductSizing.ts` into `ISizingEngine` implementation.
- Refactor existing `file:hvac-design-app/src/features/canvas/calculators/pressureDrop.ts` into `IPressureDropEngine` implementation.
- Register `StandardDuctEngine` as the first composite engine with capabilities `['sizing', 'pressure_drop']`.

### Entity Integration Pipeline

- When an entity is placed or modified:
  1. Read `entity.props.engineeringSystem`
  2. Resolve `ISystemEngine` from registry
  3. Invoke applicable sub-engines based on `capabilities`
  4. Write results to `entity.props.engineeringData` and `entity.props.constraintStatus`

## Out of Scope

- Specialty engines (BoilerFlueEngine, GreaseDuctEngine, GeneratorExhaustEngine, HangerEngine) — those are T7-T10.
- UI components — this is pure data/logic layer.

## Acceptance Criteria

1. All four sub-engine interfaces are defined with clear input/output types.
2. `ISystemEngine` composite interface is defined with capability declaration.
3. `CalculationEngineRegistry` maps `EngineeringSystem` values to `ISystemEngine` instances.
4. `StandardDuctEngine` is registered with `engineeringSystem: 'standard_duct'` and capabilities `['sizing', 'pressure_drop']`.
5. Existing duct sizing calculations produce identical results before and after refactoring.
6. Existing pressure drop calculations produce identical results before and after refactoring.
7. Entity integration pipeline reads `engineeringSystem`, resolves engine, invokes sub-engines, and writes results.
8. If no engine is registered for a given `engineeringSystem`, the pipeline gracefully skips (no crash).