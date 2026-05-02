'use client';

import { useEffect } from 'react';
import { CatalogPanel } from '@/features/canvas/components/CatalogPanel';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';
import { useLayoutStore } from '@/stores/useLayoutStore';

function createEntry(overrides: Partial<UnifiedComponentDefinition>): UnifiedComponentDefinition {
  const now = new Date('2026-05-02T00:00:00.000Z');
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name ?? 'Catalog Entry',
    componentClass: overrides.componentClass ?? 'duct',
    category: overrides.category ?? overrides.componentClass ?? 'duct',
    categoryId: overrides.categoryId ?? 'standard_ductwork',
    typeId: overrides.typeId ?? 'straight',
    type: overrides.type ?? overrides.typeId ?? 'straight',
    engineeringSystem: overrides.engineeringSystem ?? 'standard_duct',
    placeable: overrides.placeable ?? true,
    source: overrides.source ?? 'system',
    systemType: overrides.systemType ?? 'supply',
    recommendedFittingEntryIds: overrides.recommendedFittingEntryIds ?? [],
    recommendedAccessoryEntryIds: overrides.recommendedAccessoryEntryIds ?? [],
    recommendedEquipmentEntryIds: overrides.recommendedEquipmentEntryIds ?? [],
    iconKey: overrides.iconKey,
    connectionNotes: overrides.connectionNotes ?? [],
    pressureClass: overrides.pressureClass,
    manufacturer: overrides.manufacturer,
    model: overrides.model,
    description: overrides.description,
    keySpec: overrides.keySpec,
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
    tags: overrides.tags,
    customFields: overrides.customFields,
    icon: overrides.icon,
    isCustom: overrides.isCustom ?? overrides.source === 'custom',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function CatalogReviewBootstrap() {
  useEffect(() => {
    const catalogStore = useComponentLibraryStoreV2.getState();
    const layoutBootstrapKey = 'catalog-review-layout-bootstrapped';

    if (!sessionStorage.getItem(layoutBootstrapKey)) {
      useLayoutStore.persist?.clearStorage?.();
      useLayoutStore.getState().resetLayout();
      sessionStorage.setItem(layoutBootstrapKey, 'true');
    }

    catalogStore.reset();

    catalogStore.addCategory({ id: 'air_distribution', name: 'Air Distribution', parentId: null, subcategories: [] });
    catalogStore.addCategory({ id: 'standard_ductwork', name: 'Standard Ductwork', parentId: 'air_distribution', subcategories: [] });
    catalogStore.addCategory({ id: 'specialty_exhaust', name: 'Specialty Exhaust', parentId: null, subcategories: [] });
    catalogStore.addCategory({ id: 'boiler_flue', name: 'Boiler & Water Heater Flue', parentId: 'specialty_exhaust', subcategories: [] });
    catalogStore.addCategory({ id: 'universal_components', name: 'Universal Components', parentId: null, subcategories: [] });
    catalogStore.addCategory({ id: 'hangers_supports', name: 'Hangers, Supports & Seismic', parentId: 'universal_components', subcategories: [] });

    catalogStore.addSystemProfile({
      id: 'standard-duct',
      name: 'Standard Ductwork',
      engineeringSystem: 'standard_duct',
      defaultSystemType: 'supply',
      color: '#2563eb',
      source: 'baseline',
      supportedArchetypes: {
        duct: ['straight'],
        fitting: ['elbow'],
        equipment: ['terminal_box'],
        accessory: ['damper'],
      },
      fittingRules: [],
      dimensionalConstraints: {},
      complianceRefs: [],
      calculationCapabilities: [],
    });

    const standardEntries = [
      ['round-duct', 'Round Duct', '12 in dia', 'duct_round'],
      ['rect-duct', 'Rectangular Duct', '24 x 12 in', 'duct_rectangular'],
      ['flat-oval', 'Flat Oval Duct', '22 x 10 in', 'duct_flat_oval'],
      ['spiral-duct', 'Spiral Duct', '14 in dia spiral', 'duct_round'],
      ['double-wall', 'Double Wall Duct', 'R-6 liner', 'duct_rectangular'],
      ['transition', 'Concentric Transition', '14 to 10 in', 'fitting_transition'],
      ['radius-elbow', 'Radius Elbow', 'Long radius elbow', 'fitting_elbow_radius'],
      ['tee-tap', '45 Degree Tap', 'Branch tap', 'fitting_takeoff'],
      ['volume-damper', 'Volume Damper', 'Low leakage', 'accessory_damper_manual'],
      ['fire-damper', 'Fire Damper', '1.5 hr rated', 'accessory_damper_fire'],
      ['terminal-box', 'VAV Terminal Box', 'Single duct', 'equipment_terminal_box'],
      ['inline-fan', 'Inline Fan', '900 CFM', 'equipment_exhaust_fan'],
    ] as const;

    standardEntries.forEach(([id, name, keySpec, iconKey], index) => {
      catalogStore.addEntry(
        createEntry({
          id,
          name,
          componentClass:
            id === 'terminal-box' || id === 'inline-fan'
              ? 'equipment'
              : id.includes('damper')
                ? 'accessory'
                : id === 'transition' || id === 'radius-elbow' || id === 'tee-tap'
                  ? 'fitting'
                  : 'duct',
          category:
            id === 'terminal-box' || id === 'inline-fan'
              ? 'equipment'
              : id.includes('damper')
                ? 'accessory'
                : id === 'transition' || id === 'radius-elbow' || id === 'tee-tap'
                  ? 'fitting'
                  : 'duct',
          categoryId: 'standard_ductwork',
          typeId: id,
          type: id,
          engineeringSystem: 'standard_duct',
          source: 'system',
          keySpec,
          description: `${name} validation fixture`,
          iconKey,
          recommendedFittingEntryIds: index === 0 ? ['radius-elbow', 'transition'] : [],
          recommendedAccessoryEntryIds: index === 0 ? ['volume-damper'] : [],
          recommendedEquipmentEntryIds: index === 0 ? ['terminal-box'] : [],
          connectionNotes: index === 0 ? ['Reference row for compact catalog validation.'] : [],
        })
      );
    });

    catalogStore.addEntry(
      createEntry({
        id: 'custom-hanger',
        name: 'Custom Hanger',
        componentClass: 'accessory',
        category: 'accessory',
        categoryId: 'hangers_supports',
        typeId: 'hanger',
        type: 'hanger',
        engineeringSystem: 'universal',
        source: 'custom',
        systemType: 'supply',
        keySpec: 'Inline custom support spec',
        iconKey: 'accessory_support_hanger',
        isCustom: true,
      })
    );

    catalogStore.selectEntry('round-duct');

    return () => {
      catalogStore.reset();
    };
  }, []);

  return null;
}

export default function CatalogUxReviewPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_40%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-6 py-10">
      <CatalogReviewBootstrap />

      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">UX Review Harness</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Compact catalog rollout validation surface
          </h1>
          <p className="mt-4 text-base text-slate-600">
            Deterministic catalog panel fixture for density, responsive width, keyboard, and accessibility validation.
          </p>
        </header>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="mb-4 max-w-2xl">
            <h2 className="text-xl font-semibold text-slate-950">Catalog panel reference frame</h2>
            <p className="mt-2 text-sm text-slate-500">
              Use the frame below for 250px, 300px, and comfortable-density capture states.
            </p>
          </div>

          <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-slate-100/70 p-4">
            <div
              className="min-h-[980px] rounded-[24px] border border-slate-300 bg-white shadow-sm"
              style={{ width: 300 }}
              data-testid="catalog-review-frame"
            >
              <CatalogPanel />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
