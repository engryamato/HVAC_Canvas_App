import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { InspectorPanel } from '../InspectorPanel';
import { useSelectionStore } from '../../../store/selectionStore';
import { useEntityStore } from '@/core/store/entityStore';

vi.mock('../RoomInspector', () => ({
  default: () => <div data-testid="room-inspector">RoomInspector</div>,
}));
vi.mock('../DuctInspector', () => ({
  default: () => <div data-testid="duct-inspector">DuctInspector</div>,
}));
vi.mock('../EquipmentInspector', () => ({
  default: () => <div data-testid="equipment-inspector">EquipmentInspector</div>,
}));
vi.mock('../CanvasPropertiesInspector', () => ({
  CanvasPropertiesInspector: () => <div data-testid="canvas-inspector">CanvasInspector</div>,
}));

vi.mock('../../../store/selectionStore', () => ({
  useSelectionStore: vi.fn(),
}));
vi.mock('@/core/store/entityStore', () => ({
  useEntityStore: vi.fn(),
}));

const mockUseSelectionStore = useSelectionStore as unknown as ReturnType<typeof vi.fn>;
const mockUseEntityStore = useEntityStore as unknown as ReturnType<typeof vi.fn>;

function mockSelection(selectedIds: string[]) {
  mockUseSelectionStore.mockImplementation((selector: (state: { selectedIds: string[]; hoveredId: null }) => unknown) =>
    selector({ selectedIds, hoveredId: null })
  );
}

function mockEntities(byId: Record<string, unknown>) {
  mockUseEntityStore.mockImplementation((selector: (state: { byId: Record<string, unknown> }) => unknown) =>
    selector({ byId })
  );
}

describe('InspectorPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelection([]);
    mockEntities({});
  });

  it('renders header when showHeader is true', () => {
    render(<InspectorPanel embedded showHeader />);

    expect(screen.getByText('Properties')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Float inspector panel' })).toBeDefined();
  });

  it('hides header when showHeader is false', () => {
    render(<InspectorPanel embedded showHeader={false} />);

    expect(screen.queryByText('Properties')).toBeNull();
  });

  it('calls onFloat when Float button is clicked', () => {
    const onFloat = vi.fn();
    render(<InspectorPanel embedded showHeader onFloat={onFloat} />);

    fireEvent.click(screen.getByRole('button', { name: 'Float inspector panel' }));
    expect(onFloat).toHaveBeenCalledTimes(1);
  });

  it('renders CanvasInspector when no selection', () => {
    mockSelection([]);
    mockEntities({});

    render(<InspectorPanel />);
    expect(screen.getByTestId('canvas-inspector')).toBeDefined();
  });

  it('renders multi-selection state', () => {
    mockSelection(['1', '2']);
    mockEntities({});

    render(<InspectorPanel />);
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('items selected')).toBeDefined();
  });

  it('renders Room inspector for room selection', () => {
    mockSelection(['1']);
    mockEntities({ '1': { id: '1', type: 'room' } });

    render(<InspectorPanel />);
    expect(screen.getByTestId('room-inspector')).toBeDefined();
  });

  it('renders Duct inspector for duct selection', () => {
    mockSelection(['2']);
    mockEntities({ '2': { id: '2', type: 'duct' } });

    render(<InspectorPanel />);
    expect(screen.getByTestId('duct-inspector')).toBeDefined();
  });

  it('renders Equipment inspector for equipment selection', () => {
    mockSelection(['3']);
    mockEntities({ '3': { id: '3', type: 'equipment' } });

    render(<InspectorPanel />);
    expect(screen.getByTestId('equipment-inspector')).toBeDefined();
  });
});
