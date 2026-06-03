import { describe, expect, it } from 'vitest';
import type { DuctProps } from '@/core/schema/duct.schema';
import type { EngineeringLimits } from '@/core/schema/calculation-settings.schema';
import { engineeringCalculator } from '@/core/services/calculations/engineeringCalculator';
import {
  applyComputedSizing,
  applyEquipmentCapacitySizing,
  applyUserSizeEdit,
  snapSizeToQuarterInch,
  snapToNearestStandardSize,
} from '../sizingProvenance';

const limits: EngineeringLimits = {
  maxVelocity: { supply: 2500, return: 2000, exhaust: 2000 },
  minVelocity: { supply: 600, return: 500, exhaust: 500 },
  maxPressureDrop: { supply: 0.1, return: 0.08, exhaust: 0.08 },
  frictionFactors: {
    galvanized: 0.0005,
    stainless: 0.00015,
    flexible: 0.003,
    fiberglass: 0.0003,
  },
  standardConditions: {
    temperature: 70,
    pressure: 29.92,
    altitude: 0,
  },
};

function rectangularProps(overrides: Partial<DuctProps> = {}): DuctProps {
  return {
    name: 'Duct',
    engineeringSystem: 'standard_duct',
    shape: 'rectangular',
    width: 12,
    height: 8,
    length: 10,
    material: 'galvanized',
    airflow: 1000,
    staticPressure: 0.1,
    provenance: {
      width: 'computed',
      height: 'default',
    },
    ...overrides,
  } as DuctProps;
}

describe('sizingProvenance', () => {
  it('marks an edited default field as specified', () => {
    const next = applyUserSizeEdit(rectangularProps(), 'height', 10);

    expect(next.height).toBe(10);
    expect(next.provenance?.height).toBe('specified');
  });

  it('marks a cleared specified field as computed and recomputes it', () => {
    const next = applyUserSizeEdit(
      rectangularProps({ provenance: { width: 'computed', height: 'specified' }, height: 10 }),
      'height',
      undefined,
      { limits }
    );

    expect(next.provenance?.height).toBe('computed');
    expect(next.height).toBeGreaterThan(0);
  });

  it('recomputes the remaining computed dimension to hold the last known equivalent diameter', () => {
    const before = rectangularProps();
    const target = engineeringCalculator.calculateEquivalentDiameter(before.width!, before.height!);

    const next = applyUserSizeEdit(before, 'height', 10);

    expect(next.height).toBe(10);
    expect(next.provenance?.height).toBe('specified');
    expect(next.provenance?.width).toBe('computed');
    expect(next.equivalentDiameter).toBeCloseTo(target, 1);
    expect(engineeringCalculator.calculateEquivalentDiameter(next.width!, next.height!)).toBeCloseTo(target, 1);
  });

  it('derives equivalent diameter without overwriting all-specified rectangular dimensions', () => {
    const next = applyUserSizeEdit(
      rectangularProps({
        width: 18,
        height: 10,
        provenance: { width: 'specified', height: 'specified' },
      }),
      'height',
      12
    );

    expect(next.width).toBe(18);
    expect(next.height).toBe(12);
    expect(next.equivalentDiameter).toBeCloseTo(
      engineeringCalculator.calculateEquivalentDiameter(18, 12),
      3
    );
  });

  it('computed sizing skips specified fields and writes computed fields', () => {
    const next = applyComputedSizing(
      rectangularProps({ height: 8, provenance: { width: 'computed', height: 'specified' } }),
      { width: 20, height: 14 }
    );

    expect(next.height).toBe(8);
    expect(next.provenance?.height).toBe('specified');
    expect(next.width).not.toBe(12);
    expect(next.provenance?.width).toBe('computed');
  });

  it('equipment-capacity sizing respects specified fields', () => {
    const next = applyEquipmentCapacitySizing(
      {
        ...rectangularProps({ width: 20, height: 8, provenance: { width: 'specified', height: 'computed' } }),
        airflow: 2000,
      },
      2000,
      limits
    );

    expect(next.width).toBe(20);
    expect(next.provenance?.width).toBe('specified');
    expect(next.height).toBeGreaterThan(0);
    expect(next.provenance?.height).toBe('computed');
  });

  it('snaps manual entry to quarter-inch precision and standard nominal sizes', () => {
    expect(snapSizeToQuarterInch(10.37)).toBe(10.25);
    expect(snapToNearestStandardSize('diameter', 11.2)).toBe(11);
    expect(snapToNearestStandardSize('width', 13.1)).toBe(14);
  });
});
