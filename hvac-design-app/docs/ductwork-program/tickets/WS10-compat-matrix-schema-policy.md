# TICKET WS10 (policy half) — Shape compatibility matrix + fitting `variant` schema

**Milestone:** M2 (gates WS3/WS4) · **Priority:** P0 for M2 · **Effort:** ~5–7h
**Type:** Schema + data constant (no geometry) · **Status:** Ready · **Code changes:** not in this ticket — spec only

> **Scope split:** this ticket is the **policy/schema half** only — the decided matrix (D9) + the additive `variant` schema. The **geometry half** (per-pair transition geometry, resolver defaults, `connectionProfile` wiring, takeoff geometry) is **deferred to WS6** because it's coupled to the geometry engine. Do not spec geometry here.

## Context

CAS "change shape" (WS3) and the Axial menu (WS4) need two things to exist before they can be built: (1) a deterministic **shape compatibility matrix** so a shape change resolves predictably, and (2) the **schema fields** that axial leaves and CAS cycles write. This ticket lands both as data + schema, with no behavior.

**Decisions:** matrix = auto-insert transition, never block (D9); variant modeling = **namespaced `variant` object** (D-WS10-1).

## Current state (verified)

- Duct shape enum: `DuctRunShape = rectangular | round | flat_oval | flexible` (`duct-run.schema.ts` / `DuctSizePromptDialog`).
- `FittingTypeSchema` (`fitting.schema.ts:9`): `elbow_90, elbow_45, tee, reducer, cap, transition_square_to_round, reducer_tapered, reducer_eccentric, wye` — **granular**, deeply used (`DEFAULT_FITTING_PROPS` keyed by it; `fittingInsertionService`; `FittingTypeSelector`).
- Existing variant-ish fields: `angle` (`:45`), `radiusRatio` (`:52`), `transitionData` (`:91`), end types (`:39`). Provenance `autoInserted`/`manualOverride` (`:76-85`).
- **Missing entirely:** any takeoff/tap fitting; `elbowType` (radius/mitered), `radiusClass`, `vaneType`, `eccentricOffset`, `transitionAlignment`/`transitionStyle`, `capType`, `branchSide`, `hasDamper`, dedicated branch/entry angle presets.

## Proposed change

### 1. Shape compatibility matrix (data constant, D9)

`src/core/services/connectionPoints/shapeCompatibility.ts` (location [Proposal]) — pure function/table over `DuctRunShape × DuctRunShape` (`flexible` ≡ round for gating):

| from → to | same size | different size |
|---|---|---|
| rectangular → rectangular | `direct` | `reducer` |
| round → round (incl. flexible) | `direct` | `reducer` |
| flat_oval → flat_oval | `direct` | `reducer` |
| **any cross-shape** (rect↔round, rect↔flat_oval, round↔flat_oval, flexible↔rect/flat_oval) | `transition` | `transition` |

Result enum: `'direct' | 'reducer' | 'transition'` — **never `'blocked'`** (D9). The matrix returns *what fitting class is required*; it does **not** produce geometry (WS6).

### 2. Fitting `variant` object (additive, greenfield)

Add an **optional** `variant` object to `FittingProps` (`fitting.schema.ts`). Greenfield (D5): old fittings have `variant === undefined` → resolver uses defaults (WS6). Keep `fittingType` **as-is** (no coarse-enum migration — avoids a large refactor; the granular enum stays the type, `variant` carries the orthogonal axes):

```ts
variant: z.object({
  elbowType:           z.enum(['radius','mitered']).optional(),
  radiusClass:         z.enum(['R1.0','R1.5','R2.0']).optional(),
  vaneType:            z.enum(['none','single_wall','double_wall']).optional(),
  takeoffType:         z.enum(['straight_tap','conical_tap','bellmouth','spin_in','saddle']).optional(),
  eccentricOffset:     z.enum(['top','bottom','left','right']).optional(),
  transitionAlignment: z.enum(['centered','top','bottom','left','right']).optional(),
  transitionStyle:     z.enum(['straight','gored']).optional(),
  capType:             z.enum(['end_cap','plug','screen']).optional(),
  branchSide:          z.enum(['left','right']).optional(),
  branchAngleDeg:      z.number().optional(),
  entryAngleDeg:       z.number().optional(),
  hasDamper:           z.boolean().optional(),
}).optional()
```

