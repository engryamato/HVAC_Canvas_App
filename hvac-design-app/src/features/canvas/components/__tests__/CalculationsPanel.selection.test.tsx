import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { DuctRun, Fitting } from '@/core/schema';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '../../store/selectionStore';
import { CalculationsPanel } from '../CalculationsPanel';

const now = '2026-01-01T00:00:00.000Z';

const ductRun: DuctRun = {
  id: '550e8400-e29b-41d4-a716-446655442000',
  type: 'duct_run',
  transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 1,
  createdAt: now,
  modifiedAt: now,
  props: {
    name: 'Supply Main',
    engineeringSystem: 'standard_duct',
    shape: 'rectangular',
    width: 12,
    height: 12,
    material: 'galvanized',
    airflow: 850,
    staticPressure: 0.1,
    installLength: 10,
    segments: [{ index: 0, startStation: 0, endStation: 10, length: 10, isPartial: false }],
  },
  calculated: {
    area: 144,
    velocity: 1082,
    frictionLoss: 0.08,
    cumulativePressureDrop: 0.24,
    availableStaticPressure: 1.76,
  },
};

const fitting: Fitting = {
  id: '550e8400-e29b-41d4-a716-446655442001',
  type: 'fitting',
  transform: { x: 120, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 1,
  createdAt: now,
  modifiedAt: now,
  props: {
    engineeringSystem: 'standard_duct',
    fittingType: 'tee',
    manualOverride: false,
    ports: [
      { id: 'in', role: 'inlet', direction: 'in', connectedDuctRunId: ductRun.id, connectedEnd: 'end' },
      { id: 'branch', role: 'branch_out', direction: 'out', connectedDuctRunId: ductRun.id, connectedEnd: 'start' },
    ],
  },
  calculated: {
    equivalentLength: 12,
    pressureLoss: 0.04,
    cumulativePressureDrop: 0.28,
    availableStaticPressure: 1.72,
  },
};

describe('CalculationsPanel selection-aware values', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useSelectionStore.getState().clearSelection();
  });

  it('shows selected duct_run engineering values above system totals', () => {
    useEntityStore.setState({ byId: { [ductRun.id]: ductRun }, allIds: [ductRun.id] });
    useSelectionStore.getState().selectSingle(ductRun.id);

    render(<CalculationsPanel />);

    expect(screen.getByText('Selected Segment')).toBeDefined();
    expect(screen.getByText('850 CFM')).toBeDefined();
    expect(screen.getByText('1,082 FPM')).toBeDefined();
    expect(screen.getByText('0.08 in.wg/100ft')).toBeDefined();
    expect(screen.getByText('0.24 in.wg')).toBeDefined();
    expect(screen.getByText('1.76 in.wg')).toBeDefined();
    expect(screen.getByText('System Totals')).toBeDefined();
  });

  it('shows fitting port airflow and pressure values when one fitting is selected', () => {
    useEntityStore.setState({
      byId: { [ductRun.id]: ductRun, [fitting.id]: fitting },
      allIds: [ductRun.id, fitting.id],
    });
    useSelectionStore.getState().selectSingle(fitting.id);

    render(<CalculationsPanel />);

    expect(screen.getByText('Selected Fitting')).toBeDefined();
    expect(screen.getByText('Entering')).toBeDefined();
    expect(screen.getByText('Exiting')).toBeDefined();
    expect(screen.getByText('Inlet')).toBeDefined();
    expect(screen.getByText('Branch Out')).toBeDefined();
    expect(screen.getAllByText('850 CFM')).toHaveLength(2);
    expect(screen.getByText('0.04 in.wg')).toBeDefined();
  });

  it('hides selected cards for multi-selection and shows a hint for empty selection', () => {
    useEntityStore.setState({ byId: { [ductRun.id]: ductRun, [fitting.id]: fitting }, allIds: [ductRun.id, fitting.id] });
    useSelectionStore.getState().selectMultiple([ductRun.id, fitting.id]);

    const { rerender } = render(<CalculationsPanel />);
    expect(screen.queryByText('Selected Segment')).toBeNull();
    expect(screen.queryByText('Selected Fitting')).toBeNull();

    useSelectionStore.getState().clearSelection();
    rerender(<CalculationsPanel />);
    expect(screen.getByText('Select a duct run or fitting to see its engineering values.')).toBeDefined();
  });
});
