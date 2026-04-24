# Epic Brief — Duct Rendering & Run/Segment Overhaul

## Summary

The HVAC Canvas App currently renders all duct types using a simplified centerline-based model that does not reflect true model-space geometry. Duct bodies are not drawn to their actual width in model scale, round ducts use a centerline as the primary visual (contrary to CAD/BIM practice), there is no concept of fabricated sections or section seam markers, and the data model has no Run or Segment structure — every drawn duct is a single flat entity. This epic replaces that foundation across three dimensions: a professional model-true rendering engine (two-wall geometry, three-class joint marker taxonomy, screen-stable markers, zoom-level suppression), a proper Run → Segment data hierarchy (install length, fabricated sections, remainder pieces, fitting-splits-run), and a user-editable fabrication profile system that drives section length per duct family. The result is a canvas that is credible for HVAC plan production, accurate for material takeoff, and responsive on plans up to 250 runs / 1,250 segments.

## Context & Problem

**Who is affected:** HVAC designers and estimators using the canvas to lay out ductwork and generate takeoff quantities.

**Where in the product:** The canvas drawing surface — specifically `DuctRenderer.ts`, `DuctTool.ts`, `duct.schema.ts`, and the selection store — plus the properties panel where duct dimensions and section rules are configured.

**Current pain points:**

1. **Geometry is not model-true.** The duct body width on screen does not correspond to the stored `width` or `diameter` in model scale. Designers cannot trust the drawing as a to-scale plan.
2. **Round ducts render incorrectly.** The centerline is drawn as the primary visual element. Professional HVAC plans show two outer tangent lines; the centerline is optional and secondary.
3. **No fabricated section concept.** There are no section seam markers, no section length rules, and no remainder-piece logic. The canvas shows a single undivided duct run with only start/end flanges, making material takeoff impossible from the drawing.
4. **No Run/Segment data model.** Each drawn duct is a flat entity with no parent Run identity and no child Segment records. This makes labeling, selection hierarchy, and accurate install-length measurement structurally impossible.
5. **Selection is flat.** There is no whole-run vs. individual-segment selection hierarchy. Users cannot distinguish between manipulating a full run and editing one fabricated section.
6. **No fabrication profile system.** Section lengths are not configurable per duct family. Rectangular and round ducts share no profile-driven defaults, so takeoff counts are not credible.
7. **Fitting insertion does not split runs.** When a fitting is placed between two duct segments, the run identity is not split, breaking labeling and takeoff continuity.

**Confirmed interaction rules:**

- Drawing uses a **click-click** model everywhere (no drag-release).
- Snap priority when targets overlap: **run endpoint → fitting connection port → run body**.
- If a snap point falls within endpoint tolerance of an existing run's start or end, it is treated as an endpoint connection — no run split occurs.
- Invalid geometry (too-short run, invalid split) is communicated via an **inline canvas warning** at the preview stage; the action is blocked until the geometry is valid.
- Fabrication profile edits **live-preview** on the canvas while typing; changes are only persisted on explicit **Save**; closing without saving reverts to the last saved state.
- Per-run section length overrides accept custom numeric values within the family's min/max limits; out-of-range values show inline validation and block recalculation.

## Scope

This epic covers:

- A formal model-space coordinate contract (`PIXELS_PER_INCH` constant)
- Model-true two-wall rendering for round and rectangular ducts, with extension points for flat-oval and flex
- A new `DuctRun` entity type with child `Segment` records, `installLength`, `sectionLengthRule`, and `isPartial` flags
- A `DuctFabricationProfile` system (global, per duct family, user-editable, with per-run override)
- A three-class joint marker taxonomy (section seam, connection flange, run boundary)
- Screen-stable marker and label rendering with zoom-level suppression policy
- A whole-run → segment selection state machine with whole-run multi-select and cross-run segment multi-select
- Fitting-splits-run logic on fitting insertion
- Draw order / visual hierarchy enforcement

This epic does **not** cover flat-oval or flex shape rendering (extension points only), 3D view changes, or export/BOM integration beyond what the new data model enables.

## Success Criteria

- Round and rectangular ducts render at true model width in production plan view, and round ducts no longer rely on centerline as the primary visual.
- Users can select whole runs first, then select child segments without losing parent context; whole-run multi-select and cross-run segment multi-select are supported.
- Given the same run geometry and fabrication profile inputs, segment counts, seam placement, and remainder placement regenerate deterministically for takeoff.
- Drawing, selecting, and fabrication profile edits remain responsive with no noticeable lag on plans up to 250 runs / 1,250 segments.