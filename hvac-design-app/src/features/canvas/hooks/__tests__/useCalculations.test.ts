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
import type { EngineeringLimits } from '@/core/schema/calculation-settings.schema';

const createTestDuct = (overrides: Partial<Duct['props']> & Record<string, unknown> = {}): Duct => ({
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
  const engineeringLimits: EngineeringLimits = {
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
    expect(engineeringData.systemType).toBeUndefined();
  });

  it('keeps stored pressure-drop semantics stable across run lengths', () => {
    const shortRun = calculateDuct(createTestDuct({ length: 10 })).calculated;
    const longRun = calculateDuct(createTestDuct({ length: 50 })).calculated;

    expect(shortRun.frictionLoss).toBe(longRun.frictionLoss);
  });

  it('builds a valid constraint status from engineering-limit validation', () => {
    const duct = createTestDuct({ systemType: 'return', airflow: 1000 });
    const status = buildConstraintStatus(
      duct,
      {
        airflow: 1000,
        velocity: 800,
        pressureDrop: 0.04,
        friction: 0.04,
        equivalentDiameter: 12,
        systemType: 'return',
      },
      engineeringLimits
    );

    expect(status.isValid).toBe(true);
    expect(status.violations.filter((violation) => violation.severity !== 'info')).toHaveLength(0);
  });

  it('uses the duct system bucket for validation results', () => {
    const duct = createTestDuct({ systemType: 'return', airflow: 1000 });
    const status = buildConstraintStatus(
      duct,
      {
        airflow: 1000,
        velocity: 2300,
        pressureDrop: 0.09,
        friction: 0.09,
        equivalentDiameter: 12,
        systemType: 'return',
      },
      engineeringLimits
    );

    expect(status.isValid).toBe(false);
    expect(status.violations.some((violation) => violation.message.includes('return system'))).toBe(true);
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
