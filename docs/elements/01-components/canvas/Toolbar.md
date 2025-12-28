# Toolbar

## Overview

The Toolbar component provides tool selection buttons and action buttons for the canvas editor. It includes tools for creating and selecting entities, undo/redo buttons, and project properties in an accordion format.

## Location

```
src/features/canvas/components/Toolbar.tsx
```

## Purpose

- Provide tool selection buttons (Select, Room, Duct, Equipment, Fitting, Note)
- Display active tool state
- Show undo/redo buttons with disabled states
- Contain project properties accordion
- Display keyboard shortcut hints in tooltips

## Dependencies

- `@/core/store/canvas.store` - Active tool state
- `@/core/commands/historyStore` - Undo/redo state
- `@/components/ui/IconButton` - Tool buttons
- `@/components/ui/CollapsibleSection` - Project properties accordion

## Layout

```
┌────────────────────┐
│  PROJECT PROPS     │  ← Collapsible accordion
│  ▶ Project Info    │
│  ▶ Canvas Settings │
├────────────────────┤
│                    │
│  TOOLS             │
│  ┌────┐            │
│  │ ➤  │ Select (V) │  ← Active tool highlighted
│  └────┘            │
│  ┌────┐            │
│  │ ▢  │ Room (R)   │
│  └────┘            │
│  ┌────┐            │
│  │ ═  │ Duct (D)   │
│  └────┘            │
│  ┌────┐            │
│  │ ◉  │ Equip (E)  │
│  └────┘            │
│  ┌────┐            │
│  │ ⊕  │ Fitting(F) │
│  └────┘            │
│  ┌────┐            │
│  │ 📝 │ Note (N)   │
│  └────┘            │
│                    │
├────────────────────┤
│  ACTIONS           │
│  ┌────┐ ┌────┐     │
│  │ ↶  │ │ ↷  │     │  ← Undo / Redo
│  └────┘ └────┘     │
│                    │
└────────────────────┘
```

## Tool Definitions

```typescript
const TOOLS = [
  {
    id: 'select',
    name: 'Select',
    icon: <SelectIcon />,
    shortcut: 'V',
    description: 'Select and move entities',
  },
  {
    id: 'room',
    name: 'Room',
    icon: <RoomIcon />,
    shortcut: 'R',
    description: 'Draw rooms (click two corners)',
  },
  {
    id: 'duct',
    name: 'Duct',
    icon: <DuctIcon />,
    shortcut: 'D',
    description: 'Draw ducts (click and drag)',
  },
  {
    id: 'equipment',
    name: 'Equipment',
    icon: <EquipmentIcon />,
    shortcut: 'E',
    description: 'Place equipment (click to place)',
  },
  {
    id: 'fitting',
    name: 'Fitting',
    icon: <FittingIcon />,
    shortcut: 'F',
    description: 'Place fittings (click to place)',
  },
  {
    id: 'note',
    name: 'Note',
    icon: <NoteIcon />,
    shortcut: 'N',
    description: 'Add text notes (click to place)',
  },
] as const;
```

## Component Implementation

```tsx
export function Toolbar() {
  const activeTool = useActiveTool();
  const { setTool } = useToolActions();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const { undo, redo } = useHistoryActions();

  return (
    <aside className="toolbar" data-testid="toolbar">
      {/* Project Properties Accordion */}
      <div className="toolbar-section">
        <ProjectPropertiesAccordion />
      </div>

      <div className="toolbar-divider" />

      {/* Tool Buttons */}
      <div className="toolbar-section">
        <div className="section-label">Tools</div>
        <div className="tool-buttons">
          {TOOLS.map((tool) => (
            <IconButton
              key={tool.id}
              icon={tool.icon}
              onClick={() => setTool(tool.id)}
              active={activeTool === tool.id}
              tooltip={`${tool.name} (${tool.shortcut})`}
              tooltipPosition="right"
              ariaLabel={tool.description}
            />
          ))}
        </div>
      </div>

      <div className="toolbar-divider" />

      {/* Equipment/Fitting Type Selector */}
      {(activeTool === 'equipment' || activeTool === 'fitting') && (
        <div className="toolbar-section">
          <TypeSelector tool={activeTool} />
        </div>
      )}

      <div className="toolbar-spacer" />

      {/* Undo/Redo */}
      <div className="toolbar-section">
        <div className="section-label">History</div>
        <div className="action-buttons">
          <IconButton
            icon={<UndoIcon />}
            onClick={undo}
            disabled={!canUndo}
            tooltip="Undo (Ctrl+Z)"
            tooltipPosition="right"
            ariaLabel="Undo last action"
          />
          <IconButton
            icon={<RedoIcon />}
            onClick={redo}
            disabled={!canRedo}
            tooltip="Redo (Ctrl+Y)"
            tooltipPosition="right"
            ariaLabel="Redo last action"
          />
        </div>
      </div>
    </aside>
  );
}
```

## ProjectPropertiesAccordion

The toolbar contains project-level properties in collapsible sections:

