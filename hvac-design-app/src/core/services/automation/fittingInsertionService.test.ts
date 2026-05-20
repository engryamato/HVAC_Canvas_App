import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Entity, Fitting } from '@/core/schema';
import { fittingInsertionService } from './fittingInsertionService';

describe('fittingInsertionService latest duct-run auto-fitting behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists branch profile dimensions on generated elbow fittings', () => {
    const inlet = {
      id: '11111111-1111-4111-8111-111111111111',
      type: 'duct_run',
      transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, elevation: 0 },
      zIndex: 1,
      props: {
        name: 'Inlet',
        engineeringSystem: 'standard_duct',
        shape: 'round',
        diameter: 18,
        material: 'galvanized',
        airflow: 0,
        staticPressure: 0.1,
        installLength: 10,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 120, y: 0 },
        segments: [{ index: 0, startStation: 0, endStation: 10, length: 10, isPartial: false }],
      },
      calculated: { area: 0, velocity: 0, frictionLoss: 0 },
      createdAt: '',
      modifiedAt: '',
    } as Entity;
    const outlet = {
      id: '22222222-2222-4222-8222-222222222222',
      type: 'duct_run',
      transform: { x: 0, y: 0, rotation: 90, scaleX: 1, scaleY: 1, elevation: 0 },
      zIndex: 1,
      props: {
        name: 'Outlet',
        engineeringSystem: 'standard_duct',
        shape: 'rectangular',
        width: 24,
        height: 12,
        material: 'galvanized',
        airflow: 0,
        staticPressure: 0.1,
        installLength: 10,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 0, y: 120 },
        segments: [{ index: 0, startStation: 0, endStation: 10, length: 10, isPartial: false }],
      },
      calculated: { area: 0, velocity: 0, frictionLoss: 0 },
      createdAt: '',
      modifiedAt: '',
    } as Entity;

    const fitting = (fittingInsertionService as any).buildFittingFromJunction(
      {
        type: 'elbow',
        location: { x: 0, y: 0 },
        ducts: [inlet.id, outlet.id],
        angle: 90,
        branches: [
          {
            ductId: inlet.id,
            endPoint: 'end',
            point: { x: 0, y: 0 },
            angle: 0,
            profile: { shape: 'round', equivalentDiameter: 18, diameter: 18 },
          },
          {
            ductId: outlet.id,
            endPoint: 'start',
            point: { x: 0, y: 0 },
            angle: 90,
            profile: { shape: 'rectangular', equivalentDiameter: 18, width: 24, height: 12 },
          },
        ],
      },
      { [inlet.id]: inlet, [outlet.id]: outlet }
    ) as Fitting;

    expect(fitting.props.transitionData).toMatchObject({
      fromShape: 'round',
      fromDiameter: 18,
      toShape: 'rectangular',
      toWidth: 24,
      toHeight: 12,
    });
  });

  it('plans auto-insert fittings for duct_run entities, not only legacy ducts', () => {
    const trunk = {
      id: '33333333-3333-4333-8333-333333333333',
      type: 'duct_run',
      transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, elevation: 0 },
      zIndex: 1,
      props: {
        name: 'Trunk',
        engineeringSystem: 'standard_duct',
        shape: 'round',
        diameter: 16,
        material: 'galvanized',
        airflow: 0,
        staticPressure: 0.1,
        installLength: 10,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 120, y: 0 },
        segments: [{ index: 0, startStation: 0, endStation: 10, length: 10, isPartial: false }],
      },
      calculated: { area: 0, velocity: 0, frictionLoss: 0 },
      createdAt: '',
      modifiedAt: '',
    } as Entity;
    const branch = {
      id: '44444444-4444-4444-8444-444444444444',
      type: 'duct_run',
      transform: { x: 120, y: 0, rotation: 90, scaleX: 1, scaleY: 1, elevation: 0 },
      zIndex: 1,
      props: {
        name: 'Branch',
        engineeringSystem: 'standard_duct',
        shape: 'round',
        diameter: 10,
        material: 'galvanized',
        airflow: 0,
        staticPressure: 0.1,
        installLength: 10,
        startPoint: { x: 120, y: 0 },
        endPoint: { x: 120, y: 120 },
        segments: [{ index: 0, startStation: 0, endStation: 10, length: 10, isPartial: false }],
      },
      calculated: { area: 0, velocity: 0, frictionLoss: 0 },
      createdAt: '',
      modifiedAt: '',
    } as Entity;

    const plan = fittingInsertionService.planAutoInsertForDuct(branch.id, {
      [trunk.id]: trunk,
      [branch.id]: branch,
    });

    expect(plan.insertions).toHaveLength(1);
    expect(plan.insertions[0]?.props.fittingType).toBe('elbow_90');
  });
});
