import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RECTANGULAR_DUCT_RUN_PROPS,
  DEFAULT_ROUND_DUCT_RUN_PROPS,
  DuctEndTypeSchema,
  DuctRunFamilySchema,
  DuctRunPropsSchema,
  DuctRunSchema,
  DuctRunShapeSchema,
  InsulationTypeSchema,
} from '../duct-run.schema';

describe('DuctRunFamilySchema', () => {
  it('should accept all supported duct-run families', () => {
    const families = ['standard_duct', 'standard_duct', 'standard_duct', 'standard_duct'];
    families.forEach((family) => {
      expect(DuctRunFamilySchema.parse(family)).toBe(family);
    });
  });

  it('should reject unsupported families', () => {
    expect(() => DuctRunFamilySchema.parse('universal')).toThrow();
  });
});

describe('DuctRunShapeSchema', () => {
  it('should accept all supported duct-run shapes', () => {
    const shapes = ['rectangular', 'round', 'flat_oval', 'flexible'];
    shapes.forEach((shape) => {
      expect(DuctRunShapeSchema.parse(shape)).toBe(shape);
    });
  });
});

describe('DuctRun insulation and end type schemas', () => {
  it('accepts all supported insulation and end type values', () => {
    expect(InsulationTypeSchema.options).toEqual([
      'liner',
      'wrap',
      'double_wall_perforated',
      'double_wall_non_perforated',
    ]);
    expect(DuctEndTypeSchema.options).toEqual(['flange', 'raw', 'crimped', 'coupled']);
  });
});

