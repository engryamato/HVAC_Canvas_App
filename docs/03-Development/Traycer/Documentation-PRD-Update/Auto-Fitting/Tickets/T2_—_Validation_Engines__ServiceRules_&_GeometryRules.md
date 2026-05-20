# T2 — Validation Engines: ServiceRules & GeometryRules


## Overview

Implement the two validation engines that all Strategy engines and the Resolver depend on. These are pure, stateless query/validation functions — no entity creation, no side effects.

## Spec Reference
`spec:bb54956e-ee69-4825-978d-2e1f03123919/5acac42a-5087-4fcd-85a1-8b1b247c84d7` — Section 3 (Module Map: ServiceRules, GeometryRules) and Validation Classification table

---

## Scope

### 1. `ServiceRules.ts` — `src/features/canvas/auto-fitting/rules/ServiceRules.ts`

Responsibilities:
- Accept a `Service` object (or `serviceId` + entity store lookup) and return the applicable `IndustrialConstraints | null`
- Provide a `isFittingForbidden(fittingType, constraints)` helper — returns `true` if the fitting type appears in `constraints.forbiddenFittings`
- Provide a `getRequiredMaterial(constraints)` helper — returns `IndustrialMaterial | null`
- Services without `industrialConstraints` return `null` (fall through to standard ASHRAE logic)

### 2. `GeometryRules.ts` — `src/features/canvas/auto-fitting/rules/GeometryRules.ts`

Responsibilities:
- Accept `FittingRequest[]` and `TopologyContext`, return a `ValidationResult`:
  ```
  { type: 'ok' | 'geometry_impossible' | 'service_violation', reason?: string }
  ```
- `geometry_impossible` cases: gap between duct endpoints < 6 inches, taper angle exceeds physical limit, impossible shape combination
- `service_violation` cases: fitting type appears in `constraints.forbiddenFittings`, material doesn't match `requiredMaterial`, slope below `minTransitionSlopeInchesPerFoot`
- Evaluate `geometry_impossible` first — if geometry is impossible, skip service checks

---

## Out of Scope
- No entity creation or store mutations
- No UI or canvas rendering

## Acceptance Criteria
- [ ] `ServiceRules.getConstraints()` returns `null` for services without `industrialConstraints`
- [ ] `ServiceRules.isFittingForbidden('transition_square_to_round', kitchenExhaustConstraints)` returns `true`
- [ ] `GeometryRules.validate()` returns `geometry_impossible` when gap < 6 inches
- [ ] `GeometryRules.validate()` returns `service_violation` when fitting is in `forbiddenFittings`
- [ ] `GeometryRules.validate()` evaluates geometry before service rules (geometry takes priority)
- [ ] Unit tests cover all three `ValidationResult` types with representative inputs

## Dependencies
- **T1** must be complete (requires `IndustrialConstraints`, `FittingRequest`, `TopologyContext` types)
    