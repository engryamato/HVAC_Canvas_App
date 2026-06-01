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
vi.mock('../DuctRunInspector', () => ({
  default: () => <div data-testid="duct-run-inspector">DuctRunInspector</div>,
}));
vi.mock('../EquipmentInspector', () => ({
  default: () => <div data-testid="equipment-inspector">EquipmentInspector</div>,
}));
vi.mock('../FittingInspector', () => ({
  default: () => <div data-testid="fitting-inspector">FittingInspector</div>,
}));
vi.mock('../InspectorOverviewPanel', () => ({
  InspectorOverviewPanel: () => <div data-testid="inspector-overview">InspectorOverviewPanel</div>,
}));
vi.mock('../useInspectorOverviewData', () => ({
  useInspectorOverviewData: () => ({ project: { name: 'Test' } }),
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
  mockUseSelectionStore.mockImplementation((selector: (state: { selectedIds: string[]; selectedSegments: []; hoveredId: null }) => unknown) =>
    selector({ selectedIds, selectedSegments: [], hoveredId: null })
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

  it('renders InspectorOverviewPanel when no selection', () => {
    mockSelection([]);
    mockEntities({});

    render(<InspectorPanel />);
    expect(screen.getByTestId('inspector-overview')).toBeDefined();
  });

  it('keeps the overview as the only no-selection inspector', () => {
    mockSelection([]);
    mockEntities({});

    render(<InspectorPanel embedded showHeader />);

    expect(screen.getByTestId('inspector-overview')).toBeDefined();
    expect(screen.getByText('Properties')).toBeDefined();
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

  it('renders Fitting inspector for fitting selection', () => {
    mockSelection(['4']);
    mockEntities({ '4': { id: '4', type: 'fitting' } });

    render(<InspectorPanel />);
    expect(screen.getByTestId('fitting-inspector')).toBeDefined();
  });

  it('renders DuctRun inspector for duct run selection', () => {
    mockSelection(['5']);
    mockEntities({ '5': { id: '5', type: 'duct_run' } });

    render(<InspectorPanel />);
    expect(screen.getByTestId('duct-run-inspector')).toBeDefined();
  });

  it('does not replace newer entity inspectors when overview is present', () => {
    const cases = [
      ['room-1', { id: 'room-1', type: 'room' }, 'room-inspector'],
      ['duct-1', { id: 'duct-1', type: 'duct' }, 'duct-inspector'],
      ['run-1', { id: 'run-1', type: 'duct_run' }, 'duct-run-inspector'],
      ['equipment-1', { id: 'equipment-1', type: 'equipment' }, 'equipment-inspector'],
      ['fitting-1', { id: 'fitting-1', type: 'fitting' }, 'fitting-inspector'],
    ] as const;

    for (const [id, entity, testId] of cases) {
      mockSelection([id]);
      mockEntities({ [id]: entity });
      const { unmount } = render(<InspectorPanel />);
      expect(screen.getByTestId(testId)).toBeDefined();
      unmount();
    }
  });
});
