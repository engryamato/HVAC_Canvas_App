# T5 — FittingResolver: Adapter, Dispatcher & Compound Chain Assembly


## Overview

Implement `FittingResolver` — the single public API for all fitting logic. It wraps `ConnectionDetectionService` as a private adapter, builds `TopologyContext`, dispatches to the correct Strategy engines, assembles compound `FittingRequest[]` chains, and handles both preview and commit execution modes with two-class validation.

## Spec Reference
`spec:bb54956e-ee69-4825-978d-2e1f03123919/5acac42a-5087-4fcd-85a1-8b1b247c84d7` — Sections 1 (Two Execution Modes, Validation Classification) and 3 (Module Map: FittingResolver, Resolver Dispatch Flow diagram)

---

## Scope

### `FittingResolver.ts` — `src/features/canvas/auto-fitting/FittingResolver.ts`

**Public API surface:**
```
FittingResolver.preview(sourceEndpoint, snapTarget, serviceId): FittingPreview
FittingResolver.commit(sourceEndpoint, snapTarget, serviceId): void
```

**Internal responsibilities:**

1. **Proximity detection** — delegates to `ConnectionDetectionService.detectProximity()` (private, unchanged)
2. **Service lookup** — calls `ServiceRules.getConstraints(serviceId)` to retrieve `IndustrialConstraints | null`
3. **Topology classification** — builds `TopologyContext` with `topologyType`, `connections[]`, `angleDeg`, `shapeSignature`, `primaryRunIndex`, `branchIndices`
4. **Strategy dispatch** — routes to the correct engine(s):
   - Turn only → `TurnStrategy`
   - Transition only → `TransitionStrategy`
   - **Turn AND Transition co-occur** → `TransitionStrategy` first, then `TurnStrategy`; merge into ordered chain (`sequenceIndex` 0, 1, …)
   - Junction → `JunctionStrategy`
   - Termination → `TerminationStrategy`
5. **Validation** — calls `GeometryRules.validate(requests[], ctx)` → `ValidationResult`
6. **Preview mode output** — assembles `FittingPreview` from strategy results and validation result
7. **Commit mode behavior:**
   - `geometry_impossible` → create duct entity only; no fitting; show toast `"Cannot connect: [reason]"`
   - `service_violation` → create duct + fitting with `constraintStatus = 'violation'`; show warning toast
   - `ok` → create duct + fitting(s) normally via `createEntities()`

**Compound chain ordering rule:** Transition always precedes Turn in the assembled chain. Junction dominates; per-branch transitions are appended.

---

## Out of Scope
- No changes to `ConnectionDetectionService` (it remains a private dependency)
- No canvas rendering (that's T6)
- `fittingInsertionService` is deprecated but not deleted in this ticket

## Acceptance Criteria
- [ ] `FittingResolver.preview()` returns `FittingPreview` with correct `ghostColor` and `validationFailureType`
- [ ] `FittingResolver.preview()` is read-only — no entity store mutations
- [ ] `FittingResolver.commit()` with `geometry_impossible` creates duct but no fitting
- [ ] `FittingResolver.commit()` with `service_violation` creates fitting with `constraintStatus = 'violation'`
- [ ] Compound chain: Rect→Round at 45° produces `[transition_square_to_round, elbow_45]` in that order
- [ ] `ConnectionDetectionService` is not modified
- [ ] Integration tests cover preview mode, commit-ok, commit-geometry_impossible, commit-service_violation, and compound chain scenarios

## Dependencies
- **T2** (ServiceRules, GeometryRules), **T3** (TurnStrategy, TerminationStrategy), **T4** (TransitionStrategy, JunctionStrategy)
    