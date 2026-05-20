# T1 — Schema Foundation: New Fitting Types, IndustrialMaterial, IndustrialConstraints & Shared Types


## Overview

Lay the schema foundation that all other tickets depend on. All new Zod schemas, enums, and shared TypeScript types are defined here. No business logic — only type definitions and schema extensions.

## Spec Reference
`spec:bb54956e-ee69-4825-978d-2e1f03123919/5acac42a-5087-4fcd-85a1-8b1b247c84d7` — Sections 2a through 2e

---

## Scope

### 1. Extend `FittingTypeSchema` — `file:hvac-design-app/src/core/schema/fitting.schema.ts`

Add 6 new values to the existing Zod enum:

| New Value | Description |
|---|---|
| `transition_square_to_round` | Rect → Round (spin-in or welded) |
| `reducer_tapered` | Aerodynamic 15° convergence |
| `reducer_eccentric` | Offset, flat-top or flat-bottom |
| `wye` | Y-branch, 45° split |
| `elbow_mitered` | No-vane, industrial only |
| `end_boot` | Round → Rectangular terminal |

Add a corresponding entry in `DEFAULT_FITTING_PROPS` for each new type.

### 2. Add `alignment` to `transitionData` — `file:hvac-design-app/src/core/schema/fitting.schema.ts`

Extend the existing `transitionData` optional object with:
```
alignment: z.enum(['center_line', 'flat_top', 'flat_bottom']).optional()
```
Default is `center_line`.

### 3. Add `IndustrialMaterialSchema` — `file:hvac-design-app/src/core/schema/service.schema.ts`

New Zod enum, **separate from** the existing `DuctMaterial` enum:
```
'black_iron_16ga' | 'black_iron_18ga' | 'stainless_304' | 'stainless_316' | 'aluminized_steel'
```
Export `IndustrialMaterial` type.

### 4. Add `industrialConstraints` to `ServiceSchema` — `file:hvac-design-app/src/core/schema/service.schema.ts`

New optional object on `ServiceSchema`:
```
industrialConstraints: z.object({
  industrialType: z.enum(['kitchen_exhaust','generator_exhaust','commercial_supply','fume_hood']),
  forbiddenFittings: z.array(FittingTypeSchema),
  requiredMaterial: IndustrialMaterialSchema,
  minTransitionSlopeInchesPerFoot: z.number(),
  maxVelocityFPM: z.number(),
  allowFlexConnectors: z.boolean(),
  maxFlexLengthInches: z.number(),
  preferredElbowType: FittingTypeSchema,
}).partial().optional()
```

### 5. Create Shared Types — new file `src/features/canvas/auto-fitting/types.ts`

Define and export:
- `TopologyContext` — input to all Strategy engines (`connections[]`, `topologyType`, `constraints`, optional metadata)
- `FittingPreview` — Resolver preview output (`fittings[]`, `isValid`, `validationFailureType`, `ghostColor`, `tooltipText`)
- `FittingRequest` — Strategy engine output, returned as ordered array (`fittingType`, `material`, `length`, `alignment`, `sequenceIndex`, `autoInserted: true`)
- `ITopoStrategy` interface — `calculate(ctx: TopologyContext): FittingRequest[]`

---

## Out of Scope
- No business logic, no strategy implementations
- No changes to existing `DuctMaterial` enum values

## Acceptance Criteria
- [ ] All 6 new `FittingType` values pass Zod parse
- [ ] `DEFAULT_FITTING_PROPS` has entries for all 6 new types
- [ ] `IndustrialMaterial` enum is separate from `DuctMaterial`; existing duct entities are unaffected
- [ ] `ServiceSchema` with `industrialConstraints` passes Zod parse with all fields optional
- [ ] `TopologyContext`, `FittingPreview`, `FittingRequest`, `ITopoStrategy` are exported from `auto-fitting/types.ts`
- [ ] Existing schema tests still pass (no regressions)

## Dependencies
None — this is the foundation ticket.
    