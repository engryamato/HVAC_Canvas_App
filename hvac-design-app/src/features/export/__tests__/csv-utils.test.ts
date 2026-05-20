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
    expect(items[0]?.name).toBe('ACME X1');
  });

  it('groups identical ducts and formats the duct description', () => {
    const items = generateBillOfMaterials({
      byId: {
        'duct-1': {
          id: 'duct-1',
          type: 'duct_run',
          props: { shape: 'rectangular', width: 12, height: 8, installLength: 5 },
        },
        'duct-2': {
          id: 'duct-2',
          type: 'duct_run',
          props: { shape: 'rectangular', width: 12, height: 8, installLength: 5 },
        },
      },
      allIds: ['duct-1', 'duct-2'],
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: 'Duct',
      description: 'Rectangular Duct 12" x 8" 5\'',
      quantity: 2,
      unit: 'EA',
    });
  });

  it('groups identical fittings and hides technical fitting ids from descriptions', () => {
    const items = generateBillOfMaterials({
      byId: {
        'fit-1': { id: 'fit-1', type: 'fitting', props: { fittingType: 'elbow_90' } },
        'fit-2': { id: 'fit-2', type: 'fitting', props: { fittingType: 'elbow_90' } },
      },
      allIds: ['fit-1', 'fit-2'],
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: 'Fitting',
      description: '90\u00b0 Elbow',
      quantity: 2,
      unit: 'EA',
    });
    expect(items[0]?.description).not.toContain('elbow_90');
  });

  it('includes ducts, fittings, and accessories in the BOM', () => {
    const items = generateBillOfMaterials({
      byId: {
        'duct-1': {
          id: 'duct-1',
          type: 'duct_run',
          props: { shape: 'round', diameter: 10, installLength: 8 },
        },
        'fit-1': { id: 'fit-1', type: 'fitting', props: { fittingType: 'tee' } },
        'damper-1': { id: 'damper-1', type: 'damper', props: { name: 'Balancing Damper' } },
      },
      allIds: ['duct-1', 'fit-1', 'damper-1'],
    });

    expect(items.map((item) => item.type)).toEqual(['Duct', 'Fitting', 'Accessory']);
    expect(items.map((item) => item.description)).toEqual([
      'Round Duct 10" 8\'',
      'Tee',
      'Balancing Damper',
    ]);
  });
});
