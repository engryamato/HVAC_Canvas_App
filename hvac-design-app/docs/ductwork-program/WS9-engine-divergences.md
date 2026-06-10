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

## Resolved Todo Cases

- Near-60 degree tee/wye boundary hysteresis is no longer `it.todo`. WS6c owns the behavior and the blocking golden suite now asserts the ratified 55/65 deadband in `src/core/services/automation/__tests__/fittingInsertionService.golden.test.ts`: prior wye/tee stays sticky inside 55-65 degrees, clear cases commit below 55 and above 65, and no-prior classification falls back to the 60 degree cutoff.
