import { UnifiedComponentDefinition, UnifiedComponentDefinitionSchema } from '../../schema/unified-component.schema';
import { ComponentDefinition } from '../../schema/component-library.schema';
import { CatalogItem } from '../../schema/catalog.schema';
import { Service, ServiceTemplate } from '../../schema/service.schema';
import { ComponentMigrationError, ComponentMigrationResult } from './types';

type LegacyServiceLike = Service | ServiceTemplate;

export interface LegacyStoreDataSnapshot {
  componentLibrary: {
    components: ComponentDefinition[];
  };
  catalog: {
    items: Record<string, CatalogItem>;
  };
  services: {
    services: Record<string, Service>;
    baselineTemplates: ServiceTemplate[];
    activeServiceId: string | null;
  };
}

const DEFAULT_ENGINEERING = {
  frictionFactor: 0.0005,
  maxVelocity: 2000,
} as const;

const DEFAULT_PRICING = {
  materialCost: 0,
  laborUnits: 0,
  wasteFactor: 0.1,
} as const;

const VALID_CATEGORIES = new Set(['duct', 'fitting', 'equipment', 'accessory']);

function normalizeCategory(value: string): UnifiedComponentDefinition['category'] {
  if (VALID_CATEGORIES.has(value)) {
    return value as UnifiedComponentDefinition['category'];
  }
  return 'accessory';
}

function normalizeSystemType(value: string | undefined): UnifiedComponentDefinition['systemType'] {
  if (value === 'supply' || value === 'return' || value === 'exhaust') {
    return value;
  }
  return undefined;
}

function normalizePressureClass(value: string | undefined): UnifiedComponentDefinition['pressureClass'] {
  if (value === 'low' || value === 'medium' || value === 'high') {
    return value;
  }
  if (value === 'low-pressure') {
    return 'low';
  }
  if (value === 'medium-pressure') {
    return 'medium';
  }
  if (value === 'high-pressure') {
    return 'high';
  }
  return undefined;
}

function parseOrCollectError(
  sourceId: string,
  sourceType: ComponentMigrationError['sourceType'],
  candidate: UnifiedComponentDefinition,
  errors: ComponentMigrationError[]
): UnifiedComponentDefinition | null {
  const parsed = UnifiedComponentDefinitionSchema.safeParse(candidate);
  if (!parsed.success) {
    errors.push({
      sourceId,
      sourceType,
      error: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
    });
    return null;
  }
  return parsed.data;
}

export function migrateFromComponentLibrary(
  oldComponents: ComponentDefinition[]
): { components: UnifiedComponentDefinition[]; errors: ComponentMigrationError[] } {
  const components: UnifiedComponentDefinition[] = [];
  const errors: ComponentMigrationError[] = [];

  for (const old of oldComponents) {
    const candidate: UnifiedComponentDefinition = {
      id: old.id,
      name: old.name,
      category: normalizeCategory(old.type),
      type: old.type,
      subtype: old.subtype,
      manufacturer: old.manufacturer,
      model: old.model,
      partNumber: old.sku,
      sku: old.sku,
      description: old.description,
      thumbnail: old.thumbnail,
      engineeringProperties: old.engineeringProperties,
      pricing: old.pricing,
      materials: old.materials,
      defaultDimensions: old.defaultDimensions,
      tags: old.tags,
      customFields: old.customFields,
      isCustom: old.isCustom,
      createdAt: old.createdAt,
      updatedAt: old.updatedAt,
    };

    const parsed = parseOrCollectError(old.id, 'component', candidate, errors);
    if (parsed) {
      components.push(parsed);
    }
  }

  return { components, errors };
}

