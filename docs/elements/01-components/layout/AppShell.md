# AppShell

## Overview
Primary application layout component that orchestrates the complete canvas workspace structure, including header, toolbars, sidebars, and status bar.

## Location
```
src/components/layout/AppShell.tsx
```

## Purpose
- Provides the main layout structure for the canvas/project view
- Coordinates header, toolbar, sidebars, and status bar positioning
- Renders canvas content area with grid pattern background
- Manages full-screen flex layout with overflow handling
- Integrates type selectors (Equipment, Fitting) conditionally

## Dependencies
- **Layout Components**: `Header`, `Toolbar`, `LeftSidebar`, `RightSidebar`, `StatusBar`
- **Canvas Components**: `EquipmentTypeSelector`, `FittingTypeSelector`
- **Stores**: `useCurrentTool` (from canvas.store)

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | `ReactNode` | Yes | - | Main canvas content to render |
| projectName | `string` | Yes | - | Project name displayed in header breadcrumb |

## Visual Layout

```
┌────────────────────────────────────────┐
│ Header (Menu Bar + Project Name)      │ ← Header
├────────────────────────────────────────┤
│ Toolbar (Tools: Select, Room, Duct...)│ ← Toolbar
├──┬────────────────────────────────┬───┤
│  │                                │   │
│ L│        Canvas Area             │ R │
│ e│        (children)              │ i │ ← Main Content
│ f│                                │ g │
│ t│                                │ h │
│  │                                │ t │
├──┴────────────────────────────────┴───┤
│ Status Bar (Coords, Zoom, etc.)    │ ← StatusBar
└────────────────────────────────────────┘
```

## Component Implementation

```typescript
interface AppShellProps {
  children: ReactNode;
  projectName: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children, projectName }) => {
  const currentTool = useCurrentTool();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50">
      <Header projectName={projectName} />
      <Toolbar />
      
      <div className="flex-1 flex overflow-hidden relative">
        <LeftSidebar />
        
        <main className="flex-1 relative overflow-hidden bg-slate-100 grid-pattern">
          {children}
        </main>
        
        <RightSidebar />
      </div>
      
      <StatusBar />
    </div>
  );
};
```

## Behavior

### Layout Structure
- **Fixed Height**: Full viewport height (`h-screen w-screen`)
- **Flex Column**: Vertical stacking of header, toolbar, content, status bar
- **Overflow Control**: `overflow-hidden` on root and content area
- **Content Area**: Flex-grow to fill available space

### Canvas Area
- **Background**: Light slate with grid pattern (`bg-slate-100 grid-pattern`)
- **Overflow**: Hidden to prevent scrollbars (canvas handles its own viewport)
- **Positioning**: Relative for absolute-positioned canvas elements

### Responsive Behavior
- Layout is fixed (no responsive breakpoints)
- Sidebars have their own collapse/expand logic
- Full-screen only (no mobile optimization)

## Styling

### Root Container
```
flex flex-col h-screen w-screen overflow-hidden bg-slate-50
```

### Main Content Area
```
flex-1 flex overflow-hidden relative
```

### Canvas Container
```
flex-1 relative overflow-hidden bg-slate-100 grid-pattern
```

## Usage Examples

### Basic Usage (Canvas Page)
```typescript
import { AppShell } from '@/components/layout/AppShell';
import { CanvasRenderer } from '@/features/canvas/CanvasRenderer';

export default function CanvasPage({ params }: { params: { projectId: string } }) {
  const project = useProject(params.projectId);
  
  return (
    <AppShell projectName={project.name}>
      <CanvasRenderer projectId={params.projectId} />
    </AppShell>
  );
}
```

### With Children
```typescript
<AppShell projectName="Office Building - Floor 2">
  <div className="p-4">
    <h1>Custom Canvas Content</h1>
  </div>
</AppShell>
```

## Accessibility

### Semantic HTML
- Uses `<main>` for canvas content area
- Uses `<header>` and `<footer>` (via Header and StatusBar)
- Uses `<aside>` for sidebars

### Keyboard Navigation
- No direct keyboard interactions (delegated to child components)
- Maintains focus order: Header → Toolbar → Left Sidebar → Canvas → Right Sidebar → Status Bar

## Related Elements
- **Components**: [`Header`](./Header.md), [`Toolbar`](./Toolbar.md), [`LeftSidebar`](./LeftSidebar.md), [`RightSidebar`](./RightSidebar.md), [`StatusBar`](./StatusBar.md)
- **Canvas Components**: `EquipmentTypeSelector`, `FittingTypeSelector`
- **Stores**: `canvas.store` (current tool)
- **Routes**: `/canvas/[projectId]`

## Testing
**Test ID**: `data-testid` (none - composed of child testids)

**E2E Coverage**:
- Layout structure verification
- Sidebar collapse/expand
- Header navigation
- Toolbar interactions
