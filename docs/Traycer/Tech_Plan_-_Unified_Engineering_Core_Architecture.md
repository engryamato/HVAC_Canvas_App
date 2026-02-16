# Tech Plan - Unified Engineering Core Architecture

# Tech Plan: Unified Engineering Core Architecture (Validated)

## Architecture Validation Summary

**Status**: ✅ Validated and Ready for Implementation  
**Validation Date**: 2024-02-11  
**Critical Issues Resolved**: 7/7

This Tech Plan has been stress-tested against the existing codebase and requirements. All critical architectural decisions have been clarified and documented below.

## Validated Architectural Decisions

### Decision 1: Component Library Store Strategy

**Decision**: Replace existing componentLibraryStore entirely with new unified design

**Rationale**:

- Current `componentLibraryStore` has different schema than needed for unified system
- Clean break allows proper integration of catalog and service functionality
- Accepting breaking changes now prevents technical debt

**Implementation**:

1. **Phase 1.1**: Create new `componentLibraryStoreV2.ts` with unified schema
2. **Phase 1.2**: Build migration script from old componentLibraryStore + catalogStore + serviceStore
3. **Phase 1.3**: Update all references to use new store
4. **Phase 1.4**: Remove old stores (breaking change)

**Migration Path**:

```typescript
// Old stores to migrate:
// - componentLibraryStore (ComponentDefinition[])
// - catalogStore (CatalogItem[])
// - serviceStore (Service[], ServiceTemplate[])

// New unified store:
// - componentLibraryStoreV2 (ComponentDefinition[] with enhanced schema)

interface MigrationPlan {
  // Map old ComponentDefinition → new ComponentDefinition
  migrateComponents: (old: OldComponentDefinition[]) => ComponentDefinition[];
  
  // Map CatalogItem → ComponentDefinition
  migrateCatalog: (items: CatalogItem[]) => ComponentDefinition[];
  
  // Map Service/ServiceTemplate → ComponentDefinition or SystemTemplate
  migrateServices: (services: Service[]) => ComponentDefinition[];
}
```

**Trade-offs**:

- ✅ **Pro**: Clean architecture, no legacy baggage
- ✅ **Pro**: Unified schema from day one
- ❌ **Con**: Breaking change requires updating all consuming code
- ❌ **Con**: Migration complexity (3 stores → 1)
- ⚠️ **Mitigation**: Feature flag to enable new store gradually, parallel operation during transition

**Files Affected**:

- `src/core/store/componentLibraryStore.ts` → replaced
- `src/core/store/catalogStore.ts` → deprecated
- `src/core/store/serviceStore.ts` → deprecated
- All components using these stores → updated

---

### Decision 2: Parametric Engine Architecture

**Decision**: Adapt to existing imperative patterns, skip pure functional approach

**Rationale**:

- Existing codebase uses imperative validation (ConstraintValidationService)
- Pure functional approach requires massive refactoring (patches, graphs, transactions)
- Pragmatic approach: build parametric logic that works with current patterns
- Can evolve to pure functional later if needed

**Implementation**:

```typescript
// Imperative parametric service (not pure functional)
class ParametricUpdateService {
  /**
   * Apply dimension change and cascade updates
   * Mutates entities directly (imperative style)
   */
  applyDimensionChange(
    entityId: string,
    dimension: 'width' | 'height' | 'diameter',
    newValue: number
  ): {
    updatedEntityIds: string[];
    validationIssues: ValidationIssue[];
  } {
    const entity = useEntityStore.getState().byId[entityId];
    
    // 1. Update target entity
    useEntityStore.getState().updateEntity(entityId, {
      props: { ...entity.props, [dimension]: newValue }
    });
    
    // 2. Find connected entities
    const connected = this.findConnectedEntities(entityId);
    
    // 3. Update connected entities (cascade)
    for (const connectedId of connected) {
      this.updateConnectedEntity(connectedId, entity);
    }
    
    // 4. Validate all affected entities
    const issues = this.validateAffectedEntities([entityId, ...connected]);
    
    return {
      updatedEntityIds: [entityId, ...connected],
      validationIssues: issues
    };
  }
  
  private findConnectedEntities(entityId: string): string[] {
    // Traverse connections from entity props (connectedFrom/To)
    // No graph data structure needed
  }
  
  private updateConnectedEntity(connectedId: string, sourceEntity: Entity): void {
    // Update fitting size to match duct, etc.
  }
  
  private validateAffectedEntities(entityIds: string[]): ValidationIssue[] {
    // Use existing ConstraintValidationService
  }
}
```

