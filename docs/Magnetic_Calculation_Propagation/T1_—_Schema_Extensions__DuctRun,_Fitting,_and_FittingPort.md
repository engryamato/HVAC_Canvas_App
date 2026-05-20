# T1 — Schema Extensions: DuctRun, Fitting, and FittingPort

## Purpose

Extend the data model to carry the new calculated fields and authoritative fitting port metadata that every downstream service and UI component depends on. This ticket has no runtime behavior — it is purely additive schema work.

## Spec References

- spec:144cfcf2-5828-446d-85a5-abc486548367/8fc1d79f-9121-4037-ac93-36e96db87983 — Data Model section
- spec:144cfcf2-5828-446d-85a5-abc486548367/58bed118-8a34-4de4-9b82-f204bd20c741 — Scope table

## What to Change

### 1. `DuctCalculatedSchema` (shared into `duct_run`)

Add two optional fields:

- `cumulativePressureDrop?: number` — total pressure loss from source equipment to this segment (in.wg)
- `availableStaticPressure?: number` — source SP minus cumulative drop (in.wg)

Both are optional so existing project files load without migration.

### 2. `FittingCalculatedSchema`

Add the same two optional fields:

- `cumulativePressureDrop?: number`
- `availableStaticPressure?: number`

Existing `equivalentLength` and `pressureLoss` are unchanged.

### 3. New `FittingPort` type

Add a new interface/type (in file:hvac-design-app/src/core/types/fitting.ts or a shared types file):

```ts
interface FittingPort {
  id: string;
  role: 'inlet' | 'outlet' | 'straight_out' | 'branch_out';
  direction: 'in' | 'out';
  connectedDuctRunId: string;
  connectedEnd: 'start' | 'end';
}
```

Add `ports?: FittingPort[]` to the fitting props schema. This is optional for backward compatibility; existing fittings without ports are treated as having unresolved port metadata.

### 4. New service-level types

Add shared types used by the new services (can live in file:hvac-design-app/src/core/services/graph/types.ts or a new `calculationTypes.ts`):

```ts
interface PressureResult { cumulativePressureDrop, availableStaticPressure, pressureLoss }
interface TopologyValidationResult { componentId, isValid, sourceEquipmentId?, affectedEntityIds, reason? }
interface OverlayStatus { color: string | null, label, valueText, neutral: boolean }
```

## Acceptance Criteria

duct_run entities accept and persist cumulativePressureDrop and availableStaticPressure in their calculated blockfitting entities accept and persist cumulativePressureDrop and availableStaticPressure in their calculated blockfitting entities accept and persist a ports array of FittingPort objects in their propsExisting project files without these fields load without errors or type failuresPressureResult, TopologyValidationResult, and OverlayStatus types are exported and importable by other servicesNo runtime behavior changes — this ticket is schema and types only

## Out of Scope

- Populating these fields (that is T2–T5)
- UI display (that is T6–T7)
- Migrating existing fittings to have `ports` (migration is handled in T2)