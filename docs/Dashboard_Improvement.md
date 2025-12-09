
# 1. Dashboard Layout Improvements

## 1.1 Modern Dashboard Design Pattern

### Layout Structure (Responsive Grid)
```
┌────────────────────────────────────────────────────────────┐
│  App Header (64px height)                                  │
│  ┌──────────┐  SizeWise HVAC Canvas    [Search] [Settings]│
│  │   Logo   │                                              │
│  └──────────┘                                              │
├────────────────────────────────────────────────────────────┤
│  Hero Section (120px height)                               │
│  Welcome back, [User]!                    [+ New Project]  │
│  Continue where you left off                               │
├────────────────────────────────────────────────────────────┤
│  Quick Stats Bar (80px height)                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ 24       │ │ 3        │ │ 156      │ │ 2.4 hrs  │     │
│  │ Projects │ │ Active   │ │ Entities │ │ Avg Time │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
├────────────────────────────────────────────────────────────┤
│  Recent Projects (Horizontal Scroll)                       │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ →              │
│  │ Img │ │ Img │ │ Img │ │ Img │ │ Img │                │
│  │Name │ │Name │ │Name │ │Name │ │Name │                │
│  │Date │ │Date │ │Date │ │Date │ │Date │                │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                │
├────────────────────────────────────────────────────────────┤
│  Filter Bar                                                │
│  [All Projects ▼] [Sort: Recent ▼] [Grid ⊞] [List ☰]     │
├────────────────────────────────────────────────────────────┤
│  Project Grid (Responsive: 1-4 columns)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Preview  │ │ Preview  │ │ Preview  │ │ Preview  │    │
│  │ Image    │ │ Image    │ │ Image    │ │ Image    │    │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤    │
│  │ Name     │ │ Name     │ │ Name     │ │ Name     │    │
│  │ 24 items │ │ 12 items │ │ 8 items  │ │ 45 items │    │
│  │ 2d ago ⋮ │ │ 1w ago ⋮ │ │ 3d ago ⋮ │ │ 5h ago ⋮ │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │   ...    │ │   ...    │ │   ...    │ │   ...    │    │
└────────────────────────────────────────────────────────────┘
```

### Key Improvements

#### 1. Hero Section with Personalization
- **Welcome Message**: "Welcome back, [User]!" or "Good [morning/afternoon/evening]!"
- **Contextual CTA**: Large, prominent "New Project" button
- **Quick Stats**: Show project count, active projects, total entities
- **Last Activity**: "Last opened: Kitchen Ventilation Design - 2 hours ago"

#### 2. Enhanced Project Cards
```
┌────────────────────────┐
│  ┌──────────────────┐  │
│  │  Canvas Preview  │  │  ← Thumbnail of canvas (auto-generated)
│  │  (or placeholder)│  │
│  └──────────────────┘  │
│  Project Name       ⋮  │  ← Three-dot menu
│  ────────────────────  │
│  📊 24 entities        │  ← Visual indicators
│  📅 Modified 2d ago    │
│  👤 John Doe           │  ← Author (future)
│  ────────────────────  │
│  [Open] [Duplicate]    │  ← Quick actions
└────────────────────────┘
```

**Card Features:**
- Hover effect: Subtle elevation increase
- Canvas thumbnail preview (generated on save)
- Entity count with icon
- Relative time (e.g., "2 days ago", "just now")
- Status badge (if applicable: "Active", "Archived")
- Quick action buttons on hover
- Three-dot menu for more actions

#### 3. Smart Search & Filter System
```
┌────────────────────────────────────────────────┐
│  🔍 Search projects...              [Advanced]│
├────────────────────────────────────────────────┤
│  Filters:                                      │
│  [All Projects ▼] [Recent ▼] [Sort: Date ▼]  │
│  Tags: [Kitchen] [Office] [Warehouse] [+]     │
└────────────────────────────────────────────────┘
```

**Features:**
- Real-time search (debounced 300ms)
- Filter by: All, Recent, Archived, Favorites
- Sort by: Name (A-Z, Z-A), Date (Newest, Oldest), Size (Entities)
- Tag system (future enhancement)
- View toggle: Grid / List / Compact

#### 4. Recent Projects Carousel
- Horizontal scrolling carousel
- Last 10 projects
- Larger cards with preview
- Quick-open on click
- Swipe gesture support (future)