**Trade-offs**:

- ✅ **Pro**: Works with existing codebase patterns
- ✅ **Pro**: No massive refactoring required
- ✅ **Pro**: Can implement incrementally
- ❌ **Con**: Not as elegant as pure functional approach
- ❌ **Con**: Harder to test (mutates state)
- ❌ **Con**: Can't easily move to worker later
- ⚠️ **Mitigation**: Keep service stateless, accept entities as parameters

**Files**:

- `src/core/services/parametrics/ParametricUpdateService.ts` (new, imperative)
- `src/core/services/constraintValidation.ts` (existing, reuse)

---

### Decision 3: Validation State Management

**Decision**: Hybrid approach - entity.warnings for persisted violations, validationStore for ephemeral UI state

**Rationale**:

- Keep existing `entity.warnings` for critical violations that should persist
- Add `validationStore` for UI-specific state (dashboard, filters, aggregation)
- Clear separation of concerns: persistence vs. UI state

**Implementation**:

```typescript
// Entity warnings (persisted with entity)
interface EntityWarnings {
  velocity?: string;              // Critical: persisted
  constraintViolations?: string[]; // Critical: persisted
}

// Validation store (ephemeral UI state)
interface ValidationStore {
  // Aggregated view for dashboard
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
  
  // Filters and UI state
  filters: {
    severity: ValidationSeverity[];
    category: string[];
  };
  
  // Selected issue for navigation
  selectedIssueId: string | null;
  
  // Actions
  refreshSummary: () => void;  // Reads from entity.warnings
  setFilters: (filters: Filters) => void;
  selectIssue: (id: string) => void;
}
```

**Data Flow**:

1. Parametric update triggers validation
2. Critical violations stored in `entity.warnings` (persisted)
3. ValidationStore reads from `entity.warnings` and aggregates for UI
4. Dashboard displays aggregated data from ValidationStore
5. On project load, ValidationStore rebuilds from `entity.warnings`

**Trade-offs**:

- ✅ **Pro**: Clear separation (persistence vs. UI)
- ✅ **Pro**: Critical violations persist across sessions
- ✅ **Pro**: UI state can be rebuilt from entity data
- ❌ **Con**: Two places to look for validation data
- ❌ **Con**: ValidationStore must stay in sync with entity.warnings
- ⚠️ **Mitigation**: ValidationStore is read-only view of entity.warnings, single source of truth

**Files**:

- `src/core/schema/duct.schema.ts` (existing, keep entity.warnings)
- `src/core/store/validationStore.ts` (new, ephemeral UI state)

---

### Decision 4: Fitting Insertion Service Enhancement

**Decision**: Refactor existing service to match Tech Plan architecture

**Rationale**:

- Existing `fittingInsertionService` handles simple cases (90° elbows)
- Needs enhancement for complex junctions (T-junctions, transitions, complex angles)
- Refactor to add junction analysis and fitting selection algorithm

**Current Capabilities** (to preserve):

- ✅ Auto-insert elbows at 90° connections
- ✅ Detect orphaned fittings
- ✅ Integration with DuctTool

**Enhancements Needed**:

- ❌ T-junction handling (3 ducts meeting)
- ❌ Size transition detection and fitting selection
- ❌ Complex angle handling (not 90°, e.g., 45°, 60°)
- ❌ User override mechanism
- ❌ Fitting type selection algorithm

**Refactored Architecture**:

