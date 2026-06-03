import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CASContainer } from '../CASContainer';
import {
  executeCasAction,
  getActionsForEntity,
  type CasEntitySnapshot,
} from '../actionRegistry';

vi.mock('@/core/actions/entityActions', () => ({
  commitDuctProperty: vi.fn(),
  commitEntityProps: vi.fn(),
  resetFittingToAuto: vi.fn(),
  setSize: vi.fn(),
}));

vi.mock('@/core/services/connectionPoints/shapeCompatibility', () => ({
  shapeCompatibility: vi.fn(() => 'transition'),
}));

const entityActions = await import('@/core/actions/entityActions');
const compatibility = await import('@/core/services/connectionPoints/shapeCompatibility');

function snapshot(overrides: Partial<CasEntitySnapshot> = {}): CasEntitySnapshot {
  return {
    id: 'entity-1',
    scope: 'duct',
    props: {
      shape: 'rectangular',
      width: 12,
      height: 8,
      length: 10,
      systemType: 'supply',
      material: 'galvanized',
      provenance: { width: 'computed', height: 'specified' },
    },
    ...overrides,
  };
}

describe('CAS hybrid behaviors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses inline-cycle for enums with three or fewer values', () => {
    const actions = getActionsForEntity(snapshot({ scope: 'elbow' }));
    expect(actions.find((action) => action.id === 'elbow-type')?.behavior).toBe('inline-cycle');
  });

  it('uses popover-select for enums with more than three values', () => {
    const actions = getActionsForEntity(snapshot());
    expect(actions.find((action) => action.id === 'duct-material')?.behavior).toBe('popover-select');
  });

  it('uses popover-edit for numeric edits', () => {
    const actions = getActionsForEntity(snapshot());
    expect(actions.find((action) => action.id === 'duct-size')?.behavior).toBe('popover-edit');
  });

  it('renders numeric edits in a popover', () => {
    render(<CASContainer entity={snapshot()} anchorRect={{ x: 10, y: 10, width: 20, height: 20 }} />);
    fireEvent.click(screen.getByRole('button', { name: /edit size/i }));
    expect(screen.getByTestId('popover')).toBeInTheDocument();
    expect(screen.getByLabelText(/width/i)).toBeInTheDocument();
  });
});

describe('CAS action writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes duct size through entityActions.setSize', () => {
    const action = getActionsForEntity(snapshot()).find((item) => item.id === 'duct-size');
    executeCasAction(action!, snapshot(), { width: 14, height: 10 });
    expect(entityActions.setSize).toHaveBeenCalledWith('entity-1', 'width', 14, expect.any(Object), { debounceMs: 0 });
    expect(entityActions.setSize).toHaveBeenCalledWith('entity-1', 'height', 10, expect.any(Object), { debounceMs: 0 });
  });

  it('routes shape changes through shapeCompatibility and commits transition metadata', () => {
    const action = getActionsForEntity(snapshot()).find((item) => item.id === 'duct-shape');
    executeCasAction(action!, snapshot(), 'round');
    expect(compatibility.shapeCompatibility).toHaveBeenCalledWith('rectangular', 'round', true);
    expect(entityActions.commitDuctProperty).toHaveBeenCalledWith(
      'entity-1',
      expect.objectContaining({ shape: 'round', casAutoInsert: 'transition' }),
      expect.any(Object),
      { debounceMs: 0 }
    );
  });

  it('writes fitting variants for all fitting scopes through entityActions.commitEntityProps', () => {
    ['elbow', 'tee_wye', 'reducer', 'transition', 'cap', 'takeoff'].forEach((scope) => {
      const entity = snapshot({ scope: scope as CasEntitySnapshot['scope'], props: { variant: {} } });
      // Each fitting scope exposes at least one variant-writing edit. Most use
      // inline-cycle (≤3 values); transition (alignment) and takeoff (type) use
      // popover-select (>3 values), which requires an explicit value.
      const action = getActionsForEntity(entity).find(
        (item) => item.behavior === 'inline-cycle' || item.behavior === 'popover-select'
      );
      expect(action).toBeDefined();
      const value = action!.behavior === 'popover-select' ? action!.options?.[0]?.value : undefined;
      executeCasAction(action!, entity, value);
    });

    expect(entityActions.commitEntityProps).toHaveBeenCalled();
  });

  it('keeps equipment v1 as inspector-deeplink only', () => {
    const actions = getActionsForEntity(snapshot({ scope: 'equipment' }));
    expect(actions).toHaveLength(1);
    expect(actions[0]?.behavior).toBe('inspector-deeplink');
  });
});