#### 5. Empty States
```
┌────────────────────────────────────┐
│                                    │
│         📁                         │
│    No Projects Yet                 │
│                                    │
│  Create your first HVAC design    │
│  project to get started            │
│                                    │
│     [+ Create Project]             │
│                                    │
│  or import an existing .sws file   │
│     [📥 Import Project]            │
│                                    │
└────────────────────────────────────┘
```

**Empty State Variations:**
- No projects at all
- No search results
- No recent projects
- All projects archived

---

## 1.2 Dashboard Component Breakdown

### Components to Create

#### HeroSection.tsx
```typescript
interface HeroSectionProps {
  userName?: string;
  lastProject?: {
    name: string;
    lastOpened: Date;
  };
  onCreateProject: () => void;
}
```
**Features:**
- Personalized greeting based on time of day
- Last activity summary
- Prominent CTA button
- Animated background (subtle)

#### QuickStatsBar.tsx
```typescript
interface QuickStatsBarProps {
  totalProjects: number;
  activeProjects: number;
  totalEntities: number;
  avgSessionTime: number;
}
```
**Features:**
- Icon + number + label for each stat
- Animated counters on load
- Tooltips with additional info
- Responsive grid (2x2 on mobile, 4x1 on desktop)

#### ProjectCard.tsx (Enhanced)
```typescript
interface ProjectCardProps {
  project: ProjectMetadata;
  onOpen: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  onArchive: () => void;
  onDelete: () => void;
  view: 'grid' | 'list' | 'compact';
}
```
**Features:**
- Three view modes
- Canvas thumbnail (lazy loaded)
- Hover animations
- Context menu
- Quick actions
- Status badges
- Favorite toggle (future)

#### SearchFilterBar.tsx
```typescript
interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterBy: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}
```
**Features:**
- Debounced search input
- Filter dropdown with icons
- Sort dropdown
- View mode toggle buttons
- Clear filters button
- Advanced search toggle (future)

#### RecentProjectsCarousel.tsx
```typescript
interface RecentProjectsCarouselProps {
  projects: ProjectMetadata[];
  onProjectClick: (id: string) => void;
}
```
**Features:**
- Horizontal scroll
- Snap to cards
- Navigation arrows
- Touch/swipe support
- Skeleton loading state

#### EmptyState.tsx
```typescript
interface EmptyStateProps {
  type: 'no-projects' | 'no-results' | 'no-recent' | 'archived';
  onCreateProject?: () => void;
  onImportProject?: () => void;
}
```
**Features:**
- Contextual illustration
- Clear message
- Actionable CTAs
- Different states for different scenarios

---

# 2. Canvas Layout Improvements

## 2.1 Professional Canvas Workspace Design

### Layout Structure (Three-Panel Design)
```
┌─────────────────────────────────────────────────────────────┐
│  Canvas Header (56px height)                                │
│  [☰] Project Name [Save Status] [Undo] [Redo]    [⚙] [?]  │
├──┬────────────────────────────────────────────────────┬─────┤
│T │                                                    │ I   │
│o │                                                    │ n   │
│o │              Canvas Workspace                     │ s   │
│l │              (Infinite 2D Grid)                   │ p   │
│b │                                                    │ e   │
│a │                                                    │ c   │
│r │                                                    │ t   │
│  │                                                    │ o   │
│6 │                                                    │ r   │
│4 │                                                    │     │
│p │                                                    │ 3   │
│x │                                                    │ 2   │
│  │                                                    │ 0   │
│  │                                                    │ p   │
│  │                                                    │ x   │
├──┴────────────────────────────────────────────────────┴─────┤
│  Status Bar (32px height)                                   │
│  Zoom: 100% | Grid: 1" | Cursor: (120, 240) | 24 entities  │
└─────────────────────────────────────────────────────────────┘
```

### Key Improvements

#### 1. Enhanced Canvas Header
```
┌────────────────────────────────────────────────────────┐
│ [☰] Kitchen Ventilation Design    ● Saved 2m ago      │
│                                                        │
│ File  Edit  View  Insert  Tools  Help                │
│ [↶] [↷] [✂] [📋] [🗑]    [100% ▼] [⊞] [⚙]          │
└────────────────────────────────────────────────────────┘
```

