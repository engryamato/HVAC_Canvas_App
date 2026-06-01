import { describe, expect, it } from 'vitest';
import type { DuctRun, Equipment } from '@/core/schema';
import { createDuctRun } from '../../entities/ductRunDefaults';
import {
  getEquipmentPlanBounds,
  getEquipmentPortWorldPosition,
  resolvePortFlow,
} from '../equipmentGeometry';
import { resolveDuctConnectionProfile } from '../ductConnectionProfile';

function createEquipment(): Equipment {
  return {
    id: '550e8400-e29b-41d4-a716-446655444000',
    type: 'equipment',
    transform: { x: 100, y: 50, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt: '2026-01-01T00:00:00.000Z',
    props: {
      name: 'RTU-1',
      engineeringSystem: 'standard_duct',
      equipmentType: 'rtu',
      capacity: 2400,
      capacityUnit: 'CFM',
      staticPressure: 1,
      staticPressureUnit: 'in_wg',
      width: 84,
      depth: 36,
      height: 120,
      mountHeightUnit: 'in',
      connectionPorts: [
        { id: 'supply-1', role: 'supply', edge: 'south', offsetRatio: 0.35, label: 'Supply' },
        { id: 'return-1', role: 'return', edge: 'south', offsetRatio: 0.65, label: 'Return' },
      ],
    },
  };
}

describe('equipment geometry and duct connection profiles', () => {
  it('uses equipment width and depth for plan bounds and ignores physical height', () => {
    const equipment = createEquipment();

    expect(getEquipmentPlanBounds(equipment)).toEqual({ x: 100, y: 50, width: 84, height: 36 });
    expect(getEquipmentPortWorldPosition(equipment.props.connectionPorts![0]!, equipment)).toMatchObject({
      x: 129.4,
      y: 86,
    });
  });

  it('resolves port flow from port role and id, not marker shape', () => {
    const equipment = createEquipment();

    expect(resolvePortFlow(equipment.props.connectionPorts![0]!)).toEqual({
      role: 'supply',
      direction: 'out',
      portId: 'supply-1',
    });
    expect(resolvePortFlow(equipment.props.connectionPorts![1]!)).toEqual({
      role: 'return',
      direction: 'in',
      portId: 'return-1',
    });
  });

  it('uses only width or diameter for magnetic visual size while preserving full duct metadata', () => {
    const rectangularRun = createDuctRun({
      shape: 'rectangular',
      width: 24,
      height: 12,
      installLength: 10,
      airflow: 1200,
      staticPressure: 0.1,
    }) as DuctRun;
    const roundRun = createDuctRun({
      shape: 'round',
      diameter: 18,
      installLength: 10,
      airflow: 900,
      staticPressure: 0.1,
    }) as DuctRun;
    const flatOvalRun = createDuctRun({
      engineeringSystem: 'generator_exhaust',
      systemType: 'exhaust',
      shape: 'flat_oval',
      width: 30,
      height: 12,
      installLength: 10,
      airflow: 700,
      staticPressure: 0.1,
    }) as DuctRun;

    expect(resolveDuctConnectionProfile(rectangularRun)).toMatchObject({
      markerKind: 'rect',
      visualSize: 24,
      metadata: {
        shape: 'rectangular',
        width: 24,
        height: 12,
        airflow: 1200,
      },
    });
    expect(resolveDuctConnectionProfile(roundRun)).toMatchObject({
      markerKind: 'circle',
      visualSize: 18,
      metadata: {
        shape: 'round',
        diameter: 18,
        airflow: 900,
      },
    });
    expect(resolveDuctConnectionProfile(flatOvalRun)).toMatchObject({
      markerKind: 'rect',
      visualSize: 30,
      metadata: {
        shape: 'flat_oval',
        width: 30,
        height: 12,
        airflow: 700,
        engineeringSystem: 'generator_exhaust',
        systemType: 'exhaust',
      },
    });
  });
});
