# Phase 1.1 Micro-Task Breakdown
## Unified Component Library Store V2

### Overview
This phase creates the foundation for the unified engineering core. Each micro-task is designed to be completable within 5-10 minutes to avoid timeouts.

---

## Micro-Task 1.1.1: Create Unified Component Schema
**Estimated Time**: 10 minutes
**Dependencies**: None

**Task**: Create `hvac-design-app/src/core/schema/unified-component.schema.ts`

**Requirements**:
```typescript
// UnifiedComponentDefinitionSchema combining:
// - ComponentDefinition (existing)
// - CatalogItem concepts (manufacturer, model, sku)
// - Service concepts (systemType, pressureClass)

export const UnifiedComponentDefinitionSchema = z.object({
  // Base
  id: z.string(),
  name: z.string(),
  category: z.enum(['duct', 'fitting', 'equipment', 'accessory']),
  type: z.string(),
  subtype: z.string().optional(),
  
  // Catalog fields
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  partNumber: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  
  // Service fields
  systemType: z.enum(['supply', 'return', 'exhaust']).optional(),
  pressureClass: z.enum(['low', 'medium', 'high']).optional(),
  
  // Engineering (from existing schema)
  engineeringProperties: EngineeringPropertiesSchema,
  
  // Pricing (from existing schema)
  pricing: PricingDataSchema,
  
  // Materials (from existing)
  materials: z.array(MaterialSpecSchema),
  
  // Metadata
  tags: z.array(z.string()).optional(),
  isCustom: z.boolean().default(false),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
```

**Acceptance Criteria**:
- [ ] File created at correct path
- [ ] Schema validates correctly
- [ ] Type exports work
- [ ] No TypeScript errors

---

## Micro-Task 1.1.2: Create Component Library Store V2 - State Definition
**Estimated Time**: 10 minutes
**Dependencies**: 1.1.1

**Task**: Create initial state interface and types for `hvac-design-app/src/core/store/componentLibraryStoreV2.ts`

**Requirements**:
```typescript
interface ComponentLibraryState {
  // Data
  components: UnifiedComponentDefinition[];
  categories: ComponentCategory[];
  templates: ComponentTemplate[];
  
  // UI State
  activeComponentId: string | null;
  selectedCategoryId: string | null;
  searchQuery: string;
  filterTags: string[];
  
  // Loading/Error
  isLoading: boolean;
  error: string | null;
  
  // Feature flag
  isEnabled: boolean;
}
```

**Acceptance Criteria**:
- [ ] State interface defined
- [ ] Uses UnifiedComponentDefinition type
- [ ] Compatible with existing ComponentCategory type
- [ ] No TypeScript errors

---

## Micro-Task 1.1.3: Create Component Library Store V2 - Component CRUD Actions
**Estimated Time**: 15 minutes
**Dependencies**: 1.1.2

**Task**: Add component CRUD actions to the store

**Requirements**:
```typescript
// Actions to implement:
addComponent: (component: UnifiedComponentDefinition) => void;
updateComponent: (id: string, updates: Partial<UnifiedComponentDefinition>) => void;
deleteComponent: (id: string) => void;
duplicateComponent: (id: string) => void;
getComponent: (id: string) => UnifiedComponentDefinition | undefined;
```

**Acceptance Criteria**:
- [ ] All CRUD actions implemented
- [ ] Uses immer for immutable updates
- [ ] Updates timestamps correctly
- [ ] Handles not-found cases gracefully

---

## Micro-Task 1.1.4: Create Component Library Store V2 - Search and Filter Actions
**Estimated Time**: 10 minutes
**Dependencies**: 1.1.3

**Task**: Add search and filter functionality

**Requirements**:
```typescript
// Actions:
setSearchQuery: (query: string) => void;
setFilterTags: (tags: string[]) => void;
setSelectedCategory: (categoryId: string | null) => void;
search: (query: string) => UnifiedComponentDefinition[];
getFilteredComponents: () => UnifiedComponentDefinition[];
activateComponent: (componentId: string) => void;
deactivateComponent: () => void;
getActiveComponent: () => UnifiedComponentDefinition | undefined;
```

**Acceptance Criteria**:
- [ ] Search works by name, description, tags
- [ ] Filter by category works
- [ ] Combined search + filter works
- [ ] Activation state managed correctly

---

## Micro-Task 1.1.5: Create Component Library Store V2 - Category Management
**Estimated Time**: 10 minutes
**Dependencies**: 1.1.4

**Task**: Add category management actions

**Requirements**:
```typescript
// Actions:
addCategory: (category: ComponentCategory) => void;
updateCategory: (id: string, updates: Partial<ComponentCategory>) => void;
deleteCategory: (id: string) => void;
getCategoryTree: () => ComponentCategory[];
getComponentsByCategory: (categoryId: string) => UnifiedComponentDefinition[];
```

