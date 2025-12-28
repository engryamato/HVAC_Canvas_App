# BOMTable

## Overview

The BOMTable (Bill of Materials Table) component displays a detailed, sortable, and filterable table view of all entities on the canvas. It provides a comprehensive list format alternative to the summary-focused BOMPanel, with options for grouping, sorting, and exporting.

## Location

```
src/features/canvas/components/BOMTable.tsx
```

## Purpose

- Display detailed list of all canvas entities in table format
- Support sorting by any column
- Enable filtering by entity type or search term
- Provide row selection for bulk operations
- Export selected or all items to CSV/Excel
- Navigate to entity on canvas when row is clicked

## Dependencies

- `@/features/canvas/hooks/useBOM` - BOM data generation
- `@/features/canvas/store/entityStore` - Entity selection
- `@/features/export/csv` - CSV export
- `@/components/ui/IconButton` - Action buttons

## Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Bill of Materials                    [Filter ▼] [🔍 Search] [Export]│
├──────────────────────────────────────────────────────────────────────┤
│  [☐] │ Type ▼    │ Name          │ Size        │ Material   │ Qty   │
├──────────────────────────────────────────────────────────────────────┤
│  [☐] │ Room      │ Kitchen       │ 150 sq ft   │ -          │ 1     │
│  [☐] │ Room      │ Living Room   │ 200 sq ft   │ -          │ 1     │
│  [☐] │ Duct      │ Main Supply   │ 6" dia      │ Galvanized │ 3     │
│  [☐] │ Duct      │ Branch        │ 4" dia      │ Galvanized │ 5     │
│  [☐] │ Equipment │ Supply Fan    │ -           │ -          │ 1     │
│  [☑] │ Fitting   │ 90° Elbow     │ 6"          │ Galvanized │ 4     │
├──────────────────────────────────────────────────────────────────────┤
│  Showing 6 of 15 items                          1 selected           │
└──────────────────────────────────────────────────────────────────────┘
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `className` | `string` | No | Additional CSS classes |
| `onRowClick` | `(entityId: string) => void` | No | Row click handler |
| `selectable` | `boolean` | No | Enable row selection |
| `defaultFilter` | `EntityType` | No | Initial type filter |

## Component Implementation

```tsx
interface BOMTableProps {
  className?: string;
  onRowClick?: (entityId: string) => void;
  selectable?: boolean;
  defaultFilter?: EntityType;
}

interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  width?: string;
}

const COLUMNS: TableColumn[] = [
  { key: 'type', label: 'Type', sortable: true, width: '100px' },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'size', label: 'Size', sortable: true, width: '120px' },
  { key: 'material', label: 'Material', sortable: true, width: '120px' },
  { key: 'quantity', label: 'Qty', sortable: true, width: '60px' },
];

export function BOMTable({
  className,
  onRowClick,
  selectable = false,
  defaultFilter,
}: BOMTableProps) {
  const { bom, flatList } = useBOM();
  const { selectEntity, selectedIds } = useEntityStore();

  const [sortColumn, setSortColumn] = useState<string>('type');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<EntityType | 'all'>(defaultFilter || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Filter items
  const filteredItems = useMemo(() => {
    return flatList.filter((item) => {
      // Type filter
      if (filterType !== 'all' && item.type !== filterType) {
        return false;
      }
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          item.name.toLowerCase().includes(search) ||
          item.type.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [flatList, filterType, searchTerm]);

  // Sort items
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const aVal = a[sortColumn] ?? '';
      const bVal = b[sortColumn] ?? '';
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredItems, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (entityId: string) => {
    if (onRowClick) {
      onRowClick(entityId);
    } else {
      selectEntity(entityId);
    }
  };

  const handleSelectAll = () => {
    if (selectedRows.size === sortedItems.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sortedItems.map((item) => item.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleExport = () => {
    const itemsToExport = selectedRows.size > 0
      ? sortedItems.filter((item) => selectedRows.has(item.id))
      : sortedItems;
    exportBOMToCSV(itemsToExport);
  };

  return (
    <div className={cn('bom-table', className)}>
      {/* Header with filters */}
      <div className="bom-table-header">
        <h3>Bill of Materials</h3>
        <div className="bom-table-controls">
          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as EntityType | 'all')}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="room">Rooms</option>
            <option value="duct">Ducts</option>
            <option value="equipment">Equipment</option>
            <option value="fitting">Fittings</option>
          </select>

          {/* Search */}
          <div className="search-input">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Export */}
          <IconButton
            icon={<ExportIcon />}
            onClick={handleExport}
            tooltip="Export to CSV"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bom-table-container">
        <table>
          <thead>
            <tr>
              {selectable && (
                <th className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === sortedItems.length && sortedItems.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={cn({ sortable: col.sortable })}
                >
                  {col.label}
                  {sortColumn === col.key && (
                    <span className="sort-indicator">
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item) => (
              <tr
                key={item.id}
                onClick={() => handleRowClick(item.id)}
                className={cn({
                  selected: selectedIds.includes(item.id),
                  'row-selected': selectedRows.has(item.id),
                })}
              >
                {selectable && (
                  <td className="checkbox-cell" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.id)}
                      onChange={() => handleSelectRow(item.id)}
                    />
                  </td>
                )}
                <td>{item.type}</td>
                <td>{item.name}</td>
                <td>{item.size}</td>
                <td>{item.material || '-'}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bom-table-footer">
        <span>
          Showing {sortedItems.length} of {flatList.length} items
        </span>
        {selectable && selectedRows.size > 0 && (
          <span>{selectedRows.size} selected</span>
        )}
      </div>
    </div>
  );
}
```

