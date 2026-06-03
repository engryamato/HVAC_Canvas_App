# PRD — SizeWise Ductwork Interaction Architecture

**Status:** Draft for review (PRD-only — no code changes)
**Owner:** Canvas / Interaction Architecture
**Date:** 2026-06-02
**Branch:** codex-fitting-restore-rerun
**Core principle:**
> **Toolbar = start tools. CAS = edit the selected object. Inspector = review detailed properties. Axial menu = fast fitting options. System logic = auto-place, auto-cut, auto-calculate.**

This plan grounds every claim in the current code (audited 2026-06-02 via parallel Explore agents). Where a surface the request assumes does **not exist yet**, that is stated plainly.

---

## Scope boundaries (read before estimating effort)

> **v1 SCOPE [Decision, supersedes all grease/combustion content below]:** v1 is **HVAC air ductwork + equipment ONLY**. All specialized non-air applications (grease/boiler/generator `engineeringSystem`) are **deleted** (ticket `tickets/WS6f-air-only-scope.md`, memory `[[v1-air-ductwork-only-scope]]`). Ignore §29 and any grease/combustion-air mentions (§5, §28, §31) — they are removed; the WS6f doc-sweep cleans the remaining inline references.

This document spans more than one shippable unit. To prevent "it all ships together" misreads:

- **Primary scope of THIS PRD — interaction architecture:** the four surfaces and their boundaries — Toolbar, CAS, Inspector, Axial menu — plus Phase 0 (`entityActions`) and the de-duplication of command surfaces. This is what must be implemented in the phases of §10/§24.
- **Follow-on PRDs (referenced here, specified only):** estimation/pricing correctness (Part 4 §20), the provenance model + auto-overwrite guard (§16), the persisted Estimation/Design project mode (§17), `pressureClass`/`sealClass` schema + weight/surface-area calculators (§27 / Phase F), and metric `unitSystem` (§31 Q8). These are documented so the interaction work doesn't contradict them, but they are not gated by this PRD.
- **Spec-only (no implementation yet):** anything tagged **[Proposal]** or **[Open]**. Only **[Decision]** items inside the primary scope are commitments for the current phases.

---

## 0. Verified reality (read this first)

The request assumes CAS, an "improve toolbar", and an axial/right-click menu already exist and overlap. They do **not**:

| Surface request assumes | Reality in code |
|---|---|
| CAS / context action system | **Does not exist.** Selection-driven editing lives only in the Inspector (right sidebar), routed by `InspectorPanel.tsx:59-66` off `useSelectionStore`. |
| Right-click / axial / umbrella menu | **Does not exist.** No `onContextMenu`/`RadialMenu`/`AxialMenu` anywhere; the 3D canvas calls `preventDefault()` on contextmenu (`createControls.ts:87`). |
| "Improve toolbar" | No component by that name. The thing acting as a second toolbar is the **sidebar `Toolbar`/`ToolButtons`** (`Toolbar.tsx:486-577`), plus `DockRail` and `BottomToolbar`. |

So the cleanup is not "de-dup CAS vs Inspector." It is: **collapse the duplicate global-command surfaces, then build CAS + axial menu net-new with strict boundaries.**

---

## 1. Current problems

1. **Three parallel global-command surfaces.** Tool selection (8 tools) is duplicated between `TopToolBar.tsx:233` and sidebar `Toolbar.tsx:536`. The sidebar `Toolbar` is effectively a second toolbar — the exact thing the request forbids.
2. **Undo/Redo in 5 places:** `TopToolBar.tsx:211/219`, `Toolbar.tsx:552-577`, `DockRail.tsx:62-70`, `InspectorOverviewPanel.tsx:580/592`, and keyboard (`useKeyboardShortcuts.ts:225-235`). Five surfaces, one command.
3. **Support workflow panel rendered in 2 surfaces** (`TopToolBar.tsx:247` and `Toolbar.tsx:544-548`) — risk of double-mount and divergent behavior.
4. **Fitting type selector** rendered in sidebar only (`Toolbar.tsx:543`); will double-render once the top toolbar's slide-open slot (PRD Part 2) also shows it. Must be gated.
5. **Grid toggle duplicated:** `ZoomControls.tsx:184` and `BottomToolbar`→`GridSettings.tsx:32`.
6. **Equipment behavior diverges by surface:** sidebar re-click reopens the placement dialog (`Toolbar.tsx:486`), top toolbar just sets the tool. Inconsistent.
7. **Dialogs interrupt drawing flow:** Duct and Equipment open modals on tool select (`CanvasContainer.tsx:136-141`) instead of inline options (covered by `PRD_Toolbar_Redesign.md` Part 2).
8. **No place for component-specific quick edits at the point of work.** Editing a selected duct's size means crossing the canvas to the right-sidebar Inspector. There is no on-canvas contextual action surface (CAS) and no fast nested fitting chooser (axial menu).
9. **Inspector mixes overview-level global actions with selection editing:** `InspectorOverviewPanel` exposes Auto-Calculate toggle, Auto-Fix Geometry, Undo/Redo, Select-All-Invalid — global/project actions sitting in the same panel family as per-entity editors.
10. **Two engineering outputs missing:** surface area and weight are not auto-computed (component schema has a `weight` field but nothing populates it from geometry/gauge).
11. **Known correctness bug:** duct cutback on fitting insert is not symmetric with restore on detach (see `[[duct-cutback-restore-asymmetry]]`).

---

## 2. UI responsibility matrix

| Concern | Toolbar | CAS (new, on-canvas) | Inspector (right panel) | Axial menu (new, right-hold) | System logic (auto) |
|---|:--:|:--:|:--:|:--:|:--:|
| Pick a tool / mode (Select, Draw Duct, Add Fitting…) | ✅ | — | — | — | — |
| Global commands (Validate, Calculate, Export) | ✅ | ❌ | — | ❌ | — |
| Undo / Redo | ✅ (single home) | ❌ | ❌ | ❌ | — |
| Quick edit of the **selected** object (size, length, shape, system) | ❌ | ✅ | ✅ (full table) | — | — |
| Component-specific structural ops (split duct, reverse flow, reset-to-auto) | ❌ | ✅ | ✅ | — | — |
| Fast nested fitting choices (elbow → vane type) | ❌ | ❌ | — | ✅ | — |
| Deep / project-level properties, validation detail, calc review | ❌ | ❌ | ✅ | — | — |
| Placement, cutting, fitting decisions, calculations | ❌ | ❌ | ❌ | ❌ | ✅ |

**Hard rule:** CAS and the axial menu may expose **only** selection/context-specific actions. Never a global tool, never Draw/Add/Export/Calculate/Validate/Undo.

**Distinction CAS vs Inspector:** CAS = the 3–6 most-common edits for the selected type, surfaced fast and near the selection. Inspector = the full editable property table + calculations + validation detail. CAS is a shortcut into a subset; it must not grow into a floating property panel (that would re-create a second toolbar).

---

## 3. Recommended toolbar buttons

Single toolbar = the top dynamic pill (`TopToolBar.tsx`). Grouped:

| Group | Buttons | Notes vs today |
|---|---|---|
| History | Undo, Redo | already added in Part 1 |
| Navigate | Select/Move, Pan | exists |
| Create | Draw Duct, Add Fitting, Add Equipment, Add Terminal/Air Device, Add Accessory | Terminal + Accessory are **new**; today "support" ≈ accessory/hanger |
| Annotate | Dimension/Measure, Annotation/Note | Dimension/Measure is **new**; Note exists |
| Analyze | Validate / Model Health, Calculate | **new** as toolbar buttons (today only via Inspector/keyboard) |
| Output | Export / Report | **new** as toolbar button (today dialog only) |
| View | Plan (ViewModeToggle) | exists |

The toolbar holds the launchers only. Per-option settings (duct size, fitting type) live in the slide-open options slot (Part 2) at draw time, and in CAS/Inspector after selection — never as permanent toolbar controls.

---

## 4. Removed or relocated buttons

