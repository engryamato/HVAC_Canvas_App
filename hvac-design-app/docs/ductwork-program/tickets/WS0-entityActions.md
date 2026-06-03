# TICKET WS0 — Extract `entityActions` shared write layer + action registry

**Milestone:** M1 Foundation · **Priority:** P0 (gating for WS3/WS4/WS5) · **Effort:** ~2–3h core + refactor
**Type:** Refactor (behavior-preserving) · **Status:** Ready · **Code changes:** not in this ticket — spec only

## Context

CAS (WS3) and the Axial menu (WS4) must edit entities through the **same** code path the Inspector uses, or they will silently diverge on validation, undo grouping, and parametric propagation. Today every Inspector writes its edits inline. This ticket extracts those writes into one shared module so all surfaces call it. It is the hard dependency for CAS/Axial (decomposition D2/D3, `[[interaction-architecture-plan]]`).

## Current state (verified)

Inspector edits are **not** bare store writes — they are multi-step orchestration:
- `DuctInspector.commit` (`src/features/canvas/components/Inspector/DuctInspector.tsx:278-321`): deep-clones `previous` for undo → `validateField` → gathers all ducts + fittings → `parametricUpdateService.scheduleDuctPropertyChange(..., 500ms debounce)` → dispatches `updateEntitiesCommand` or `updateEntityCommand`.
- `DuctInspector.handleShapeChange` (`:323-377`): adds equivalent-round-diameter conversion + remembered-dimension logic, then commits as one change.
- Other inspectors inline their own writes: `DuctRunInspector` (section/run length, insulation, ends), `EquipmentInspector` (type-change resets defaults), `FittingInspector` "Reset to Auto" → `fittingInsertionService.planManualOverrideReset` (`fittingInsertionService.ts:490`).
- Commands live in `src/core/commands/entityCommands.ts` (`updateEntityCommand`, `updateEntitiesCommand` ~:685-735); history via `historyStore`.

There is **no** shared action layer today; each inspector closes over its own hook state (`useFieldValidation`, settings store).

## Proposed change

Create `src/core/actions/entityActions.ts` (**confirmed location** — new `src/core/actions/` dir) exporting pure, surface-agnostic functions:

```ts
// each action: (entityId, value, ctx) => void  — does validate → parametric → command
export const entityActions = {
  setSize, setShape, setLength, setMaterial, setSystemType,
  splitDuct, reverseFlow, resetFittingToAuto,
} // names final at impl
```

- Each function internally performs the full orchestration currently inlined in `DuctInspector` (deep-clone for undo, `validateField`, `scheduleDuctPropertyChange` debounce, `updateEntit{y,ies}Command`).
- `ctx` carries what the writes need that isn't derivable from the store (e.g. `engineeringLimits`, settings) — **define the exact `ctx` shape at implementation** (open item below).
- Add an **action registry**: `Array<{ id, label, appliesTo(entityType), isGlobal: false, run(ctx) }>` consumed later by CAS/Inspector quick-row.
- **Refactor inspectors to call `entityActions` first** — behavior-preserving; no UI change.

## Acceptance criteria

1. `entityActions` module exists; `DuctInspector` (and the other inspectors' equivalent writes) call it instead of inlining the orchestration.
2. Editing a field via `entityActions` produces an **identical undo entry and identical parametric propagation** to the pre-refactor Inspector path (parity).
3. Action registry exists; unit test asserts `registry.every(a => !a.isGlobal)`.
4. Debounced writes still coalesce into one commit (no double undo entries from the 500ms `scheduleDuctPropertyChange`).
5. All existing Inspector tests pass **unchanged**.
6. `pnpm typecheck` clean; no new lint errors.

## Testing plan

| Layer | What | Count |
|---|---|---|
| Unit | each `entityActions.*` performs validate → parametric → command (mock command layer, assert calls) | +6 |
| Unit | registry has zero global ids | +1 |
| Parity | same field via module vs legacy inspector path → one identical undo entry | +1 |
| Regression | existing `DuctInspector`/`DuctRunInspector`/`FittingInspector` tests green unchanged | — |

## Rollback

Additive module + inspector call-site swap. Revert = restore the inlined inspector writes; no schema/store change. Low risk. **No feature flag** — internal behavior-preserving refactor (per program flag decision; WS0 is not user-visible); rely on the parity test.

## Files reference

| File | Change |
|---|---|
| `src/core/actions/entityActions.ts` | **new** — the shared write functions + registry |
| `src/features/canvas/components/Inspector/DuctInspector.tsx:278-377` | call `entityActions` instead of inlined commit/handleShapeChange |
| `src/features/canvas/components/Inspector/DuctRunInspector.tsx` | route length/insulation/end writes through `entityActions` |
| `src/features/canvas/components/Inspector/FittingInspector.tsx` | `resetFittingToAuto` via the registry path |
| `src/features/canvas/components/Inspector/EquipmentInspector.tsx` | route type/dimension writes through `entityActions` |
| `src/core/commands/entityCommands.ts` | consumed (no change expected) |
| `src/core/services/parametric/parametricUpdateService.ts` | consumed (no change expected) |

## Dependencies & blocks

- **Depends on:** nothing.
- **Blocks:** WS3 (CAS), WS4 (Axial), WS5 (manual sizing/provenance) — all require this layer.

## Open items

- **[at-ticket] `ctx` shape:** enumerate exactly what each action needs beyond the store (engineeringLimits, validation hook state, settings). Resolve when wiring the first action.
- **[deferred to WS5] provenance:** `entityActions.setSize` will later set provenance=`specified`; out of scope here (no schema change in WS0).
- **Module location: RESOLVED → `src/core/actions/entityActions.ts`.**

## Out of scope

CAS/Axial UI; provenance fields; multi-select batch writes; any new entity property.
