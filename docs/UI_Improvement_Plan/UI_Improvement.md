# Canvas Frontend UI - Enhanced Implementation Guide

## 📋 Overview
This document provides a comprehensive, interactive guide for implementing missing UI components across the Canvas page, Dashboard page, and Hero section of the SizeWise HVAC Canvas application. The guide is organized into phases with clear status tracking, implementation details, and code references.

**Current Implementation Status:** 52% Complete (14 of 27 components)

**Document Structure:**
- **Quick Navigation Dashboard** - Jump to any section instantly
- **Component Status Tracker** - Visual progress indicators
- **Phase-by-Phase Implementation** - Detailed build instructions
- **Code Library** - Complete implementation references
- **Testing & Validation** - Quality assurance checklists

---

## 🎯 Quick Navigation Dashboard

| Section | Status | Components | Jump To |
|---------|--------|------------|---------|
| **Canvas Audit** | 65% (11/17) | CanvasContainer, Toolbar, Inspectors, etc. | [Canvas Components](#-canvas-components) |
| **Dashboard Audit** | 30% (3/10) | ProjectCard, Dialogs | [Dashboard Components](#-dashboard-components) |
| **Phase 0 - Foundation** | ⏳ Not Started | Shared UI Library (4 components) | [Phase 0](#phase-0-foundation-3-days) |
| **Phase 1 - Critical** | ⏳ Not Started | BOM Panel, Canvas Properties | [Phase 1](#phase-1-critical-canvas-components-15-weeks) |
| **Phase 2 - Canvas UI** | ⏳ Not Started | Menu Bar, Enhanced Status | [Phase 2](#phase-2-enhanced-canvas-ui-1-week) |
| **Phase 3 - Dashboard** | ⏳ Not Started | Hero, Stats, Search/Filter | [Phase 3](#phase-3-dashboard-core-enhancements-1-week) |
| **Phase 4 - Polish** | ⏳ Not Started | Carousel, Thumbnails | [Phase 4](#phase-4-dashboard-polish-3-4-days) |
| **Phase 5 - Advanced** | ⏳ Not Started | Floating Toolbar, Inspectors | [Phase 5](#phase-5-advanced-canvas-features-3-4-days) |
| **Phase 6 - Testing** | ⏳ Not Started | Testing & Documentation | [Phase 6](#phase-6-testing--polish-3-days) |

---

## 📊 Component Status Matrix

### Priority Legend
- 🔴 **CRITICAL** - Blocks MVP, must build
- 🟡 **HIGH** - Core feature, high impact
- 🟢 **MEDIUM** - Important enhancement
- 🔵 **LOW** - Polish and refinement

### Status Legend
- ✅ **Complete** - Implemented and tested
- 🚧 **In Progress** - Under development
- ⏳ **Planned** - Not started, scheduled
- ❌ **Missing** - Gap identified

---

## 🖼️ Canvas Components

### Canvas Page Layout

**Current State:**
```
┌─────────────────────────────────────┐
│ Header (basic)                      │
├──────┬──────────────────────┬───────┤
│ Tool │                      │       │
│ bar  │   Canvas Container   │ Insp. │
│      │                      │       │
├──────┴──────────────────────┴───────┤
│ Status Bar                          │
└─────────────────────────────────────┘
```

**Target State (After All Phases):**
```
┌─────────────────────────────────────┐
│ Menu Bar (Phase 2) - NEW            │
├─────────────────────────────────────┤
│ Header (enhanced)                   │
├──────┬──────────────────────┬───────┤
│ Tool │                      │       │
│ bar  │   Canvas Container   │ Insp. │
│      │   + Grid Overlay     │ Panel │
│      │   + Zoom Controls    │       │
│      │   + Selection        │       │
│      │   + Floating Toolbar*│       │
├──────┴──────────────────────┴───────┤
│ BOM Panel (Phase 1) - NEW           │
├─────────────────────────────────────┤
│ Enhanced Status Bar (Phase 2)       │
└─────────────────────────────────────┘
* Floating Toolbar (Phase 5) appears conditionally
```

### Canvas Component Inventory

**✅ Implemented Components (11)**

<details>
<summary><b>Canvas Area Components (3)</b></summary>

| Component | File | Status | Purpose |
|-----------|------|--------|---------|
| **CanvasContainer** | `components/CanvasContainer.tsx` | ✅ | Main 2D rendering canvas |
| **Grid Overlay** | Inside CanvasContainer | ✅ | Grid lines with toggle |
| **ZoomControls** | `components/ZoomControls.tsx` | ✅ | +/- zoom buttons |

**Notes:**
- CanvasContainer handles all entity rendering
- Grid overlay is configurable (size, visibility)
- ZoomControls positioned bottom-right, non-blocking
</details>

<details>
<summary><b>Toolbar Components (3)</b></summary>

| Component | File | Status | Purpose |
|-----------|------|--------|---------|
| **Toolbar** | `components/Toolbar.tsx` | ✅ | Tool selection (Select/Room/Duct/Equipment) |
| **ExportMenu** | `components/ExportMenu.tsx` | ✅ | Export dropdown (CSV/PDF/JSON) |
| **GridSettings** | `components/GridSettings.tsx` | ✅ | Grid configuration controls |

**Notes:**
- Toolbar positioned left side
- ExportMenu in header area
- GridSettings may be merged into Canvas Properties Inspector
</details>

<details>
<summary><b>Inspector Panel Components (5)</b></summary>

| Component | File | Status | Purpose |
|-----------|------|--------|---------|
| **InspectorPanel** | `components/Inspector/InspectorPanel.tsx` | ✅ | Container for all inspectors |
| **RoomInspector** | `components/Inspector/RoomInspector.tsx` | ✅ | Room property editor |
| **DuctInspector** | `components/Inspector/DuctInspector.tsx` | ✅ | Duct property editor |
| **EquipmentInspector** | `components/Inspector/EquipmentInspector.tsx` | ✅ | Equipment editor |
| **PropertyField** | `components/Inspector/PropertyField.tsx` | ✅ | Reusable form field |

**Notes:**
- InspectorPanel switches content based on selection
- PropertyField used across all inspectors for consistency
- Missing: CanvasPropertiesInspector (zero-selection state)
</details>

### ❌ Missing Canvas Components (6)

| Priority | Component | Complexity | Phase | Files to Create |
|----------|-----------|------------|-------|----------------|
| 🔴 **CRITICAL** | BOM Panel | Moderate | 1 | `BOMPanel.tsx`, `BOMTable.tsx`, `useBOM.ts` |
| 🟡 **HIGH** | Canvas Properties Inspector | Simple | 1 | `CanvasPropertiesInspector.tsx` |
| 🟡 **HIGH** | Menu Bar | Moderate | 2 | `MenuBar.tsx`, `Menu.tsx` |
| 🟢 **MEDIUM** | Enhanced Status Bar | Simple | 2 | Modify existing `StatusBar.tsx` |
| 🟢 **MEDIUM** | Floating Mini-Toolbar | Moderate | 5 | `FloatingToolbar.tsx` |
| 🔵 **LOW** | Fitting Inspector | Simple | 5 | `FittingInspector.tsx` |
| 🔵 **LOW** | Note Inspector | Simple | 5 | `NoteInspector.tsx` |

---

## 🏠 Dashboard Components

### Dashboard Page Layout

**Current State:**
```
┌──────────────────────────────────┐
│ Header (simple)                  │
│ [New Project] [Back]             │
├──────────────────────────────────┤
│ [Active] [Archived] tabs         │
├──────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐      │
│ │ Card │ │ Card │ │ Card │      │
│ └──────┘ └──────┘ └──────┘      │
└──────────────────────────────────┘
```

**Target State:**
```
┌──────────────────────────────────┐
│ App Header                       │
├──────────────────────────────────┤
│ Hero Section (Phase 3) - NEW     │
│ Welcome + CTA                    │
├──────────────────────────────────┤
│ Quick Stats Bar (Phase 3) - NEW  │
│ [24 Projects][3 Active][156 Ent.]│
├──────────────────────────────────┤
│ Recent Projects (Phase 4) - NEW  │
│ Horizontal Carousel              │
├──────────────────────────────────┤
│ Search/Filter Bar (Phase 3) - NEW│
│ [Search] [Filter] [Sort] [View]  │
├──────────────────────────────────┤
│ Project Grid (Enhanced)          │
│ ┌──────┐ ┌──────┐ ┌──────┐      │
│ │ Card │ │ Card │ │ Card │      │
│ └──────┘ └──────┘ └──────┘      │
└──────────────────────────────────┘
```

### Dashboard Component Inventory

**✅ Implemented Components (3)**

| Component | File | Status | Purpose |
|-----------|------|--------|---------|
| **ProjectCard** | `dashboard/components/ProjectCard.tsx` | ✅ | Project info + actions |
| **NewProjectDialog** | `dashboard/components/NewProjectDialog.tsx` | ✅ | Create project modal |
| **ConfirmDialog** | `dashboard/components/ConfirmDialog.tsx` | ✅ | Delete/archive confirm |

### ❌ Missing Dashboard Components (7)

| Priority | Component | Complexity | Phase | Purpose |
|----------|-----------|------------|-------|---------|
| 🟡 **HIGH** | Hero Section | Simple | 3 | Welcome message + CTA |
| 🟡 **HIGH** | Quick Stats Bar | Simple | 3 | Project statistics |
| 🟡 **HIGH** | Search/Filter Bar | Moderate | 3 | Search + filter + sort |
| 🟢 **MEDIUM** | Recent Projects Carousel | Moderate | 4 | Last 10 projects |
| 🟢 **MEDIUM** | View Mode Toggle | Simple | 3 | Grid/List/Compact |
| 🟢 **MEDIUM** | Canvas Thumbnail | Moderate | 4 | Preview generation |
| 🔵 **LOW** | Empty State Illustrations | Simple | 6 | No projects UI |

---

## 📚 Implementation Phases

### Phase 0: Foundation (3 days)

**Goal:** Build shared UI component library

**Components to Build:**

<details>
<summary><b>1. Dropdown Component</b></summary>

**Purpose:** Reusable dropdown for menus, filters, zoom/grid selectors

**Props Interface:**
```typescript
interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}
```

**Features:**
- Click-outside-to-close
- Keyboard navigation (arrow keys, Enter)
- Optional icons per option
- Accessible ARIA labels

**Usage Locations:**
- Canvas Properties Inspector (Grid Size, Unit System)
- Enhanced Status Bar (Zoom presets, Grid sizes)
- Search/Filter Bar (Sort options, Filter options)

**Definition of Done:**
- [ ] Component renders with basic options
- [ ] Selection changes trigger onChange
- [ ] Clicking outside closes dropdown
- [ ] Arrow keys navigate options
- [ ] Enter key selects option
- [ ] Supports optional icons
- [ ] Accessible with screen readers

**File:** `src/components/ui/Dropdown.tsx`

**Implementation Reference:**
```typescript
// src/components/ui/Dropdown.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import styles from './Dropdown.module.css';

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function Dropdown({ options, value, onChange, label, className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className={`${styles.dropdown} ${className || ''}`}>
      {label && <label className={styles.label}>{label}</label>}
      <button 
        className={styles.trigger} 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {selectedOption?.icon}
        <span>{selectedOption?.label || 'Select...'}</span>
        <span className={styles.arrow}>▼</span>
      </button>
      {isOpen && (
        <ul className={styles.menu}>
          {options.map(option => (
            <li 
              key={option.value}
              className={option.value === value ? styles.selected : ''}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.icon}
              <span>{option.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**CSS Reference:**
```css
/* src/components/ui/Dropdown.module.css */
.dropdown {
  position: relative;
  display: inline-block;
}

.label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #374151;
}

.trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: white;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 150ms;
}

.trigger:hover {
  border-color: #9CA3AF;
  background: #F9FAFB;
}

.arrow {
  margin-left: auto;
  font-size: 10px;
  color: #6B7280;
}

.menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 100%;
  background: white;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  list-style: none;
  padding: 4px;
  margin: 0;
  z-index: 1000;
}

.menu li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
}

.menu li:hover {
  background: #F3F4F6;
}

.menu li.selected {
  background: #EEF2FF;
  color: #4F46E5;
  font-weight: 500;
}
```
</details>

<details>
<summary><b>2. CollapsibleSection Component</b></summary>

**Purpose:** Expandable sections for inspectors and panels

**Props Interface:**
```typescript
interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}
```

**Features:**
- Smooth height transition animation
- Rotating arrow icon indicator
- Default expanded/collapsed state
- Preserves content while collapsed

**Usage Locations:**
- Canvas Properties Inspector (sections for Project Info, Grid, Units)
- BOM Panel (Ducts, Equipment, Fittings categories)
- All entity inspectors (property groups)

**Definition of Done:**
- [ ] Section expands/collapses on click
- [ ] Arrow rotates smoothly
- [ ] Height transition is smooth
- [ ] defaultExpanded prop works
- [ ] Content preserved when collapsed

**File:** `src/components/ui/CollapsibleSection.tsx`

**Implementation Reference:**
```typescript
// src/components/ui/CollapsibleSection.tsx
'use client';
import React, { useState } from 'react';
import styles from './CollapsibleSection.module.css';

interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({ 
  title, 
  defaultExpanded = true, 
  children, 
  className 
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`${styles.section} ${className || ''}`}>
      <button 
        className={styles.header} 
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className={`${styles.icon} ${isExpanded ? styles.expanded : ''}`}>
          ▶
        </span>
        <span className={styles.title}>{title}</span>
      </button>
      {isExpanded && (
        <div className={styles.content}>
          {children}
        </div>
      )}
    </div>
  );
}
```

**CSS Reference:**
```css
/* src/components/ui/CollapsibleSection.module.css */
.section {
  border-bottom: 1px solid #E5E7EB;
}

.header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  text-align: left;
  transition: background 150ms;
}

.header:hover {
  background: #F9FAFB;
}

.icon {
  font-size: 10px;
  color: #6B7280;
  transition: transform 150ms;
}

.icon.expanded {
  transform: rotate(90deg);
}

.title {
  flex: 1;
}

.content {
  padding: 0 16px 16px 16px;
  animation: slideDown 150ms ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```
</details>

<details>
<summary><b>3. StatCard Component</b></summary>

**Purpose:** Dashboard statistics display

**Props Interface:**
```typescript
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}
```

**Features:**
- Large number display
- Optional icon on left
- Optional trend indicator (↑↓ with %)
- Hover animation (lift + shadow)
- Responsive sizing

**Usage Locations:**
- Quick Stats Bar (4 cards: Total Projects, Active, Entities, Avg Time)

**Definition of Done:**
- [ ] Renders with value and label
- [ ] Icon displays correctly
- [ ] Trend indicator shows up/down
- [ ] Hover animation works
- [ ] Responsive on mobile

**File:** `src/components/ui/StatCard.tsx`

**Implementation Reference:**
```typescript
// src/components/ui/StatCard.tsx
import React from 'react';
import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <div className={`${styles.card} ${className || ''}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.content}>
        <div className={styles.value}>{value}</div>
        <div className={styles.label}>{label}</div>
        {trend && (
          <div className={`${styles.trend} ${trend.value > 0 ? styles.up : styles.down}`}>
            {trend.value > 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </div>
    </div>
  );
}
```

**CSS Reference:**
```css
/* src/components/ui/StatCard.module.css */
.card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 150ms;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.icon {
  font-size: 32px;
  color: #6366F1;
}

.content {
  flex: 1;
}

.value {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
  margin-bottom: 4px;
}

.label {
  font-size: 14px;
  color: #6B7280;
  font-weight: 500;
}

.trend {
  font-size: 12px;
  margin-top: 8px;
  font-weight: 600;
}

.trend.up {
  color: #10B981;
}

.trend.down {
  color: #EF4444;
}
```
</details>

<details>
<summary><b>4. IconButton Component</b></summary>

**Purpose:** Consistent icon-only buttons

**Props Interface:**
```typescript
interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}
```

**Features:**
- Consistent sizing (32×32px default)
- Disabled state styling
- Hover/active states
- Tooltip support via title

**Usage Locations:**
- Menu Bar quick actions
- Floating Mini-Toolbar
- Status Bar controls

**Definition of Done:**
- [ ] Renders icon centered
- [ ] Click triggers onClick
- [ ] Disabled state prevents clicks
- [ ] Hover state visible
- [ ] Title shows tooltip

**File:** `src/components/ui/IconButton.tsx`
</details>

**Phase 0 Success Criteria:**
- All 4 components implemented and tested
- Documented with props and examples
- Used in at least one real feature to validate

---

### Phase 1: Critical Canvas Components (1.5 weeks)

**Goal:** Implement BOM Panel and Canvas Properties Inspector

<details>
<summary><b>Component 1: BOM Panel</b> 🔴 CRITICAL</summary>

**Priority:** CRITICAL (PRD FR-BOM-002)

**Purpose:** Real-time bill of materials display

**Requirements:**
- Show materials grouped by category (Ducts, Equipment, Fittings)
- Update in real-time as entities change
- Collapsible panel at bottom of canvas
- Export to CSV button
- Show item count in header

**Implementation Steps:**

**Step 1: Create BOM Data Hook**
```typescript
// File: src/features/canvas/hooks/useBOM.ts
export interface GroupedBomItems {
  ducts: BomItem[];
  equipment: BomItem[];
  fittings: BomItem[];
}

export function useBOM(): GroupedBomItems {
  const entities = useEntityStore((state) => ({ 
    byId: state.byId, 
    allIds: state.allIds 
  }));

  const bomItems = useMemo(() => {
    return generateBillOfMaterials(entities);
  }, [entities]);

  const grouped = useMemo(() => {
    return {
      ducts: bomItems.filter(item => item.type === 'Duct'),
      equipment: bomItems.filter(item => item.type === 'Equipment'),
      fittings: bomItems.filter(item => item.type === 'Fitting'),
    };
  }, [bomItems]);

  return grouped;
}
```

**Step 2: Create BOM Table Component**
```typescript
// File: src/features/canvas/components/BOMTable.tsx
interface BOMTableProps {
  items: BomItem[];
}

export function BOMTable({ items }: BOMTableProps) {
  if (items.length === 0) {
    return <div className={styles.empty}>No items</div>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Description</th>
          <th>Quantity</th>
          <th>Unit</th>
          <th>Specifications</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.itemNumber}>
            <td className={styles.number}>{item.itemNumber}</td>
            <td className={styles.name}>{item.name}</td>
            <td className={styles.description}>{item.description}</td>
            <td className={styles.quantity}>{item.quantity}</td>
            <td className={styles.unit}>{item.unit}</td>
            <td className={styles.specs}>{item.specifications}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Step 3: Create BOM Panel Component**
```typescript
// File: src/features/canvas/components/BOMPanel.tsx
'use client';
import React, { useState } from 'react';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { BOMTable } from './BOMTable';
import { useBOM } from '../hooks/useBOM';
import { downloadBomCsv } from '@/features/export/csv';
import { useEntityStore } from '@/core/store/entityStore';
import { useProjectStore } from '@/core/store/project.store';
import styles from './BOMPanel.module.css';

export function BOMPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { ducts, equipment, fittings } = useBOM();
  const entities = useEntityStore((state) => ({ 
    byId: state.byId, 
    allIds: state.allIds 
  }));
  const projectName = useProjectStore((state) => state.projectName || 'Untitled');

  const totalItems = ducts.length + equipment.length + fittings.length;

  const handleExport = () => {
    downloadBomCsv(entities, projectName);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <button 
          className={styles.toggleButton} 
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <span className={`${styles.icon} ${isExpanded ? styles.expanded : ''}`}>
            ▲
          </span>
          <span className={styles.title}>
            Bill of Materials ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </span>
        </button>
        <div className={styles.actions}>
          <button 
            className={styles.exportButton} 
            onClick={handleExport}
            disabled={totalItems === 0}
          >
            Export CSV
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className={styles.content}>
          {totalItems === 0 ? (
            <div className={styles.emptyState}>
              <p>No entities on canvas</p>
              <p className={styles.hint}>Add rooms, ducts, or equipment to generate BOM</p>
            </div>
          ) : (
            <>
              {ducts.length > 0 && (
                <CollapsibleSection title={`Ducts (${ducts.length})`} defaultExpanded>
                  <BOMTable items={ducts} />
                </CollapsibleSection>
              )}
              {equipment.length > 0 && (
                <CollapsibleSection title={`Equipment (${equipment.length})`} defaultExpanded>
                  <BOMTable items={equipment} />
                </CollapsibleSection>
              )}
              {fittings.length > 0 && (
                <CollapsibleSection title={`Fittings (${fittings.length})`} defaultExpanded>
                  <BOMTable items={fittings} />
                </CollapsibleSection>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 4: Integrate into Canvas Layout**

Modify `CanvasPage.tsx`:
```typescript
import { BOMPanel } from './components/BOMPanel';

// Inside render
<div className="flex-1 relative overflow-hidden">
  <CanvasContainer 
    className="w-full h-full" 
    onMouseMove={handleMouseMove}
    onMouseLeave={handleMouseLeave}
  />
  
  {/* Zoom Controls */}
  <div className="absolute bottom-8 right-4 z-10">
    <ZoomControls />
  </div>
  
  {/* BOM Panel - NEW */}
  <BOMPanel />
</div>
```

**Layout After Integration:**
```
┌─────────────────────────────────────┐
│ Header                              │
├──────┬──────────────────────┬───────┤
│ Tool │                      │       │
│ bar  │   Canvas Container   │ Insp. │
│      │                      │       │
├──────┴──────────────────────┴───────┤
│ ▲ BOM Panel (24 items) [Export CSV] │ ← NEW
│ ├─ Ducts (18)                       │
│ ├─ Equipment (4)                    │
│ └─ Fittings (2)                     │
├─────────────────────────────────────┤
│ Status Bar                          │
└─────────────────────────────────────┘
```

**Definition of Done:**
- [ ] BOM panel visible at canvas bottom
- [ ] Expands/collapses on header click
- [ ] Shows correct item count in header
- [ ] Groups items by Ducts/Equipment/Fittings
- [ ] Items update when entities added/removed
- [ ] Table shows all columns correctly
- [ ] Export CSV button downloads correct data
- [ ] Empty state shows when no entities
- [ ] Panel doesn't overlap zoom controls
- [ ] Panel max height enforced, scrollable
- [ ] Collapsible sections work within panel

**Files Created:**
- `src/features/canvas/hooks/useBOM.ts`
- `src/features/canvas/components/BOMTable.tsx`
- `src/features/canvas/components/BOMPanel.tsx`
- `src/features/canvas/components/BOMPanel.module.css`
- `src/features/canvas/components/BOMTable.module.css`

**Testing Checklist:**
- [ ] Add entity → BOM updates
- [ ] Remove entity → BOM updates
- [ ] Multiple entities of same type aggregate correctly
- [ ] CSV export matches table data
- [ ] Panel resizes correctly on window resize
</details>

<details>
<summary><b>Component 2: Canvas Properties Inspector</b> 🟡 HIGH</summary>

**Priority:** HIGH (FR-INSP-001)

**Purpose:** Show canvas settings when nothing selected

**Requirements:**
- Replaces "Select an entity" message
- Shows project info (read-only)
- Grid settings (editable)
- Unit system (editable)
- Canvas info (read-only)

**Implementation:**

```typescript
// File: src/features/canvas/components/Inspector/CanvasPropertiesInspector.tsx
'use client';
import React from 'react';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { Dropdown } from '@/components/ui/Dropdown';
import { useViewportStore } from '../../store/viewportStore';
import { useProjectStore } from '@/core/store/project.store';
import styles from './CanvasPropertiesInspector.module.css';

const GRID_SIZE_OPTIONS = [
  { value: '6', label: '1/4"' },
  { value: '12', label: '1/2"' },
  { value: '24', label: '1"' },
  { value: '48', label: '2"' },
];

const UNIT_SYSTEM_OPTIONS = [
  { value: 'imperial', label: 'Imperial (in, ft)' },
  { value: 'metric', label: 'Metric (mm, m)' },
];

export function CanvasPropertiesInspector() {
  const { 
    gridSize, 
    gridVisible, 
    snapToGrid, 
    setGridSize, 
    toggleGrid, 
    toggleSnap 
  } = useViewportStore();
  
  const projectName = useProjectStore((state) => state.projectName);
  const projectNumber = useProjectStore((state) => state.projectNumber);

  return (
    <div className={styles.inspector}>
      <div className={styles.header}>
        <h3>Canvas Properties</h3>
      </div>

      <CollapsibleSection title="Project Info" defaultExpanded>
        <div className={styles.field}>
          <label>Project Name</label>
          <div className={styles.readOnly}>{projectName || 'Untitled'}</div>
        </div>
        {projectNumber && (
          <div className={styles.field}>
            <label>Project Number</label>
            <div className={styles.readOnly}>{projectNumber}</div>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Grid Settings" defaultExpanded>
        <div className={styles.field}>
          <label>Grid Size</label>
          <Dropdown 
            options={GRID_SIZE_OPTIONS}
            value={String(gridSize)}
            onChange={(value) => setGridSize(Number(value))}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={gridVisible} 
              onChange={toggleGrid}
              className={styles.checkbox}
            />
            <span>Show Grid</span>
          </label>
        </div>
        <div className={styles.field}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={snapToGrid} 
              onChange={toggleSnap}
              className={styles.checkbox}
            />
            <span>Snap to Grid</span>
          </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Units" defaultExpanded>
        <div className={styles.field}>
          <label>Unit System</label>
          <Dropdown 
            options={UNIT_SYSTEM_OPTIONS}
            value="imperial"
            onChange={() => {
              // TODO: Implement unit system switching
              console.log('Unit system change not yet implemented');
            }}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Canvas Info" defaultExpanded={false}>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Background</span>
            <span className={styles.infoValue}>#FAFAFA</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Grid Color</span>
            <span className={styles.infoValue}>#E5E5E5</span>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
```

**Integration with InspectorPanel:**
```typescript
// Modify InspectorPanel.tsx
import { CanvasPropertiesInspector } from './CanvasPropertiesInspector';

// Inside component logic
if (selectedIds.length === 0) {
  content = <CanvasPropertiesInspector />;
} else if (selectedIds.length === 1) {
  // existing single selection
} else {
  // existing multi-selection
}
```

**Definition of Done:**
- [ ] Inspector shows Canvas Properties with zero selection
- [ ] Project info displays correctly
- [ ] Grid size dropdown works and updates grid
- [ ] Grid visibility checkbox toggles grid
- [ ] Snap to grid checkbox toggles snapping
- [ ] Unit system dropdown present (functionality future)
- [ ] Canvas info shows current colors
- [ ] Inspector switches correctly when selecting entities
- [ ] All changes persist in stores

**Files Created/Modified:**
- `src/features/canvas/components/Inspector/CanvasPropertiesInspector.tsx`
- `src/features/canvas/components/Inspector/CanvasPropertiesInspector.module.css`
- Modified: `src/features/canvas/components/Inspector/InspectorPanel.tsx`

**Testing Checklist:**
- [ ] Visible when no selection
- [ ] Hidden when entity selected
- [ ] Grid changes apply immediately
- [ ] Settings persist across sessions
</details>

**Phase 1 Success Criteria:**
- BOM Panel fully functional and integrated
- Canvas Properties Inspector working
- Real-time updates verified
- All tests passing

---

### Phase 2: Enhanced Canvas UI (1 week)

**Goal:** Add Menu Bar and enhanced Status Bar

<details>
<summary><b>Component 1: Menu Bar</b> 🟡 HIGH</summary>

**Structure:**
- File, Edit, View, Insert, Tools, Help menus
- Quick action toolbar (Undo/Redo/Cut/Copy/Delete)
- Keyboard shortcut indicators

**Menu Contents:**

| Menu | Items |
|------|-------|
| **File** | New Project, Save, Save As, Export, Close |
| **Edit** | Undo, Redo, Cut, Copy, Paste, Delete, Select All |
| **View** | Zoom In/Out, Fit to Content, Reset View, Toggle Grid |
| **Insert** | Room, Duct, Equipment, Note |
| **Tools** | Select, Pan, Settings |
| **Help** | Documentation, Shortcuts, About |

**Implementation Reference:**

```typescript
// File: src/features/canvas/components/MenuBar/Menu.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import styles from './Menu.module.css';

export interface MenuItem {
  label: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  divider?: boolean;
}

interface MenuProps {
  label: string;
  items: MenuItem[];
}

export function Menu({ label, items }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleItemClick = (item: MenuItem) => {
    if (!item.disabled && item.onClick) {
      item.onClick();
      setIsOpen(false);
    }
  };

  return (
    <div ref={menuRef} className={styles.menu}>
      <button 
        className={`${styles.trigger} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}
      </button>
      {isOpen && (
        <div className={styles.dropdown}>
          {items.map((item, index) => (
            item.divider ? (
              <div key={index} className={styles.divider} />
            ) : (
              <button
                key={index}
                className={`${styles.item} ${item.disabled ? styles.disabled : ''}`}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
              >
                <span className={styles.label}>{item.label}</span>
                {item.shortcut && (
                  <span className={styles.shortcut}>{item.shortcut}</span>
                )}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
}
```

```typescript
// File: src/features/canvas/components/MenuBar/MenuBar.tsx
'use client';
import React from 'react';
import { Menu } from './Menu';
import { useRouter } from 'next/navigation';
import { useViewportStore } from '../../store/viewportStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useHistoryStore } from '@/core/commands/historyStore';
import styles from './MenuBar.module.css';

export function MenuBar() {
  const router = useRouter();
  const { fitToContent, resetView, toggleGrid } = useViewportStore();
  const { clearAllEntities } = useEntityStore();
  const { canUndo, canRedo, undo, redo } = useHistoryStore();

  const fileMenuItems = [
    { label: 'New Project', shortcut: 'Ctrl+N', onClick: () => router.push('/dashboard') },
    { label: 'Save', shortcut: 'Ctrl+S', onClick: () => console.log('Save') },
    { label: 'Save As...', onClick: () => console.log('Save As') },
    { divider: true },
    { label: 'Export', onClick: () => console.log('Export') },
    { divider: true },
    { label: 'Close', onClick: () => router.push('/dashboard') },
  ];

  const editMenuItems = [
    { label: 'Undo', shortcut: 'Ctrl+Z', onClick: undo, disabled: !canUndo() },
    { label: 'Redo', shortcut: 'Ctrl+Y', onClick: redo, disabled: !canRedo() },
    { divider: true },
    { label: 'Cut', shortcut: 'Ctrl+X', disabled: true },
    { label: 'Copy', shortcut: 'Ctrl+C', disabled: true },
    { label: 'Paste', shortcut: 'Ctrl+V', disabled: true },
    { label: 'Delete', shortcut: 'Del', disabled: true },
    { divider: true },
    { label: 'Select All', shortcut: 'Ctrl+A', disabled: true },
  ];

  const viewMenuItems = [
    { label: 'Zoom In', shortcut: '+', disabled: true },
    { label: 'Zoom Out', shortcut: '-', disabled: true },
    { label: 'Fit to Content', shortcut: 'Ctrl+0', onClick: () => fitToContent({ x: 0, y: 0, width: 800, height: 600 }) },
    { label: 'Reset View', shortcut: 'Home', onClick: resetView },
    { divider: true },
    { label: 'Toggle Grid', shortcut: 'G', onClick: toggleGrid },
  ];

  const insertMenuItems = [
    { label: 'Room', shortcut: 'R', disabled: true },
    { label: 'Duct', shortcut: 'D', disabled: true },
    { label: 'Equipment', shortcut: 'E', disabled: true },
    { divider: true },
    { label: 'Note', disabled: true },
  ];

  const toolsMenuItems = [
    { label: 'Select', shortcut: 'V', disabled: true },
    { label: 'Pan', shortcut: 'H', disabled: true },
    { divider: true },
    { label: 'Settings', onClick: () => console.log('Settings') },
  ];

  const helpMenuItems = [
    { label: 'Documentation', onClick: () => window.open('https://docs.example.com', '_blank') },
    { label: 'Keyboard Shortcuts', shortcut: '?', disabled: true },
    { divider: true },
    { label: 'About', onClick: () => console.log('About') },
  ];

  return (
    <div className={styles.menuBar}>
      <div className={styles.menus}>
        <Menu label="File" items={fileMenuItems} />
        <Menu label="Edit" items={editMenuItems} />
        <Menu label="View" items={viewMenuItems} />
        <Menu label="Insert" items={insertMenuItems} />
        <Menu label="Tools" items={toolsMenuItems} />
        <Menu label="Help" items={helpMenuItems} />
      </div>
      <div className={styles.quickActions}>
        <button 
          className={styles.actionButton} 
          onClick={undo} 
          disabled={!canUndo()}
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button 
          className={styles.actionButton} 
          onClick={redo} 
          disabled={!canRedo()}
          title="Redo (Ctrl+Y)"
        >
          ↷
        </button>
        <div className={styles.separator} />
        <button 
          className={styles.actionButton} 
          disabled 
          title="Cut (Ctrl+X)"
        >
          ✂
        </button>
        <button 
          className={styles.actionButton} 
          disabled 
          title="Copy (Ctrl+C)"
        >
          📋
        </button>
        <button 
          className={styles.actionButton} 
          disabled 
          title="Delete (Del)"
        >
          🗑
        </button>
      </div>
    </div>
  );
}
```

**Definition of Done:**
- [ ] All menus render and open
- [ ] Only one menu open at a time
- [ ] Menu items call correct handlers
- [ ] Disabled items appear muted
- [ ] Keyboard shortcuts shown
- [ ] Quick actions functional
- [ ] Tooltips on quick actions

**Files:**
- `src/features/canvas/components/MenuBar/MenuBar.tsx`
- `src/features/canvas/components/MenuBar/Menu.tsx`
- `src/features/canvas/components/MenuBar/MenuBar.module.css`
- `src/features/canvas/components/MenuBar/Menu.module.css`
</details>

<details>
<summary><b>Component 2: Enhanced Status Bar</b> 🟢 MEDIUM</summary>

**Enhancements:**
- Zoom dropdown (25%, 50%, 75%, 100%, 150%, 200%, 300%, 400%)
- Grid size dropdown (1/4", 1/2", 1", 2")
- Snap to grid toggle button
- Better layout organization

**Layout:**
```
┌────────────────────────────────────────────┐
│ X: 120, Y: 240 | Selection: 3 items |     │
│ Zoom: [100% ▼] Grid: [1" ▼] Snap: [●]    │
└────────────────────────────────────────────┘
```

**Implementation Reference:**

```typescript
// File: src/features/canvas/components/StatusBar.tsx (ENHANCED)
'use client';
import React from 'react';
import { Dropdown } from '@/components/ui/Dropdown';
import { useViewportStore } from '../store/viewportStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '../store/selectionStore';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  mousePosition: { x: number; y: number } | null;
}

const ZOOM_PRESETS = [
  { value: '0.25', label: '25%' },
  { value: '0.5', label: '50%' },
  { value: '0.75', label: '75%' },
  { value: '1', label: '100%' },
  { value: '1.5', label: '150%' },
  { value: '2', label: '200%' },
  { value: '3', label: '300%' },
  { value: '4', label: '400%' },
];

const GRID_SIZES = [
  { value: '6', label: '1/4"' },
  { value: '12', label: '1/2"' },
  { value: '24', label: '1"' },
  { value: '48', label: '2"' },
];

export function StatusBar({ mousePosition }: StatusBarProps) {
  const { zoom, zoomTo, gridSize, setGridSize, snapToGrid, toggleSnap } = useViewportStore();
  const entityCount = useEntityStore((state) => state.allIds.length);
  const selectedIds = useSelectionStore((state) => state.selectedIds);

  const currentZoomValue = String(zoom);

  return (
    <div className={styles.statusBar}>
      {/* Left section - Mouse position */}
      <div className={styles.section}>
        {mousePosition ? (
          <span className={styles.coordinates}>
            X: {Math.round(mousePosition.x)}, Y: {Math.round(mousePosition.y)}
          </span>
        ) : (
          <span className={styles.coordinates}>—</span>
        )}
      </div>

      {/* Center section - Selection info */}
      <div className={styles.section}>
        {selectedIds.length > 0 ? (
          <span className={styles.info}>
            Selection: {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'}
          </span>
        ) : (
          <span className={styles.info}>
            Entities: {entityCount}
          </span>
        )}
      </div>

      {/* Right section - View controls */}
      <div className={`${styles.section} ${styles.controls}`}>
        <div className={styles.control}>
          <span className={styles.controlLabel}>Zoom:</span>
          <Dropdown 
            options={ZOOM_PRESETS}
            value={currentZoomValue}
            onChange={(value) => zoomTo(Number(value))}
          />
        </div>

        <div className={styles.separator} />

        <div className={styles.control}>
          <span className={styles.controlLabel}>Grid:</span>
          <Dropdown 
            options={GRID_SIZES}
            value={String(gridSize)}
            onChange={(value) => setGridSize(Number(value))}
          />
        </div>

        <div className={styles.separator} />

        <button 
          className={`${styles.snapButton} ${snapToGrid ? styles.active : ''}`}
          onClick={toggleSnap}
          title={snapToGrid ? 'Snap to Grid: ON' : 'Snap to Grid: OFF'}
        >
          <span className={styles.snapIcon}>⊞</span>
          <span className={styles.snapText}>Snap</span>
        </button>
      </div>
    </div>
  );
}
```

**Definition of Done:**
- [ ] Zoom dropdown changes viewport zoom
- [ ] Grid dropdown updates grid size
- [ ] Snap button toggles snap state
- [ ] Visual states for snap ON/OFF
- [ ] Layout responsive and compact

**Files:**
- Modified: `src/features/canvas/components/StatusBar.tsx`
- Modified: `src/features/canvas/components/StatusBar.module.css`
</details>

---

### Phase 3: Dashboard Core Enhancements (1 week)

**Goal:** Hero Section, Quick Stats Bar, Search/Filter Bar

<details>
<summary><b>Component 1: Hero Section</b> 🟡 HIGH</summary>

**Features:**
- Time-based greeting ("Good morning/afternoon/evening")
- User name display
- Last project activity
- Large "+ New Project" CTA button
- Subtle gradient background

**Implementation Reference:**

```typescript
// File: src/features/dashboard/components/HeroSection.tsx
'use client';
import React from 'react';
import styles from './HeroSection.module.css';

interface HeroSectionProps {
  userName?: string;
  lastProject?: {
    name: string;
    lastOpened: Date;
  };
  onCreateProject: () => void;
}

export function HeroSection({ userName, lastProject, onCreateProject }: HeroSectionProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  };

  return (
    <div className={styles.hero}>
      <div className={styles.content}>
        <h1 className={styles.greeting}>
          {getGreeting()}{userName ? `, ${userName}` : ''}!
        </h1>
        {lastProject && (
          <p className={styles.subtitle}>
            Continue where you left off: <strong>{lastProject.name}</strong> 
            {' '}• {getRelativeTime(lastProject.lastOpened)}
          </p>
        )}
        {!lastProject && (
          <p className={styles.subtitle}>
            Create your first HVAC design project to get started
          </p>
        )}
      </div>
      <button className={styles.ctaButton} onClick={onCreateProject}>
        + New Project
      </button>
    </div>
  );
}
```

**Definition of Done:**
- [ ] Greeting changes based on time of day
- [ ] Shows last opened project
- [ ] CTA button opens New Project dialog
- [ ] Responsive on mobile
- [ ] Gradient background applied

**Files:**
- `src/features/dashboard/components/HeroSection.tsx`
- `src/features/dashboard/components/HeroSection.module.css`
</details>

<details>
<summary><b>Component 2: Quick Stats Bar</b> 🟡 HIGH</summary>

**Stats to Display:**
1. Total Projects
2. Active Projects  
3. Total Entities (across all projects)
4. Recent Activity (projects opened today/this week)

**Uses:** `StatCard` component from Phase 0

**Implementation Reference:**

```typescript
// File: src/features/dashboard/components/QuickStatsBar.tsx
import React from 'react';
import { StatCard } from '@/components/ui/StatCard';
import styles from './QuickStatsBar.module.css';

interface QuickStatsBarProps {
  totalProjects: number;
  activeProjects: number;
  totalEntities: number;
  recentActivity: number;
}

export function QuickStatsBar({ 
  totalProjects, 
  activeProjects, 
  totalEntities, 
  recentActivity 
}: QuickStatsBarProps) {
  return (
    <div className={styles.statsBar}>
      <StatCard 
        label="Total Projects"
        value={totalProjects}
        icon={<span>📁</span>}
      />
      <StatCard 
        label="Active Projects"
        value={activeProjects}
        icon={<span>⚡</span>}
      />
      <StatCard 
        label="Total Entities"
        value={totalEntities}
        icon={<span>📊</span>}
      />
      <StatCard 
        label="Recent Activity"
        value={recentActivity}
        icon={<span>🕐</span>}
      />
    </div>
  );
}
```

**Definition of Done:**
- [ ] All 4 stats displayed
- [ ] Stats reflect real data
- [ ] Icons appropriate for each stat
- [ ] Responsive grid (2×2 on mobile, 4×1 on desktop)
- [ ] Hover animations work

**Files:**
- `src/features/dashboard/components/QuickStatsBar.tsx`
- `src/features/dashboard/components/QuickStatsBar.module.css`
</details>

<details>
<summary><b>Component 3: Search/Filter Bar</b> 🟡 HIGH</summary>

**Features:**
- Search input with debounce (300ms)
- Filter dropdown (All/Recent/Active/Archived)
- Sort dropdown (Name A-Z/Z-A, Date Newest/Oldest, Size)
- View mode toggle (Grid/List/Compact) - Grid only initially

**Implementation Reference:**

```typescript
// File: src/features/dashboard/components/SearchFilterBar.tsx
'use client';
import React from 'react';
import { Dropdown } from '@/components/ui/Dropdown';
import styles from './SearchFilterBar.module.css';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterBy: string;
  onFilterChange: (filter: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: 'grid' | 'list' | 'compact';
  onViewModeChange: (mode: 'grid' | 'list' | 'compact') => void;
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Projects' },
  { value: 'recent', label: 'Recent' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'date-newest', label: 'Date (Newest)' },
  { value: 'date-oldest', label: 'Date (Oldest)' },
  { value: 'size-desc', label: 'Size (Largest)' },
];

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  filterBy,
  onFilterChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: SearchFilterBarProps) {
  return (
    <div className={styles.filterBar}>
      <div className={styles.search}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.controls}>
        <Dropdown
          label="Filter"
          options={FILTER_OPTIONS}
          value={filterBy}
          onChange={onFilterChange}
        />

        <Dropdown
          label="Sort"
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={onSortChange}
        />

        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
            onClick={() => onViewModeChange('grid')}
            title="Grid View"
          >
            ⊞
          </button>
          <button
            className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => onViewModeChange('list')}
            title="List View"
          >
            ☰
          </button>
          <button
            className={`${styles.viewButton} ${viewMode === 'compact' ? styles.active : ''}`}
            onClick={() => onViewModeChange('compact')}
            title="Compact View"
          >
            ▤
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Definition of Done:**
- [ ] Search filters projects in real-time
- [ ] Filter dropdown works
- [ ] Sort dropdown works
- [ ] View toggle present (Grid active)
- [ ] Combined filtering logic correct
- [ ] Debounce prevents excessive re-renders

**Files:**
- `src/features/dashboard/components/SearchFilterBar.tsx`
- `src/features/dashboard/components/SearchFilterBar.module.css`
</details>

**Phase 3 Success Criteria:**
- Dashboard feels professional
- All three components integrated
- Search/filter working smoothly
- Stats accurate

---

### Phase 4: Dashboard Polish (3-4 days)

**Goal:** Recent Projects Carousel and thumbnail preparation

**Component: Recent Projects Carousel** 🟢 MEDIUM

**Features:**
- Last 10 projects displayed
- Horizontal scroll with nav arrows
- Larger cards with thumbnail placeholder
- Quick-open on click
- Only visible if projects exist

**Definition of Done:**
- [ ] Shows last 10 projects
- [ ] Horizontal scroll works
- [ ] Nav arrows scroll container
- [ ] Click opens project
- [ ] Hidden when no projects
- [ ] Thumbnail placeholder shown

**Files:**
- `src/features/dashboard/components/RecentProjectsCarousel.tsx`
- `src/features/dashboard/components/RecentProjectsCarousel.module.css`

---

### Phase 5: Advanced Canvas Features (3-4 days)

**Goal:** Floating Mini-Toolbar and additional inspectors

**Component 1: Floating Mini-Toolbar** 🟢 MEDIUM

**Features:**
- Appears when entities selected
- Positioned near selection
- Actions: Undo, Redo, Cut, Copy, Delete
- Smooth show/hide animation

**Component 2 & 3: Fitting and Note Inspectors** 🔵 LOW

**Purpose:** Handle fitting and note entity types

---

### Phase 6: Testing & Polish (3 days)

**Testing Areas:**
- Integration tests (Dashboard → Canvas → BOM → Export)
- Responsive behavior
- Cross-browser compatibility
- Performance profiling
- Accessibility basics

**Documentation:**
- Component READMEs
- User guide updates
- Developer notes

---

## 📈 Timeline Summary

| Phase | Duration | Components | Priority |
|-------|----------|------------|----------|
| **Phase 0** | 3 days | 4 shared UI components | Foundation |
| **Phase 1** | 1.5 weeks | BOM Panel, Canvas Properties | 🔴 Critical |
| **Phase 2** | 1 week | Menu Bar, Enhanced Status | 🟡 High |
| **Phase 3** | 1 week | Hero, Stats, Search/Filter | 🟡 High |
| **Phase 4** | 3-4 days | Carousel, Thumbnails | 🟢 Medium |
| **Phase 5** | 3-4 days | Floating Toolbar, Inspectors | 🟢 Medium |
| **Phase 6** | 3 days | Testing, Documentation | Quality |

**Total Duration:** 6-8 weeks (single developer)

---

## ✅ Implementation Checklist

### Pre-Implementation
- [ ] Review all existing components
- [ ] Set up component folders
- [ ] Define naming conventions
- [ ] Create component templates

### Phase 0
- [ ] Dropdown component
- [ ] CollapsibleSection component
- [ ] StatCard component
- [ ] IconButton component
- [ ] Test all shared components

### Phase 1
- [ ] useBOM hook
- [ ] BOMTable component
- [ ] BOMPanel component
- [ ] Canvas Properties Inspector
- [ ] Integration testing

### Phase 2
- [ ] Menu component
- [ ] MenuBar component
- [ ] Enhanced StatusBar
- [ ] Integration testing

### Phase 3
- [ ] HeroSection
- [ ] QuickStatsBar
- [ ] SearchFilterBar
- [ ] Dashboard integration

### Phase 4
- [ ] RecentProjectsCarousel
- [ ] Thumbnail system prep

### Phase 5
- [ ] FloatingToolbar
- [ ] Fitting Inspector
- [ ] Note Inspector

### Phase 6
- [ ] Full integration testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] Accessibility audit

---

## 🎯 Success Metrics

**Functional Completeness:**
- All 13 missing components implemented
- All features from specifications working
- Zero critical bugs

**Performance:**
- Canvas renders 60fps with 200+ entities
- Dashboard loads <1s with 100+ projects
- Search/filter responds <300ms

**UX Quality:**
- Professional desktop app feel
- Intuitive navigation
- Action discoverability
- Real-time BOM visibility

**Code Quality:**
- Components reusable and documented
- Tests passing for all new features
- Accessibility standards met
- Responsive design verified

---

## 📝 Final Notes

This guide serves as the single source of truth for implementing all missing UI components in the SizeWise HVAC Canvas application. Each phase builds upon the previous, creating a professional, feature-complete application.

**Key Principles:**
- Build shared components first (Phase 0)
- Implement critical features early (Phase 1)
- Maintain consistent design patterns
- Test thoroughly at each phase
- Document as you build

**For Questions:**
- Refer to PRD for functional requirements
- Check Dashboard_Improvement.md for design specs
- Review existing component patterns
- Consult team for clarifications