| Item | Today | Decision | Rationale |
|---|---|---|---|
| Sidebar tool buttons (8 tools) | `Toolbar.tsx:486-541` | **Remove** | Duplicate of TopToolBar; this is the forbidden "second toolbar". |
| Sidebar Undo/Redo | `Toolbar.tsx:552-577` | **Remove** | Keep one home (toolbar) + keyboard. |
| DockRail Undo/Redo | `DockRail.tsx:62-70` | **Remove** | Same. DockRail keeps only panel toggles. |
| Inspector Overview Undo/Redo | `InspectorOverviewPanel.tsx:580/592` | **Remove** | Global action in a selection panel. |
| Support panel in sidebar | `Toolbar.tsx:544-548` | **Remove** | Lives in toolbar slide-open slot (Part 2). |
| Fitting selector in sidebar | `Toolbar.tsx:543` | **Relocate** to toolbar slot; gate to render once | Avoid double-mount. |
| Grid toggle in ZoomControls | `ZoomControls.tsx:184` | **Keep in one** (BottomToolbar/GridSettings) | Grid is a view/snap setting; consolidate to GridSettings. |
| Auto-Fix Geometry, Select-All-Invalid, Auto-Calculate toggle, Show-Centerline | `InspectorOverviewPanel` | **Keep, but as Model-Health/project actions** (not per-entity CAS) | These are project/global; valid in the no-selection overview, not in CAS. |
| Equipment re-click → dialog | `Toolbar.tsx:486` | **Convert** to inline options (Part 2) | Consistent, no modal. |
| Duct size modal | `CanvasContainer.tsx:136-138,618-630` | **Remove** → inline slot (Part 2) | Don't block the canvas. |

Net: after this, **one** toolbar, **one** undo/redo home (+keyboard), zero duplicate tool rows.

---

## 5. Draw Duct tool logic

On selecting Draw Duct, the slide-open options slot (`PRD_Toolbar_Redesign.md` Part 2, `DuctToolOptionsPanel`) shows only run-setup inputs:

- **Shape:** rectangular / round / flat oval / flex (`DuctRunShape`).
- **System type:** supply / return / exhaust / outside air (air-only v1 — grease/combustion-air dropped, see scope banner). Matches the existing `SystemTypeSchema`; no enum additions.
- **Size:** width/height (rect, flat oval) or diameter (round, flex). Bounds already in `DuctToolOptionsPanel`.
- **Length mode:** click-to-draw (default) | manual length | fixed section length. **Length-mode selector is new.**
- **Elevation / z-level:** only if the schema supports it; otherwise omit (do not fake).
- **Material / gauge standard:** only if it affects sizing/BOM; default from project standard, editable later in CAS/Inspector.
- **Insulation:** only when it affects sizing, BOM, or visibility (already conditional in the panel).
- **End condition:** only if it must be set before placement; otherwise defer to CAS.

Everything else (segment breakdown, fitting insertion, calcs) is computed, not asked. Options the system can infer must not appear here.

---

## 6. Auto-calculation and auto-placement rules

System infers from geometry + engineering rules; the user never hand-picks these. Current status:

| Behavior | Status | Source |
|---|---|---|
| Segment length while drawing | EXISTS | `ductRunSectionCalculations.ts:55` |
| Section breakdown by fabrication length | EXISTS | `ductRunSectionCalculations.ts:55-79`, profile in `FabricationProfileSettingsPanel` |
| Magnetic snap detection | EXISTS | `magneticConnectionService.ts:16-39` |
| Endpoint-to-endpoint connection | EXISTS | `magneticConnectionService.ts` + `ductCutbackService.ts:30` |
| Endpoint-to-body connection | EXISTS | `magneticConnectionService.ts` (`duct_body` snap) |
| Auto-cut duct on fitting insert | EXISTS | `ductCutbackService.ts:30-78` |
| Auto-restore duct length on detach | EXISTS but **asymmetric/buggy** | `ConnectionReconciliationService.ts:63`; see `[[duct-cutback-restore-asymmetry]]` |
| Auto elbow on angle change | EXISTS | `fittingInsertionService.ts` (JunctionAnalysis) |
| Tee vs wye by branch angle | EXISTS | `fittingInsertionService.ts` (`WYE_BRANCH_ANGLE_THRESHOLD`) |
| Reducer on size change | EXISTS | `fittingInsertionService.ts` (`detectDuctProfileChange`) |
| Transition on shape change | EXISTS | `fittingInsertionService.ts` |
| End-cap suggestion for open ends | EXISTS | `fittingInsertionService.ts` (type `cap`) |
| BOM quantity update | EXISTS | `bomGenerationService.ts:65` |
| Surface area calculation | **MISSING** | no `surfaceArea` on duct/run calculated |
| Weight calculation | **MISSING** | schema has `weight`, nothing populates it |
| CFM / FPM / pressure (when inputs available) | EXISTS | `engineeringCalculator.ts`, `FlowPropagationService.ts:37`, `PressurePropagationService.ts:14` |

**New work in this area:** (a) implement surface-area from geometry; (b) implement weight from material/gauge × surface area (guard when gauge data absent); (c) fix the cutback/restore asymmetry so detaching a fitting restores the authored centerline exactly. Auto-placement must always respect manual-override locks (`fittingInsertionService` already supports `manualOverride`; `FittingInspector` "Reset to Auto" clears it).

---

## 7. CAS rules (new)

CAS appears **only** after a component is selected, anchored near the selection, and shows **only** that component's most common edits. It reads `useSelectionStore` (`selectionStore.ts`) and renders by entity type.

- **Duct:** Edit size · Edit length · Change shape · Change system type · Change insulation · Change material · Split duct · Reverse flow (if allowed).
- **Elbow:** Edit angle · Toggle turning vanes (if applicable) · Change radius/mitered type · Change throat/radius class.
- **Tee / Wye:** Edit branch size · Edit branch angle · Change tee/wye classification (if allowed) · Flip branch orientation (if valid).
- **Equipment / Terminal / Accessory:** the 3–5 highest-value edits for that type (e.g. capacity, type, dimensions) — full set stays in Inspector.

**CAS must NOT** contain Draw Duct, Add Equipment, Export, Calculate, Validate, Undo/Redo, or any global tool. It is a shortcut to a subset of Inspector edits, not a panel. Cap it (≈6 actions); overflow goes to Inspector. Multi-select → show only the intersection of actions valid for all selected.

---

## 8. Inspector rules

Inspector (right sidebar) = deep properties, project-level data, validation detail, calculation review. It owns the **full editable property table** per type (`DuctRunInspector`, `EquipmentInspector`, `RoomInspector`, `FittingInspector`) plus read-only calculated values (area, velocity, pressure drop, cost).

