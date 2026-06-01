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

function equivalentRoundDiameter(width: number, height: number): number {
  return 1.3 * Math.pow(width * height, 0.625) / Math.pow(width + height, 0.25);
}

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

    const { unmount } = render(<DuctRunInspector entity={run} />);

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
    expect(nextProps.diameter).toBeCloseTo(equivalentRoundDiameter(24, 12), 3);
    expect('width' in nextProps ? nextProps.width : undefined).toBeUndefined();
  });

  it('renames generated duct runs when the selected shape changes so the canvas label follows', () => {
    const run = createRun();
    run.props.name = 'Rectangular Duct Run 1';

    const { unmount } = render(<DuctRunInspector entity={run} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Round' }));

    expect(updateEntityCommand).toHaveBeenCalledTimes(1);
    const [, update] = vi.mocked(updateEntityCommand).mock.calls[0]!;
    const nextProps = update.props as DuctRun['props'];
    expect(nextProps.shape).toBe('round');
    expect(nextProps.name).toBe('Round Duct Run 1');
  });

  it('preserves custom duct run names when the selected shape changes', () => {
    const run = createRun();
    run.props.name = 'Kitchen Supply Main';

    render(<DuctRunInspector entity={run} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Round' }));

    expect(updateEntityCommand).toHaveBeenCalledTimes(1);
    const [, update] = vi.mocked(updateEntityCommand).mock.calls[0]!;
    const nextProps = update.props as DuctRun['props'];
    expect(nextProps.shape).toBe('round');
    expect(nextProps.name).toBe('Kitchen Supply Main');
  });

  it('uses equivalent round diameter and remembers rectangular size when switching shape families', () => {
    const run = createRun();
    run.props.width = 24;
    run.props.height = 12;

    const { unmount } = render(<DuctRunInspector entity={run} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Round' }));

    expect(updateEntityCommand).toHaveBeenCalledTimes(1);
    let [, update] = vi.mocked(updateEntityCommand).mock.calls[0]!;
    let nextProps = update.props as DuctRun['props'];
    expect(nextProps.shape).toBe('round');
    expect(nextProps.diameter).toBeCloseTo(equivalentRoundDiameter(24, 12), 3);
    expect(nextProps.previousRectangularWidth).toBe(24);
    expect(nextProps.previousRectangularHeight).toBe(12);

    unmount();
    vi.clearAllMocks();
    run.props = {
      ...run.props,
      shape: 'round',
      diameter: 18,
      previousRectangularWidth: 24,
      previousRectangularHeight: 12,
      width: undefined,
      height: undefined,
    } as DuctRun['props'];

    render(<DuctRunInspector entity={run} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Rectangular' }));

    expect(updateEntityCommand).toHaveBeenCalledTimes(1);
    [, update] = vi.mocked(updateEntityCommand).mock.calls[0]!;
    nextProps = update.props as DuctRun['props'];
    expect(nextProps.shape).toBe('rectangular');
    expect('width' in nextProps ? nextProps.width : undefined).toBe(24);
    expect('height' in nextProps ? nextProps.height : undefined).toBe(12);
  });

  it('treats flexible as round geometry while preserving flexible shape type', () => {
    const run = createRun();
    run.props.width = 20;
    run.props.height = 10;

    const { unmount } = render(<DuctRunInspector entity={run} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Flexible' }));

    expect(updateEntityCommand).toHaveBeenCalledTimes(1);
    let [, update] = vi.mocked(updateEntityCommand).mock.calls[0]!;
    let nextProps = update.props as DuctRun['props'];
    expect(nextProps.shape).toBe('flexible');
    expect(nextProps.diameter).toBeCloseTo(equivalentRoundDiameter(20, 10), 3);
    expect(nextProps.previousRectangularWidth).toBe(20);
    expect(nextProps.previousRectangularHeight).toBe(10);

    unmount();
    vi.clearAllMocks();
    run.props = {
      ...run.props,
      shape: 'round',
      diameter: 17,
      width: undefined,
      height: undefined,
    } as DuctRun['props'];

    render(<DuctRunInspector entity={run} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Flexible' }));

    expect(updateEntityCommand).toHaveBeenCalledTimes(1);
    [, update] = vi.mocked(updateEntityCommand).mock.calls[0]!;
    nextProps = update.props as DuctRun['props'];
    expect(nextProps.shape).toBe('flexible');
    expect(nextProps.diameter).toBe(17);
  });

  it('offers every duct shape and hydrates the selected canvas duct from the shape buttons', () => {
    const run = createRun();
    run.props.name = 'Rectangular Duct Run 1';

    render(<DuctRunInspector entity={run} />);

    expect(screen.getByRole('radio', { name: 'Round' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Rectangular' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Flat Oval' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Flexible' })).toBeDefined();

    fireEvent.click(screen.getByRole('radio', { name: 'Flat Oval' }));

    let [, update] = vi.mocked(updateEntityCommand).mock.calls[0]!;
    let nextProps = update.props as DuctRun['props'];
    expect(nextProps.shape).toBe('flat_oval');
    expect(nextProps.name).toBe('Flat Oval Duct Run 1');
    expect('width' in nextProps ? nextProps.width : undefined).toBe(24);
    expect('height' in nextProps ? nextProps.height : undefined).toBe(12);
    expect('diameter' in nextProps ? nextProps.diameter : undefined).toBeUndefined();

    vi.clearAllMocks();
    fireEvent.click(screen.getByRole('radio', { name: 'Flexible' }));

    [, update] = vi.mocked(updateEntityCommand).mock.calls[0]!;
    nextProps = update.props as DuctRun['props'];
    expect(nextProps.shape).toBe('flexible');
    expect(nextProps.name).toBe('Flexible Duct Run 1');
    expect(nextProps.material).toBe('flex');
    expect(nextProps.diameter).toBeCloseTo(equivalentRoundDiameter(24, 12), 3);
    expect('width' in nextProps ? nextProps.width : undefined).toBeUndefined();
    expect('height' in nextProps ? nextProps.height : undefined).toBeUndefined();
  });

  it('hydrates rectangular shape back onto a selected round duct', () => {
    const run = createRun();
    run.props = {
      ...run.props,
      name: 'Round Duct Run 1',
      shape: 'round',
      diameter: 14,
      previousRectangularWidth: 24,
      previousRectangularHeight: 12,
      width: undefined,
      height: undefined,
    } as DuctRun['props'];

    render(<DuctRunInspector entity={run} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Rectangular' }));

    expect(updateEntityCommand).toHaveBeenCalledTimes(1);
    const [, update] = vi.mocked(updateEntityCommand).mock.calls[0]!;
    const nextProps = update.props as DuctRun['props'];
    expect(nextProps.shape).toBe('rectangular');
    expect(nextProps.name).toBe('Rectangular Duct Run 1');
    expect('width' in nextProps ? nextProps.width : undefined).toBe(24);
    expect('height' in nextProps ? nextProps.height : undefined).toBe(12);
    expect('diameter' in nextProps ? nextProps.diameter : undefined).toBeUndefined();
  });

  it('shows section length and run length below the duct size controls', () => {
    const run = createRun();

    render(<DuctRunInspector entity={run} />);

    const sectionLength = screen.getByLabelText('Section Length');
    const runLength = screen.getByLabelText('Run Length');

    expect(sectionLength).toBeDefined();
    expect(runLength).toBeDefined();
    expect(screen.queryByLabelText('Segment Length')).toBeNull();
    expect((sectionLength as HTMLInputElement).value).toBe('5');
    expect((runLength as HTMLInputElement).value).toBe('13');
  });

  it('updates section length as the repeated duct piece length and recomputes persisted segments', () => {
    const run = createRun();

    render(<DuctRunInspector entity={run} />);

    fireEvent.change(screen.getByLabelText('Section Length'), {
      target: { value: '7.5' },
    });

    expect(updateEntityCommand).toHaveBeenCalledTimes(1);
    const [, update] = vi.mocked(updateEntityCommand).mock.calls[0]!;
    const nextProps = update.props as DuctRun['props'];
    expect(nextProps.sectionLengthOverride).toBe(7.5);
    expect(nextProps.installLength).toBe(13);
    expect(nextProps.segments.map((segment) => segment.length)).toEqual([7.5, 5.5]);
    expect(nextProps.segments.map((segment) => segment.startStation)).toEqual([0, 7.5]);
    expect(nextProps.segments.map((segment) => segment.endStation)).toEqual([7.5, 13]);
  });

  it('updates run length as the total duct run length', () => {
    const run = createRun();

    render(<DuctRunInspector entity={run} />);

    fireEvent.change(screen.getByLabelText('Run Length'), {
      target: { value: '18.5' },
    });

    expect(updateEntityCommand).toHaveBeenCalledTimes(1);
    const [, update] = vi.mocked(updateEntityCommand).mock.calls[0]!;
    const nextProps = update.props as DuctRun['props'];
    expect(nextProps.installLength).toBe(18.5);
    expect(nextProps.segments.map((segment) => segment.length)).toEqual([5, 5, 5, 3.5]);
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
