# PLAN — Ductwork Program Wrap-Up + Auto-Fitting Enable & Improve

**Date:** 2026-06-10 (rev 2) · **Status:** Plan only — no code changes made.
**Goal:** Close out the ductwork program (WS0–WS10) and finish with auto-fitting **always on by default (user-overridable)**, **cutback verified on**, and the auto-fitting UX improved.

**Ratified decisions (2026-06-10):**

- **D-AF-1 — RESOLVED: always on.** Auto-fitting defaults ON in **both** Design and Estimation modes; the user can manually override it (persisted per project). Supersedes the WS8 "Estimation → off" default.
- **D-AF-2 — RESOLVED: defer.** The `ITopoStrategy` strategy-architecture refactor moves to v1.1; the tested monolithic `FittingInsertionService` stays.
- **D-AF-3 — NEW: cutback must be on.** Duct cutback (trim duct ends to the fitting/equipment port opening so runs read visually seamless) must remain enabled in the shipped default.

---

## Part A — Investigation: what auto-fitting is (verified against code)

Auto-fitting is the system that analyzes duct geometry at junctions and automatically inserts/updates/removes the correct fittings (elbows 45°/90°, tees, wyes, crosses, transitions, caps, taps/takeoffs) so the user doesn't place them manually.

**Core engine** — `src/core/services/automation/fittingInsertionService.ts`

- `analyzeJunction` / `analyzeMultiDuctJunction` — classifies junction type from angles + size/shape changes. Includes the WS6c Part 1 tee/wye hysteresis deadband (wye < 55°, tee > 65°, sticky in between) and the WS9-AF-001 body-tap → `takeoff` fix.
- `planAutoInsertForDuct` — plan fittings for a newly drawn duct.
- `buildReRunPlan` / re-run execution — idempotent re-run over the whole canvas: insert/update/remove with signatures, **preserving manual overrides** (conflicts reported, not clobbered).

**Trigger points**

| Where | Behavior |
|---|---|
| `DuctTool.ts` (duct finalize, ~line 680) | Auto-inserts fittings when a new duct lands — only if `isAutoFittingEnabled()` |
| `SelectTool.ts` (`rerunAutoFittings`, line 710) | Re-runs after duct-run move/edit — same gate |
| `ValidationDashboard.tsx` (line 360) | Explicit "Re-run auto-fitting" button + insert/update/remove/conflict counts — always available |

**Enablement — 3-layer resolution** (`DuctTool.isAutoFittingEnabled()`):

1. Programmatic override (`setAutoFittingEnabled`) — currently **only called from tests; no UI toggle exists**.
2. WS8 project mode default (`isAutoFittingDefaultEnabled()`): Design → on, Estimation → off — gated by `WS8_PROJECT_MODE`; returns `null` when that flag is off.
3. Legacy env `NEXT_PUBLIC_ENABLE_AUTO_FITTING` — `false` in both `.env` examples (`true` in the local `.env.local`).

**Correction (rev 2):** the WS flags in `src/core/flags/featureFlags.ts` are **default-ON** — a flag is disabled only when its env var is exactly `'false'`. So `WS8_PROJECT_MODE` is already active, layer 2 always returns a non-null answer, and **layer 3 is dead code in practice** — including the `ENABLE_AUTO_FITTING=true` already sitting in `.env.local`, which is silently shadowed.

**Net effect today: auto-fitting is OFF by default** because new projects default to **Estimation** mode (mode default = off), regardless of the legacy env. Only the dashboard re-run button fires it. This is exactly what D-AF-1 reverses.

**Also found:** `src/features/canvas/auto-fitting/types.ts` defines a full topology-strategy architecture (`TopologyContext`, `ITopoStrategy`, `FittingPreview` ghost previews with valid/invalid coloring) that is **referenced nowhere else** — a designed-but-unimplemented improvement path.

