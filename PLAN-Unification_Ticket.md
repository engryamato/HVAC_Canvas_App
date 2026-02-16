# Unification Ticket - Complete Implementation Plan

## Project Overview
Implementation of the Unified Engineering Core for the HVAC Canvas App, transforming it into an engineering-grade system with parametric design, real-time cost estimation, and comprehensive validation.

## Architecture Foundation

### Key Architectural Decisions (from Tech Plan)
1. **Component Library Store Strategy**: Replace existing stores with unified V2
2. **Parametric Engine**: Imperative approach (not pure functional)  
3. **Validation State**: Hybrid - entity.warnings for persisted, validationStore for UI
4. **Fitting Insertion**: Enhanced service with junction analysis
5. **Cost Calculation**: Multiple estimation methods (unit, assembly, parametric)
6. **Connection Graph**: Full graph system with caching
7. **Data Migration**: Comprehensive system with backup and rollback

## Phase 1: Foundation (Parallelizable)

### Phase 1.1: Unified Component Library Store V2
**Status**: NOT_STARTED  
**Dependencies**: None  
**Can Parallelize With**: 1.2, 1.3  
**Files to Create**:
- `hvac-design-app/src/core/schema/unified-component.schema.ts`
- `hvac-design-app/src/core/store/componentLibraryStoreV2.ts`
- `hvac-design-app/src/core/services/migration/storeDataMigration.ts`

**Files to Reference**:
- `hvac-design-app/src/core/store/componentLibraryStore.ts`
- `hvac-design-app/src/core/store/catalogStore.ts`
- `hvac-design-app/src/core/store/serviceStore.ts`

**Acceptance Criteria**:
- [ ] New unified schema validates all component types
- [ ] Store supports CRUD, search, filter, activate operations
- [ ] Migration script transforms data from 3 old stores
- [ ] Feature flag `ENABLE_UNIFIED_COMPONENT_LIBRARY` controls usage
- [ ] Unit tests cover store operations and migration

---

### Phase 1.2: Enhanced Entity Schemas for Parametric Design
**Status**: NOT_STARTED  
**Dependencies**: None  
**Can Parallelize With**: 1.1, 1.3  
**Files to Modify**:
- `hvac-design-app/src/core/schema/duct.schema.ts`
- `hvac-design-app/src/core/schema/fitting.schema.ts`
- `hvac-design-app/src/core/schema/equipment.schema.ts`
- `hvac-design-app/src/core/schema/base.schema.ts`

**Acceptance Criteria**:
- [ ] Add parametric fields (systemType, connectedFrom/To, engineeringData)
- [ ] Enhance base schema with common parametric properties
- [ ] Add validation constraints to schemas
- [ ] All existing tests pass with enhanced schemas

---

### Phase 1.3: Calculation Settings System with Templates
**Status**: NOT_STARTED  
**Dependencies**: None  
**Can Parallelize With**: 1.1, 1.2  
**Files to Create**:
- `hvac-design-app/src/core/store/calculationSettingsStore.ts`
- `hvac-design-app/src/core/services/templates/systemTemplateService.ts`

**Files to Modify**:
- `hvac-design-app/src/core/schema/calculation-settings.schema.ts`

**Acceptance Criteria**:
- [ ] Settings store with template support
- [ ] Pre-defined templates (Commercial Standard, Residential Budget, Industrial Heavy)
- [ ] Settings include labor rates, markup, waste factors, engineering limits
- [ ] Template application updates all dependent calculations

---

### Phase 1.4: Data Migration Infrastructure
**Status**: NOT_STARTED  
**Dependencies**: 1.1  
**Can Parallelize With**: 1.2, 1.3  
**Files to Create**:
- `hvac-design-app/src/core/services/migration/VersionDetector.ts`
- `hvac-design-app/src/core/services/migration/MigrationRegistry.ts`
- `hvac-design-app/src/core/services/migration/MigrationService.ts`
- `hvac-design-app/src/core/services/migration/BackupManager.ts`

**Acceptance Criteria**:
- [ ] Version detection from project file structure
- [ ] Migration registry with step chaining
- [ ] Backup creation before migration
- [ ] Rollback capability
- [ ] Validation after migration

---

### Phase 1.5: Update Codebase to Use Unified Component Library
**Status**: NOT_STARTED  
**Dependencies**: 1.1, 1.4  
**Can Parallelize With**: None  
**Files to Update**:
- All files importing from old stores
- Feature components using component data

**Acceptance Criteria**:
- [ ] All references updated to new store
- [ ] Feature flag controls gradual rollout
- [ ] Old stores marked as deprecated
- [ ] Migration runs automatically on old projects

---

## Phase 2: Parametric Design (Sequential)

### Phase 2.1: Connection Graph System with Caching
**Status**: NOT_STARTED  
**Dependencies**: 1.2  
**Files to Create**:
- `hvac-design-app/src/core/services/graph/ConnectionGraphBuilder.ts`
- `hvac-design-app/src/core/services/graph/GraphTraversal.ts`

