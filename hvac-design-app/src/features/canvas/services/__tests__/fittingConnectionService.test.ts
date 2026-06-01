import { describe, expect, it } from 'vitest';
import type { Fitting } from '@/core/schema';
import { findNearestFittingConnection, getWorldConnectionPoints } from '../fittingConnectionService';

const now = '2026-01-01T00:00:00.000Z';

function fitting(type: Fitting['props']['fittingType']): Fitting {
  return {
    id: '550e8400-e29b-41d4-a716-446655449020',
    type: 'fitting',
    transform: { x: 200, y: 140, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 10,
    createdAt: now,
    modifiedAt: now,
    props: {
      engineeringSystem: 'standard_duct',
      fittingType: type,
      manualOverride: false,
    },
    calculated: { equivalentLength: 0, pressureLoss: 0 },
  };
}

describe('fittingConnectionService compatibility', () => {
  it('adapts resolved fitting geometry to legacy world connection points', () => {
    const points = getWorldConnectionPoints(fitting('reducer'));

    expect(points).toEqual([
      expect.objectContaining({ role: 'inlet', localX: -25.2, localY: 0, worldX: 174.8, worldY: 140 }),
      expect.objectContaining({ role: 'outlet', localX: 25.2, localY: 0, worldX: 225.2, worldY: 140 }),
    ]);
  });

  it('finds the SD5-2 wye branch port from resolved reference geometry', () => {
    // Wye geometry is centered on the main run, so the branch sits at ~(196,126).
    const result = findNearestFittingConnection(196, 126, [fitting('wye')], 12);

    expect(result?.connection.role).toBe('branch');
    expect(result?.connection.worldX).toBeCloseTo(196.03, 2);
    expect(result?.connection.worldY).toBeCloseTo(125.73, 2);
  });
});
