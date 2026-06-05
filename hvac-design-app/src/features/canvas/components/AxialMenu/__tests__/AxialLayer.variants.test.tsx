import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Entity, Fitting } from '@/core/schema';

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

const now = '2026-06-05T00:00:00.000Z';

function fitting(id: string, fittingType: Fitting['props']['fittingType']): Fitting {
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
    },
    calculated: { equivalentLength: 0, pressureLoss: 0 },
  };
}

function setEntities(entities: Entity[]) {
  useEntityStore.setState({
    byId: Object.fromEntries(entities.map((entity) => [entity.id, entity])),
    allIds: entities.map((entity) => entity.id),
  });
}

async function pickFirstLeaf(entity: Fitting, path: string[]) {
  setEntities([entity]);
  render(<AxialLayer />);
  window.dispatchEvent(new CustomEvent('sws:axial-menu-requested', { detail: { entityId: entity.id, x: 120, y: 140 } }));

  for (const label of path) {
    fireEvent.click(await screen.findByRole('menuitem', { name: label }));
  }
}

describe('AxialLayer variant writes', () => {
  beforeEach(() => {
    isEnabledMock.mockReturnValue(true);
    commitEntityPropsMock.mockClear();
    useSelectionStore.setState({ selectedIds: [], selectedSegments: [], hoveredId: null });
    setEntities([]);
  });

  afterEach(() => {
    cleanup();
  });

  it('writes an elbow variant key', async () => {
    const entity = fitting('fit-elbow', 'elbow_90');

    await pickFirstLeaf(entity, ['Radius', 'R1.5']);

    expect(commitEntityPropsMock).toHaveBeenCalledWith(
      entity.id,
      expect.objectContaining({ variant: expect.objectContaining({ elbowType: 'radius', radiusClass: 'R1.5' }) }),
      entity
    );
  });

  it('writes a tee/wye variant key', async () => {
    const entity = fitting('fit-tee', 'tee');

    await pickFirstLeaf(entity, ['Left branch']);

    expect(commitEntityPropsMock).toHaveBeenCalledWith(
      entity.id,
      expect.objectContaining({ variant: expect.objectContaining({ branchSide: 'left' }) }),
      entity
    );
  });

  it('writes a reducer variant key', async () => {
    const entity = fitting('fit-reducer', 'reducer');

    await pickFirstLeaf(entity, ['Eccentric', 'Top']);

    expect(commitEntityPropsMock).toHaveBeenCalledWith(
      entity.id,
      expect.objectContaining({ variant: expect.objectContaining({ eccentricOffset: 'top' }) }),
      entity
    );
  });

  it('writes a transition variant key', async () => {
    const entity = fitting('fit-transition', 'transition_square_to_round');

    await pickFirstLeaf(entity, ['Top aligned']);

    expect(commitEntityPropsMock).toHaveBeenCalledWith(
      entity.id,
      expect.objectContaining({ variant: expect.objectContaining({ transitionAlignment: 'top' }) }),
      entity
    );
  });

  it('writes a takeoff variant key', async () => {
    const entity = fitting('fit-takeoff', 'takeoff');

    await pickFirstLeaf(entity, ['Bellmouth']);

    expect(commitEntityPropsMock).toHaveBeenCalledWith(
      entity.id,
      expect.objectContaining({ variant: expect.objectContaining({ takeoffType: 'bellmouth' }) }),
      entity
    );
  });

  it('resets to the root menu when re-requested for a different fitting while open', async () => {
    const elbow = fitting('fit-elbow-reopen', 'elbow_90');
    const cap = fitting('fit-cap-reopen', 'cap');
    setEntities([elbow, cap]);
    render(<AxialLayer />);

    // Open on the elbow and drill into the Radius submenu (stack depth 2).
    window.dispatchEvent(
      new CustomEvent('sws:axial-menu-requested', { detail: { entityId: elbow.id, x: 10, y: 10 } })
    );
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Radius' }));
    await screen.findByRole('menuitem', { name: 'R1.5' });

    // Re-request for the cap while the menu is still open: it must remount at the
    // cap's root, not keep the elbow's drilled-in radius submenu.
    window.dispatchEvent(
      new CustomEvent('sws:axial-menu-requested', { detail: { entityId: cap.id, x: 10, y: 10 } })
    );
    await screen.findByRole('menuitem', { name: 'Screen' });
    expect(screen.queryByRole('menuitem', { name: 'R1.5' })).toBeNull();
  });

  it('writes a cap variant key', async () => {
    const entity = fitting('fit-cap', 'cap');

    await pickFirstLeaf(entity, ['Screen']);

    expect(commitEntityPropsMock).toHaveBeenCalledWith(
      entity.id,
      expect.objectContaining({ variant: expect.objectContaining({ capType: 'screen' }) }),
      entity
    );
  });
});
