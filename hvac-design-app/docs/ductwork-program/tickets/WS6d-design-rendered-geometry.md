# TICKET WS6d — Design-vs-rendered geometry separation (cutback/restore symmetry)

**Epic:** WS6 · **Milestone:** M4 · **Priority:** P0 (foundational; fixes a known correctness bug) · **Effort:** ~16–24h (refactor + parity)
**Type:** Architecture refactor · **Status:** Ready · **Code changes:** none until all docs done
**Gate:** must pass `pnpm parity:check` (`[[core-flows-refactor-parity-gate]]`).

## Context

Ducts get **cut** when a fitting is inserted but are not symmetrically **un-cut** when the fitting goes away, and junction detection trusts the cut geometry rather than the authored centerline (`[[duct-cutback-restore-asymmetry]]`). Root cause: there is **one** geometry on a duct (its `startPoint`/`endPoint`/`segments`), and cutting mutates it in place — so the original intent is lost. The fix is to separate the **authored design centerline** (source of truth) from the **rendered geometry** (derived, cut for display). Then restore-on-detach is free: re-derive rendered geometry from the design centerline.

## Decision (locked)

Approach = **design-vs-rendered separation** (D-WS6d-1) — the deeper refactor; cut becomes a pure render concern.

## Current state (verified)

- `ductCutbackService.ts:30 applyDuctEndpointCutback` mutates `props.startPoint`/`endPoint`/`installLength`/`segments` in place on fitting connection.
- `ConnectionReconciliationService.ts:63` (`restoreDuctsWithMissingConnections` / `restoreDuctToDesign`) tries to restore after detach — the asymmetric half.
- Junction/fitting detection (`fittingInsertionService`, `ductConnections`) reads the (cut) `startPoint`/`endPoint`.
- `duct.schema.ts` stores a single `startPoint`/`endPoint`/`segments`; no authored-vs-rendered distinction.

## Proposed change

### 1. Authored design centerline (source of truth)
Add a **design centerline** to duct/duct-run props — the authored endpoints/path the user drew (`designStartPoint`/`designEndPoint` or `designPath`). This is what the user owns; it is **never** mutated by cutting.

### 2. Rendered geometry = derived
The displayed `startPoint`/`endPoint`/`segments` become **derived** from `designCenterline − fitting cutbacks`, recomputed idempotently whenever fittings change. `ductCutbackService` computes the *rendered* geometry from the design centerline; it does not mutate the design centerline.

### 3. Consumers read by intent
- **Junction/fitting detection, length, BOM, calculations** read the **design centerline** (stable intent).
- **Canvas render, hit-testing** read the **rendered (cut)** geometry.
- Document the rule per consumer so none accidentally reads the wrong one.

### 4. Symmetry falls out
- Attach fitting → recompute rendered (cut). Detach fitting → recompute rendered (re-extends to the design centerline). No special restore path needed; `restoreDuctToDesign` becomes "re-derive rendered."

### 5. Greenfield load (D5)
Old ducts have no design centerline → on open, **lazy-init** `designCenterline = current authored points`. No migration; mixed-version files self-heal on first load.

## Acceptance criteria

1. A duct has an authored design centerline that cutting never mutates.
2. Rendered geometry is derived idempotently from design centerline − fitting cutbacks (recompute twice = same result).
3. Inserting then **removing** a fitting restores the duct to its exact authored centerline (the bug is fixed; symmetric).
4. Junction detection, length, and BOM read the design centerline; canvas render reads the rendered geometry — verified per consumer.
5. Old projects open with `designCenterline` lazy-initialised from current points (no crash, no migration).
6. **`pnpm parity:check` passes** (Tauri/web parity).
7. No regression in existing connection/cutback/fitting tests (update where they asserted the old single-geometry model).

## Testing plan

| Layer | What | Count |
|---|---|---|
| Unit | cut is idempotent; design centerline unchanged after cut | +2 |
| Unit | attach→detach fitting → duct == authored centerline (symmetry) | +2 |
| Unit | junction detection uses design centerline (not cut) | +2 |
| Unit | lazy-init design centerline for a legacy duct on load | +1 |
| Integration | render uses cut geometry; BOM/length use design | +1 |
| Parity | `pnpm parity:check` green | gate |

## Rollback

Behind the WS6 flag. Larger blast radius than other tickets — revert restores the single-geometry model. Keep the flag until parity + connection tests are proven across a full session.

## Files reference

| File | Change |
|---|---|
| `src/core/schema/duct.schema.ts` / `duct-run.schema.ts` | add `designStartPoint`/`designEndPoint` (or `designPath`) |
| `src/features/canvas/services/connectionPoints/ductCutbackService.ts:30` | compute rendered geometry from design centerline; do not mutate design |
| `src/core/services/graph/ConnectionReconciliationService.ts:63` | "restore" becomes "re-derive rendered" |
| `src/core/services/automation/fittingInsertionService.ts`, `ductConnections.ts` | junction detection reads design centerline |
| `src/core/services/bom/bomGenerationService.ts`, length calcs | read design centerline |
| canvas render / hit-test | read rendered geometry |

## Dependencies & blocks

- **Depends on:** none (foundational).
- **Blocks/feeds:** WS6e (fitting resolvers build on the clean geometry model); WS6a-A2 (fitting developed-area); cleaner junction detection for the whole engine.

## Open items

- **[at-ticket]** design representation: two endpoints vs a `designPath` polyline (runs with bends).
- **[at-ticket]** which exact consumers must switch to design vs rendered — produce the per-consumer audit at ticket start (grep all readers of `startPoint`/`endPoint`).
- **[at-ticket]** interaction with WS5 length provenance (a user-specified length pins the design centerline length).

## Out of scope

Fitting geometry resolvers (WS6e); the WS9 divergence backlog (WS6c); metric.
