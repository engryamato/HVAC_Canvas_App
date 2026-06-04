import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Duct, Entity, Fitting } from '@/core/schema';
import type { EngineeringLimits } from '@/core/schema/calculation-settings.schema';
import { useEntityStore } from '@/core/store/entityStore';
import { parametricUpdateService } from '@/core/services/parametric/parametricUpdateService';
import { fittingInsertionService } from '@/core/services/automation/fittingInsertionService';
import { updateEntities, updateEntity } from '@/core/commands/entityCommands';
import {
  commitDuctProperty,
  commitEntityProps,
  entityActionRegistry,
  resetFittingToAuto,
  setSize,
  validateAndGate,
  type EntityActionContext,
} from '../entityActions';

vi.mock('@/core/commands/entityCommands', () => ({
  updateEntities: vi.fn(),
  updateEntity: vi.fn(),
}));

vi.mock('@/core/services/parametric/parametricUpdateService', () => ({
  parametricUpdateService: {
    scheduleDuctPropertyChange: vi.fn(),
  },
}));

vi.mock('@/core/services/automation/fittingInsertionService', () => ({
  fittingInsertionService: {
    planManualOverrideReset: vi.fn(),
  },
}));

const engineeringLimits: EngineeringLimits = {
  maxVelocity: { supply: 2500, return: 2000, exhaust: 2000 },
  minVelocity: { supply: 600, return: 500, exhaust: 500 },
  maxPressureDrop: { supply: 0.1, return: 0.08, exhaust: 0.08 },
  frictionFactors: {
    galvanized: 0.0005,
    stainless: 0.00015,
    flexible: 0.003,
    fiberglass: 0.0003,
  },
  standardConditions: {
    temperature: 70,
    pressure: 29.92,
    altitude: 0,
  },
};

function createDuct(overrides: Partial<Duct['props']> = {}): Duct {
  return {
    id: 'duct-1',
    type: 'duct',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    props: {
      engineeringSystem: 'standard_duct',
      name: 'Duct 1',
      shape: 'round',
      diameter: 12,
      length: 20,
      material: 'galvanized',
      airflow: 1000,
      staticPressure: 0.1,
      ...overrides,
    },
    calculated: {
      area: 113.1,
      velocity: 1273,
      frictionLoss: 0.03,
    },
  };
}