- Inspector must not duplicate CAS quick actions **except** as part of the full editable table (CAS "Edit size" and Inspector's size field are the same store write — acceptable; a standalone duplicate "Split duct" button in both is not, unless framed as the canonical full-control location).
- Move global/project actions out of per-entity inspectors: Auto-Calculate toggle, Show-Centerline, Auto-Fix-Geometry, Select-All-Invalid stay in the **no-selection Overview / Model-Health** view, not in CAS and not implying they edit the selection.
- `FittingInspector` "Reset to Auto" (`fittingInsertionService.planManualOverrideReset`) is the canonical full-control home; CAS may surface it as a quick action that calls the same path.

---

## 9. Axial menu rules (new)

Right-hold (press-and-hold) radial/umbrella menu, used **only** for fast, nested, fitting-specific choices.

- Example: rectangular elbow → vane options → single / double wall vane.
- Scope: fitting sub-type and fabrication detail selection that is faster as a nested radial than a dropdown.
- Trigger: right-hold (note the 3D canvas currently suppresses contextmenu — the implementation must add an intentional press-hold gesture, not rely on native right-click).
- It must NOT behave like a toolbar, must NOT contain global tools, and must NOT duplicate CAS edits. If a choice isn't a fast nested fitting option, it belongs in CAS or Inspector.

---

## 10. Implementation phases

Phased so each phase ships value and is independently revertable.

- **Phase A — De-duplicate (low risk, high clarity).** Remove sidebar tool row, sidebar/DockRail/Inspector undo-redo, sidebar Support panel; consolidate grid toggle. Outcome: one toolbar, one undo home. (Depends on nothing.)
- **Phase B — Inline options (already specced).** Land `PRD_Toolbar_Redesign.md` Part 2: slide-open options for duct/fitting/support; remove duct + equipment modals.
- **Phase C — CAS.** Build the selection-anchored contextual action surface; wire duct/elbow/tee-wye/equipment action sets to existing store writes. Strict no-global-commands lint/test.
- **Phase D — Axial menu.** Press-hold radial for nested fitting choices (elbow → vanes, etc.).
- **Phase E — Toolbar completeness.** Add Terminal, Accessory, Dimension/Measure, Validate, Calculate, Export buttons + system-type enum (grease, combustion air) + length-mode.
- **Phase F — Engineering gaps.** Surface area + weight auto-calc; fix cutback/restore asymmetry.

Dependency graph:
```
A ──> C ──> D
A ──> B ──> E
F (independent; can start anytime)
```
Sequencing rationale: A first because every later surface assumes a single clean toolbar; C before D because the axial menu is a refinement on top of contextual selection; F is orthogonal engineering work.

---

## 11. Developer checklist

- [ ] One toolbar component renders global tools; no other surface calls `setTool` for the 8 tools.
- [ ] Exactly one Undo/Redo UI home (+ keyboard); grep confirms `undo()`/`redo()` not wired into sidebar/dock/inspector buttons.
- [ ] `SupportWorkflowPanel` and `FittingTypeSelector` each mount at most once for a given `currentTool`.
- [ ] Grid toggle exists in exactly one surface.
- [ ] CAS renders only on non-empty selection; action list is type-specific; contains zero global commands (enforced by a unit test asserting the action registry has no global ids).
- [ ] CAS action count ≤ 6; overflow routes to Inspector.
- [ ] Axial menu only triggers on press-hold over a fitting; contains zero global commands.
- [ ] Inspector keeps the full property table; global/project actions live in Overview/Model-Health, not per-entity panels.
- [ ] Auto-placement respects `manualOverride`; "Reset to Auto" clears it.
- [ ] Surface area + weight computed where gauge/material data exists; gracefully omitted when not.
- [ ] Detaching a fitting restores the duct's authored centerline (cutback/restore symmetric).
- [ ] No new modal dialogs for tool activation.
- [ ] Existing test ids preserved (`tool-{id}`, `top-toolbar-icon-support`, `undo-button`, `redo-button`); `TopToolBar.test.tsx` green.

## 12. Risks and edge cases

| Risk / edge case | Mitigation |
|---|---|
| Removing sidebar tools breaks muscle memory / tests that target sidebar buttons | Grep tests for sidebar tool testids; migrate to toolbar testids before removal. |
| CAS becomes a floating mini-toolbar (scope creep) | Hard cap action count; lint registry for global ids; design review gate. |
| Axial menu vs native right-click conflict (3D suppresses contextmenu) | Use an explicit press-hold gesture; don't rely on contextmenu event. |
| Multi-select CAS shows actions invalid for some items | Show intersection of valid actions only; disable mixed-type edits. |
| Auto-fitting fights manual edits | Always honor `manualOverride`; CAS edits set override where the user clearly intends a manual value. |
| Weight calc with missing gauge data | Compute only when material+gauge present; otherwise show "—" not 0. |
| Cutback/restore fix regresses existing junctions | Cover with parity tests; restore must use design centerline, not cut geometry (`[[duct-cutback-restore-asymmetry]]`). |
| System-type enum expansion breaks persisted projects | Migration/back-compat for new enum values (grease, combustion air). |

## 13. Suggested acceptance tests

1. Selecting any tool fires from exactly one surface; sidebar no longer renders tool buttons (DOM assertion).
2. `undo()`/`redo()` reachable from exactly one button + keyboard; other surfaces have none.
3. Click Draw Duct → inline options slot opens (no modal); editing width changes `useDuctDrawSettings().width`; next duct uses it.
4. Select a duct → CAS appears near it with duct-only actions; CAS contains no Draw/Add/Export/Calculate/Validate/Undo (registry assertion).
5. Select an elbow → CAS shows angle / vanes / radius type; press-hold opens axial menu with vane sub-choices; selecting double-wall vane updates the fitting.
6. Select a tee → CAS shows branch size/angle/classification/flip; invalid flips are disabled.
7. Inspector shows the full editable table for the selection and the calculated values; no standalone duplicate of a CAS-only action outside the table.
8. Draw a run that changes size and shape → reducer and transition auto-insert; detach one → duct restores to authored centerline.
9. BOM quantity, surface area, and weight update after edits (weight only when gauge present).
10. No tool activation opens a modal dialog anywhere.

---

## 14. Review-team findings & revisions

Pressure-tested by three specialist agents (architecture, UI/UX, HVAC domain). These corrections supersede the lighter assumptions above where they conflict.

### 14.1 Architecture (separation / state ownership)

- **CORRECTION — "same store write" is false.** Inspector edits are not bare store writes. `DuctInspector.commit` (`DuctInspector.tsx:278-321`) deep-clones for undo, runs `validateField`, gathers all ducts+fittings, calls `parametricUpdateService.scheduleDuctPropertyChange` (debounced 500ms), then dispatches `updateEntities/updateEntityCommand`. `handleShapeChange` (`:323-377`) adds equivalent-round conversion + remembered-dimension logic. If CAS re-implements size/shape, it duplicates **validation, undo snapshots, and parametric propagation** → silent data-integrity drift.
- **NEW Phase 0 (hard dependency of Phase C): extract `entityActions` module.** Plain functions `(entityId, value, ctx)` that internally do validate → `parametricUpdateService` → `updateEntit{y,ies}Command`, covering size/shape/length/material/splitDuct/reverseFlow/resetFittingToAuto. Refactor Inspector to consume it first (behavior-preserving), then CAS imports the same functions. This is the enforceable single-source-of-truth, not a checklist aspiration.
- **Action registry shape:** `{ id, label, appliesTo(entityType), isGlobal: false, run(ctx) }`, consumed by both CAS and the Inspector quick-row. Unit test: `registry.every(a => !a.isGlobal)`.
- **CAS state: reuse `selectionStore` — do NOT add a domain slice.** Visibility derives from `selectedIds.length > 0`, content from entity type. Only genuinely new state is ephemeral UI (CAS anchor, axial-menu open/target) → a tiny `contextMenuStore` (UI-only) or local state.
- **`undo-button` testId collision:** it is hard-coded in both `TopToolBar.tsx:208` and `Toolbar.tsx:563` today. Designate `TopToolBar` canonical; delete sidebar/DockRail copies in Phase A. (Fixes the checklist tension — sidebar id does not survive.)
- **Multi-select editing is net-new.** `InspectorPanel.tsx:73-79` renders a bare "N items selected" placeholder; no per-type multi-edit path exists (`updateEntities` exists but no logic uses it). CAS "intersection of valid actions" must build this.
- **`selectedSegments` is unmodeled.** `selectionStore.ts:100-134` tracks segment-level selection the Inspector ignores. CAS must decide segment-scoped vs run-scoped actions, or explicitly defer segments to Inspector.
- **Debounce race:** CAS must reuse the same `scheduleDuctPropertyChange` debounce/commit semantics or it will race the Inspector and split one logical change into two undo entries.

### 14.2 UI/UX

- **Keyboard map is a Phase-A deliverable, not a footnote.** Publish single-key tool letters + Ctrl+Z/Ctrl+Shift+Z + Esc→Select; CAS actions get number keys while a selection is active. This is the real mitigation for removing the sidebar row (keyboard reachability replaces spatial reachability). a11y: define focus order + ARIA roles for the on-canvas CAS/axial surfaces (selection-anchored floating UI is an a11y trap).
- **Axial menu: bind to right-click for instant open, not a timed hold.** Intercept (don't globally suppress) contextmenu so it opens immediately on press; keep press-hold only as the **touch** fallback (press-hold conflicts with OS text-select/3D-orbit on touch). Support a spring-loaded flick (press-drag-release in one gesture). A 250–500ms hold is poison at 100 ducts/hour and undiscoverable.
- **Make CAS visually distinct from Inspector** (compact pill, no panel border, "Quick edits — full properties in Inspector →" affordance). When CAS edits a field, briefly pulse the matching Inspector field so users learn it is one source of truth → kills "which value wins?" distrust and the "second toolbar that follows my cursor" perception.
- **Draw Duct panel: sticky + collapsible.** Persist last-used shape/size/system across runs (seeded from project standard); after first draw, collapse to a one-line summary chip ("Supply · Rect 16×8 · click-draw") that re-expands on click. Default to the 3 inputs that change run-to-run (shape, size, system); push material/gauge/insulation/elevation/end-condition behind a "More" disclosure and into CAS/Inspector post-draw. Serves the 40-identical-ducts case.
- **Auto-system feedback:** when the system auto-inserts elbow/tee/reducer or auto-cuts a duct, show a brief non-blocking inline chip ("Reducer inserted · ⌘Z to undo · click to lock") + a status-line counter. At speed the danger is *silent* wrong inference; a 1-second undoable confirmation lets a drafter catch it without opening the Inspector.

### 14.3 HVAC domain (engineering correctness)

- **Pressure class + seal class are MISSING from Draw Duct — the most serious gap.** SMACNA construction class (½"–10" w.g.) drives gauge, reinforcement, joint type; seal class A/B/C (SMACNA / ASHRAE 90.1) is a required estimator input. **The §6 weight/gauge calc has no defensible source without these.** Add `pressureClass` + `sealClass` to run setup (default from system type, editable). Gauge is then **derived** from size + pressure class via SMACNA tables — not a free user pick (§5 must not treat gauge as a plain editable default).
- **Tee/wye angle rule:** code uses `branchAngle <= 60 → wye` (`fittingInsertionService.ts:798`). The plan must **define the angle convention explicitly** and add a hysteresis deadband (e.g. wye ≤ ~45–50°, tee ≥ ~75°) or fittings flip-flop on sub-degree drag jitter. Selection is also velocity/system-driven, not purely geometric (a 90° branch is often run as a 45°/conical tap to cut loss).
- **Tap/takeoff class missing.** Branch-off-a-main-body (the existing `duct_body` snap) is the most common real takeoff and is **not** a tee — auto-resolve to straight tap / 45° entry tap / conical tap / bellmouth / spin-in / saddle. Body-junctions ≠ end-junctions.
- **Elbow type + vane rule missing.** "Auto elbow" must pick type: radius preferred at R/W ≥ ~1.0–1.5; square-throat (mitered) **requires turning vanes**. The elbow auto-placer should emit elbow-type + vane-required, which feeds the axial menu's vane choice (§9).
- **Offset / jog detection missing.** Two laterally-displaced collinear runs → a pair of offset elbows, not a single elbow/transition.
- **Boot/collar at terminals.** Open-end → end-cap is only correct for true dead-ends; an open end at a terminal location should suggest a boot/collar/spin-in, not a cap.
- **Liner vs wrap must be two properties.** Internal liner reduces clear free area (changes velocity/pressure/acoustics and internal dimension); external wrap changes only the envelope/BOM. They have opposite sizing effects — one "Insulation" toggle is wrong.
- **Grease & combustion-air = mandatory confirm, never silent infer.** When system type ∈ {grease, combustion air, kitchen exhaust}, force explicit confirmation of construction method (welded liquid-tight seams, min 16-ga carbon / 18-ga stainless per NFPA 96 / IMC, clearance/wrap, slope, access doors). Do **not** apply the standard snap/cutback/standard-gauge auto-pipeline silently.
- **Surface-area formulas (per shape):** rect `2(W+H)·L`; round `π·D·L`; flat oval `[π·a + 2(A−a)]·L` (do not approximate as a rectangle); flex `π·D·L × 1.05–1.10` corrugation/stretch factor. Add fitting developed-area separately. Weight = developed area × SMACNA gauge unit weight (galv lbs/ft²: 26ga≈0.906, 24ga≈1.156, 22ga≈1.406, 20ga≈1.656, 18ga≈2.156) + ~10–15% seam/waste allowance.
- **Hanger/reinforcement spacing auto-calc** is a natural BOM output (runs already break into fabrication sections) and is currently absent — add as a Phase-F engineering output.

### 14.4 Revised phase graph

```
Phase 0 (extract entityActions + action registry) ─┬─> C (CAS) ──> D (Axial menu)
A (de-dup) ────────────────────────────────────────┘
A ──> B (inline options) ──> E (toolbar completeness; add pressureClass/sealClass/liner-vs-wrap)
F (engineering: surface area, weight w/ SMACNA gauge, hanger/reinforcement, cutback/restore fix) — independent
```
Phase 0 + A both gate C. E must carry the pressure/seal/liner-vs-wrap schema additions (they block defensible weight in F).

### 14.5 Added acceptance tests

11. Editing the same field via CAS then Inspector produces ONE coherent undo entry (shared debounce/command path).
12. Action registry contains zero global ids (`registry.every(a => !a.isGlobal)`).
13. Every toolbar tool and every CAS action has a keyboard binding.
14. Selecting system type = grease/combustion air forces a construction-method confirmation before drawing (no silent standard-gauge pipeline).
15. Auto-inserted fitting (reducer/elbow/tee) shows an undoable inline confirmation chip.
16. Flat-oval surface area uses the oval-perimeter formula, not the rectangular approximation (unit test on known dimensions).
17. Gauge is derived from size + pressure class (not user-entered) and weight is non-zero only when gauge resolves.

---
---

# Part 3 — Cost-estimation workflow, manual-first sizing & provenance

**Why this part exists:** SizeWise is a **mechanical plan cost-estimation (takeoff) tool as well as a design tool.** The automation-first direction in §2's analysis was too aggressive: an estimator must enter exact specified sizes and price exactly what the drawings show. This part makes manual entry first-class and supersedes the §5 "Size" handling. Findings below are code-verified (2026-06-02). See memory `[[manual-duct-size-required]]`.

## 15. Manual-first sizing (supersedes §5 "Size")

- **Size Mode = Manual (default) | Auto-target.** Manual keeps the typed W/H/diameter fields already in `DuctToolOptionsPanel.tsx`; Auto-target uses `autoSizingService` from a velocity/pressure target. Default is **Manual**. This is a *mode*, not new buttons — button-minimization (§3) still holds; minimizing buttons ≠ removing inputs.
- **Manual is sticky:** persist last-used shape/size/system across runs.
- **Standard-size + fractional support (NEW):** `autoSizingService.ts:44-53` already has `STANDARD_ROUND_SIZES` / `STANDARD_RECTANGULAR_INCREMENTS`, but **manual entry does not snap to them** and the UI uses `step={1}` integers (`DuctInspector.tsx:613`). Manual entry should offer (a) a standard-nominal-size picker and (b) fractional-inch entry (e.g. 12-1/2"), since estimators take off standard sizes. No SMACNA size table exists today — add as data.

## 16. Provenance model — the real gap (NEW)

Today provenance is **fitting-only** (`autoInserted` / `manualOverride`, `fitting.schema.ts:80-85`). Ducts/equipment have **no usable per-property "specified vs computed" marker** — the duct `autoSized` flag (`duct.schema.ts:121`) is inert (write-only, never read). For a defensible cost basis the plan requires:

- A **per-property provenance** concept on costable/engineering fields (size, gauge, length, material, pricing): each is `specified` (user-entered), `computed` (engine), or `default`. Minimum viable: a per-field "user-set / locked" flag, mirroring the fitting `manualOverride` pattern.
- **Auto-overwrite guard (NEW):** `autoSizeDuctToVelocity` (`parametricUpdateService.ts:291-323`) overwrites dimensions with no check for user-set values. Any auto-size/recompute pass MUST NOT clobber a `specified` size. This is the duct-side analog of the fitting lock and does not exist.
- **Visual distinction:** inferred values render visibly differently from specified ones (badge/tint), and the estimate/BOM can report which line items are inferred vs specified.

## 17. Project mode: Estimation vs Design (NEW)

- A **real, persisted** project-level mode. The existing `autoCalculate` toggle is **not** it — it is written with an `as never` cast, is absent from `CalculationSettingsSchema`, is not persisted, and gates only an Inspector label (`useInspectorOverviewData.ts:533`). Do not build on it; add a proper field to the calculation/project settings schema.
- **Estimation mode defaults:** Manual size mode, auto-fitting **off** (place exactly what's drawn), cost columns visible, validation advisory. **Design mode defaults:** Auto-target available, auto-fitting on, engineering review emphasized.
- Auto-fitting today only fires on the explicit "Re-run Auto-Fitting" button in `ValidationDashboard.tsx:158` (no automatic caller) — so "off by default" is already the de-facto behavior; the plan just makes it an intentional, labeled mode instead of incidental.

## 18. Estimation completeness gaps (NEW — cost-accuracy blockers)

| Gap | Evidence | Impact on estimate |
|---|---|---|
| **No per-project price override / price book** | pricing only on catalog entries (`component-library.schema.ts:41-48`); `settingsStore` has labor rates/markup/waste but no per-item price map | Estimator can't reprice one item for one project without editing the shared catalog |
| **Gauge not costed / not a BOM dimension** | `gauge` exists (`duct.schema.ts:116`) but neither BOM generator nor `costCalculationService` reads it | Two ducts differing only by gauge collapse to one line; weight/cost can't reflect gauge |
| **Two divergent BOM generators** | typed `bomGenerationService.ts` (LF, material, size, waste) vs the live-UI `csv.ts:337` which drops structured size/material/LF and is per-EA | UI estimate ≠ engine estimate |
| **Pricing joins by name in the UI path** | `useBOM.ts` matches pricing `componentLookupByName` (case-insensitive); unmatched → `materialCost 0` | **Silent $0 line items** — the worst failure mode for an estimate |
| **Metric ignored** | `unitSystem` stored (`ProjectFileSchema.ts:78`) but not consumed by cost/BOM/sizing/inspectors | Metric takeoff non-functional — descope or implement, don't half-ship |
| **No pre-export estimate-quality gate** | "export blockers" in `ValidationDashboard.tsx:147` is a label, not enforced | Estimate can export with unpriced/unmatched items and no warning |

**Treatment:** the BOM divergence + name-based $0 join are **correctness bugs**, not enhancements — they belong in Phase F (engine) ahead of any cost-facing UI polish. Add a **soft, non-blocking** pre-export gate that surfaces "N unpriced / N unmatched / N inferred sizes" so the estimator sees the estimate's confidence before sending it.

## 19. Revised phase placement & acceptance tests (delta)

- **Phase E** (toolbar completeness) gains: Size Mode toggle, standard-size picker + fractional entry.
- **Phase F** (engine) gains: per-property provenance + auto-overwrite guard; BOM-generator reconciliation; gauge as a cost/BOM dimension; soft pre-export estimate-quality gate. The name-based $0 pricing join is a **bug fix**, prioritized.
- **Project mode** (Estimation/Design persisted setting) is a small new Phase, gating the mode-dependent defaults above.

Added acceptance tests:
18. Default Draw Duct = Manual size mode; typed size is stored verbatim and an auto-size/recompute pass does NOT overwrite it.
19. A user-specified size and a computed size are visually distinguishable and flagged in the BOM/estimate.
20. Estimation mode persists across reload (real schema field, not the inert `autoCalculate`).
21. Two ducts identical except gauge produce two BOM/cost line items, not one.
22. Pre-export gate reports unpriced/unmatched line items; export is allowed but the count is surfaced.
23. A BOM line whose pricing cannot be matched is shown as unpriced, never silently $0.

---
---

# Part 4 — SPEC: Estimation BOM & Pricing Correctness

**Authored via:** gstack `/spec` (file-only, PRD-mode — no code change, no issue filed) · branch `codex-fitting-restore-rerun`
**Status:** Ready to implement · **Effort:** ~16–22h · **Priority:** P0 (highest-risk item in this plan)
**Scope decision:** the §18 correctness bugs only. Manual-size/provenance/project-mode (§15–17) are separate, larger efforts and are **out of scope** here.

## 20.1 Context

SizeWise produces cost estimates, but the cost path can be **silently wrong**. The live-UI BOM joins pricing to the catalog by name (case-insensitive); any unmatched item is costed at **$0 with no warning**, so an estimate can under-report cost and look complete. There are also two divergent BOM generators (the engine's typed one vs the UI's), and `gauge` — which materially changes duct weight and price — is on the schema but never costed or used as a line-item dimension. For an estimating tool these are correctness bugs, not enhancements: a wrong number that looks right is worse than a visible gap.

## 20.2 Current State (verified 2026-06-02)

| Symptom | Evidence | Effect |
|---|---|---|
| Pricing matched by name; unmatched → $0 | `useBOM.ts` `componentLookupByName` (~:100-123); unmatched sets `materialCost 0` | Silent under-costing; no signal |
| Two BOM generators diverge | engine `bomGenerationService.ts` (`BOMItem`:16, `groupKey`:222, LF/material/size/waste) vs live-UI `csv.ts:337` `generateBillOfMaterials` (per-EA, drops structured size/material/LF) | UI estimate ≠ engine estimate |
| Gauge not costed / not grouped | `gauge` on `duct.schema.ts:116`; read by neither BOM generator nor `costCalculationService` (`getPricingData` ~:350-367) | Ducts differing only by gauge collapse to one line; weight/cost ignore gauge |
| "Export blockers" not enforced | `ValidationDashboard.tsx:147` counts a label only; no `canExport`/gate | Estimate exports with unpriced items, no confidence signal |
| Cost-aware export exists but parallel | `bomExportService.ts` (`BOMExportRow`:11, `exportCostEstimateToCSV`:53, `includePricing`:113) | A third cost surface to reconcile, not extend blindly |

Root cause: there is no single canonical BOM/estimate pipeline. The UI path (`csv.ts` + `useBOM.ts`) was built parallel to the engine path (`bomGenerationService` + `costCalculationService`), and pricing identity is name-based instead of id-based.

## 20.3 Proposed Change

1. **Single canonical BOM pipeline.** Make `bomGenerationService` (typed, LF/material/size/gauge/waste) the one source. The UI consumes it via `useBOM`; delete or thin `csv.ts:337` `generateBillOfMaterials` to a formatter over the canonical `BOMItem[]`. `bomExportService` formats the same `BOMItem[]`.
2. **ID-based pricing join.** Match pricing by `catalogItemId` (stable), not by name. Keep name as a last-resort fallback **only with an explicit `unpriced`/`unmatched` flag** on the line.
3. **Never silent $0.** A line whose pricing cannot be resolved is rendered as **Unpriced** (distinct from a real $0), excluded from the confident total, and counted.
4. **Gauge as a cost + grouping dimension.** Add `gauge` to the duct `groupKey` (`bomGenerationService.ts:222`) and to the cost calc so two ducts differing only by gauge are two line items priced per gauge.
5. **Soft pre-export estimate-quality gate (non-blocking).** Before export, surface counts: "N unpriced · N unmatched · M inferred sizes". Export is allowed (advisory, matching today's non-blocking validation model), but the estimator sees the estimate's confidence first.

## 20.4 Acceptance Criteria

1. One BOM pipeline feeds canvas BOM panel, cost calc, and CSV/estimate export; `csv.ts` no longer holds a second generator with different columns.
2. Pricing joins by `catalogItemId`; a renamed catalog item still prices correctly.
3. A line with no resolvable price shows **Unpriced**, is excluded from the confident subtotal, and increments the unpriced counter — never silently $0.
4. Two ducts identical except `gauge` produce two distinct BOM/cost lines.
5. Pre-export gate displays unpriced/unmatched/inferred counts; export proceeds but the counts are shown.
6. Existing cost presets (Commercial/Residential/Industrial) and labor/markup/waste settings still apply unchanged.

## 20.5 Testing Plan

| Layer | What | Count |
|---|---|---|
| Unit | `bomGenerationService` groups ducts by size+material+**gauge**; LF and waste correct | +3 |
| Unit | pricing join by id; unmatched → `unpriced` flag, not $0 | +2 |
| Unit | cost calc excludes unpriced from confident total; gauge changes unit cost | +2 |
| Integration | canvas BOM panel, cost calc, and export all read identical line items | +1 |
| E2E (gstack) | draw 2 ducts (same size, diff gauge) + 1 item with no catalog match → BOM shows 2 gauge lines + 1 Unpriced; export shows "1 unpriced" | +1 |

Regression: snapshot current estimate totals on a sample project; the only intended total change is gauge-driven line splits and previously-hidden $0 items becoming Unpriced.

## 20.6 Rollback Plan

Feature-flag the canonical pipeline swap (`useBOM` reads new vs legacy). If totals regress unexpectedly, flip back to the legacy `csv.ts` path; no schema migration required (gauge already exists on the schema). Revert = drop the flag.

## 20.7 Effort

- Canonical pipeline + `useBOM` swap: ~5h
- ID-based join + unpriced flag: ~4h
- Gauge in groupKey + cost: ~3h
- Pre-export gate UI: ~3h
- Tests (unit + 1 E2E): ~5h
- **Total: ~16–22h**

## 20.8 Files Reference

| File | Change |
|---|---|
| `src/core/services/bom/bomGenerationService.ts:222` | Add `gauge` to duct `groupKey`; ensure material/size/LF retained |
| `src/utils/.../csv.ts:337` | Reduce `generateBillOfMaterials` to a formatter over canonical `BOMItem[]` |
| `src/features/.../useBOM.ts:~100-123` | Replace name join with `catalogItemId` join; set `unpriced` flag on miss |
| `src/core/services/cost/costCalculationService.ts:~350-367` | Price by id; exclude unpriced from confident total; gauge-aware unit cost |
| `src/core/services/export/bomExportService.ts:53` | Format canonical line items; show Unpriced + counts |
| `src/features/canvas/components/ValidationDashboard.tsx:147` | Add non-blocking pre-export estimate-quality counts |

## 20.9 Out of Scope

- Manual-size mode, provenance model, Estimation/Design project mode (§15–17 — separate efforts).
- Per-project price book / price overrides (§18 — follow-up spec).
- Making `unitSystem` metric functional (descope decision pending).
- Surface-area / weight calculators (Phase F engineering).

---
---

# Part 5 — Execution-Readiness Addendum (12-point spec hardening)

Implements a structured PRD review. Closes under-specified, internally-inconsistent, and missing-definition-of-done gaps. Maps to the suggested restructure (truth tables, surface specs, promoted Phase 0, invariants/anti-requirements, open questions). Where this part conflicts with earlier wording, **Part 5 wins.**

**Doc-maintenance rule [Decision]:** Part 5 is the **normative layer**. When a Part 5 decision is implemented, fold it back into the relevant earlier section (Parts 1–13) and delete/trim the corresponding Part 5 entry, so the PRD never hardens into two competing documents. Part 5 should shrink to zero as the work lands.

**Statement-type legend (apply throughout):**
- **[Verified]** — audit-backed against current code (file:line).
- **[Decision]** — normative rule, settled.
- **[Proposal]** — change to implement.
- **[Open]** — needs a product/engineering decision (collected in §31).

## 21. CAS / Axial interaction truth table [Decision]

**State enums (reference these exact names in code + tests):**
- `SelectionState = none | singleEntity | multiEntity | segmentSelection`
- `CanvasMode = selecting | creating(toolId) | panning | textEditing`
- `OverlayState = none | casOpen | axialOpen`  (mutually exclusive — axial replaces CAS while open)

Surfaces shown and who owns keystrokes, by `SelectionState` × `CanvasMode`:

| Selection | Active tool | Toolbar | CAS | Inspector | Axial | Keyboard owner |
|---|---|:--:|:--:|:--:|:--:|---|
| none | Select | ✅ | — | overview | — | global tool shortcuts |
| none | Draw / Add* | ✅ | — | overview | — | tool (Esc cancels) |
| single entity | Select | ✅ | ✅ | full | — | CAS number-keys + global |
| single **fitting** | Select | ✅ | ✅ | full | ✅ (right-click) | CAS + global; Axial while open |
| multi-entity | Select | ✅ | ✅ MVP (§26) | full | — | global only (no per-field) |
| segment-level | Select | ✅ | ✅ segment-scoped | run-level | — | CAS + global |
| any | Draw / Add* active | ✅ | **suppressed** | read-only | — | tool (canvas owns) |

\* While a creation tool is active, CAS is **suppressed** (the tool owns the canvas); selection-editing resumes when the user returns to Select. **Focus rule [Decision]:** when a CAS or Inspector input is focused, that input owns keystrokes — tool/global shortcuts do **not** fire until focus leaves. Segment-level selection (`selectionStore.selectedSegments`, `[Verified] selectionStore.ts:100-134`) shows segment-scoped actions (edit/split-at-segment); whole-run edits stay in Inspector.

## 22. CAS anchor + lifecycle [Decision]

- **Anchor source:** entity bounding-box edge nearest the viewport center (not the cursor, not last-click) so it's stable across re-selection.
- **Collision/viewport:** flip side (above↔below / left↔right) to stay on-screen; clamp to viewport; if the selection scrolls fully offscreen, CAS collapses to a small edge **chip** that recenters on click.
- **Hide/dismiss:** on deselect, `Esc`, tool switch, or entering a creation tool. **Persists** through pan/zoom (re-anchors to the moved selection) — it does not flicker on every viewport delta.
- **Max distance:** if the anchor would render >~120px from the selection bounds (after clamping), collapse to the chip instead of floating far away. This is the rule that stops CAS drifting into a free-floating toolbar.

**Keyboard & accessibility [Decision]:**
- **Tab order:** Toolbar → Canvas → CAS → Inspector. CAS is a focus group; `Tab` cycles its actions, `Shift+Tab` exits back to canvas.
- **Open axial from keyboard:** with a fitting selected, `Shift+F10` (or the Menu key) opens the axial menu centered on the selection; `Arrow`/`Tab` navigate it, `Enter` commits.
- **Dismissal keys:** `Esc` closes CAS/axial and returns focus to the canvas (single `Esc` closes the overlay; a second `Esc` deselects).
- **Roles/labels:** CAS = `role="toolbar"` with `aria-label="Quick edits"`; axial = `role="menu"`; the collapsed chip is a labeled button announcing the selection.
- **Hit targets:** minimum 32×32px (44×44 on touch) for every CAS/axial control; chip ≥ 28px.

## 23. Axial menu — authoritative input bindings [Decision] (supersedes §9 / §14.2 conflict)

| Input | Open gesture | Notes |
|---|---|---|
| Mouse / trackpad | **Right-click → opens immediately** (no hold delay) | primary path |
| Touch | **press-hold** (~250ms) | OS text-select fallback only on touch |
| Pen | barrel-button click; long-press fallback | |

**Conflict rule [Decision]:** the canvas must **route** the `contextmenu` event to the axial menu, not globally `preventDefault()` it (today the 3D canvas suppresses it — `[Verified] createControls.ts:87`). Axial opens only over a **fitting**; right-clicking empty canvas or a non-fitting does the platform default / nothing. No global commands ever appear in the axial menu.

## 24. Phase 0 — `entityActions` extraction (PROMOTED to required gating phase) [Decision]

Promoted out of §14.1 into the canonical phase list as the **hard dependency for CAS and Axial**.

- **Deliverable:** a shared `entityActions` module — `size`, `shape`, `length`, `material`, `splitDuct`, `reverseFlow`, `resetFittingToAuto` — each `(entityId, value, ctx)` doing the full validate → `parametricUpdateService` → `updateEntit{y,ies}Command` orchestration currently inlined in `[Verified] DuctInspector.tsx:278-377`.
- **Acceptance criteria (gating):**
  1. Inspector is refactored to call `entityActions` first (behavior-preserving; existing inspector tests stay green).
  2. **CAS performs zero direct store writes** — it only calls `entityActions` (enforced by a lint/test: no `updateEntity*`/store-set imports in CAS components).
  3. Editing the same field via CAS and via Inspector produces an identical undo entry and identical parametric propagation.
- **No CAS or Axial work merges before Phase 0 is met.**

## 25. Undo/redo semantics — one-step definition [Decision]

- **Slider drag** → **one** undo entry, committed on `mouseup`/`blur` (not per intermediate value).
- **Text/number input** → one undo entry per commit (`Enter`/`blur`).
- **Compound edit** (e.g. shape change → equivalent-round conversion + remembered-dimension, `[Verified] DuctInspector.tsx:323-377`) → **one** undo group.
- **Auto-inserted fittings** caused by a user action → **same** undo group as that action (undo removes the duct and its auto-fittings together).
- Debounced writes (`scheduleDuctPropertyChange`, 500ms) must coalesce into the single commit, not split it.

## 26. Multi-select scope [Decision: MVP = A; B is fast-follow]

- **MVP (A) [Decision]:** for multi-select, CAS shows a **read-only summary** (count, mixed-type note) + **"Open Inspector"** — no inline edits. Lowest risk, ships with Phase C.
- **Fast-follow (B) [Proposal]:** a small set of safe batch actions — system type, insulation wrap, material — with explicit conflict handling (mixed values show "—", apply sets all; locked/`manualOverride` items are skipped and reported).
- **Tests:** mixed entity types (duct+fitting) → summary only; mixed system types → "—" placeholder; locked values → excluded + surfaced; all-same → value shown.

## 27. Weight / surface-area prerequisites [Decision] (gates §6 / §18 weight work)

- **Required new run properties:** `pressureClass` (SMACNA ½"–10" w.g.) and `sealClass` (A/B/C). Gauge is **derived** from size + pressureClass; it is not a free user pick.
- **Insulation split [Proposal]:** internal **liner** (reduces clear free area → affects velocity/pressure/internal dims) vs external **wrap** (envelope/BOM only) become two distinct properties — one toggle is wrong.
- **Missing-prereq rule [Decision]:** if pressureClass/gauge can't resolve, **weight = "—", never 0**. **Surface area still computes** from geometry regardless (it doesn't need gauge). Per-shape formulas remain as §14.3.

## 28. Tee/Wye + takeoff: convention, hysteresis, body rule [Decision] (code-accurate)

- **[Verified] Convention** — `classifyThreeWayJunction` (`fittingInsertionService.ts:792-798`) computes the branch angle relative to the main run and folds it to its acute value, then classifies:
  ```ts
  const rawBranchAngle = Math.min(
    this.calculateAngleDifference(branch.angle, main.first.angle),
    this.calculateAngleDifference(branch.angle, main.second.angle),
  );
  // Fold to the acute branch angle off the main run (0–90).
  const branchAngle = rawBranchAngle > 90 ? 180 - rawBranchAngle : rawBranchAngle;
  const type = branchAngle <= WYE_BRANCH_ANGLE_THRESHOLD + ANGLE_EPSILON ? 'wye' : 'tee'; // threshold = 60
  ```
  So the convention is: **acute angle of the branch off the main run, 0–90°**; `≤ 60° → wye`, `> 60° → tee`. (`main` is the straightest connection pair, `findMainRunPair` :802.)
- **[Assumption — HVAC to confirm, see §31 Q6]** That direction (lateral = wye, perpendicular = tee) is engineering-correct. This is a domain judgment, not a code fact; the code only proves *what the threshold does*, not that 60° is the right HVAC cutoff.
- **[Proposal] Hysteresis:** today it's a single hard cutoff at 60° (+`ANGLE_EPSILON`) → flip-flops on sub-degree drag jitter. Add a deadband: commit **wye below 55°**, **tee above 65°**, and **keep the current classification** between 55–65° (sticky). Tunable constants.
- **[Decision] Body takeoff ≠ tee:** a `duct_body` snap (`[Verified] magneticConnectionService.ts`) is a **tap/takeoff** (straight tap / 45° entry / conical / bellmouth / spin-in / saddle), not a three-way tee/wye. The classifier above applies only to end-junction three-ways.

## 29. Grease / combustion-air forced confirmation — REMOVED (v1 air-only)

> **REMOVED per v1 air-only scope** (`tickets/WS6f-air-only-scope.md`). Specialized applications are deleted from v1, so there is no grease/combustion confirmation to build. The original spec is retained below struck-through for history only; do not implement.

<details><summary>Original (not for v1)</summary>

- When system type becomes **grease / combustion air / kitchen exhaust**, the tool-options slot shows a **blocking inline confirmation** (in the slide-open slot, **not** a modal) that requires a **construction-method** selection (welded liquid-tight, gauge per NFPA 96 / IMC, clearance) **before placement is allowed**.
- Chosen construction defaults **persist per project**.
- If a grease/combustion run exists without confirmed construction method → **validation warning** (advisory, per the non-blocking model).

</details>

## 30. Per-surface invariants, tests & anti-requirements [Decision]

**Toolbar** — Inv: single source of global tools; one undo/redo home (+keyboard); never holds per-property settings. Test: no second surface calls `setTool` for the 8 tools. **Anti:** no duplicate tool row; no property fields.
**CAS** — Inv: appears only on non-empty selection; ≤6 actions; zero global commands; zero direct store writes (§24). Test: action registry `every(a => !a.isGlobal)`; CAS imports no store setters. **Anti:** no Draw/Add/Export/Calculate/Validate/Undo; never a floating panel (§22 chip rule).
**Inspector** — Inv: owns the full property table + calculated values; global/project actions live in Overview, not per-entity. Test: per-entity inspector exposes no project-global toggle. **Anti:** no standalone duplicate of a CAS-only action outside the full table.
**Axial** — Inv: fitting-only; nested fabrication choices only; right-click instant (§23). Test: opening over a duct/empty canvas does nothing. **Anti:** no global tools; not a toolbar; no >2 nesting levels.
**System logic** — Inv: respects `manualOverride`; never silently overwrites a user-specified size (§16 guard); auto-insert is undoable + grouped (§25). Test: auto-size pass leaves `specified` sizes untouched. **Anti:** no silent geometry change without an undoable confirmation chip.

## 31. Open questions / decisions needed [Open]

| # | Decision | Owner | Default if undecided |
|---|---|---|---|
| Q1 | Multi-select: ship B batch-edit, or A-only for v1? | Product + Eng | A (summary + Open Inspector) |
| Q2 | CAS "Reset to Auto": fittings only, or also auto-sized ducts? | Eng | fittings only (mirrors FittingInspector) |
| Q3 | Auto-insert confirmation chip: always-on, or behind a setting? | UX | always-on |
| Q4 | Estimation vs Design **persisted mode** (§17): this PRD or follow-on? | Product | follow-on PRD; this PRD specs the behavior only |
| Q5 | Axial pen binding: barrel-button vs long-press primary? | UX | barrel-button, long-press fallback |
| Q6 | Tee/wye: confirm the 60° acute-angle cutoff is HVAC-correct (lateral=wye, perpendicular=tee) AND the hysteresis band (55/65°) against field cases | HVAC | 60° cutoff, 55/65° band |
| Q7 | `pressureClass`/`sealClass` schema add — scope into Phase F or its own migration PRD? | Eng | own migration PRD (back-compat for saved projects) |
| Q8 | Metric `unitSystem`: implement or formally descope? | Product | descope for v1, flag in UI |
| Q9 | Port/shape **compatibility matrix** — which shapes connect to which, when a transition is auto-required (load-bearing for CAS §7A rule 2 + axial 9D step 4) | HVAC + Eng | round↔round, rect↔rect direct; cross-shape requires transition |
| Q10 | Reconcile all Part 6 `variant field` keys (`takeoffType`, `vaneType`, `eccentricOffset`, `junctionType`, `branchSide`, `hasDamper`, …) against `fitting.schema.ts`; most need adding | Eng | own schema PRD |

---
---

# Part 6 — Real Menu Map v1 (CAS registry + Axial map, shape-aware)

Canonical, bounded, shape-aware content for the CAS and Axial surfaces. Supersedes the example-level §7/§9. **Schema note [must-fix]:** the duct shape enum in code is `DuctRunShape = rectangular | round | flat_oval | flexible` — this doc's `flex_round` maps to **`flexible`** (treated as round for fitting-option gating). All `variant field` keys below (e.g. `takeoffType`, `vaneType`, `eccentricOffset`, `junctionType`) are **[Proposal]** placeholders that must be reconciled against `src/core/schema/fitting.schema.ts` before implementation — most do not exist today.

## 7A. CAS Action Registry (v1) [Decision, except where tagged]

CAS = the 3–6 most common edits for the selected entity type, shown near the selection. Overflow → Inspector (full property table).

**Global invariants:**
- CAS is **single-select only**. Multi-select shows only **Open Inspector** (+ optional **Clear selection**) — consistent with §26 MVP.
- Every CAS item declares exactly one behavior: **inline cycle** (tap to cycle enum), **popover edit** (small anchored panel), **drag handle** (on-canvas), or **inspector deep-link**.

**Shape + connection-profile condition:** CAS actions validate against the entity's `connectionProfile`: `shape ∈ {rectangular, round, flat_oval, flexible}`; rect/flat_oval → `width`,`height`; round/flexible → `diameter`.

**CAS shape rules:**
1. **Edit size is shape-specific:** rect/flat_oval → W×H (+ standard sizes); round/flexible → Ø (+ standard diameters).
2. **Change shape is guarded by connection compatibility:** if all connected ports accept the target shape → apply; else deterministic → **preferred:** auto-insert required Transition(s) + reconnect to resolved ports, **fallback:** block with reason + Inspector deep-link. Requires the **port-compatibility matrix [Open — see §31 Q9]**.
3. **No silent invalid states:** a CAS action that would produce a shape/profile mismatch with no auto-repair **must not commit**.

| Entity | CAS actions (≤6) | UI behavior | Overflow |
|---|---|---|---|
| **Duct** | Edit size | popover: W/H (rect/flat_oval) or Ø (round/flexible) + standard sizes + Apply | Inspector |
| | Edit length | popover: numeric + "lock length" toggle (if supported) | Inspector |
| | Change system type | inline cycle: Supply/Return/Exhaust/OA/Grease/Combustion Air | Inspector |
| | Change shape | inline cycle: Rect/Round/Flat oval/Flexible **+ compatibility guard** (transition or block) | Inspector |
| | Split duct | immediate; if ambiguous → Inspector focus | Inspector |
| | Reverse flow | immediate (if allowed); else hidden | Inspector |
| **Elbow** | Edit angle | popover: numeric + presets 15/22.5/30/45/60/90 | Inspector |
| | Turning vanes | inline cycle None→Single→Double **[shape-gated: rect/flat_oval only]** | Inspector |
| | Elbow type | inline cycle Radius↔Mitered (if allowed for shape) | Inspector |
| | Radius class | inline cycle R/W 1.0/1.5/2.0 (radius elbows) | Inspector |
| | Reset to auto | immediate (clears `manualOverride`) | Inspector |
| **Tee/Wye** | Branch size | popover: standard sizes + numeric | Inspector |
| | Branch angle | popover: numeric + presets 30/45/60/90 | Inspector |
| | Classification | inline cycle Tee↔Wye (if reclassification allowed) | Inspector |
| | Flip orientation | immediate (if valid) | Inspector |
| | Reset to auto | immediate | Inspector |
| **Reducer** | End sizes | popover: upstream/downstream size picker | Inspector |
| | Type | inline cycle Concentric↔Eccentric (if supported for shape) | Inspector |
| | Eccentric offset side | inline cycle Top/Bottom/Left/Right (eccentric only) | Inspector |
| | Reset to auto | immediate | Inspector |
| **Transition** | From/To shape | read-only summary + "Change shape" deep-link | Inspector |
| | Alignment | inline cycle Centered/Top/Bottom/Left/Right | Inspector |
| | Reset to auto | immediate | Inspector |
| **Cap** | Cap type | inline cycle End cap/Plug/Screen (or single "Cap" v1) | Inspector |
| | Remove cap | immediate | Inspector |
| **Takeoff/Tap** | Takeoff type | inline cycle Straight/Conical/Bellmouth/Spin-in/Saddle **[shape-gated]** | Inspector |
| | Branch size | popover edit | Inspector |
| | Entry angle | popover: numeric + presets | Inspector |
| | Flip orientation | immediate (if valid) | Inspector |
| | Reset to auto | immediate | Inspector |
| **Equipment/Terminal/Accessory** | Open Inspector | deep-link only (v1) | Inspector |
| | *(opt)* Rotate 90° | immediate (only if common + safe) | Inspector |

*Material/insulation can swap into Duct CAS by removing lower-value items to keep the ≤6 cap.*

## 9A–9D. Axial Menu Map (v1) [Decision, keys [Proposal]]

**Eligibility:** single **fitting** only (not duct, not multi-select) with ≥1 nested choice. **Shape gating:** axial contents filter by `connectionProfile.shape` (`flexible` treated as round). If no valid options for the shape → don't appear, or show one disabled note "No quick options for this duct shape; use Inspector." Families v1: Elbow, Tee/Wye, Reducer, Transition, Takeoff/Tap, Cap (optional).

**Elbow** — L1 type: Radius(`elbowType="radius"`) / Mitered(`"mitered"`). L2A if Radius: R/W 1.0/1.5/2.0 (`radiusClass`). L2B **shape-gated rect/flat_oval only** Turning vanes: None(`hasTurningVanes=false`) / Single(`vaneType="single_wall"`) / Double(`"double_wall"`).
**Tee/Wye** — L1: Tee/Wye(`junctionType`). L2: Left/Right(`branchSide`). L3: 30/45/60/90(`branchAngleDeg`). *(branch size stays in CAS/Inspector.)*
**Reducer** — L1: Concentric/Eccentric(`reducerType`). L2 if Eccentric: Top/Bottom/Left/Right(`eccentricOffset`).
**Transition** — L1 Alignment: Centered/Top/Bottom/Left/Right(`transitionAlignment`). L2 (if fab variants): Straight/Gored(`transitionStyle`). *(from/to shape is a duct edit, not here.)*
**Takeoff/Tap** — L1: Straight/Conical/Bellmouth/Spin-in/Saddle(`takeoffType`) **[shape-gated]**. L2: 30/45/60/90(`entryAngleDeg`). L3: None/Damper(`hasDamper`). *(branch size stays in CAS/Inspector.)*
**Cap (opt)** — L1: End cap/Plug(`capType`).

**9C. Axial non-goals (enforce):** never Draw/Add, Undo/Redo, Export/Calculate/Validate, size/length/system/material edits, or "Open Inspector" (CAS-only). Max 2–3 nesting levels (per §30 anti-req).

**9D. Engineer contract:** each axial leaf is a **single command** that (1) updates the fitting's variant field(s), (2) triggers **resolver recompute** → resolved geometry + ports, (3) updates connected duct endpoints via the duct-adjustment layer (cutback/restore — see `[[duct-cutback-restore-asymmetry]]`), (4) enforces `connectionProfile` compatibility (no shape/profile mismatch may persist). All four steps are **one undo group** (§25).

**Q9 [Open] added to §31:** define the port/shape **compatibility matrix** (which shapes connect to which; when a transition is auto-required) — load-bearing for CAS rule 2 and 9D step 4.

---

## Related
- `PRD_Toolbar_Redesign.md` — Part 1 (dynamic pill, shipped) + Part 2 (inline slide-open options).
- `PRD_Director_Brief.md` — instruction to assemble the consolidated v1 PRD from this plan + the previous PRD.
- Memory: `[[toolbar-tool-option-panels]]`, `[[duct-cutback-restore-asymmetry]]`, `[[manual-duct-size-required]]`, `[[interaction-architecture-plan]]`, `[[cost-estimation-gaps]]`.
