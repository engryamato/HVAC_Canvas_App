# T2: Left Sidebar Refactor + CatalogPanel

## Summary

Replace the existing Library/Services tabs with the new Catalog/Manage tab structure, and build the CatalogPanel component — the primary browsing and selection UI for placeable components.

## Spec References

- `spec:53796a94-d8d9-413d-971d-997461b5bb4f/d948bff0-d701-4808-86e5-a2cac5bce758` — Flow 1 (all steps), Flow 1 wireframe
- `spec:53796a94-d8d9-413d-971d-997461b5bb4f/50508448-82bd-4cd3-9406-fdb8de4b2e1e` — Component Architecture §3 (CatalogPanel), §8 (Left Sidebar Refactor)

## Dependencies

- **T1** — CatalogPanel reads from `useUnifiedCatalogStore` (collections, selectors, actions).

## Scope

### Left Sidebar Refactor

- Change `LeftSidebar.tsx` tabs from "Library" / "Services" to **"Catalog" / "Manage"**.
- Update `LeftTabId` type from `'library' | 'services'` to `'catalog' | 'manage'`.
- `normalizeLeftTab()` handles backward compatibility.
- `activeLeftTab === 'catalog'` renders `CatalogPanel`; `activeLeftTab === 'manage'` renders `ManagePanel` (placeholder for T3).

### CatalogPanel Component

Three vertical zones within the Catalog tab:

1. **Category Tree** — Three collapsible L1 sections (Air Distribution / Specialty Exhaust / Universal Components), each color-coded (blue / orange / gray). Expanding L1 reveals L2 groups. Clicking L2 filters the card grid. L1 is expand/collapse only.
2. **Card Grid** — Reads `filteredEntries` selector. Each card shows: Lucide icon, component name, type badge (Routing / Fitting / Equipment / Accessory), one key spec line, and a **"⋮" overflow menu** (visible on hover) with actions:
   - **Clone** — calls `cloneEntry()`, stays in Catalog.
   - **Customize** — calls `customizeEntry()`, switches to Manage tab.
   - **Edit in Manage** — switches to Manage tab with entry pre-selected.
   - **Delete** — only visible for `source === 'custom'` entries; inline confirmation.
3. **Active Indicator Bar** — Shows selected component name with L1 color stripe, **service context dropdown** (Supply / Return / Exhaust / Outside Air), always visible and active for all component types. Reads `serviceConflictWarning` and conditionally renders a warning badge when service context conflicts with engineering system.

### Search

- Search bar between category tree and card grid.
- Typing filters cards across all categories in real time.
- Tree collapses to show only matching L2 groups.

## Out of Scope

- ManagePanel content (T3) — this ticket only renders a placeholder when Manage tab is selected.
- Toolbar morphing (T4).
- Placement tool activation on card click (T4 — the activation bridge).
- Actual component data population (T6+).

## Acceptance Criteria

1. Left sidebar shows "Catalog" and "Manage" tabs instead of "Library" and "Services".
2. Category tree renders 3 L1 → 5 L2 hierarchy with correct color coding.
3. Clicking an L2 group filters the card grid to show only entries in that category.
4. Card grid renders only placeable entries (`entry.placeable === true`).
5. Each card shows Lucide icon, name, type badge, and spec preview.
6. "⋮" menu appears on card hover with Clone, Customize, Edit in Manage, and Delete (custom only).
7. Clone creates a copy without switching tabs or opening an editor.
8. Customize creates a copy and switches to Manage tab.
9. Delete shows inline confirmation and only appears for custom entries.
10. Search bar filters across all categories in real time.
11. Service context dropdown is always visible in the active indicator bar.
12. Warning badge appears when `serviceConflictWarning` is non-null.
13. Service dropdown auto-sets when a specialty entry is selected but remains editable.