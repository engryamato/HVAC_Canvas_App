# WS9 Engine Divergences

Generated: 2026-06-03

Scope: Bucket A golden tests only. WS9 records live-engine divergences and does not change engine/runtime code.

## Bucket A Divergences

### WS9-AF-001 — Body Takeoff Misclassified as Tee

- Previously recorded case: branch from trunk body classified as `tee` instead of a takeoff/tap class.
- Current state: resolved in `src/core/services/automation/fittingInsertionService.ts` (`analyzeMultiDuctJunction` detects body tap as `tap`; `insertFittingAtJunction` maps it to `takeoff`). The golden regression in `src/core/services/automation/__tests__/fittingInsertionService.golden.test.ts` asserts `tap`.

### WS9-AF-002 — Rooted Source Finalizes Trunk Flow at Zero

- Previously recorded case: rooted AHU source → trunk → tee → branches.
- Current state: resolved in `src/core/services/graph/FlowPropagationService.ts`; the seed helper no longer queues zero-flow source equipment as leaf flow sources. A golden regression test in `src/core/services/graph/__tests__/propagation.golden.test.ts` asserts trunk flow equals summed branch demand.

## Todo Cases

- Near-60 degree tee/wye boundary hysteresis is intentionally `it.todo` because WS6 owns hysteresis behavior. WS9 does not lock a boundary value beyond the ratified convention that wye is `<= 60` and tee is `> 60`.