## BOM Item Interface

```typescript
interface BOMItem {
  id: string;
  type: EntityType;
  name: string;
  size: string;
  material?: string;
  quantity: number;
  // Additional properties
  length?: number;
  area?: number;
  cfm?: number;
}
```

## Styling

```css
.bom-table {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.bom-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.bom-table-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.bom-table-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.search-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.search-input input {
  border: none;
  outline: none;
  font-size: 13px;
  width: 150px;
}

.bom-table-container {
  flex: 1;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

th {
  background: #f5f5f5;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
}

th.sortable {
  cursor: pointer;
}

th.sortable:hover {
  background: #eee;
}

.sort-indicator {
  margin-left: 4px;
  font-size: 10px;
}

td {
  font-size: 13px;
}

tr:hover {
  background: #f8f8f8;
  cursor: pointer;
}

tr.selected {
  background: #e3f2fd;
}

tr.row-selected {
  background: #bbdefb;
}

.checkbox-cell {
  width: 40px;
  text-align: center;
}

.bom-table-footer {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
  color: #666;
  background: #fafafa;
}
```

## Usage

```tsx
import { BOMTable } from '@/features/canvas/components/BOMTable';

// Full-featured table in a modal or side panel
function BOMDialog() {
  const { fitToEntity } = useViewportActions();

  return (
    <Dialog title="Bill of Materials">
      <BOMTable
        selectable
        onRowClick={(id) => fitToEntity(id)}
      />
    </Dialog>
  );
}

// Filtered table for specific entity type
function DuctList() {
  return (
    <BOMTable
      defaultFilter="duct"
      onRowClick={handleDuctSelection}
    />
  );
}
```

## Related Elements

- [BOMPanel](./BOMPanel.md) - Summary BOM view
- [useBOM](../../07-hooks/useBOM.md) - BOM data hook
- [entityStore](../../02-stores/entityStore.md) - Entity selection
- [ExportMenu](../export/ExportMenu.md) - Export options

## Testing

```typescript
describe('BOMTable', () => {
  beforeEach(() => {
    useEntityStore.setState({
      byId: {
        room1: { id: 'room1', type: 'room', props: { name: 'Kitchen' } },
        duct1: { id: 'duct1', type: 'duct', props: { name: 'Main Supply' } },
      },
      allIds: ['room1', 'duct1'],
    });
  });

  it('renders all items', () => {
    render(<BOMTable />);
    expect(screen.getByText('Kitchen')).toBeInTheDocument();
    expect(screen.getByText('Main Supply')).toBeInTheDocument();
  });

  it('filters by type', () => {
    render(<BOMTable />);

    fireEvent.change(screen.getByDisplayValue('All Types'), {
      target: { value: 'room' },
    });

    expect(screen.getByText('Kitchen')).toBeInTheDocument();
    expect(screen.queryByText('Main Supply')).not.toBeInTheDocument();
  });

  it('filters by search term', () => {
    render(<BOMTable />);

    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'kitchen' },
    });

    expect(screen.getByText('Kitchen')).toBeInTheDocument();
    expect(screen.queryByText('Main Supply')).not.toBeInTheDocument();
  });

  it('sorts by column', () => {
    render(<BOMTable />);

    fireEvent.click(screen.getByText('Name'));

    const rows = screen.getAllByRole('row');
    // Check sorted order
  });

  it('calls onRowClick when row clicked', () => {
    const onRowClick = vi.fn();
    render(<BOMTable onRowClick={onRowClick} />);

    fireEvent.click(screen.getByText('Kitchen'));

    expect(onRowClick).toHaveBeenCalledWith('room1');
  });

  it('handles row selection when selectable', () => {
    render(<BOMTable selectable />);

    const checkbox = screen.getAllByRole('checkbox')[1]; // First row
    fireEvent.click(checkbox);

    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('selects all rows', () => {
    render(<BOMTable selectable />);

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);

    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });
});
```
