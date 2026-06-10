# TICKET WS8 — Persisted Estimation/Design project mode

**Milestone:** M3 · **Priority:** P1 · **Effort:** ~8–12h
**Type:** Feature (schema + wiring) · **Status:** Ready · **Code changes:** none until all docs done

## Context

The app serves two personas (estimator/takeoff vs designer). A persisted project mode sets sensible defaults for each. The existing `autoCalculate` toggle is **not** it — it's written with an `as never` cast, absent from the schema, not persisted, and gates only an Inspector label (`useInspectorOverviewData.ts:533`). WS8 adds a real mode. (Plan §17; `[[manual-duct-size-required]]`.)

## Decisions (locked)

- **New-project default = Estimation** (matches the takeoff emphasis; designers switch later).
- **Scope = posture + cost columns:** mode drives the WS5 size posture and WS7 cost-column visibility. **D12 supersedes the original auto-fitting-default flag:** auto-fitting now defaults on in every mode and is user-overridable per project through `autoFittingEnabled`.

## Current state (verified)

- `autoCalculate` inert (`useInspectorOverviewData.ts:533`, `as never`); not on `CalculationSettingsSchema`; not persisted; gates an Inspector label only.
- `NewProjectDialog` exists (project creation).
- WS5 provenance engine; WS7 cost columns; WS6 auto-fitting now defaults on through the persisted `autoFittingEnabled` project setting per D12.

## Proposed change

1. **Schema:** add `projectMode: z.enum(['estimation','design'])` to the project/calculation settings schema (persisted). Greenfield: old projects load → default **`estimation`**.
2. **Default + creation:** new project defaults to `estimation`; no extra creation step (no picker — straight default per the decision). A switch lives in the project/Inspector settings (replacing the inert `autoCalculate` toggle).
3. **Mode drives (the flags WS8 owns; behaviors elsewhere):**
   - **Size posture (WS5):** `estimation` → initial provenance leans manual (fields await user entry per WS5's default-state rule); `design` → more `computed`.
   - **Cost columns (WS7):** visible in `estimation`; collapsible in `design`.
   - **Auto-fitting default flag:** `design` → on; `estimation` → off (WS6 reads this flag; matches current de-facto off).
   - **D12 supersession:** auto-fitting is no longer mode-driven. It defaults on in all modes and persists as `autoFittingEnabled`.
4. **Remove the inert `autoCalculate`** path (or alias it to `projectMode` for back-compat of the label).

## Acceptance criteria

1. `projectMode` exists on the settings schema, persists across reload; old projects default to `estimation`.
2. New projects start in `estimation`; the mode switch changes + persists it.
3. Mode flips the documented defaults: WS5 posture and WS7 cost-column visibility. Auto-fitting remains on unless the project-level `autoFittingEnabled` preference is turned off.
4. The inert `autoCalculate` no longer drives anything (removed or aliased); no `as never` cast remains.
5. `pnpm typecheck` clean.

## Testing plan

| Layer | What | Count |
|---|---|---|
| Unit | `projectMode` persists; old project defaults to estimation | +2 |
| Unit | new project = estimation; switch persists | +1 |
| Unit | mode flips WS5 posture flag / WS7 cost-column flag while auto-fitting remains mode-independent | +3 |
| Unit | `autoCalculate` removed/aliased; no `as never` | +1 |

## Rollback

Behind a WS8 flag. Additive schema field; greenfield. Revert = drop the field + restore the prior (inert) toggle.

## Files reference

| File | Change |
|---|---|
| `src/core/schema/calculation-settings.schema.ts` (or project settings) | add `projectMode` |
| `src/features/.../useInspectorOverviewData.ts:533` | replace inert `autoCalculate` with real `projectMode` |
| `src/features/dashboard/components/NewProjectDialog.tsx` | default new project to `estimation` |
| WS5 (posture), WS7 (cost columns) | read `projectMode` |
| WS6 (auto-fitting) | read `autoFittingEnabled` |

## Dependencies & blocks

- **Depends on:** WS5 (posture flag consumer), WS7 (cost columns). WS6 reads `autoFittingEnabled`.
- **Blocks:** nothing.

## Open items

- **[at-ticket]** exact mapping of `estimation` posture to WS5 initial provenance (how many fields start `default` vs awaiting-manual).
- **[at-ticket]** whether to keep `autoCalculate` as a read-only alias of `projectMode` for any external reference.

## Out of scope

The behaviors themselves (WS5/WS6/WS7); per-project price book; metric.
