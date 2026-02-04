# HVAC Canvas App - Design System & UI/UX Audit

## 1. UI Diagnosis & Audit
### Current State
*   **Hybrid Styling Architecture**: The codebase mixes **Tailwind CSS** (Header, AppShell), **CSS Modules** (InspectorPanel), and **Material UI Theming** (`theme.ts`). This leads to inconsistent spacing, color values, and component behavior.
*   **Color Inconsistency**: 
    *   `theme.ts` defines MUI Blue (`#1976d2`).
    *   `globals.css` defines Tailwind Blue (`hsl(221.2 ...)`).
    *   This results in two different "Primary" colors clashing in the UI.
*   **Layout Issues**: 
    *   `Header` is `h-12` (48px) which is slightly cramped for complex engineering menus.
    *   Panel components use varying widths and padding strategies (CSS modules vs utility classes).
*   **Visual Hierarchy**: The Canvas should be the hero, but mixed chrome styles compete for attention.

### Improvement Goals
*   **Unify on Tailwind CSS**: Deprecate CSS Modules and MUI Theme objects in favor of utility-first Tailwind + Shadcn/Radix primitives.
*   **Engineering-Grade Palette**: Shift from "Generic SaaS Blue" to a distinct "Technical Blue".
*   **Strict Sizing Contract**: Align all panels and toolbars to a 4px/8px rhythm.

---

## 2. Layout & Sizing Rules
Treat the UI as a rigorous grid system.

### Spatial Balance
*   **Base Unit**: 4px (`0.25rem`). All dimensions must be multiples of 4.
*   **Density**: "Comfortable Density" - tight enough for data, loose enough for touch/scan.

### Component Dimensions (Mandatory)
| Component | Height/Width | Tailwind Class | Notes |
|:---|:---|:---|:---|
| **Header** | 56px | `h-14` | Explicit height. Contains branding, file menus, and workspace triggers. |
| **Toolbar (Left)** | 56px (Item Box) | `w-14` or `w-16` | Vertical tool rail. Icons should be 20px-24px. |
| **Sidebar (Right)** | 320px (Fixed) | `w-80` | Inspector Panel. Fixed width to prevent layout shifts. Resizeable only if strictly needed. |
| **Panel Header** | 40px | `h-10` | Section headers within sidebars. |
| **Input Height** | 32px | `h-8` | Standard form input height for density. |
| **Button Height** | 36px | `h-9` | Standard action button. |

### Z-Index Stratification
| Layer | Z-Index | Note |
|:---|:---|:---|
| **Canvas** | `z-0` | The workspace floor. |
| **Selection Overlay** | `z-10` | Drag boxes, temporary guides. |
| **Chrome (Sidebars)** | `z-20` | Panels float above canvas edge but not modal. |
| **Header** | `z-30` | Spans full width, typically casts shadow on Chrome. |
| **Dropdowns/Popovers**| `z-40` | Menus attached to Chrome. |
| **Modals/Dialogs** | `z-50` | Critical interruptions (Settings, Confirmations). |
| **Toasts** | `z-100` | Notifications. |

---

## 3. Color System (Engineering Technical)
A restrained, high-contrast system designed for long-session usability.

### Palette Rationale
*   **Neutral (Slate)**: selected for cool, steel-like industrial feel. Reduces eye strain compared to pure grays.
*   **Primary (Technical Blue)**: A precise, non-aggressive blue for active states and primary actions.
*   **Canvas**: White or faint grid on white. It represents the "drawing paper".

### Color Token Map (Tailwind / CSS Variables)

**Base Colors**
*   `bg-background` -> White (`#ffffff`) or very faint gray (`#f8fafc`)
*   `bg-surface` -> Slate-50 (`#f8fafc`) (Panel Backgrounds)
*   `bg-surface-active` -> Slate-100 (`#f1f5f9`) (Hover/Active list items)

**Borders**
*   `border-border` -> Slate-200 (`#e2e8f0`) (Subtle structural dividers)
*   `border-active` -> Blue-500 (`#3b82f6`) (Focus states, Selected items)

**Text**
*   `text-foreground` -> Slate-900 (`#0f172a`) (Primary reading text)
*   `text-muted` -> Slate-500 (`#64748b`) (Labels, secondary info)
*   `text-on-primary` -> White (`#ffffff`)

**Semantic / Status**
*   `text-error` / `bg-error` -> Red-600 (`#dc2626`) (Validation errors, "Return Air" conventionally)
*   `text-success` / `bg-success` -> Emerald-600 (`#059669`) (Valid connections)
*   `text-warning` / `bg-warning` -> Amber-500 (`#f59e0b`) (Missing constraints)
*   `text-info` -> Blue-500 (`#3b82f6`) (Selection highlights)