```tsx
function ProjectPropertiesAccordion() {
  const projectDetails = useProjectDetails();
  const { gridVisible, snapToGrid, gridSize } = useViewportStore();
  const { toggleGrid, toggleSnap, setGridSize } = useViewportActions();

  return (
    <div className="project-properties">
      <CollapsibleSection title="Project Info" defaultExpanded={false}>
        <div className="property-row">
          <span className="property-label">Name:</span>
          <span className="property-value">{projectDetails?.name}</span>
        </div>
        <div className="property-row">
          <span className="property-label">Project #:</span>
          <span className="property-value">
            {projectDetails?.projectNumber || '—'}
          </span>
        </div>
        <div className="property-row">
          <span className="property-label">Client:</span>
          <span className="property-value">
            {projectDetails?.clientName || '—'}
          </span>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Canvas Settings" defaultExpanded={false}>
        <div className="property-row">
          <label>
            <input
              type="checkbox"
              checked={gridVisible}
              onChange={toggleGrid}
            />
            Show Grid
          </label>
        </div>
        <div className="property-row">
          <label>
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={toggleSnap}
            />
            Snap to Grid
          </label>
        </div>
        <div className="property-row">
          <span className="property-label">Grid Size:</span>
          <select value={gridSize} onChange={(e) => setGridSize(+e.target.value)}>
            <option value={6}>1/8" (6px)</option>
            <option value={12}>1/4" (12px)</option>
            <option value={24}>1/2" (24px)</option>
            <option value={48}>1" (48px)</option>
          </select>
        </div>
      </CollapsibleSection>
    </div>
  );
}
```

## TypeSelector

When Equipment or Fitting tool is active, show type selection:

```tsx
function TypeSelector({ tool }: { tool: 'equipment' | 'fitting' }) {
  const equipmentType = useEquipmentType();
  const fittingType = useFittingType();
  const { setEquipmentType, setFittingType } = useToolActions();

  if (tool === 'equipment') {
    return (
      <div className="type-selector">
        <div className="section-label">Equipment Type</div>
        {EQUIPMENT_TYPES.map((type) => (
          <button
            key={type.id}
            className={cn('type-button', { active: equipmentType === type.id })}
            onClick={() => setEquipmentType(type.id)}
          >
            {type.icon} {type.label}
          </button>
        ))}
      </div>
    );
  }

  // Similar for fittings
  return (
    <div className="type-selector">
      <div className="section-label">Fitting Type</div>
      {FITTING_TYPES.map((type) => (
        <button
          key={type.id}
          className={cn('type-button', { active: fittingType === type.id })}
          onClick={() => setFittingType(type.id)}
        >
          {type.icon} {type.label}
        </button>
      ))}
    </div>
  );
}
```

## Styling

```css
.toolbar {
  display: flex;
  flex-direction: column;
  width: 200px;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  padding: 8px;
  overflow-y: auto;
}

.toolbar-section {
  padding: 8px 0;
}

.toolbar-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 4px 0;
}

.toolbar-spacer {
  flex: 1;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding: 0 4px;
}

.tool-buttons {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.type-selector {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.type-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
}

.type-button:hover {
  background: #e0e0e0;
}

.type-button.active {
  background: #e3f2fd;
  border-color: #1976D2;
  color: #1976D2;
}

.project-properties {
  font-size: 13px;
}

.property-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.property-label {
  color: #666;
}

.property-value {
  font-weight: 500;
}
```

## Usage

```tsx
import { Toolbar } from '@/features/canvas/components/Toolbar';

function CanvasPage() {
  return (
    <div className="canvas-layout">
      <Toolbar />
      <CanvasContainer />
      <InspectorPanel />
    </div>
  );
}
```

## Related Elements

- [IconButton](../ui/IconButton.md) - Tool buttons
- [CollapsibleSection](../ui/CollapsibleSection.md) - Property accordions
- [CanvasStore](../../02-stores/canvasStore.md) - Tool state
- [HistoryStore](../../02-stores/historyStore.md) - Undo/redo state
- [CanvasPage](./CanvasPage.md) - Parent component
- [BaseTool](../../04-tools/BaseTool.md) - Tool interface

## Testing

```typescript
describe('Toolbar', () => {
  it('renders all tool buttons', () => {
    render(<Toolbar />);

    expect(screen.getByLabelText(/select/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/room/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duct/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/equipment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fitting/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/note/i)).toBeInTheDocument();
  });

  it('highlights active tool', () => {
    useCanvasStore.setState({ activeTool: 'room' });

    render(<Toolbar />);

    const roomButton = screen.getByLabelText(/room/i);
    expect(roomButton).toHaveClass('active');
  });

  it('changes tool on click', () => {
    render(<Toolbar />);

    fireEvent.click(screen.getByLabelText(/duct/i));

    expect(useCanvasStore.getState().activeTool).toBe('duct');
  });

  it('disables undo when no history', () => {
    useHistoryStore.setState({ past: [] });

    render(<Toolbar />);

    expect(screen.getByLabelText(/undo/i)).toBeDisabled();
  });

  it('enables undo when history exists', () => {
    useHistoryStore.setState({ past: [mockCommand] });

    render(<Toolbar />);

    expect(screen.getByLabelText(/undo/i)).not.toBeDisabled();
  });

  it('shows equipment type selector when equipment tool active', () => {
    useCanvasStore.setState({ activeTool: 'equipment' });

    render(<Toolbar />);

    expect(screen.getByText('Equipment Type')).toBeInTheDocument();
  });
});
```
