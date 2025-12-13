import { describe, it, expect } from 'vitest';
import {
  calculateRoomArea,
  calculateRoomVolume,
  calculateACHtoCFM,
  calculateVentilationCFM,
  calculateRoomValues,
} from '../ventilation';

describe('ventilation calculations', () => {
  it('calculates room area and volume from inches', () => {
    expect(calculateRoomArea(120, 120)).toBeCloseTo(100); // 10ft x 10ft
    expect(calculateRoomVolume(120, 120, 96)).toBeCloseTo(800); // 10x10x8
  });

  it('converts ACH to CFM', () => {
    expect(calculateACHtoCFM(6, 800)).toBe(80); // (800*6)/60 = 80
  });

  it('calculates ventilation CFM using Rp/Ra', () => {
    const area = 200; // sqft
    const cfm = calculateVentilationCFM('office', area);
    expect(cfm).toBeGreaterThan(0);
    expect(cfm % 5).toBe(0); // rounded to nearest 5
  });

  it('combines into room calculated values', () => {
    const room = {
      id: 'id',
      type: 'room' as const,
      transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 0,
      createdAt: '2025-01-01T00:00:00.000Z',
      modifiedAt: '2025-01-01T00:00:00.000Z',
      props: {
        name: 'Test',
        width: 120,
        length: 120,
        height: 96,
        occupancyType: 'office' as const,
        airChangesPerHour: 6,
      },
      calculated: { area: 0, volume: 0, requiredCFM: 0 },
    };

    const calc = calculateRoomValues(room);
    expect(calc.area).toBeCloseTo(100);
    expect(calc.volume).toBeCloseTo(800);
    expect(calc.requiredCFM).toBeGreaterThan(0);
  });
});
