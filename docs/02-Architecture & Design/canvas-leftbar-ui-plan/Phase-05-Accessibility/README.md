# Phase 05: Accessibility & Keyboard Navigation

**Status:** Not Started · **Owner:** A11y Lead + FE Engineer · **Est. Duration:** 3 days

---

## 1. Objective

Ensure the compact catalog panel meets WCAG 2.1 AA and passes automated `axe-core` validation with **0 critical, 0 serious violations**. This phase covers the three new interaction surfaces added by earlier phases:

1. **`CatalogRow`** — the compact item row component.
2. **Density toggle** — the Compact / Comfortable segmented button group.
3. **Category chip strip** — the horizontal filter chips replacing the accordion tree.

---

## 2. ARIA Roles & Labels

### 2.1 `CatalogRow`

| Element | Required ARIA | Implementation |
|---------|--------------|----------------|
| `<article>` container | `aria-label="{entry.name} — {categoryId}"` | Ensure screen readers announce the full item |
| Select button | `aria-pressed={active}` `aria-label="Select {entry.name}"` | Already in Phase 03 spec |
| Context menu trigger `⋮` | `aria-haspopup="menu"` `aria-expanded={menuOpen}` `aria-label="Actions for {entry.name}"` | Already in Phase 03 spec |
| Context menu `<div>` | `role="menu"` | Add to Phase 03 implementation |
| Each menu item `<button>` | `role="menuitem"` | Add `role="menuitem"` to Clone / Customize / Edit / Delete buttons |
| Icon `<HvacCatalogIcon>` | `aria-hidden={true}` | Already present in `CatalogCard`, carry over |

### 2.2 Density Toggle

The toggle is a `role="group"` segmented control:

```tsx
<div
  role="group"
  aria-label="Catalog item density"
>
  <button type="button" aria-pressed={catalogDensity === 'compact'}>Compact</button>
  <button type="button" aria-pressed={catalogDensity === 'comfortable'}>Comfortable</button>
</div>
```

`aria-pressed` on `<button>` elements is the correct pattern for a toggle button — do **not** use `role="radio"` here (radio requires `role="radiogroup"` which has different keyboard semantics).

### 2.3 Category Chip Strip

```tsx
<div role="group" aria-label="Filter by category">
  <button
    aria-pressed={!selectedCategoryId}  // "All" chip
    ...
  >All</button>
  {chips.map((chip) => (
    <button
      key={chip.id}
      aria-pressed={selectedCategoryId === chip.id}
      data-testid={`catalog-category-${chip.id}`}
      ...
    >
      {chip.name}
    </button>
  ))}
</div>
```

### 2.4 List Container

The `CatalogRow` list should be wrapped in:

```tsx
<ul role="list" aria-label="Catalog items">
  {visibleEntries.map((entry) => (
    <li key={entry.id}>
      <CatalogRow ... />
    </li>
  ))}
</ul>
```

Using `<ul>/<li>` semantics with `role="list"` gives screen readers the item count announcement ("list, N items") for free.

---

## 3. Keyboard Navigation

### 3.1 Catalog Row List

| Key | Action |
|-----|--------|
| `Tab` | Move focus to the next interactive element (row select button) |
| `Shift+Tab` | Move focus to the previous interactive element |
| `Enter` / `Space` | Activate the focused select button (calls `onSelect`) |
| `ArrowDown` | Move focus to the next row's select button |
| `ArrowUp` | Move focus to the previous row's select button |
| `Escape` | If context menu is open, close it; return focus to the `⋮` button |

**Implementation:** Add `onKeyDown` to the `<ul>` container using a roving `tabIndex` pattern:

```tsx
// In the CatalogRow list container
<ul
  role="list"
  aria-label="Catalog items"
  onKeyDown={(e) => {
    if (e.key === 'ArrowDown') {
      // focus next li > button
    }
    if (e.key === 'ArrowUp') {
      // focus prev li > button
    }
  }}
>
```

Use `ref` on each row button and `focus()` imperatively. Alternatively, use the **Roving TabIndex** pattern: only one row has `tabIndex={0}` at a time; arrow keys shift `tabIndex` and call `.focus()`.

### 3.2 Context Menu

When the `⋮` button is activated:
- `menuOpen` becomes `true`.
- Focus moves to the **first menu item** (`Clone`).
- `ArrowDown` cycles through menu items.
- `ArrowUp` cycles in reverse.
- `Escape` closes the menu and returns focus to the `⋮` button.
- Clicking outside the menu closes it (use a `useEffect` with `document.addEventListener('click', ...)` cleanup).

