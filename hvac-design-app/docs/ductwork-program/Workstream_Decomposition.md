# Program Decomposition — SizeWise Ductwork Interaction & Estimation

**Status:** Decision-captured, ticket-shaping in progress
**Date:** 2026-06-02 · **Branch:** codex-fitting-restore-rerun
**Source spec:** `Ductwork_Interaction_Architecture_Plan.md` (Parts 0–6). This document is the **live program source** for scope, sequencing, and decisions; where it conflicts with the plan, **this document wins** and the plan should be trimmed to match.

## Program decisions (locked)

| # | Decision | Rationale / implication |
|---|---|---|
| D1 | **Scope = entire program** (all 11 workstreams) | Nothing deferred; managed as one decomposed program. |
| D2 | **First = WS0 + WS1** (foundation) | `entityActions` + de-dup unblock everything; lowest risk. |
| D3 | **Full CAS + Axial v1** (Part 6 registry + full shape-gated map) | Pulls **WS10** (compatibility matrix + schema reconciliation) forward as a hard dependency. |
| D4 | **Estimation (WS7) = separate workstream**, after foundation | Keeps interaction and cost cleanly separated. |
| D5 | **Schema = greenfield, NO migration** | New fields apply to new projects only. **Implication:** existing saved projects do not carry new fields; on open they default (provenance=`unknown`, mode=default, fittings lack variant keys → resolver defaults). Old files must still **load without crashing**; bump a schema version and gate new readers. **Risk to accept:** previously-saved data has no new-field values. |
| D6 | **Engine oracle = engineering-truth golden set** (SMACNA-correct expected values) | WS9 catches existing engine bugs (flat-oval area, gauge), not just locks behavior. Higher authoring cost; needs reference values. |
| D7 | **Desktop only — touch dropped** | Remove press-hold/touch rows (§23) and 44px touch targets (§22). Axial = **right-click only**; CAS hit target 32px. Shrinks WS3/WS4. |
| D8 | **Phased-milestone release** | M1 foundation → M2 interaction surfaces → M3 estimation → M4 engine/HVAC. Coupling allowed within a milestone; each milestone is a release event. |
| D9 | **Shape compatibility = auto-insert transition, never block** | Same-shape/same-size → direct; same-shape/diff-size → reducer; **any cross-shape → auto-insert Transition + reconnect**; `flexible` treated as round. No cross-shape change is ever blocked. (Resolves WS10 matrix.) |
| D10 | **BOM pricing joins by `catalogItemId`** | Field already exists on all placed-entity schemas (optional). Thread it onto BOM line items; entities lacking it → **Unpriced**, never name-fallback-to-$0. (Resolves WS7 join-key.) |
| D11 | **WS9 truth values: assistant-derived from published standards** | Golden set encoded from SMACNA/ASHRAE formulas (areas, gauge weights, angle rules); **the gauge↔pressure-class↔weight table is ratified by the user before WS9 merges** (review gate, not a start blocker). |

**Statement tags used throughout:** `[Decision]` settled · `[Proposal]` to implement · `[Open]` needs a decision (resolve at the noted time, not silently).

| D12 | **Auto-fitting defaults on in every project mode; users can override per project** | Supersedes the WS8 Estimation-off auto-fitting default. `projectMode` still drives WS5 sizing posture and WS7 cost-column defaults; auto-fitting is a persisted `autoFittingEnabled` project setting with legacy projects defaulting to `true`. |
| D13 | **Auto-fitting wrap-up ratified** | D-AF-1: auto-fitting is default-on and user-overridable. D-AF-2: topology strategy refactor is deferred to v1.1; the tested monolithic service remains canonical. D-AF-3: cutback/restore geometry is correctness behavior and stays unconditional. |

## Milestone map

| Milestone | Workstreams | Gate to exit |
|---|---|---|
| **M1 — Foundation** | WS0, WS1, WS2 | one toolbar, one undo home, no tool-activation modals, shared `entityActions` |
| **M2 — Interaction surfaces** | WS10(policy), WS5, WS3 | CAS lives on the shared action layer, shape-aware |
| **M3 — Estimation** | WS7, WS8 | reliable BOM/cost; persisted Estimation/Design mode |
| **M4 — Engine / HVAC** | WS9, WS6 (+ WS10 geometry half), **WS4 (co-ship)** | engineering-truth tests green; correct fitting/geometry; axial radial live |

**Parallel-track recommendation [Proposal]:** start **WS9** (engine golden tests) early in M1 as a parallel track even though HVAC correctness (WS6) is M4 — it protects the WS0/WS5 refactors from silent regressions. Not a reorder of your milestones; an early start of one independent WS.

