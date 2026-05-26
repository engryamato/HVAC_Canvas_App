# DuctRun Hydration Acceptance Checklist

Use this checklist during implementation review and QA signoff. Each item should be verified against the canvas, unit tests, and `REQUIREMENTS-MATRIX.md`.

## Documentation Gate

- [ ] `README.md` references the April 2026 visual standard and implementation plan v2.1.
- [ ] `PHASE-BY-PHASE.md` includes visual-token, construction, OD/ID, state-priority, and QA gates.
- [ ] `VISUAL-STANDARD-V2-1.md` summarizes color, construction, OD/ID, section, fitting, equipment, and state rules.
- [ ] `REQUIREMENTS-MATRIX.md` has rows for all visual-standard sections.
- [ ] Each implemented requirement row has a test ID and status update.

## Token API

- [ ] `SYSTEM_COLOR_MAP` contains exact colors for `supply`, `return`, `exhaust`, `outside`, `relief`, `transfer`, `general`, `unassigned`, and `other`.
- [ ] `getElementColor()` is the only color lookup used by duct, duct-run, fitting, equipment, accessory, marker, airflow, and label rendering.
- [ ] `getConstructionStyle()` returns construction geometry descriptors only.
- [ ] `getConstructionStyle()` never returns color and never calls `getElementColor()`.
- [ ] Legacy `outside_air` normalizes to `outside`.
- [ ] Missing, blank, unsupported, or invalid system types normalize to `unassigned`.

## Schema and Ownership

- [ ] `DuctRun` supports `constructionType`, `linerThickness`, `innerWallThickness`, `wrapThickness`, `insulationThickness`, and `ribSpacing`.
- [ ] Legacy ducts default to `singleWall` when construction data is missing.
- [ ] `duct_run.props.systemType` is the source of truth for connected child colors.
- [ ] Child segments, fittings, accessories, airflow graphics, labels, end markers, section markers, and construction indicators do not store random colors as primary identity.
- [ ] Multi-system equipment uses `equipmentSystemType` or defaults to `unassigned`/`general`.

## Geometry

- [ ] `DuctRunGeometryService` returns centerline geometry.
- [ ] `DuctRunGeometryService` returns `odBodyPolygon`.
- [ ] `DuctRunGeometryService` returns `idBodyPolygon`.
- [ ] `DuctRunGeometryService` returns segment OD polygons.
- [ ] `DuctRunGeometryService` returns segment ID polygons.
- [ ] `DuctRunGeometryService` returns terminal end-marker coordinates.
- [ ] `DuctRunGeometryService` returns internal section-marker coordinates.
- [ ] `DuctRunGeometryService` returns label anchors.
- [ ] Hit testing uses OD, not ID.
- [ ] ID is derived from OD minus construction offset.
- [ ] `singleWall` ID equals OD.
- [ ] OD dimensions do not change when `constructionType` changes.

## Duct Run Rendering

- [ ] Duct runs render as double-line plan-view geometry driven by OD dimensions.
- [ ] All duct lines use unified 1.5 px base stroke at 100% zoom.
- [ ] End markers are perpendicular to run direction and extend slightly beyond OD.
- [ ] Section markers follow actual duct size and shape.
- [ ] `50 ft / 5 ft` renders 10 segment spans, 9 internal break lines, and 2 terminal end markers.
- [ ] `63 ft / 5 ft` renders 13 segment spans, 12 internal break lines, and 2 terminal end markers.
- [ ] Partial segments render at proportional length.
- [ ] System labels use system color.
- [ ] Non-system labels use `#424242`.
- [ ] No hardcoded hex colors remain in `DuctRunRenderer.ts`.

## Construction Rendering

- [ ] `singleWall` renders OD lines only.
- [ ] `lined` renders dashed inner lines offset by `linerThickness`.
- [ ] `doubleWall` renders solid inner lines offset by `innerWallThickness`.
- [ ] `externallyWrapped` renders dashed outer offset using `wrapThickness`.
- [ ] `externallyInsulated` renders dashed outer offset using `insulationThickness`.
- [ ] `internallyInsulated` renders dashed inner lines offset by `insulationThickness`.
- [ ] `flexible` renders ribbed plan-view pattern using `ribSpacing` or a default.
- [ ] Construction indicators use the same system tone as the duct/fitting they belong to.
- [ ] Changing `constructionType` does not change system color.
- [ ] Construction labels use `#424242`.

## Fittings, Accessories, and Equipment

- [ ] Fittings use parent run duct/fitting color tone.
- [ ] Fittings use unified 1.5 px base stroke.
- [ ] Fittings show end markers at open ends.
- [ ] Lined elbows show dashed inner lines following the bend.
- [ ] Double-wall transitions show solid inner lines following the taper.
- [ ] Wrapped tees/wyes show dashed outer offset lines following each branch.
- [ ] Accessories use accessory/equipment darker system tone.
- [ ] Accessories inherit construction from the duct they attach to.
- [ ] Equipment connected to one system may inherit that system.
- [ ] Equipment connected to multiple systems does not silently switch to one connected run color.
- [ ] Equipment ports may inherit connected run colors independently from the equipment body.

## State and Mutation

- [ ] `deriveVisualState()` is the canonical state-priority implementation.
- [ ] Selected elements render `#1976D2`.
- [ ] Deselected elements return to exact system-derived color.
- [ ] Hover, drag, snap, connection preview, invalid placement, and validation colors are temporary.
- [ ] Visual state changes do not mutate `systemType`.
- [ ] Visual state changes do not mutate `constructionType`.
- [ ] Visual state changes do not mutate stored color data.

## Legacy and Parity

- [ ] Legacy `duct` entities still load.
- [ ] Legacy `duct` entities render through shared color/construction APIs.
- [ ] Legacy `outside_air` projects render as `outside`.
- [ ] Tauri/web parity checks pass.
- [ ] No unguarded Tauri API usage is introduced into shared renderer/token code.

## Verification Commands

Run from `/Users/johnreyrazonable/Documents/GitHub/HVAC_Canvas_App/hvac-design-app`:

```bash
npm run type-check
npm run test
npm run lint
npm run parity:check
```
