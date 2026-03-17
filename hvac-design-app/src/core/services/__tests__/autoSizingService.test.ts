import { describe, it, expect } from 'vitest';
import { autoSizingService } from '../automation/autoSizingService';
import type { EngineeringLimits } from '../../schema/calculation-settings.schema';
import type { DuctProps } from '../../schema/duct.schema';

describe('AutoSizingService', () => {
  const mockLimits: EngineeringLimits = {
    maxVelocity: { supply: 2500, return: 2000, exhaust: 2000 },
    minVelocity: { supply: 600, return: 500, exhaust: 500 },
    maxPressureDrop: { supply: 0.10, return: 0.08, exhaust: 0.08 },
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

  describe('autoSizeDuct', () => {
    it('should size round duct correctly for given airflow', () => {
      const duct = {
        airflow: 1000,
        shape: 'round' as const,
        material: 'galvanized' as const,
      } satisfies Partial<DuctProps>;

      const result = autoSizingService.autoSizeDuct(
        duct,
        { targetVelocity: 1500, roundToStandard: true },
        mockLimits
      );

      expect(result.success).toBe(true);
      expect(result.newSize.diameter).toBeGreaterThan(0);
      expect(result.calculatedVelocity).toBeCloseTo(1500, -2); // Within 100 FPM
    });

    it('should size rectangular duct correctly', () => {
      const duct = {
        airflow: 2000,
        shape: 'rectangular' as const,
        material: 'galvanized' as const,
      } satisfies Partial<DuctProps>;

      const result = autoSizingService.autoSizeDuct(
        duct,
        { targetVelocity: 1800, roundToStandard: true },
        mockLimits
      );

      expect(result.success).toBe(true);
      expect(result.newSize.width).toBeGreaterThan(0);
      expect(result.newSize.height).toBeGreaterThan(0);
    });

    it('should round to standard sizes when requested', () => {
      const duct = {
        airflow: 1234,
        shape: 'round' as const,
        material: 'galvanized' as const,
      } satisfies Partial<DuctProps>;

      const result = autoSizingService.autoSizeDuct(
        duct,
        { targetVelocity: 1500, roundToStandard: true },
        mockLimits
      );

      // Standard round sizes: 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, etc.
      const standardSizes = [6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30];
      expect(standardSizes).toContain(result.newSize.diameter);
    });

    it('should warn when velocity exceeds maximum', () => {
      const duct = {
        airflow: 10000, // Very high airflow
        shape: 'round' as const,
        material: 'galvanized' as const,
      } satisfies Partial<DuctProps>;

      const result = autoSizingService.autoSizeDuct(
        duct,
        { targetVelocity: 3000, roundToStandard: true }, // Exceeds max
        mockLimits
      );

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('velocity'))).toBe(true);
    });
  });

  describe('suggestDuctSizes', () => {
    it('should provide multiple size options', () => {
      const suggestions = autoSizingService.suggestDuctSizes(
        1500,
        'round',
        'supply',
        mockLimits
      );

      expect(suggestions.length).toBe(4); // Low, medium, high, max velocity targets
      suggestions.forEach(suggestion => {
        expect(suggestion.size.diameter).toBeGreaterThan(0);
        expect(suggestion.velocity).toBeGreaterThan(0);
        expect(suggestion.pressureDrop).toBeGreaterThan(0);
      });
    });

    it('should provide size options in ascending velocity order', () => {
      const suggestions = autoSizingService.suggestDuctSizes(
        2000,
        'round',
        'supply',
        mockLimits
      );

      for (let i = 1; i < suggestions.length; i++) {
        const current = suggestions[i];
        const previous = suggestions[i - 1];
        expect(current).toBeDefined();
        expect(previous).toBeDefined();
        expect(current!.velocity).toBeGreaterThan(previous!.velocity);
      }
    });
  });

  describe('batchAutoSize', () => {
    it('should size multiple ducts efficiently', () => {
      const ducts = [
        { id: 'd1', props: { airflow: 1000, shape: 'round' as const, material: 'galvanized' as const } },
        { id: 'd2', props: { airflow: 1500, shape: 'round' as const, material: 'galvanized' as const } },
        { id: 'd3', props: { airflow: 2000, shape: 'rectangular' as const, material: 'galvanized' as const } },
      ];

      const results = autoSizingService.batchAutoSize(
        ducts,
        { targetVelocity: 1500, roundToStandard: true },
        mockLimits
      );

      expect(results.size).toBe(3);
      expect(Array.from(results.values())).toHaveLength(3);
      expect(Array.from(results.values()).every((result) => result.success)).toBe(true);
    });
  });
});
