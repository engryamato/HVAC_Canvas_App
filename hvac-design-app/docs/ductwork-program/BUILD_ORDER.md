# Build Order — Ductwork Program

**Date:** 2026-06-03 · No code yet; this is the implementation sequence once build starts.

Ordered by dependency + leverage. Each wave can overlap internally; later waves assume earlier ones merged. **Gates:** `parity` = `pnpm parity:check`; `D11` = ratify the SMACNA gauge↔pressure-class↔weight table (once, shared); `flag` = per-workstream feature flag.

## Wave 0 — Scope + foundation (start here)

| # | Ticket | Why first | Deps | Gate |
|---|---|---|---|---|
| 1 | [WS6f](tickets/WS6f-air-only-scope.md) — air-only scope | **Do before anything.** Deleting grease/specialized shrinks every schema/union/catalog the later tickets touch. | none | parity |
| 2 | [WS0](tickets/WS0-entityActions.md) — entityActions | Shared write layer; hard gate for CAS/Axial/sizing. | none | none (internal refactor) |
| 3 | [WS9](tickets/WS9-engine-test-harness.md) — engine golden tests | Start **early in parallel**. Independent; protects the WS0/WS5 refactors; its run unblocks WS6c. | none | D11 |

## Wave 1 — M1 foundation UI

| # | Ticket | Why now | Deps | Gate |
|---|---|---|---|---|
| 4 | [WS1](tickets/WS1-dedup-command-surfaces.md) — de-dup surfaces | One toolbar / one undo home; coordinate testids with WS0. | WS0 (testids) | flag |
| 5 | [WS2](tickets/WS2-inline-tool-options.md) — inline options | **Co-lands with WS1** (relocates the panels WS1 frees). Removes the modals. | WS1 | flag |

## Wave 2 — M2 interaction surfaces

| # | Ticket | Why now | Deps | Gate |
|---|---|---|---|---|
| 6 | [WS10](tickets/WS10-compat-matrix-schema-policy.md) — matrix + variant schema (policy) | Gates CAS + Axial; no deps. | none | none |
| 7 | [WS5](tickets/WS5-manual-sizing-provenance.md) — manual sizing + provenance | The constrained-sizing engine + provenance CAS reads. | WS0 | flag |
| 8 | [WS3](tickets/WS3-cas.md) — CAS | Build **after** WS0+WS10+WS5 exist as real artifacts (high churn otherwise). | WS0, WS10, WS5 | flag |

## Wave 3 — M3 estimation

| # | Ticket | Why now | Deps | Gate |
|---|---|---|---|---|
| 9 | [WS7](tickets/WS7-estimation-bom-pricing.md) — BOM/pricing correctness | Highest correctness risk; functionally independent — can run alongside Wave 2. | none (loose WS0) | flag |
| 10 | [WS8](tickets/WS8-project-mode.md) — Estimation/Design mode | Sets posture + cost-column + auto-fitting flags. | WS5, WS7 | flag |

## Wave 4 — M4 engine / HVAC geometry

| # | Ticket | Why now | Deps | Gate |
|---|---|---|---|---|
| 11 | [WS6d](tickets/WS6d-design-rendered-geometry.md) — design-vs-rendered geometry | Foundational; cutback/restore symmetry; geometry engine builds on it. | none | parity |
| 12 | [WS6e](tickets/WS6e-fitting-geometry-resolvers.md) — fitting resolvers (E1→E6) | **Largest; critical path.** Build phased. Co-ships WS4. | WS10, WS6d | parity |
| 13 | [WS4](tickets/WS4-axial-menu.md) — axial menu | **Co-ships with WS6e** (no-op without resolvers). | WS0, WS10, WS3, WS6e | flag (WS6) |
| 14 | [WS6b](tickets/WS6b-pressure-seal-gauge.md) — pressure/seal + gauge | Gauge derivation feeds weight + cost. | WS5, D11 | D11 |
| 15 | [WS6a](tickets/WS6a-surface-area-weight.md) — surface area + weight | A1 duct-area standalone; A2 needs WS6e; A3 needs WS6b. | WS6e, WS6b, D11 | D11 |
| 16 | [WS6c](tickets/WS6c-engine-correctness.md) — engine correctness | **Part 1** (hysteresis) anytime; **Part 2** backlog only **after WS9 has run**. | WS9 **run** | — |

## Critical path (longest chains)

```
WS6f → WS0 → WS10 → WS3                     (interaction)
WS6f → WS6d → WS6e → WS4                    (geometry + axial)
WS9 (run) ───────────────→ WS6c Part 2      (engine fixes)
WS5 + WS7 → WS8                             (mode)
```

## One-time gates to schedule
- **D11 ratification** (you approve the SMACNA gauge↔pressure-class↔weight table) — before WS9/WS6a/WS6b **merge**. Do it once.
- **`pnpm parity:check`** — WS6f, WS6d, WS6e (Tauri/web parity).

## First PR recommendation
**WS6f** (air-only scope). It removes code the other tickets would otherwise have to navigate, and is independent. **WS0** and **WS9** can start in parallel immediately after.

## Source PRDs
- **WS1 + WS2** (Wave 1) implement [PRD — Toolbar Redesign](PRD_Toolbar_Redesign.md) **Part 2** (inline slide-open options, remove modals). Part 1 (dynamic pill) already shipped in `TopToolBar.tsx`.
- The full design spec and surface behavior for every workstream lives in the [Architecture Plan](Ductwork_Interaction_Architecture_Plan.md); scope/sequencing decisions (D1–D11) live in the [Workstream Decomposition](Workstream_Decomposition.md). See the [README](README.md) for the complete doc map.