**Features:**
- Menu bar (File, Edit, View, Insert, Tools, Help)
- Quick action toolbar
- Real-time save status indicator
- Undo/Redo with history preview
- Zoom controls
- Grid toggle
- Settings access

#### 2. Vertical Toolbar (Left Side)
```
┌────┐
│ V  │ ← Select (default)
├────┤
│ ▭  │ ← Room
├────┤
│ ═  │ ← Duct
├────┤
│ ⚙  │ ← Equipment
├────┤
│ ✎  │ ← Note
├────┤
│ ⊞  │ ← Group
├────┤
│ 🖐 │ ← Pan
├────┤
│ 🔍 │ ← Zoom
└────┘
```

**Features:**
- Icon + tooltip with keyboard shortcut
- Active tool highlighted
- Grouped tools (collapsible sections)
- Tool options on hover/click
- Customizable toolbar (future)

#### 3. Enhanced Inspector Panel (Right Side)
```
┌──────────────────────────────┐
│  Inspector                ×  │
├──────────────────────────────┤
│  Room: Kitchen Hood Area     │
│  ────────────────────────    │
│  ▼ Identity                  │
│    Name: [Kitchen Hood...]   │
│    Notes: [Optional...]      │
│  ────────────────────────    │
│  ▼ Geometry                  │
│    Width:  [240] inches      │
│    Length: [180] inches      │
│    Height: [120] inches      │
│  ────────────────────────    │
│  ▼ Occupancy                 │
│    Type: [Kitchen ▼]         │
│    ACH:  [15] /hr            │
│  ────────────────────────    │
│  ▼ Calculated (Read-only)    │
│    Area:    30.0 sq ft       │
│    Volume:  300.0 cu ft      │
│    Req CFM: 450 CFM          │
│  ────────────────────────    │
│  [Apply] [Reset]             │
└──────────────────────────────┘
```

**Features:**
- Collapsible property groups
- Visual hierarchy (bold labels)
- Read-only fields with gray background
- Unit indicators
- Validation feedback (inline)
- Apply/Reset buttons
- Tabs for multi-entity selection
- History of recent selections (future)

#### 4. Floating Mini-Toolbar (Context-Sensitive)
```
When entity selected:
┌──────────────────────────┐
│ [↶] [↷] [✂] [📋] [🗑] │ ← Appears near selection
└──────────────────────────┘
```

**Features:**
- Appears near selected entity
- Quick actions: Undo, Redo, Cut, Copy, Delete
- Fades when not in use
- Follows selection
- Customizable actions

#### 5. Enhanced Status Bar
```
┌────────────────────────────────────────────────────────┐
│ Zoom: [100% ▼] | Grid: [1" ▼] | Snap: [●] |          │
│ Cursor: (120.5, 240.0) | Selection: 3 items |         │
│ Entities: 24 | Warnings: 2 ⚠                          │
└────────────────────────────────────────────────────────┘
```

**Features:**
- Zoom level with dropdown
- Grid size with dropdown
- Snap toggle
- Cursor coordinates
- Selection count
- Total entity count
- Warning/error indicators
- Performance metrics (fps) in dev mode

#### 6. Canvas Enhancements

**Grid System:**
- Multiple grid levels (major/minor)
- Adaptive grid (changes with zoom)
- Ruler guides (horizontal/vertical)
- Origin indicator
- Measurement overlays

**Visual Feedback:**
- Hover highlights
- Selection outlines (blue)
- Snap indicators (green dots)
- Connection points (orange circles)
- Measurement tooltips
- Alignment guides (smart guides)

**Interaction Enhancements:**
- Smooth pan/zoom animations
- Elastic boundaries (subtle bounce)
- Multi-touch gestures (future)
- Keyboard navigation (arrow keys)
- Quick zoom (Ctrl+scroll)
- Fit to selection (Shift+F)

---

## 2.2 Canvas Component Breakdown

### Components to Create

#### CanvasHeader.tsx
```typescript
interface CanvasHeaderProps {
  projectName: string;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  lastSaved?: Date;
  onMenuAction: (action: MenuAction) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}
```

#### VerticalToolbar.tsx
```typescript
interface VerticalToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  tools: ToolDefinition[];
}
```

