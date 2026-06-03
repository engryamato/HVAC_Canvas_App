# WS7 Follow-ups

WS7 shipped its **safe, high-value core** (strict id-only pricing, Unpriced-not-$0,
gauge as a cost/grouping dimension, advisory pre-export counts) behind flag
`WS7_BOM_PRICING`. The most invasive piece — reconciling the **live CSV output**
to the canonical pipeline — was deferred after verification found it changed
live money-output fidelity and broke existing contract tests.

## WS7-FU-001 — Reconcile csv.ts generateBillOfMaterials to the canonical pipeline

**Status:** deferred.

`src/features/export/csv.ts` `generateBillOfMaterials` remains the LEGACY
generator (kept intact; `csv-utils.test.ts` green). The ticket's goal #1 (reduce
it to a pure formatter over the canonical `BOMItem[]`) was reverted because the
first pass changed duct descriptions and dropped `Accessory` rows in the CSV
path — a live-output fidelity regression on an estimating tool. Reconcile later
with golden snapshots so the ONLY intended output change is gauge-driven line
splits + previously-$0 items becoming Unpriced.

## WS7-FU-002 — Wire the canvas BOM panel rows to canonical cost identity

**Status:** partial.

`BOMPanel` reads optional `bomItemId`/`unpriced` (added to the legacy
`csv.ts` `BomItem` as forward-compat fields, unset in the legacy path) and falls
back to an `itemNumber`-based cost key. Once FU-001 lands and the panel consumes
the canonical `BOMItem[]` directly, the row→`ItemCost` link should key on the
canonical `bomItemId` instead of the fallback.

## Shipped and green (service layer + flag)

- `bomGenerationService`: `gauge` in the duct groupKey; `unpriced` field;
  `summarizeQuality` (unpriced / gauge-split / inferred counts).
- `costCalculationService`: strict `catalogItemId`-only pricing; unpriced items
  excluded from `confidentSubtotal`; gauge-aware lines; advisory counts
  (`gaugeSplitLineCount` excludes unpriced to avoid double-counting).
- `useBOM`: WS7-on path joins by `catalogItemId` (no name fallback); legacy
  name-join preserved behind flag off.
- `bomExportService`: Unpriced rows + advisory counts + confident total.
- `ValidationDashboard`: non-blocking pre-export "N unpriced · M gauge-split · K
  inferred" counts.
