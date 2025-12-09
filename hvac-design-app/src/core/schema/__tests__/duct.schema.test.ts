import { describe, it, expect } from 'vitest';
import {
  DuctPropsSchema,
  DuctSchema,
  DuctMaterialSchema,
  DuctShapeSchema,
  DEFAULT_ROUND_DUCT_PROPS,
  DEFAULT_RECTANGULAR_DUCT_PROPS,
} from '../duct.schema';

describe('DuctMaterialSchema', () => {
  it('should accept all valid materials', () => {
    const materials = ['galvanized', 'stainless', 'aluminum', 'flex'];
    materials.forEach((material) => {
      expect(DuctMaterialSchema.parse(material)).toBe(material);
    });
  });

  it('should reject invalid material', () => {
    expect(() => DuctMaterialSchema.parse('copper')).toThrow();
  });
});

describe('DuctShapeSchema', () => {
  it('should accept round and rectangular', () => {
    expect(DuctShapeSchema.parse('round')).toBe('round');
    expect(DuctShapeSchema.parse('rectangular')).toBe('rectangular');
  });

  it('should reject invalid shape', () => {
    expect(() => DuctShapeSchema.parse('oval')).toThrow();
  });
});

describe('DuctPropsSchema', () => {
  it('should validate round duct with diameter', () => {
    expect(DuctPropsSchema.parse(DEFAULT_ROUND_DUCT_PROPS)).toBeTruthy();
  });

  it('should validate rectangular duct with width and height', () => {
    expect(DuctPropsSchema.parse(DEFAULT_RECTANGULAR_DUCT_PROPS)).toBeTruthy();
  });

  it('should reject round duct without diameter', () => {
    const invalid = { ...DEFAULT_ROUND_DUCT_PROPS, diameter: undefined };
    expect(() => DuctPropsSchema.parse(invalid)).toThrow();
  });

  it('should reject rectangular duct without width', () => {
    const invalid = { ...DEFAULT_RECTANGULAR_DUCT_PROPS, width: undefined };
    expect(() => DuctPropsSchema.parse(invalid)).toThrow();
  });

  it('should reject rectangular duct without height', () => {
    const invalid = { ...DEFAULT_RECTANGULAR_DUCT_PROPS, height: undefined };
    expect(() => DuctPropsSchema.parse(invalid)).toThrow();
  });

  it('should enforce diameter range (4-60 inches)', () => {
    expect(() => DuctPropsSchema.parse({ ...DEFAULT_ROUND_DUCT_PROPS, diameter: 3 })).toThrow();
    expect(() => DuctPropsSchema.parse({ ...DEFAULT_ROUND_DUCT_PROPS, diameter: 61 })).toThrow();
    expect(DuctPropsSchema.parse({ ...DEFAULT_ROUND_DUCT_PROPS, diameter: 4 })).toBeTruthy();
    expect(DuctPropsSchema.parse({ ...DEFAULT_ROUND_DUCT_PROPS, diameter: 60 })).toBeTruthy();
  });

  it('should enforce length range (0.1-1000 feet)', () => {
    expect(() => DuctPropsSchema.parse({ ...DEFAULT_ROUND_DUCT_PROPS, length: 0 })).toThrow();
    expect(() => DuctPropsSchema.parse({ ...DEFAULT_ROUND_DUCT_PROPS, length: 1001 })).toThrow();
    expect(DuctPropsSchema.parse({ ...DEFAULT_ROUND_DUCT_PROPS, length: 0.1 })).toBeTruthy();
    expect(DuctPropsSchema.parse({ ...DEFAULT_ROUND_DUCT_PROPS, length: 1000 })).toBeTruthy();
  });

  it('should enforce airflow range (1-100,000 CFM)', () => {
    expect(() => DuctPropsSchema.parse({ ...DEFAULT_ROUND_DUCT_PROPS, airflow: 0 })).toThrow();
    expect(() =>
      DuctPropsSchema.parse({ ...DEFAULT_ROUND_DUCT_PROPS, airflow: 100001 })
    ).toThrow();
  });

  it('should enforce static pressure range (0-20 in.w.g.)', () => {
    expect(() =>
      DuctPropsSchema.parse({ ...DEFAULT_ROUND_DUCT_PROPS, staticPressure: -1 })
    ).toThrow();
    expect(() =>
      DuctPropsSchema.parse({ ...DEFAULT_ROUND_DUCT_PROPS, staticPressure: 21 })
    ).toThrow();
  });

  it('should allow optional connection references', () => {
    const withConnections = {
      ...DEFAULT_ROUND_DUCT_PROPS,
      connectedFrom: '550e8400-e29b-41d4-a716-446655440000',
      connectedTo: '550e8400-e29b-41d4-a716-446655440001',
    };
    expect(DuctPropsSchema.parse(withConnections)).toBeTruthy();
  });
});

describe('DuctSchema', () => {
  const validDuct = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'duct' as const,
    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    props: DEFAULT_ROUND_DUCT_PROPS,
    calculated: { area: 113.1, velocity: 636.6, frictionLoss: 0.05 },
  };

  it('should validate complete duct entity', () => {
    expect(DuctSchema.parse(validDuct)).toEqual(validDuct);
  });

  it('should reject non-duct type', () => {
    expect(() => DuctSchema.parse({ ...validDuct, type: 'room' })).toThrow();
  });
});

