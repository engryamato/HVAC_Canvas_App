import { describe, expect, it } from 'vitest';
import type { DuctEngineeringData } from '@/core/schema/duct.schema';
import type { EngineeringLimits } from '@/core/schema/calculation-settings.schema';
import {
  ductValidator,
  generateDeterministicSuggestions,
  type ValidationViolation,
} from '../constraintValidator';

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

function createEngineeringData(overrides: Partial<DuctEngineeringData> = {}): DuctEngineeringData {
  return {
    airflow: 3000,
    velocity: 3200,
    pressureDrop: 0.25,
    friction: 0.002,
    equivalentDiameter: 10,
    reynoldsNumber: 120000,
    ...overrides,
  };
}

describe('constraintValidator Milestone 4 deterministic suggestions', () => {
  it('generates deterministic suggestions for the same inputs', () => {
    const status = ductValidator.validate(createEngineeringData(), limits);
    const violations = status.violations as unknown as ValidationViolation[];

    const firstRun = generateDeterministicSuggestions(violations);
    const secondRun = generateDeterministicSuggestions(violations);
    const reversedRun = generateDeterministicSuggestions([...violations].reverse());

    expect(firstRun).toEqual(secondRun);
    expect(firstRun).toEqual(reversedRun);
    expect(firstRun.length).toBeGreaterThan(0);
  });

  it('produces machine-applicable fix payloads', () => {
    const status = ductValidator.validate(createEngineeringData(), limits);
    const suggestions = generateDeterministicSuggestions(status.violations as unknown as ValidationViolation[]);

    expect(suggestions.length).toBeGreaterThan(0);
    suggestions.forEach((suggestion) => {
      expect(suggestion.fix.property).toBe('airflow');
      expect(typeof suggestion.fix.value).toBe('number');
      expect(Number.isFinite(suggestion.fix.value)).toBe(true);
      expect(suggestion.fix.value).toBeGreaterThanOrEqual(1);
    });
  });
});

