# LeftSidebar

## Overview

The LeftSidebar is a resizable drawer layer with two tabs:

- **Project Properties**: project metadata, scope configuration, and site conditions.
- **Product Catalog**: catalog browser for equipment and metal products (ducts, fittings, etc.) with brand/model (drag-to-canvas is future work).

## Location

```
src/features/canvas/components/LeftSidebar.tsx
```

## Purpose

- Display and edit project metadata (name, location, client)
- Configure project scope (HVAC systems, materials, project type)
- Manage site conditions for engineering calculations
- Provide collapsible sections for organized information hierarchy
- Support resizing for flexible workspace management

## Dependencies

- `@/core/store/projectStore` - Project metadata state
- `@/components/ui/CollapsibleSection` - Accordion sections
- `@/components/ui/Dropdown` - Selection dropdowns
- `@/components/ui/ValidatedInput` - Form inputs with validation

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | No | Controls sidebar visibility (default: true) |
| `onClose` | `() => void` | No | Callback when sidebar is closed |
| `defaultWidth` | `number` | No | Initial sidebar width in pixels (default: 300) |
| `minWidth` | `number` | No | Minimum resize width (default: 250) |
| `maxWidth` | `number` | No | Maximum resize width (default: 500) |

## State

```typescript
const [sidebarWidth, setSidebarWidth] = useState<number>(defaultWidth);
const [isResizing, setIsResizing] = useState<boolean>(false);
const [expandedSections, setExpandedSections] = useState<string[]>([
  'project-details',
  'project-scope',
  'site-conditions'
]);
```

## Structure

### 1. Project Details (Accordion)

Editable basic metadata for the project.

```typescript
interface ProjectDetails {
  name: string;          // Project name
  location: string;      // Site location/address
  client: string;        // Client name/company
}
```

**Fields:**
- **Name**: Text input (1-100 characters)
- **Location**: Text input (optional, 0-200 characters)
- **Client**: Text input (optional, 0-100 characters)

### 2. Project Scope (Accordion)

Defines the parameters and constraints of the design.

```typescript
interface ProjectScope {
  scope: string[];              // HVAC, future systems
  materials: MaterialSelection[];
  projectType: 'residential' | 'commercial' | 'industrial';
}

interface MaterialSelection {
  type: string;                 // 'galvanized' | 'stainless' | 'aluminum' | 'pvs'
  grade?: string;               // Sub-selection (e.g., 'G-60', '304S.S.')
}
```

**Fields:**
- **Scope** (Multi-Select):
  - HVAC (default enabled)
  - For future updates

- **Material** (Multi-Select with Sub-Dropdowns):
  - **Galvanized Steel**: G-60, G-90
  - **Stainless Steel**: 304S.S., 316S.S., 409S.S., 430S.S., 444S.S.
  - **Aluminum**: (no sub-grades)
  - **PVS**: (no sub-grades)

- **Project Type** (Dropdown):
  - Residential
  - Commercial (default)
  - Industrial

### 3. Site Conditions (Accordion)

Environmental parameters used for engineering calculations.

```typescript
interface SiteConditions {
  elevation?: number;           // Feet above sea level
  outdoorTemp?: number;         // °F (Fahrenheit)
  indoorTemp?: number;          // °F (Fahrenheit)
  windSpeed?: number;           // MPH
  humidity?: number;            // % relative humidity
  localCodes?: string;          // Code references (text)
}
```

**Fields:**
- **Elevation**: Number input (feet above sea level)
- **Outdoor Temperature**: Number input (°F)
- **Indoor Temperature**: Number input (°F, default: 70)
- **Wind Speed**: Number input (MPH)
- **Humidity**: Number input (0-100%)
- **Local Codes**: Text input (e.g., "IBC 2021, IMC 2021")

## Behavior

### Resizing

The sidebar can be resized by dragging the right edge:

```typescript
const handleResizeStart = (e: React.MouseEvent) => {
  setIsResizing(true);
  // Attach mousemove and mouseup listeners
};

const handleResizeMove = (e: MouseEvent) => {
  if (!isResizing) return;

  const newWidth = e.clientX;

  // Clamp width between min and max
  if (newWidth >= minWidth && newWidth <= maxWidth) {
    setSidebarWidth(newWidth);
  }
};
```

### Data Binding

Changes propagate to the `projectStore` and may trigger recalculations:

```typescript
const { updateProject } = useProjectActions();

const handleProjectDetailChange = (field: keyof ProjectDetails, value: string) => {
  updateProject({ [field]: value });
};

const handleSiteConditionChange = (field: keyof SiteConditions, value: number) => {
  updateProject({
    siteConditions: {
      ...projectStore.siteConditions,
      [field]: value
    }
  });

  // Trigger recalculation if elevation changes (affects air density)
  if (field === 'elevation') {
    recalculateAll();
  }
};
```

### Accordion Behavior

```typescript
const toggleSection = (sectionId: string) => {
  setExpandedSections(prev =>
    prev.includes(sectionId)
      ? prev.filter(id => id !== sectionId)
      : [...prev, sectionId]
  );
};
```

## Component Structure