```typescript
class FittingInsertionService {
  // Existing method (enhance)
  planAutoInsertForDuct(ductId: string, entities: Record<string, Entity>): InsertionPlan {
    const connectionPoints = this.detectConnectionPoints(ductId, entities);
    const insertions: Entity[] = [];
    
    for (const point of connectionPoints) {
      const analysis = this.analyzeJunction(point, entities);
      const fitting = this.selectFitting(analysis);
      
      if (fitting) {
        insertions.push(fitting);
      }
    }
    
    const orphans = this.detectOrphanedFittings(ductId, entities);
    
    return { insertions, orphanFittingIds: orphans };
  }
  
  // NEW: Analyze junction geometry
  private analyzeJunction(
    point: ConnectionPoint,
    entities: Record<string, Entity>
  ): JunctionAnalysis {
    const connectedDucts = this.getConnectedDucts(point, entities);
    
    return {
      ductCount: connectedDucts.length,
      angles: this.calculateAngles(connectedDucts),
      sizes: connectedDucts.map(d => this.getDuctSize(d)),
      materials: connectedDucts.map(d => d.props.material),
      junctionType: this.classifyJunction(connectedDucts)
    };
  }
  
  // NEW: Select appropriate fitting
  private selectFitting(analysis: JunctionAnalysis): Entity | null {
    // 2 ducts at 90°: Elbow
    if (analysis.ductCount === 2 && analysis.angles[0] === 90) {
      return this.createElbow(analysis);
    }
    
    // 3 ducts: Tee or Wye
    if (analysis.ductCount === 3) {
      return this.createTeeOrWye(analysis);
    }
    
    // Size mismatch: Transition
    if (this.hasSizeMismatch(analysis)) {
      return this.createTransition(analysis);
    }
    
    // Complex: Return null, let user choose
    return null;
  }
}
```

**Trade-offs**:

- ✅ **Pro**: Handles complex junctions automatically
- ✅ **Pro**: Preserves existing functionality
- ✅ **Pro**: Clear algorithm for fitting selection
- ❌ **Con**: Refactoring risk (could break existing auto-fitting)
- ❌ **Con**: Complex junction logic is hard to get right
- ⚠️ **Mitigation**: Extensive testing, feature flag for new junction handling

**Files**:

- `src/core/services/automation/fittingInsertionService.ts` (refactor)

---

### Decision 5: Cost Calculation Service Enhancement

**Decision**: Add calculation methods - Support different estimation methods

**Rationale**:

- Existing `costCalculationService` handles basic unit cost calculation
- Need to support multiple estimation methods for different use cases
- Professional estimators use different methods depending on project type

**Current Capabilities** (to preserve):

- ✅ Unit cost calculation (material cost per unit)
- ✅ Labor cost calculation (labor hours × rate)
- ✅ Markup and overhead application
- ✅ Cost delta tracking

**New Estimation Methods**:

```typescript
interface CostCalculationService {
  // Existing method (keep)
  calculateProjectCost(
    bomItems: BOMItem[],
    settings: CalculationSettings,
    componentPricing: Map<string, ComponentPricing>
  ): ProjectCostEstimate;
  
  // NEW: Unit cost method (existing, formalize)
  calculateUnitCost(item: BOMItem, pricing: ComponentPricing): ItemCost {
    return {
      material: item.quantity * pricing.materialCost,
      labor: item.quantity * pricing.laborUnits * settings.laborRate,
      total: material + labor
    };
  }
  
  // NEW: Assembly cost method
  calculateAssemblyCost(assembly: Assembly, pricing: ComponentPricing): ItemCost {
    // Assembly = group of components installed together
    // Example: "10' duct run" = duct + 2 elbows + hangers
    const components = assembly.components;
    const assemblyCost = components.reduce((sum, comp) => {
      return sum + this.calculateUnitCost(comp, pricing);
    }, 0);
    
    // Assembly labor efficiency (faster to install as group)
    const laborEfficiency = assembly.laborEfficiency || 1.0;
    
    return {
      material: assemblyCost.material,
      labor: assemblyCost.labor * laborEfficiency,
      total: assemblyCost.material + (assemblyCost.labor * laborEfficiency)
    };
  }
  
  // NEW: Parametric cost method
  calculateParametricCost(item: BOMItem, parameters: CostParameters): ItemCost {
    // Parametric = cost based on size, complexity, location
    // Example: Cost per sq ft of ductwork based on size and material
    const baseRate = parameters.baseRatePerUnit;
    const sizeMultiplier = this.getSizeMultiplier(item.size);
    const complexityMultiplier = this.getComplexityMultiplier(item);
    const locationMultiplier = parameters.locationFactor || 1.0;
    
    const adjustedRate = baseRate * sizeMultiplier * complexityMultiplier * locationMultiplier;
    
    return {
      material: item.quantity * adjustedRate,
      labor: item.quantity * parameters.laborRate,
      total: (item.quantity * adjustedRate) + (item.quantity * parameters.laborRate)
    };
  }
}
```

