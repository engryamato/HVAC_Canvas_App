import { describe, expect, it } from 'vitest';
import type { Duct, DuctRun } from '@/core/schema';
import { resolveDuctEndpoints } from '../ductEndpointResolver';

const now = '2026-01-01T00:00:00.000Z';

function duct(): Duct {
  return {
    id: '550e8400-e29b-41d4-a716-446655449030',
    type: 'duct',
    transform: { x: 100, y: 200, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: 'Duct',
      engineeringSystem: 'standard_duct',
      shape: 'round',
      diameter: 12,
      length: 10,
      material: 'galvanized',
      airflow: 0,
      staticPressure: 0.1,
    },
    calculated: { area: 113, velocity: 0, frictionLoss: 0 },
  };
}

function ductRun(): DuctRun {
  return {
    id: '550e8400-e29b-41d4-a716-446655449031',
    type: 'duct_run',
    transform: { x: 50, y: 80, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: 'Run',
      engineeringSystem: 'standard_duct',
      shape: 'rectangular',
      width: 12,
      height: 8,
      material: 'galvanized',
      airflow: 0,
      staticPressure: 0.1,
      installLength: 20,
      startPoint: { x: 50, y: 80 },
      endPoint: { x: 90, y: 140 },
      segments: [{ index: 0, startStation: 0, endStation: 20, length: 20, isPartial: false }],
    },
    calculated: { area: 96, velocity: 0, frictionLoss: 0 },
  };
}

describe('resolveDuctEndpoints', () => {
  it('resolves legacy duct start and end endpoints with profiles', () => {
    const endpoints = resolveDuctEndpoints(duct());

    expect(endpoints).toEqual([
      expect.objectContaining({
        entityId: '550e8400-e29b-41d4-a716-446655449030',
        endpoint: 'start',
        worldPosition: { x: 100, y: 200 },
        connectionProfile: { shape: 'round', diameter: 12 },
      }),
      expect.objectContaining({
        endpoint: 'end',
        worldPosition: { x: 220, y: 200 },
      }),
    ]);
  });

  it('uses explicit duct_run startPoint and endPoint when present', () => {
    const endpoints = resolveDuctEndpoints(ductRun());

    expect(endpoints).toEqual([
      expect.objectContaining({
        entityId: '550e8400-e29b-41d4-a716-446655449031',
        endpoint: 'start',
        worldPosition: { x: 50, y: 80 },
        connectionProfile: { shape: 'rectangular', width: 12, height: 8 },
      }),
      expect.objectContaining({
        endpoint: 'end',
        worldPosition: { x: 90, y: 140 },
      }),
    ]);
  });
});
