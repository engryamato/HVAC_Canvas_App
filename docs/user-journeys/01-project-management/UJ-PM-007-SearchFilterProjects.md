# [UJ-PM-007] Search and Filter Projects

## Overview

This user journey covers searching and filtering the project list on the dashboard using text search, filters, and sorting options to quickly find specific projects among many.

## PRD References

- **FR-PM-007**: User shall be able to search and filter projects
- **US-PM-007**: As a designer, I want to search projects so that I can quickly find the one I need
- **AC-PM-007-001**: Search box filters by project name, client, and project number
- **AC-PM-007-002**: Real-time search results as user types
- **AC-PM-007-003**: Sort by name, modified date, created date
- **AC-PM-007-004**: Filter by active/archived status
- **AC-PM-007-005**: Clear search button resets filters

## Prerequisites

- User is on Dashboard page
- Multiple projects exist (ideally 5+)

## User Journey Steps

### Step 1: Enter Search Query

**User Action**: Type "Office" in search box

**Expected Result**:
- Search filters projects in real-time
- Only matching projects displayed
- Matches in: name, client name, project number
- Case-insensitive matching
- Search count shown: "Showing 3 of 10 projects"
- Highlight matching text in results (optional)

**Validation Method**: E2E test
```typescript
await page.fill('[placeholder="Search projects..."]', 'Office');

await expect(page.locator('.project-card')).toHaveCount(3);
await expect(page.locator('.search-results-count')).toContainText('3 of 10');
```

---

### Step 2: Apply Sort Order

**User Action**: Click sort dropdown, select "Modified (Newest First)"

**Expected Result**:
- Projects re-ordered by modifiedAt descending
- Most recently modified appears first
- Sort persists during search
- Sort preference saved to local storage

**Validation Method**: Unit test
```typescript
it('sorts projects by modified date descending', () => {
  const sorted = sortProjects(mockProjects, 'modified', 'desc');

  expect(sorted[0].modifiedAt).toBeGreaterThan(sorted[1].modifiedAt);
});
```

---

### Step 3: Clear Search

**User Action**: Click "×" clear button in search box

**Expected Result**:
- Search query cleared
- All projects displayed again
- Filter count removed
- Sort order preserved
- Focus returns to search box

**Validation Method**: E2E test
```typescript
await page.click('[aria-label="Clear search"]');

await expect(page.locator('input[placeholder="Search projects..."]')).toHaveValue('');
await expect(page.locator('.project-card')).toHaveCount(10);
```

---

### Step 4: Combine Filters

**User Action**: Search "HVAC" + Sort by "Name (A-Z)" + Active tab

**Expected Result**:
- All filters applied simultaneously
- Results: Active projects only, matching "HVAC", sorted alphabetically
- Count: "Showing 4 of 7 active projects"

**Validation Method**: Integration test
```typescript
it('combines search, sort, and tab filters', () => {
  const filtered = applyAllFilters({
    projects: mockProjects,
    searchQuery: 'HVAC',
    sortBy: 'name',
    sortOrder: 'asc',
    tab: 'active'
  });

  expect(filtered).toHaveLength(4);
  expect(filtered[0].name).toMatch(/HVAC/i);
  expect(filtered[0].name.localeCompare(filtered[1].name)).toBeLessThan(0);
});
```

---

### Step 5: No Results

**User Action**: Search for "NonexistentProject"

**Expected Result**:
- No projects match
- Empty state displayed:
  - Illustration (magnifying glass)
  - Message: "No projects match your search"
  - Suggestion: "Try different keywords"
  - "Clear Search" button
- Count: "Showing 0 of 10 projects"

**Validation Method**: E2E test
```typescript
await page.fill('[placeholder="Search projects..."]', 'NonexistentProject');

await expect(page.locator('.empty-state')).toBeVisible();
await expect(page.locator('.empty-state')).toContainText('No projects match');
```

---

## Edge Cases

### 1. Search with Special Characters

**User Action**: Search for "Project #1 (2025)"

**Expected Behavior**:
- Special characters treated as literals
- Matches exact characters in names
- No regex interpretation
- Parentheses, hyphens, numbers all searchable

**Test**:
```typescript
it('handles special characters in search', () => {
  const results = searchProjects(mockProjects, 'Project #1 (2025)');

  expect(results).toContainEqual(expect.objectContaining({
    name: 'Project #1 (2025) - Main'
  }));
});
```

---

### Step 2: Very Long Search Query

**User Action**: Paste 500-character string in search box

