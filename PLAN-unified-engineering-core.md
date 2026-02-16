# PLAN-unified-engineering-core.md

## Overview
The HVAC Canvas App currently has a foundational architecture with entity management (ducts, equipment, fittings), basic BOM functionality, and canvas-based design tools. The codebase uses Zustand for state management, Radix UI for components, and follows a feature-based structure. However, the spec reveals a need for a comprehensive "Unified Engineering Core" that requires significant architectural enhancements including parametric design, real-time validation, automatic fitting insertion, advanced cost estimation, and a unified component library system.

## Project Type
WEB (Next.js, React, Zustand, Radix UI)

## Success Criteria
- Unified component library system operating as the single source of truth
- Real-time parametric design with constraint validation (velocity, pressure)
- Intelligent automation for fitting insertion and duct sizing
- Advanced BOM with real-time cost estimation and granular breakdown
- Robust project management and data migration capabilities

## Tech Stack
- **Frontend**: Next.js, React, Tailwind CSS, Radix UI
- **State Management**: Zustand (with Immer)
- **Validation**: Zod
- **Export**: jsPDF, ExcelJS (implied for Excel)
- **Persistence**: IndexedDB (via core/persistence)

## File Structure
- `src/core/schema/` - Data models (Zod)
- `src/core/store/` - Zustand stores
- `src/core/services/` - Business logic (calculations, validation)
- `src/features/canvas/components/` - UI components
- `src/features/canvas/tools/` - Canvas interaction tools
- `src/features/export/` - Export logic

## Task Breakdown

### Phase 1: Foundation - Unified Component Library & Core Architecture
- [ ] **1.1 Component Library Data Model**
  - Input: `src/core/schema/component-library.schema.ts`
  - Output: Zod schemas for ComponentDefinition, Category, MaterialSpec
  - Verify: Schemas validate correctly
- [ ] **1.2 Catalog Store Implementation**
  - Input: `src/core/store/catalogStore.ts`
  - Output: Store implementation handling state, search, filtering
  - Verify: Store handles CRUD for components
- [ ] **1.3 Enhanced Entity Schemas**
  - Input: `src/core/schema/duct.schema.ts`, `fitting.schema.ts`, `equipment.schema.ts`
  - Output: Updated schemas with systemType, engineeringData, constraintStatus
  - Verify: Existing entities migrate/validate against new schemas
- [ ] **1.4 Calculation Settings System**
  - Input: `src/core/schema/calculation-settings.schema.ts`, `src/core/store/settingsStore.ts`
  - Output: Settings schema (Labor/Markup); Settings store
  - Verify: Settings can be saved/retrieved and applied
- [ ] **1.5 System Template Data Model**
  - Input: `src/core/schema/system-template.schema.ts`
  - Output: SystemTemplate schema
  - Verify: Templates can be defined and validated

### Phase 2: Parametric Design & Engineering Validation
- [ ] **2.1 Constraint Validation Engine**
  - Input: `src/core/services/constraintValidation.ts`, `src/core/store/validationStore.ts`
  - Output: Validation logic (velocity, pressure); Validation store
  - Verify: Invalid inputs trigger correct validation results/warnings
- [ ] **2.2 Engineering Calculations**
  - Input: `src/core/services/engineeringCalculations.ts`
  - Output: Calculation functions (velocity, pressure drop, friction)
  - Verify: Calculations match standard HVAC formulas
- [ ] **2.3 Parametric Update System**
  - Input: `src/core/services/parametricUpdates.ts`
  - Output: Cascading update logic
  - Verify: Changing duct size updates connected fittings
- [ ] **2.4 Properties Panel Enhancement**
  - Input: `src/features/canvas/components/Inspector/DuctInspector.tsx`, `EngineeringTab.tsx`
  - Output: Tabbed inspector with Dimensions/Engineering/Costing
  - Verify: UI reflects real-time updates and validation status

### Phase 3: Intelligent Automation
- [ ] **3.1 Automatic Fitting Insertion Logic**
  - Input: `src/core/services/fittingGeneration.ts`
  - Output: Auto-fitting logic (junction/transition detection)
  - Verify: Logic correctly identifies needed fittings
- [ ] **3.2 Duct Tool Integration**
  - Input: `src/features/canvas/tools/DuctTool.ts`
  - Output: Updated DuctTool with fitting integration
  - Verify: Drawing intersecting ducts creates appropriate fittings on canvas
