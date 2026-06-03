# EPIC WS6 — HVAC system logic & geometry correctness

**Milestone:** M4 · **Status:** Epic — children specced individually · **Code changes:** none until all docs done

WS6 is too large for one ticket. It is decomposed into children. Some are **decided now** (scope settled by Parts 5/6 + program decisions); the **engine-correctness fixes** wait for WS9's golden run to produce the real divergence list. WS4 (Axial) co-ships with the geometry child (WS6e).

## Children

| Child | Scope | Status | Key deps |
|---|---|---|---|
| **WS6a** | Surface area + weight (duct + fitting developed-area) | **decided** (ticket `WS6a-surface-area-weight.md`) | WS6b (gauge), WS6e (fitting geom) for parts 2–3 |
| **WS6b** | Pressure/seal-class schema + gauge auto-derivation (liner/wrap already in schema; sizing→WS6c) | decided ✓ specced (`WS6b-pressure-seal-gauge.md`) | WS5, D11 table |
| **WS6c** | Engine-correctness: Part 1 hysteresis (decided ✓) + Part 2 divergence backlog (post-WS9) | **skeleton specced** (`WS6c-engine-correctness.md`); Part 2 gated on WS9 run | WS9 run |
| **WS6d** | Design-vs-rendered geometry separation (cutback/restore symmetry) | **decided** (ticket `WS6d-design-rendered-geometry.md`) | none (foundational; parity gate) |
| **WS6e** | Fitting geometry resolvers + WS10 geometry half (transition-per-pair, tap/offset/boot, elbow-type+vane, `connectionProfile`) + §9D pipeline | decided ✓ specced (`WS6e-fitting-geometry-resolvers.md`) — **largest; all-in-one, phased E1–E6** | WS10, WS6d; co-ships WS4 |
| **WS6f** | ~~Grease/combustion confirmation~~ → **REPLACED: narrow v1 to air-only, delete specialized apps** (`WS6f-air-only-scope.md`) — moves to **M1** | **decided** ✓ specced | none (do early) |

## Decisions captured for the children

- **WS6a coverage:** duct **+ fitting developed-area** (D-WS6a-1).
- **WS6d approach:** **design-vs-rendered geometry separation** (D-WS6d-1) — the deeper refactor; cut becomes a render concern.

## Sequencing within M4

```
WS9 (golden run) ─→ WS6c (divergence fix-list, specced after WS9)
WS6d (geometry separation) ─→ WS6e (fitting resolvers) ─→ WS4 (axial, co-ship)
WS6b (pressure/seal + gauge) ─→ WS6a part 3 (weight)
WS6e ─→ WS6a part 2 (fitting developed-area)
WS6f (grease confirm) — independent
```

## What is specced now vs later

- **Now (this move):** WS6a, WS6d (the two answered). Then WS6b, WS6e, WS6f (decided, in following turns).
- **Later (post-WS9):** WS6c — the engine-correctness fix-list, written once WS9's golden suite reports actual divergences (avoids speculative fixes).

## Related
- `../Ductwork_Interaction_Architecture_Plan.md` §6/§14.3/§27/§28/§29 · `../Workstream_Decomposition.md`
- Memory: `[[duct-cutback-restore-asymmetry]]`, `[[core-flows-refactor-parity-gate]]`, `[[cost-estimation-gaps]]`.
