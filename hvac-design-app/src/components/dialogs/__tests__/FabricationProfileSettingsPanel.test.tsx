import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FabricationProfileSettingsPanel } from '../FabricationProfileSettingsPanel';
import { useFabricationProfileStore } from '@/core/store/fabricationProfileStore';
import { useEntityStore } from '@/core/store/entityStore';
import type { DuctRun } from '@/core/schema';

function createRun(id: string, override?: number): DuctRun {
  return {
    id,
    type: 'duct_run',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 5,
    createdAt: '2026-05-01T00:00:00.000Z',
    modifiedAt: '2026-05-01T00:00:00.000Z',
    calculated: { area: 100, velocity: 800, frictionLoss: 0.1 },
    props: {
      name: id,
      engineeringSystem: 'standard_duct',
      shape: 'rectangular',
      width: 24,
      height: 12,
      material: 'galvanized',
      airflow: 1200,
      staticPressure: 0.3,
      installLength: 13,
      sectionLengthOverride: override,
      segments: [
        { index: 0, startStation: 0, endStation: 5, length: 5, isPartial: false },
        { index: 1, startStation: 5, endStation: 10, length: 5, isPartial: false },
        { index: 2, startStation: 10, endStation: 13, length: 3, isPartial: true },
      ],
    },
  };
}

describe('FabricationProfileSettingsPanel', () => {
  function getRectangularDefaultInput() {
    return document.getElementById('rectangular_rigid-default') as HTMLInputElement;
  }

  function getRectangularAllowedInput() {
    return document.getElementById('rectangular_rigid-allowed') as HTMLInputElement;
  }

  beforeEach(() => {
    useFabricationProfileStore.persist?.clearStorage?.();
    useFabricationProfileStore.getState().resetProfiles();
    useEntityStore.getState().clearAllEntities();
  });

  it('cancels local edits back to committed settings', () => {
    render(<FabricationProfileSettingsPanel />);

    const rectangularDefault = getRectangularDefaultInput();
    fireEvent.change(rectangularDefault, { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(rectangularDefault.value).toBe('5');
  });

  it('resets the draft form to defaults', () => {
    render(<FabricationProfileSettingsPanel />);
    fireEvent.change(getRectangularDefaultInput(), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }));

    expect(getRectangularDefaultInput().value).toBe('5');
  });

  it('switches between fabrication families with tabs instead of rendering a full stacked form', () => {
    render(<FabricationProfileSettingsPanel />);

    const rectangularTab = screen.getByRole('tab', { name: 'Rectangular' });
    const roundTab = screen.getByRole('tab', { name: 'Round Rigid' });

    expect(rectangularTab.getAttribute('data-state')).toBe('active');

    fireEvent.click(roundTab);

    expect(roundTab.getAttribute('data-state')).toBe('active');
    expect(rectangularTab.getAttribute('data-state')).toBe('inactive');
  });

  it('recomputes non-overridden runs on save and leaves overrides unchanged', () => {
    useEntityStore.getState().addEntities([createRun('global-run'), createRun('override-run', 7)]);
    render(<FabricationProfileSettingsPanel />);

    fireEvent.change(getRectangularDefaultInput(), {
      target: { value: '6' },
    });
    fireEvent.change(getRectangularAllowedInput(), {
      target: { value: '4, 5, 6, 8, 10' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    const globalRun = useEntityStore.getState().byId['global-run'] as DuctRun;
    const overrideRun = useEntityStore.getState().byId['override-run'] as DuctRun;

    expect(globalRun.props.segments).toHaveLength(3);
    expect(globalRun.props.segments[2]?.length).toBe(1);
    expect(overrideRun.props.segments[2]?.length).toBe(3);
  });
});