**Acceptance Criteria**:
- [ ] Category CRUD works
- [ ] Hierarchical categories supported
- [ ] Deleting category handles components
- [ ] Tree traversal works

---

## Micro-Task 1.1.6: Create Migration Service - Type Definitions
**Estimated Time**: 5 minutes
**Dependencies**: 1.1.1

**Task**: Create `hvac-design-app/src/core/services/migration/componentMigration.ts` with type definitions

**Requirements**:
```typescript
// Types:
interface MigrationResult {
  success: boolean;
  migratedComponents: UnifiedComponentDefinition[];
  errors: MigrationError[];
  stats: {
    totalProcessed: number;
    successful: number;
    failed: number;
  };
}

interface MigrationError {
  sourceId: string;
  sourceType: 'component' | 'catalog' | 'service';
  error: string;
}
```

**Acceptance Criteria**:
- [ ] Types defined
- [ ] Exports correct
- [ ] No TypeScript errors

---

## Micro-Task 1.1.7: Create Migration Service - Component Library Migration
**Estimated Time**: 10 minutes
**Dependencies**: 1.1.6

**Task**: Add migration from old componentLibraryStore

**Requirements**:
```typescript
// Function:
function migrateFromComponentLibrary(
  oldComponents: OldComponentDefinition[]
): UnifiedComponentDefinition[] {
  // Transform old format to new unified format
  // Map existing fields
  // Add defaults for new fields
  // Return transformed components
}
```

**Acceptance Criteria**:
- [ ] Migrates all old components
- [ ] Maps fields correctly
- [ ] Adds sensible defaults
- [ ] Returns valid unified components

---

## Micro-Task 1.1.8: Create Migration Service - Catalog Migration
**Estimated Time**: 10 minutes
**Dependencies**: 1.1.7

**Task**: Add migration from catalogStore

**Requirements**:
```typescript
// Function:
function migrateFromCatalog(
  catalogItems: CatalogItem[]
): UnifiedComponentDefinition[] {
  // Transform catalog items to unified format
  // Handle different catalog item types
  // Map pricing data
  // Return transformed components
}
```

**Acceptance Criteria**:
- [ ] Migrates all catalog items
- [ ] Handles type conversion
- [ ] Pricing data preserved
- [ ] Returns valid unified components

---

## Micro-Task 1.1.9: Create Migration Service - Service Migration
**Estimated Time**: 10 minutes
**Dependencies**: 1.1.8

**Task**: Add migration from serviceStore

**Requirements**:
```typescript
// Function:
function migrateFromServices(
  services: Service[]
): UnifiedComponentDefinition[] {
  // Transform services to unified format
  // Extract service type info
  // Map service properties
  // Return transformed components
}
```

**Acceptance Criteria**:
- [ ] Migrates all services
- [ ] Service type preserved
- [ ] Properties mapped correctly
- [ ] Returns valid unified components

---

## Micro-Task 1.1.10: Create Migration Service - Orchestration
**Estimated Time**: 10 minutes
**Dependencies**: 1.1.7, 1.1.8, 1.1.9

**Task**: Create main migration orchestration function

**Requirements**:
```typescript
// Main function:
export function migrateToUnifiedComponentLibrary(
  oldComponents: OldComponentDefinition[],
  catalogItems: CatalogItem[],
  services: Service[]
): MigrationResult {
  // Run all migrations
  // Merge results (handle duplicates by name)
  // Return complete result
}
```

**Acceptance Criteria**:
- [ ] Orchestrates all migrations
- [ ] Handles duplicates (merge by name)
- [ ] Returns complete stats
- [ ] All errors captured

---

## Micro-Task 1.1.11: Add Feature Flag Integration
**Estimated Time**: 5 minutes
**Dependencies**: 1.1.5, 1.1.10

**Task**: Add ENABLE_UNIFIED_COMPONENT_LIBRARY feature flag

**Requirements**:
```typescript
// In store:
const ENABLE_UNIFIED_COMPONENT_LIBRARY = 
  process.env.NEXT_PUBLIC_ENABLE_UNIFIED_COMPONENT_LIBRARY === 'true' ||
  localStorage.getItem('enableUnifiedLibrary') === 'true';

// In component:
const useUnifiedLibrary = () => {
  const isEnabled = useComponentLibraryStoreV2(state => state.isEnabled);
  return isEnabled && ENABLE_UNIFIED_COMPONENT_LIBRARY;
};
```

**Acceptance Criteria**:
- [ ] Feature flag reads from env
- [ ] Feature flag can be set in localStorage
- [ ] Store checks flag on initialization
- [ ] Flag controls store availability

---

## Micro-Task 1.1.12: Create Unit Tests - Schema Validation
**Estimated Time**: 10 minutes
**Dependencies**: 1.1.1

