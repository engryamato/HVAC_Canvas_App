import { describe, expect, it } from 'vitest';
import type { Equipment } from '@/core/schema';
import { resolveEquipmentGeometry } from '../equipmentResolver';

const equipment: Equipment = {
  id: '550e8400-e29b-41d4-a716-446655449010',
  type: 'equipment',
  transform: { x: 100, y: 100, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 5,
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  props: {
    name: 'AHU-1',
    engineeringSystem: 'standard_duct',
    equipmentType: 'air_handler',
    capacity: 2000,
    capacityUnit: 'CFM',
    staticPressure: 2,
    staticPressureUnit: 'in_wg',
    width: 60,
    depth: 48,
    height: 72,
    mountHeightUnit: 'in',
    connectionPorts: [
      { id: 'supply-1', role: 'supply', edge: 'east', offsetRatio: 0.3, label: 'Supply' },
      { id: 'return-1', role: 'return', edge: 'west', offsetRatio: 0.3, label: 'Return' },
    ],
  },
};

describe('resolveEquipmentGeometry', () => {
  it('adapts existing equipment connectionPorts into resolved connection points', () => {
    const geometry = resolveEquipmentGeometry(equipment);

    expect(geometry.connectionPoints).toHaveLength(2);
    expect(geometry.connectionPoints[0]).toMatchObject({
      id: 'supply-1',
      objectId: equipment.id,
      role: 'supply',
      localPosition: { x: 60, y: 14.4 },
      worldPosition: { x: 160, y: 114.4 },
      facingDirection: { x: 1, y: 0 },
    });
    expect(geometry.connectionPoints[1]).toMatchObject({
      id: 'return-1',
      role: 'return',
      worldPosition: { x: 100, y: 114.4 },
      facingDirection: { x: -1, y: 0 },
    });
  });
});