#### InspectorPanel.tsx (Enhanced)
```typescript
interface InspectorPanelProps {
  selectedEntities: Entity[];
  onPropertyChange: (entityId: string, property: string, value: any) => void;
  onApply: () => void;
  onReset: () => void;
}
```

#### FloatingToolbar.tsx
```typescript
interface FloatingToolbarProps {
  position: { x: number; y: number };
  actions: ToolbarAction[];
  onAction: (action: string) => void;
  visible: boolean;
}
```

#### StatusBar.tsx
```typescript
interface StatusBarProps {
  zoom: number;
  gridSize: number;
  snapEnabled: boolean;
  cursorPosition: { x: number; y: number };
  selectionCount: number;
  entityCount: number;
  warnings: number;
  onZoomChange: (zoom: number) => void;
  onGridSizeChange: (size: number) => void;
  onSnapToggle: () => void;
}
```

#### CanvasGrid.tsx (Enhanced)
```typescript
interface CanvasGridProps {
  gridSize: number;
  zoom: number;
  showRulers: boolean;
  showOrigin: boolean;
  majorGridColor: string;
  minorGridColor: string;
}
```

---

# 3. Shared Design System

## 3.1 Color Palette

### Primary Colors
```typescript
const colors = {
  primary: {
    main: '#1976D2',      // Blue
    light: '#42A5F5',
    dark: '#1565C0',
    contrast: '#FFFFFF',
  },
  secondary: {
    main: '#424242',      // Dark Gray
    light: '#6D6D6D',
    dark: '#1B1B1B',
    contrast: '#FFFFFF',
  },
  success: '#4CAF50',     // Green
  warning: '#FF9800',     // Orange
  error: '#F44336',       // Red
  info: '#2196F3',        // Light Blue
}
```

### Canvas Colors
```typescript
const canvasColors = {
  background: '#FAFAFA',
  grid: {
    minor: '#E5E5E5',
    major: '#BDBDBD',
  },
  selection: '#2196F3',
  hover: '#64B5F6',
  snap: '#4CAF50',
  connection: '#FF9800',
}
```

## 3.2 Typography Scale

```typescript
const typography = {
  h1: { size: 32, weight: 700 },  // Page titles
  h2: { size: 24, weight: 600 },  // Section headers
  h3: { size: 20, weight: 600 },  // Card titles
  h4: { size: 16, weight: 600 },  // Property groups
  body1: { size: 14, weight: 400 }, // Default text
  body2: { size: 12, weight: 400 }, // Secondary text
  caption: { size: 11, weight: 400 }, // Labels
  button: { size: 14, weight: 500 }, // Buttons
}
```

## 3.3 Spacing System

```typescript
const spacing = {
  xs: 4,   // Tight spacing
  sm: 8,   // Small gaps
  md: 16,  // Default spacing
  lg: 24,  // Section spacing
  xl: 32,  // Large gaps
  xxl: 48, // Page sections
}
```

## 3.4 Elevation (Shadows)

```typescript
const elevation = {
  0: 'none',
  1: '0 1px 3px rgba(0,0,0,0.12)',     // Cards
  2: '0 2px 6px rgba(0,0,0,0.16)',     // Raised cards
  3: '0 4px 12px rgba(0,0,0,0.15)',    // Modals
  4: '0 8px 24px rgba(0,0,0,0.15)',    // Dropdowns
  5: '0 16px 48px rgba(0,0,0,0.20)',   // Overlays
}
```

---

# 4. Responsive Design Strategy

## 4.1 Breakpoints

```typescript
const breakpoints = {
  xs: 0,      // Mobile portrait
  sm: 600,    // Mobile landscape
  md: 960,    // Tablet
  lg: 1280,   // Desktop
  xl: 1920,   // Large desktop
}
```

## 4.2 Dashboard Responsive Behavior

| Screen Size | Columns | Layout Changes |
|------------|---------|----------------|
| xs (< 600px) | 1 | Stack all sections, hide stats bar |
| sm (600-960px) | 2 | 2-column grid, compact stats |
| md (960-1280px) | 3 | 3-column grid, full stats |
| lg (1280-1920px) | 4 | 4-column grid, expanded view |
| xl (> 1920px) | 4-5 | Max 5 columns, extra whitespace |

## 4.3 Canvas Responsive Behavior

| Screen Size | Layout |
|------------|--------|
| xs-sm | Hide toolbar, floating tool selector |
| md | Show toolbar, collapsible inspector |
| lg+ | Full three-panel layout |