---

## Workstream specs

### WS0 — `entityActions` shared write layer  *(M1, gating)*
- **Objective:** one module that performs every entity edit (validate → `parametricUpdateService` → `updateEntit{y,ies}Command`), consumed by Inspector and CAS alike.
- **Scope (in):** extract `size`, `shape`, `length`, `material`, `splitDuct`, `reverseFlow`, `resetFittingToAuto` from `DuctInspector.tsx:278-377`; action registry `{id,label,appliesTo,isGlobal:false,run}`. **(out):** new UI, new fields.
- **Deps:** none.
- **Deliverables:** `entityActions` module; registry; Inspector refactored to call it; lint/test forbidding direct store writes in CAS-bound code.
- **Success:** editing a field via the module and via the old Inspector path yields identical undo + parametric result; `registry.every(a=>!a.isGlobal)` test passes.
- **Open:** none blocking.

### WS1 — De-duplicate command surfaces  *(M1)*
- **Objective:** one toolbar, one undo/redo home.
- **Scope (in):** remove sidebar tool row + sidebar/DockRail/Inspector undo-redo + sidebar Support panel; consolidate grid toggle; resolve `undo-button` testid to TopToolBar. **(out):** visual restyle (done in Part 1).
- **Deps:** none (coordinate testids with WS0).
- **Deliverables:** removed duplicates; migrated tests; single keyboard map published.
- **Success:** no second surface calls `setTool` for the 8 tools; `undo()`/`redo()` reachable from exactly one button + keyboard.
- **Open:** [Open, at-ticket] final keyboard map letters (default: single-key tool letters + Ctrl+Z/Shift+Z).

### WS2 — Inline tool options + remove modals  *(M1; ticket: `tickets/WS2-inline-tool-options.md`)*
- **Objective:** one slide-open slot for duct/fitting/support **+ equipment (converted now)**; kill ALL tool-activation modals; sticky settings + auto-collapse summary chip.
- **Scope (in):** `TOOL_OPTION_PANELS` slot in TopToolBar; remove `DuctSizePromptDialog` + `EquipmentPlacementDialog` (`CanvasContainer.tsx:136-141,610-630`); **new `EquipmentOptionsPanel`** (reuses dialog data layer); relocate `FittingTypeSelector`/`SupportWorkflowPanel` from sidebar into slot; sticky + chip. **(out):** CAS, manual-vs-auto Size Mode/provenance (WS5).
- **Deps:** WS1 (co-land — panel relocation). Largest M1 ticket (equipment conversion + chip).
- **Deliverables:** animated slot; EquipmentOptionsPanel; sticky+chip; per-WS feature flag.
- **Success:** no modal on any tool select; duct width edit flows to `useDuctDrawSettings`; equipment places inline; each panel mounts once; chip collapses after first draw.
- **Open:** [at-ticket] equipment placement interaction (Place button + click-to-place); chip state storage + summary format; first-draw detection.

### WS10 — Compat matrix + fitting `variant` schema  *(M2, gates WS3/WS4)*
**SPLIT: policy half (ticket `tickets/WS10-compat-matrix-schema-policy.md`) + geometry half → WS6.**
- **Objective (policy half):** the decided shape compatibility matrix (D9) + the additive fitting `variant` schema CAS/Axial write. No geometry.
- **Scope (in):** `shapeCompatibility(from,to,sizeEqual) → direct|reducer|transition` constant (rect/round/flat_oval/flexible; flexible=round; never block); add optional namespaced `variant` object to `FittingProps` (greenfield) + `takeoff` to the enum; the Part 6 key→schema reconciliation table. **(out → WS6):** transition geometry per pair, resolver defaults, `connectionProfile` wiring, takeoff geometry.
- **Deps:** none. **Blocks:** WS3, WS4.
- **Deliverables:** matrix constant; `variant` schema; reconciliation table; parse tests.
- **Success:** matrix returns a class for all 16 pairs (never blocked); `FittingProps.variant` parses (old fittings = undefined); nothing reads `variant` yet (no behavior change).
- **Open:** Variant model RESOLVED → namespaced `variant` object; `fittingType` stays granular. Geometry deferred to WS6.

