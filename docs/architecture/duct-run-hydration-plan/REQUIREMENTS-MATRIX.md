# DuctRun Hydration Requirements Matrix

Use this matrix to track implementation against the SizeWise April 2026 visual standard and implementation plan v2.1.

Status values: `Pending`, `In Progress`, `Implemented`, `Verified`, `Deferred`.

| Rule ID | Source Section | Requirement | Phase | Test ID | Acceptance Criteria | Status |
| --- | --- | --- | --- | --- | --- | --- |
| R-001 | Visual Standard 1 | Render ductwork, fittings, accessories, and equipment as line-based plan-view geometry, not product illustrations. | 11, 19 | T-040 | Renderers use strokes/geometric shapes only; no texture, gradient, shadow, 3D, or product detail. | Pending |
| R-002 | Visual Standard 2 | Straight duct sections use double-line duct representation. | 10, 11 | T-030 | OD spacing matches user-entered width, height, diameter, or flat-oval size. | Pending |
| R-003 | Visual Standard 2 | OD drives layout and clash detection; ID is derived for airflow sizing. | 10 | T-030, T-031, T-033, T-034 | Geometry service exposes OD/ID outputs; hit zone uses OD; ID shrinks when construction offset applies. | Pending |
| R-004 | Visual Standard 3 | Geometry is parametric and synchronized with properties panel values. | 2, 9, 10, 15 | T-024, T-030 | Canvas output changes from stored length, size, system, construction, angle, and connection values. | Pending |
| R-005 | Visual Standard 4 | Ducts, fittings, and accessories show perpendicular end markers at open ends and section breaks. | 10, 11, 19 | T-020, T-021, T-022 | End markers use OD edges, same stroke, same element color, and scale with zoom. | Pending |
| R-006 | Visual Standard 5 | Section segmentation matches actual section lengths and takeoff quantity. | 5, 10, 11, 20 | T-020, T-021, T-022, T-023, T-024 | Segment spans match quantity summary; partial segment renders at proportional length. | Pending |
| R-007 | Visual Standard 6 | Unified stroke width across all rendered ductwork elements. | 1A, 11, 19 | T-040 | Ducts, fittings, accessories, equipment, airflow graphics, markers, and construction indicators share 1.5 px base stroke. | Pending |
| R-008 | Visual Standard 6.1-6.4 | Parent run owns `systemType`; children inherit. | 2, 18, 19 | T-040, T-050 | Duct segments, fittings, accessories, airflow, labels, markers, and construction indicators derive color from parent run. | Pending |
| R-009 | Visual Standard 6.5 | Multi-system equipment requires explicit assignment or safe default. | 2, 19 | T-043, T-044 | Equipment with 2+ systems uses `equipmentSystemType`; missing assignment renders `unassigned` or `general`. | Pending |
| R-010 | Visual Standard 6.6 | Supported system types include all 9 April 2026 values. | 1A, 2 | T-001, T-002, T-003 | Schema and token API support `supply`, `return`, `exhaust`, `outside`, `relief`, `transfer`, `general`, `unassigned`, `other`. | Pending |
| R-011 | Visual Standard 6.7-6.9 | Exact SizeWise color mapping is centralized. | 1A | T-001 | `SYSTEM_COLOR_MAP` returns exact required hex values for every system/category. | Pending |
| R-012 | Visual Standard 6.10 | System labels use system color; non-system labels use `#424242`. | 1A, 11, 15 | T-005 | Size, length, construction, section, fitting name, equipment tag, quantity, and notes render `#424242`. | Pending |
| R-013 | Visual Standard 6.11-6.13 | Selection and interaction states are temporary visual overrides. | 1A, 12 | T-004, T-006, T-050, T-051, T-052 | Selected renders `#1976D2`; deselect re-derives system color; no prop mutation. | Pending |
| R-014 | Visual Standard 6.15 | Renderers must not hardcode system colors. | 1A, 11, 19 | T-001, T-040 | Renderers call `getElementColor()` for color decisions. | Pending |
| R-015 | Visual Standard 7.1 | Construction indicators follow duct size, path, and shape. | 1A, 10, 11 | T-010-T-017, T-030-T-034 | Indicators are derived from geometry; no decorative overlays. | Pending |
| R-016 | Visual Standard 7.2 | `singleWall` renders OD only. | 1A, 11 | T-010, T-032 | No inner/outer construction indicator is returned or rendered. | Pending |
| R-017 | Visual Standard 7.3 | `lined` renders dashed inner ID lines. | 1A, 10, 11 | T-011, T-031 | Inner offset equals `linerThickness`; distance between inner lines is clear ID. | Pending |
| R-018 | Visual Standard 7.4 | `doubleWall` renders solid inner ID lines. | 1A, 10, 11 | T-012 | Inner offset equals `innerWallThickness`; dashed lines are not used. | Pending |
| R-019 | Visual Standard 7.5 | external wrap/insulation renders dashed outer offset. | 1A, 10, 11 | T-013, T-014 | Outer offset follows OD path and equals wrap/insulation thickness. | Pending |
| R-020 | Visual Standard 7.6 | `internallyInsulated` follows lined duct inner dashed rule. | 1A, 10, 11 | T-015 | Inner offset equals `insulationThickness`. | Pending |
| R-021 | Visual Standard 7.7 | `flexible` renders ribbed plan-view pattern. | 1A, 11 | T-016 | Ribs follow duct path and scale with size. | Pending |
| R-022 | Visual Standard 7.8 | Multiple construction indicators must remain legible or require split segments. | 2, 11, 15 | T-017 | `getConstructionStyle()` does not produce cluttered incompatible layers without explicit segment/type modeling. | Pending |
| R-023 | Visual Standard 7.9 | Construction labels are non-system labels. | 11, 15 | T-005 | Construction labels use `#424242` and do not obscure geometry. | Pending |
| R-024 | Visual Standard 8 | Fittings are parametric geometry with construction indicators. | 19 | T-041, T-042 | Lined/double-wall/wrapped indicators follow elbow, transition, tee, wye, and reducer geometry. | Pending |
| R-025 | Visual Standard 9 | Accessories and equipment follow line/color conventions. | 19 | T-043, T-044 | Accessories use darker tone and inherit duct construction; equipment ports align to duct size. | Pending |
| R-026 | Implementation Plan Phase 4 | Legacy ducts remain readable and render through shared APIs. | 7, 8, 21 | T-053 | Existing projects open; missing construction defaults to `singleWall`; legacy `outside_air` normalizes to `outside`. | Pending |
