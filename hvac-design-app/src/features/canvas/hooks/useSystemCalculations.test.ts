import { describe, it, expect } from 'vitest';
import { calculateSystemMetrics } from '../hooks/useSystemCalculations';
import { type Entity } from '@/core/schema/project-file.schema';

describe('useSystemCalculations', () => {
  describe('calculateSystemMetrics', () => {
    it('should return zeros for empty entity list', () => {
      const result = calculateSystemMetrics({});
      expect(result).toEqual({
        totalCFM: 0,
        maxStaticPressure: 0,
        totalDuctLength: 0,
        totalDuctWeight: 0,
      });
    });

    it('should calculate total CFM from equipment', () => {
      const entities: Record<string, Entity> = {
        '1': {
          id: '1',
          type: 'equipment',
          props: {
            equipmentType: 'air_handler',
            capacity: 1200,
            staticPressure: 0.5,
            name: 'AHU-1',
            width: 0, height: 0, length: 0
          }
        } as any,
        '2': {
          id: '2',
          type: 'equipment',
          props: {
            equipmentType: 'diffuser', // Should be ignored by current logic
            capacity: 500,
            staticPressure: 0.1,
            name: 'Diffuser-1',
            width: 0, height: 0, length: 0
          }
        } as any,
        '3': {
          id: '3',
          type: 'equipment',
          props: {
            equipmentType: 'furnace',
            capacity: 800,
            staticPressure: 0.4,
            name: 'Furnace-1',
            width: 0, height: 0, length: 0
          }
        } as any,
      };

      const result = calculateSystemMetrics(entities);
      expect(result.totalCFM).toBe(2000); // 1200 + 800
      expect(result.maxStaticPressure).toBe(0.5);
    });

    it('should calculate duct length and weight', () => {
      const entities: Record<string, Entity> = {
        '1': {
          id: '1',
          type: 'duct',
          props: {
            shape: 'round',
            diameter: 12,
            length: 10,
            name: 'Round Duct',
            width: 0, height: 0
          }
        } as any,
        '2': {
          id: '2',
          type: 'duct',
          props: {
            shape: 'rectangular',
            width: 12,
            height: 12,
            length: 10,
            name: 'Rect Duct'
          }
        } as any,
      };

      const result = calculateSystemMetrics(entities);
      expect(result.totalDuctLength).toBe(20);

      // Verify weight logic:
      // Round: pi * 12 = 37.7 in perimeter. 37.7/12 * 10 = 31.41 sq ft. Weight ~ 31.41 lbs.
      // Rect: 2*(12+12) = 48 in perimeter. 48/12 * 10 = 40 sq ft. Weight ~ 40 lbs.
      // Total ~ 71.4 lbs.
      expect(result.totalDuctWeight).toBeGreaterThan(70);
      expect(result.totalDuctWeight).toBeLessThan(75);
    });
  });
});