### WS5 — Manual-first sizing + per-field provenance + eq-diameter engine  *(M2; ticket: `tickets/WS5-manual-sizing-provenance.md`)*
- **Objective:** per-field provenance (`default|computed|specified`) + a constrained sizing engine that protects user-specified fields while recomputing the rest to hold equivalent diameter.
- **Scope (in):** namespaced `provenance` object (size + gauge); defaults rect/flat-oval height=8"; constrained recompute via `calculateEquivalentDiameter`; auto-overwrite guard; equipment-driven sizing respecting specified; standard-size snap + fractional entry; specified/computed/default visual distinction. **(out):** gauge auto-derivation (WS6), persisted project mode (WS8), eq-diameter formula (exists).
- **Deps:** WS0 (`entityActions.setSize`).
- **Deliverables:** provenance schema; constrained-recompute engine; guard in `parametricUpdateService:291-323`; manual-entry UX.
- **Success:** specified field never overwritten; changing a specified field recomputes computed fields (not frozen); clear→computed; all-specified W×H derives eqDia; manual entry snaps + fractional.
- **Open:** [→WS8] initial provenance posture per mode; [at-ticket] sizing-target source for computed fields; gauge auto-derivation reserved for WS6.

### WS3 — CAS (Context Action System), full v1  *(M2; ticket: `tickets/WS3-cas.md`)*
- **Objective:** on-demand selection-anchored quick edits, desktop, on the shared action layer.
- **Scope (in):** **on-demand handle + Enter to open** (NOT Space=pan); §7A registry **all entity types**; **hybrid edits** (≤3 tap-cycle / >3 popover); new `ui/popover` primitive (none exists); anchor/lifecycle §22; a11y/keyboard; multi-select read-only (§26); all writes via `entityActions`. **(out):** Axial; fitting geometry (WS6); batch multi-edit.
- **Deps:** WS0, WS10, WS5 (build after all three).
- **Deliverables:** CAS handle/container/registry; `ui/popover`; zero-global + zero-direct-write tests.
- **Success:** per §30 invariants; CAS+Inspector = one undo entry; shape-change auto-transitions.
- **Caveat:** Reducer/Transition/Cap/Takeoff CAS writes `variant` keys with **no visible geometry until WS6** (accepted).
- **Open:** [at-ticket] handle affordance; ≤6 cap trimming; "dead-ish variant edit" hint pending WS6; popover scope.

### WS4 — Axial menu, full v1  *(M4 — co-ships with WS6; ticket: `tickets/WS4-axial-menu.md`)*
- **Objective:** right-click radial for nested fitting variants (all 6 families), shape-gated.
- **Why M4, not M2:** axial writes only `variant` keys whose geometry resolvers are WS6 → every pick is a no-op until WS6. Spec is finalized now; build co-ships with WS6 so each action is visibly effective.
- **Scope (in):** §23 right-click only (route contextmenu; Shift+F10); §9 maps for all 6 families → `variant` writes; shape gating (flexible=round); §9D contract (variant → resolver → duct-adjust → compat, one undo group). **(out):** touch/pen (D7); size/length/system edits; the resolvers (WS6).
- **Deps (hard):** WS0, WS10, WS3, **WS6 (co-ship)**.
- **Deliverables:** radial component; 6 family maps; non-goals enforcement test.
- **Success:** opens only over a fitting; shape-invalid hidden; each leaf one undoable command; with WS6, geometry+ports update.
- **Open:** [at-ticket] radial UX; max depth (3); throat/heel L2C (v1.1); reducer concentric/eccentric representation (align WS10).

### WS7 — Estimation BOM & pricing correctness  *(M3; ticket: `tickets/WS7-estimation-bom-pricing.md`)*
- **Objective:** estimates are never silently wrong. (Spec = plan Part 4 §20.) Full reconcile to one pipeline; **strict id-only** pricing.
- **Scope (in):** single canonical BOM pipeline (`bomGenerationService`); id-based pricing join (no name match); never-silent-$0 (Unpriced flag + excluded from confident total); gauge as cost+group dimension; soft pre-export quality gate. **(out):** per-project price book (follow-on); metric.
- **Deps:** WS0 (clean), but functionally independent.
- **Deliverables:** reconciled BOM; id join; gauge in `groupKey`; Unpriced UI; pre-export counts.
- **Success:** plan §20.4 acceptance (2 gauge lines; unmatched=Unpriced not $0; one pipeline feeds panel+cost+export).
- **Open:** none blocking. Pipeline = full reconcile; pricing = strict id-only (no name fallback). `catalogItemId` verified populated by the tools + carried by `bomGenerationService`; manually-drawn items w/o it → Unpriced. Risk: more Unpriced lines surface (intended truth; pre-export gate mitigates).