**Use Cases**:

- **Unit Cost**: Simple projects, standard components
- **Assembly Cost**: Complex installations, grouped components
- **Parametric Cost**: Conceptual estimates, early-stage budgeting

**Trade-offs**:

- ✅ **Pro**: Supports professional estimation workflows
- ✅ **Pro**: Flexibility for different project types
- ✅ **Pro**: More accurate estimates for complex projects
- ❌ **Con**: Increased complexity in cost calculation
- ❌ **Con**: More configuration required (assembly definitions, parameters)
- ⚠️ **Mitigation**: Default to unit cost method, advanced methods optional

**Files**:

- `src/core/services/cost/costCalculationService.ts` (enhance)
- `src/core/schema/calculation-settings.schema.ts` (add estimation method settings)

---

### Decision 6: Connection Graph System

**Decision**: Build full graph system with caching, accept complexity for future flexibility

**Rationale**:

- Graph structure enables advanced features (dependency analysis, impact analysis, optimization)
- Caching mitigates performance concerns
- Future features (multi-step parametric resolution, design optimization) require graph
- Complexity is justified by long-term benefits

**Implementation**:

```typescript
class ConnectionGraphBuilder {
  private cache: Map<string, ConnectionGraph> = new Map();
  private cacheKey: string | null = null;
  
  /**
   * Build connection graph from entities
   * Cached based on entity snapshot signature
   */
  buildGraph(entities: Record<string, Entity>): ConnectionGraph {
    const signature = this.createSignature(entities);
    
    // Check cache
    if (this.cacheKey === signature && this.cache.has(signature)) {
      return this.cache.get(signature)!;
    }
    
    // Build graph
    const graph = this.buildGraphInternal(entities);
    
    // Update cache
    this.cacheKey = signature;
    this.cache.clear(); // Keep only latest
    this.cache.set(signature, graph);
    
    return graph;
  }
  
  private buildGraphInternal(entities: Record<string, Entity>): ConnectionGraph {
    const nodes = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];
    
    // Create nodes
    for (const [id, entity] of Object.entries(entities)) {
      nodes.set(id, {
        id,
        type: entity.type,
        entity
      });
    }
    
    // Create edges from connections
    for (const [id, entity] of Object.entries(entities)) {
      if (entity.type === 'duct') {
        if (entity.props.connectedFrom) {
          edges.push({
            from: entity.props.connectedFrom,
            to: id,
            type: 'duct-connection'
          });
        }
        if (entity.props.connectedTo) {
          edges.push({
            from: id,
            to: entity.props.connectedTo,
            type: 'duct-connection'
          });
        }
      }
    }
    
    return { nodes, edges };
  }
  
  /**
   * Get affected entities (within N hops of changed entity)
   */
  getAffectedEntities(entityId: string, graph: ConnectionGraph, maxHops: number = 2): string[] {
    const visited = new Set<string>();
    const queue: Array<{ id: string; hops: number }> = [{ id: entityId, hops: 0 }];
    
    while (queue.length > 0) {
      const { id, hops } = queue.shift()!;
      
      if (visited.has(id) || hops > maxHops) continue;
      visited.add(id);
      
      // Add connected entities to queue
      const connected = this.getConnectedNodes(id, graph);
      for (const connectedId of connected) {
        queue.push({ id: connectedId, hops: hops + 1 });
      }
    }
    
    return Array.from(visited);
  }
}
```

**Performance Optimizations**:

1. **Caching**: Cache graph based on entity snapshot signature
2. **Lazy building**: Only build graph when needed (parametric updates, validation)
3. **Incremental updates**: For small changes, update graph incrementally (future)
4. **Subgraph extraction**: Only build subgraph for affected entities (future)

**Trade-offs**:

- ✅ **Pro**: Enables advanced features (dependency analysis, optimization)
- ✅ **Pro**: Caching mitigates performance concerns
- ✅ **Pro**: Future-proof for complex operations
- ❌ **Con**: Complexity in graph algorithms
- ❌ **Con**: Memory overhead for large projects
- ❌ **Con**: Cache invalidation on every entity change
- ⚠️ **Mitigation**: Start with simple caching, optimize incrementally