```tsx
<div className="left-sidebar" style={{ width: sidebarWidth }}>
  {/* Resize Handle */}
  <div
    className="resize-handle"
    onMouseDown={handleResizeStart}
  />

  {/* Content */}
  <div className="sidebar-content">
    {/* Project Details */}
    <CollapsibleSection
      title="Project Details"
      isExpanded={expandedSections.includes('project-details')}
      onToggle={() => toggleSection('project-details')}
    >
      <ValidatedInput
        label="Name"
        value={project.name}
        onChange={(val) => handleProjectDetailChange('name', val)}
        required
      />
      <ValidatedInput
        label="Location"
        value={project.location}
        onChange={(val) => handleProjectDetailChange('location', val)}
      />
      <ValidatedInput
        label="Client"
        value={project.client}
        onChange={(val) => handleProjectDetailChange('client', val)}
      />
    </CollapsibleSection>

    {/* Project Scope */}
    <CollapsibleSection
      title="Project Scope"
      isExpanded={expandedSections.includes('project-scope')}
      onToggle={() => toggleSection('project-scope')}
    >
      {/* Scope multi-select */}
      {/* Material selection */}
      {/* Project type dropdown */}
    </CollapsibleSection>

    {/* Site Conditions */}
    <CollapsibleSection
      title="Site Conditions"
      isExpanded={expandedSections.includes('site-conditions')}
      onToggle={() => toggleSection('site-conditions')}
    >
      {/* Environmental inputs */}
    </CollapsibleSection>
  </div>
</div>
```

## Styling

```css
.left-sidebar {
  position: relative;
  background: #fafafa;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  transition: width 0.2s ease;
}

.resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
}

.resize-handle:hover {
  background: #1976d2;
}

.sidebar-content {
  padding: 16px;
}
```

## Usage Examples

### Basic Usage

```tsx
import { LeftSidebar } from '@/features/canvas/components/LeftSidebar';

function CanvasPage() {
  return (
    <div className="canvas-layout">
      <LeftSidebar />
      <CanvasContainer />
      <RightSidebar />
    </div>
  );
}
```

### With Controlled Width

```tsx
const [leftSidebarWidth, setLeftSidebarWidth] = useState(300);

<LeftSidebar
  defaultWidth={leftSidebarWidth}
  minWidth={250}
  maxWidth={500}
  onResize={(newWidth) => setLeftSidebarWidth(newWidth)}
/>
```

### With Visibility Toggle

```tsx
const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);

<LeftSidebar
  isOpen={isLeftSidebarOpen}
  onClose={() => setIsLeftSidebarOpen(false)}
/>
```

## Calculations Affected

Changes to site conditions trigger recalculations:

### Elevation
Affects air density calculations for fan sizing:
```typescript
// Air density decreases with elevation
airDensity = standardDensity * Math.exp(-elevation / 27000);
```

### Temperature
Affects psychrometric calculations and heating/cooling loads.

### Wind Speed
Used for infiltration calculations.

## Related Elements

- [RightSidebar](./RightSidebar.md) - Engineering calculations sidebar
- [BottomToolbar](./BottomToolbar.md) - Global actions toolbar
- [CanvasPage](./CanvasPage.md) - Parent page component
- [projectStore](../../02-stores/projectStore.md) - Project metadata state
- [CollapsibleSection](../ui/CollapsibleSection.md) - Accordion component
- [ValidatedInput](../ui/ValidatedInput.md) - Form input component

## Testing

```typescript
describe('LeftSidebar', () => {
  it('renders all three sections', () => {
    render(<LeftSidebar />);

    expect(screen.getByText('Project Details')).toBeInTheDocument();
    expect(screen.getByText('Project Scope')).toBeInTheDocument();
    expect(screen.getByText('Site Conditions')).toBeInTheDocument();
  });

  it('updates project name on input change', () => {
    const { updateProject } = useProjectStore.getState();
    render(<LeftSidebar />);

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'New Project Name' } });

    expect(updateProject).toHaveBeenCalledWith({ name: 'New Project Name' });
  });

  it('allows resizing within min/max bounds', () => {
    render(<LeftSidebar minWidth={250} maxWidth={500} defaultWidth={300} />);

    const resizeHandle = screen.getByClassName('resize-handle');

    // Simulate drag to 400px
    fireEvent.mouseDown(resizeHandle);
    fireEvent.mouseMove(window, { clientX: 400 });
    fireEvent.mouseUp(window);

    expect(screen.getByClassName('left-sidebar')).toHaveStyle({ width: '400px' });
  });

  it('triggers recalculation on elevation change', () => {
    const recalculateAll = vi.fn();
    render(<LeftSidebar />);

    const elevationInput = screen.getByLabelText('Elevation');
    fireEvent.change(elevationInput, { target: { value: '5000' } });

    expect(recalculateAll).toHaveBeenCalled();
  });

  it('toggles section expansion', () => {
    render(<LeftSidebar />);

    const detailsHeader = screen.getByText('Project Details');
    const detailsContent = screen.getByLabelText('Name');

    expect(detailsContent).toBeVisible();

    fireEvent.click(detailsHeader);

    expect(detailsContent).not.toBeVisible();
  });
});
```