export function migrateFromCatalog(
  catalogItems: CatalogItem[]
): { components: UnifiedComponentDefinition[]; errors: ComponentMigrationError[] } {
  const components: UnifiedComponentDefinition[] = [];
  const errors: ComponentMigrationError[] = [];

  for (const item of catalogItems) {
    const candidate: UnifiedComponentDefinition = {
      id: item.id,
      name: item.name,
      category: normalizeCategory(item.type),
      type: item.type,
      manufacturer: item.manufacturer,
      model: item.model,
      partNumber: item.partNumber,
      description: item.description,
      pressureClass: normalizePressureClass(item.pressureClass),
      engineeringProperties: DEFAULT_ENGINEERING,
      pricing: {
        ...DEFAULT_PRICING,
        materialCost: item.cost ?? 0,
      },
      materials: [],
      tags: item.tags,
      isCustom: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const parsed = parseOrCollectError(item.id, 'catalog', candidate, errors);
    if (parsed) {
      components.push(parsed);
    }
  }

  return { components, errors };
}

export function migrateFromServices(
  services: LegacyServiceLike[]
): { components: UnifiedComponentDefinition[]; errors: ComponentMigrationError[] } {
  const components: UnifiedComponentDefinition[] = [];
  const errors: ComponentMigrationError[] = [];

  for (const service of services) {
    const systemType = normalizeSystemType(service.systemType);
    const pressureClass = normalizePressureClass(service.pressureClass);
    const createdAt = 'createdAt' in service ? service.createdAt : undefined;
    const updatedAt = 'updatedAt' in service ? service.updatedAt : undefined;

    const candidate: UnifiedComponentDefinition = {
      id: service.id,
      name: service.name,
      category: 'equipment',
      type: 'service',
      subtype: systemType,
      description: service.description,
      systemType,
      pressureClass,
      engineeringProperties: {
        ...DEFAULT_ENGINEERING,
        maxVelocity: service.dimensionalConstraints.maxDiameter ?? DEFAULT_ENGINEERING.maxVelocity,
      },
      pricing: DEFAULT_PRICING,
      materials: [],
      tags: systemType ? [systemType] : [],
      isCustom: service.source === 'custom',
      createdAt,
      updatedAt,
    };

    const parsed = parseOrCollectError(service.id, 'service', candidate, errors);
    if (parsed) {
      components.push(parsed);
    }
  }

  return { components, errors };
}

export function migrateStoreData(snapshot: LegacyStoreDataSnapshot): ComponentMigrationResult {
  const componentResult = migrateFromComponentLibrary(snapshot.componentLibrary.components);
  const catalogResult = migrateFromCatalog(Object.values(snapshot.catalog.items));
  const serviceResult = migrateFromServices([
    ...snapshot.services.baselineTemplates,
    ...Object.values(snapshot.services.services),
  ]);

  const allErrors = [...componentResult.errors, ...catalogResult.errors, ...serviceResult.errors];
  const mergedById = new Map<string, UnifiedComponentDefinition>();
  const allMigrated = [
    ...componentResult.components,
    ...catalogResult.components,
    ...serviceResult.components,
  ];

  for (const component of allMigrated) {
    if (!mergedById.has(component.id)) {
      mergedById.set(component.id, component);
      continue;
    }

    const existing = mergedById.get(component.id);
    if (existing && existing.category === 'accessory' && component.category !== 'accessory') {
      mergedById.set(component.id, component);
    }
  }

  const migratedComponents = Array.from(mergedById.values());

  return {
    success: allErrors.length === 0,
    migratedComponents,
    errors: allErrors,
    stats: {
      totalProcessed:
        snapshot.componentLibrary.components.length +
        Object.values(snapshot.catalog.items).length +
        snapshot.services.baselineTemplates.length +
        Object.values(snapshot.services.services).length,
      successful: migratedComponents.length,
      failed: allErrors.length,
      fromComponents: componentResult.components.length,
      fromCatalog: catalogResult.components.length,
      fromServices: serviceResult.components.length,
    },
  };
}

export function migrateToUnifiedComponentLibrary(
  oldComponents: ComponentDefinition[],
  catalogItems: CatalogItem[],
  services: LegacyServiceLike[]
): ComponentMigrationResult {
  return migrateStoreData({
    componentLibrary: { components: oldComponents },
    catalog: { items: Object.fromEntries(catalogItems.map((item) => [item.id, item])) },
    services: {
      services: Object.fromEntries(
        services
          .filter((service): service is Service => !('isTemplate' in service))
          .map((service) => [service.id, service])
      ),
      baselineTemplates: services.filter(
        (service): service is ServiceTemplate => 'isTemplate' in service && service.isTemplate === true
      ),
      activeServiceId: null,
    },
  });
}