**Files**:

- `src/core/services/graph/ConnectionGraphBuilder.ts` (new)
- `src/core/services/graph/GraphTraversal.ts` (new, helper utilities)

---

### Decision 7: Data Migration System

**Decision**: Comprehensive migration system with version detection, backups, rollback UI, and validation

**Rationale**:

- Data migration is critical for user trust and adoption
- Comprehensive system prevents data loss and provides safety net
- Investment in migration infrastructure pays off long-term

**Implementation**:

**1. Version Detection**:

```typescript
interface ProjectFile {
  schemaVersion: string; // "1.0.0", "2.0.0", etc.
  metadata: ProjectMetadata;
  entities: Entity[];
  // ... other data
}

class VersionDetector {
  detectVersion(projectFile: unknown): string {
    // Check for schemaVersion field
    if (typeof projectFile === 'object' && projectFile !== null) {
      const file = projectFile as Record<string, unknown>;
      
      if (typeof file.schemaVersion === 'string') {
        return file.schemaVersion;
      }
    }
    
    // Fallback: Detect version from structure
    return this.detectVersionFromStructure(projectFile);
  }
  
  private detectVersionFromStructure(projectFile: unknown): string {
    // Old projects without schemaVersion field
    // Detect based on presence/absence of fields
    
    if (this.hasComponentLibraryStore(projectFile)) {
      return '1.0.0'; // Current version
    }
    
    return '0.9.0'; // Legacy version
  }
}
```

**2. Migration Registry**:

```typescript
type MigrationFunction = (data: unknown) => unknown;

class MigrationRegistry {
  private migrations: Map<string, MigrationFunction> = new Map();
  
  register(fromVersion: string, toVersion: string, fn: MigrationFunction): void {
    const key = `${fromVersion}->${toVersion}`;
    this.migrations.set(key, fn);
  }
  
  getMigrationPath(fromVersion: string, toVersion: string): MigrationFunction[] {
    // Find sequence of migrations: v1 -> v2 -> v3
    const path: MigrationFunction[] = [];
    let current = fromVersion;
    
    while (current !== toVersion) {
      const next = this.getNextVersion(current, toVersion);
      const key = `${current}->${next}`;
      const migration = this.migrations.get(key);
      
      if (!migration) {
        throw new Error(`No migration path from ${fromVersion} to ${toVersion}`);
      }
      
      path.push(migration);
      current = next;
    }
    
    return path;
  }
}

// Register migrations
const registry = new MigrationRegistry();

registry.register('0.9.0', '1.0.0', (data) => {
  // Migrate legacy format to v1.0.0
  return migrateToV1(data);
});

registry.register('1.0.0', '2.0.0', (data) => {
  // Migrate v1.0.0 to v2.0.0 (unified component library)
  return migrateToV2(data);
});
```

**3. Backup System**:

```typescript
class BackupManager {
  async createBackup(projectFile: ProjectFile): Promise<BackupInfo> {
    const timestamp = new Date().toISOString();
    const backupId = `backup-${timestamp}`;
    
    // Store in IndexedDB
    await this.storage.set(backupId, {
      projectFile,
      timestamp,
      schemaVersion: projectFile.schemaVersion
    });
    
    // Keep last 10 backups
    await this.pruneOldBackups();
    
    return { backupId, timestamp };
  }
  
  async restoreBackup(backupId: string): Promise<ProjectFile> {
    const backup = await this.storage.get(backupId);
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }
    return backup.projectFile;
  }
  
  async listBackups(): Promise<BackupInfo[]> {
    // Return list of available backups for UI
  }
}
```

**4. Migration Wizard UI**:

```typescript
interface MigrationWizardProps {
  projectFile: ProjectFile;
  onComplete: (migratedFile: ProjectFile) => void;
  onCancel: () => void;
}

function MigrationWizard({ projectFile, onComplete, onCancel }: MigrationWizardProps) {
  const [step, setStep] = useState<'detect' | 'backup' | 'migrate' | 'validate' | 'complete'>('detect');
  const [backup, setBackup] = useState<BackupInfo | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  
  // Step 1: Detect version
  const currentVersion = versionDetector.detectVersion(projectFile);
  const targetVersion = CURRENT_SCHEMA_VERSION;
  
  // Step 2: Create backup
  const handleBackup = async () => {
    const backupInfo = await backupManager.createBackup(projectFile);
    setBackup(backupInfo);
    setStep('migrate');
  };
  
  // Step 3: Run migration
  const handleMigrate = async () => {
    try {
      const result = await migrationService.migrate(projectFile, targetVersion);
      setMigrationResult(result);
      setStep('validate');
    } catch (error) {
      // Show error, offer rollback
    }
  };
  
  // Step 4: Validate
  const handleValidate = async () => {
    const validation = await migrationService.validate(migrationResult.data);
    if (validation.isValid) {
      setStep('complete');
    } else {
      // Show validation errors, offer rollback
    }
  };
  
  // Rollback
  const handleRollback = async () => {
    if (backup) {
      const original = await backupManager.restoreBackup(backup.backupId);
      onComplete(original);
    }
  };
  
  return (
    <Dialog>
      {step === 'detect' && <DetectStep currentVersion={currentVersion} targetVersion={targetVersion} onNext={() => setStep('backup')} />}
      {step === 'backup' && <BackupStep onBackup={handleBackup} />}
      {step === 'migrate' && <MigrateStep onMigrate={handleMigrate} />}
      {step === 'validate' && <ValidateStep result={migrationResult} onValidate={handleValidate} onRollback={handleRollback} />}
      {step === 'complete' && <CompleteStep onComplete={() => onComplete(migrationResult.data)} />}
    </Dialog>
  );
}
```

**5. Failure Handling**:

```typescript
class MigrationService {
  async migrate(projectFile: ProjectFile, targetVersion: string): Promise<MigrationResult> {
    const currentVersion = versionDetector.detectVersion(projectFile);
    const migrations = registry.getMigrationPath(currentVersion, targetVersion);
    
    let data = projectFile;
    const steps: MigrationStep[] = [];
    
    try {
      for (let i = 0; i < migrations.length; i++) {
        const migration = migrations[i];
        const stepResult = await this.runMigrationStep(migration, data, i);
        
        data = stepResult.data;
        steps.push(stepResult);
      }
      
      return {
        success: true,
        data,
        steps
      };
    } catch (error) {
      // Migration failed - return partial result
      return {
        success: false,
        error: error.message,
        data: projectFile, // Original data
        steps,
        failedAtStep: steps.length
      };
    }
  }
  
  private async runMigrationStep(
    migration: MigrationFunction,
    data: unknown,
    stepIndex: number
  ): Promise<MigrationStep> {
    try {
      const result = await migration(data);
      return {
        stepIndex,
        success: true,
        data: result
      };
    } catch (error) {
      throw new Error(`Migration step ${stepIndex} failed: ${error.message}`);
    }
  }
}
```

**Trade-offs**:

- ✅ **Pro**: Comprehensive safety net for users
- ✅ **Pro**: Clear migration path and rollback
- ✅ **Pro**: User trust and confidence
- ❌ **Con**: Significant implementation effort
- ❌ **Con**: Complex UI for migration wizard
- ❌ **Con**: Testing complexity (need old project files)
- ⚠️ **Mitigation**: Phased implementation, start with basic version detection

**Files**:

- `src/core/services/migration/VersionDetector.ts` (new)
- `src/core/services/migration/MigrationRegistry.ts` (new)
- `src/core/services/migration/MigrationService.ts` (new)
- `src/core/services/migration/BackupManager.ts` (new)
- `src/features/migration/MigrationWizard.tsx` (new)

---

## Updated Implementation Phases

Based on validated architectural decisions, here's the updated phase breakdown:

### Phase 1: Foundation (Months 1-3)

**1.1 Component Library Store V2**

- Create new unified store (replace existing)
- Enhanced schema with catalog + service functionality
- Migration script from 3 stores → 1
- **Breaking change**: Update all references

**1.2 Enhanced Entity Schemas**

- Keep `entity.warnings` for persisted violations
- Add fields for parametric design (systemType, engineeringData)
- Update Zod schemas

**1.3 Calculation Settings System**