---

# 5. Accessibility Enhancements

## 5.1 Keyboard Navigation

### Dashboard
- Tab: Navigate between cards
- Enter: Open project
- Space: Select/deselect
- Arrow keys: Navigate grid
- Ctrl+N: New project
- Ctrl+F: Focus search
- Escape: Close dialogs

### Canvas
- V, R, D, E: Tool selection
- Ctrl+Z/Y: Undo/Redo
- Delete: Remove entity
- Ctrl+D: Duplicate
- Ctrl+G: Group
- Ctrl+0: Fit to content
- G: Toggle grid
- Space+Drag: Pan

## 5.2 Screen Reader Support

- ARIA labels on all interactive elements
- ARIA live regions for status updates
- Semantic HTML structure
- Focus indicators
- Skip navigation links

## 5.3 Color Contrast

- All text meets WCAG AA (4.5:1)
- Important elements meet AAA (7:1)
- Focus indicators highly visible
- Error states clearly marked

---

# 6. Animation & Transitions

## 6.1 Micro-interactions

```typescript
const transitions = {
  fast: '150ms ease-in-out',
  normal: '250ms ease-in-out',
  slow: '350ms ease-in-out',
}
```

### Dashboard Animations
- Card hover: Elevation + scale (150ms)
- Card click: Press effect (100ms)
- List updates: Fade + slide (250ms)
- Search results: Stagger fade-in (350ms)
- Empty state: Fade in (500ms)

### Canvas Animations
- Tool selection: Color transition (150ms)
- Entity selection: Outline fade-in (100ms)
- Pan/Zoom: Smooth transform (250ms)
- Grid toggle: Fade (200ms)
- Inspector: Slide in/out (300ms)

---

# 7. Performance Optimizations

## 7.1 Dashboard Performance

- Virtual scrolling for 100+ projects
- Lazy load canvas thumbnails
- Debounce search (300ms)
- Memoize filtered/sorted lists
- Skeleton loading states
- Progressive image loading

## 7.2 Canvas Performance

- Canvas 2D rendering (no DOM)
- Viewport culling (only render visible)
- Entity pooling (reuse objects)
- Throttle pan/zoom (60fps)
- Batch entity updates
- Web Workers for calculations (future)

---

# 8. Implementation Priority

## Phase 1: Dashboard Foundation (Week 1)
1. DashboardLayout with responsive grid
2. Enhanced ProjectCard component
3. SearchFilterBar with real-time search
4. HeroSection with stats
5. EmptyState variations

## Phase 2: Dashboard Polish (Week 1)
1. RecentProjectsCarousel
2. QuickStatsBar with animations
3. View mode toggle (grid/list/compact)
4. Canvas thumbnail generation
5. Accessibility improvements

## Phase 3: Canvas Foundation (Week 2)
1. Three-panel layout structure
2. Enhanced CanvasHeader with menu
3. VerticalToolbar with tool groups
4. Enhanced InspectorPanel
5. StatusBar with all indicators

## Phase 4: Canvas Polish (Week 2)
1. FloatingToolbar for quick actions
2. Enhanced grid with rulers
3. Smart guides and snapping
4. Smooth animations
5. Keyboard shortcuts

## Phase 5: Integration & Testing (Week 3)
1. Connect all components
2. E2E testing
3. Performance optimization
4. Accessibility audit
5. User testing & refinement

---
# To-dos (5)
- [ ] **Phase 1 - Dashboard Foundation**: Create responsive DashboardLayout, enhanced ProjectCard, SearchFilterBar, HeroSection, EmptyState components
- [ ] **Phase 2 - Dashboard Polish**: Build RecentProjectsCarousel, QuickStatsBar with animations, view mode toggles, canvas thumbnail generation
- [ ] **Phase 3 - Canvas Foundation**: Implement three-panel layout, enhanced CanvasHeader with menu, VerticalToolbar, enhanced InspectorPanel, comprehensive StatusBar
- [ ] **Phase 4 - Canvas Polish**: Add FloatingToolbar, enhanced grid with rulers, smart guides, smooth animations, complete keyboard shortcuts
- [ ] **Phase 5 - Integration & Testing**: Connect all components, perform E2E testing, optimize performance, conduct accessibility audit, user testing)