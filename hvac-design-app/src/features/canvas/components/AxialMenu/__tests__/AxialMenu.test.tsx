import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Duct, Entity, Fitting } from '@/core/schema';

const { isEnabledMock, commitEntityPropsMock } = vi.hoisted(() => ({
  isEnabledMock: vi.fn(() => true),
  commitEntityPropsMock: vi.fn(),
}));

vi.mock('@/core/flags/featureFlags', () => ({
  isEnabled: isEnabledMock,
}));

vi.mock('@/core/actions/entityActions', () => ({
  commitEntityProps: commitEntityPropsMock,
}));

import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { AxialLayer } from '../AxialLayer';
import { AxialMenu } from '../AxialMenu';

const now = '2026-06-05T00:00:00.000Z';

function fitting(id: string, fittingType: Fitting['props']['fittingType'], extraProps: Partial<Fitting['props']> = {}): Fitting {
  return {
    id,
    type: 'fitting',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 0,
    createdAt: now,
    modifiedAt: now,
    props: {
      engineeringSystem: 'standard_duct',
      fittingType,
      serviceId: 'tmpl_low_pressure_supply',
      manualOverride: false,
      ...extraProps,
    },
    calculated: { equivalentLength: 0, pressureLoss: 0 },
  };
}

function duct(id: string, shape: Duct['props']['shape']): Duct {
  return {
    id,
    type: 'duct',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 0,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: id,
      engineeringSystem: 'standard_duct',
      shape,
      ...(shape === 'round' ? { diameter: 12 } : { width: 12, height: 8 }),
      length: 10,
      material: 'galvanized',
      airflow: 500,
      staticPressure: 1,
      serviceId: 'tmpl_low_pressure_supply',
    },
    calculated: {
      area: 0,
      velocity: 0,
      frictionLoss: 0,
    },
  };
}

function setEntities(entities: Entity[]) {
  useEntityStore.setState({
    byId: Object.fromEntries(entities.map((entity) => [entity.id, entity])),
    allIds: entities.map((entity) => entity.id),
  });
}

function requestAxial(detail?: { entityId?: string; x?: number; y?: number }) {
  window.dispatchEvent(new CustomEvent('sws:axial-menu-requested', { detail }));
}

describe('AxialMenu layer', () => {
  beforeEach(() => {
    isEnabledMock.mockReturnValue(true);
    commitEntityPropsMock.mockClear();
    setEntities([]);
    useSelectionStore.setState({ selectedIds: [], selectedSegments: [], hoveredId: null });
  });

  afterEach(() => {
    cleanup();
  });

  it('opens when the request targets a fitting', async () => {
    setEntities([fitting('fit-1', 'elbow_90')]);
    render(<AxialLayer />);

    requestAxial({ entityId: 'fit-1', x: 120, y: 140 });

    expect(await screen.findByRole('menu', { name: 'Axial fitting variants' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Radius' })).toBeInTheDocument();
  });

  it('does not open when the request target is not a fitting', async () => {
    setEntities([duct('duct-1', 'rectangular')]);
    render(<AxialLayer />);

    requestAxial({ entityId: 'duct-1', x: 120, y: 140 });

    await waitFor(() => {
      expect(screen.queryByRole('menu', { name: 'Axial fitting variants' })).not.toBeInTheDocument();
    });
  });

  it('uses the selected fitting when Shift+F10 dispatches without detail', async () => {
    setEntities([fitting('fit-1', 'cap')]);
    useSelectionStore.getState().selectSingle('fit-1');
    render(<AxialLayer />);

    requestAxial();

    expect(await screen.findByRole('menuitem', { name: 'End cap' })).toBeInTheDocument();
  });

  it('ignores Shift+F10 when the selection is not a fitting', async () => {
    setEntities([duct('duct-1', 'rectangular')]);
    useSelectionStore.getState().selectSingle('duct-1');
    render(<AxialLayer />);

    requestAxial();

    await waitFor(() => {
      expect(screen.queryByRole('menu', { name: 'Axial fitting variants' })).not.toBeInTheDocument();
    });
  });

  it('opens at the CAS anchor when keyboard detail has no coordinates', async () => {
    setEntities([fitting('fit-1', 'cap')]);
    useSelectionStore.getState().selectSingle('fit-1');
    render(<AxialLayer />);

    requestAxial();

    expect(await screen.findByRole('menu')).toHaveStyle({ left: '512px', top: '384px' });
  });

  it('renders null when the feature flag is off', () => {
    isEnabledMock.mockReturnValue(false);
    setEntities([fitting('fit-1', 'cap')]);

    render(<AxialLayer />);
    requestAxial({ entityId: 'fit-1', x: 20, y: 20 });

    expect(screen.queryByRole('menu', { name: 'Axial fitting variants' })).not.toBeInTheDocument();
  });
});

describe('AxialMenu shape gates', () => {
  it('shows elbow vanes for rectangular fittings', () => {
    render(<AxialMenu family="elbow" shape="rect" anchor={{ x: 100, y: 100 }} onPick={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole('menuitem', { name: 'Vanes' })).toBeInTheDocument();
  });

  it('hides elbow vanes for round fittings', () => {
    render(<AxialMenu family="elbow" shape="round" anchor={{ x: 100, y: 100 }} onPick={vi.fn()} onClose={vi.fn()} />);

    expect(screen.queryByRole('menuitem', { name: 'Vanes' })).not.toBeInTheDocument();
  });

  it('shows a disabled fallback when all nodes are filtered out', () => {
    render(
      <AxialMenu
        family="elbow"
        shape="round"
        nodes={[{ id: 'rect-only', label: 'Rect only', shapeGate: ['rect'] }]}
        anchor={{ x: 100, y: 100 }}
        onPick={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('menuitem', { name: 'No variants available' })).toBeDisabled();
  });
});