### WS8 — Persisted Estimation/Design project mode  *(M3; ticket: `tickets/WS8-project-mode.md`)*
- **Objective:** a real, persisted mode (NOT the inert `autoCalculate`) that sets defaults. **New project = Estimation default; scope** (posture + cost columns). **D12 supersedes the earlier auto-fitting-off-in-Estimation default.**
- **Scope (in):** `projectMode` enum on settings (greenfield, default `estimation`); drives WS5 posture and WS7 cost columns; replace inert `autoCalculate`. **(out):** auto-fitting enablement is now `autoFittingEnabled` per D12; the underlying behaviors are owned by WS5/WS6/WS7.
- **Deps:** WS5 (provenance), WS7 (cost columns).
- **Deliverables:** persisted mode field; default-wiring; mode badge.
- **Success:** mode persists across reload; switching flips the documented defaults.
- **Open:** [Open, at-ticket] default mode for a brand-new project (proposal: Design).

### WS9 — Engine test harness (engineering-truth)  *(M4; recommend early parallel start; ticket: `tickets/WS9-engine-test-harness.md`)*
- **Objective:** golden tests asserting SMACNA-correct engine output.
- **Scope (in):** golden cases for sizing, fitting insertion (elbow/tee/wye/reducer/transition/cap), flow/pressure propagation, BOM quantities, surface area, weight. **(out):** fixing the bugs found (those become WS6/WS7 items).
- **Deps:** none.
- **Deliverables:** golden fixtures w/ expected values + sources; tests over `fittingInsertionService`, `engineeringCalculator`, `bomGenerationService`, flow/pressure services.
- **Success:** Bucket A (existing features) green — divergences `.skip`+tracked-bug; Bucket B (surface area/weight, unimplemented) authored as visibly-red `pending` tests excluded from the blocking gate; flat-oval area + gauge weight have explicit truth cases.
- **Open:** none blocking. Source settled (D11): assistant derives golden values from SMACNA/ASHRAE formulas. **One review gate:** user ratifies the gauge↔pressure-class↔weight table before WS9 merges.

### WS6 — HVAC system logic & geometry correctness  *(M4 — EPIC; `tickets/WS6-epic.md`)*
**Split into children** (too large for one ticket):
- **WS6a** surface area + weight (duct + fitting developed-area) — `tickets/WS6a-surface-area-weight.md` ✓ specced
- **WS6b** pressure/seal-class schema + gauge auto-derivation — `tickets/WS6b-pressure-seal-gauge.md` ✓ specced (per-project default+override; gauge computed+overridable; liner sizing→WS6c)
- **WS6c** engine-correctness — `tickets/WS6c-engine-correctness.md` ✓ skeleton (Part 1 hysteresis 60°+55/65 band decided; Part 2 divergence backlog **populated post-WS9-run**)
- **WS6d** design-vs-rendered geometry separation (cutback/restore symmetry) — `tickets/WS6d-design-rendered-geometry.md` ✓ specced (parity gate)
- **WS6e** fitting geometry resolvers + WS10 geometry half + §9D pipeline (WS4 co-ships) — `tickets/WS6e-fitting-geometry-resolvers.md` ✓ specced (all-in-one, phased E1–E6; formal `connectionProfile`; largest ticket)
- **WS6f** ~~grease/combustion confirmation~~ → **air-only scope: delete specialized (grease/boiler/generator) apps** (`tickets/WS6f-air-only-scope.md`) ✓ specced — **moved to M1** (do early; simplifies downstream)
- **Deps:** WS9 (feeds WS6c), WS10, WS5, WS6d→WS6e. **Open:** §31 Q6 (hysteresis, → WS6c post-WS9); gauge↔pressure table (D11 ratification, WS6a/WS6b).

---

## Decisions still needed BEFORE a milestone can start (shortlist)

**All three prior blockers are now RESOLVED (D9/D10/D11).** No milestone has an unresolved start-blocker.

Residual gates (do not block starting a milestone, but must clear before the noted merge):
- **WS9 merge gate:** user ratifies the gauge↔pressure-class↔weight table (D11).
- **WS6 (M4):** §31 Q6 (60° cutoff + 55/65 hysteresis confirm) and takeoff-type-per-shape rules — resolve at the M4 ticket.

Everything else is `[Open, at-ticket]` — resolved when that ticket is picked up, not now (front-loading all micro-decisions for M4 while M1 is unbuilt would be wasted; many depend on earlier outcomes).

## Related
- `Ductwork_Interaction_Architecture_Plan.md` (Parts 0–6) — the detailed spec this decomposes.
- `PRD_Director_Brief.md` — assembles the consolidated PRD.
- Memory: `[[interaction-architecture-plan]]`, `[[manual-duct-size-required]]`, `[[cost-estimation-gaps]]`, `[[toolbar-tool-option-panels]]`, `[[duct-cutback-restore-asymmetry]]`.