Add `takeoff` to `FittingTypeSchema` (the only coarse type with **no** current representation). All other Part 6 concepts map to existing enum values + the `variant` axes (table below).

### 3. Part 6 key → schema reconciliation (the canonical mapping)

| Part 6 key | Canonical home |
|---|---|
| Tee vs Wye (`junctionType`) | existing `fittingType` (`tee`/`wye`) — reclassify = change `fittingType` |
| Concentric vs Eccentric (`reducerType`) | `fittingType` `reducer` + `variant.eccentricOffset` set ⇒ eccentric (deprecate relying on `reducer_eccentric` enum for new fittings) |
| Elbow Radius/Mitered (`elbowType`), `radiusClass` | `variant.elbowType` / `variant.radiusClass` (existing `radiusRatio` kept for geometry) |
| Turning vanes (`vaneType`/`hasTurningVanes`) | `variant.vaneType` (`none` ⇒ no vanes) |
| Takeoff (`takeoffType`) | new `fittingType: 'takeoff'` + `variant.takeoffType` |
| Transition alignment/style | `variant.transitionAlignment` / `variant.transitionStyle` (`transitionData` kept) |
| Cap (`capType`) | `fittingType: 'cap'` + `variant.capType` |
| Branch side/angle, entry angle, damper | `variant.branchSide` / `branchAngleDeg` / `entryAngleDeg` / `hasDamper` |

## Acceptance criteria

1. `shapeCompatibility(from, to, sizeEqual)` returns `direct|reducer|transition` for all 16 pairs; `flexible` resolves as round; never `blocked`.
2. `FittingProps.variant` exists (optional) with the keys above; `fittingType` gains `takeoff`; old fittings validate with `variant: undefined`.
3. Reconciliation table is encoded/documented so CAS/Axial know the canonical write target for each Part 6 leaf.
4. No behavior change: nothing reads `variant` yet (resolvers are WS6); existing fitting tests pass unchanged.
5. `pnpm typecheck` + zod parse of existing fixtures clean.

## Testing plan

| Layer | What | Count |
|---|---|---|
| Unit | matrix returns correct class for all 16 shape pairs (× size-equal/diff) | +2 |
| Unit | `FittingProps` parses with and without `variant`; `takeoff` type valid | +2 |
| Regression | existing fitting schema fixtures still parse | — |

## Rollback

Additive schema + a pure constant. **No feature flag** (nothing consumes it yet). Revert = remove the field + file. Zero runtime risk.

## Files reference

| File | Change |
|---|---|
| `src/core/services/connectionPoints/shapeCompatibility.ts` | **new** — matrix constant + lookup |
| `src/core/schema/fitting.schema.ts:9,44` | add `takeoff` to enum; add optional `variant` object |
| `../Ductwork_Interaction_Architecture_Plan.md` Part 6 | reconciliation table is the source for CAS/Axial write targets |

## Dependencies & blocks

- **Depends on:** none.
- **Blocks:** WS3 (CAS shape-change uses the matrix), WS4 (Axial writes `variant` keys).
- **Hand-off to WS6 (geometry half):** per-pair transition geometry, resolver behavior when `variant` is set/absent, takeoff geometry, `connectionProfile` abstraction.

## Open items

- Variant modeling: **RESOLVED — namespaced `variant` object**; `fittingType` stays granular (no coarse-enum migration).
- **[at-ticket]** whether to formally deprecate `reducer_eccentric`/`reducer_tapered`/`transition_square_to_round` enum values in favor of `fittingType` + `variant` (greenfield: keep them valid, prefer `variant` for new fittings).
- **[deferred → WS6]** all geometry, resolver defaults, `connectionProfile` wiring, transition-availability per pair.

## Out of scope

Geometry/resolvers (WS6); CAS/Axial UI (WS3/WS4); writing `variant` from any surface; provenance (WS5).
