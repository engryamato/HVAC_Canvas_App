# GridSettings

## Overview

The GridSettings component provides UI controls for configuring the canvas grid, including visibility toggle, snap-to-grid toggle, and grid size selection. It's typically displayed in the Toolbar's project properties accordion.

## Location

```
src/features/canvas/components/GridSettings.tsx
```

## Platform Availability
- **Universal**: Available in both Tauri (Offline) and Hybrid (Web) modes.

## Purpose

- Toggle grid visibility on/off
- Toggle snap-to-grid functionality
- Select grid size (spacing between grid lines)
- Provide visual feedback for current settings

## Dependencies

- `@/features/canvas/store/viewportStore` - Grid state and actions

## Layout

```
┌─────────────────────────────────┐
│  Grid Settings                  │
├─────────────────────────────────┤
│  [✓] Show Grid                  │
│  [✓] Snap to Grid               │
│                                 │
│  Grid Size:                     │
│  ┌─────────────────────────┐    │
│  │ 1/4" (12px)           ▼ │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `className` | `string` | No | Additional CSS classes |

## Grid Size Options

| Label | Pixel Value | Real-world Scale |
|-------|-------------|------------------|
| 1/8" | 6px | Fine detail |
| 1/4" | 12px | Default |
| 1/2" | 24px | Medium |
| 1" | 48px | Large |

## Component Implementation

```tsx
const GRID_SIZE_OPTIONS = [
  { value: 6, label: '1/8" (6px)' },
  { value: 12, label: '1/4" (12px)' },
  { value: 24, label: '1/2" (24px)' },
  { value: 48, label: '1" (48px)' },
];

export function GridSettings({ className }: { className?: string }) {
  const gridVisible = useGridVisible();
  const snapToGrid = useSnapToGrid();
  const gridSize = useGridSize();
  const { toggleGrid, toggleSnap, setGridSize } = useViewportActions();

  return (
    <div className={cn('grid-settings', className)}>
      <h4 className="settings-title">Grid Settings</h4>

      {/* Show Grid Toggle */}
      <label className="setting-row">
        <input
          type="checkbox"
          checked={gridVisible}
          onChange={toggleGrid}
          className="setting-checkbox"
        />
        <span className="setting-label">Show Grid</span>
        <span className="setting-shortcut">G</span>
      </label>

      {/* Snap to Grid Toggle */}
      <label className="setting-row">
        <input
          type="checkbox"
          checked={snapToGrid}
          onChange={toggleSnap}
          className="setting-checkbox"
        />
        <span className="setting-label">Snap to Grid</span>
        <span className="setting-shortcut">S</span>
      </label>

      {/* Grid Size Selector */}
      <div className="setting-row">
        <span className="setting-label">Grid Size:</span>
        <select
          value={gridSize}
          onChange={(e) => setGridSize(Number(e.target.value))}
          className="setting-select"
          disabled={!gridVisible}
        >
          {GRID_SIZE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

## Styling

```css
.grid-settings {
  padding: 12px;
}

.settings-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  cursor: pointer;
}

.setting-row:hover {
  background: #f5f5f5;
  margin: 0 -12px;
  padding: 6px 12px;
}

.setting-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.setting-label {
  flex: 1;
  font-size: 13px;
  color: #333;
}

.setting-shortcut {
  font-size: 11px;
  color: #999;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.setting-select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  background: white;
  cursor: pointer;
}

.setting-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.setting-select:focus {
  outline: none;
  border-color: #1976D2;
}
```

## Grid Rendering

When grid is visible, the canvas renders grid lines:

```typescript
function renderGrid(ctx: CanvasRenderingContext2D, gridSize: number) {
  const { width, height } = ctx.canvas;
  const { panX, panY, zoom } = viewportState;

  // Calculate visible area
  const startX = Math.floor(-panX / zoom / gridSize) * gridSize;
  const startY = Math.floor(-panY / zoom / gridSize) * gridSize;
  const endX = Math.ceil((width - panX) / zoom / gridSize) * gridSize;
  const endY = Math.ceil((height - panY) / zoom / gridSize) * gridSize;

  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1 / zoom;

  // Draw vertical lines
  for (let x = startX; x <= endX; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
  }

  // Draw horizontal lines
  for (let y = startY; y <= endY; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }
}
```

## Snap to Grid Logic

When snap is enabled, positions are rounded to nearest grid point:

```typescript
function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

function snapPointToGrid(point: Point, gridSize: number): Point {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize),
  };
}
```

## Usage

```tsx
// In Toolbar's project properties accordion
import { GridSettings } from '@/features/canvas/components/GridSettings';

function ProjectPropertiesAccordion() {
  return (
    <CollapsibleSection title="Canvas Settings">
      <GridSettings />
    </CollapsibleSection>
  );
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `G` | Toggle grid visibility |
| `S` | Toggle snap to grid |

## Related User Journeys
- [Zoom Canvas (Tauri)](../../../user-journeys/02-canvas-navigation/tauri-offline/UJ-CN-002-ZoomCanvas.md) - Grid visibility and snapping affect view management mechanisms.

## Related Elements

- [ViewportStore](../../02-stores/viewportStore.md) - Grid state
- [CanvasContainer](./CanvasContainer.md) - Renders grid
- [Toolbar](./Toolbar.md) - Contains GridSettings
- [StatusBar](./StatusBar.md) - Shows grid/snap status

## Testing

```typescript
describe('GridSettings', () => {
  beforeEach(() => {
    useViewportStore.setState({
      gridVisible: true,
      snapToGrid: true,
      gridSize: 12,
    });
  });

  it('displays current grid settings', () => {
    render(<GridSettings />);

    const showGridCheckbox = screen.getByLabelText('Show Grid');
    const snapCheckbox = screen.getByLabelText('Snap to Grid');

    expect(showGridCheckbox).toBeChecked();
    expect(snapCheckbox).toBeChecked();
  });

  it('toggles grid visibility', () => {
    render(<GridSettings />);

    fireEvent.click(screen.getByLabelText('Show Grid'));

    expect(useViewportStore.getState().gridVisible).toBe(false);
  });

  it('toggles snap to grid', () => {
    render(<GridSettings />);

    fireEvent.click(screen.getByLabelText('Snap to Grid'));

    expect(useViewportStore.getState().snapToGrid).toBe(false);
  });

  it('changes grid size', () => {
    render(<GridSettings />);

    fireEvent.change(screen.getByDisplayValue('1/4" (12px)'), {
      target: { value: '24' },
    });

    expect(useViewportStore.getState().gridSize).toBe(24);
  });

  it('disables grid size when grid is hidden', () => {
    useViewportStore.setState({ gridVisible: false });

    render(<GridSettings />);

    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('shows keyboard shortcuts', () => {
    render(<GridSettings />);

    expect(screen.getByText('G')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
  });
});
```