- Settings schema with estimation methods
- Settings store
- Template support

**1.4 Data Migration Infrastructure**

- Version detection
- Migration registry
- Backup manager
- Basic migration wizard UI

**Deliverables**:

- ✅ `componentLibraryStoreV2.ts`
- ✅ Migration scripts
- ✅ Enhanced entity schemas
- ✅ Calculation settings
- ✅ Migration infrastructure

**Risks**:

- Breaking changes to existing code
- Migration complexity

**Mitigation**:

- Feature flags
- Comprehensive testing
- Parallel operation during transition

---

### Phase 2: Parametric Design (Months 4-5)

**2.1 Parametric Update Service**

- Imperative service (not pure functional)
- Dimension change cascading
- Connected entity updates
- Integration with existing validation

**2.2 Connection Graph System**

- ConnectionGraphBuilder with caching
- Graph traversal utilities
- Affected entity detection

**2.3 Validation Store**

- Ephemeral UI state (dashboard, filters)
- Reads from `entity.warnings`
- Aggregation and summary

**2.4 Properties Panel Enhancement**

- Engineering tab with real-time validation
- Tabbed interface (Dimensions, Engineering, Costing)
- Constraint violation display

**Deliverables**:

- ✅ `ParametricUpdateService.ts`
- ✅ `ConnectionGraphBuilder.ts`
- ✅ `validationStore.ts`
- ✅ Enhanced Properties panel

**Risks**:

- Graph performance for large projects
- Parametric update complexity

**Mitigation**:

- Caching and optimization
- Incremental implementation
- Performance monitoring

---

### Phase 3: Intelligent Automation (Months 6-7)

**3.1 Fitting Insertion Service Refactor**

- Junction analysis algorithm
- Fitting selection logic
- T-junction, transition, complex angle support
- User override mechanism

**3.2 Auto-Sizing System**

- Duct sizing based on velocity constraints
- Integration with parametric updates

**3.3 Component Browser Enhancement**

- Unified component tree
- Click-to-activate pattern
- Search and filter

**Deliverables**:

- ✅ Refactored `fittingInsertionService.ts`
- ✅ `autoSizing.ts`
- ✅ Enhanced Component Browser UI

**Risks**:

- Breaking existing auto-fitting
- Complex junction logic errors

**Mitigation**:

- Feature flags
- Extensive testing
- Preserve existing functionality

---

### Phase 4: Advanced BOM & Cost (Months 8-9)

**4.1 Cost Calculation Enhancement**

- Unit cost method (existing)
- Assembly cost method (new)
- Parametric cost method (new)
- Method selection in settings

**4.2 Enhanced BOM UI**

- Real-time updates with debouncing
- Cost breakdown display
- Grouping and filtering

**4.3 Export System**

- PDF, CSV, Excel export
- Customizable templates
- Validation before export

**Deliverables**:

- ✅ Enhanced `costCalculationService.ts`
- ✅ Enhanced `BOMPanel.tsx`
- ✅ Export functions

**Risks**:

- Cost calculation errors
- Performance with real-time updates

**Mitigation**:

- Validation against manual estimates
- Debouncing and incremental updates
- Unit tests

---

### Phase 5: Project Management (Months 10-11)

**5.1 Project Initialization Wizard**

- Multi-step setup
- Template selection
- Settings configuration

**5.2 Validation Dashboard**

- Aggregated validation display
- Navigation to issues
- Filtering and sorting

**5.3 Bulk Operations**

- Bulk edit dialog
- Preview before apply
- Undo support

**5.4 Component Library Management**

- Library management UI
- Import/export
- Custom component creation

**Deliverables**:

- ✅ `ProjectSetupWizard.tsx`
- ✅ `ValidationDashboard.tsx`
- ✅ `BulkEditDialog.tsx`
- ✅ `LibraryManagementView.tsx`

---

### Phase 6: Data Migration & Onboarding (Month 12)

**6.1 Migration Wizard Enhancement**

- Complete migration UI
- Rollback functionality
- Validation reporting

**6.2 Onboarding Tutorial**

- Interactive tutorial
- Sample project
- Contextual help

**Deliverables**:

- ✅ Complete `MigrationWizard.tsx`
- ✅ `InteractiveTutorial.tsx`