**Task**: Create test file `hvac-design-app/src/core/schema/__tests__/unified-component.schema.test.ts`

**Requirements**:
```typescript
// Tests:
- Valid component passes validation
- Invalid component fails with correct error
- Optional fields work correctly
- All enum values validated
- Type inference works
```

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Coverage > 80%
- [ ] Tests are isolated
- [ ] No external dependencies

---

## Micro-Task 1.1.13: Create Unit Tests - Store CRUD
**Estimated Time**: 15 minutes
**Dependencies**: 1.1.3

**Task**: Create test file `hvac-design-app/src/core/store/__tests__/componentLibraryStoreV2.test.ts` - Part 1

**Requirements**:
```typescript
// Tests:
- addComponent adds to store
- updateComponent updates correctly
- deleteComponent removes from store
- duplicateComponent creates copy
- getComponent returns correct component
```

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Tests use mock data
- [ ] State changes verified
- [ ] No external dependencies

---

## Micro-Task 1.1.14: Create Unit Tests - Store Search and Filter
**Estimated Time**: 10 minutes
**Dependencies**: 1.1.4

**Task**: Add search and filter tests to store test file - Part 2

**Requirements**:
```typescript
// Tests:
- search finds by name
- search finds by description
- search finds by tags
- filter by category works
- combined search + filter works
- activate/deactivate works
```

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Edge cases covered
- [ ] State changes verified
- [ ] No external dependencies

---

## Micro-Task 1.1.15: Create Unit Tests - Migration
**Estimated Time**: 15 minutes
**Dependencies**: 1.1.10

**Task**: Create test file `hvac-design-app/src/core/services/migration/__tests__/componentMigration.test.ts`

**Requirements**:
```typescript
// Tests:
- migrateFromComponentLibrary works
- migrateFromCatalog works
- migrateFromServices works
- main orchestration works
- duplicate handling works
- error handling works
```

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Mock data for old formats
- [ ] Migration results verified
- [ ] Error cases covered

---

## Micro-Task 1.1.16: Update Index Exports
**Estimated Time**: 5 minutes
**Dependencies**: 1.1.1, 1.1.5

**Task**: Update `hvac-design-app/src/core/schema/index.ts` and `hvac-design-app/src/core/store/index.ts`

**Requirements**:
```typescript
// In schema/index.ts:
export * from './unified-component.schema';

// In store/index.ts:
export { useComponentLibraryStoreV2 } from './componentLibraryStoreV2';
```

**Acceptance Criteria**:
- [ ] Schema exports added
- [ ] Store exports added
- [ ] No circular dependencies
- [ ] All imports resolve

---

## Micro-Task 1.1.17: Integration Test - End-to-End Migration
**Estimated Time**: 10 minutes
**Dependencies**: 1.1.15, 1.1.16

**Task**: Create integration test

**Requirements**:
```typescript
// Test:
- Full migration from old stores to new
- Store initialization with migrated data
- CRUD operations on migrated data
- Search/filter on migrated data
```

**Acceptance Criteria**:
- [ ] Integration test passes
- [ ] Uses real store instances
- [ ] End-to-end flow verified
- [ ] No external dependencies

---

## Phase 1.1 Summary

**Total Micro-Tasks**: 17
**Estimated Total Time**: 2.5-3 hours
**Files Created**: 5+
**Files Modified**: 2
**Tests Created**: 3 test files

### Execution Order

**Wave 1 (Parallel)**: 1.1.1, 1.1.2
**Wave 2 (Sequential)**: 1.1.3 → 1.1.4 → 1.1.5
**Wave 3 (Sequential)**: 1.1.6 → 1.1.7 → 1.1.8 → 1.1.9 → 1.1.10
**Wave 4 (Parallel)**: 1.1.11, 1.1.12, 1.1.13, 1.1.14, 1.1.15
**Wave 5 (Final)**: 1.1.16, 1.1.17

### Dependencies Graph

```
1.1.1 (Schema)
  ├── 1.1.2 (State)
  │     ├── 1.1.3 (CRUD)
  │     │     ├── 1.1.4 (Search)
  │     │     │     ├── 1.1.5 (Category)
  │     │     │     │     └── 1.1.11 (Feature Flag)
  │     ├── 1.1.12 (Tests)
  │     ├── 1.1.13 (Tests)
  │     └── 1.1.14 (Tests)
  └── 1.1.6 (Migration Types)
        ├── 1.1.7 (Migrate Components)
        ├── 1.1.8 (Migrate Catalog)
        └── 1.1.9 (Migrate Services)
              └── 1.1.10 (Orchestration)
                    └── 1.1.15 (Tests)
                          └── 1.1.17 (Integration)

1.1.16 (Exports) - After all others
```
