# TICKET WS7 — Estimation BOM & pricing correctness

**Milestone:** M3 · **Priority:** P0 (highest correctness risk in the program) · **Effort:** ~16–22h
**Type:** Bug fix + refactor · **Status:** Ready · **Code changes:** not in this ticket — spec only

## Context

SizeWise produces cost estimates, but the live cost path can be **silently wrong**: it joins pricing to the catalog by name and costs unmatched items at **$0 with no warning**. There are also two divergent BOM generators, and `gauge` (which changes weight/price) is never costed. For an estimating tool, a wrong number that looks complete is worse than a visible gap. (Spec basis: plan Part 4 §20; `[[cost-estimation-gaps]]`.)

**Scope decisions (locked):** **full reconcile** to one canonical pipeline (D-WS7-1); **strict id-only** pricing identity (D-WS7-2).

## Current state (verified)

- **Two BOM generators:** typed `bomGenerationService.ts` (`BOMItem:16`, `groupKey:222`, LF/material/size/waste; **already carries `catalogItemId`** at `:228/293/325`) vs live-UI `csv.ts:337 generateBillOfMaterials` (per-EA, drops structured size/material/LF).
- **Live UI path:** `useBOM.ts` builds an id map (`:98`) AND a name map (`:100-101`) but **joins by name** (`:123 componentLookupByName.get(item.name.toLowerCase())`); unmatched → `materialCost 0`.
- **`catalogItemId` IS populated on placement:** `DuctTool.ts:616` (`activeComponent?.id` — optional), `FittingTool.ts:226`, `EquipmentTool.ts:191/218`, `supportPlacement.ts` (`entry.id`); propagated on copy (`entityCommands.ts:192`). So id-join has real data; manually-drawn ducts with no active component are the gap.
- **Cost engine:** `costCalculationService.ts` (`getPricingData ~:350-367`, `calculateProjectCost:111`); presets + labor/markup/waste in `settingsStore`.
- **Gauge:** `duct.schema.ts:116` — present, read by neither BOM generator nor cost.
- **Cost-aware export:** `bomExportService.ts` (`BOMExportRow:11`, `exportCostEstimateToCSV:53`, `includePricing:113`).
- **"Export blockers":** `ValidationDashboard.tsx:147` counts a label only; not enforced.

## Proposed change

1. **Canonical pipeline (full reconcile).** Make `bomGenerationService` the single source. `useBOM` + the canvas BOM panel + `costCalculationService` + `bomExportService` all consume its `BOMItem[]`. Reduce `csv.ts:337 generateBillOfMaterials` to a **formatter** over the canonical items (no second generation logic).
2. **Strict id-only pricing.** Join pricing by `catalogItemId`. **No name fallback.** An item without a resolvable `catalogItemId` → **Unpriced** (a distinct state, not $0).
3. **Never silent $0.** Unpriced lines are rendered as **Unpriced**, **excluded from the confident subtotal**, and **counted**. (Expect more Unpriced lines than today — that is the truth surfacing, not a regression; see Risks.)
4. **Gauge as a cost + grouping dimension.** Add `gauge` to the duct `groupKey` (`bomGenerationService.ts:222`) and to the cost calc, so two ducts differing only by gauge are two priced lines.
5. **Soft pre-export estimate-quality gate (non-blocking).** Before export, surface counts: "N unpriced · M gauge-split lines · K inferred sizes". Export proceeds (advisory, matching the non-blocking validation model), but confidence is visible first.

## Acceptance criteria

1. One BOM pipeline feeds canvas panel, cost calc, and CSV/estimate export; `csv.ts` no longer holds a second generator.
2. Pricing joins by `catalogItemId` only; a renamed catalog item still prices correctly; **no name-based join remains**.
3. An item with no resolvable `catalogItemId` shows **Unpriced**, is excluded from the confident subtotal, and increments the unpriced counter — never $0.
4. Two ducts identical except `gauge` → two distinct BOM/cost lines.
5. Pre-export gate displays unpriced/gauge-split/inferred counts; export proceeds with the counts shown.
6. Existing cost presets (Commercial/Residential/Industrial) + labor/markup/waste settings still apply unchanged.
7. `pnpm typecheck` clean.

## Testing plan

| Layer | What | Count |
|---|---|---|
| Unit | `bomGenerationService` groups ducts by size+material+**gauge**; LF + waste correct | +3 |
| Unit | pricing join by `catalogItemId`; no-id → `unpriced` (not $0); renamed item still prices | +3 |
| Unit | cost calc excludes unpriced from confident total; gauge changes unit cost | +2 |
| Integration | canvas BOM panel, cost calc, export read identical line items (one pipeline) | +1 |
| E2E (gstack) | 2 ducts (same size, diff gauge) + 1 no-catalog item → 2 gauge lines + 1 Unpriced; export shows "1 unpriced" | +1 |

Regression: snapshot a sample project's estimate; the only intended total change is gauge-driven line splits and previously-hidden $0 items becoming Unpriced.

## Rollback

**[Decision] Behind a dedicated WS7 feature flag.** Off → restore the legacy `csv.ts` name-join path. No schema migration (gauge + catalogItemId already exist). Revert = drop the flag.

## Files reference

| File | Change |
|---|---|
| `src/core/services/bom/bomGenerationService.ts:222` | add `gauge` to duct `groupKey`; remain canonical source |
| `src/features/canvas/hooks/useBOM.ts:98-123` | consume `bomGenerationService`; join by `catalogItemId`; drop name map; set `unpriced` on miss |
| `src/utils/.../csv.ts:337` | reduce to a formatter over canonical `BOMItem[]` |
| `src/core/services/cost/costCalculationService.ts:350-367` | price by id; exclude unpriced from confident total; gauge-aware unit cost |
| `src/core/services/export/bomExportService.ts:53` | format canonical items; show Unpriced + counts |
| `src/features/canvas/components/ValidationDashboard.tsx:147` | non-blocking pre-export estimate-quality counts |

## Dependencies & blocks

- **Depends on:** none functionally (touches the BOM/cost pipeline, not `entityActions`). Sequenced in M3 after foundation.
- **Feeds:** WS8 (project mode shows cost columns); consumes WS9 BOM truth cases if available.

## Open items

- Pricing identity: **RESOLVED — strict id-only** (no name fallback).
- Pipeline: **RESOLVED — full reconcile** (single canonical generator).
- **[at-ticket]** Unpriced UI treatment (badge/row styling) + the exact confident-subtotal semantics (exclude vs show-as-separate-line).
- **[at-ticket]** whether `csv.ts` formatter is retired entirely or kept as the CSV serializer.

## Risks

- **More Unpriced lines than before.** Strict id-only surfaces every entity that was previously name-matched (often wrongly) or $0'd. This is the intended truth, but communicate it: the estimate now shows what's genuinely unpriced. The pre-export gate (#5) is the mitigation.

## Out of scope

Per-project price book / price overrides (follow-on PRD); metric `unitSystem`; surface area/weight (WS6); the persisted Estimation/Design mode (WS8).
