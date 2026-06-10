# PLAN — MVP Release Readiness (v1.0.0)

**Date:** 2026-06-10 · **Status:** Plan only — no code changes made.
**Goal:** Close every gap between the current state and a signed, installable, functionally honest v1.0.0 of SizeWise HVAC Canvas for Windows + macOS.
**Execution model:** Solo developer + AI assistance, sequential phases, quality-gated (no calendar date).

---

## Ratified scope decisions (2026-06-10)

| ID | Decision |
|---|---|
| D-REL-1 | **PDF export: implement for real** (jsPDF-based project report with BOM + pricing) |
| D-REL-2 | **Platforms: Windows + macOS, both signed** (Windows code-signing cert + Apple Developer ID with notarization) |
| D-REL-3 | **First-launch modal AND persistent storage root both in v1.0** |
| D-REL-4 | **Test gate: chromium e2e green + TypeScript strict** (`ignoreBuildErrors` removed); firefox/webkit non-blocking |
| D-REL-5 | **Inspector Overview: implement fully** (real Auto-Fix, Locate focus/zoom, live states, modified tracking) |
| D-REL-6 | **WS7-FU-001 in v1.0, golden-snapshot-first** |
| D-REL-7 | **Auto-fitting: Waves 1–2 + flag retirement in v1.0**; ghost preview + conflict-review UX → v1.1 (per D-AF-2 pattern) |

Carries forward the already-ratified ductwork decisions: D-AF-1 (always-on, user-overridable), D-AF-2 (strategy refactor → v1.1), D-AF-3 (cutback stays on, regression-gated).

---

## Phase ordering rationale

Guardrails first (cheap, protects all later work) → core engineering behavior (auto-fitting, inspector) → persistence overhaul (storage root) *before* e2e stabilization (it changes what e2e tests assert) → deliverables (BOM CSV, PDF) → test gate → release engineering last. Each phase ends with a verification gate; do not start the next phase with a red gate.

```
P0 Guardrails ─→ P1 Auto-fitting ─→ P2 Inspector ─→ P3 Storage+Onboarding ─→ P4 BOM CSV ─→ P5 PDF ─→ P6 Test gate ─→ P7 Release eng. ─→ P8 RC + ship
```

P4 and P5 are independent of each other and of P3; if a phase blocks, they can be pulled forward.

---

## Phase 0 — Guardrails & repo hygiene (~2–3 days)

The point: stop hidden breakage and make the repo presentable before deep work begins.

1. **Commit or stash the ~20 dirty files** at HEAD (`git status` shows modified docs, tests, `featureFlags.ts`, `projectMode.ts`, schema files). Review each hunk — these include the WS6c/WS5/WS7/WS9 follow-up work; nothing should be lost or accidentally shipped half-done.
2. **Un-ignore TypeScript errors.** Remove `typescript.ignoreBuildErrors: true` from `next.config.js`. Run `tsc --noEmit`, fix every revealed error (unknown volume — budget a day; if >2 days of errors surface, triage: fix release-path code, `@ts-expect-error` with a tracked TODO elsewhere).
3. **CI gate hardening:** make `ci.yml` fail on type-check, lint, and unit tests if it doesn't already; confirm `verify:all` runs in CI, not just locally.
4. **Repo cleanup commit:** remove committed junk — root `node_modules`, `*.vsix` binaries, debug logs (`debug_output_*.txt`, `dev-server*.log`, `build-archive.log`), scratch Python scripts (`fix_crop*.py`, `ruler.py`, etc.), stray screenshots, `nul`. Add `.gitignore` entries so they stay out. Keep PLAN/docs files.
5. **Confirm Vibe Kanban (dev-only, app root) is excluded from production builds** — verify the gate, add one if missing.
6. **Top-level README:** replace the one-liner with a real README (what the app is, install, dev setup, build). Can be drafted now, polished in P7.

**Gate:** `pnpm type-check` clean · CI green on a no-op PR · `git status` clean · production build contains no dev-only routes.

---

## Phase 1 — Auto-fitting wrap-up, Waves 1–2 (~1–1.5 weeks)

Execute `hvac-design-app/docs/ductwork-program/PLAN_wrapup-auto-fitting.md` Waves 1–2 exactly as written there. Summary:

**Wave 1 — always on (D-AF-1):**
1. `isAutoFittingDefaultEnabled()` returns `true` for both Design and Estimation modes; record as **D12** in `Workstream_Decomposition.md`, update WS8 ticket note.
2. Add persisted per-project `autoFittingEnabled: boolean` (default `true`); resolution order: per-project setting → session override (tests/tools) → default `true`.
3. Remove the dead `NEXT_PUBLIC_ENABLE_AUTO_FITTING` fallback from `DuctTool.isAutoFittingEnabled()` and both `.env` examples + `.env.local`.
4. Update projectMode tests (Estimation→on), add default-on assertion for new projects.

**Wave 2 — user control + cutback protection (D-AF-3):**
5. Toolbar/Inspector toggle bound to the persisted setting, with visible state (pill/chip).
6. Cutback regression gate: ratify `WS6D_DESIGN_GEOMETRY=on` as shipped default; add integration/e2e assertion that a duct drawn into an auto-inserted fitting ends exactly at the port opening and re-extends on fitting delete.
7. No cutback toggle (correctness, not preference).

**Also in this phase (pulled from Wave 4 since it's small):**
8. WS9 `it.todo`: golden coverage for the near-60° tee/wye hysteresis boundary (55/65 deadband), remove the todo.

**Gate:** full unit/integration + golden suites green · `uj-ec-auto-fitting.spec.ts` passes **with no env override** · cutback regression test green.

---

## Phase 2 — Inspector Overview completion (~1 week)

Finish `PLAN-inspector-overview-completion.md` fully (D-REL-5):

1. **Auto-Fix Geometry does real work.** Define the fix set explicitly first (suggested: re-run auto-fitting plan + cutback re-trim + orphaned-endpoint restore — i.e., a one-click "reconcile everything" built on `buildReRunPlan` + `ConnectionReconciliationService`), then wire it. It must report what it changed (insert/update/remove counts) and be undoable as one history step.
2. **Health "Locate" focuses + zooms the canvas** to the offending entity (select entity, animate viewport).
3. **Loading/error states driven by live data** in `useInspectorOverviewData.ts` (no hardcoded states).
4. **Systems section reads calculation result state**, not entity-derived fields.
5. **Project `modified` reliably updated by all canvas write commands** — audit the command/`entityActions` write layer so every mutation path flips the dirty flag (this also matters for P3 save semantics).

**Gate:** manual script — break geometry on purpose, Auto-Fix repairs it with correct counts and single-step undo; Locate zooms; unit tests for `useInspectorOverviewData`; modified-flag test covering each write command.

---

## Phase 3 — Persistent storage root + first-launch onboarding (~2–2.5 weeks, largest phase)

Execute `PLAN-persistent-storage-root.md` then `PLAN-first-launch-modal.md` (D-REL-3). Storage root first — the modal's "create folder + migrate" step depends on it.

**3a. Persistent storage root (per its PLAN):**
- Storage root config + Tauri command surface (fs scope already granted for Documents/AppData per commit `3cb8826b`).
- Operation queue/locking; service + repository policy layer.
- Migration from IndexedDB/localStorage projects; quarantine handling for corrupt files.
- Settings UI for viewing/changing the root (`ChangeLocationDialog` exists as a stub — finish it).
- Live reload notifications. Out of scope (unchanged): cloud sync, log viewer UI.
- **Web/Tauri parity:** web build keeps IndexedDB; adapter selection via existing `isTauri()` pattern. Run `parity:check`.

**3b. First-launch modal (per its PLAN, with its recommended answers ratified here):**
- Show once ever (localStorage tracking) · folder location changeable later via Settings · auto-migrate existing projects on setup.
- Creates `Documents/SizeWise/Projects` after permission; graceful skip path keeps IndexedDB.

**Risk note:** this phase touches the same persistence layer whose key-mismatch bugs caused the 2026-01 data-loss incidents (`sws.projectIndex` vs `project-storage`). Write migration tests *first*, including: existing-user upgrade, corrupted index, mid-migration crash (idempotent resume), and downgrade/rollback behavior.

**Gate:** migration test matrix green · fresh install on a clean Windows VM and clean macOS machine walks the modal end-to-end · existing dev profile upgrades without data loss · `parity:check` green.

---

## Phase 4 — WS7-FU-001: BOM CSV reconcile, golden-first (~3–4 days)

Per the follow-up doc's own safety rail (D-REL-6) — this was reverted once before, so the order is non-negotiable:

1. **Snapshot current live CSV output as golden fixtures first** (several representative projects: mixed shapes, gauges, unpriced items, multi-system).
2. Reduce `csv.ts generateBillOfMaterials` to a pure formatter over canonical `BOMItem[]` from the WS7 pipeline.
3. Diff against goldens. **Only allowed diffs:** gauge-driven line splits and `$0 → Unpriced`. Anything else is a regression — fix or revert.

**Gate:** golden diffs limited to the two allowed classes · `bom-cost.integration.test.ts` + `export-workflow.test.ts` green · one manual export from the UI eyeballed against the golden.

---

## Phase 5 — Real PDF export (~3–5 days)

Replace the placeholder in `src/core/services/export/pdfGenerator.ts` (D-REL-1):

1. **Library: jsPDF + jspdf-autotable** (client-side, no server, works in both web and Tauri webview; the file's own comment suggests it). Verify CSP `script-src 'self'` compatibility — bundle, don't CDN-load.
2. **v1.0 report contents:** title page (project name, date, logo), project summary (mode, system counts, totals), BOM table (the canonical `BOMItem[]` from P4 — id, description, size/gauge, qty/LF, unit price, line total, Unpriced flagged), cost estimate breakdown (material/labor/markup/waste from calculation settings), footer with app version + page numbers.
3. **Explicit non-goals for v1.0:** canvas drawing/plan-view render in the PDF (that's a v1.1 feature — snapshotting Konva to an image is its own project), custom templates/branding.
4. Wire to the existing export UI path; respect `includeBOM`/`includePricing` options; Tauri save dialog via existing plugin-dialog.
5. Tests: unit test that output parses as valid PDF (e.g., pdf-parse in test env) with expected text content; e2e export smoke in the export-workflow journey.

**Gate:** exported PDF opens in Acrobat/Preview/Edge · BOM totals match CSV export exactly for the same project · tests green.

---

## Phase 6 — Test gate: chromium green + flake fixes (~1 week)

D-REL-4. Done *after* P3 because persistence changes invalidate today's failures.

1. Fix the remaining `uj-gs-007` failures and `uj-pm-003` edit-project failures (re-triage first — P3 likely changed the landscape).
2. Fix hydration-race flake with deterministic waits on store rehydration (expose a test hook/`data-hydrated` attr rather than timeouts); fix toast-timing assertions.
3. Remove or implement the skipped `example.spec.ts` describes; delete dead test scaffolding.
4. Add the new e2e the earlier phases require if not already landed: auto-fitting default-on journey, cutback seam assertion, first-launch modal journey, PDF/CSV export journey.
5. **CI:** `e2e.yml` chromium project becomes a required check; firefox/webkit run scheduled/non-blocking.
6. Pending suites (`surfaceWeight.pending.test.ts`) stay intentionally red in their separate config — document in TESTING_EXPECTATIONS.md that they're v1.1 backlog, confirm the blocking gate excludes them.

**Gate:** chromium e2e 100% pass, 3 consecutive CI runs (flake check) · unit/integration/golden suites green · coverage ≥ current 70% threshold.

---

## Phase 7 — Release engineering (~1–1.5 weeks, partly waiting on external cert processes)

**Start the credential acquisition at the beginning of P1 — it has multi-week lead time and runs in the background:**
- **Windows:** OV/EV code-signing certificate (EV recommended — instant SmartScreen reputation; OV builds reputation slowly). Budget and order early.
- **macOS:** Apple Developer Program ($99/yr), Developer ID Application cert, notarization via `notarytool`.

**Engineering work:**
1. **Flag retirement (auto-fitting Wave 4):** after the P1–P6 soak, delete the dead `'false'` branches of all WS flags (`WS1`, `WS2`, `WS3`, `WS5`, `WS6_CONSTRUCTION_DERIVATION`, `WS6D_DESIGN_GEOMETRY`, `WS7_BOM_PRICING`, `WS7_WEIGHT_PRICING`, `WS8_PROJECT_MODE`'s auto-fitting hook) and the flag plumbing they no longer need. One PR per flag for revertability.
2. **Fix the static-export mismatch:** `tauri.conf.json` expects `frontendDist: ../out`, but `tauri:build` doesn't set `NEXT_STATIC_EXPORT=true`. Make `tauri:build` set it explicitly and verify dynamic routes survive export (or document the standalone alternative). This is currently a broken-build landmine.
3. **Signing in `tauri-release.yml`:** Windows cert via secrets (`TAURI_SIGNING_PRIVATE_KEY` / signtool step), macOS signing + notarization env (`APPLE_CERTIFICATE`, `APPLE_ID`, `APPLE_TEAM_ID`...). Build matrix: windows-latest + macos-latest. Drop Linux from the v1.0 release matrix (unsigned Linux can stay as a CI artifact).
4. **Updater: deferred to v1.1.** Rationale: signing infra is brand-new this release; updater key management + endpoint hosting is its own project. v1.0 ships with a "check for updates" menu item linking to the GitHub releases page. (Flag this now: it means v1.0→v1.1 is a manual reinstall.)
5. **Version + changelog:** bump to `1.0.0` in `package.json`, `tauri.conf.json`, `.env` examples. Move CHANGELOG `[Unreleased]` into `[1.0.0]` with everything shipped in P1–P6 added.
6. **Docs close-out:** README/BUILD_ORDER status marks in the ductwork program, mark FU-1..FU-5 resolved (FU-2 WS6e detection tail — see backlog note below), record D12 + D-REL-1..7 in the decision logs. Finish top-level README from P0. Update SECURITY.md contact if stale.

**Gate:** signed installers produced by CI from a release tag · SmartScreen shows publisher name on Windows · Gatekeeper opens the notarized .dmg without warnings.

---

## Phase 8 — Release candidate & ship (~3–4 days)

1. Tag `v1.0.0-rc.1` → CI builds signed installers.
2. **Clean-machine smoke matrix** (real hardware or VMs, not the dev machine): Windows 10, Windows 11, latest macOS (Apple Silicon) — install → first-launch modal → create project → draw ducts (auto-fitting fires) → inspect → BOM → export CSV + PDF → quit → relaunch → project persists → uninstall cleanly.
3. Fix-forward any RC findings; repeat until a clean pass.
4. Tag `v1.0.0`, publish the GitHub release with changelog, attach installers.
5. Post-release: branch protection on main requires the P6 gates; open v1.1 milestone with the deferred backlog.

---

## Explicitly deferred to v1.1 (the honest cut-line)

| Item | Source decision |
|---|---|
| Ghost fitting preview + per-conflict review UX (auto-fitting Wave 3 items 8–9) | D-REL-7 |
| `ITopoStrategy` strategy refactor | D-AF-2 |
| Auto-updater | P7 item 4 |
| Canvas drawing render inside PDF reports | P5 non-goal |
| WS6e detection tail (FU-2) — **unless it surfaces as a correctness bug in P1/P6 testing, in which case it pulls into v1.0** | scope call |
| Firefox/webkit e2e as blocking gates | D-REL-4 |
| Pending surface-weight/golden suites (Bucket B) | existing WS9 scope |
| Cloud sync, log viewer UI | storage-root PLAN non-goals |

---

## Effort summary (sequential, solo + AI)

| Phase | Estimate |
|---|---|
| P0 Guardrails | 2–3 days |
| P1 Auto-fitting W1–2 | 1–1.5 wk |
| P2 Inspector | 1 wk |
| P3 Storage + onboarding | 2–2.5 wk |
| P4 BOM CSV | 3–4 days |
| P5 PDF | 3–5 days |
| P6 Test gate | 1 wk |
| P7 Release eng. | 1–1.5 wk (cert lead time parallel) |
| P8 RC + ship | 3–4 days |
| **Total** | **~8–10 weeks** |

**Standing risks:** (1) P3 is the only phase with real data-loss potential — its migration-test-first rule is the mitigation; (2) unknown TS error volume in P0; (3) cert acquisition lead time — order in week 1; (4) the once-reverted P4 refactor — goldens-first is the mitigation.
