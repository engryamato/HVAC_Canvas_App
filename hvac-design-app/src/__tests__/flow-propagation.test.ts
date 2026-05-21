import { beforeEach, describe, expect, it } from 'vitest';
import { useEntityStore } from '../core/store/entityStore';
import type { Duct, Equipment } from '../core/schema';

const now = '2026-01-01T00:00:00.000Z';

function diffuser(id: string, connectedDuctId: string, capacity: number): Equipment {
  return {
    id,
    type: 'equipment',
    props: {
      engineeringSystem: 'standard_duct',
      capacity,
      capacityUnit: 'CFM',
      staticPressure: 0.2,
      staticPressureUnit: 'in_wg',
      equipmentType: 'diffuser',
      name: id,
      width: 24,
      depth: 24,
      height: 4,
      mountHeightUnit: 'in',
      connectedDuctId,
    },
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: now,
    modifiedAt: now,
  };
}

function duct(id: string, props: Partial<Duct['props']> = {}): Duct {
  return {
    id,
    type: 'duct',
    props: {
      engineeringSystem: 'standard_duct',
      name: id,
      shape: 'round',
      diameter: 12,
      length: 10,
      material: 'galvanized',
      airflow: 0,
      staticPressure: 0.1,
      ...props,
    },
    calculated: { area: 113.1, velocity: 0, frictionLoss: 0 },
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: now,
    modifiedAt: now,
  };
}

describe('Flow Propagation Integration', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
  });

  it('reconciles terminal equipment metadata without propagating flow for unsupported topology', () => {
    const duct1 = duct('550e8400-e29b-41d4-a716-446655440001', {
      connectedFrom: '550e8400-e29b-41d4-a716-446655440010',
    });
    const terminal = diffuser('550e8400-e29b-41d4-a716-446655440010', duct1.id, 1000);

    useEntityStore.getState().addEntities([terminal, duct1]);

    const stored = useEntityStore.getState().byId[duct1.id] as Duct;
    expect(stored.props.connectedFrom).toBe(terminal.id);
    expect(stored.props.airflow).toBe(0);
  });

  it('keeps unsupported topology flow at zero when connected terminal equipment is removed', () => {
    const duct1 = duct('550e8400-e29b-41d4-a716-446655440011', {
      connectedFrom: '550e8400-e29b-41d4-a716-446655440012',
    });
    const terminal = diffuser('550e8400-e29b-41d4-a716-446655440012', duct1.id, 500);

    useEntityStore.getState().addEntities([terminal, duct1]);
    expect((useEntityStore.getState().byId[duct1.id] as Duct).props.airflow).toBe(0);

    useEntityStore.getState().removeEntity(terminal.id);

    const reset = useEntityStore.getState().byId[duct1.id] as Duct;
    expect(reset.props.connectedFrom).toBeUndefined();
    expect(reset.props.airflow).toBe(0);
  });

  it('keeps duct-chain flow at zero until the topology is calculation-valid', () => {
    const terminal = diffuser(
      '550e8400-e29b-41d4-a716-446655440020',
      '550e8400-e29b-41d4-a716-446655440021',
      800
    );
    const duct1 = duct('550e8400-e29b-41d4-a716-446655440021', {
      connectedFrom: terminal.id,
      connectedTo: '550e8400-e29b-41d4-a716-446655440022',
    });
    const duct2 = duct('550e8400-e29b-41d4-a716-446655440022', {
      connectedFrom: duct1.id,
    });

    useEntityStore.getState().addEntities([terminal, duct1, duct2]);

    expect((useEntityStore.getState().byId[duct1.id] as Duct).props.airflow).toBe(0);
    expect((useEntityStore.getState().byId[duct2.id] as Duct).props.airflow).toBe(0);
  });
});
