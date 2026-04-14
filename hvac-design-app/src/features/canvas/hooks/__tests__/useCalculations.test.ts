import { beforeEach, describe, expect, it } from 'vitest';
import type { Duct } from '@/core/schema';
import type { EngineResolution } from '@/core/services/calculations/CalculationEngineRegistry';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';
import {
  buildConstraintStatus,
  buildEngineeringData,
  buildEngineDispatchWarning,
  calculateDuct,
} from '../useCalculations';

const createTestDuct = (overrides: Partial<Duct['props']> = {}): Duct => ({
  id: 'duct-1',
  type: 'duct',
  transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  props: {
    name: 'Test Duct',
    engineeringSystem: 'boiler_flue',
    shape: 'round',
    diameter: 12,
    length: 10,
    material: 'galvanized',
    airflow: 1200,
    staticPressure: 0.25,
    ...overrides,
  },
  calculated: {
    area: 0,
    velocity: 0,
    frictionLoss: 0,
  },
  warnings: undefined,
} as Duct);

describe('useCalculations helpers', () => {
  beforeEach(() => {
    useUnifiedCatalogStore.getState().reset();
    useUnifiedCatalogStore.getState().addSystemProfile({
      id: 'boiler-flue',
      name: 'Boiler & Water Heater Flue',
      engineeringSystem: 'boiler_flue',
      defaultSystemType: 'exhaust',
      color: '#ea580c',
      source: 'baseline',
      supportedArchetypes: {
        duct: ['single_wall_pipe'],
        fitting: ['boot_tee'],
        equipment: ['draft_inducer'],
        accessory: ['condensate_trap'],
      },
      fittingRules: [],
      dimensionalConstraints: {
        minimumSlopePerFoot: 0.5,
      },
      complianceRefs: [],
      calculationCapabilities: ['sizing', 'compliance'],
    });
  });

  it('builds engineering data from calculated duct values', () => {
    const duct = createTestDuct();
    const calculated = calculateDuct(duct).calculated;
    const engineeringData = buildEngineeringData(duct, calculated);

    expect(engineeringData.airflow).toBe(1200);
    expect(engineeringData.velocity).toBe(calculated.velocity);
    expect(engineeringData.pressureDrop).toBe(calculated.frictionLoss);
    expect(engineeringData.friction).toBe(calculated.frictionLoss);
    expect(engineeringData.equivalentDiameter).toBe(12);
  });

  it('builds a valid constraint status when no warnings are present', () => {
    const status = buildConstraintStatus(undefined, undefined);

    expect(status.isValid).toBe(true);
    expect(status.violations).toHaveLength(0);
  });

  it('builds warnings for unsupported systems only when required', () => {
    const engine = calculateDuct(createTestDuct({ engineeringSystem: 'generator_exhaust' })).engine;

    expect(engine.supported).toBe(true);
    expect(buildEngineDispatchWarning(engine)).toBeUndefined();

    const unknownEngine = {
      engineeringSystem: 'legacy_mode',
      label: 'Legacy Mode (unsupported)',
      capabilities: [],
      supported: false,
      engine: null,
    } as unknown as EngineResolution;

    expect(buildEngineDispatchWarning(unknownEngine)).toEqual({
      constraintViolations: [
        'No registered calculation engine for Legacy Mode (unsupported). Using generic duct calculations.',
      ],
    });
  });

  it('surfaces boiler flue compliance warnings and universal load/compliance support', () => {
    const boilerFlue = calculateDuct(
      createTestDuct({
        engineeringSystem: 'boiler_flue',
        condensateSlope: 0.25,
        venting: 'natural',
        wallType: 'single',
      })
    );

    expect(boilerFlue.engine.capabilities).toEqual(['sizing', 'compliance']);
    expect(boilerFlue.complianceWarnings).toContain(
      'Condensate slope 0.25 in/ft is below the required 0.50 in/ft.'
    );
    expect(boilerFlue.complianceWarnings).toContain(
      'Verify single-wall natural vent runs remain within listed connector limitations.'
    );

    const universal = calculateDuct(
      createTestDuct({
        engineeringSystem: 'universal',
        diameter: 60,
      })
    );

    expect(universal.engine.capabilities).toEqual(['load', 'compliance']);
    expect(universal.complianceWarnings).toContain(
      'Large duct runs should verify seismic support spacing against IBC/ASCE 7 tables.'
    );
  });
});
