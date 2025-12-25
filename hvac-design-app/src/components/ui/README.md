# UI Components Library

This directory contains reusable UI components for the SizeWise HVAC Canvas application.

## Phase 0 Components (Foundation)

### Dropdown
Reusable dropdown component for menus, filters, zoom/grid selectors.

**Features:**
- Click-outside-to-close
- Keyboard navigation (arrow keys, Enter, Escape)
- Optional icons per option
- Accessible ARIA labels

**Usage:**
```tsx
import { Dropdown } from '@/components/ui';

<Dropdown
  label="Grid Size"
  options={[
    { value: '6', label: '1/4"' },
    { value: '12', label: '1/2"' },
    { value: '24', label: '1"' },
    { value: '48', label: '2"' }
  ]}
  value={gridSize}
  onChange={setGridSize}
/>
```

### CollapsibleSection
Expandable section component for inspectors and panels.

**Features:**
- Smooth height transition animation
- Rotating arrow icon indicator
- Default expanded/collapsed state
- Preserves content while collapsed

**Usage:**
```tsx
import { CollapsibleSection } from '@/components/ui';

<CollapsibleSection title="Grid Settings" defaultExpanded>
  <div>Your content here</div>
</CollapsibleSection>
```

### StatCard
Dashboard statistics display card.

**Features:**
- Large number display
- Optional icon on left
- Optional trend indicator (↑↓ with %)
- Hover animation (lift + shadow)
- Responsive sizing

**Usage:**
```tsx
import { StatCard } from '@/components/ui';

<StatCard
  label="Total Projects"
  value={24}
  icon={<span>📁</span>}
  trend={{ value: 12, label: 'this week' }}
/>
```

### IconButton
Consistent icon-only button component.

**Features:**
- Consistent sizing (32×32px default)
- Disabled state styling
- Hover/active states
- Tooltip support via title
- Multiple variants (default, primary, danger)

**Usage:**
```tsx
import { IconButton } from '@/components/ui';

<IconButton
  icon={<span>↶</span>}
  onClick={handleUndo}
  disabled={!canUndo}
  title="Undo (Ctrl+Z)"
  variant="default"
/>
```

## Existing Components

### ValidatedInput
Form input with validation support.

### Toast
Toast notification system with provider and hooks.

### LoadingIndicator
Loading spinners and indicators (Page, Button variants).

## Design Principles

All components follow these principles:
- **Accessible**: Proper ARIA labels and keyboard navigation
- **Responsive**: Work on all screen sizes
- **Consistent**: Follow the same design patterns
- **Reusable**: Flexible props for various use cases
- **Performant**: Optimized with proper memoization

## Color Palette

The components use the following color system:
- **Primary**: #6366F1 (Indigo)
- **Success**: #10B981 (Green)
- **Danger**: #EF4444 (Red)
- **Gray Scale**: #111827, #374151, #6B7280, #9CA3AF, #D1D5DB, #E5E7EB, #F3F4F6, #F9FAFB

## Usage Locations

### Dropdown
- Canvas Properties Inspector (Grid Size, Unit System)
- Enhanced Status Bar (Zoom presets, Grid sizes)
- Search/Filter Bar (Sort options, Filter options)

### CollapsibleSection
- Canvas Properties Inspector (sections for Project Info, Grid, Units)
- BOM Panel (Ducts, Equipment, Fittings categories)
- All entity inspectors (property groups)

### StatCard
- Quick Stats Bar (4 cards: Total Projects, Active, Entities, Avg Time)

### IconButton
- Menu Bar quick actions
- Floating Mini-Toolbar
- Status Bar controls