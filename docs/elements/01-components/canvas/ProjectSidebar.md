# ProjectSidebar

## Overview
Left sidebar displaying read-only project metadata in collapsible accordion sections (Project Details, Scope, Site Conditions).

## Location
```
hvac-design-app/src/features/canvas/components/ProjectSidebar.tsx
```

## Purpose
- Displays project metadata while working on canvas
- Provides quick reference to project details, scope, and site conditions
- Uses accordion to manage space and visibility
- Shows "No Project Loaded" fallback when project is missing

## Dependencies
- **UI Components**: `Accordion`, `AccordionContent`, `AccordionItem`, `AccordionTrigger` (shadcn/ui)
- **Store**: `useProjectStore`
- **Utilities**: `cn` (class names)

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| className | `string` | No | - | Additional CSS classes for container |

## Visual Layout

```
┌────────────────────────┐
│ Office Building HVAC   │
│ 2025-001               │
├────────────────────────┤
│ ▼ Project Details      │
│   Client:      Acme    │
│   Location:    NYC     │
│                        │
│ ▶ Project Scope        │
│                        │
│ ▶ Site Conditions      │
└────────────────────────┘
```

### Expanded Sections
```
┌────────────────────────┐
│ Office Building HVAC   │
│ 2025-001               │
├────────────────────────┤
│ ▼ Project Details      │
│   Client:      Acme    │
│   Location:    NYC     │
│                        │
│ ▼ Project Scope        │
│   Scope                │
│   • HVAC               │
│   Materials            │
│   • Galvanized (G-90)  │
│   • Stainless (304)    │
│   Type                 │
│   Commercial           │
│                        │
│ ▼ Site Conditions      │
│   Elevation:   1200'   │
│   Outdoor:     -10°F   │
│   Indoor:      70°F    │
│   Wind:        15 mph  │
│   Humidity:    50%     │
│   Local Codes: IMC'21  │
└────────────────────────┘
```

## Component Implementation

### No Project State
```typescript
if (!projectDetails) {
  return <div>No Project Loaded</div>;
}
```

### Accordion Structure
```typescript
<Accordion type="single" collapsible defaultValue="project-details">
  <AccordionItem value="project-details">
    {/* Project Details */}
  </AccordionItem>
  <AccordionItem value="project-scope">
    {/* Project Scope */}
  </AccordionItem>
  <AccordionItem value="site-conditions">
    {/* Site Conditions */}
  </AccordionItem>
</Accordion>
```

## Behavior

### Header Section
- **Project Name**: Truncated with full text in `title` attribute
- **Project Number**: Shows "No Number" if not set

### Section 1: Project Details (Default Open)
Displays:
- **Client**: `clientName || '-'`
- **Location**: `location || '-'`

### Section 2: Project Scope
Displays:
- **Scope Details**: List of scope items (e.g., "HVAC")
- **Materials**: List of materials with grades (e.g., "Galvanized Steel (G-90)")
- **Project Type**: Residential/Commercial/Industrial

If no scope data: Shows "No scope defined" in italics

### Section 3: Site Conditions
Displays in grid format:
- **Elevation**
- **Outdoor Temperature**
- **Indoor Temperature**
- **Wind Speed**
- **Humidity**
- **Local Codes** (truncated with title tooltip)

If no conditions: Shows "No conditions" in italics

### Empty Value Handling
All fields show `-` when value is missing or empty.

## State Management

### Store Integration
```typescript
const { projectDetails } = useProjectStore();
```

### Data Extraction
```typescript
const {
  projectName,
  projectNumber,
  clientName,
  location,
  scope,
  siteConditions
} = projectDetails;
```

## Styling

### Container
- **Width**: `w-64` (256px)
- **Background**: `bg-background`
- **Border**: `border-r` (right border)
- **Layout**: `flex flex-col overflow-hidden`

### Header
- **Padding**: `p-4`
- **Border**: `border-b`
- **Title**: `font-semibold truncate`
- **Subtitle**: `text-sm text-muted-foreground truncate`

### Accordion Content
- **Padding**: `px-4 pb-4`
- **Spacing**: `space-y-2`
- **Text**: `text-sm`

### Grid Layout (Details & Conditions)
- **Grid**: `grid-cols-2 gap-1`
- **Label**: `text-muted-foreground`
- **Value**: Default text color

### Lists (Scope Materials)
- **Type**: `list-disc list-inside`
- **Indent**: `pl-1`
- **Color**: `text-muted-foreground`

### Empty States
- **Style**: `text-muted-foreground italic`

## Usage Examples

### Basic Usage
```tsx
<ProjectSidebar />
```

### With Custom Class
```tsx
<ProjectSidebar className="shadow-lg" />
```

### Integration with Canvas Layout
```tsx
<div className="flex h-screen">
  <ProjectSidebar />
  <Canvas className="flex-1" />
  <RightSidebar />
</div>
```

## Accessibility

### Semantic HTML
- Accordion provides keyboard navigation
- Truncated text includes `title` tooltips
- Empty states clearly labeled

### Keyboard Navigation
- **Tab**: Navigate between accordion triggers
- **Space/Enter**: Toggle accordion sections
- **Arrow Keys**: Navigate accordion items

### Screen Reader Support
- Section titles announced clearly
- Grid structure communicated via label/value pairs
- Empty states announced as "No scope defined"

## Related Elements

### Components
- [AppShell](../layout/AppShell.md) - May contain ProjectSidebar
- [EditProjectDialog](../../dashboard/EditProjectDialog.md) - Edits project metadata
- [CanvasPropertiesInspector](../inspector/CanvasPropertiesInspector.md) - Shows subset of project info

### Stores
- [project.store](../../02-stores/project.store.md) - `projectDetails`

### UI Primitives
- [Accordion](../../ui/accordion.md) - Collapsible sections

## Testing

### Test Coverage
```typescript
describe('ProjectSidebar', () => {
  it('displays "No Project Loaded" when projectDetails is null');
  it('renders project name and number in header');
  it('displays project details section');
  it('shows client and location');
  it('renders scope details with materials');
  it('displays site conditions in grid');
  it('shows "-" for missing values');
  it('shows empty state messages for missing sections');
  it('truncates long project names with title tooltip');
  it('defaults "project-details" section to open');
});
```

### Key Test Scenarios
1. **No Project**: Fallback message displayed
2. **Complete Project**: All sections populated correctly
3. **Partial Data**: Missing values show `-` or empty state
4. **Material Grades**: Grades shown in parentheses when present
5. **Truncation**: Long values truncated with tooltips