describe('DuctRunPropsSchema', () => {
  it('should validate round runs with embedded segments', () => {
    expect(DuctRunPropsSchema.parse(DEFAULT_ROUND_DUCT_RUN_PROPS)).toBeTruthy();
  });

  it('should validate rectangular runs with embedded segments', () => {
    expect(DuctRunPropsSchema.parse(DEFAULT_RECTANGULAR_DUCT_RUN_PROPS)).toBeTruthy();
  });

  it('defaults segment insulation and end types from run-level defaults', () => {
    const result = DuctRunPropsSchema.parse({
      ...DEFAULT_RECTANGULAR_DUCT_RUN_PROPS,
      insulationType: 'wrap',
      insulationThickness: 2,
      startEndType: 'raw',
      endEndType: 'coupled',
      segments: [
        { index: 0, startStation: 0, endStation: 5, length: 5, isPartial: false },
        {
          index: 1,
          startStation: 5,
          endStation: 10,
          length: 5,
          isPartial: false,
          insulationType: 'liner',
          insulationThickness: 1.5,
          startEndType: 'crimped',
          endEndType: 'raw',
        },
      ],
    });

    expect(result.segments[0]).toMatchObject({
      insulationType: 'wrap',
      insulationThickness: 2,
      startEndType: 'raw',
      endEndType: 'coupled',
    });
    expect(result.segments[1]).toMatchObject({
      insulationType: 'liner',
      insulationThickness: 1.5,
      startEndType: 'crimped',
      endEndType: 'raw',
    });
  });

  it('rejects non-wrap insulation on flexible duct segments', () => {
    expect(() =>
      DuctRunPropsSchema.parse({
        ...DEFAULT_ROUND_DUCT_RUN_PROPS,
        shape: 'flexible',
        diameter: 10,
        segments: [
          {
            index: 0,
            startStation: 0,
            endStation: 10,
            length: 10,
            isPartial: false,
            insulationType: 'double_wall_perforated',
          },
        ],
      })
    ).toThrow(/Flexible duct segment insulation can only be factory wrap/);
  });

  it('should validate flat oval runs with width and height', () => {
    const result = DuctRunPropsSchema.parse({
      ...DEFAULT_RECTANGULAR_DUCT_RUN_PROPS,
      shape: 'flat_oval',
      engineeringSystem: 'standard_duct',
    });

    expect(result.shape).toBe('flat_oval');
    expect(result.engineeringSystem).toBe('standard_duct');
  });

  it('should validate flexible runs with diameter', () => {
    const result = DuctRunPropsSchema.parse({
      ...DEFAULT_ROUND_DUCT_RUN_PROPS,
      shape: 'flexible',
      diameter: 14,
      engineeringSystem: 'standard_duct',
    });

    expect(result.shape).toBe('flexible');
    expect(result.engineeringSystem).toBe('standard_duct');
  });

  it('preserves previous rectangular dimensions for round and flexible conversion memory', () => {
    const result = DuctRunPropsSchema.parse({
      ...DEFAULT_ROUND_DUCT_RUN_PROPS,
      shape: 'round',
      diameter: 18.280498391113163,
      previousRectangularWidth: 24,
      previousRectangularHeight: 12,
    });

    expect(result.previousRectangularWidth).toBe(24);
    expect(result.previousRectangularHeight).toBe(12);
  });

  it('should reject round runs without diameter', () => {
    const invalid = { ...DEFAULT_ROUND_DUCT_RUN_PROPS, diameter: undefined };
    expect(() => DuctRunPropsSchema.parse(invalid)).toThrow();
  });

  it('should reject rectangular runs without width', () => {
    const invalid = { ...DEFAULT_RECTANGULAR_DUCT_RUN_PROPS, width: undefined };
    expect(() => DuctRunPropsSchema.parse(invalid)).toThrow();
  });

  it('should reject stale diameter data on rectangular runs', () => {
    const invalid = { ...DEFAULT_RECTANGULAR_DUCT_RUN_PROPS, diameter: 16 };
    expect(() => DuctRunPropsSchema.parse(invalid)).toThrow();
  });

  it('should reject stale rectangular dimensions on round runs', () => {
    const invalid = { ...DEFAULT_ROUND_DUCT_RUN_PROPS, width: 12, height: 8 };
    expect(() => DuctRunPropsSchema.parse(invalid)).toThrow();
  });

  it('should reject non-monotonic segment stations', () => {
    const invalid = {
      ...DEFAULT_ROUND_DUCT_RUN_PROPS,
      installLength: 10,
      segments: [
        { index: 0, startStation: 0, endStation: 6, length: 6, isPartial: false },
        { index: 1, startStation: 5, endStation: 10, length: 5, isPartial: false },
      ],
    };

    expect(() => DuctRunPropsSchema.parse(invalid)).toThrow();
  });

  it('should reject segments that do not reconcile to install length', () => {
    const invalid = {
      ...DEFAULT_ROUND_DUCT_RUN_PROPS,
      installLength: 12,
    };

    expect(() => DuctRunPropsSchema.parse(invalid)).toThrow();
  });
});

describe('DuctRunSchema', () => {
  const validDuctRun = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'duct_run' as const,
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    props: DEFAULT_ROUND_DUCT_RUN_PROPS,
    calculated: { area: 113.1, velocity: 636.6, frictionLoss: 0.05 },
  };

  it('should validate a complete duct-run entity', () => {
    expect(DuctRunSchema.parse(validDuctRun)).toEqual({
      ...validDuctRun,
      props: {
        ...validDuctRun.props,
        insulationThickness: 1,
        startEndType: 'flange',
        endEndType: 'flange',
        designLength: validDuctRun.props.installLength,
        segments: validDuctRun.props.segments.map((segment) => ({
          ...segment,
          insulationThickness: 1,
          startEndType: 'flange',
          endEndType: 'flange',
        })),
      },
    });
  });

  it('should accept optional propagated pressure fields in calculated data', () => {
    const runWithPressure = {
      ...validDuctRun,
      calculated: {
        ...validDuctRun.calculated,
        cumulativePressureDrop: 0.24,
        availableStaticPressure: 1.76,
      },
    };

    expect(DuctRunSchema.parse(runWithPressure).calculated).toMatchObject({
      cumulativePressureDrop: 0.24,
      availableStaticPressure: 1.76,
    });
  });

  it('should reject non duct-run entities', () => {
    expect(() => DuctRunSchema.parse({ ...validDuctRun, type: 'duct' })).toThrow();
  });
});