### HVAC Domain Colors (Convention)
*   **Supply Air**: Blue (`#3b82f6`)
*   **Return Air**: Red/Magenta (`#db2777`)
*   **Exhaust Air**: Green/Amber (`#d97706`)

---

## 4. Component Hierarchy & Patterns

### 1. Canvas (The Stage)
*   **Rule**: Must occupy at least 70% of the viewport.
*   **Behavior**: Infinite pan/zoom.
*   **Interaction**: Neutral background to allow colored HVAC lines to pop.

### 2. Chrome (The Frame)
*   **Components**: Header, Left Toolbar, Right Inspector.
*   **Visual**: Solid `bg-slate-50` backgrounds with `border-r` or `border-l`.
*   **Shadows**: Use `shadow-sm` ONLY on floating elements. Chrome panels should use Borders for separation, not Shadows (cleaner, flatter look).

### 3. Inspector Panel (The Controller)
*   **Pattern**: Stacked Accordions or Section Groups.
*   **Input Alignment**: Labels top-aligned or grid-aligned (Label + Input).
*   **Density**: High. Group related properties (Dimensions, Airflow, Identity) together.

### 4. Floating Tools (The HUD)
*   **Context**: Context menus or bottom-center toolbars.
*   **Visual**: Glassmorphism (`bg-white/80 backdrop-blur`) allowed here to denote "floating" status.

---

## 5. Implementation Guidance
**Objective**: Migrate `InspectorPanel` from CSS Modules to Tailwind.

### Refactor Plan
1.  **Remove** `InspectorPanel.module.css`.
2.  **Apply** Layout Classes:
    ```tsx
    // Container
    <aside className="w-80 h-full border-l border-slate-200 bg-slate-50 flex flex-col z-20">
      
      // Header
      <div className="h-10 px-4 flex items-center border-b border-slate-200 font-semibold text-sm text-slate-700 uppercase tracking-wide">
        Properties
      </div>

      // Scrollable Content
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {content}
      </div>

    </aside>
    ```
3.  **Update** `globals.css` with the new color values (hsl) to enforce the "Slate/Technical Blue" theme.

---

## 6. Status Badge System

Project cards display status badges to indicate the current state of each project. Badges are mutually exclusive (only one status badge shows at a time).

### Badge States & Colors

| Status | Badge Class | Text Color | Background | Border | Use Case |
|:---|:---|:---|:---|:---|:---|
| **Draft** | `badge-slate` | Slate-600 | Slate-100 | Slate-200 | New or unstarted projects |
| **In Progress** | `badge-blue` | Blue-700 | Blue-50 | Blue-100 | Active work in progress |
| **Complete** | `badge-green` | Emerald-700 | Emerald-50 | Emerald-100 | Finished projects |
| **Archived** | `badge-amber` | Amber-700 | Amber-50 | Amber-100 | Inactive/archived projects |

### Badge Implementation

```tsx
// Status badge rendering (ProjectCard.tsx)
{project.isArchived && (
  <span className="badge badge-amber">Archived</span>
)}
{!project.isArchived && project.status === 'in-progress' && (
  <span className="badge badge-blue">In Progress</span>
)}
{!project.isArchived && project.status === 'complete' && (
  <span className="badge badge-green">Complete</span>
)}
{!project.isArchived && (!project.status || project.status === 'draft') && (
  <span className="badge badge-slate">Draft</span>
)}
```

### Badge Precedence Rules
1. **Archived** badge takes precedence over all other status badges
2. Non-archived projects show their status badge (draft, in-progress, complete)
3. Projects without a status default to **Draft**

### Dark Mode Support
All badge classes include dark mode variants defined in `globals.css`:
- Dark backgrounds use `bg-{color}-900/30`
- Dark text uses `text-{color}-300`
- Dark borders use `border-{color}-800`

---

## 7. CSS Module Migration Complete

**All dashboard components now use Tailwind CSS exclusively.** CSS Modules have been fully removed from:

| Component | Status | Notes |
|:---|:---|:---|
| `NewProjectDialog` | ✅ Complete | Uses shadcn/ui Dialog + Tailwind |
| `ConfirmDialog` | ✅ Complete | Uses shadcn/ui Dialog + Tailwind |
| `ProjectCard` | ✅ Complete | Pure Tailwind utilities |
| `SearchBar` | ✅ Complete | Pure Tailwind utilities |
| `DashboardPage` | ✅ Complete | Uses component classes from globals.css |

### Technical Blue (#3b82f6) Usage
The Technical Blue color is consistently applied across all interactive elements:
- **Primary Buttons**: `bg-blue-600 hover:bg-blue-700`
- **Focus Rings**: `focus:ring-blue-500/20 focus:border-blue-400`
- **Selected States**: `border-blue-500` or `bg-blue-600`
- **Status Badge (In Progress)**: `badge-blue`