### 3.3 Density Toggle

Standard tab-order navigation; no arrow key behavior needed (it is two separate `<button>` elements, not a roving group).

### 3.4 Category Chip Strip

Tab order: chips are in DOM order, so `Tab` cycles left-to-right. `Enter`/`Space` activates the focused chip.

---

## 4. Focus Visibility

All interactive elements must have a visible focus ring. Use:

```
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-sky-400
focus-visible:ring-offset-1
```

This is consistent with the existing focus style used in `CatalogPanel.tsx` search input:
```tsx
focus:border-sky-400 focus:bg-white
```

For `CatalogRow` buttons, since they have no border, the ring must be the primary focus indicator. Ensure `focus-visible:ring-2` is always present.

---

## 5. Tooltip Strategy (Compact Mode)

In Compact mode, the secondary text line may truncate long category names. Tooltips must be accessible:

- Do **not** use `title` attribute — not read by all screen readers and not shown on keyboard focus.
- Use a **Radix UI Tooltip** (`@radix-ui/react-tooltip`) already available in the project (`src/components/ui/`) for truncated text.
- Tooltip must trigger on **both hover and keyboard focus** of the element.

```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

<Tooltip>
  <TooltipTrigger asChild>
    <span className="block truncate text-xs font-semibold text-slate-900">
      {entry.name}
    </span>
  </TooltipTrigger>
  <TooltipContent side="right">
    {entry.name}
    {entry.keySpec ? ` — ${entry.keySpec}` : ''}
  </TooltipContent>
</Tooltip>
```

Apply the tooltip **only when text is truncated** (check with a `useRef` + `scrollWidth > clientWidth` guard to avoid unnecessary tooltip renders).

---

## 6. Color Contrast

| Element | Foreground | Background | Ratio | WCAG AA |
|---------|-----------|------------|-------|---------|
| Row name (Compact) | `#0f172a` (slate-900) | `#ffffff` | 17.6:1 | ✅ |
| Row meta (Compact) | `#64748b` (slate-500) | `#ffffff` | 4.6:1 | ✅ |
| Active row name | `#0f172a` | `#f0f9ff` (sky-50) | 15.4:1 | ✅ |
| Category chip (inactive) | `#475569` (slate-600) | `#f1f5f9` (slate-100) | 5.2:1 | ✅ |
| Category chip (active) | `#ffffff` | `#0f172a` (slate-900) | 17.6:1 | ✅ |
| Density toggle (inactive) | `#64748b` | `#f1f5f9` | 4.6:1 | ✅ |
| Density toggle (active) | `#0f172a` | `#ffffff` | 17.6:1 | ✅ |

> All contrast ratios exceed WCAG AA 4.5:1 minimum for normal text.

---

## 7. Screen Reader Announcement Plan

| User Action | Expected SR Announcement |
|-------------|--------------------------|
| Focus a catalog row | "Select {entry.name}, {categoryId}, toggle button, not pressed" |
| Activate a row | "Select {entry.name}, toggle button, pressed" |
| Open context menu | "Actions for {entry.name}, expanded, menu" |
| Focus first menu item | "Clone, menu item, 1 of 4" |
| Switch density to Comfortable | "Comfortable, toggle button, pressed" |
| Filter by chip | "{chip.name}, toggle button, pressed, list, N items" |

---

## 8. Deliverables

- [ ] ARIA attributes added to `CatalogRow`, density toggle, chip strip (per §2).
- [ ] Keyboard navigation implemented in the row list container (§3.1).
- [ ] Context menu keyboard management implemented (§3.2).
- [ ] Tooltip strategy applied to truncated row names (§5).
- [ ] `axe-core` run via `accessibility_checker.py` — 0 critical, 0 serious violations.
- [ ] Manual screen reader test (NVDA + Chrome or macOS VoiceOver) documented.

---

## 9. Acceptance Criteria

- [ ] All catalog rows reachable via `Tab` key with visible focus rings.
- [ ] `ArrowDown` / `ArrowUp` navigate between catalog rows.
- [ ] Context menu closes on `Escape`, returning focus to trigger button.
- [ ] `axe-core` reports 0 critical and 0 serious violations on the catalog panel.
- [ ] Color contrast meets WCAG AA for all text elements (verified against §6 table).
- [ ] Tooltip appears on keyboard focus for truncated item names.
