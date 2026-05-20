# BOMPanel

## Overview

The BOMPanel (Bill of Materials Panel) displays a summary of all entities on the canvas grouped by category. It provides a collapsible view with counts and allows exporting the BOM to CSV format.

## Location

```
src/features/canvas/components/BOMPanel.tsx
```

## Purpose

- Display summary of all canvas entities
- Group entities by type (Rooms, Ducts, Equipment, Fittings)
- Show quantity counts for each category
- Provide CSV export functionality
- Offer quick reference for project scope

## Dependencies

- `@/features/canvas/hooks/useBOM` - BOM generation
- `@/features/export/csv` - CSV export
- `@/components/ui/CollapsibleSection` - Collapsible groups
- `@/components/ui/IconButton` - Export button

## Layout

```
┌─────────────────────────────────────┐
│  Bill of Materials          [Export]│
├─────────────────────────────────────┤
│  ▼ Rooms (3)                        │
│    • Kitchen - 150 sq ft            │
│    • Living Room - 200 sq ft        │
│    • Bedroom - 120 sq ft            │
├─────────────────────────────────────┤
│  ▼ Ducts (5)                        │
│    • Round 6" - 3 pcs (30 ft)       │
│    • Rectangular 12x8 - 2 pcs       │
├─────────────────────────────────────┤
│  ▶ Equipment (4)                    │
├─────────────────────────────────────┤
│  ▶ Fittings (8)                     │
├─────────────────────────────────────┤
│  Total: 20 entities                 │
└─────────────────────────────────────┘
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `className` | `string` | No | Additional CSS classes |
| `collapsible` | `boolean` | No | Make entire panel collapsible |
| `defaultExpanded` | `boolean` | No | Initial expanded state |

## Component Implementation

```tsx
interface BOMPanelProps {
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export function BOMPanel({
  className,
  collapsible = true,
  defaultExpanded = false,
}: BOMPanelProps) {
  const { bom, totalCount, isLoading } = useBOM();
  const { success, error } = useToast();

  const handleExport = async () => {
    try {
      const csv = generateBOMCSV(bom);
      downloadFile(csv, 'bill-of-materials.csv', 'text/csv');
      success('BOM exported successfully');
    } catch (err) {
      error('Failed to export BOM');
    }
  };

  const content = (
    <div className="bom-content">
      {/* Rooms Section */}
      <CollapsibleSection
        title={`Rooms (${bom.rooms.length})`}
        defaultExpanded
        badge={bom.rooms.length}
      >
        {bom.rooms.length > 0 ? (
          <ul className="bom-list">
            {bom.rooms.map((room) => (
              <li key={room.id} className="bom-item">
                <span className="item-name">{room.name}</span>
                <span className="item-spec">
                  {room.calculated?.area?.toFixed(0)} sq ft
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="bom-empty">No rooms</p>
        )}
      </CollapsibleSection>

      {/* Ducts Section */}
      <CollapsibleSection
        title={`Ducts (${bom.ducts.length})`}
        badge={bom.ducts.length}
      >
        {bom.ducts.length > 0 ? (
          <ul className="bom-list">
            {bom.ductSummary.map((summary) => (
              <li key={summary.key} className="bom-item">
                <span className="item-name">{summary.description}</span>
                <span className="item-spec">
                  {summary.quantity} pcs ({summary.totalLength} ft)
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="bom-empty">No ducts</p>
        )}
      </CollapsibleSection>

      {/* Equipment Section */}
      <CollapsibleSection
        title={`Equipment (${bom.equipment.length})`}
        badge={bom.equipment.length}
      >
        {bom.equipment.length > 0 ? (
          <ul className="bom-list">
            {bom.equipmentSummary.map((summary) => (
              <li key={summary.key} className="bom-item">
                <span className="item-name">{summary.type}</span>
                <span className="item-spec">{summary.quantity} pcs</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="bom-empty">No equipment</p>
        )}
      </CollapsibleSection>

      {/* Fittings Section */}
      <CollapsibleSection
        title={`Fittings (${bom.fittings.length})`}
        badge={bom.fittings.length}
      >
        {bom.fittings.length > 0 ? (
          <ul className="bom-list">
            {bom.fittingSummary.map((summary) => (
              <li key={summary.key} className="bom-item">
                <span className="item-name">{summary.type}</span>
                <span className="item-spec">{summary.quantity} pcs</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="bom-empty">No fittings</p>
        )}
      </CollapsibleSection>

      {/* Total */}
      <div className="bom-total">
        Total: {totalCount} entities
      </div>
    </div>
  );

  if (collapsible) {
    return (
      <div className={cn('bom-panel', className)}>
        <CollapsibleSection
          title="Bill of Materials"
          defaultExpanded={defaultExpanded}
          icon={<ListIcon />}
        >
          <div className="bom-header">
            <IconButton
              icon={<ExportIcon />}
              onClick={handleExport}
              tooltip="Export to CSV"
              size="sm"
              disabled={totalCount === 0}
            />
          </div>
          {content}
        </CollapsibleSection>
      </div>
    );
  }

  return (
    <div className={cn('bom-panel', className)}>
      <div className="bom-header">
        <h3>Bill of Materials</h3>
        <IconButton
          icon={<ExportIcon />}
          onClick={handleExport}
          tooltip="Export to CSV"
          size="sm"
          disabled={totalCount === 0}
        />
      </div>
      {content}
    </div>
  );
}
```

## BOM Data Structure

```typescript
interface BOMData {
  rooms: Room[];
  ducts: Duct[];
  equipment: Equipment[];
  fittings: Fitting[];

  // Aggregated summaries
  ductSummary: DuctSummary[];
  equipmentSummary: EquipmentSummary[];
  fittingSummary: FittingSummary[];
}

interface DuctSummary {
  key: string;  // e.g., "round-6-galvanized"
  shape: 'round' | 'rectangular';
  size: string;  // e.g., "6 in" or "12x8 in"
  material: string;
  quantity: number;
  totalLength: number;  // feet
  description: string;  // e.g., "Round 6\" Galvanized"
}

interface EquipmentSummary {
  key: string;
  type: string;  // e.g., "Hood", "Fan"
  quantity: number;
}

interface FittingSummary {
  key: string;
  type: string;  // e.g., "90° Elbow", "Tee"
  quantity: number;
}
```

## Styling

```css
.bom-panel {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.bom-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.bom-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.bom-content {
  padding: 8px;
}

.bom-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.bom-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.bom-item:last-child {
  border-bottom: none;
}

.item-name {
  color: #333;
}

.item-spec {
  color: #666;
  font-size: 12px;
}

.bom-empty {
  color: #999;
  font-style: italic;
  padding: 8px;
  text-align: center;
  font-size: 13px;
}

.bom-total {
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
  font-weight: 600;
  text-align: center;
  background: #f5f5f5;
}
```

## CSV Export Format

```csv
Category,Description,Quantity,Size,Material,Notes
Room,Kitchen,1,150 sq ft,-,
Room,Living Room,1,200 sq ft,-,
Duct,Round Duct,3,6 in dia,Galvanized,Total: 30 ft
Duct,Rectangular Duct,2,12x8 in,Galvanized,Total: 20 ft
Equipment,Hood,2,-,-,
Equipment,Fan,1,-,-,
Fitting,90° Elbow,4,6 in,-,
Fitting,Tee,2,6 in,-,
```

## Usage

```tsx
// In InspectorPanel or as standalone panel
import { BOMPanel } from '@/features/canvas/components/BOMPanel';

function InspectorPanel() {
  return (
    <aside className="inspector">
      {/* Entity properties */}
      <EntityInspector />

      {/* BOM Panel at bottom */}
      <BOMPanel collapsible defaultExpanded={false} />
    </aside>
  );
}
```

## Related Elements

- [useBOM](../../07-hooks/useBOM.md) - BOM data generation
- [BOMTable](./BOMTable.md) - Detailed BOM table view
- [ExportMenu](../export/ExportMenu.md) - Export options
- [CollapsibleSection](../ui/CollapsibleSection.md) - Collapsible groups

## Testing

```typescript
describe('BOMPanel', () => {
  beforeEach(() => {
    useEntityStore.setState({
      byId: {
        room1: { id: 'room1', type: 'room', props: { name: 'Kitchen' }, ... },
        duct1: { id: 'duct1', type: 'duct', ... },
      },
      allIds: ['room1', 'duct1'],
    });
  });

  it('displays room count', () => {
    render(<BOMPanel />);
    expect(screen.getByText('Rooms (1)')).toBeInTheDocument();
  });

  it('displays duct count', () => {
    render(<BOMPanel />);
    expect(screen.getByText('Ducts (1)')).toBeInTheDocument();
  });

  it('displays total count', () => {
    render(<BOMPanel />);
    expect(screen.getByText('Total: 2 entities')).toBeInTheDocument();
  });

  it('displays room details', () => {
    render(<BOMPanel />);

    // Expand rooms section
    fireEvent.click(screen.getByText('Rooms (1)'));

    expect(screen.getByText('Kitchen')).toBeInTheDocument();
  });

  it('exports BOM to CSV', async () => {
    const downloadFile = vi.fn();
    vi.mock('@/features/export/download', () => ({ downloadFile }));

    render(<BOMPanel />);

    fireEvent.click(screen.getByLabelText('Export to CSV'));

    await waitFor(() => {
      expect(downloadFile).toHaveBeenCalledWith(
        expect.any(String),
        'bill-of-materials.csv',
        'text/csv'
      );
    });
  });

  it('disables export when no entities', () => {
    useEntityStore.setState({ byId: {}, allIds: [] });

    render(<BOMPanel />);

    expect(screen.getByLabelText('Export to CSV')).toBeDisabled();
  });

  it('shows empty message for empty categories', () => {
    useEntityStore.setState({ byId: {}, allIds: [] });

    render(<BOMPanel />);

    expect(screen.getByText('No rooms')).toBeInTheDocument();
    expect(screen.getByText('No ducts')).toBeInTheDocument();
  });
});
```
