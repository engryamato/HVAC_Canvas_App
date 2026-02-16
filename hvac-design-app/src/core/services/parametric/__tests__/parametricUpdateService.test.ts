import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parametricUpdateService } from '../parametricUpdateService';
import type { Duct, Fitting } from '@/core/schema';
import type { EngineeringLimits } from '@/core/schema/calculation-settings.schema';

const limits: EngineeringLimits = {
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

function createDuct(id: string): Duct {
  return {
    id,
    type: 'duct',
    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    props: {
      name: `Duct ${id}`,
      shape: 'round',
      diameter: 12,
      length: 20,
      material: 'galvanized',
      airflow: 1000,
      staticPressure: 0.1,
    },
    calculated: {
      area: 113.1,
      velocity: 1273,
      frictionLoss: 0.03,
    },
  };
}

function createFitting(id: string, ductId: string): Fitting {
  return {
    id,
    type: 'fitting',
    transform: { x: 10, y: 10, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 2,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    props: {
      fittingType: 'elbow_90',
      inletDuctId: ductId,
      autoInserted: true,
    },
    calculated: {
      equivalentLength: 30,
      pressureLoss: 0.01,
    },
  };
}

describe('parametricUpdateService scheduling and cascade', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('debounces input mode and resolves only latest payload', async () => {
    const duct = createDuct('duct-1');
    const firstPromise = parametricUpdateService.scheduleDuctPropertyChange(
      duct.id,
      { airflow: 1200 },
      { ducts: [duct], fittings: [] },
      limits,
      'input',
      500
    );

    const secondPromise = parametricUpdateService.scheduleDuctPropertyChange(
      duct.id,
      { airflow: 2000 },
      { ducts: [duct], fittings: [] },
      limits,
      'input',
      500
    );

    vi.advanceTimersByTime(500);

    const [first, second] = await Promise.all([firstPromise, secondPromise]);
    expect(first.updatedEntities).toHaveLength(0);
    expect(second.updatedEntities).toContain('duct-1');
    expect(second.engineeringData?.airflow).toBe(2000);
  });

  it('runs immediately in drag mode', async () => {
    const duct = createDuct('duct-1');
    const result = await parametricUpdateService.scheduleDuctPropertyChange(
      duct.id,
      { airflow: 1500 },
      { ducts: [duct], fittings: [] },
      limits,
      'drag',
      500
    );

    expect(result.updatedEntities).toContain('duct-1');
    expect(result.engineeringData?.airflow).toBe(1500);
  });

  it('generates cascade entity updates including connected fittings', () => {
    const duct = createDuct('duct-1');
    const fitting = createFitting('fit-1', duct.id);

    const result = parametricUpdateService.handleDuctPropertyChange(
      duct.id,
      { diameter: 14 },
      { ducts: [duct], fittings: [fitting] },
      limits
    );

    expect(result.updatedEntities).toContain('duct-1');
    expect(result.updatedEntities).toContain('fit-1');
    expect(result.entityUpdates?.length).toBe(2);
    expect(result.entityUpdates?.some((update) => update.id === 'fit-1')).toBe(true);
  });
});
