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
    useSelectionStore.setState({ selectedIds: ['run-1'], selectedSegments: [], hoveredId: null });
    useFabricationProfileStore.persist?.clearStorage?.();
    useFabricationProfileStore.getState().resetProfiles();
  });

  it('renders whole-run summary when no segments are selected', () => {
    render(<DuctRunInspector entity={createRun()} />);

    expect(screen.getByText('Run Summary')).toBeDefined();
    expect(screen.getByText('Total Pieces')).toBeDefined();
    expect(screen.getByDisplayValue('')).toBeDefined();
  });

  it('renders single-segment detail when one segment is selected', () => {
    useSelectionStore.setState({
      selectedIds: ['run-1'],
      selectedSegments: [{ runId: 'run-1', segmentIndex: 2 }],
      hoveredId: null,
    });

    render(<DuctRunInspector entity={createRun()} />);

    expect(screen.getByTestId('duct-run-single-segment-state')).toBeDefined();
    expect(screen.getByText('Partial piece 3')).toBeDefined();
  });

  it('renders multi-segment summary when multiple segments are selected', () => {
    useSelectionStore.setState({
      selectedIds: ['run-1'],
      selectedSegments: [
        { runId: 'run-1', segmentIndex: 0 },
        { runId: 'run-1', segmentIndex: 2 },
      ],
      hoveredId: null,
    });

    render(<DuctRunInspector entity={createRun()} />);

    expect(screen.getByTestId('duct-run-multi-segment-state')).toBeDefined();
    expect(screen.getByText('Multi-Segment Summary')).toBeDefined();
  });

  it('shows the custom badge when an override exists', () => {
    const run = createRun();
    run.props.sectionLengthOverride = 6;

    render(<DuctRunInspector entity={run} />);

    expect(screen.getByText('Custom section rule')).toBeDefined();
  });

  it('routes override edits through the update command', () => {
    render(<DuctRunInspector entity={createRun()} />);

    fireEvent.change(screen.getByTestId('duct-run-section-length-override'), {
      target: { value: '6' },
    });

    expect(updateEntityCommand).toHaveBeenCalledTimes(1);
  });
});
