import { describe, it, expect } from 'vitest';
import {
  FittingSchema,
  FittingPropsSchema,
  FittingTypeSchema,
  DEFAULT_FITTING_PROPS,
  DEFAULT_FITTING_CALCULATED,
} from '../fitting.schema';

describe('FittingTypeSchema', () => {
  it('should accept all valid fitting types', () => {
    const types = ['elbow_90', 'elbow_45', 'tee', 'reducer', 'cap'];
    types.forEach((type) => {
      expect(FittingTypeSchema.parse(type)).toBe(type);
    });
  });

  it('should reject invalid fitting type', () => {
    expect(() => FittingTypeSchema.parse('elbow_30')).toThrow();
  });
});

describe('FittingPropsSchema', () => {
  it('should validate elbow with angle', () => {
    expect(FittingPropsSchema.parse(DEFAULT_FITTING_PROPS.elbow_90)).toBeTruthy();
    expect(FittingPropsSchema.parse(DEFAULT_FITTING_PROPS.elbow_45)).toBeTruthy();
  });

  it('should validate fittings without angle', () => {
    expect(FittingPropsSchema.parse(DEFAULT_FITTING_PROPS.tee)).toBeTruthy();
    expect(FittingPropsSchema.parse(DEFAULT_FITTING_PROPS.reducer)).toBeTruthy();
    expect(FittingPropsSchema.parse(DEFAULT_FITTING_PROPS.cap)).toBeTruthy();
  });

  it('should enforce angle range (0-180 degrees)', () => {
    expect(() =>
      FittingPropsSchema.parse({ fittingType: 'elbow_90', angle: -10 })
    ).toThrow();
    expect(() =>
      FittingPropsSchema.parse({ fittingType: 'elbow_90', angle: 181 })
    ).toThrow();
  });

  it('should allow optional duct connections', () => {
    const props = {
      ...DEFAULT_FITTING_PROPS.elbow_90,
      inletDuctId: '550e8400-e29b-41d4-a716-446655440000',
      outletDuctId: '550e8400-e29b-41d4-a716-446655440001',
    };
    expect(FittingPropsSchema.parse(props)).toBeTruthy();
  });

  it('should reject invalid UUID for duct connections', () => {
    expect(() =>
      FittingPropsSchema.parse({
        ...DEFAULT_FITTING_PROPS.tee,
        inletDuctId: 'not-a-uuid',
      })
    ).toThrow();
  });
});

describe('FittingSchema', () => {
  const validFitting = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'fitting' as const,
    transform: { x: 100, y: 200, rotation: 45, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    props: DEFAULT_FITTING_PROPS.elbow_90,
    calculated: DEFAULT_FITTING_CALCULATED,
  };

  it('should validate complete fitting entity', () => {
    expect(FittingSchema.parse(validFitting)).toEqual(validFitting);
  });

  it('should reject non-fitting type', () => {
    expect(() => FittingSchema.parse({ ...validFitting, type: 'duct' })).toThrow();
  });

  it('should validate all fitting types', () => {
    const types = ['elbow_90', 'elbow_45', 'tee', 'reducer', 'cap'] as const;
    types.forEach((fittingType) => {
      const fitting = {
        ...validFitting,
        props: DEFAULT_FITTING_PROPS[fittingType],
      };
      expect(FittingSchema.parse(fitting)).toBeTruthy();
    });
  });
});