**Acceptance Criteria**:
- [ ] Build graph from entity connections
- [ ] Cache based on entity signature
- [ ] Affected entity detection (N-hop traversal)
- [ ] Performance < 100ms for 1000 entities

---

### Phase 2.2: Parametric Update Service (Imperative)
**Status**: NOT_STARTED  
**Dependencies**: 2.1, 1.2  
**Files to Create**:
- `hvac-design-app/src/core/services/parametrics/ParametricUpdateService.ts`

**Files to Reference**:
- `hvac-design-app/src/core/services/constraintValidation.ts`

**Acceptance Criteria**:
- [ ] Dimension change triggers cascade updates
- [ ] Connected entities updated (fittings resize to match ducts)
- [ ] Validation runs on affected entities
- [ ] Undo grouping for parametric changes
- [ ] Returns list of updated entities and validation issues

---

### Phase 2.3: Validation Store and Dashboard Integration
**Status**: NOT_STARTED  
**Dependencies**: 2.2, 1.2  
**Files to Create**:
- `hvac-design-app/src/core/store/validationStore.ts` (enhance existing)

**Acceptance Criteria**:
- [ ] Validation store aggregates from entity.warnings
- [ ] Dashboard shows errors/warnings/info counts
- [ ] Filter by severity and category
- [ ] Issue selection navigates to entity
- [ ] Real-time updates as validation runs

---

### Phase 2.4: Enhanced Properties Panel with Engineering Tab
**Status**: NOT_STARTED  
**Dependencies**: 2.3, 1.3  
**Files to Create**:
- `hvac-design-app/src/features/canvas/components/PropertiesPanel/EngineeringTab.tsx`
- `hvac-design-app/src/features/canvas/components/PropertiesPanel/CostingTab.tsx`

**Files to Modify**:
- `hvac-design-app/src/features/canvas/components/PropertiesPanel/index.tsx`

**Acceptance Criteria**:
- [ ] Tabbed interface (Dimensions, Engineering, Costing)
- [ ] Engineering tab shows velocity, pressure drop, constraints
- [ ] Real-time validation feedback
- [ ] Constraint violation warnings with suggestions
- [ ] Costing tab shows material and labor breakdown

---

## Phase 3: Intelligent Automation (Sequential)

### Phase 3.1: Fitting Insertion Service Refactor for Complex Junctions
**Status**: NOT_STARTED  
**Dependencies**: 2.1, 1.1  
**Files to Modify**:
- `hvac-design-app/src/core/services/fittingGeneration.ts`

**Acceptance Criteria**:
- [ ] Junction analysis (2 ducts, 3 ducts, size transitions)
- [ ] Automatic fitting selection (elbow, tee, wye, reducer)
- [ ] Complex angle handling (45°, 60°, etc.)
- [ ] User override mechanism
- [ ] Orphan detection and cleanup

---

### Phase 3.2: Auto-Sizing System with Velocity Constraints
**Status**: NOT_STARTED  
**Dependencies**: 2.2, 1.3  
**Files to Create**:
- `hvac-design-app/src/core/services/parametrics/autoSizing.ts`

**Acceptance Criteria**:
- [ ] Duct sizing based on airflow and velocity constraints
- [ ] Integration with parametric update service
- [ ] Multiple sizing methods (velocity, friction, static regain)
- [ ] Constraint validation before sizing

---

### Phase 3.3: Unified Component Browser UI
**Status**: NOT_STARTED  
**Dependencies**: 1.5, 1.1  
**Files to Create**:
- `hvac-design-app/src/features/canvas/components/ComponentBrowser/index.tsx`
- `hvac-design-app/src/features/canvas/components/ComponentBrowser/ComponentTree.tsx`
- `hvac-design-app/src/features/canvas/components/ComponentBrowser/SearchFilter.tsx`

**Acceptance Criteria**:
- [ ] Unified component tree (replaces catalog + services)
- [ ] Search and filter functionality
- [ ] Click-to-activate tool pattern
- [ ] Hierarchical category display
- [ ] Visual feedback for active component

---

## Phase 4: Advanced BOM & Cost (Sequential)

### Phase 4.1: Enhanced Cost Calculation with Multiple Estimation Methods
**Status**: NOT_STARTED  
**Dependencies**: 1.3, 1.1  
**Files to Modify**:
- `hvac-design-app/src/core/services/costCalculationService.ts`

**Acceptance Criteria**:
- [ ] Unit cost method (existing)
- [ ] Assembly cost method (grouped components)
- [ ] Parametric cost method (size-based)
- [ ] Method selection in settings
- [ ] Cost delta tracking

---

### Phase 4.2: Enhanced BOM Panel with Real-Time Updates
**Status**: NOT_STARTED  
**Dependencies**: 4.1, 2.4  
**Files to Create**:
- `hvac-design-app/src/features/canvas/components/BOMPanel/index.tsx`

