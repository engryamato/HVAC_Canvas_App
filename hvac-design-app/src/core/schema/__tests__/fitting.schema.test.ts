import { describe, it, expect } from 'vitest';
import {
  BoilerFlueFittingPropsSchema,
  FittingPortSchema,
  FittingSchema,
  FittingPropsSchema,
  StandardFittingPropsSchema,
  FittingTypeSchema,
  DEFAULT_FITTING_PROPS,
  DEFAULT_FITTING_CALCULATED,
  createDefaultFittingProps,
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
    expect(() => FittingPropsSchema.parse({ fittingType: 'elbow_90', angle: -10 })).toThrow();
    expect(() => FittingPropsSchema.parse({ fittingType: 'elbow_90', angle: 181 })).toThrow();
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

  it('should allow optional name field', () => {
    const props = {
      ...DEFAULT_FITTING_PROPS.elbow_90,
      name: 'Main Exhaust Elbow',
    };
    const result = FittingPropsSchema.parse(props);
    expect(result.name).toBe('Main Exhaust Elbow');
  });

  it('defaults manualOverride to false when omitted', () => {
    const result = FittingPropsSchema.parse({
      fittingType: 'elbow_90',
      angle: 90,
    });

    expect(result.engineeringSystem).toBe('standard_duct');
    expect(result.manualOverride).toBe(false);
  });

  it('uses engineeringSystem as the level-2 discriminator', () => {
    const result = BoilerFlueFittingPropsSchema.parse({
      engineeringSystem: 'boiler_flue',
      fittingType: 'elbow_90',
      angle: 90,
    });

    expect(result.engineeringSystem).toBe('boiler_flue');
    expect(() =>
      StandardFittingPropsSchema.parse({
        engineeringSystem: 'grease_duct',
        fittingType: 'tee',
      })
    ).toThrow();
  });

  it('should enforce name max length', () => {
    const props = {
      ...DEFAULT_FITTING_PROPS.tee,
      name: 'a'.repeat(101),
    };
    expect(() => FittingPropsSchema.parse(props)).toThrow();
  });

  it('should accept authoritative fitting ports connected to duct_run endpoints', () => {
    const props = {
      ...DEFAULT_FITTING_PROPS.tee,
      ports: [
        {
          id: 'port-in',
          role: 'inlet',
          direction: 'in',
          connectedDuctRunId: '550e8400-e29b-41d4-a716-446655440000',
          connectedEnd: 'end',
        },
        {
          id: 'port-straight',
          role: 'straight_out',
          direction: 'out',
          connectedDuctRunId: '550e8400-e29b-41d4-a716-446655440001',
          connectedEnd: 'start',
        },
      ],
    };

    expect(FittingPropsSchema.parse(props).ports).toHaveLength(2);
  });
});

describe('FittingPortSchema', () => {
  it('should validate fitting port role, direction, duct_run id, and connected endpoint', () => {
    const port = FittingPortSchema.parse({
      id: 'port-1',
      role: 'branch_out',
      direction: 'out',
      connectedDuctRunId: '550e8400-e29b-41d4-a716-446655440000',
      connectedEnd: 'start',
    });

    expect(port.role).toBe('branch_out');
    expect(port.direction).toBe('out');
    expect(port.connectedEnd).toBe('start');
  });
});

describe('FittingSchema', () => {
  const validFitting = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'fitting' as const,
    transform: { x: 100, y: 200, elevation: 0, rotation: 45, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    props: DEFAULT_FITTING_PROPS.elbow_90,
    calculated: DEFAULT_FITTING_CALCULATED,
  };

  it('should validate complete fitting entity', () => {
    expect(FittingSchema.parse(validFitting)).toEqual({
      ...validFitting,
      props: {
        ...validFitting.props,
        manualOverride: false,
      },
    });
  });

  it('should accept optional propagated pressure fields in calculated data', () => {
    const fittingWithPressure = {
      ...validFitting,
      calculated: {
        ...validFitting.calculated,
        cumulativePressureDrop: 0.28,
        availableStaticPressure: 1.72,
      },
    };

    expect(FittingSchema.parse(fittingWithPressure).calculated).toMatchObject({
      cumulativePressureDrop: 0.28,
      availableStaticPressure: 1.72,
    });
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

describe('createDefaultFittingProps', () => {
  it('should create props for all fitting types with default name', () => {
    const types = ['elbow_90', 'elbow_45', 'tee', 'reducer', 'cap'] as const;
    types.forEach((type) => {
      const props = createDefaultFittingProps(type);
      expect(props.engineeringSystem).toBe('standard_duct');
      expect(props.fittingType).toBe(type);
      expect(props.name).toBeTruthy();
      expect(FittingPropsSchema.parse(props)).toBeTruthy();
    });
  });

  it('should allow custom name override', () => {
    const props = createDefaultFittingProps('elbow_90', 'Custom Elbow');
    expect(props.name).toBe('Custom Elbow');
  });
});