**Verification run:** `fittingInsertionService.test.ts` (19), `autoFittingLifecycle.integration.test.ts` (2), `projectMode.test.ts` (12) — **33/33 pass**. Golden tests exist (`fittingInsertionService.golden.test.ts`, `propagation.golden.test.ts`); e2e at `e2e/03-entity-creation/tauri-offline/uj-ec-auto-fitting.spec.ts`.

---

## Part A2 — Investigation: cutback (D-AF-3, verified against code)

Cutback = trimming a connected duct endpoint exactly onto the fitting/equipment **port opening** so the run terminates at the fitting body instead of running beneath it — the visually-seamless join.

- **Engine:** `applyDuctEndpointCutback` in `src/features/canvas/services/connectionPoints/ductCutbackService.ts` (PR-8). Snaps the moving endpoint to the opening, holds the far end, recomputes `installLength`/segments/transform. Idempotent.
- **Trigger:** runs **unconditionally** in the committed reconcile pipeline — `ConnectionReconciliationService.reconcile()` (called from `entityStore` on every commit) applies cutback for draw-to-port, drop-on-duct, and re-trim on fitting/duct move. **No feature flag and no env var gates cutback itself.**
- **WS6d half:** the symmetric *restore* (orphaned duct re-extends to its authored design centerline when its fitting is removed) and WS6e E4 takeoff geometry are behind `WS6D_DESIGN_GEOMETRY` — which is **default-ON** like all WS flags.
- Tests: `ductCutbackService.test.ts`, `reconcileDesignRestore.test.ts`, `ws6eRecomputePipeline.test.ts`, `autoFittingLifecycle.integration.test.ts`.

**Conclusion: cutback is already on.** The plan's job is to *keep* it on and protect it: ratify `WS6D_DESIGN_GEOMETRY=on` as the shipped default (then retire the flag), and add an explicit regression gate that auto-inserted fittings produce cut-back, seamless ducts — since D-AF-1 makes auto-fitting + cutback interact on every duct draw for every user.

---

## Part B — Program status: what remains to wrap up

All workstreams WS0–WS10 (incl. WS6a–f) are specced **and implemented** per README/BUILD_ORDER. Verified open items:

| ID | Item | Source | State |
|---|---|---|---|
| FU-1 | **WS7-FU-001** — reconcile legacy `csv.ts generateBillOfMaterials` to the canonical BOM pipeline (pure formatter over `BOMItem[]`) | WS7-followups.md | **Deferred** (reverted once on live-output fidelity regression) |
| FU-2 | **WS6e post-WS4 detection tail** | README §Implementation state | Open, scope in WS6e ticket |
| FU-3 | Feature-flag retirement: WS-flags (`WS7_BOM_PRICING`, `WS8_PROJECT_MODE`, …) still gating shipped behavior | flags/featureFlags.ts | Open |
| FU-4 | Auto-fitting default OFF; no user-facing toggle; strategy architecture unimplemented | Part A | Open — this plan's headline |
| FU-5 | WS9 `it.todo` — near-60° tee/wye boundary case (WS6 owns hysteresis) | WS9-engine-divergences.md | Open (covered by W3 tests) |

---

## Part C — The wrap-up plan

### Wave 1 — Auto-fitting always on (D-AF-1; small, do first)

1. **Change `isAutoFittingDefaultEnabled()`** (`src/core/projectMode/projectMode.ts`) to return `true` for **both** modes (Design and Estimation). This supersedes the WS8 "Estimation → off" decision — record as **D12** in `Workstream_Decomposition.md` and update the WS8 ticket note.
2. **Persisted per-project override.** Add `autoFittingEnabled: boolean` (default `true`) to the persisted project/calculation settings (greenfield per D5: old projects load → default `true`). Resolution order becomes: per-project setting → session override (`setAutoFittingEnabled`) for tests/tools → default `true`. The mode no longer drives it.
3. **Retire the dead legacy env path.** Remove the `NEXT_PUBLIC_ENABLE_AUTO_FITTING` fallback from `DuctTool.isAutoFittingEnabled()` and from both `.env` examples + `.env.local` (it is already shadowed by the WS8 layer — see Part A correction). One enablement story, not three.
4. **Update tests:** projectMode unit tests asserting Estimation→off flip to →on; add a default-on assertion for new projects.

