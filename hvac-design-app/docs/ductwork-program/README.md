# Ductwork Program — Documentation Map

The full design + ticket set for redesigning the canvas interaction model and making the app a shippable **HVAC air-ductwork + equipment** design/estimating tool.

**Read in this order:** [Architecture Plan](#1-architecture-plan) → [Decomposition](#2-decomposition) → [Build Order](#4-build-order) → [Tickets](#3-tickets).

---

## 1. Architecture Plan
The detailed spec (Parts 0–6 + addenda). Source of truth for behavior; the decomposition wins on scope/sequencing where they differ.

- **[Ductwork Interaction Architecture Plan](Ductwork_Interaction_Architecture_Plan.md)** — verified reality, responsibility matrix, truth tables, surface specs (Toolbar/CAS/Inspector/Axial), system logic, phases, invariants, open questions, the CAS registry + Axial map (Part 6).
- **[PRD — Toolbar Redesign](PRD_Toolbar_Redesign.md)** — Part 1 (dynamic pill, shipped) + Part 2 (inline slide-open options).
- **[PRD Director Brief](PRD_Director_Brief.md)** — how to assemble a consolidated v1 PRD from the above.

## 2. Decomposition
- **[Workstream Decomposition](Workstream_Decomposition.md)** — the live program source: 11 workstreams, 4 milestones, all locked decisions (D1–D11), per-WS scope/deps/success/open-items.

## 3. Tickets
Implementation-ready specs. Status: ✓ = specced; ◐ = skeleton (partly gated).

### M1 — Foundation
| Ticket | What |
|---|---|
| [WS6f](tickets/WS6f-air-only-scope.md) ✓ | Air-only scope — delete grease/boiler/generator specialized apps (do first) |
| [WS0](tickets/WS0-entityActions.md) ✓ | `entityActions` shared write layer + registry (gates CAS/Axial) |
| [WS1](tickets/WS1-dedup-command-surfaces.md) ✓ | De-duplicate command surfaces (one toolbar, one undo home) |
| [WS2](tickets/WS2-inline-tool-options.md) ✓ | Inline slide-open tool options + remove modals (equipment converted; sticky+chip) |

### M2 — Interaction surfaces
| Ticket | What |
|---|---|
| [WS10](tickets/WS10-compat-matrix-schema-policy.md) ✓ | Shape compatibility matrix + fitting `variant` schema (policy half) |
| [WS5](tickets/WS5-manual-sizing-provenance.md) ✓ | Manual-first sizing + per-field provenance + equivalent-diameter engine |
| [WS3](tickets/WS3-cas.md) ✓ | CAS — on-demand handle, registry, hybrid edits (all entity types) |

### M3 — Estimation
| Ticket | What |
|---|---|
| [WS7](tickets/WS7-estimation-bom-pricing.md) ✓ | BOM/pricing correctness — one pipeline, strict id-join, never silent $0, gauge costing |
| [WS8](tickets/WS8-project-mode.md) ✓ | Persisted Estimation/Design mode (Estimation default) |

### M4 — Engine / HVAC
| Ticket | What |
|---|---|
| [WS9](tickets/WS9-engine-test-harness.md) ✓ | Engine golden tests (engineering-truth; start early) |
| [WS6 epic](tickets/WS6-epic.md) ✓ | Parent epic for the geometry/correctness children below |
| [WS6d](tickets/WS6d-design-rendered-geometry.md) ✓ | Design-vs-rendered geometry separation (cutback/restore symmetry) |
| [WS6e](tickets/WS6e-fitting-geometry-resolvers.md) ✓ | Fitting geometry resolvers + WS10 geometry half + §9D pipeline (largest) |
| [WS4](tickets/WS4-axial-menu.md) ✓ | Axial menu (co-ships WS6e) |
| [WS6b](tickets/WS6b-pressure-seal-gauge.md) ✓ | Pressure/seal class + gauge auto-derivation |
| [WS6a](tickets/WS6a-surface-area-weight.md) ✓ | Surface area + weight calculators |
| [WS6c](tickets/WS6c-engine-correctness.md) ◐ | Engine correctness — hysteresis (decided) + divergence backlog (post-WS9 run) |

## 4. Build Order
- **[BUILD_ORDER.md](BUILD_ORDER.md)** — the sequence to implement in, with gates (parity / D11 / flags), the critical path, and the first-PR recommendation (**WS6f**).

---

## Conventions
- **Statement tags:** `[Verified]` (code-backed), `[Decision]` (settled), `[Proposal]` (to implement), `[Open]` (needs a decision).
- **Gates:** `pnpm parity:check` (WS6f/WS6d/WS6e); **D11** gauge-table ratification (WS9/WS6a/WS6b, once); per-WS feature flags.
- **Greenfield (D5):** new schema fields apply to new projects; old projects default on load (no migration).
- **No code yet** — every workstream is specced; build starts from BUILD_ORDER.

## Related memory (cross-session)
`v1-air-ductwork-only-scope` · `program-decomposition-decisions` · `manual-duct-size-required` · `cost-estimation-gaps` · `interaction-architecture-plan` · `toolbar-tool-option-panels` · `duct-cutback-restore-asymmetry` · `core-flows-refactor-parity-gate`.
