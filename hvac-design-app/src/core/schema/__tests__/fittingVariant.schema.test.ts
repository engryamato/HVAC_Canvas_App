import { describe, expect, it } from 'vitest';
import { FittingPropsSchema, FittingTypeSchema, createDefaultFittingProps } from '../fitting.schema';

describe('WS10 fitting variant + takeoff schema', () => {
  it('accepts the new takeoff fitting type', () => {
    expect(FittingTypeSchema.safeParse('takeoff').success).toBe(true);
    expect(createDefaultFittingProps('takeoff').fittingType).toBe('takeoff');
  });

  it('parses fitting props WITHOUT a variant (legacy/greenfield default)', () => {
    const parsed = FittingPropsSchema.parse({
      engineeringSystem: 'standard_duct',
      fittingType: 'elbow_90',
      angle: 90,
    });
    expect(parsed.variant).toBeUndefined();
  });

  it('parses fitting props WITH a populated variant object', () => {
    const parsed = FittingPropsSchema.parse({
      engineeringSystem: 'standard_duct',
      fittingType: 'takeoff',
      variant: {
        takeoffType: 'conical_tap',
        branchSide: 'left',
        branchAngleDeg: 45,
        hasDamper: true,
      },
    });
    expect(parsed.variant?.takeoffType).toBe('conical_tap');
    expect(parsed.variant?.branchSide).toBe('left');
    expect(parsed.variant?.hasDamper).toBe(true);
  });

  it('rejects invalid variant enum values', () => {
    const result = FittingPropsSchema.safeParse({
      engineeringSystem: 'standard_duct',
      fittingType: 'elbow_90',
      variant: { elbowType: 'spiral' },
    });
    expect(result.success).toBe(false);
  });
});