function createFitting(): Fitting {
  return {
    id: 'fit-1',
    type: 'fitting',
    transform: { x: 10, y: 5, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 2,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    props: {
      engineeringSystem: 'standard_duct',
      fittingType: 'elbow_90',
      inletDuctId: 'duct-1',
      autoInserted: true,
      manualOverride: true,
    },
    calculated: {
      equivalentLength: 15,
      pressureLoss: 0.01,
    },
  };
}

function createContext(validateField = vi.fn(() => true)): EntityActionContext {
  return {
    engineeringLimits,
    validateField,
  };
}

describe('entityActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEntityStore.getState().clearAllEntities();
  });

  it('validateAndGate delegates to the supplied validator', () => {
    const duct = createDuct();
    const validateField = vi.fn(() => false);
    const result = validateAndGate('diameter', duct, createContext(validateField));

    expect(result).toBe(false);
    expect(validateField).toHaveBeenCalledWith('diameter', duct);
  });

  it('commitDuctProperty stops before parametric work when validation fails', async () => {
    const duct = createDuct();
    useEntityStore.getState().addEntity(duct);

    await commitDuctProperty(duct.id, { airflow: 1200 }, createContext(vi.fn(() => false)));

    expect(parametricUpdateService.scheduleDuctPropertyChange).not.toHaveBeenCalled();
    expect(updateEntity).not.toHaveBeenCalled();
    expect(updateEntities).not.toHaveBeenCalled();
  });

  it('commitDuctProperty schedules with debounce and dispatches batched entity updates', async () => {
    const duct = createDuct();
    const fitting = createFitting();
    const entityUpdates = [
      {
        id: duct.id,
        previous: duct,
        updates: { props: { ...duct.props, airflow: 1200 }, modifiedAt: '2025-01-01T00:00:01.000Z' },
      },
    ];
    useEntityStore.getState().addEntities([duct, fitting]);
    vi.mocked(parametricUpdateService.scheduleDuctPropertyChange).mockResolvedValue({
      updatedEntities: [duct.id],
      violations: [],
      requiresUserAction: false,
      entityUpdates,
    });

    await commitDuctProperty(duct.id, { airflow: 1200 }, createContext(), { debounceMs: 25 });

    expect(parametricUpdateService.scheduleDuctPropertyChange).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(parametricUpdateService.scheduleDuctPropertyChange).mock.calls[0];
    expect(callArgs[0]).toBe(duct.id);
    expect(callArgs[1]).toEqual({ airflow: 1200 });
    const connected = callArgs[2] as { ducts: Array<{ id: string }>; fittings: Array<{ id: string }> };
    expect(connected.ducts.map((d) => d.id)).toEqual([duct.id]);
    expect(connected.fittings.map((f) => f.id)).toEqual([fitting.id]);
    expect(callArgs[3]).toBe(engineeringLimits);
    expect(callArgs[4]).toBe('input');
    expect(callArgs[5]).toBe(25);
    expect(updateEntities).toHaveBeenCalledWith(entityUpdates);
    expect(updateEntity).not.toHaveBeenCalled();
  });

  it('commitDuctProperty falls back to a single entity update with a deep previous snapshot', async () => {
    const duct = createDuct({ airflow: 1000 });
    useEntityStore.getState().addEntity(duct);
    vi.mocked(parametricUpdateService.scheduleDuctPropertyChange).mockResolvedValue({
      updatedEntities: [duct.id],
      violations: [],
      requiresUserAction: false,
      entityUpdates: [],
    });

    await commitDuctProperty(duct.id, { airflow: 1400 }, createContext(), { debounceMs: 0 });

    expect(updateEntity).toHaveBeenCalledTimes(1);
    const [id, updates, previous] = vi.mocked(updateEntity).mock.calls[0];
    expect(id).toBe(duct.id);
    expect(updates).toMatchObject({ props: { ...duct.props, airflow: 1400 } });
    expect(typeof updates.modifiedAt).toBe('string');
    // The committed pipeline derives construction (gauge/surfaceArea/weight) when
    // the duct is added, so `previous` snapshots the derived stored entity — it
    // must deep-equal current state but be a distinct clone (not the same ref).
    const stored = useEntityStore.getState().byId[duct.id];
    expect(previous).toEqual(stored);
    expect(previous).not.toBe(stored);
  });

  it('commitEntityProps wraps direct updateEntity dispatch', () => {
    const duct = createDuct();
    const nextProps = { ...duct.props, diameter: 14 };

    commitEntityProps(duct.id, nextProps, duct, { selectionBefore: ['duct-1'], selectionAfter: ['duct-1'] });

    expect(updateEntity).toHaveBeenCalledWith(
      duct.id,
      { props: nextProps, modifiedAt: expect.any(String) },
      duct,
      { selectionBefore: ['duct-1'], selectionAfter: ['duct-1'] }
    );
  });

  it('setSize marks provenance and dispatches one batched undoable update', async () => {
    const duct = createDuct({
      shape: 'rectangular',
      width: 12,
      height: 8,
      provenance: { width: 'computed', height: 'default' },
    });
    useEntityStore.getState().addEntity(duct);
    vi.mocked(parametricUpdateService.scheduleDuctPropertyChange).mockImplementation(
      async (_id, changedProps) => ({
        updatedEntities: [duct.id],
        violations: [],
        requiresUserAction: false,
        entityUpdates: [
          {
            id: duct.id,
            previous: duct,
            updates: { props: changedProps as Duct['props'], modifiedAt: '2025-01-01T00:00:01.000Z' },
          },
        ],
      })
    );

    await setSize(duct.id, 'height', 10, createContext(), { debounceMs: 0 });

    expect(parametricUpdateService.scheduleDuctPropertyChange).toHaveBeenCalledTimes(1);
    const nextProps = vi.mocked(parametricUpdateService.scheduleDuctPropertyChange).mock.calls[0][1];
    expect(nextProps.provenance?.height).toBe('specified');
    expect(nextProps.provenance?.width).toBe('computed');
    expect(nextProps.width).not.toBe(12);
    expect(updateEntities).toHaveBeenCalledTimes(1);
    expect(updateEntity).not.toHaveBeenCalled();
  });

  it('resetFittingToAuto plans and dispatches the reset update', () => {
    const previous = createFitting();
    const next = {
      ...previous,
      props: { ...previous.props, manualOverride: false },
      modifiedAt: '2025-01-01T00:00:01.000Z',
    };
    vi.mocked(fittingInsertionService.planManualOverrideReset).mockReturnValue({ previous, next });

    const acted = resetFittingToAuto(previous.id, { [previous.id]: previous } as Record<string, Entity>);

    expect(acted).toBe(true);
    expect(fittingInsertionService.planManualOverrideReset).toHaveBeenCalledWith(previous.id, { [previous.id]: previous });
    expect(updateEntity).toHaveBeenCalledWith(
      next.id,
      { props: next.props, transform: next.transform, modifiedAt: next.modifiedAt },
      previous,
      { selectionBefore: [previous.id], selectionAfter: [previous.id] }
    );
  });

  it('resetFittingToAuto returns false when no reset plan exists', () => {
    vi.mocked(fittingInsertionService.planManualOverrideReset).mockReturnValue(null);

    expect(resetFittingToAuto('fit-1')).toBe(false);
    expect(updateEntity).not.toHaveBeenCalled();
  });

  it('entityActionRegistry exposes no global actions', () => {
    expect(entityActionRegistry.length).toBeGreaterThan(0);
    expect(entityActionRegistry.every((action) => action.isGlobal === false)).toBe(true);
  });
});
