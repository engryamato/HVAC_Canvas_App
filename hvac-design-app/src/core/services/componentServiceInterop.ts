import type { Service } from '@/core/schema/service.schema';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';

type ServiceSystemType = Service['systemType'];
type ServiceMaterial = Service['material'];
type ServicePressureClass = Service['pressureClass'];

const DEFAULT_ALLOWED_SHAPES: Array<'round' | 'rectangular'> = ['round', 'rectangular'];

function toServiceSystemType(systemType?: string): ServiceSystemType {
  if (
    systemType === 'return' ||
    systemType === 'exhaust' ||
    systemType === 'outside_air'
  ) {
    return systemType;
  }
  return 'supply';
}

function toServicePressureClass(pressureClass?: string): ServicePressureClass {
  if (pressureClass === 'medium' || pressureClass === 'medium-pressure') {
    return 'medium';
  }
  if (pressureClass === 'high' || pressureClass === 'high-pressure') {
    return 'high';
  }
  if (pressureClass === 'low-pressure') {
    return 'low-pressure';
  }
  return 'low';
}

function toComponentPressureClass(pressureClass?: string): 'low' | 'medium' | 'high' {
  if (pressureClass === 'medium' || pressureClass === 'medium-pressure') {
    return 'medium';
  }
  if (pressureClass === 'high' || pressureClass === 'high-pressure') {
    return 'high';
  }
  return 'low';
}

function toServiceMaterial(materialType?: string): ServiceMaterial {
  switch (materialType) {
    case 'stainless_steel':
      return 'stainless';
    case 'aluminum':
      return 'aluminum';
    case 'flexible':
      return 'flex';
    case 'galvanized_steel':
    default:
      return 'galvanized';
  }
}

function toComponentMaterialType(material: ServiceMaterial): 'galvanized_steel' | 'stainless_steel' | 'aluminum' | 'fiberglass' | 'flexible' {
  switch (material) {
    case 'stainless':
      return 'stainless_steel';
    case 'aluminum':
      return 'aluminum';
    case 'flex':
      return 'flexible';
    case 'galvanized':
    default:
      return 'galvanized_steel';
  }
}

export function getServiceColor(systemType?: string): string {
  switch (systemType) {
    case 'supply':
      return '#2563eb';
    case 'return':
      return '#16a34a';
    case 'exhaust':
      return '#ea580c';
    case 'outside_air':
      return '#0f766e';
    default:
      return '#424242';
  }
}

const DEFAULT_FITTING_RULES: Service['fittingRules'] = [
  { angle: 90, fittingType: 'elbow_90', preference: 1 },
  { angle: 45, fittingType: 'elbow_45', preference: 1 },
  { angle: 90, fittingType: 'tee', preference: 1 },
];

export function adaptComponentToService(component: UnifiedComponentDefinition): Service {
  const dimensionalConstraintsFromComponent =
    component.customFields &&
    typeof component.customFields.dimensionalConstraints === 'object' &&
    component.customFields.dimensionalConstraints !== null
      ? component.customFields.dimensionalConstraints
      : undefined;

  const subtype = component.subtype?.toLowerCase();
  const allowedShapes =
    subtype === 'round'
      ? ['round']
      : subtype === 'rectangular'
        ? ['rectangular']
        : DEFAULT_ALLOWED_SHAPES;

  const fittingRulesFromComponent =
    component.customFields?.fittingRules &&
    Array.isArray(component.customFields.fittingRules)
      ? (component.customFields.fittingRules as Service['fittingRules'])
      : DEFAULT_FITTING_RULES;

  return {
    id: component.id,
    name: component.name,
    description: component.description,
    systemType: toServiceSystemType(component.systemType),
    pressureClass: toServicePressureClass(component.pressureClass),
    material: toServiceMaterial(component.materials?.[0]?.type),
    dimensionalConstraints: {
      allowedShapes,
      ...(dimensionalConstraintsFromComponent as Record<string, unknown> | undefined),
    } as Service['dimensionalConstraints'],
    fittingRules: fittingRulesFromComponent,
    manufacturerPreferences: component.manufacturer ? [component.manufacturer] : [],
    source: 'custom',
    color: getServiceColor(component.systemType),
  };
}

export function adaptServiceToComponent(service: Service): UnifiedComponentDefinition {
  const now = new Date();
  const primaryShape = service.dimensionalConstraints.allowedShapes?.[0] ?? 'round';

  return {
    id: service.id,
    name: service.name,
    componentClass: 'duct',
    category: 'duct',
    categoryId: 'standard_ductwork',
    typeId: typeIdFromService(service),
    type: typeIdFromService(service),
    subtype: primaryShape,
    engineeringSystem: 'standard_duct',
    placeable: true,
    source: 'custom',
    description: service.description,
    systemType: service.systemType,
    pressureClass: toComponentPressureClass(service.pressureClass),
    engineeringProperties: {
      frictionFactor: 0.02,
      maxVelocity: 2500,
      minVelocity: 500,
      maxPressureDrop: 0.1,
    },
    pricing: {
      materialCost: 0,
      laborUnits: 0,
      wasteFactor: 0,
    },
    materials: [
      {
        id: `${service.id}-material`,
        name: service.material,
        type: toComponentMaterialType(service.material),
        cost: 0,
        costUnit: 'linear_foot',
      },
    ],
    tags: ['legacy-service'],
    customFields: {
      migratedFromServiceStore: true,
      dimensionalConstraints: service.dimensionalConstraints,
    },
    isCustom: true,
    createdAt: service.createdAt ?? now,
    updatedAt: service.updatedAt ?? now,
  };
}

function typeIdFromService(service: Service): string {
  if (service.systemType === 'exhaust') {
    return 'exhaust_main';
  }
  if (service.systemType === 'return') {
    return 'return_main';
  }
  return 'straight';
}

export function resolveActiveServiceFromStores(): Service | null {
  const activeComponent = useComponentLibraryStoreV2.getState().getActiveComponent();
  if (!activeComponent) {
    return null;
  }

  return adaptComponentToService(activeComponent);
}
