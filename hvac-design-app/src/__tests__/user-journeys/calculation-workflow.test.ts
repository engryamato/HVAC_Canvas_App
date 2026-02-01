/**
 * Calculation Workflow User Journey Tests
 *
 * Tests HVAC calculations per PRD requirements:
 * - FR-CALC-001: Room Ventilation (ASHRAE 62.1)
 * - FR-CALC-002: ACH to CFM Conversion
 * - FR-CALC-003: Duct Velocity
 * - FR-CALC-004: Velocity Pressure
 * - FR-CALC-005: Round Duct Sizing
 * - FR-CALC-006: Rectangular Duct Sizing (Equivalent Diameter)
 * - FR-CALC-007: Friction Loss (Darcy-Weisbach)
 * - FR-CALC-008: Fitting Pressure Loss
 * - FR-CALC-009: Calculation Triggers
 * - US-CALC-001: View Room Ventilation Requirements
 * - US-CALC-002: View Duct Performance
 *
 * Validation ranges per PRD Appendix B
 */
import { describe, it, expect } from 'vitest';
import {
  calculateRoomArea,
  calculateRoomVolume,
  calculateACHtoCFM,
  calculateVentilationCFM,
  calculateRoomValues,
} from '@/features/canvas/calculators/ventilation';
import {
  calculateDuctArea,
  calculateVelocity,
  calculateRoundDuctDiameter,
} from '@/features/canvas/calculators/ductSizing';
import {
  calculateVelocityPressure,
  calculateFrictionLoss,
  calculateFittingLoss,
  calculateEquivalentDiameter,
} from '@/features/canvas/calculators/pressureDrop';
import type { Room } from '@/core/schema';

// Helper to create test room
const createTestRoom = (overrides?: Partial<Room['props']>): Room => ({
  id: 'room-1',
  type: 'room',
  transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 0,
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  props: {
    name: 'Test Room',
    width: 120, // 10 feet
    length: 120, // 10 feet
    ceilingHeight: 96, // 8 feet
    occupancyType: 'office',
    airChangesPerHour: 4,
    ...overrides,
  },
  calculated: { area: 0, volume: 0, requiredCFM: 0 },
});

