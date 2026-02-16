import { adaptServiceToComponent } from '../services/componentServiceInterop';
import { INITIAL_TEMPLATES } from './serviceStore';
import { useComponentLibraryStoreV2 } from './componentLibraryStoreV2';
import { UnifiedComponentDefinition } from '../schema/unified-component.schema';

const INITIAL_CATEGORIES = [
  { id: 'duct', name: 'Ducts', parentId: null, icon: 'square-dashed' },
  { id: 'fitting', name: 'Fittings', parentId: null, icon: 'corner-down-right' },
  { id: 'equipment', name: 'Equipment', parentId: null, icon: 'fan' },
  { id: 'accessory', name: 'Accessories', parentId: null, icon: 'settings-2' },
];

const DEFAULT_FITTINGS: Partial<UnifiedComponentDefinition>[] = [
  {
    id: 'fitting-elbow-90',
    name: '90° Elbow',
    category: 'fitting',
    type: 'elbow',
    subtype: '90',
    description: 'Standard 90-degree radius elbow',
    manufacturer: 'Generic',
  },
  {
    id: 'fitting-elbow-45',
    name: '45° Elbow',
    category: 'fitting',
    type: 'elbow',
    subtype: '45',
    description: 'Standard 45-degree elbow',
    manufacturer: 'Generic',
  },
  {
    id: 'fitting-tee',
    name: 'Standard Tee',
    category: 'fitting',
    type: 'tee',
    subtype: 'straight',
    description: 'Standard branch tee',
    manufacturer: 'Generic',
  },
  {
    id: 'fitting-reducer',
    name: 'Concentric Reducer',
    category: 'fitting',
    type: 'reducer',
    subtype: 'concentric',
    description: 'Concentric duct transition',
    manufacturer: 'Generic',
  },
];

const DEFAULT_EQUIPMENT: Partial<UnifiedComponentDefinition>[] = [
  {
    id: 'eq-vav-box',
    name: 'VAV Box',
    category: 'equipment',
    type: 'terminal',
    subtype: 'vav',
    description: 'Variable Air Volume terminal unit',
    manufacturer: 'Generic',
  },
  {
    id: 'eq-fan-inline',
    name: 'Inline Fan',
    category: 'equipment',
    type: 'fan',
    subtype: 'inline',
    description: 'Inline centrifugal fan',
    manufacturer: 'Generic',
  },
  {
    id: 'eq-diffuser-sq',
    name: 'Square Diffuser',
    category: 'accessory',
    type: 'diffuser',
    subtype: 'square',
    description: '24x24 Square Ceiling Diffuser',
    manufacturer: 'Generic',
  },
];

function createCompleteComponent(partial: Partial<UnifiedComponentDefinition>): UnifiedComponentDefinition {
  const now = new Date();
  return {
    id: partial.id!,
    name: partial.name!,
    category: partial.category as UnifiedComponentDefinition['category'],
    type: partial.type || 'unknown',
    subtype: partial.subtype,
    description: partial.description,
    manufacturer: partial.manufacturer,
    systemType: partial.category === 'duct' ? 'supply' : undefined,
    pressureClass: 'low',
    engineeringProperties: {
      frictionFactor: 0,
      maxVelocity: 0,
      minVelocity: 0,
      maxPressureDrop: 0,
    },
    pricing: {
      materialCost: 0,
      laborUnits: 0,
      wasteFactor: 0,
    },
    materials: [
      {
        id: `${partial.id}-mat`,
        name: 'Galvanized Steel',
        type: 'galvanized_steel',
        cost: 0,
        costUnit: 'ea',
      }
    ],
    tags: ['default', partial.category!],
    customFields: {},
    isCustom: false,
    createdAt: now,
    updatedAt: now,
    ...partial // Allow overrides
  } as UnifiedComponentDefinition;
}

export default function initializeComponentLibraryV2(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const store = useComponentLibraryStoreV2.getState();

  // 1. Initialize categories if missing
  if (store.categories.length === 0) {
    for (const category of INITIAL_CATEGORIES) {
      store.addCategory(category);
    }
  }

  // 2. Initialize Ducts from Service Templates (if missing)
  const hasDucts = store.components.some(c => c.category === 'duct');
  if (!hasDucts) {
    const convertedComponents = INITIAL_TEMPLATES.map((template) => adaptServiceToComponent(template));
    for (const component of convertedComponents) {
      store.addComponent(component);
    }
  }

  // 3. Initialize Fittings (if missing)
  const hasFittings = store.components.some(c => c.category === 'fitting');
  if (!hasFittings) {
    for (const partial of DEFAULT_FITTINGS) {
      store.addComponent(createCompleteComponent(partial));
    }
  }

  // 4. Initialize Equipment & Accessories (if missing)
  const hasEquipment = store.components.some(c => c.category === 'equipment');
  if (!hasEquipment) {
    for (const partial of DEFAULT_EQUIPMENT) {
      store.addComponent(createCompleteComponent(partial));
    }
  }

  // Set active component if none selected
  const updatedStore = useComponentLibraryStoreV2.getState();
  const firstComponent = updatedStore.components[0];
  if (!updatedStore.getActiveComponent() && firstComponent) {
    updatedStore.activateComponent(firstComponent.id);
  }
}
