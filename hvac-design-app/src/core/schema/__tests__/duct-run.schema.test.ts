import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RECTANGULAR_DUCT_RUN_PROPS,
  DEFAULT_ROUND_DUCT_RUN_PROPS,
  DuctRunFamilySchema,
  DuctRunPropsSchema,
  DuctRunSchema,
  DuctRunShapeSchema,
} from '../duct-run.schema';

describe('DuctRunFamilySchema', () => {
  it('should accept all supported duct-run families', () => {
    const families = ['standard_duct', 'boiler_flue', 'grease_duct', 'generator_exhaust'];
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

describe('DuctRunPropsSchema', () => {
  it('should validate round runs with embedded segments', () => {
    expect(DuctRunPropsSchema.parse(DEFAULT_ROUND_DUCT_RUN_PROPS)).toBeTruthy();
  });

  it('should validate rectangular runs with embedded segments', () => {
    expect(DuctRunPropsSchema.parse(DEFAULT_RECTANGULAR_DUCT_RUN_PROPS)).toBeTruthy();
  });

  it('should validate flat oval runs with width and height', () => {
    const result = DuctRunPropsSchema.parse({
      ...DEFAULT_RECTANGULAR_DUCT_RUN_PROPS,
      shape: 'flat_oval',
      engineeringSystem: 'grease_duct',
    });

    expect(result.shape).toBe('flat_oval');
    expect(result.engineeringSystem).toBe('grease_duct');
  });

  it('should validate flexible runs with diameter', () => {
    const result = DuctRunPropsSchema.parse({
      ...DEFAULT_ROUND_DUCT_RUN_PROPS,
      shape: 'flexible',
      diameter: 14,
      engineeringSystem: 'boiler_flue',
    });

    expect(result.shape).toBe('flexible');
    expect(result.engineeringSystem).toBe('boiler_flue');
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
    expect(DuctRunSchema.parse(validDuctRun)).toEqual(validDuctRun);
  });

  it('should reject non duct-run entities', () => {
    expect(() => DuctRunSchema.parse({ ...validDuctRun, type: 'duct' })).toThrow();
  });
});