- [ ] **3.3 Auto-Sizing System**
  - Input: `src/core/services/autoSizing.ts`
  - Output: Auto-sizing algorithm
  - Verify: Optimizes duct size based on constraints
- [ ] **3.4 Component Browser Enhancement**
  - Input: `src/features/canvas/components/ProductCatalogPanel.tsx`
  - Output: Unified component browser UI
  - Verify: Can browse, filter, and activate components from library

### Phase 4: Advanced BOM & Cost Estimation
- [ ] **4.1 Enhanced BOM Logic**
  - Input: `src/features/canvas/hooks/useBOM.ts`
  - Output: Real-time BOM hook
  - Verify: BOM updates in real-time
- [ ] **4.2 BOM UI Panel**
  - Input: `src/features/canvas/components/BOMPanel.tsx`
  - Output: Advanced BOM panel
  - Verify: Grouping/Filtering works
- [ ] **4.3 Cost Calculation Engine**
  - Input: `src/core/services/costCalculation.ts`
  - Output: Cost calculation logic (Material + Labor + Markup)
  - Verify: Totals match manual calculations
- [ ] **4.4 Export System**
  - Input: `src/features/export/pdf.ts`, `excel.ts`, `csv.ts`
  - Output: Export functions
  - Verify: Generated files contain correct data and formatting

### Phase 5: Project Management & Workflows
- [ ] **5.1 Project Initialization Wizard**
  - Input: `src/components/onboarding/ProjectSetupWizard.tsx`
  - Output: Setup wizard component
  - Verify: Users can create new projects with templates
- [ ] **5.2 Validation Dashboard**
  - Input: `src/features/canvas/components/ValidationDashboard.tsx`
  - Output: Dashboard UI
  - Verify: Issues listed correctly; Navigation to components works
- [ ] **5.3 Bulk Operations**
  - Input: `src/features/canvas/components/BulkEditDialog.tsx`
  - Output: Bulk edit UI and logic
  - Verify: Multiple components updated simultaneously
- [ ] **5.4 Component Library Management**
  - Input: `src/features/library/LibraryManagementView.tsx`
  - Output: Library management UI
  - Verify: Can add/edit/delete library components
- [ ] **5.5 System Template Application**
  - Input: `src/features/canvas/tools/SystemTemplateTool.ts`
  - Output: Template application tool
  - Verify: Applying template updates component properties

### Phase 6: Data Migration & Onboarding
- [ ] **6.1 Legacy Data Migration**
  - Input: `src/features/migration/MigrationWizard.tsx`, `src/core/services/dataMigration.ts`
  - Output: Migration UI and logic
  - Verify: Old project loads and converts to new schema
- [ ] **6.2 Onboarding Tutorial**
  - Input: `src/components/onboarding/InteractiveTutorial.tsx`, `src/stores/useTutorialStore.ts`
  - Output: Tutorial interactive flow
  - Verify: User can complete tutorial steps

### Phase 7: Advanced Features & Polish
- [ ] **7.1 Undo/Redo Enhancement**
  - Input: `src/core/store/historyStore.ts`
  - Output: Enhanced history tracking
  - Verify: Complex parametric changes can be undone
- [ ] **7.2 Performance Optimization**
  - Input: `src/core/services/performanceOptimization.ts`
  - Output: Optimization logic (modes, workers)
  - Verify: UI remains responsive with 1000+ components
- [ ] **7.3 Auto-save & Recovery**
  - Input: `src/core/persistence/autoSave.ts`
  - Output: Auto-save logic
  - Verify: Changes persist after crash/reload

### Phase 8: Testing & Documentation
- [ ] **8.1 Unit Tests**
  - Input: `__tests__` directories for services
  - Output: Test suites
  - Verify: `npm test` passes
- [ ] **8.2 Integration Tests**
  - Input: `e2e/` directory
  - Output: E2E scenarios
  - Verify: Playwright tests pass
- [ ] **8.3 Documentation**
  - Input: `docs/PRD.md`, `CODEBASE.md`
  - Output: Updated documentation
  - Verify: Docs match implementation

## Phase X: Verification Checklist
- [ ] Lint check: `npm run lint`
- [ ] Type check: `npx tsc --noEmit`
- [ ] Security scan: `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .`
- [ ] UX Audit: `python .agent/skills/frontend-design/scripts/ux_audit.py .`
- [ ] Build verification: `npm run build`
- [ ] Runtime verification: `npm run dev`
