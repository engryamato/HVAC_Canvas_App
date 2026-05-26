# SizeWise Visual Standard v2.1 Integration

## Purpose

This document distills the April 2026 SizeWise visual standard into the DuctRun hydration plan. It is the implementation companion for `PHASE-BY-PHASE.md`; the source PDFs remain:

- `/Users/johnreyrazonable/Downloads/SizeWise_Implementation_Plan_v2_1.pdf`
- `/Users/johnreyrazonable/Downloads/SizeWise_Visual_Standard_April2026_1.pdf`

## Rendering Principle

SizeWise uses line-based parametric plan-view rendering. Canvas entities must be generated from user/property data, not decorative approximations or product illustrations.

The visual meaning is split into three independent layers:

- Color answers: what air system is this serving?
- Line pattern answers: what duct construction type is this?
- Geometry answers: what element or fitting type is this?

## System Color Contract

All renderers must use `SYSTEM_COLOR_MAP` through `getElementColor()`.

| System | Ducts/Fittings | Accessories/Equipment | Airflow/Text/Labels |
| --- | --- | --- | --- |
| `supply` | `#66BB6A` | `#2E7D32` | `#2E7D32` |
| `return` | `#42A5F5` | `#1565C0` | `#1565C0` |
| `exhaust` | `#EF5350` | `#C62828` | `#C62828` |
| `outside` | `#26C6DA` | `#00838F` | `#00838F` |
| `relief` | `#AB47BC` | `#6A1B9A` | `#6A1B9A` |
| `transfer` | `#FFA726` | `#EF6C00` | `#EF6C00` |
| `general` | `#9E9E9E` | `#757575` | `#757575` |
| `unassigned` | `#9E9E9E` | `#757575` | `#757575` |
| `other` | `#9E9E9E` | `#757575` | `#757575` |

Rules:

- `outside_air` is legacy input and normalizes to `outside`.
- Missing, blank, unsupported, or invalid system values normalize to `unassigned`.
- Non-system labels always use `#424242`.
- Selected state always uses `#1976D2`.
- Construction indicators use the same tone as the duct or fitting they belong to.
- Renderers must not store or depend on random element colors for ductwork identity.

## Construction Contract

All construction indicators must use `getConstructionStyle()` and follow actual duct or fitting geometry.

| Construction type | Visual rule | Dimension rule |
| --- | --- | --- |
| `singleWall` | OD lines only | OD equals clear dimension for airflow |
| `lined` | dashed inner ID lines | inner offset equals `linerThickness` |
| `doubleWall` | solid inner ID lines | inner offset equals `innerWallThickness` |
| `externallyWrapped` | dashed outer offset line | outer offset equals `wrapThickness` |
| `externallyInsulated` | dashed outer offset line | outer offset equals `insulationThickness` |
| `internallyInsulated` | dashed inner ID lines | inner offset equals `insulationThickness` |
| `flexible` | ribbed plan-view pattern | rib spacing equals `ribSpacing` or default |

Construction indicators never change system color. They are engineering line symbols only; do not use textures, gradients, shadows, hatching, 3D effects, or product-level details.

## OD/ID Rule

- OD is the user-entered visible outside duct boundary.
- OD drives layout, hit testing, clash detection, visible walls, section markers, end markers, and viewport bounds.
- ID is derived from OD minus construction offset.
- ID drives airflow sizing, pressure calculations, and inner construction indicator placement.
- ID must not be entered or stored independently.
- For `singleWall`, ID equals OD.

## Section Count Rule

Segment spans and marker lines are different quantities.

| Run length | Section length | Segment spans | Internal break lines | Terminal end markers |
| --- | --- | --- | --- | --- |
| 50 ft | 5 ft | 10 | 9 | 2 |
| 63 ft | 5 ft | 13 (12 full + 1 partial 3 ft) | 12 | 2 |
| 25 ft | 5 ft | 5 | 4 | 2 |

Section markers must follow duct size and shape. Generic marks that ignore duct width, diameter, flat oval shape, or OD geometry are not acceptable.

## Fitting and Equipment Rules

- Fittings are parametric plan-view geometry, not pasted icons.
- Fittings inherit run system color and construction conventions.
- Fitting construction indicators follow fitting geometry:
  - lined elbow: dashed inner lines follow the bend.
  - double-wall transition: solid inner lines follow the taper.
  - wrapped tee/wye: dashed outer offset follows each branch.
- Equipment connected to one system may inherit that system color.
- Equipment connected to multiple systems must use `equipmentSystemType`; if missing, default to `unassigned` or `general`.
- Equipment ports may inherit connected run colors, but the full equipment body must not arbitrarily switch based on a single connected port.

## State Priority

Renderers must derive visual state from context and then call `getElementColor()`.

Priority:

1. Active interaction state
2. Selected state
3. Validation or warning state
4. System color
5. Default unassigned color

If validation colors are not implemented yet, use interaction, selected, system, default.

No visual state may mutate `systemType`, `constructionType`, or stored color data.
