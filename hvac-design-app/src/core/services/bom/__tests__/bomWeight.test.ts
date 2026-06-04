import { describe, expect, it } from 'vitest';
import type { Duct, Equipment, Fitting } from '../../../schema';
import type { WasteFactors } from '../../../schema/calculation-settings.schema';
import { bomGenerationService } from '../bomGenerationService';

const now = '2026-01-01T00:00:00.000Z';

const wasteFactors: WasteFactors = {
  default: 0.1,
  ducts: 0.1,
  fittings: 0.05,
  equipment: 0.02,
  accessories: 0.08,
};

function duct(id: string, surfaceArea: number, weight: number): Duct {
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
      length: 10,
      material: 'galvanized',
      airflow: 1000,
      staticPressure: 0.1,
      serviceId: 'standard-duct',
      catalogItemId: 'cat-24',
      gauge: 24,
    },
    calculated: {
      area: 96,
      velocity: 1500,
      frictionLoss: 0.01,
      surfaceArea,
      weight,
    },
  };
}

describe('bomGenerationService duct calculated weight fields', () => {
  it('carries duct surface area and weight onto the BOM item', () => {
    const items = bomGenerationService.generateBOM(
      {
        ducts: [duct('duct-1', 33.25, 18.75)],
        fittings: [] as Fitting[],
        equipment: [] as Equipment[],
      },
      wasteFactors,
      { includeAutoInserted: true, applyWasteFactors: true, groupSimilarItems: false }
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      category: 'duct',
      surfaceAreaSquareFeet: 33.25,
      weightPounds: 18.75,
    });
  });

  it('sums weight for same-group ducts during aggregation', () => {
    const items = bomGenerationService.generateBOM(
      {
        ducts: [duct('duct-1', 33.25, 18.75), duct('duct-2', 12.5, 7.25)],
        fittings: [] as Fitting[],
        equipment: [] as Equipment[],
      },
      wasteFactors,
      { includeAutoInserted: true, applyWasteFactors: true, groupSimilarItems: true }
    );

    expect(items).toHaveLength(1);
    expect(items[0].sourceEntityIds).toEqual(['duct-1', 'duct-2']);
    expect(items[0].weightPounds).toBeCloseTo(26, 6);
  });
});