**Acceptance Criteria**:
- [ ] Real-time BOM updates (debounced)
- [ ] Grouping by category, system type, material
- [ ] Cost breakdown display
- [ ] Search and filter
- [ ] Export buttons (CSV, PDF)

---

### Phase 4.3: Multi-Format Export System (PDF, CSV, Excel)
**Status**: NOT_STARTED  
**Dependencies**: 4.2  
**Files to Create**:
- `hvac-design-app/src/core/services/export/bomExportService.ts`
- `hvac-design-app/src/core/services/export/pdfGenerator.ts`
- `hvac-design-app/src/core/services/export/excelGenerator.ts`

**Acceptance Criteria**:
- [ ] CSV export (flat table)
- [ ] PDF export (formatted document)
- [ ] Excel export (multi-sheet)
- [ ] Customizable templates
- [ ] Validation before export

---

## Phase 5: Project Management (Partially Parallel)

### Phase 5.1: Project Initialization Wizard
**Status**: NOT_STARTED  
**Dependencies**: 1.3, 3.3  
**Files to Create**:
- `hvac-design-app/src/features/project/components/ProjectSetupWizard.tsx`

---

### Phase 5.2: Validation Dashboard with Issue Navigation
**Status**: NOT_STARTED  
**Dependencies**: 2.3, 2.4  
**Files to Create**:
- `hvac-design-app/src/features/validation/components/ValidationDashboard.tsx`

---

### Phase 5.3: Bulk Operations with Preview and Undo
**Status**: NOT_STARTED  
**Dependencies**: 2.2, 4.1  
**Files to Create**:
- `hvac-design-app/src/features/canvas/components/BulkEditDialog.tsx`
- `hvac-design-app/src/core/services/bulkOperationsService.ts`

---

### Phase 5.4: Component Library Management UI
**Status**: NOT_STARTED  
**Dependencies**: 1.1, 3.3  
**Files to Create**:
- `hvac-design-app/src/features/library/components/LibraryManagementView.tsx`

---

### Phase 5.5: System Template Application
**Status**: NOT_STARTED  
**Dependencies**: 1.3, 3.3  
**Files to Create**:
- `hvac-design-app/src/features/canvas/components/SystemTemplateSelector.tsx`

---

### Phase 5.6: Calculation Settings Dialog UI
**Status**: NOT_STARTED  
**Dependencies**: 1.3, 4.2  
**Files to Create**:
- `hvac-design-app/src/features/settings/components/CalculationSettingsDialog.tsx`

---

## Phase 6: Data Migration & Onboarding

### Phase 6.1: Migration Wizard UI with Rollback
**Status**: NOT_STARTED  
**Dependencies**: 1.4, 1.5  
**Files to Create**:
- `hvac-design-app/src/features/migration/components/MigrationWizard.tsx`

---

### Phase 6.2: Interactive Onboarding Tutorial
**Status**: NOT_STARTED  
**Dependencies**: 3.3, 2.4, 4.2, 3.1  
**Files to Create**:
- `hvac-design-app/src/features/onboarding/components/InteractiveTutorial.tsx`

---

## Phase 7: Advanced Features

### Phase 7.1: Enhanced Undo/Redo for Parametric Changes
**Status**: NOT_STARTED  
**Dependencies**: 2.2, 5.3  
**Files to Modify**:
- Entity store undo/redo system

---

### Phase 7.2: Performance Optimization for Large Projects
**Status**: NOT_STARTED  
**Dependencies**: 2.1, 4.2  
**Files to Modify**:
- Graph incremental updates
- BOM virtual scrolling

---

### Phase 7.3: Auto-Save and Crash Recovery
**Status**: NOT_STARTED  
**Dependencies**: 1.4  
**Files to Modify**:
- Auto-save integration
- Recovery mechanisms

---

## Phase 8: Testing & Documentation

### Phase 8: Comprehensive Testing and Documentation
**Status**: NOT_STARTED  
**Dependencies**: ALL  
**Deliverables**:
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] E2E tests
- [ ] User documentation
- [ ] API documentation
- [ ] Migration guide

---

## Execution Strategy

### Phase 1 Execution (Parallel)
Tasks 1.1, 1.2, 1.3 can be executed in parallel. Task 1.4 depends on 1.1. Task 1.5 depends on 1.1 and 1.4.

### Phase 2 Execution (Sequential)
Tasks have dependencies: 2.1 → 2.2 → 2.3 → 2.4

### Phase 3 Execution (Mixed)
Tasks 3.1 and 3.2 can run in parallel after Phase 2. Task 3.3 depends on 1.5.

### Phase 4-8 Execution
Follow dependency graph provided in ticket.

## Risk Mitigation

1. **Breaking Changes**: Use feature flags for gradual rollout
2. **Data Loss**: Comprehensive backup and rollback system
3. **Performance**: Caching, debouncing, incremental updates
4. **Complexity**: Extensive testing at each phase

## Success Metrics

- All unit tests passing
- E2E tests covering core flows
- Performance benchmarks met
- Zero data loss in migration testing
- User acceptance testing passed
