
import { describe, it, expect, beforeEach } from 'vitest';
import { useEntityStore } from '../core/store/entityStore';
import { Entity, Duct } from '../core/schema';

describe('Flow Propagation Integration', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
  });

  it('should propagate flow from equipment to connected duct', () => {
    // 1. Create Equipment (Diffuser) with 1000 CFM
    const diffuser: Entity = {
      id: 'diffuser-1',
      type: 'equipment',
      props: {
        capacity: 1000,
        equipmentType: 'diffuser',
        name: 'Diffuser 1'
      } as any,
      connectedTo: 'duct-1',
      transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 1,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    } as unknown as Entity;

    // 2. Create Duct with 0 CFM initial
    const duct: Entity = {
      id: 'duct-1',
      type: 'duct',
      props: {
        airflow: 0,
        length: 10,
        name: 'Duct 1'
      } as any,
      transform: { x: 10, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 1,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    } as unknown as Entity;

    // 3. Add entities to store
    useEntityStore.getState().addEntity(duct);
    
    // Verify initial state
    const duct1Initial = useEntityStore.getState().byId['duct-1'] as Duct;
    expect(duct1Initial.props.airflow).toBe(0);

    // Adding diffuser connected to duct
    useEntityStore.getState().addEntity(diffuser);

    // 4. Verify propagation
    const duct1Updated = useEntityStore.getState().byId['duct-1'] as Duct;
    expect(duct1Updated.props.airflow).toBe(1000);
  });

  it('should reset flow to 0 when equipment is removed', () => {
    const diffuser: Entity = {
      id: 'diffuser-1',
      type: 'equipment',
      props: {
        capacity: 500,
        equipmentType: 'diffuser',
        name: 'Diffuser 1'
      } as any,
      connectedTo: 'duct-1',
      transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 1,
      createdAt: '', modifiedAt: ''
    } as unknown as Entity;

    const duct: Entity = {
      id: 'duct-1',
      type: 'duct',
      props: { airflow: 0 } as any,
      transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 1,
      createdAt: '', modifiedAt: ''
    } as unknown as Entity;

    useEntityStore.getState().addEntities([diffuser, duct]);
    
    // Verify flow propagated
    const duct1First = useEntityStore.getState().byId['duct-1'] as Duct;
    expect(duct1First.props.airflow).toBe(500);

    // Remove diffuser
    useEntityStore.getState().removeEntity('diffuser-1');

    // Verify flow reset
    const duct1Reset = useEntityStore.getState().byId['duct-1'] as Duct;
    expect(duct1Reset.props.airflow).toBe(0);
  });
  
  it('should propagate flow through a chain: Diffuser -> Duct1 -> Duct2', () => {
    const diffuser: Entity = {
      id: 'd1', type: 'equipment', connectedTo: 'duct1',
      props: { capacity: 800, equipmentType: 'diffuser' } as any,
      transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }, zIndex: 0, createdAt: '', modifiedAt: ''
    } as unknown as Entity;
    
    const duct1: Entity = {
      id: 'duct1', type: 'duct', connectedTo: 'duct2',
      props: { airflow: 0 } as any,
      transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }, zIndex: 0, createdAt: '', modifiedAt: ''
    } as unknown as Entity;
    
    const duct2: Entity = {
      id: 'duct2', type: 'duct',
      props: { airflow: 0 } as any,
      transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }, zIndex: 0, createdAt: '', modifiedAt: ''
    } as unknown as Entity;

    useEntityStore.getState().addEntities([diffuser, duct1, duct2]);

    const d1 = useEntityStore.getState().byId['duct1'] as Duct;
    const d2 = useEntityStore.getState().byId['duct2'] as Duct;

    expect(d1.props.airflow).toBe(800);
    expect(d2.props.airflow).toBe(800);
  });
});
