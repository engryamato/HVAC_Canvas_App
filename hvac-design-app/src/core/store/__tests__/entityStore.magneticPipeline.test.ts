import { beforeEach, describe, expect, it } from 'vitest';
import type { DuctRun, Entity, Equipment } from '@/core/schema';
import { useDuctOverlayStore } from '../ductOverlayStore';
import { useEntityStore } from '../entityStore';
import { useValidationStore } from '../validationStore';

const now = '2026-01-01T00:00:00.000Z';

function ductRun(id: string, x: number, lengthFeet = 10, props: Partial<DuctRun['props']> = {}): DuctRun {
  return {
    id,
    type: 'duct_run',
    transform: { x, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: id,
      engineeringSystem: 'standard_duct',
      shape: 'rectangular',
      width: 12,
      height: 12,
      material: 'galvanized',
      airflow: 1000,
      staticPressure: 0.1,
      installLength: lengthFeet,
      segments: [{ index: 0, startStation: 0, endStation: lengthFeet, length: lengthFeet, isPartial: false }],
      ...props,
    } as DuctRun['props'],
    calculated: { area: 144, velocity: 1000, frictionLoss: 0.1 },
  };
}

function sourceEquipment(id: string, x: number): Equipment {
  return {
    id,
    type: 'equipment',
    transform: { x, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: id,
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
    },
  };
}

describe('entityStore magnetic calculation pipeline', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useValidationStore.getState().clearAll();
    useDuctOverlayStore.getState().resetOverlay();
  });

  it('committed addEntities reconciles connections, calculates pressure, and precomputes overlay status', () => {
    const source = sourceEquipment('550e8400-e29b-41d4-a716-446655441000', 0);
    const run = ductRun('550e8400-e29b-41d4-a716-446655441001', 0);

    useDuctOverlayStore.getState().setOverlayMode('pressure');
    useEntityStore.getState().addEntities([source, run]);

    const committed = useEntityStore.getState().byId[run.id] as DuctRun;
    expect(committed.props.connectedFrom).toBe(source.id);
    expect(committed.calculated.cumulativePressureDrop).toBeGreaterThan(0);
    expect(committed.calculated.availableStaticPressure).toBeLessThan(2);
    expect(useDuctOverlayStore.getState().overlayStatusMap[run.id]).toMatchObject({
      neutral: false,
      color: '#16a34a',
    });
  });

  it('committed pipeline computes airflow, velocity, and friction for new source-connected duct runs', () => {
    const source = sourceEquipment('550e8400-e29b-41d4-a716-446655441030', 0);
    const run = ductRun('550e8400-e29b-41d4-a716-446655441031', 0, 12, {
      airflow: 0,
    });
    run.calculated = { area: 120, velocity: 0, frictionLoss: 0 };

    useEntityStore.getState().addEntities([source, run]);

    const committed = useEntityStore.getState().byId[run.id] as DuctRun;
    expect(committed.props.airflow).toBe(2000);
    expect(committed.calculated.velocity).toBeGreaterThan(0);
    expect(committed.calculated.frictionLoss).toBeGreaterThan(0);
    expect(committed.calculated.cumulativePressureDrop).toBeGreaterThan(0);
    expect(committed.calculated.availableStaticPressure).toBeLessThan(2);
  });

  it('transient updates do not run reconciliation or calculation until committed', () => {
    const source = sourceEquipment('550e8400-e29b-41d4-a716-446655441010', 0);
    const run = ductRun('550e8400-e29b-41d4-a716-446655441011', 240);
    useEntityStore.getState().addEntities([source, run]);
    useValidationStore.getState().clearAll();

    useEntityStore.getState().updateEntityTransient(run.id, {
      transform: { ...run.transform, x: 0 },
    });

    expect((useEntityStore.getState().byId[run.id] as DuctRun).props.connectedFrom).toBeUndefined();
    expect(useValidationStore.getState().validationResults[run.id]).toBeUndefined();

    useEntityStore.getState().commitNetwork();

    expect((useEntityStore.getState().byId[run.id] as DuctRun).props.connectedFrom).toBe(source.id);
  });

  it('committed pipeline writes validation warnings and clears propagated pressure for invalid components', () => {
    const isolated = ductRun('550e8400-e29b-41d4-a716-446655441020', 0, 10, {
      connectedFrom: '550e8400-e29b-41d4-a716-446655441099',
    });
    useEntityStore.getState().hydrate({ byId: { [isolated.id]: isolated as Entity }, allIds: [isolated.id] });

    const committed = useEntityStore.getState().byId[isolated.id] as DuctRun;
    expect(committed.calculated.availableStaticPressure).toBeUndefined();
    expect(useValidationStore.getState().validationResults[isolated.id]?.violations[0]?.message).toContain('NO_SOURCE');
  });
});