**Expected Behavior**:
- Search input limits to 200 characters
- Excess truncated
- Warning: "Search limited to 200 characters"
- Search still functions normally

---

### 3: Rapid Typing

**User Action**: Type "Office Building HVAC" quickly

**Expected Behavior**:
- Search debounced (300ms delay)
- No filter on every keystroke
- Waits for user to pause typing
- Smooth performance, no lag
- Loading indicator if search takes >100ms

---

### 4: Search Persistence

**User Action**: Search "HVAC", navigate to canvas, return to dashboard

**Expected Behavior**:
- Search query NOT persisted (cleared)
- User sees all projects
- Fresh start on dashboard
- Alternative: Persist search in session storage

---

### 5: Multiple Word Search

**User Action**: Search "Office Building"

**Expected Behavior**:
- Matches projects containing both words (AND logic)
- Order doesn't matter: matches "Building Office" too
- Alternative: OR logic (matches either word)
- Configurable in settings

---

## Error Scenarios

### 1: Search Performance Degradation

**Scenario**: Searching 1000+ projects

**Expected Handling**:
- Virtual scrolling for results
- Incremental rendering
- Search indexed (cache results)
- Loading indicator for slow searches (>500ms)
- Graceful degradation, no crashes

**Test**:
```typescript
it('handles large project lists efficiently', () => {
  const largeList = Array.from({ length: 1000 }, (_, i) =>
    createMockProject({ name: `Project ${i}` })
  );

  const startTime = performance.now();
  const results = searchProjects(largeList, 'Project 5');
  const duration = performance.now() - startTime;

  expect(duration).toBeLessThan(100); // Under 100ms
});
```

---

### 2: Invalid Sort Parameter

**Scenario**: URL manipulation sets invalid sort value

**Expected Handling**:
- Detect invalid sort parameter
- Fall back to default: "modified desc"
- Log warning to console
- No error shown to user
- Fix URL parameter

---

### 3: Concurrent Filter Changes

**Scenario**: User changes sort while search is processing

**Expected Handling**:
- Cancel previous search operation
- Apply new filter immediately
- No race conditions
- Final state is consistent

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Focus Search Box | `Ctrl/Cmd + K` or `/` |
| Clear Search | `Escape` (when focused) |
| Cycle Sort Options | `Ctrl/Cmd + Shift + S` |
| Next Project Result | `↓` (when focused) |
| Previous Project Result | `↑` (when focused) |
| Open Selected Project | `Enter` (when project focused) |

---

## Related Elements

- [SearchBar](../../elements/01-components/dashboard/SearchBar.md) - Search input component
- [SortDropdown](../../elements/01-components/dashboard/SortDropdown.md) - Sort selector
- [projectListStore](../../elements/02-stores/projectListStore.md) - Project filtering logic
- [DashboardPage](../../elements/12-pages/DashboardPage.md) - Parent page

---

## Test Implementation

### Unit Tests
- `src/__tests__/utils/projectFilters.test.ts`
  - Search matching
  - Sort logic
  - Filter combination

### Integration Tests
- `src/__tests__/integration/project-search.test.ts`
  - Real-time filtering
  - State synchronization
  - Performance

### E2E Tests
- `e2e/project-management/search-projects.spec.ts`
  - Complete search workflow
  - All sort options
  - Edge cases
  - Keyboard navigation

---

## Notes

### Implementation

```typescript
// DashboardPage.tsx
const [searchQuery, setSearchQuery] = useState('');
const [sortBy, setSortBy] = useState<'name' | 'modified' | 'created'>('modified');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

const filteredProjects = useMemo(() => {
  let results = displayedProjects;

  // Apply search
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.clientName?.toLowerCase().includes(query) ||
      p.projectNumber?.toLowerCase().includes(query)
    );
  }

  // Apply sort
  results = [...results].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'modified':
        comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
        break;
      case 'created':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return results;
}, [displayedProjects, searchQuery, sortBy, sortOrder]);
```

### Performance

- **Search**: O(n) linear scan (fast for <1000 projects)
- **Sort**: O(n log n) with native sort
- **Debouncing**: 300ms prevents excessive re-filters
- **Memoization**: Results cached until dependencies change

### Accessibility

- Search box has clear label
- Results count announced
- Sort options keyboard navigable
- Empty state has proper heading structure

### Future Enhancements

- **Advanced Filters**: Filter by entity count, date range
- **Saved Searches**: Save common search queries
- **Recent Searches**: Show recent search history
- **Fuzzy Search**: Typo-tolerant matching
- **Tag Filtering**: Filter by project tags/categories
