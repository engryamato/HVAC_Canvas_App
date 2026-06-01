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
    frictionLoss: 2.5,
    cumulativePressureDrop: 0.25,
    availableStaticPressure: 1.75,
  },
};

const segmentedDuctRun: DuctRun = {
  ...ductRun,
  id: '550e8400-e29b-41d4-a716-446655442010',
  props: {
    ...ductRun.props,
    installLength: 10,
    segments: [
      { index: 0, startStation: 0, endStation: 4, length: 4, isPartial: false },
      { index: 1, startStation: 4, endStation: 8, length: 4, isPartial: false },
      { index: 2, startStation: 8, endStation: 10, length: 2, isPartial: true },
    ],
  },
};

const propagatedDuctRun: DuctRun = {
  ...segmentedDuctRun,
  id: '550e8400-e29b-41d4-a716-446655442020',
  props: {
    ...segmentedDuctRun.props,
    airflow: 1200,
  },
  calculated: {
    ...segmentedDuctRun.calculated,
    velocity: 0,
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

    expect(screen.getByText('Selected Section')).toBeDefined();
    expect(screen.getByText('850 CFM')).toBeDefined();
    expect(screen.getByText('1,082 FPM')).toBeDefined();
    expect(screen.getByText('2.50 in.wg/100ft')).toBeDefined();
    expect(screen.getByText('0.25 in.wg')).toBeDefined();
    expect(screen.getByText('1.75 in.wg')).toBeDefined();
    expect(screen.getByText('System Totals')).toBeDefined();
  });

  it('shows the selected duct_run segment calculation using the segment station endpoint', () => {
    useEntityStore.setState({ byId: { [segmentedDuctRun.id]: segmentedDuctRun }, allIds: [segmentedDuctRun.id] });
    useSelectionStore.getState().selectSingle(segmentedDuctRun.id);
    useSelectionStore.getState().selectSegment(segmentedDuctRun.id, 1);

    render(<CalculationsPanel />);

    expect(screen.getByText('Selected Section')).toBeDefined();
    expect(screen.getByText('Section Length')).toBeDefined();
    expect(screen.getByText('4 ft')).toBeDefined();
    expect(screen.getByText('4 - 8 ft')).toBeDefined();
    expect(screen.getByText('0.10 in.wg')).toBeDefined();
    expect(screen.getByText('1.80 in.wg')).toBeDefined();
  });

  it('renders selected section airflow and computed velocity from first-class section results', () => {
    useEntityStore.setState({ byId: { [propagatedDuctRun.id]: propagatedDuctRun }, allIds: [propagatedDuctRun.id] });
    useSelectionStore.getState().selectSingle(propagatedDuctRun.id);
    useSelectionStore.getState().selectSegment(propagatedDuctRun.id, 0);

    render(<CalculationsPanel />);

    expect(screen.getByText('Selected Section')).toBeDefined();
    expect(screen.getByText('1,200 CFM')).toBeDefined();
    expect(screen.getByText('1,200 FPM')).toBeDefined();
  });

  it('shows computed engineering airflow for selected sections when persisted run airflow is zero', () => {
    const computedAirflowRun: DuctRun = {
      ...segmentedDuctRun,
      id: '550e8400-e29b-41d4-a716-446655442021',
      props: {
        ...segmentedDuctRun.props,
        airflow: 0,
        engineeringData: {
          airflow: 950,
          velocity: 0,
          pressureDrop: 2.5,
          friction: 2.5,
          systemType: 'supply',
        },
      },
      calculated: {
        ...segmentedDuctRun.calculated,
        velocity: 0,
      },
    };
    useEntityStore.setState({ byId: { [computedAirflowRun.id]: computedAirflowRun }, allIds: [computedAirflowRun.id] });
    useSelectionStore.getState().selectSingle(computedAirflowRun.id);
    useSelectionStore.getState().selectSegment(computedAirflowRun.id, 0);

    render(<CalculationsPanel />);

    expect(screen.getByText('Selected Section')).toBeDefined();
    expect(screen.getByText('950 CFM')).toBeDefined();
    expect(screen.getByText('950 FPM')).toBeDefined();
  });

  it('summarizes multiple selected duct_run segments in one run', () => {
    useEntityStore.setState({ byId: { [segmentedDuctRun.id]: segmentedDuctRun }, allIds: [segmentedDuctRun.id] });
    useSelectionStore.getState().selectSingle(segmentedDuctRun.id);
    useSelectionStore.getState().selectSegment(segmentedDuctRun.id, 0);
    useSelectionStore.getState().selectSegment(segmentedDuctRun.id, 2, true);

    render(<CalculationsPanel />);

    expect(screen.getByText('Selected Sections')).toBeDefined();
    expect(screen.getByText('6 ft')).toBeDefined();
    expect(screen.getByText('0 - 10 ft')).toBeDefined();
    expect(screen.getByText('0.15 in.wg')).toBeDefined();
    expect(screen.getByText('1.75 in.wg')).toBeDefined();
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
    expect(screen.queryByText('Selected Section')).toBeNull();
    expect(screen.queryByText('Selected Fitting')).toBeNull();

    useSelectionStore.getState().clearSelection();
    rerender(<CalculationsPanel />);
    expect(screen.getByText('Select a duct run or fitting to see its engineering values.')).toBeDefined();
  });

  it('shows selected branch calculations for multi-run duct selections', () => {
    const branchRun: DuctRun = {
      ...ductRun,
      id: '550e8400-e29b-41d4-a716-446655442030',
      props: {
        ...ductRun.props,
        airflow: 400,
        installLength: 6,
        segments: [{ index: 0, startStation: 0, endStation: 6, length: 6, isPartial: false }],
      },
      calculated: {
        ...ductRun.calculated,
        velocity: 509,
        frictionLoss: 1.5,
        cumulativePressureDrop: 0.09,
        availableStaticPressure: 1.91,
      },
    };
    useEntityStore.setState({
      byId: { [ductRun.id]: ductRun, [branchRun.id]: branchRun },
      allIds: [ductRun.id, branchRun.id],
    });
    useSelectionStore.getState().selectMultiple([ductRun.id, branchRun.id]);

    render(<CalculationsPanel />);

    expect(screen.getByText('Selected Branch')).toBeDefined();
    expect(screen.getByText('Branch Length')).toBeDefined();
    expect(screen.getByText('16 ft')).toBeDefined();
    expect(screen.getByText('1,250 CFM')).toBeDefined();
    expect(screen.getByText('0.34 in.wg')).toBeDefined();
  });
});
