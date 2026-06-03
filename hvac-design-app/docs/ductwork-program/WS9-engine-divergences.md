# WS9 Engine Divergences

Generated: 2026-06-03

Scope: Bucket A golden tests only. WS9 records live-engine divergences and does not change engine/runtime code.

## Bucket A Divergences

### WS9-AF-001 — Body Takeoff Misclassified as Tee

- Case: branch taken from the body of a trunk duct.
- Expected truth: tap/takeoff class, not a tee, because a body takeoff is not a centerline three-way tee/wye junction.
- Observed engine behavior: `fittingInsertionService.analyzeMultiDuctJunction` / `classifyThreeWayJunction` can only return `tee` or `wye` for three connections; the skipped golden case observes `tee`.
- Suspected location: `src/core/services/automation/fittingInsertionService.ts`, `classifyThreeWayJunction` and fitting type schema support.
- Follow-up: WS6 fitting geometry / WS7 BOM classification should add a takeoff/tap class and unskip the golden test.

### WS9-AF-002 — Rooted Source Finalizes Trunk Flow at Zero

- Case: small rooted tree (AHU source → trunk duct → tee → two branch ducts → diffuser/grille terminals). The trunk duct upstream of the tee should carry the sum of branch demand (300 + 200 = 500 CFM).
- Expected truth: trunk CFM = summed downstream terminal demand = 500.
- Observed engine behavior: `FlowPropagationService.calculateFlows` queues the degree-1 source equipment as a leaf with 0 accumulated flow; it peels into the trunk duct and finalizes it at 0 CFM before downstream demand propagates up through the tee. Branch ducts (300, 200) are correct.
- Suspected location: `src/core/services/graph/FlowPropagationService.ts` initial-queue seeding (lines ~76-87) — source equipment with no terminal demand should not seed trunk propagation.
- Follow-up: WS6 propagation work should fix leaf-peeling order so sources never finalize trunk flow; unskip `propagation.golden.test.ts` "accumulates summed branch demand on the trunk".

## Todo Cases

- Near-60 degree tee/wye boundary hysteresis is intentionally `it.todo` because WS6 owns hysteresis behavior. WS9 does not lock a boundary value beyond the ratified convention that wye is `<= 60` and tee is `> 60`.
