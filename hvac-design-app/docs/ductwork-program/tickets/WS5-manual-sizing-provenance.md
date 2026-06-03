# TICKET WS5 — Manual-first sizing + per-field provenance + equivalent-diameter engine

**Milestone:** M2 · **Priority:** P0 · **Effort:** ~14–20h (provenance + constrained-recompute engine)
**Type:** Feature + engine · **Status:** Ready · **Code changes:** not in this ticket — spec only

## Context

SizeWise is a cost-estimation + design tool, so a user must be able to type exact sizes and have them **protected**, while the system fills the rest. This ticket adds **per-field provenance** (`default | computed | specified`) and a **constrained sizing engine** that maintains the equivalent-diameter relationship across rectangular / flat-oval / round duct while never overwriting user-specified fields. (Deps WS0; greenfield D5; `[[manual-duct-size-required]]`.)

## Decisions (locked this ticket)

- **Storage = namespaced `provenance` object** per entity props (consistent with WS10's `variant`); per-field, 3 states.
- **Coverage v1 = size + gauge:** `width`, `height`, `diameter`, `equivalentDiameter`, `gauge`.
- **Field defaults:** rectangular duct `height = 8"` (`default`); flat-oval duct `height = 8"` (`default`); all other size values **computed** unless the user enters them.

## Current state (verified)

- Manual size fields: `DuctToolOptionsPanel.tsx` (`useDuctDrawSettings`/`setDuctDrawSettings`, integer `step=1`), `DuctInspector.tsx` (`:613/627/639`), `DuctRunInspector.tsx`.
- Equivalent diameter EXISTS: `engineeringCalculator.ts:64 calculateEquivalentDiameter`, `getEquivalentDiameter(duct)` used in `CalculationEngineRegistry`/`entityCalculationRuntime`. `DuctInspector.handleShapeChange:323-377` already does equivalent-round conversion + remembered dimensions.
- Auto-size: `parametricUpdateService.autoSizeDuctToVelocity:291-323` overwrites dimensions and sets the **inert** `autoSized` flag (`duct.schema.ts:121`) — **no guard** against clobbering user values.
- Standard sizes EXIST but only in auto-size: `autoSizingService.ts:44-53` (`STANDARD_ROUND_SIZES`, `STANDARD_RECTANGULAR_INCREMENTS`); manual entry does not snap.
- No per-property provenance today (only fitting `autoInserted`/`manualOverride`).

## Proposed change

### 1. Provenance model
Add optional `provenance` to duct props:
```ts
provenance: z.object({
  width:              z.enum(['default','computed','specified']).optional(),
  height:             z.enum(['default','computed','specified']).optional(),
  diameter:           z.enum(['default','computed','specified']).optional(),
  equivalentDiameter: z.enum(['default','computed','specified']).optional(),
  gauge:              z.enum(['default','computed','specified']).optional(),
}).optional()
```
Greenfield: old ducts have `provenance === undefined` → treated as `computed` (system may recalc).

### 2. Per-field rules
- A field the user enters → `specified`. The system **must never overwrite a `specified` field**.
- The system may write only `default` or `computed` fields.
- **Clearing** a `specified` field returns it to system-calculated (`computed`).
- Provenance is **per field, not per duct.** Setting Height `specified` must NOT freeze the duct — Width/equivalentDiameter (still `computed`) keep recalculating.

### 3. Constrained sizing engine (the new logic)
On any `specified`-field change, recompute the remaining `computed` fields to maintain the equivalent-diameter relationship across rect/flat-oval/round (via `calculateEquivalentDiameter`). Worked example (from spec):
```
Before:  Height = 8"  (default),  Width = 12" (computed)
User:    Height = 10" (specified)
After:   Height = 10" (specified), Width = recalculated (computed), equivalentDiameter = computed
```
If **all** size fields are `specified` (e.g. estimator types W and H from drawings) → the system computes nothing for them; `equivalentDiameter` is derived (`computed`) from the specified W×H. This is how manual-first/takeoff is honored.

### 4. Auto-overwrite guard
`autoSizeDuctToVelocity` and any recompute write **only** `default`/`computed` fields; `specified` fields are skipped. Replaces the inert `autoSized` flag with real provenance.

### 5. Equipment-driven sizing
When equipment is placed, compute the appropriate duct diameter from the equipment specs and update `computed`/`default` size fields (respecting `specified`), maintaining the equivalent-diameter relationship.

### 6. Manual entry UX
Manual size inputs gain a **standard-nominal-size** picker (reuse `STANDARD_ROUND_SIZES`/`STANDARD_RECTANGULAR_INCREMENTS`) and **fractional-inch** entry. Visual distinction: render `specified` vs `computed` vs `default` differently (e.g. bold/accent for specified, muted for computed) so the cost basis is legible.

### 7. entityActions integration (WS0)
`entityActions.setSize` is the single write path: marks the edited field `specified`, triggers the constrained recompute, and commits as one undo group.

## Acceptance criteria

1. `provenance` object exists (optional, per-field, 3 states); old ducts parse with it undefined.
2. Rect/flat-oval `height` defaults to 8" (`default`); other size fields start `computed`.
3. A user-entered field becomes `specified` and is never overwritten by auto-size, recompute, or equipment-driven sizing.
4. Changing a `specified` field recomputes the remaining `computed` fields to maintain equivalent diameter (worked example passes); the duct is **not** frozen.
5. Clearing a `specified` field returns it to `computed` (system resumes calculating).
6. All-specified size → system computes nothing for those fields; equivalentDiameter derived from them.
7. Manual entry offers standard sizes + fractional inches; specified/computed/default are visually distinct.
8. `entityActions.setSize` sets provenance + recompute in one undo group.
9. `pnpm typecheck` clean; existing sizing/inspector tests pass.

## Testing plan

| Layer | What | Count |
|---|---|---|
| Unit | provenance transitions: default→specified on edit; specified→computed on clear | +2 |
| Unit | guard: auto-size skips `specified`, writes `computed`/`default` | +2 |
| Unit | constrained recompute: set Height specified → Width/eqDia recompute, eqDia relationship held | +3 |
| Unit | all-specified W×H → eqDia derived, nothing overwritten | +1 |
| Unit | equipment placement sizes duct, respects specified | +1 |
| Unit | manual entry snaps to standard sizes; fractional accepted | +2 |
| Integration | edit via `entityActions.setSize` → one undo entry + provenance set | +1 |

## Rollback

**[Decision] Behind a WS5 feature flag.** Off → fall back to the current (unguarded) sizing; provenance ignored. Greenfield, no migration. Revert = drop flag + remove the field.

## Files reference

| File | Change |
|---|---|
| `src/core/schema/duct.schema.ts` / `duct-run.schema.ts` | add optional `provenance` object; retire reliance on inert `autoSized` |
| `src/core/actions/entityActions.ts` (WS0) | `setSize` sets `specified` + triggers constrained recompute |
| `src/core/services/parametric/parametricUpdateService.ts:291-323` | guard: never write `specified`; equipment-driven sizing path |
| `src/core/services/calculations/engineeringCalculator.ts:64` | consumed — `calculateEquivalentDiameter` for the constraint |
| `src/core/services/automation/autoSizingService.ts:44-53` | standard-size lists reused for manual snapping |
| `src/features/canvas/components/DuctToolOptionsPanel.tsx` / `Inspector/DuctInspector.tsx` | standard-size picker + fractional entry + provenance styling |

## Dependencies & blocks

- **Depends on:** WS0 (`entityActions.setSize` is the write path). Hard.
- **Feeds:** WS3 (CAS shows provenance + edits via entityActions), WS8 (project mode sets the initial provenance posture), WS6 (gauge auto-derivation will write `gauge` as `computed`, respecting `specified`).

## Open items

- **[→ WS8]** initial provenance **posture** per project mode: Estimation may start more fields awaiting manual entry; Design may start more `computed`. WS5 ships the engine; WS8 tunes the starting state.
- **[at-ticket] sizing TARGET source** for `computed` fields: the constraint "maintain equivalent diameter" needs a target — velocity target (`autoSizingService`), equipment-driven, or hold last-known eqDia. Define which drives recompute.
- **[at-ticket] gauge provenance:** WS5 reserves `provenance.gauge`; the gauge **auto-derivation** (size+pressure-class) is WS6 — WS5 only protects a user-set gauge.
- **[at-ticket]** fractional granularity (½"/¼") + confirm standard-size list is the single source.
- **[boundary note]** the equivalent-diameter **formula** is engineering (WS6/WS9 golden tests); WS5 owns the provenance + recompute **orchestration**, not the formula.

## Out of scope

Gauge auto-derivation (WS6); pressure/seal class (WS6); persisted project mode (WS8); CAS/Axial UI (WS3/WS4); the equivalent-diameter formula itself (exists; WS9 tests it).
