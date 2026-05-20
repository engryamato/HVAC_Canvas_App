# Phase 08: Rollout & Handoff

**Status:** Not Started · **Owner:** Product Owner · **Est. Duration:** 1 day

---

## 1. Objective

Prepare the catalog compact-list redesign for production release. This phase covers: the PR merge strategy, changelog entry, user-facing documentation updates, inline help copy, and a handoff package for future maintainers.

---

## 2. Branch & Merge Strategy

This work targets the existing `feat/resizable-inspector` branch (from `AGENTS.md`). Since the catalog work is a **separate concern** from inspector resizing, create a child feature branch:

```
feat/resizable-inspector
  └── feat/catalog-compact-list  ← all Phase 03–06 commits go here
```

Open a PR from `feat/catalog-compact-list` → `feat/resizable-inspector` (not directly to `main`). This allows the two features to be reviewed and tested independently before the parent branch lands.

### PR Title Convention

```
feat(catalog): compact list mode with density toggle and chip filter navigation
```

### PR Description Template

```markdown
## Summary
Replaces the card-grid layout in the Library Catalog panel with a compact row view,
showing ≥ 10 items per viewport vs. the previous 4–5. Includes:
- `CatalogRow` compact component (36px row height)
- Density toggle (Compact / Comfortable) persisted to localStorage
- Category chip strip replacing the 220px sidebar tree
- Keyboard navigation (ArrowDown/ArrowUp) in the row list
- 0 axe-core violations (from Phase 05)

## Testing
- [ ] Vitest unit: pass
- [ ] Playwright E2E: pass (including new density tests)
- [ ] Visual regression: approved
- [ ] axe-core: 0 critical, 0 serious

## Breaking Changes
None. All existing `data-testid` attributes preserved.

## Linked Phase Plan
docs/canvas-leftbar-ui-plan/
```

---

## 3. Changelog Entry

Add to `CHANGELOG.md` (or create it at `hvac-design-app/CHANGELOG.md` if absent):

```markdown
## [Unreleased]

### Added
- **Catalog Compact Mode**: The Library Catalog panel now defaults to a compact row layout
  showing ≥ 10 components per viewport (vs. ~4–5 previously). Toggle between Compact and
  Comfortable density from the catalog header. Preference is saved across sessions.
- **Category Chip Strip**: Filter catalog items by HVAC category using horizontal chips,
  replacing the fixed 220px sidebar tree. Works at any sidebar width ≥ 250px.
- **Keyboard Navigation**: Arrow keys navigate between catalog rows; Escape closes context menus.

### Changed
- Catalog panel header now includes a density toggle button group (Compact / Comfortable).
- `useLayoutStore` extended with `catalogDensity` field (persisted to localStorage).

### Fixed
- Catalog panel no longer overflows horizontally at sidebar widths < 300px (chip strip replaces fixed 220px tree column).
```

---

## 4. User-Facing Documentation

### Inline Help Copy (add to `HelpMenu.tsx` or a `help-content.ts` constants file)

```
Catalog Panel — Density Toggle
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Compact: Shows 10+ components per screen for fast selection.
  Best for experienced users who know component names.

• Comfortable: Shows larger card tiles with full metadata.
  Best for exploring unfamiliar component categories.

Your preference is saved and restored on next visit.
```

### Tooltip on the Density Toggle Buttons

```tsx
// In CatalogPanel.tsx header
<Tooltip>
  <TooltipTrigger asChild>
    <div role="group" aria-label="Catalog density">
      ...toggle buttons...
    </div>
  </TooltipTrigger>
  <TooltipContent>
    Switch between compact list and card views. Your preference is saved.
  </TooltipContent>
</Tooltip>
```

---

## 5. Revert Procedure

If a critical issue is found post-release:

1. **Quick revert:** Set `catalogDensity` default back to `'comfortable'` in `useLayoutStore.ts` — this makes all users see the old card view without a code rollback.
2. **Full rollback:** Revert the PR merge on the `feat/resizable-inspector` branch.

Document the revert in the PR with:
```
git revert <merge-commit-sha>
git push
```

No data migration is needed — `catalogDensity` is additive to the existing `partialize` object. Removing it simply causes hydration to fall back to the default.

---

## 6. Handoff Package

The following items must be merged or updated **before** the PR is marked ready:

| Item | Location | Status |
|------|----------|--------|
| Phase plan (this doc set) | `docs/canvas-leftbar-ui-plan/` | ✅ Complete |
| `DESIGN_SYSTEM.md` — catalog token table | `hvac-design-app/DESIGN_SYSTEM.md` | ⬜ Add catalog token table from Phase 02 |
| `CHANGELOG.md` | `hvac-design-app/CHANGELOG.md` | ⬜ Write entry (see §3) |
| `MANUAL_TEST_GUIDE.md` — catalog section | `hvac-design-app/MANUAL_TEST_GUIDE.md` | ⬜ Add manual QA checklist from Phase 07 |
| Visual regression snapshots | `e2e/snapshots/` | ⬜ Committed baseline snapshots |
| Storybook stories | (if Storybook is configured) | ⬜ `CatalogRow.stories.tsx` |

### Key Files Changed (for next-developer orientation)

```
hvac-design-app/src/
  stores/
    useLayoutStore.ts            ← catalogDensity field + setCatalogDensity
  features/canvas/components/
    CatalogPanel.tsx             ← CatalogRow, chip strip, density-switched rendering
```

No new files are added at the feature level — all changes are co-located in existing files to minimize import graph complexity.

---

## 7. Post-Release Monitoring

After release, monitor:

1. **Error tracking:** Look for `TypeError` or render errors originating from `CatalogPanel.tsx` in the first 24 hours.
2. **localStorage conflicts:** If users report unexpected layout resets, check for `hvac-layout-preferences` key conflicts.
3. **User feedback:** Track support requests mentioning "catalog", "library", or "items" within the first week.

---

## 8. Acceptance Criteria

- [ ] PR opened against `feat/resizable-inspector` using the template in §2.
- [ ] `CHANGELOG.md` updated with the entry from §3.
- [ ] `DESIGN_SYSTEM.md` updated with the catalog token table (Phase 02 §5).
- [ ] `MANUAL_TEST_GUIDE.md` updated with the Phase 07 manual QA checklist.
- [ ] All stakeholders (UX, FE Architect, QA, Product Owner) have reviewed and approved the PR.
- [ ] Inline help copy added to `HelpMenu.tsx` or equivalent.
- [ ] Baseline visual regression snapshots committed and passing in CI.
- [ ] No critical or high-severity bugs open in the PR at time of merge.