**Gate:** full unit/integration + golden suites green; e2e `uj-ec-auto-fitting.spec.ts` passes **with no env override** (proves default-on).

### Wave 2 — User-facing control + cutback protection (D-AF-1 + D-AF-3)

5. **Toolbar/Inspector toggle** bound to the new persisted `autoFittingEnabled` setting (replacing the test-only override as the user path). Surface state visibly (toolbar pill or chip) so users know ducts will auto-fit on draw.
6. **Cutback regression gate (D-AF-3).** Cutback is already always-on in the reconcile pipeline (Part A2) — protect it: (a) ratify `WS6D_DESIGN_GEOMETRY=on` as the shipped default and schedule the flag's retirement (Wave 4); (b) add an integration/e2e assertion that a duct drawn into an auto-inserted fitting ends **exactly at the port opening** (no underlap/overlap) and re-extends on fitting delete (restore symmetry). This is the auto-fitting × cutback interaction every user now hits by default.
7. **No cutback toggle.** Cutback stays unconditional (it is correctness, not preference); only verify, don't gate.

### Wave 3 — Improve auto-fitting

Ranked by value/risk:

8. **Ghost preview (highest UX value).** Implement `FittingPreview` from `auto-fitting/types.ts`: render the planned fitting as a green/red ghost while drawing a duct, with tooltip + invalid-reason. The types and the planner (`planAutoInsertForDuct`) already exist; this is wiring, not new math. Preview should reflect post-cutback geometry so the ghost matches the committed seamless result.
9. **Conflict resolution UX.** `buildReRunPlan` already reports `manual_override_conflicts_with_desired_auto_fitting`; the dashboard only counts them. Add a per-conflict review list (keep mine / use auto).
10. **Strategy refactor — DEFERRED to v1.1 (D-AF-2, ratified).** The `ITopoStrategy` migration happens only when new topology rules are planned; the monolithic service is tested and working. Keep `types.ts` as the contract.
11. **WS9 todo:** add golden coverage for the near-60° deadband boundary (asserts the 55/65 hysteresis) and remove the `it.todo`.

### Wave 4 — Program close-out (parallel to Waves 2–3)

12. **WS7-FU-001** with the safety rail it asked for: snapshot current CSV output as goldens **first**, then reduce `csv.ts` to a formatter over canonical `BOMItem[]`; only allowed diffs = gauge-driven line splits + $0→Unpriced.
13. **WS6e detection tail** per the WS6e ticket's deferred section.
14. **Flag retirement:** all WS flags are already default-ON — soak, then delete the dead `'false'` branches (incl. `WS6D_DESIGN_GEOMETRY` per Wave 2 and `WS8_PROJECT_MODE`'s auto-fitting hook, replaced by the persisted setting). The legacy auto-fitting env var is removed in Wave 1.
15. **Docs close:** update README/BUILD_ORDER status marks, mark follow-ups resolved, record D-AF-1/2/3 (D12) in Workstream_Decomposition decisions.

### Verification gates (every wave)

`pnpm typecheck` · `pnpm test` (incl. goldens) · `pnpm parity:check` where touched · e2e auto-fitting spec · WS7 golden CSV snapshots for Wave 4.

---

## Open decisions before implementation

None — D-AF-1 (always on, user-overridable), D-AF-2 (defer strategy refactor to v1.1), and D-AF-3 (cutback stays on, protected by regression gate) were all ratified 2026-06-10. Implementation can start at Wave 1.

*Orchestrator phases run: context distillation, gap analysis, research (code-verified), brainstorm (enablement options), specialist review (Requirements, Logic Validator, Architecture), synthesis. Skipped: intent confirmation (task unambiguous).*
