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
      description: '12"x8"x5\' Rectangular Duct Flange Ends',
      quantity: 2,
      unit: 'EA',
    });
  });

  it('formats flat oval duct segment descriptions with mixed ends and wrapper insulation', () => {
    const items = generateBillOfMaterials({
      byId: {
        'duct-1': {
          id: 'duct-1',
          type: 'duct_run',
          props: {
            shape: 'flat_oval',
            width: 13.2,
            height: 7.1,
            installLength: 9.4,
            startEndType: 'flange',
            endEndType: 'raw',
            insulationType: 'wrap',
            insulationThickness: 1.5,
            segments: [
              {
                index: 0,
                startStation: 0,
                endStation: 9.4,
                length: 9.4,
                isPartial: false,
              },
            ],
          },
        },
      },
      allIds: ['duct-1'],
    });

    expect(items[0]).toMatchObject({
      type: 'Duct',
      description: '13"x7"x9\' Flat Oval Duct Flange by Raw End 1.5" Wrapper',
      specifications: '13"x7"',
    });
  });

  it('uses segment length and groups matching duct segments by actual segment quantity', () => {
    const items = generateBillOfMaterials({
      byId: {
        'duct-1': {
          id: 'duct-1',
          type: 'duct_run',
          props: {
            shape: 'rectangular',
            width: 12,
            height: 8,
            installLength: 20,
            startEndType: 'raw',
            endEndType: 'raw',
            segments: [
              { index: 0, startStation: 0, endStation: 5, length: 5, isPartial: false },
              { index: 1, startStation: 5, endStation: 10, length: 5, isPartial: false },
              { index: 2, startStation: 10, endStation: 15, length: 5, isPartial: false },
              { index: 3, startStation: 15, endStation: 20, length: 5, isPartial: false },
            ],
          },
        },
      },
      allIds: ['duct-1'],
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: 'Duct',
      description: '12"x8"x5\' Rectangular Duct Raw Ends',
      quantity: 4,
      unit: 'EA',
    });
  });

  it('does not display positive partial duct segments as zero length', () => {
    const items = generateBillOfMaterials({
      byId: {
        'duct-1': {
          id: 'duct-1',
          type: 'duct_run',
          props: {
            shape: 'round',
            diameter: 13,
            installLength: 5.4,
            startEndType: 'flange',
            endEndType: 'coupled',
            segments: [
              { index: 0, startStation: 0, endStation: 5, length: 5, isPartial: false },
              { index: 1, startStation: 5, endStation: 5.4, length: 0.4, isPartial: true },
            ],
          },
        },
      },
      allIds: ['duct-1'],
    });

    expect(items.map((item) => item.description)).toEqual([
      '⌀13"x5\' Round Duct Flange by Coupled End',
      '⌀13"x1\' Round Duct Flange by Coupled End',
    ]);
  });

  it('formats round duct segment descriptions with diameter, length, and liner insulation', () => {
    const items = generateBillOfMaterials({
      byId: {
        'duct-1': {
          id: 'duct-1',
          type: 'duct_run',
          props: {
            shape: 'flexible',
            diameter: 9.6,
            installLength: 7.4,
            startEndType: 'raw',
            endEndType: 'coupled',
            insulationType: 'liner',
            insulationThickness: 1.5,
          },
        },
      },
      allIds: ['duct-1'],
    });

    expect(items[0]).toMatchObject({
      type: 'Duct',
      description: '⌀10"x7\' Flexible Duct Raw by Coupled End 1.5" Liner',
      specifications: '⌀10"',
    });
  });

  it('formats double wall duct segment descriptions', () => {
    const items = generateBillOfMaterials({
      byId: {
        'duct-1': {
          id: 'duct-1',
          type: 'duct_run',
          props: {
            shape: 'round',
            diameter: 12,
            installLength: 5,
            startEndType: 'flange',
            endEndType: 'flange',
            insulationType: 'double_wall_perforated',
            insulationThickness: 2,
          },
        },
      },
      allIds: ['duct-1'],
    });

    expect(items[0]).toMatchObject({
      type: 'Duct',
      description: '⌀12"x5\' Round Duct Flange Ends Double Wall Perforated 2"',
    });
  });

  it('formats fitting BOM descriptions from connected duct metadata', () => {
    const items = generateBillOfMaterials({
      byId: {
        'duct-1': {
          id: 'duct-1',
          type: 'duct_run',
          props: {
            shape: 'round',
            diameter: 11.2,
            installLength: 8,
            startEndType: 'flange',
            endEndType: 'coupled',
            insulationType: 'liner',
            insulationThickness: 0.75,
          },
        },
        'fit-1': {
          id: 'fit-1',
          type: 'fitting',
          props: { fittingType: 'elbow_90', inletDuctId: 'duct-1', outletDuctId: 'duct-1' },
        },
      },
      allIds: ['duct-1', 'fit-1'],
    });

    expect(items[1]).toMatchObject({
      type: 'Fitting',
      description: '⌀11" Round 90° Elbow Flange by Coupled End 0.75" Liner',
      specifications: '⌀11"',
    });
  });

  it('formats transition fittings with inlet to outlet geometry', () => {
    const items = generateBillOfMaterials({
      byId: {
        'fit-1': {
          id: 'fit-1',
          type: 'fitting',
          props: {
            fittingType: 'transition_square_to_round',
            transitionData: {
              fromShape: 'rectangular',
              fromWidth: 24,
              fromHeight: 24,
              toShape: 'round',
              toDiameter: 18,
            },
            startEndType: 'flange',
            endEndType: 'flange',
          },
        },
        'fit-2': {
          id: 'fit-2',
          type: 'fitting',
          props: {
            fittingType: 'reducer',
            transitionData: {
              fromShape: 'round',
              fromDiameter: 12,
              toShape: 'round',
              toDiameter: 10,
            },
            startEndType: 'raw',
            endEndType: 'raw',
          },
        },
      },
      allIds: ['fit-1', 'fit-2'],
    });

    expect(items.map((item) => item.description)).toEqual([
      '24"x24" Rectangular to ⌀18" Round Transition Flange Ends',
      '⌀12" to ⌀10" Round Reducer Raw Ends',
    ]);
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
      '⌀10"x8\' Round Duct Flange Ends',
      'Tee',
      'Balancing Damper',
    ]);
  });
});
