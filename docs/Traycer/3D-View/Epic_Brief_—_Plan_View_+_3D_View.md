# Epic Brief — Plan View + 3D View

## Summary

HVAC system design requires spatial judgment — clearances, duct heights, equipment stacking, and vertical routing — that a 2D plan view alone cannot surface. This Epic delivers a dual-view canvas architecture: `Plan View` for precise 2D drafting and `3D View` for direct spatial validation and editing, both operating on a single canonical entity model. The core user value is **engineering-grade spatial editing**: custom 3D transform gizmos built to the visual language of the product, a dedicated 3D command layer that routes all edits through the same entity store, and a read-back path that lets what an engineer sees in 3D directly inform and update their design without a round-trip to Plan View. Phase A infrastructure (view switching, renderer, orbit camera, selection sync, and persistence schema) is partially built; this Epic finalizes that foundation, closes the hydration reliability and validation gap, adds mode-aware UI context indicators, and delivers the first working 3D editing milestone: select, move, rotate, and vertically reposition entities in-scene with gizmos that feel native to the tool.

## Context & Problem

### Who is affected

HVAC engineers and designers using the canvas editor to lay out duct runs, equipment, rooms, and fittings on a 2D plan. They understand their designs spatially but can only validate them visually in 2D today.

### Where in the product

The primary canvas workspace — `CanvasPage` and everything inside `CanvasContainer`. The impacted surfaces are the viewport rendering path, the top toolbar, the right sidebar inspector, the status bar, and the project save/load system.

### The current pain

1. **Spatial validation requires mental modeling.** Engineers draw duct runs and place equipment in 2D but cannot verify vertical clearances, duct height conflicts, or equipment stacking without leaving the tool. Errors caught late in construction are expensive; this tool forces late discovery.
2. **3D view exists but cannot edit.** The read-only 3D viewport renders entities correctly but offers no way to move, rotate, or adjust them in-scene. Every spatial correction requires switching back to Plan View, losing the spatial context that prompted the correction in the first place.
3. **No engineering-grade gizmo exists.** There are no in-scene transform handles. Engineers cannot interact with entities in 3D space in a way that feels native or precise — the 3D view is passive, not productive.
4. **Partial infrastructure is live but incomplete.** Stores, adapters, renderer, and persistence fields exist in the codebase, but deterministic hydration policy for legacy/partial payloads is not yet codified, the command layer for 3D edits is absent, and inspector mode-awareness remains incomplete.
5. **Mode memory is not reliably durable on quick close/reopen.** Camera position and view mode persistence can be lost when only view/camera state changes occur and save timing is missed, forcing engineers to re-orient every session.

## Goals


| Goal                                                                   | Success Signal                                                                                                    |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Engineers can validate spatial layout in 3D without leaving the canvas | 3D View renders all entity types with correct geometry, selectable and camera-navigable                           |
| Engineers can correct spatial errors directly in 3D                    | Move and rotate gizmos dispatch through the command layer; changes are immediately visible in Plan View           |
| Engineers can adjust vertical placement persistently in 3D             | Y-axis move edits are stored canonically and survive save/reload without drift                                   |
| Gizmos feel native and engineering-grade                               | Custom axis arrows and Y-axis rotation ring match the product's visual language; no generic off-the-shelf handles |
| Mode and camera state persist across sessions                          | Project reload restores last view mode and full camera orbit state; confirmed by integration tests                |
| Old project files remain fully compatible                              | Files with missing view/camera fields reset to safe defaults before hydration; no errors                          |
| Engineers always know which mode they are in                           | Status bar and inspector strip reflect active mode reactively                                                     |
| Existing 2D workflows are fully stable                                 | Zero regression to Plan View tools, entity persistence, or CanvasContainer behavior                               |


## Out of Scope

- Full 2D tool parity in 3D (complex snapping, room polygon drawing, note text editing)
- `react-three-fiber` migration
- LOD, selective scene rebuild, or performance optimization passes
- Fitting insertion workflow parity with 2D in 3D
- Component rendering tests for `ThreeViewport` (WebGL environment brittleness)

&nbsp;
