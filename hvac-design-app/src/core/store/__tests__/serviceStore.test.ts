/**
 * Unit tests for serviceStore
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useServiceStore } from '../serviceStore';
import { Service } from '@/core/schema/service.schema';

describe('serviceStore', () => {
  beforeEach(() => {
    // Reset store state
    useServiceStore.setState({
      services: {},
      activeServiceId: null,
      baselineTemplates: useServiceStore.getState().baselineTemplates,
    });
  });

  describe('addService', () => {
    it('should add a new service', () => {
      const newService: Service = {
        id: 'custom-1',
        name: 'Custom Service',
        systemType: 'supply',
        pressureClass: 'low-pressure',
        material: 'galvanized',
        color: '#FF0000',
        dimensionalConstraints: {
          allowedShapes: ['round'],
        },
        fittingRules: [],
      };

      useServiceStore.getState().addService(newService);

      const state = useServiceStore.getState();
      expect(state.services['custom-1']).toEqual(newService);
    });

    it('should set first service as active if none active', () => {
      const newService: Service = {
        id: 'first',
        name: 'First Service',
        systemType: 'supply',
        pressureClass: 'low-pressure',
        material: 'galvanized',
        color: '#FF0000',
        dimensionalConstraints: { allowedShapes: ['round'] },
        fittingRules: [],
      };

      useServiceStore.getState().addService(newService);

      const state = useServiceStore.getState();
      expect(state.activeServiceId).toBe('first');
    });
  });

  describe('updateService', () => {
    it('should update an existing service', () => {
      const original: Service = {
        id: 'test',
        name: 'Original',
        systemType: 'supply',
        pressureClass: 'low-pressure',
        material: 'galvanized',
        color: '#000000',
        dimensionalConstraints: { allowedShapes: ['round'] },
        fittingRules: [],
      };

      useServiceStore.getState().addService(original);

      const updated: Service = {
        ...original,
        name: 'Updated',
        color: '#FF0000',
      };

      useServiceStore.getState().updateService('test', updated);

      const state = useServiceStore.getState();
      expect(state.services['test'].name).toBe('Updated');
      expect(state.services['test'].color).toBe('#FF0000');
    });
  });

  describe('removeService', () => {
   it('should remove a service', () => {
      const service: Service = {
        id: 'remove-me',
        name: 'To Remove',
        systemType: 'supply',
        pressureClass: 'low-pressure',
        material: 'galvanized',
        color: '#000000',
        dimensionalConstraints: { allowedShapes: ['round'] },
        fittingRules: [],
      };

      useServiceStore.getState().addService(service);
      expect(useServiceStore.getState().services['remove-me']).toBeDefined();

      useServiceStore.getState().removeService('remove-me');
      expect(useServiceStore.getState().services['remove-me']).toBeUndefined();
    });

    it('should clear activeServiceId when removing active service', () => {
      const service: Service = {
        id: 'active',
        name: 'Active Service',
        systemType: 'supply',
        pressureClass: 'low-pressure',
        material: 'galvanized',
        color: '#000000',
        dimensionalConstraints: { allowedShapes: ['round'] },
        fittingRules: [],
      };

      useServiceStore.getState().addService(service);
      useServiceStore.getState().setActiveService('active');

      useServiceStore.getState().removeService('active');
      expect(useServiceStore.getState().activeServiceId).toBeNull();
    });
  });

  describe('setActiveService', () => {
    it('should set active service', () => {
      const service: Service = {
        id: 'test',
        name: 'Test',
        systemType: 'supply',
        pressureClass: 'low-pressure',
        material: 'galvanized',
        color: '#000000',
        dimensionalConstraints: { allowedShapes: ['round'] },
        fittingRules: [],
      };

      useServiceStore.getState().addService(service);
      useServiceStore.getState().setActiveService('test');

      expect(useServiceStore.getState().activeServiceId).toBe('test');
    });
  });

  describe('cloneService', () => {
    it('should clone a service with new id and name', () => {
      const original: Service = {
        id: 'original',
        name: 'Original Service',
        systemType: 'supply',
        pressureClass: 'low-pressure',
        material: 'galvanized',
        color: '#FF0000',
        dimensionalConstraints: {
          allowedShapes: ['round'],
          minDiameter: 6,
          maxDiameter: 24,
        },
        fittingRules: [],
      };

      useServiceStore.getState().addService(original);
      const clonedId = useServiceStore.getState().cloneService('original', 'Cloned Service');

      const state = useServiceStore.getState();
      const cloned = state.services[clonedId];

      expect(cloned).toBeDefined();
      expect(cloned.id).not.toBe('original');
      expect(cloned.name).toBe('Cloned Service');
      expect(cloned.systemType).toBe(original.systemType);
      expect(cloned.color).toBe(original.color);
      expect(cloned.dimensionalConstraints).toEqual(original.dimensionalConstraints);
    });

    it('should clone baseline template', () => {
      const baselineId = useServiceStore.getState().baselineTemplates[0].id;
      const clonedId = useServiceStore.getState().cloneService(baselineId, 'Custom from Template');

      const state = useServiceStore.getState();
      expect(state.services[clonedId]).toBeDefined();
      expect(state.services[clonedId].name).toBe('Custom from Template');
    });
  });

  describe('baseline templates', () => {
    it('should have 4 baseline templates', () => {
      const state = useServiceStore.getState();
      expect(state.baselineTemplates).toHaveLength(4);
    });

    it('should include low and high pressure services', () => {
      const state = useServiceStore.getState();
      const lowPressure = state.baselineTemplates.filter(t => t.pressureClass === 'low-pressure');
      const highPressure = state.baselineTemplates.filter(t => t.pressureClass === 'high-pressure');

      expect(lowPressure.length).toBeGreaterThan(0);
      expect(highPressure.length).toBeGreaterThan(0);
    });

    it('should include supply and return services', () => {
      const state = useServiceStore.getState();
      const supply = state.baselineTemplates.filter(t => t.systemType === 'supply');
      const returnAir = state.baselineTemplates.filter(t => t.systemType === 'return');

      expect(supply.length).toBeGreaterThan(0);
      expect(returnAir.length).toBeGreaterThan(0);
    });
  });
});
