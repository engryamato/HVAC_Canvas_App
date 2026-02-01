import { describe, it, expect } from 'vitest';
import { exportBOMtoCSV, generateBillOfMaterials } from '../csv';

describe('csv helpers', () => {
  it('exportBOMtoCSV outputs UTF-8 BOM and escapes quotes', () => {
    const csv = exportBOMtoCSV([
      {
        category: 'duct',
        subcategory: 'Round Duct',
        description: 'Main "Supply" Duct',
        quantity: 10,
        unit: 'LF',
        size: '12"',
        material: 'galvanized',
      },
    ]);

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"Main ""Supply"" Duct"');
  });

  it('generateBillOfMaterials skips rooms and includes equipment model', () => {
    const items = generateBillOfMaterials({
      byId: {
        'room-1': { type: 'room', props: { name: 'Room' } },
        'equip-1': {
          type: 'equipment',
          props: { name: 'Fan', manufacturer: 'ACME', model: 'X1' },
        },
      },
      allIds: ['room-1', 'equip-1'],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.type).toBe('Equipment');
    expect(items[0]?.name).toBe('Fan');
  });
});
