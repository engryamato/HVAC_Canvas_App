import { describe, expect, it } from 'vitest';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';
import { resolveCatalogEntryIconKey, resolveToolbarIconKey } from '../catalogIcons';

function createEntry(overrides: Partial<UnifiedComponentDefinition>): UnifiedComponentDefinition {
  const now = new Date();
  return {
    id: overrides.id ?? 'entry',
    name: overrides.name ?? 'Entry',
    componentClass: overrides.componentClass ?? 'duct',
    category: overrides.category ?? overrides.componentClass ?? 'duct',
    categoryId: overrides.categoryId ?? 'standard_ductwork',
    typeId: overrides.typeId ?? 'straight',
    type: overrides.type ?? overrides.typeId ?? 'straight',
    engineeringSystem: overrides.engineeringSystem ?? 'standard_duct',
    placeable: overrides.placeable ?? true,
    source: overrides.source ?? 'system',
    specialtyToolId: overrides.specialtyToolId,
    subtype: overrides.subtype,
    systemType: overrides.systemType ?? 'supply',
    engineeringProperties: overrides.engineeringProperties ?? {
      frictionFactor: 0.01,
      maxVelocity: 2000,
      minVelocity: 500,
      maxPressureDrop: 0.1,
    },
    pricing: overrides.pricing ?? {
      materialCost: 10,
      laborUnits: 1,
      wasteFactor: 0.1,
    },
    materials: overrides.materials ?? [],
    icon: overrides.icon,
    iconKey: overrides.iconKey,
    isCustom: overrides.isCustom ?? false,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

describe('catalogIcons', () => {
  it('resolves standard duct families to distinct icon keys', () => {
    expect(resolveCatalogEntryIconKey(createEntry({ typeId: 'rectangular' }))).toBe('duct_rectangular');
    expect(resolveCatalogEntryIconKey(createEntry({ typeId: 'round' }))).toBe('duct_round');
    expect(resolveCatalogEntryIconKey(createEntry({ typeId: 'flat_oval' }))).toBe('duct_flat_oval');
    expect(resolveCatalogEntryIconKey(createEntry({ typeId: 'flexible' }))).toBe('duct_flexible');
  });

  it('resolves standard fitting families to distinct icon keys', () => {
    expect(
      resolveCatalogEntryIconKey(createEntry({ componentClass: 'fitting', category: 'fitting', typeId: 'elbow', subtype: 'radius' }))
    ).toBe('fitting_elbow');
    expect(
      resolveCatalogEntryIconKey(createEntry({ componentClass: 'fitting', category: 'fitting', typeId: 'mitered_elbow', subtype: 'mitered' }))
    ).toBe('fitting_mitered_elbow');
    expect(
      resolveCatalogEntryIconKey(createEntry({ componentClass: 'fitting', category: 'fitting', typeId: 'tee', subtype: 'tee_cross' }))
    ).toBe('fitting_tee');
    expect(
      resolveCatalogEntryIconKey(createEntry({ componentClass: 'fitting', category: 'fitting', typeId: 'wye', subtype: 'wye_lateral' }))
    ).toBe('fitting_wye');
    expect(
      resolveCatalogEntryIconKey(createEntry({ componentClass: 'fitting', category: 'fitting', typeId: 'reducer', subtype: 'eccentric' }))
    ).toBe('fitting_reducer');
    expect(
      resolveCatalogEntryIconKey(createEntry({ componentClass: 'fitting', category: 'fitting', typeId: 'transition', subtype: 'square_to_round' }))
    ).toBe('fitting_transition');
    expect(
      resolveCatalogEntryIconKey(createEntry({ componentClass: 'fitting', category: 'fitting', typeId: 'end_cap' }))
    ).toBe('fitting_end_cap');
    expect(
      resolveCatalogEntryIconKey(createEntry({ componentClass: 'fitting', category: 'fitting', typeId: 'takeoff', subtype: 'spin_in' }))
    ).toBe('fitting_takeoff');
  });

  it('prefers explicit icon keys for seeded equipment and accessories', () => {
    expect(
      resolveCatalogEntryIconKey(createEntry({ componentClass: 'equipment', category: 'equipment', iconKey: 'equipment_terminal_box' }))
    ).toBe('equipment_terminal_box');
    expect(
      resolveCatalogEntryIconKey(createEntry({ componentClass: 'accessory', category: 'accessory', iconKey: 'accessory_grd' }))
    ).toBe('accessory_grd');
  });

  it('keeps specialty duct toolbar mapping intact', () => {
    expect(resolveToolbarIconKey('duct', 'boiler_flue')).toBe('duct_boiler_flue');
    expect(resolveToolbarIconKey('duct', 'grease_duct')).toBe('duct_grease');
    expect(resolveToolbarIconKey('duct', 'generator_exhaust')).toBe('duct_generator');
    expect(resolveToolbarIconKey('duct', 'duct')).toBe('duct_rectangular');
    expect(resolveToolbarIconKey('fitting')).toBe('fitting_elbow');
  });

  it('falls back safely for unknown duct and fitting archetypes', () => {
    expect(resolveCatalogEntryIconKey(createEntry({ typeId: 'mystery_duct' }))).toBe('duct');
    expect(
      resolveCatalogEntryIconKey(createEntry({ componentClass: 'fitting', category: 'fitting', typeId: 'mystery_fitting' }))
    ).toBe('fitting');
  });
});
