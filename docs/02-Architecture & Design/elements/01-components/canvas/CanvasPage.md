# CanvasPage

## Overview

The CanvasPage is the main page component for the HVAC design canvas editor. It provides the complete layout including toolbar, canvas, inspector panel, status bar, and zoom controls. It also manages keyboard shortcuts and auto-save functionality.

## Location

```
src/features/canvas/CanvasPage.tsx
```

## Purpose

- Provide the main canvas editor layout
- Coordinate all canvas sub-components
- Handle global keyboard shortcuts
- Manage auto-save functionality
- Initialize project state on load

## Dependencies

- `@/features/canvas/components/CanvasContainer` - Main canvas
- `@/features/canvas/components/LeftSidebar` - Project context (Details, Scope, Site)
- `@/features/canvas/components/RightSidebar` - Engineering (BOM, Calculations)
- `@/features/canvas/components/BottomToolbar` - Actions & Settings
- `@/features/canvas/components/FABTool` - Quick create menu
- `@/features/canvas/hooks/useKeyboardShortcuts` - Keyboard handling
- `@/features/canvas/hooks/useAutoSave` - Auto-save logic
- `@/core/store/project.store` - Project state

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `projectId` | `string` | Yes | ID of the project to load |

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER (AppShell)                                                      │
│  [Logo] [Breadcrumbs]                    [Export] [Save] [User]         │
├─────────────────────────────────────────────────────────────────────────┤
│  TOOLBAR                                                                │
│  [Select] [Duct] ...                                     [Undo] [Redo]  │
├────────────────────┬─────────────────────────────────────┬──────────────┤
│ LEFT SIDEBAR       │                                     │ RIGHT SIDEBAR│
│ [Library]          │              CANVAS                 │ [Properties] │
│ - AHU              │             CONTAINER               │  Width: 200  │
│ - VAV              │                                     │  Flow: 500   │
│                    │          (Infinite Pan/Zoom)        │              │
├────────────────────┴─────────────────────────────────────┴──────────────┤
│ STATUS BAR                                                              │
│ 100% | (0,0) | Grid: On | 5 Entities                                    │
└─────────────────────────────────────────────────────────────────────────┘
   (Floating Zoom Controls bottom-right)
```

## Component Implementation

```tsx
export default function CanvasPage() {
  // Main layout is handled by CSS Grid/Flex in global AppShell styles
  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header />
      <Toolbar />
      
      <div className="flex-1 flex overflow-hidden relative">
        <LeftSidebar />
        
        <main className="flex-1 relative bg-slate-50/50">
           <CanvasContainer />
           <ZoomControls className="absolute bottom-4 right-4" />
        </main>

        <RightSidebar />
      </div>

      <StatusBar />
    </div>
  );
}
```

## CanvasHeader Component

```tsx
function CanvasHeader() {
  const projectDetails = useProjectDetails();
  const isDirty = useIsDirty();
  const { success, error } = useToast();

  const handleSave = async () => {
    try {
      await saveCurrentProject();
      success('Project saved');
    } catch (err) {
      error('Failed to save project');
    }
  };

  return (
    <header className="canvas-header">
      <div className="header-left">
        <Link href="/dashboard" className="back-link">
          ← Dashboard
        </Link>
        <h1 className="project-name">
          {projectDetails?.name}
          {isDirty && <span className="unsaved-indicator">•</span>}
        </h1>
      </div>

      <div className="header-right">
        <ExportMenu />
        <button onClick={handleSave} className="save-button">
          Save
        </button>
      </div>
    </header>
  );
}
```

## Styling

The page uses standard Tailwind utility classes:
- **Layout**: `flex flex-col h-screen` for the full page shell.
- **Main Area**: `flex-1 flex overflow-hidden` to fill remaining space.
- **Canvas Area**: `relative` positioning to support floating UI elements (ZoomControls).


## Keyboard Shortcuts

The page initializes global keyboard shortcuts via `useKeyboardShortcuts`:

| Shortcut | Action |
|----------|--------|
| `V` | Select tool |
| `R` | Room tool |
| `D` | Duct tool |
| `E` | Equipment tool |
| `F` | Fitting tool |
| `N` | Note tool |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+S` | Save project |
| `Delete` / `Backspace` | Delete selected |
| `Ctrl+A` | Select all |
| `Escape` | Deselect / Cancel |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `0` | Reset zoom to 100% |

## Auto-Save Behavior

The `useAutoSave` hook automatically saves the project:

- Every 2 minutes (configurable)
- When the window loses focus
- Before the page unloads

## Usage

```tsx
// In app/(main)/canvas/[projectId]/page.tsx
import { CanvasPage } from '@/features/canvas/CanvasPage';

export default function CanvasEditorPage({
  params,
}: {
  params: { projectId: string };
}) {
  return <CanvasPage projectId={params.projectId} />;
}
```

## Error Handling

The canvas is wrapped in `CanvasErrorBoundary` to catch rendering errors:

```tsx
<CanvasErrorBoundary>
  <CanvasContainer />
</CanvasErrorBoundary>
```

If an error occurs, users see a friendly message with recovery options.

## Related Elements

- [CanvasContainer](./CanvasContainer.md) - Main canvas rendering
- [Toolbar](./Toolbar.md) - Tool selection
- [InspectorPanel](../inspector/InspectorPanel.md) - Property editor
- [StatusBar](./StatusBar.md) - Status display
- [ZoomControls](./ZoomControls.md) - Zoom buttons
- [useKeyboardShortcuts](../../07-hooks/useKeyboardShortcuts.md) - Keyboard handling
- [useAutoSave](../../07-hooks/useAutoSave.md) - Auto-save
- [CanvasEditorPage](../../12-pages/CanvasEditorPage.md) - Page route

## Testing

```typescript
describe('CanvasPage', () => {
  beforeEach(() => {
    vi.mocked(loadProjectFile).mockResolvedValue(mockProject);
  });

  it('loads project on mount', async () => {
    render(<CanvasPage projectId="test-123" />);

    await waitFor(() => {
      expect(loadProjectFile).toHaveBeenCalledWith('test-123');
    });
  });

  it('displays project name in header', async () => {
    render(<CanvasPage projectId="test-123" />);

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  it('shows unsaved indicator when dirty', async () => {
    useProjectStore.setState({ isDirty: true });

    render(<CanvasPage projectId="test-123" />);

    await waitFor(() => {
      expect(screen.getByText('•')).toBeInTheDocument();
    });
  });

  it('renders all main components', () => {
    render(<CanvasPage projectId="test-123" />);

    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-container')).toBeInTheDocument();
    expect(screen.getByTestId('inspector-panel')).toBeInTheDocument();
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
    expect(screen.getByTestId('zoom-controls')).toBeInTheDocument();
  });

  it('saves project when save button clicked', async () => {
    render(<CanvasPage projectId="test-123" />);

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(saveProject).toHaveBeenCalled();
    });
  });
});
```