---

### Phase 7: Advanced Features (Months 13-14)

**7.1 Undo/Redo Enhancement**

- Parametric change undo
- History tracking

**7.2 Performance Optimization**

- Graph incremental updates
- Worker support (future)
- Memoization

**7.3 Auto-save & Recovery**

- Auto-save integration
- Crash recovery

**Deliverables**:

- ✅ Enhanced history
- ✅ Performance optimizations
- ✅ Auto-save

---

### Phase 8: Testing & Documentation (Month 15)

**8.1 Unit Tests**

- Service tests
- Store tests
- Calculation tests

**8.2 Integration Tests**

- E2E scenarios
- Migration tests

**8.3 Documentation**

- User guide
- API documentation
- Migration guide

**Deliverables**:

- ✅ Test suites (80%+ coverage)
- ✅ Documentation

---

## Risk Assessment

### High-Risk Areas

**1. Component Library Store Replacement**

- **Risk**: Breaking changes affect entire codebase
- **Impact**: High
- **Mitigation**: Feature flags, parallel operation, comprehensive testing

**2. Data Migration**

- **Risk**: Data loss or corruption during migration
- **Impact**: Critical
- **Mitigation**: Comprehensive backup system, validation, rollback UI

**3. Connection Graph Performance**

- **Risk**: Graph building slows down large projects
- **Impact**: Medium
- **Mitigation**: Caching, lazy building, incremental updates

**4. Fitting Insertion Refactor**

- **Risk**: Breaking existing auto-fitting functionality
- **Impact**: Medium
- **Mitigation**: Feature flags, preserve existing behavior, extensive testing

### Medium-Risk Areas

**5. Parametric Update Complexity**

- **Risk**: Cascading updates cause unexpected behavior
- **Impact**: Medium
- **Mitigation**: Clear update rules, validation, undo support

**6. Cost Calculation Methods**

- **Risk**: New methods produce incorrect estimates
- **Impact**: Medium
- **Mitigation**: Validation against manual estimates, unit tests

### Low-Risk Areas

**7. Validation Store**

- **Risk**: Sync issues between entity.warnings and validationStore
- **Impact**: Low
- **Mitigation**: ValidationStore is read-only view, single source of truth

**8. UI Enhancements**

- **Risk**: UI bugs or usability issues
- **Impact**: Low
- **Mitigation**: User testing, iterative refinement

---

## Acceptance Criteria

**Architecture is ready for implementation when**:

- ✅ All 7 critical architectural decisions validated and documented
- ✅ Trade-offs clearly understood and accepted
- ✅ Implementation phases updated to reflect decisions
- ✅ Risk assessment completed
- ✅ File structure and responsibilities defined
- ✅ Migration strategy documented
- ✅ Performance considerations addressed

**Status**: ✅ **READY FOR TICKET BREAKDOWN**

---

## Next Steps

1. **Ticket Breakdown**: Create coarse, actionable tickets for each phase
2. **Phase 1 Planning**: Detailed planning for Foundation phase
3. **Prototype**: Build proof-of-concept for critical components (graph system, parametric updates)
4. **Testing Strategy**: Define test approach for each component

---

## Appendix: Architectural Principles

**Guiding Principles** (validated through stress-testing):

1. **Pragmatism over Purity**: Adapt to existing patterns rather than forcing pure functional approach
2. **Clear Separation**: Persistence (entity.warnings) vs. UI state (validationStore)
3. **Incremental Complexity**: Start simple, add complexity only when justified
4. **Safety First**: Comprehensive migration and backup systems
5. **Performance Awareness**: Caching, debouncing, incremental updates
6. **User Trust**: Never lose user data, always provide rollback
7. **Future Flexibility**: Graph system enables advanced features later

**Trade-off Philosophy**:

- Accept breaking changes when they prevent technical debt
- Accept complexity when it enables critical features
- Accept implementation effort when it ensures user trust
- Reject over-engineering when simpler approaches work

---

## Document History

- **2024-02-11**: Initial Tech Plan created
- **2024-02-11**: Architecture validation completed, 7 critical decisions resolved
- **2024-02-11**: Tech Plan updated with validated decisions and trade-offs
- **Status**: ✅ Validated and ready for implementation

