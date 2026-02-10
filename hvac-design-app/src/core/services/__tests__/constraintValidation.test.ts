/**
 * Unit tests for ConstraintValidationService
 */
import { describe, it, expect } from 'vitest';
import { ConstraintValidationService } from '../constraintValidation';
import { Service } from '@/core/schema/service.schema';
import { Duct } from '@/core/schema';

describe('ConstraintValidationService', () => {
  const mockService: Service = {
    id: 'test-service',
    name: 'Test Service',
    systemType: 'supply',
    pressureClass: 'low-pressure',
    material: 'galvanized',
    color: '#4A90E2',
    dimensionalConstraints: {
      allowedShapes: ['round'],
      minDiameter: 6,
      maxDiameter: 24,
    },
    fittingRules: [],
  };

  const createMockDuct = (overrides: Partial<Duct['props']> = {}): Duct['props'] => ({
    name: 'Test Duct',
    shape: 'round',
    diameter: 12,
    length: 10,
    material: 'galvanized',
    airflow: 1000,
    staticPressure: 1.5,
    ...overrides,
  });

  describe('validateDuct', () => {
    it('should pass validation for valid round duct within constraints', () => {
      const ductProps = createMockDuct({ diameter: 12 });
      const result = ConstraintValidationService.validateDuct(ductProps, mockService);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail validation for diameter below minimum', () => {
      const ductProps = createMockDuct({ diameter: 4 });
      const result = ConstraintValidationService.validateDuct(ductProps, mockService);

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('dimensional');
      expect(result.violations[0].severity).toBe('warning');
      expect(result.violations[0].message).toContain('Diameter 4" is below minimum');
    });

    it('should fail validation for diameter above maximum', () => {
      const ductProps = createMockDuct({ diameter: 30 });
      const result = ConstraintValidationService.validateDuct(ductProps, mockService);

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].message).toContain('Diameter 30" exceeds maximum');
    });

    it('should fail validation for disallowed shape', () => {
      const serviceWithRectOnly: Service = {
        ...mockService,
        dimensionalConstraints: {
          allowedShapes: ['rectangular'],
        },
      };

      const ductProps = createMockDuct({ shape: 'round' });
      const result = ConstraintValidationService.validateDuct(ductProps, serviceWithRectOnly);

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('shape');
      expect(result.violations[0].message).toContain('Round ducts not allowed');
    });

    it('should fail validation for material mismatch', () => {
      const ductProps = createMockDuct({ material: 'stainless' });
      const result = ConstraintValidationService.validateDuct(ductProps, mockService);

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('material');
      expect(result.violations[0].message).toContain('Material mismatch');
    });

    it('should validate rectangular ducts with width/height constraints', () => {
      const serviceWithRect: Service = {
        ...mockService,
        dimensionalConstraints: {
          allowedShapes: ['rectangular'],
          minWidth: 6,
          maxWidth: 48,
          minHeight: 6,
          maxHeight: 24,
        },
      };

      const validRect = createMockDuct({
        shape: 'rectangular',
        width: 12,
        height: 10,
      }) as any;

      const result = ConstraintValidationService.validateDuct(validRect, serviceWithRect);
      expect(result.isValid).toBe(true);
    });

    it('should return multiple violations when multiple constraints are violated', () => {
      const ductProps = createMockDuct({
        diameter: 30, // exceeds max
        material: 'stainless', // wrong material
      });

      const result = ConstraintValidationService.validateDuct(ductProps, mockService);

      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('classifyViolationSeverity', () => {
    it('should classify severe over-limit as blocker', () => {
      const ductProps = createMockDuct({ diameter: 40 }); // 66% over max
      const result = ConstraintValidationService.validateDuct(ductProps, mockService);

      const blockers = result.violations.filter(v => v.severity === 'blocker');
      expect(blockers.length).toBeGreaterThan(0);
    });

    it('should classify minor violations as warnings', () => {
      const ductProps = createMockDuct({ diameter: 26 }); // Slightly over max
      const result = ConstraintValidationService.validateDuct(ductProps, mockService);

      const warnings = result.violations.filter(v => v.severity === 'warning');
      expect(warnings.length).toBeGreaterThan(0);
    });
  });
});
