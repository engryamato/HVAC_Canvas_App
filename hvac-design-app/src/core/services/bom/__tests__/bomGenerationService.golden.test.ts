import { describe, expect, it } from 'vitest';
import type { Duct, Equipment, Fitting } from '@/core/schema';
import { bomGenerationService } from '../bomGenerationService';
import { sourceNotes, wasteFactors } from '../../calculations/__tests__/goldenFixtures';

const now = '2026-01-01T00:00:00.000Z';

function duct(id: string, length: number): Duct {
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
      shape: 'round',
      diameter: 12,
      length,
      material: 'galvanized',
      airflow: 1000,
      staticPressure: 0.1,
    },
    calculated: { area: Math.PI * 6 ** 2, velocity: 1273.2395447351628, frictionLoss: 0.01 },
  };
}

function fitting(id: string, fittingType: Fitting['props']['fittingType']): Fitting {
  return {
    id,
    type: 'fitting',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: now,
    modifiedAt: now,
    props: { engineeringSystem: 'standard_duct', fittingType, autoInserted: true, manualOverride: false },
    calculated: { equivalentLength: 10, pressureLoss: 0 },
  };
}

describe('WS9 golden bomGenerationService', () => {
  it('aggregates duct LF and fitting EA with configured waste by group', () => {
    expect(sourceNotes.bom).toContain('waste');
    const items = bomGenerationService.generateBOM(
      {
        ducts: [duct('duct-1', 10), duct('duct-2', 15)],
        fittings: [fitting('fit-1', 'tee')],
        equipment: [] as Equipment[],
      },
      wasteFactors,
      { includeAutoInserted: true, applyWasteFactors: true, groupSimilarItems: true }
    );

    const ductItem = items.find((item) => item.category === 'duct');
    const fittingItem = items.find((item) => item.category === 'fitting');

    expect(ductItem).toMatchObject({
      description: '12" galvanized round duct',
      quantity: 25,
      unit: 'LF',
      wasteFactor: 0.1,
      quantityWithWaste: 27.5,
      sourceEntityIds: ['duct-1', 'duct-2'],
    });
    expect(fittingItem).toMatchObject({
      description: 'tee fitting',
      quantity: 1,
      unit: 'EA',
      wasteFactor: 0.05,
      quantityWithWaste: 1.05,
      sourceEntityIds: ['fit-1'],
    });
  });
});