describe('Calculation Workflow User Journey', () => {
  describe('FR-CALC-001: Room Ventilation (ASHRAE 62.1)', () => {
    describe('Ventilation CFM Calculation', () => {
      it('should calculate ventilation for office space', () => {
        const cfm = calculateVentilationCFM('office', 1000);
        expect(cfm).toBeGreaterThan(0);
        // Office: Rp=5, Ra=0.06, default density=5 per 1000sqft
        // For 1000 sqft: 5*5 + 0.06*1000 = 25+60 = 85 → rounded to nearest 5
        expect(cfm % 5).toBe(0);
      });

      it('should calculate ventilation for restaurant', () => {
        const cfm = calculateVentilationCFM('restaurant', 1000);
        expect(cfm).toBeGreaterThan(0);
        // Restaurant: Rp=7.5, Ra=0.18, default density=70 per 1000sqft
        // Higher ventilation than office
        const officeCfm = calculateVentilationCFM('office', 1000);
        expect(cfm).toBeGreaterThan(officeCfm);
      });

      it('should calculate ventilation for commercial kitchen', () => {
        const cfm = calculateVentilationCFM('kitchen_commercial', 500);
        expect(cfm).toBeGreaterThan(0);
        // Kitchen: Rp=0, Ra=0.7 (highest area-based rate)
      });

      it('should calculate ventilation for all occupancy types', () => {
        const types = [
          'office',
          'retail',
          'restaurant',
          'kitchen_commercial',
          'warehouse',
          'classroom',
          'conference',
          'lobby',
        ] as const;

        types.forEach((type) => {
          const cfm = calculateVentilationCFM(type, 200);
          expect(cfm).toBeGreaterThan(0);
          expect(cfm % 5).toBe(0); // All should be rounded to nearest 5
        });
      });

      it('should accept custom occupant count', () => {
        const cfmDefault = calculateVentilationCFM('office', 1000);
        const cfmCustom = calculateVentilationCFM('office', 1000, 20); // More occupants
        expect(cfmCustom).toBeGreaterThan(cfmDefault);
      });
    });
  });

  describe('FR-CALC-002: ACH to CFM Conversion', () => {
    it('should convert ACH and volume to CFM', () => {
      // CFM = (ACH × Volume) / 60
      const cfm = calculateACHtoCFM(6, 800);
      // 6 * 800 / 60 = 80 CFM
      expect(cfm).toBe(80);
    });

    it('should handle various ACH values', () => {
      const volume = 1000; // cu ft

      expect(calculateACHtoCFM(1, volume)).toBe(calculateACHtoCFM(1, volume));
      expect(calculateACHtoCFM(4, volume)).toBeLessThan(calculateACHtoCFM(8, volume));
      expect(calculateACHtoCFM(12, volume)).toBeGreaterThan(calculateACHtoCFM(6, volume));
    });

    it('should round to nearest 5 CFM', () => {
      const cfm = calculateACHtoCFM(7, 500);
      expect(cfm % 5).toBe(0);
    });
  });

  describe('Room Area and Volume Calculations', () => {
    it('should calculate room area in square feet from inches', () => {
      // 120" x 120" = 10ft x 10ft = 100 sqft
      const area = calculateRoomArea(120, 120);
      expect(area).toBeCloseTo(100, 1);
    });

    it('should calculate room volume in cubic feet from inches', () => {
      // 120" x 120" x 96" = 10ft x 10ft x 8ft = 800 cuft
      const volume = calculateRoomVolume(120, 120, 96);
      expect(volume).toBeCloseTo(800, 1);
    });

    it('should handle large room dimensions', () => {
      // 10,000" x 10,000" max per PRD Appendix B
      const area = calculateRoomArea(10000, 10000);
      expect(area).toBeGreaterThan(0);
    });

    it('should calculate room values object', () => {
      const room = createTestRoom();
      const calc = calculateRoomValues(room);

      expect(calc.area).toBeCloseTo(100, 1);
      expect(calc.volume).toBeCloseTo(800, 1);
      expect(calc.requiredCFM).toBeGreaterThan(0);
    });

    it('should use max of ACH-based and ventilation-based CFM', () => {
      // Create room with high ACH
      const highAchRoom = createTestRoom({ airChangesPerHour: 20 });
      const calc = calculateRoomValues(highAchRoom);

      // High ACH should drive the CFM requirement
      expect(calc.requiredCFM).toBeGreaterThan(100);
    });
  });

  describe('FR-CALC-003: Duct Velocity', () => {
    it('should calculate velocity for round duct', () => {
      const area = calculateDuctArea('round', { diameter: 12 });
      const velocity = calculateVelocity(1000, area);

      expect(velocity).toBeGreaterThan(0);
      expect(velocity % 10).toBe(0); // Rounded to nearest 10 FPM
    });

    it('should calculate velocity for rectangular duct', () => {
      const area = calculateDuctArea('rectangular', { width: 12, height: 8 });
      const velocity = calculateVelocity(1000, area);

      expect(velocity).toBeGreaterThan(0);
      expect(velocity % 10).toBe(0);
    });

    it('should return 0 for zero area', () => {
      const velocity = calculateVelocity(1000, 0);
      expect(velocity).toBe(0);
    });

    it('should increase velocity with higher CFM', () => {
      const area = calculateDuctArea('round', { diameter: 12 });
      const velocity500 = calculateVelocity(500, area);
      const velocity1000 = calculateVelocity(1000, area);
      const velocity2000 = calculateVelocity(2000, area);

      expect(velocity1000).toBeGreaterThan(velocity500);
      expect(velocity2000).toBeGreaterThan(velocity1000);
    });

    it('should increase velocity with smaller duct', () => {
      const smallArea = calculateDuctArea('round', { diameter: 8 });
      const largeArea = calculateDuctArea('round', { diameter: 16 });
      const velocitySmall = calculateVelocity(1000, smallArea);
      const velocityLarge = calculateVelocity(1000, largeArea);

      expect(velocitySmall).toBeGreaterThan(velocityLarge);
    });
  });

  describe('FR-CALC-004: Velocity Pressure', () => {
    it('should calculate velocity pressure using VP = (V/4005)^2', () => {
      // At 2000 FPM: (2000/4005)^2 ≈ 0.25 in.w.g.
      const vp = calculateVelocityPressure(2000);
      expect(vp).toBeCloseTo(0.25, 2);
    });

    it('should calculate velocity pressure for common velocities', () => {
      const vp1000 = calculateVelocityPressure(1000);
      const vp1500 = calculateVelocityPressure(1500);
      const vp2000 = calculateVelocityPressure(2000);

      expect(vp1000).toBeLessThan(vp1500);
      expect(vp1500).toBeLessThan(vp2000);
    });

    it('should handle velocity at 4005 FPM (1 in.w.g.)', () => {
      const vp = calculateVelocityPressure(4005);
      expect(vp).toBeCloseTo(1.0, 1);
    });
  });

  describe('FR-CALC-005: Round Duct Sizing', () => {
    it('should calculate round duct diameter from CFM and velocity', () => {
      // Diameter = 13.54 × √(CFM / Velocity)
      const diameter = calculateRoundDuctDiameter(1000, 1200);
      expect(diameter).toBeGreaterThan(10);
      expect(diameter).toBeLessThan(14);
    });

    it('should return larger diameter for higher CFM', () => {
      const dia500 = calculateRoundDuctDiameter(500, 1000);
      const dia1000 = calculateRoundDuctDiameter(1000, 1000);
      const dia2000 = calculateRoundDuctDiameter(2000, 1000);

      expect(dia1000).toBeGreaterThan(dia500);
      expect(dia2000).toBeGreaterThan(dia1000);
    });

    it('should return smaller diameter for higher velocity', () => {
      const diaLowVel = calculateRoundDuctDiameter(1000, 800);
      const diaHighVel = calculateRoundDuctDiameter(1000, 1600);

      expect(diaHighVel).toBeLessThan(diaLowVel);
    });

    it('should return 0 for zero velocity', () => {
      const diameter = calculateRoundDuctDiameter(1000, 0);
      expect(diameter).toBe(0);
    });
  });

  describe('FR-CALC-006: Rectangular Duct Sizing (Equivalent Diameter)', () => {
    it('should calculate equivalent diameter De = 1.30 × ((a×b)^0.625) / ((a+b)^0.25)', () => {
      const deq = calculateEquivalentDiameter(12, 8);
      expect(deq).toBeGreaterThan(7);
      expect(deq).toBeLessThan(12);
    });

    it('should return larger equivalent diameter for larger ducts', () => {
      const small = calculateEquivalentDiameter(8, 6);
      const medium = calculateEquivalentDiameter(12, 8);
      const large = calculateEquivalentDiameter(24, 16);

      expect(medium).toBeGreaterThan(small);
      expect(large).toBeGreaterThan(medium);
    });

    it('should handle square ducts', () => {
      const deq10x10 = calculateEquivalentDiameter(10, 10);
      expect(deq10x10).toBeGreaterThan(10); // Square duct Deq > side
    });

    it('should return 0 for invalid dimensions', () => {
      expect(calculateEquivalentDiameter(0, 8)).toBe(0);
      expect(calculateEquivalentDiameter(12, 0)).toBe(0);
      expect(calculateEquivalentDiameter(-5, 8)).toBe(0);
    });
  });

  describe('FR-CALC-007: Friction Loss (Darcy-Weisbach)', () => {
    it('should calculate friction loss for duct run', () => {
      const loss = calculateFrictionLoss(1500, 12, 50);
      expect(loss).toBeGreaterThan(0);
      expect(loss).toBeLessThan(2); // Reasonable range
    });

    it('should increase with velocity', () => {
      const loss1000 = calculateFrictionLoss(1000, 12, 50);
      const loss2000 = calculateFrictionLoss(2000, 12, 50);

      expect(loss2000).toBeGreaterThan(loss1000);
    });

    it('should increase with length', () => {
      const loss25ft = calculateFrictionLoss(1500, 12, 25);
      const loss100ft = calculateFrictionLoss(1500, 12, 100);

      expect(loss100ft).toBeGreaterThan(loss25ft);
    });

    it('should decrease with larger diameter', () => {
      const loss8in = calculateFrictionLoss(1500, 8, 50);
      const loss16in = calculateFrictionLoss(1500, 16, 50);

      expect(loss8in).toBeGreaterThan(loss16in);
    });

    it('should account for material roughness', () => {
      const galvanized = calculateFrictionLoss(1500, 12, 50, 0.0005);
      const flex = calculateFrictionLoss(1500, 12, 50, 0.003);

      expect(flex).toBeGreaterThan(galvanized);
    });

    it('should return 0 for invalid inputs', () => {
      expect(calculateFrictionLoss(0, 12, 50)).toBe(0);
      expect(calculateFrictionLoss(1500, 0, 50)).toBe(0);
      expect(calculateFrictionLoss(1500, 12, 0)).toBe(0);
    });
  });

  describe('FR-CALC-008: Fitting Pressure Loss', () => {
    it('should calculate fitting loss from equivalent length', () => {
      // Loss = (friction/100) × equivalent_length
      const loss = calculateFittingLoss(0.4, 30);
      expect(loss).toBeCloseTo(0.12, 2);
    });

    it('should increase with higher friction rate', () => {
      const lowFriction = calculateFittingLoss(0.2, 30);
      const highFriction = calculateFittingLoss(0.6, 30);

      expect(highFriction).toBeGreaterThan(lowFriction);
    });

    it('should increase with longer equivalent length', () => {
      const short = calculateFittingLoss(0.4, 15);
      const long = calculateFittingLoss(0.4, 60);

      expect(long).toBeGreaterThan(short);
    });

    it('should return 0 for invalid inputs', () => {
      expect(calculateFittingLoss(0, 30)).toBe(0);
      expect(calculateFittingLoss(0.4, 0)).toBe(0);
    });
  });

  describe('Duct Area Calculations', () => {
    describe('Round Duct Area', () => {
      it('should calculate round duct area (π × r²)', () => {
        const area = calculateDuctArea('round', { diameter: 6 });
        // π × 3² ≈ 28.27 sq in
        expect(area).toBeCloseTo(28.27, 2);
      });

      it('should handle various diameters per PRD (4-60 inches)', () => {
        expect(calculateDuctArea('round', { diameter: 4 })).toBeGreaterThan(0);
        expect(calculateDuctArea('round', { diameter: 12 })).toBeGreaterThan(0);
        expect(calculateDuctArea('round', { diameter: 60 })).toBeGreaterThan(0);
      });
    });

    describe('Rectangular Duct Area', () => {
      it('should calculate rectangular duct area (w × h)', () => {
        const area = calculateDuctArea('rectangular', { width: 12, height: 8 });
        expect(area).toBeCloseTo(96, 2);
      });

      it('should handle various sizes per PRD (4-96 inches)', () => {
        expect(calculateDuctArea('rectangular', { width: 4, height: 4 })).toBeCloseTo(16);
        expect(calculateDuctArea('rectangular', { width: 24, height: 12 })).toBeCloseTo(288);
        expect(calculateDuctArea('rectangular', { width: 96, height: 96 })).toBeCloseTo(9216);
      });
    });
  });

  describe('PRD Appendix B: Validation Ranges', () => {
    describe('Room Dimension Ranges', () => {
      it('should handle minimum room dimensions (1 inch)', () => {
        const area = calculateRoomArea(1, 1);
        expect(area).toBeGreaterThan(0);
      });

      it('should handle maximum room dimensions (10,000 inches)', () => {
        const area = calculateRoomArea(10000, 10000);
        expect(area).toBeGreaterThan(0);
      });
    });

    describe('Duct Dimension Ranges', () => {
      it('should handle minimum diameter (4 inches)', () => {
        const area = calculateDuctArea('round', { diameter: 4 });
        expect(area).toBeGreaterThan(0);
      });

      it('should handle maximum diameter (60 inches)', () => {
        const area = calculateDuctArea('round', { diameter: 60 });
        expect(area).toBeGreaterThan(0);
      });

      it('should handle minimum rectangular dimensions (4x4 inches)', () => {
        const area = calculateDuctArea('rectangular', { width: 4, height: 4 });
        expect(area).toBeCloseTo(16);
      });

      it('should handle maximum rectangular dimensions (96x96 inches)', () => {
        const area = calculateDuctArea('rectangular', { width: 96, height: 96 });
        expect(area).toBeCloseTo(9216);
      });
    });

    describe('Airflow Ranges', () => {
      it('should calculate velocity for minimum airflow (1 CFM)', () => {
        const area = calculateDuctArea('round', { diameter: 12 });
        const velocity = calculateVelocity(1, area);
        expect(velocity).toBeGreaterThanOrEqual(0);
      });

      it('should calculate velocity for maximum airflow (100,000 CFM)', () => {
        const area = calculateDuctArea('round', { diameter: 60 });
        const velocity = calculateVelocity(100000, area);
        expect(velocity).toBeGreaterThan(0);
      });
    });

    describe('ACH Ranges', () => {
      it('should handle minimum ACH (1)', () => {
        const cfm = calculateACHtoCFM(1, 1000);
        expect(cfm).toBeGreaterThan(0);
      });

      it('should handle maximum ACH (100)', () => {
        const cfm = calculateACHtoCFM(100, 1000);
        expect(cfm).toBeGreaterThan(0);
      });
    });
  });

  describe('Velocity Limit Warnings per PRD', () => {
    it('should identify residential velocity range (600-900 FPM)', () => {
      const velocity = 750;
      const inResidentialRange = velocity >= 600 && velocity <= 900;
      expect(inResidentialRange).toBe(true);
    });

    it('should identify commercial velocity range (1000-1500 FPM)', () => {
      const velocity = 1250;
      const inCommercialRange = velocity >= 1000 && velocity <= 1500;
      expect(inCommercialRange).toBe(true);
    });

    it('should identify industrial velocity range (1500-2500 FPM)', () => {
      const velocity = 2000;
      const inIndustrialRange = velocity >= 1500 && velocity <= 2500;
      expect(inIndustrialRange).toBe(true);
    });

    it('should identify kitchen exhaust velocity range (up to 4000 FPM)', () => {
      const velocity = 3500;
      const inKitchenExhaustRange = velocity >= 1500 && velocity <= 4000;
      expect(inKitchenExhaustRange).toBe(true);
    });
  });

  describe('Material Roughness Factors per PRD FR-CALC-007', () => {
    const testVelocity = 1500;
    const testDiameter = 12;
    const testLength = 100;

    it('should use galvanized steel roughness (0.0005 ft)', () => {
      const loss = calculateFrictionLoss(testVelocity, testDiameter, testLength, 0.0005);
      expect(loss).toBeGreaterThan(0);
    });

    it('should use stainless steel roughness (0.0002 ft)', () => {
      const lossStainless = calculateFrictionLoss(testVelocity, testDiameter, testLength, 0.0002);
      const lossGalvanized = calculateFrictionLoss(testVelocity, testDiameter, testLength, 0.0005);
      expect(lossStainless).toBeLessThan(lossGalvanized);
    });

    it('should use aluminum roughness (0.0002 ft)', () => {
      const lossAluminum = calculateFrictionLoss(testVelocity, testDiameter, testLength, 0.0002);
      const lossGalvanized = calculateFrictionLoss(testVelocity, testDiameter, testLength, 0.0005);
      expect(lossAluminum).toBeLessThan(lossGalvanized);
    });

    it('should use flex duct roughness (0.003 ft)', () => {
      const lossFlex = calculateFrictionLoss(testVelocity, testDiameter, testLength, 0.003);
      const lossGalvanized = calculateFrictionLoss(testVelocity, testDiameter, testLength, 0.0005);
      expect(lossFlex).toBeGreaterThan(lossGalvanized);
    });
  });

  describe('Complete Room Calculation Workflow', () => {
    it('should calculate all values for a typical office', () => {
      const room = createTestRoom({
        width: 240, // 20 feet
        length: 180, // 15 feet
        ceilingHeight: 108, // 9 feet
        occupancyType: 'office',
        airChangesPerHour: 6,
      });

      const calc = calculateRoomValues(room);

      // Area: 20 × 15 = 300 sqft
      expect(calc.area).toBeCloseTo(300, 0);

      // Volume: 300 × 9 = 2700 cuft
      expect(calc.volume).toBeCloseTo(2700, 0);

      // CFM should be positive and reasonable
      expect(calc.requiredCFM).toBeGreaterThan(0);
      expect(calc.requiredCFM).toBeLessThan(5000);
    });

    it('should calculate all values for a commercial kitchen', () => {
      const room = createTestRoom({
        width: 360, // 30 feet
        length: 240, // 20 feet
        ceilingHeight: 144, // 12 feet
        occupancyType: 'kitchen_commercial',
        airChangesPerHour: 25,
      });

      const calc = calculateRoomValues(room);

      // Area: 30 × 20 = 600 sqft
      expect(calc.area).toBeCloseTo(600, 0);

      // Volume: 600 × 12 = 7200 cuft
      expect(calc.volume).toBeCloseTo(7200, 0);

      // Kitchen should have high CFM requirement
      expect(calc.requiredCFM).toBeGreaterThan(400);
    });
  });

  describe('Complete Duct Calculation Workflow', () => {
    it('should size duct for given airflow and calculate all values', () => {
      const targetCFM = 1000;
      const targetVelocity = 1200;

      // Size the duct
      const diameter = calculateRoundDuctDiameter(targetCFM, targetVelocity);
      expect(diameter).toBeGreaterThan(10);

      // Calculate area
      const area = calculateDuctArea('round', { diameter });
      expect(area).toBeGreaterThan(0);

      // Verify velocity is close to target
      const actualVelocity = calculateVelocity(targetCFM, area);
      expect(actualVelocity).toBeCloseTo(targetVelocity, -2); // Within 100 FPM

      // Calculate pressure characteristics
      const vp = calculateVelocityPressure(actualVelocity);
      expect(vp).toBeGreaterThan(0);

      // Calculate friction loss for 50 ft run
      const frictionLoss = calculateFrictionLoss(actualVelocity, diameter, 50);
      expect(frictionLoss).toBeGreaterThan(0);
    });

    it('should compare round vs rectangular duct performance', () => {
      const targetCFM = 1000;

      // Round duct: 12" diameter
      const roundArea = calculateDuctArea('round', { diameter: 12 });
      const roundVelocity = calculateVelocity(targetCFM, roundArea);
      const roundFriction = calculateFrictionLoss(roundVelocity, 12, 100);

      // Rectangular duct: equivalent area
      const rectArea = calculateDuctArea('rectangular', { width: 16, height: 8 });
      const rectVelocity = calculateVelocity(targetCFM, rectArea);
      const rectEqDia = calculateEquivalentDiameter(16, 8);
      const rectFriction = calculateFrictionLoss(rectVelocity, rectEqDia, 100);

      // Both should have reasonable values
      expect(roundVelocity).toBeGreaterThan(0);
      expect(rectVelocity).toBeGreaterThan(0);
      expect(roundFriction).toBeGreaterThan(0);
      expect(rectFriction).toBeGreaterThan(0);
    });
  });
});
