# Phase 03: Compact List Catalog Component

**Status:** Not Started · **Owner:** FE Engineer · **Est. Duration:** 4 days

---

## 1. Objective

Implement a new `CatalogRow` component in `CatalogPanel.tsx` that replaces `CatalogCard` when `catalogDensity === 'compact'`. The component renders one entry per 36 px row with icon, name, secondary metadata, and a hover-triggered context menu — matching the Phase 02 spec exactly.

---

## 2. Component Structure

### `CatalogRow` — Compact Item

Create as a **local component** inside `CatalogPanel.tsx` (same file as `CatalogCard`), directly below the existing `CatalogCard` definition.

```tsx
// CatalogPanel.tsx — new component (add after CatalogCard)

function CatalogRow({
  entry,
  active,
  onSelect,
  onClone,
  onCustomize,
  onEdit,
  onDelete,
}: {
  entry: UnifiedComponentDefinition;
  active: boolean;
  onSelect: () => void;
  onClone: () => void;
  onCustomize: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const iconKey = resolveCatalogEntryIconKey(entry);
  const meta = [
    entry.categoryId.replace(/_/g, ' '),
    entry.systemType,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article
      className={`group relative flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all ${
        active
          ? 'border-l-2 border-sky-500 bg-sky-50 pl-1.5'
          : 'hover:bg-slate-50'
      }`}
      data-testid={`catalog-row-${entry.id}`}
    >
      {/* Icon */}
      <span
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-white"
        style={{ backgroundColor: getCategoryColor(entry.categoryId) }}
      >
        <HvacCatalogIcon
          iconKey={iconKey}
          size={14}
          strokeWidth={2.5}
          aria-hidden
          data-testid={`catalog-row-icon-${entry.id}`}
        />
      </span>

      {/* Text */}
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 text-left"
        aria-pressed={active}
        aria-label={`Select ${entry.name}`}
      >
        <span className="block truncate text-xs font-semibold text-slate-900">
          {entry.name}
        </span>
        <span className="block truncate text-[10px] text-slate-500">{meta}</span>
      </button>

      {/* Class chip — visible only on hover */}
      <span className="hidden flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-600 group-hover:inline-block bg-slate-100">
        {COMPONENT_CLASS_LABELS[entry.componentClass]}
      </span>

      {/* Context menu trigger */}
      <button
        type="button"
        onClick={() => { setMenuOpen((v) => !v); setDeleteConfirmOpen(false); }}
        className="flex-shrink-0 rounded px-1 py-0.5 text-slate-400 opacity-0 transition hover:bg-slate-200 hover:text-slate-700 group-hover:opacity-100"
        aria-label={`Open actions for ${entry.name}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        ⋮
      </button>

      {/* Context menu — same actions as CatalogCard */}
      {menuOpen && (
        <div
          role="menu"
          className="absolute right-2 top-8 z-20 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          {/* ... same menu items as CatalogCard ... */}
        </div>
      )}
    </article>
  );
}
```

> **Note:** The context menu markup inside `CatalogRow` is identical to `CatalogCard`'s menu. Extract it into a shared `CatalogItemMenu` helper function to avoid duplication.

---

## 3. CatalogPanel — Density-Switched Rendering

### Change in `CatalogPanel.tsx`

Add a `density` prop from the store, then conditionally render `CatalogRow` or `CatalogCard`:

```tsx
// Inside CatalogPanel() body — add store selector
const catalogDensity = useLayoutStore((state) => state.catalogDensity);

// Replace the grid rendering block (currently CatalogPanel.tsx:538–554)
{visibleEntries.length === 0 ? (
  <EmptyState />
) : catalogDensity === 'compact' ? (
  <div className="flex flex-col gap-0.5">
    {visibleEntries.map((entry) => (
      <CatalogRow
        key={entry.id}
        entry={entry}
        active={activeEntry?.id === entry.id}
        onSelect={() => selectEntry(entry.id)}
        onClone={() => cloneEntry(entry.id)}
        onCustomize={() => { customizeEntry(entry.id); openManage(); }}
        onEdit={() => handleEditInManage(entry)}
        onDelete={() => handleDelete(entry)}
      />
    ))}
  </div>
) : (
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
    {visibleEntries.map((entry) => (
      <CatalogCard ... />  // unchanged
    ))}
  </div>
)}
```

---

## 4. Category Navigation — Chip Strip Replacement

Replace the `lg:grid-cols-[220px_minmax(0,1fr)]` layout with a single-column layout. The left category tree becomes an inline **chip strip** above the item list.

### Before (current `CatalogPanel.tsx:443`)
```tsx
<div className="grid flex-1 gap-3 overflow-hidden lg:grid-cols-[220px_minmax(0,1fr)]">
  <aside ...>  {/* 220px tree */}
    ...
  </aside>
  <section ...>  {/* item grid */}
    ...
  </section>
