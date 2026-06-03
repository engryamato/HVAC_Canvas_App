# TICKET WS6f — Narrow v1 to air ductwork + equipment (remove specialized applications)

**Supersedes:** the original WS6f (grease/combustion forced-confirmation) — **cancelled**. v1 is air-only, so there is no grease confirmation to build; instead we remove specialized support.
**Milestone:** M1 (do early — simplifies every downstream ticket) · **Priority:** P0 · **Effort:** ~12–18h (schema unions + catalog + icons + tests)
**Type:** Scope removal / refactor · **Status:** Ready · **Code changes:** none until all docs done
**Gate:** `pnpm parity:check` (`[[core-flows-refactor-parity-gate]]`); greenfield (D5) so no migration.

## Context

v1 ships as a **professional HVAC air-ductwork + equipment** design/estimating tool. Specialized non-air applications must be removed so the product carries no trace of them. (User directive, this session.)

## Decision (locked)

- **Delete from schema + code** (D-WS6f-1) — full removal, not hide.
- **Scope = ALL non-air `engineeringSystem` values**, not just grease. `EngineeringSystemSchema` (`unified-component.schema.ts:15-21`) = `standard_duct`, `boiler_flue`, `grease_duct`, `generator_exhaust`, `universal`. **Keep:** `standard_duct`, `universal` (air). **Remove:** `grease_duct`, `boiler_flue`, `generator_exhaust`.
- **[Open — confirm]** boiler_flue + generator_exhaust were surfaced by the audit (not in the original ask). Default: remove them too (they're specialized). Carve out if you want either kept.

## Removal inventory (grease = complete; boiler/generator need the same sweep at ticket start)

**Enum (root):** `unified-component.schema.ts:15-21` (`EngineeringSystemSchema`), `duct-run.schema.ts:18-23` (`DuctRunFamilySchema`).

**Schema discriminated-union branches (riskiest — union rewrite):**
- `duct.schema.ts:148-184` — `GreaseDuctPropsSchema` (`constructionType`/`fireRating`/`liquidTight`/`weldSpec`) in `DuctPropsSchema` union.
- `equipment.schema.ts:154-197` — `GreaseDuctEquipmentPropsSchema` (`greaseExtractionStage`/`fireSuppressionReady`).
- `fitting.schema.ts:115-151` — `GreaseDuctFittingPropsSchema` (`weldedAccessRequired`/`greaseRated`).
- (+ equivalent `boiler_flue`/`generator_exhaust` branches if present — sweep at start.)

**Catalog / seed:** `componentLibraryInitializer.ts` — category `:32`, profile `:105-158`, duct entries `:781-842`, fittings `:847-899`, equipment `:904-945`, accessories `:951-960`, `ENTRY_IDS.grease :213-231`. `componentLibraryStoreV2.ts:149/163/187/196/319`.

**Services / engine:** `CalculationEngineRegistry.ts:275-334` (`GreaseDuctSizingEngine`/`ComplianceEngine`/`GreaseDuctEngine`), registry map `:476`, `has()` `:512`; `entityCalculationRuntime.ts:50/169-170`.

**UI:** `canvas.store.ts:111`; `placementStrategies.ts:19,200-273` (`GreaseDuctStrategy`); `FittingTool.ts:229,241-246`; `fittingDefaults.ts:52,82`; `equipmentDefaults.ts:195,245`; `ServiceContextStrip.tsx:25`; `EquipmentPlacementDialog.tsx:425`; `CatalogPanel.tsx:60`; `ManagePanel.tsx:65`; `catalogIcons.tsx` (~130 lines: unions `:19-93`, renders `:180-312`, mappings `:913-1296`); `summarizeDuctRunQuantity.ts:50`.

**Tests:** schema tests (`duct-run`/`fitting`/`unified-component`), `componentLibraryInitializer.test.ts:27/68`, `fabricationProfileStore.test.ts:45`, `CalculationEngineRegistry.test.ts:53/59`, `catalogIcons.test.tsx:91`, `summarizeDuctRunQuantity.test.ts:40/51-52`.

**Assets:** `public/branding/hvac-library/catalog-icons/*grease*.svg` (6 files) + `manifest.json`; `scripts/export-catalog-icons.tsx:12-72`.

**Docs:** plan §5 (drop grease/combustion from system types), §29 (delete grease confirmation), §31; this updates as part of the doc sweep.

## Proposed change

1. **Reduce `EngineeringSystemSchema` to air-only** (`standard_duct`, `universal`); remove the specialized values.
2. **Collapse the discriminated unions** (`DuctPropsSchema`/`EquipmentPropsSchema`/`FittingPropsSchema`) to the air branches; delete the specialized branch schemas + their fields.
3. **Delete catalog seed** entries, profiles, `ENTRY_IDS` namespaces, and category-tree nodes for specialized systems.
4. **Delete engine classes** (`GreaseDuctSizingEngine`/`ComplianceEngine`/`Engine`) + registry entries; remove engine branching.
5. **Strip UI**: placement strategies, tool enum entries, system-type labels, catalog/manage filters, EquipmentPlacementDialog options, and the specialized icons (+ assets + manifest + export script).
6. **Update/remove tests** referencing specialized systems.
7. **Greenfield load (D5):** a project that contained a specialized entity — define behavior: drop the entity on load with a console note, or fail-soft to `standard_duct`. (open item).

## Acceptance criteria

1. `EngineeringSystemSchema` = air-only; no specialized value parses.
2. No specialized branch remains in any Props discriminated union; typecheck clean.
3. Catalog/library exposes no specialized entries; no specialized icons ship.
4. No engine/service/tool/UI path references the removed systems (grep clean).
5. Tests updated/removed; suite green; **`pnpm parity:check` passes**.
6. The product surfaces only air ductwork + equipment end-to-end (draw → catalog → BOM → export).

## Testing plan

| Layer | What | Count |
|---|---|---|
| Unit | schema rejects specialized engineeringSystem values | +1 |
| Unit | Props unions parse air entities; specialized shapes fail | +2 |
| Unit | catalog init contains zero specialized entries | +1 |
| Grep-guard | a test asserting no `grease`/`boiler_flue`/`generator_exhaust` identifiers remain in src | +1 |
| Parity | `pnpm parity:check` green | gate |

## Rollback

Large removal; behind a scope flag is awkward (it's a deletion). Prefer a single revertable PR. Greenfield → no data migration. Revert = restore the deleted code (git).

## Dependencies & blocks

- **Depends on:** none. **Do early (M1)** — every downstream ticket (WS10 variant unions, WS5 sizing, WS3 CAS system-type cycle, catalog, BOM) is **simpler** without specialized branches.
- **Blocks:** nothing; unblocks simpler schemas for WS5/WS10/WS3.

## Open items

- **[confirm]** include `boiler_flue` + `generator_exhaust` in the removal (default: yes).
- **[at-ticket]** legacy-project load behavior for a specialized entity (drop vs coerce to standard).
- **[at-ticket]** complete the boiler/generator inventory (the grease inventory above is complete; sweep these two the same way before deleting).

## Out of scope

Combustion-air as a NEW feature (never added); any future re-introduction of specialized applications (post-v1).
