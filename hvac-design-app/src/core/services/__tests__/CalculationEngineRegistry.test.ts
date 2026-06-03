import { describe, expect, it } from 'vitest';
import type { Duct } from '@/core/schema';
import { CalculationEngineRegistry } from '@/core/services/calculations/CalculationEngineRegistry';
import {
  buildEngineDispatchWarning,
  calculateDuct,
} from '@/features/canvas/hooks/useCalculations';

function createTestDuct(engineeringSystem: Duct['props']['engineeringSystem']): Duct {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    type: 'duct',
    transform: {
      x: 0,
      y: 0,
      elevation: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
    zIndex: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt: '2026-01-01T00:00:00.000Z',
    props: {
      name: 'Test Duct',
      engineeringSystem,
      shape: 'round',
      diameter: 12,
      length: 10,
      material: 'galvanized',
      airflow: 1200,
      staticPressure: 0.25,
    },
    calculated: {
      area: 0,
      velocity: 0,
      frictionLoss: 0,
    },
    warnings: undefined,
  } as Duct;
}

describe('CalculationEngineRegistry', () => {
  it('registers all traycer duct engine metadata explicitly', () => {
    const metadata = CalculationEngineRegistry.describe('standard_duct');
    const systems = CalculationEngineRegistry.list().map((entry) => entry.engineeringSystem);

    expect(metadata.supported).toBe(true);
    expect(metadata.engine?.engineeringSystem).toBe('standard_duct');
    expect(metadata.capabilities).toEqual(['sizing', 'pressure_drop']);
    expect(metadata.label).toBe('Standard Duct');
    expect(CalculationEngineRegistry.has('standard_duct')).toBe(true);
    expect(CalculationEngineRegistry.has('universal')).toBe(true);
    expect(systems).toEqual(['standard_duct', 'universal']);
  });

  it('describes universal components with load and compliance support', () => {
    const metadata = CalculationEngineRegistry.describe('universal');

    expect(metadata.supported).toBe(true);
    expect(metadata.engine?.engineeringSystem).toBe('universal');
    expect(metadata.capabilities).toEqual(['load', 'compliance']);
    expect(metadata.label).toBe('Universal Components');
  });

  it('gracefully warns only for unknown engineering systems', () => {
    const duct = createTestDuct('standard_duct');
    const result = calculateDuct(duct);

    expect(result.engine.supported).toBe(true);
    expect(result.calculated.area).toBeGreaterThan(0);
    expect(result.calculated.velocity).toBeGreaterThan(0);
    expect(result.calculated.frictionLoss).toBeGreaterThan(0);
    expect(buildEngineDispatchWarning(result.engine)).toBeUndefined();

    const unknownEngine = CalculationEngineRegistry.describe('legacy_mode' as any);

    expect(unknownEngine.supported).toBe(false);
    expect(buildEngineDispatchWarning(unknownEngine)).toEqual({
      constraintViolations: [
        'No registered calculation engine for Legacy Mode (unsupported). Using generic duct calculations.',
      ],
    });
  });
});
