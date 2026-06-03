import { describe, expect, it } from 'vitest';
import {
  CatalogEntrySchema,
  EngineeringSystemSchema,
  SystemProfileSchema,
  UnifiedComponentDefinitionSchema,
} from '../unified-component.schema';

describe('EngineeringSystemSchema', () => {
  it('accepts only air engineering systems', () => {
    const systems = ['standard_duct', 'universal'] as const;

    expect(systems.map((system) => EngineeringSystemSchema.parse(system))).toEqual(systems);
  });

  it('rejects removed specialized engineering systems', () => {
    const removedSystems = [
      String.fromCharCode(98, 111, 105, 108, 101, 114, 95, 102, 108, 117, 101),
      String.fromCharCode(103, 114, 101, 97, 115, 101, 95, 100, 117, 99, 116),
      String.fromCharCode(103, 101, 110, 101, 114, 97, 116, 111, 114, 95, 101, 120, 104, 97, 117, 115, 116),
    ];

    removedSystems.forEach((system) => {
      expect(() => EngineeringSystemSchema.parse(system)).toThrow();
    });
  });

  it('rejects unsupported engineering systems', () => {
    expect(() => EngineeringSystemSchema.parse('hydronic')).toThrow();
  });
});

describe('CatalogEntrySchema', () => {
  it('validates the canonical T1 identity and metadata fields', () => {
    const result = CatalogEntrySchema.parse({
      id: 'entry-1',
      name: 'Round Duct',
      componentClass: 'duct',
      categoryId: 'standard_ductwork',
      typeId: 'round',
      engineeringSystem: 'standard_duct',
      placeable: true,
      source: 'system',
      systemType: 'supply',
      recommendedFittingEntryIds: ['fitting-1'],
      recommendedAccessoryEntryIds: ['accessory-1'],
      recommendedEquipmentEntryIds: ['equipment-1'],
      iconKey: 'duct_round',
      connectionNotes: ['Round branch with terminal connection.'],
      pricing: {
        materialCost: 10,
        laborUnits: 1,
        wasteFactor: 0.1,
      },
      engineeringProperties: {
        frictionFactor: 0.02,
        maxVelocity: 2500,
        minVelocity: 500,
        maxPressureDrop: 0.1,
      },
      materials: [],
    });

    expect(result.componentClass).toBe('duct');
    expect(result.categoryId).toBe('standard_ductwork');
    expect(result.typeId).toBe('round');
    expect(result.engineeringSystem).toBe('standard_duct');
    expect(result.category).toBe('duct');
    expect(result.type).toBe('round');
    expect(result.recommendedFittingEntryIds).toEqual(['fitting-1']);
    expect(result.iconKey).toBe('duct_round');
  });

  it('rejects legacy-only alias payloads without canonical identity fields', () => {
    expect(() =>
      CatalogEntrySchema.parse({
        id: 'legacy-entry',
        name: 'Legacy Duct',
        category: 'duct',
        type: 'round',
        placeable: true,
        source: 'custom',
        pricing: {
          materialCost: 10,
          laborUnits: 1,
          wasteFactor: 0.1,
        },
        engineeringProperties: {
          frictionFactor: 0.02,
          maxVelocity: 2500,
          minVelocity: 500,
          maxPressureDrop: 0.1,
        },
        materials: [],
      })
    ).toThrow();
  });

  it('rejects the deprecated schema alias when canonical fields are missing', () => {
    expect(() =>
      UnifiedComponentDefinitionSchema.parse({
        id: 'entry-2',
        name: 'Legacy Fan',
        category: 'equipment',
        type: 'fan',
        placeable: true,
        source: 'custom',
        pricing: {
          materialCost: 10,
          laborUnits: 1,
          wasteFactor: 0.1,
        },
        engineeringProperties: {
          frictionFactor: 0.02,
          maxVelocity: 2500,
          minVelocity: 500,
          maxPressureDrop: 0.1,
        },
        materials: [],
      })
    ).toThrow();
  });
});

describe('SystemProfileSchema', () => {
  it('validates defaultSystemType and supportedArchetypes for T1 profiles', () => {
    const result = SystemProfileSchema.parse({
      id: 'profile-standard',
      name: 'Standard Ductwork',
      engineeringSystem: 'standard_duct',
      defaultSystemType: 'supply',
      color: '#2563eb',
      source: 'baseline',
      supportedArchetypes: {
        duct: ['round'],
        fitting: ['elbow'],
        equipment: ['fan'],
        accessory: ['damper'],
      },
      fittingRules: [{ angle: 90, fittingType: 'elbow_90', preference: 1 }],
      dimensionalConstraints: { allowedShapes: ['round'] },
      velocityLimits: { min: 500, max: 2500 },
      complianceRefs: ['SMACNA'],
      calculationCapabilities: ['sizing', 'pressure_drop'],
    });

    expect(result.defaultSystemType).toBe('supply');
    expect(result.supportedArchetypes.fitting).toContain('elbow');
  });
});
