<<<<<<< HEAD
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { InspectorPanel } from '../InspectorPanel';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '../../../store/selectionStore';

describe('InspectorPanel - Docked Header', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useSelectionStore.setState({ selectedIds: ['one', 'two'], hoveredId: null });
  });

  it('renders header when showHeader is true', () => {
    render(<InspectorPanel embedded showHeader />);

    expect(screen.getByText('Properties')).toBeDefined();
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('hides header when showHeader is false', () => {
    render(<InspectorPanel embedded showHeader={false} />);

    expect(screen.queryByText('Properties')).toBeNull();
  });

  it('calls onFloat when Float button is clicked', () => {
    const onFloat = vi.fn();
    render(<InspectorPanel embedded showHeader onFloat={onFloat} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onFloat).toHaveBeenCalledTimes(1);
  });
});

=======
import React from 'react';
import { render, screen } from '@testing-library/react';
import { InspectorPanel } from '../InspectorPanel';
import { useSelectionStore } from '../../store/selectionStore';
import { useEntityStore } from '@/core/store/entityStore';

// Mock child components to isolate InspectorPanel logic
jest.mock('../RoomInspector', () => ({ RoomInspector: () => <div data-testid="room-inspector">RoomInspector</div> }));
jest.mock('../DuctInspector', () => ({ DuctInspector: () => <div data-testid="duct-inspector">DuctInspector</div> }));
jest.mock('../EquipmentInspector', () => ({ EquipmentInspector: () => <div data-testid="equipment-inspector">EquipmentInspector</div> }));
jest.mock('../CanvasPropertiesInspector', () => ({ CanvasPropertiesInspector: () => <div data-testid="canvas-inspector">CanvasInspector</div> }));

// Mock stores
jest.mock('../../store/selectionStore');
jest.mock('@/core/store/entityStore');

describe('InspectorPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders CanvasInspector when no selection', () => {
    (useSelectionStore as unknown as jest.Mock).mockImplementation((selector) => selector({ selectedIds: [] }));
    (useEntityStore as unknown as jest.Mock).mockImplementation((selector) => selector({ byId: {} }));

    render(<InspectorPanel />);
    expect(screen.getByTestId('canvas-inspector')).toBeInTheDocument();
  });

  it('renders multi-selection state', () => {
    (useSelectionStore as unknown as jest.Mock).mockImplementation((selector) => selector({ selectedIds: ['1', '2'] }));
    (useEntityStore as unknown as jest.Mock).mockImplementation((selector) => selector({ byId: {} }));

    render(<InspectorPanel />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('items selected')).toBeInTheDocument();
  });

  it('renders correct inspector for Room', () => {
    const room = { id: '1', type: 'room' };
    (useSelectionStore as unknown as jest.Mock).mockImplementation((selector) => selector({ selectedIds: ['1'] }));
    // InspectorPanel calls useEntityStore twice roughly: once to get selectedEntity (via selector).
    // The selector logic in InspectorPanel: (state) => (selectedId ? (state.byId[selectedId] ?? null) : null)
    (useEntityStore as unknown as jest.Mock).mockImplementation((selector) => selector({ byId: { '1': room } }));

    render(<InspectorPanel />);
    expect(screen.getByTestId('room-inspector')).toBeInTheDocument();
  });

  it('renders correct inspector for Duct', () => {
    const duct = { id: '2', type: 'duct' };
    (useSelectionStore as unknown as jest.Mock).mockImplementation((selector) => selector({ selectedIds: ['2'] }));
    (useEntityStore as unknown as jest.Mock).mockImplementation((selector) => selector({ byId: { '2': duct } }));

    render(<InspectorPanel />);
    expect(screen.getByTestId('duct-inspector')).toBeInTheDocument();
  });

  it('renders correct inspector for Equipment', () => {
    const eq = { id: '3', type: 'equipment' };
    (useSelectionStore as unknown as jest.Mock).mockImplementation((selector) => selector({ selectedIds: ['3'] }));
    (useEntityStore as unknown as jest.Mock).mockImplementation((selector) => selector({ byId: { '3': eq } }));

    render(<InspectorPanel />);
    expect(screen.getByTestId('equipment-inspector')).toBeInTheDocument();
  });
});
>>>>>>> feat/canvas-navigation
