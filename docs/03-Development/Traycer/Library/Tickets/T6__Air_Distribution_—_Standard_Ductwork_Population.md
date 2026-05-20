# T6: Air Distribution — Standard Ductwork Population

## Summary

Populate the Standard Ductwork catalog with all ~22 components, the Standard Duct system profile with full archetype lists, and Lucide icon mappings. This is the first real content that validates the end-to-end Catalog + Manage experience.

## Spec References

- `spec:53796a94-d8d9-413d-971d-997461b5bb4f/d948bff0-d701-4808-86e5-a2cac5bce758` — Flow 1 (validates end-to-end browsing + placement)
- `spec:53796a94-d8d9-413d-971d-997461b5bb4f/228992df-e5c9-4c89-99cf-9b945d3f4ca9` — Phase framing, component taxonomy

## Dependencies

- **T1** — Store and schemas.
- **T2** — CatalogPanel to browse entries.
- **T3** — ManagePanel to verify editing works with real data.

## Scope

### Catalog Entries (~22 items)

All entries with `engineeringSystem: 'standard_duct'`, `categoryId: 'standard_ductwork'`, `placeable: true`, `source: 'system'`:

| Sub-Group | Components |
|---|---|
| **Routing (4)** | Rectangular Duct, Round Duct, Flat Oval Duct, Flexible Duct |
| **Fittings (9)** | Radius Elbow (Round/Rect/Oval), Mitered Elbow, Tee/Cross, Wye/Lateral, Reducer/Transition (Concentric & Eccentric), Square-to-Round Transition, End Cap, Spin-in/Conical Takeoff, Shoe Tap/Bellmouth |
| **Equipment (4)** | VAV/CAV Terminal Box, Fan Coil Unit (FCU), Exhaust Fan (Inline/Centrifugal), AHU Connection |
| **Accessories (9)** | Manual Volume Damper (MVD), Motorized Control Damper, Fire Damper (FD), Smoke/Fire-Smoke Damper (FSD), Turning Vanes, Sound Attenuator/Silencer, Access Door, Flexible Connector/Canvas Collar, Grilles Registers & Diffusers (GRDs) |

### Standard Duct System Profile

- `defaultSystemType: 'supply'`
- `supportedArchetypes` with full lists for each `componentClass`:
  - `duct`: `['straight', 'rectangular', 'round', 'flat_oval', 'flexible']`
  - `fitting`: `['elbow', 'mitered_elbow', 'tee', 'cross', 'wye', 'reducer', 'transition', 'end_cap', 'takeoff', 'tap']`
  - `equipment`: `['terminal_box', 'fan_coil', 'exhaust_fan', 'ahu_connection']`
  - `accessory`: `['damper', 'turning_vanes', 'silencer', 'access_door', 'connector', 'grd']`

### Lucide Icon Mappings

- Map each component to the closest Lucide icon from the existing library.
- Use color-coded icon backgrounds per component class (blue-tint for routing, green-tint for fittings, yellow-tint for equipment, purple-tint for accessories).

### Baseline Defaults

- Each entry includes sensible engineering defaults (material, pressure class, capacity range) carried forward from existing component initializer data.

## Out of Scope

- Specialty system entries (T7-T9).
- Universal component entries (T10).
- New engineering calculation implementations — Standard Duct uses the existing engine from T5.

## Acceptance Criteria

1. All ~22 Standard Ductwork entries appear in the Catalog under Air Distribution → Standard Ductwork.
2. Each entry has correct `componentClass`, `categoryId`, `typeId`, `engineeringSystem`, `placeable`, and `source`.
3. Standard Duct system profile includes complete `supportedArchetypes` for all four component classes.
4. Each entry has a Lucide icon mapping and renders correctly in the card grid.
5. Clicking any entry activates the correct placement mode (via the activation bridge from T4, if available).
6. Entries are browsable, searchable, and filterable in the CatalogPanel.
7. Entries are viewable in the ManagePanel with correct read-only/Customize behavior.