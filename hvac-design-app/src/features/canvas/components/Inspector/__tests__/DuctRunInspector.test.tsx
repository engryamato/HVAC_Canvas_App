import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DuctRunInspector } from '../DuctRunInspector';
import type { DuctRun } from '@/core/schema';
import { useSelectionStore } from '../../../store/selectionStore';
import { useFabricationProfileStore } from '@/core/store/fabricationProfileStore';
import { updateEntity as updateEntityCommand } from '@/core/commands/entityCommands';

vi.mock('@/core/commands/entityCommands', () => ({
  updateEntity: vi.fn(),
}));

function createRun(): DuctRun {
  return {
    id: 'run-1',
    type: 'duct_run',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 5,
    createdAt: '2026-05-01T00:00:00.000Z',
    modifiedAt: '2026-05-01T00:00:00.000Z',
    calculated: { area: 100, velocity: 800, frictionLoss: 0.1 },
    props: {
      name: 'Supply Run A',
      engineeringSystem: 'standard_duct',
      shape: 'rectangular',
      width: 24,
      height: 12,
      material: 'galvanized',
      airflow: 1200,
      staticPressure: 0.3,
      installLength: 13,
      segments: [
        { index: 0, startStation: 0, endStation: 5, length: 5, isPartial: false },
        { index: 1, startStation: 5, endStation: 10, length: 5, isPartial: false },
        { index: 2, startStation: 10, endStation: 13, length: 3, isPartial: true },
      ],
    },
  };
}

describe('DuctRunInspector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSelectionStore.setState({ selectedIds: ['run-1'], selectedSegments: [], hoveredId: null });
    useFabricationProfileStore.persist?.clearStorage?.();
    useFabricationProfileStore.getState().resetProfiles();
  });

  it('renders the sample-style properties panel sections', () => {
    render(<DuctRunInspector entity={createRun()} />);

    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('Supply Run A')).toBeDefined();
    expect(screen.getAllByText('Rectangular').length).toBeGreaterThan(0);
    expect(screen.getByText('Dimensions')).toBeDefined();
    expect(screen.getByRole('radiogroup', { name: 'Duct shape' })).toBeDefined();
    expect(screen.getByText('Insulation')).toBeDefined();
    expect(screen.getByText('End Types')).toBeDefined();
    expect(screen.queryByText('Section Rule')).toBeNull();
    expect(screen.queryByText('Run Summary')).toBeNull();
  });

  it('updates dimensions through sample stepper controls', () => {
    const run = createRun();

    render(<DuctRunInspector entity={run} />);

    fireEvent.click(screen.getByRole('button', { name: 'Increase width' }));

    expect(updateEntityCommand).toHaveBeenCalledTimes(1);
    const [, update] = vi.mocked(updateEntityCommand).mock.calls[0]!;
    expect((update.props as DuctRun['props']).width).toBe(26);
  });

  it('switches the sample dimensions panel between rectangular and round', () => {
    const run = createRun();

    render(<DuctRunInspector entity={run} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Round' }));

    expect(updateEntityCommand).toHaveBeenCalledTimes(1);
    const [, update] = vi.mocked(updateEntityCommand).mock.calls[0]!;
    const nextProps = update.props as DuctRun['props'];
    expect(nextProps.shape).toBe('round');
    expect(nextProps.diameter).toBe(12);
    expect('width' in nextProps ? nextProps.width : undefined).toBeUndefined();
  });

  it('updates length from the sample length input', () => {
    const run = createRun();

    render(<DuctRunInspector entity={run} />);

    fireEvent.change(screen.getByLabelText('Length'), {
      target: { value: '18.5' },
    });

    expect(updateEntityCommand).toHaveBeenCalledTimes(1);
    const [, update] = vi.mocked(updateEntityCommand).mock.calls[0]!;
    const nextProps = update.props as DuctRun['props'];
    expect(nextProps.installLength).toBe(18.5);
    expect(nextProps.segments[nextProps.segments.length - 1]?.endStation).toBe(18.5);
  });

  it('updates insulation thickness only for selected segments', () => {
    useSelectionStore.setState({
      selectedIds: ['run-1'],
      selectedSegments: [{ runId: 'run-1', segmentIndex: 1 }],
      hoveredId: null,
    });
    const run = createRun();
    run.props.segments[0] = { ...run.props.segments[0]!, insulationThickness: 1 };
    run.props.segments[1] = { ...run.props.segments[1]!, insulationType: 'wrap', insulationThickness: 1 };

    render(<DuctRunInspector entity={run} />);

    fireEvent.click(screen.getByRole('button', { name: 'Increase thickness' }));

    expect(updateEntityCommand).toHaveBeenCalledTimes(1);
    const [, update] = vi.mocked(updateEntityCommand).mock.calls[0]!;
    const nextSegments = (update.props as DuctRun['props']).segments;
    expect(nextSegments[0]?.insulationThickness).toBe(1);
    expect(nextSegments[1]?.insulationThickness).toBe(1.5);
  });

  it('toggles insulation off for the whole run and shows the no-insulation state', () => {
    const run = createRun();
    run.props.insulationType = 'wrap';
    run.props.insulationThickness = 1.5;
    run.props.segments = run.props.segments.map((segment) => ({
      ...segment,
      insulationType: 'wrap',
      insulationThickness: 1.5,
    }));

    render(<DuctRunInspector entity={run} />);

    fireEvent.click(screen.getByRole('switch', { name: /toggle insulation/i }));

    expect(updateEntityCommand).toHaveBeenCalledTimes(1);
    const [, update] = vi.mocked(updateEntityCommand).mock.calls[0]!;
    const nextProps = update.props as DuctRun['props'];
    expect(nextProps.insulationType).toBeUndefined();
    expect(nextProps.segments.every((segment) => segment.insulationType === undefined)).toBe(true);
  });

  it('shows symmetric end type feedback when start and finish match', () => {
    const run = createRun();
    run.props.startEndType = 'flange';
    run.props.endEndType = 'flange';

    render(<DuctRunInspector entity={run} />);

    expect(screen.getByText(/Both ends are Flange/i)).toBeDefined();
  });
});
