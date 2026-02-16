# Phase 1.1: Unified Component Library Store V2


## Overview

Replace the existing `componentLibraryStore` with a new unified store that consolidates functionality from `catalogStore`, `serviceStore`, and the current `componentLibraryStore`.

**Spec References**: 
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/f52310a1-13a5-4d6f-b482-f30544acdb43` (Tech Plan - Decision 1)
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 6: Component Library Management)

## Scope

**In Scope**:
- Create new unified schema combining ComponentDefinition, CatalogItem, and Service concepts
- Implement new store with CRUD operations, search, filtering, activation
- Build migration script to transform data from 3 old stores → 1 new store
- Add feature flag for gradual rollout
- Update schema files to support unified component model

**Out of Scope**:
- UI components (handled in later tickets)
- Updating all consuming code (separate ticket)
- Import/export functionality (Phase 5)

## Key Files

**Create**:
- `file:hvac-design-app/src/core/schema/unified-component.schema.ts` - Enhanced ComponentDefinition schema
- `file:hvac-design-app/src/core/store/componentLibraryStoreV2.ts` - New unified store
- `file:hvac-design-app/src/core/services/migration/storeDataMigration.ts` - Migration logic

**Reference** (existing):
- `file:hvac-design-app/src/core/store/componentLibraryStore.ts`
- `file:hvac-design-app/src/core/store/catalogStore.ts`
- `file:hvac-design-app/src/core/store/serviceStore.ts`
- `file:hvac-design-app/src/core/schema/catalog.schema.ts`
- `file:hvac-design-app/src/core/schema/component-library.schema.ts`

## Acceptance Criteria

- [ ] New unified schema validates all component types (ducts, fittings, equipment, accessories)
- [ ] Store supports all operations: add, update, delete, search, filter, activate
- [ ] Migration script successfully transforms data from all 3 old stores
- [ ] Feature flag `ENABLE_UNIFIED_COMPONENT_LIBRARY` controls new store usage
- [ ] Unit tests cover store operations and migration logic
- [ ] Migration tested with real data from existing stores

## Dependencies

None - This is the foundation ticket

## Technical Notes

**Schema Design**:
```typescript
interface UnifiedComponentDefinition {
  // From ComponentDefinition
  id: string;
  name: string;
  category: 'duct' | 'fitting' | 'equipment' | 'accessory';
  
  // From CatalogItem
  manufacturer?: string;
  model?: string;
  partNumber?: string;
  
  // From Service
  systemType?: 'supply' | 'return' | 'exhaust';
  pressureClass?: 'low' | 'medium' | 'high';
  
  // Unified pricing
  pricing: ComponentPricing;
  
  // Unified engineering
  engineering: EngineeringProperties;
}
```

**Migration Strategy**:
1. Read data from old stores
2. Transform to new schema
3. Validate transformed data
4. Write to new store
5. Keep old stores for rollback
