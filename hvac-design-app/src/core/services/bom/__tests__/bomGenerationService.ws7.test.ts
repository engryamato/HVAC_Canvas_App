import { describe, expect, it } from 'vitest';
import type { Duct, Equipment, Fitting } from '@/core/schema';
import { bomGenerationService } from '../bomGenerationService';
import type { WasteFactors } from '@/core/schema/calculation-settings.schema';

const now = '2026-01-01T00:00:00.000Z';

const wasteFactors: WasteFactors = {
  default: 0.1,
  ducts: 0.1,
  fittings: 0.05,
  equipment: 0.02,
  accessories: 0.08,
};

function duct(id: string, length: number, gauge: number): Duct {
  return {
    id,
    type: 'duct',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: id,
      engineeringSystem: 'standard_duct',
      shape: 'rectangular',
      width: 12,
      height: 8,
      length,
      material: 'galvanized',
      airflow: 1000,
      staticPressure: 0.1,
      serviceId: 'standard-duct',
      catalogItemId: `cat-${gauge}`,
      gauge,
    },
    calculated: { area: 96, velocity: 1500, frictionLoss: 0.01 },
  };
}

describe('WS7 bomGenerationService pricing correctness', () => {
  it('groups duct LF by size, material, and gauge with configured waste', () => {
    const items = bomGenerationService.generateBOM(
      {
        ducts: [duct('duct-1', 10, 24), duct('duct-2', 15, 24), duct('duct-3', 7, 26)],
        fittings: [] as Fitting[],
        equipment: [] as Equipment[],
      },
      wasteFactors,
      { includeAutoInserted: true, applyWasteFactors: true, groupSimilarItems: true }
    );

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.groupKey).sort()).toEqual([
      'duct-rectangular-12x8-galvanized-gauge-24',
      'duct-rectangular-12x8-galvanized-gauge-26',
    ]);
    const gauge24 = items.find((item) => item.groupKey.endsWith('gauge-24'));
    expect(gauge24).toMatchObject({ quantity: 25, gauge: 24, sourceEntityIds: ['duct-1', 'duct-2'] });
    expect(gauge24?.quantityWithWaste).toBeCloseTo(27.5, 6);

    const gauge26 = items.find((item) => item.groupKey.endsWith('gauge-26'));
    expect(gauge26).toMatchObject({ quantity: 7, gauge: 26, sourceEntityIds: ['duct-3'] });
    expect(gauge26?.quantityWithWaste).toBeCloseTo(7.7, 6);
  });
});
