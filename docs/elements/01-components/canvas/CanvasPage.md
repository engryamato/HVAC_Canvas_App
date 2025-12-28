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
│ LEFT SIDEBAR       │                                     │ RIGHT SIDEBAR│
│ [Project Details]  │                                     │ [Bill of Qty]│
│ Name: Building A   │                                     │  - Ducts     │
│ Client: ACME Corp  │                                     │  - Fittings  │
│                    │                                     │              │
│ [Scope]            │              CANVAS                 │ [Calculation]│
│ ☑ HVAC             │             CONTAINER               │  - Air Sys   │
│ ☑ Metric           │                                     │  - Velocity  │
│                    │                                     │              │
│ [Site Conditions]  │          (Infinite Pan/Zoom)        │              │
│ Temp: 72°F         │                                     │              │
│ Wind: 5mph         │                                     │              │
│                    │                                     │              │
├────────────────────┴─────────────────────────────────────┴──────────────┤
│ BOTTOM TOOLBAR                                                          │
│ [Upload] [Export] [Process] [Save] ... [Settings] [Notification]        │
└─────────────────────────────────────────────────────────────────────────┘
   (Floating Action Button 'D' appears on canvas for tools)
```

## Component Implementation

```tsx
interface CanvasPageProps {
  projectId: string;
}

export function CanvasPage({ projectId }: CanvasPageProps) {
  const { setProject, setDirty } = useProjectActions();
  const { hydrate } = useEntityActions();
  const { success, error } = useToast();

  // Load project on mount
  useEffect(() => {
    const loadProject = async () => {
      try {
        const project = await loadProjectFile(projectId);

        setProject(projectId, {
          name: project.name,
          projectNumber: project.projectNumber,
          clientName: project.clientName,
          createdAt: project.createdAt,
          modifiedAt: project.modifiedAt,
        });

        hydrate(project.entities);
      } catch (err) {
        error('Failed to load project');
        console.error(err);
      }
    };

    loadProject();

    return () => {
      // Cleanup on unmount
      clearProject();
    };
  }, [projectId]);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Initialize auto-save
  useAutoSave();

  return (
    <div className="canvas-page">
      <div className="canvas-main">
        <LeftSidebar />

        <div className="canvas-center">
          <CanvasErrorBoundary>
            <CanvasContainer />
            <FABTool />
          </CanvasErrorBoundary>
        </div>

        <RightSidebar />
      </div>

      <BottomToolbar />
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

```css
.canvas-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  height: 48px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-link {
  color: #666;
  text-decoration: none;
}

.project-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.unsaved-indicator {
  color: #1976D2;
  margin-left: 4px;
}

.canvas-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.canvas-center {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.canvas-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 16px;
  background: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  height: 32px;
}
```

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
