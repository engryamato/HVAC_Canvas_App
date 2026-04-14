# T3: ManagePanel + SlideOverEditPanel

## Summary

Build the Manage tab content — the component management UI with category tree browser, component list, and slide-over edit panel for adding, editing, customizing, and deleting catalog entries.

## Spec References

- `spec:53796a94-d8d9-413d-971d-997461b5bb4f/d948bff0-d701-4808-86e5-a2cac5bce758` — Flow 5 (all steps), Flow 5 wireframe
- `spec:53796a94-d8d9-413d-971d-997461b5bb4f/50508448-82bd-4cd3-9406-fdb8de4b2e1e` — Component Architecture §4, Decision 8 (controlled archetypes), Decision 9 (Clone vs Customize)

## Dependencies

- **T1** — ManagePanel reads/writes `useUnifiedCatalogStore`.

## Scope

### ManagePanel Component

Two stacked zones within the Manage tab:

1. **Category Tree Browser** — Compact expandable L1/L2 tree. Clicking L2 filters the component list. "⋮" menu on each L2 for Rename / Reorder / Delete.
2. **Component List** — Scrollable list of all entries (placeable and non-placeable) in the selected category. Each item shows icon, name, type badge, "Custom" badge for `source === 'custom'`.

### SlideOverEditPanel

- ~320px panel extending from the sidebar's right edge, overlaying part of the canvas.
- Semi-transparent scrim behind the panel. Click scrim or Escape to close.
- **System component view**: Read-only form with **Customize** button.
- **Custom component view**: Editable form with Save and Delete buttons.
- **"+ Add" flow**: Opens blank form with all fields.

### Edit Form Fields

- Name, Category (L2 picker), Component Class (Routing / Fitting / Equipment / Accessory), **Archetype / Subtype** selector (populated from `activeSystemProfile.supportedArchetypes[selectedComponentClass]` — not free text), Engineering System, key spec fields (capacity, material, pressure rating, temperature rating, fire rating), manufacturer, model, description.
- Archetype selector populates after Component Class and Engineering System are chosen.

### Clone vs Customize Behavior

- **Customize button** (system components) → calls `customizeEntry()` → copy created with "(Custom)" suffix → slide-over reopens for the copy in edit mode.
- `pendingEditEntryId` flag in the store triggers auto-opening of the slide-over when navigating to Manage.

### Additional Features

- Unsaved changes dot indicator on Save button.
- Delete confirmation inline in the panel.
- Canvas-usage warning when deleting a component that is placed on canvas.
- Import/Export button at the top of the Manage tab.

## Out of Scope

- CatalogPanel (T2).
- Toolbar or canvas tool integration (T4).
- Actual component data population (T6+).

## Acceptance Criteria

1. Manage tab renders category tree browser and component list.
2. Clicking a component opens the slide-over panel with correct form state.
3. System components show read-only form with Customize button.
4. Custom components show editable form with Save and Delete.
5. "+ Add" opens a blank form with all required fields.
6. Archetype/Subtype selector is populated from `SystemProfile.supportedArchetypes`, not free text.
7. Archetype selector updates dynamically when Component Class or Engineering System changes.
8. Customize creates a copy with "(Custom)" suffix and reopens in edit mode.
9. `pendingEditEntryId` auto-opens the slide-over for the target entry.
10. Scrim click and Escape close the slide-over.
11. Delete shows inline confirmation; canvas-usage warning when applicable.
12. Import/Export button is present and functional.