</div>
```

### After
```tsx
<div className="flex flex-1 flex-col gap-2 overflow-hidden">
  {/* Category chip strip */}
  <div className="flex gap-1 overflow-x-auto scrollbar-none px-1 py-1">
    <button
      className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition ${
        !selectedCategoryId ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
      onClick={() => selectCategory(null)}
    >
      All ({treeEntries.length})
    </button>
    {rootCategories.flatMap((root) =>
      (visibleChildrenByRoot.get(root.id) ?? []).map((subcategory) => {
        const count = treeEntries.filter((e) => e.categoryId === subcategory.id).length;
        return (
          <button
            key={subcategory.id}
            data-testid={`catalog-category-${subcategory.id}`}
            className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition ${
              selectedCategoryId === subcategory.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => selectCategory(selectedCategoryId === subcategory.id ? null : subcategory.id)}
          >
            {subcategory.name} ({count})
          </button>
        );
      })
    )}
  </div>

  {/* Item list — density-switched */}
  <section className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
    ...
  </section>
</div>
```

---

## 5. Preserved `data-testid` Attributes

All existing Playwright-targeted attributes **must remain unchanged**:

| Attribute | Element | Location |
|-----------|---------|----------|
| `data-testid="catalog-panel"` | Outer `div` in `LeftSidebar.tsx:169` | DO NOT TOUCH |
| `data-testid="catalog-root-{id}"` | Root category button | Removed by chip strip — **ADD** equivalent `data-testid="catalog-root-{id}"` to root category group heading in chip strip |
| `data-testid="catalog-category-{id}"` | Sub-category button | Carry over to chip strip buttons |
| `data-testid="catalog-card-icon-{id}"` | Icon inside `CatalogCard` | Preserve in Comfortable mode |
| `data-testid="catalog-row-icon-{id}"` | Icon inside `CatalogRow` | **NEW** — add for Compact mode |
| `data-testid="catalog-active-fittings"` | Compatibility text | Unchanged (in footer section) |
| `data-testid="catalog-active-accessories"` | Compatibility text | Unchanged |

---

## 6. Comfortable Mode Fallback

When `catalogDensity === 'comfortable'`, the existing `CatalogCard` component and `lg:grid-cols-[220px_minmax(0,1fr)]` layout are used **as-is**. No changes to Comfortable mode in Phase 03.

---

## 7. Deliverables

- [ ] `CatalogRow` component implemented and rendering correctly in Compact mode.
- [ ] `CatalogItemMenu` helper extracted (shared between `CatalogRow` and `CatalogCard`).
- [ ] Chip strip navigation implemented, replacing the 220 px tree column.
- [ ] All `data-testid` attributes preserved or correctly migrated.
- [ ] Storybook story (or local dev validation) showing both Compact and Comfortable at 250 / 300 / 400 px sidebar widths.
- [ ] Visual regression snapshots (Playwright `toHaveScreenshot`) for Compact mode.

---

## 8. Acceptance Criteria

- [ ] Compact mode shows ≥ 10 items at 300 px sidebar width, 900 px window height (no scroll needed for first 10).
- [ ] Name text truncates correctly at all sidebar widths (no horizontal overflow).
- [ ] Chip strip scrolls horizontally without layout breakage at 250 px sidebar width.
- [ ] Comfortable mode renders identically to current `CatalogCard` grid (no visual regression).
- [ ] Existing Playwright tests pass without changes to test code.
- [ ] No TypeScript errors (`npm run typecheck` clean).
