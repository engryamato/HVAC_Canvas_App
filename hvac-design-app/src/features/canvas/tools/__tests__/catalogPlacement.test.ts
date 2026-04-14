import { describe, expect, it } from 'vitest';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';
import { isEquipmentLike, resolveEquipmentType, resolveFittingType } from '../catalogPlacement';

function createComponent(overrides: Partial<UnifiedComponentDefinition>): UnifiedComponentDefinition {
  const now = new Date();
  return {
    id: overrides.id ?? 'entry-1',
    name: overrides.name ?? 'Entry',
    componentClass: overrides.componentClass ?? 'duct',
    category: overrides.category ?? overrides.componentClass ?? 'duct',
    categoryId: overrides.categoryId ?? 'standard_ductwork',
    typeId: overrides.typeId ?? 'straight',
    type: overrides.type ?? overrides.typeId ?? 'straight',
    engineeringSystem: overrides.engineeringSystem ?? 'standard_duct',
    placeable: overrides.placeable ?? true,
    source: overrides.source ?? 'system',
    subtype: overrides.subtype,
    recommendedFittingEntryIds: overrides.recommendedFittingEntryIds ?? [],
    recommendedAccessoryEntryIds: overrides.recommendedAccessoryEntryIds ?? [],
    recommendedEquipmentEntryIds: overrides.recommendedEquipmentEntryIds ?? [],
    connectionNotes: overrides.connectionNotes ?? [],
    systemType: overrides.systemType ?? 'supply',
    engineeringProperties: overrides.engineeringProperties ?? {
      frictionFactor: 0.02,
      maxVelocity: 2500,
      minVelocity: 500,
      maxPressureDrop: 0.1,
    },
    pricing: overrides.pricing ?? {
      materialCost: 0,
      laborUnits: 0,
      wasteFactor: 0,
    },
    materials: overrides.materials ?? [],
    isCustom: overrides.isCustom ?? false,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

describe('catalogPlacement', () => {
  it('maps seeded fitting variants onto supported fitting entity types', () => {
    expect(
      resolveFittingType(
        createComponent({ componentClass: 'fitting', category: 'fitting', typeId: 'elbow', subtype: 'radius' })
      )
    ).toBe('elbow_90');
    expect(
      resolveFittingType(
        createComponent({ componentClass: 'fitting', category: 'fitting', typeId: 'mitered_elbow', subtype: 'mitered' })
      )
    ).toBe('elbow_mitered');
    expect(
      resolveFittingType(
        createComponent({ componentClass: 'fitting', category: 'fitting', typeId: 'transition', subtype: 'square_to_round' })
      )
    ).toBe('transition_square_to_round');
  });

  it('maps catalog equipment and accessories onto supported equipment entity types', () => {
    expect(
      resolveEquipmentType(
        createComponent({ componentClass: 'equipment', category: 'equipment', typeId: 'terminal_box' })
      )
    ).toBe('damper');
    expect(
      resolveEquipmentType(
        createComponent({ componentClass: 'equipment', category: 'equipment', typeId: 'ahu_connection' })
      )
    ).toBe('air_handler');
    expect(
      resolveEquipmentType(
        createComponent({ componentClass: 'accessory', category: 'accessory', typeId: 'grd' })
      )
    ).toBe('diffuser');
  });

  it('treats accessories as equipment-like for placement', () => {
    expect(
      isEquipmentLike(createComponent({ componentClass: 'accessory', category: 'accessory', typeId: 'damper' }))
    ).toBe(true);
  });
});
