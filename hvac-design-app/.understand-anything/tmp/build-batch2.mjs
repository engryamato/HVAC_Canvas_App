import fs from 'fs';

const ROOT = 'C:/Users/User/Downloads/GitHub/HVAC_Canvas_App/hvac-design-app';
const inp = JSON.parse(fs.readFileSync(`${ROOT}/.understand-anything/tmp/ua-file-analyzer-input-2.json`, 'utf8'));
const bid = inp.batchImportData || {};

const nodes = [];
const edges = [];
const nodeIds = new Set();

function addNode(n) {
  if (nodeIds.has(n.id)) return;
  nodeIds.add(n.id);
  nodes.push(n);
}
function addEdge(e) { edges.push(e); }

function fileNode(path, name, summary, tags, complexity, languageNotes) {
  const n = { id: `file:${path}`, type: 'file', name, filePath: path, summary, tags, complexity };
  if (languageNotes) n.languageNotes = languageNotes;
  addNode(n);
}
function fnNode(path, name, range, summary, tags, complexity) {
  addNode({ id: `function:${path}:${name}`, type: 'function', name, filePath: path, lineRange: range, summary, tags, complexity });
  addEdge({ source: `file:${path}`, target: `function:${path}:${name}`, type: 'contains', direction: 'forward', weight: 1.0 });
}
function clsNode(path, name, range, summary, tags, complexity) {
  addNode({ id: `class:${path}:${name}`, type: 'class', name, filePath: path, lineRange: range, summary, tags, complexity });
  addEdge({ source: `file:${path}`, target: `class:${path}:${name}`, type: 'contains', direction: 'forward', weight: 1.0 });
}
function exportEdge(path, kind, name) {
  addEdge({ source: `file:${path}`, target: `${kind}:${path}:${name}`, type: 'exports', direction: 'forward', weight: 0.8 });
}

// ---- File nodes + significant sub-nodes ----

// 1
fileNode('src/components/canvas/AutoSizingControls.tsx', 'AutoSizingControls.tsx',
  'React control component that requests auto-sizing suggestions for a duct and lets the user apply a recommended size.',
  ['component', 'api-handler', 'ui', 'auto-sizing'], 'moderate');
fnNode('src/components/canvas/AutoSizingControls.tsx', 'AutoSizingControls', [14,131],
  'Renders auto-size button and a list of suggested duct sizes with velocity/pressure metrics, delegating calculation to autoSizingService.',
  ['component', 'event-handler', 'ui'], 'moderate');
exportEdge('src/components/canvas/AutoSizingControls.tsx', 'function', 'AutoSizingControls');

// 2
fileNode('src/components/canvas/BOMPanel.tsx', 'BOMPanel.tsx',
  'Bill-of-materials panel rendering grouped BOM items and a cost-estimate breakdown with delta indicators and export actions.',
  ['component', 'ui', 'bom', 'cost-estimation'], 'moderate');
fnNode('src/components/canvas/BOMPanel.tsx', 'BOMPanel', [20,207],
  'Displays filtered BOM items by category plus a detailed cost breakdown with change deltas and CSV/PDF export buttons.',
  ['component', 'ui', 'bom'], 'moderate');
exportEdge('src/components/canvas/BOMPanel.tsx', 'function', 'BOMPanel');

// 3
fileNode('src/core/schema/calculation-settings.schema.ts', 'calculation-settings.schema.ts',
  'Zod schemas and preset templates for calculation settings: labor rates, markup, waste factors, and engineering limits.',
  ['data-model', 'validation', 'schema-definition', 'settings'], 'complex',
  'Zod schemas with bundled commercial/residential/industrial preset constants.');

// 4
fileNode('src/core/schema/duct.schema.ts', 'duct.schema.ts',
  'Core Zod schema definitions for duct entities, including shapes, props per system type, calculated values, and default props.',
  ['data-model', 'validation', 'schema-definition', 'duct'], 'complex',
  'Discriminated-union duct props schemas per engineering system (standard, boiler flue, grease, generator exhaust).');

// 5
fileNode('src/core/services/automation/autoSizingService.ts', 'autoSizingService.ts',
  'Service that auto-sizes ducts to a target velocity, rounds to standard sizes, batch/network-sizes, and ranks size suggestions.',
  ['service', 'auto-sizing', 'calculation', 'singleton'], 'complex');
clsNode('src/core/services/automation/autoSizingService.ts', 'AutoSizingService', [40,336],
  'Computes duct sizes for a target velocity, snaps to standard round/rectangular increments, and produces ranked size suggestions.',
  ['service', 'calculation', 'auto-sizing'], 'complex');
exportEdge('src/core/services/automation/autoSizingService.ts', 'class', 'AutoSizingService');

// 6
fileNode('src/core/services/bom/bomGenerationService.ts', 'bomGenerationService.ts',
  'Service that generates a bill of materials from entity snapshots, grouping ducts, fittings, and equipment into line items with waste factors.',
  ['service', 'bom', 'serialization', 'singleton'], 'complex');
clsNode('src/core/services/bom/bomGenerationService.ts', 'BOMGenerationService', [65,450],
  'Builds BOM items for ducts (plus insulation), fittings, and equipment, groups duplicates, summarizes materials, and exports to CSV.',
  ['service', 'bom', 'aggregation'], 'complex');
exportEdge('src/core/services/bom/bomGenerationService.ts', 'class', 'BOMGenerationService');

// 7
fileNode('src/core/services/calculations/CalculationEngineRegistry.ts', 'CalculationEngineRegistry.ts',
  'Registry of pluggable calculation engines (sizing, pressure-drop, compliance, load) keyed by engineering system, with dispatch helpers.',
  ['service', 'registry', 'calculation', 'factory'], 'complex',
  'Strategy/registry pattern: one engine class per HVAC system implementing sizing/compliance/load interfaces.');
clsNode('src/core/services/calculations/CalculationEngineRegistry.ts', 'CalculationEngineRegistry', [472,584],
  'Central registry resolving engineering-system engines and dispatching compliance, load, and pressure analyses.',
  ['registry', 'calculation', 'dispatch'], 'complex');
clsNode('src/core/services/calculations/CalculationEngineRegistry.ts', 'StandardDuctEngine', [207,221],
  'Engine bundle for standard ducts exposing sizing and pressure-drop engines.', ['calculation', 'engine'], 'simple');
clsNode('src/core/services/calculations/CalculationEngineRegistry.ts', 'BoilerFlueEngine', [259,273],
  'Engine bundle for boiler-flue ducts with sizing and compliance engines.', ['calculation', 'engine', 'compliance'], 'simple');
clsNode('src/core/services/calculations/CalculationEngineRegistry.ts', 'GreaseDuctEngine', [320,334],
  'Engine bundle for grease ducts with sizing and compliance engines.', ['calculation', 'engine', 'compliance'], 'simple');
clsNode('src/core/services/calculations/CalculationEngineRegistry.ts', 'GeneratorExhaustEngine', [391,410],
  'Engine bundle for generator-exhaust ducts with sizing, pressure-drop, and compliance engines.', ['calculation', 'engine', 'compliance'], 'simple');
clsNode('src/core/services/calculations/CalculationEngineRegistry.ts', 'UniversalEngine', [445,459],
  'Fallback engine bundle exposing load and compliance engines for generic systems.', ['calculation', 'engine'], 'simple');
fnNode('src/core/services/calculations/CalculationEngineRegistry.ts', 'calculateBaseDuctValues', [107,132],
  'Computes shared duct values (area, velocity, equivalent diameter, friction loss) used by multiple engines.',
  ['calculation', 'utility'], 'moderate');
exportEdge('src/core/services/calculations/CalculationEngineRegistry.ts', 'class', 'CalculationEngineRegistry');

// 8
fileNode('src/core/services/calculations/PressurePropagationService.ts', 'PressurePropagationService.ts',
  'Service that propagates pressure values across a connection graph via breadth-first traversal of affected entities.',
  ['service', 'calculation', 'graph', 'pressure'], 'moderate');
clsNode('src/core/services/calculations/PressurePropagationService.ts', 'PressurePropagationService', [13,76],
  'Walks the connection graph from affected nodes, accumulating pressure loss through ducts and fittings.',
  ['service', 'graph-traversal', 'calculation'], 'moderate');
fnNode('src/core/services/calculations/PressurePropagationService.ts', 'calculateNodePressure', [82,122],
  'Computes pressure at a node from the previous node by applying duct friction or fitting loss.',
  ['calculation', 'pressure'], 'moderate');
exportEdge('src/core/services/calculations/PressurePropagationService.ts', 'class', 'PressurePropagationService');

// 9
fileNode('src/core/services/calculations/engineeringCalculator.ts', 'engineeringCalculator.ts',
  'Core HVAC engineering calculator computing duct area, velocity, equivalent diameter, friction, pressure drop, and auto-sizing.',
  ['service', 'calculation', 'engineering', 'singleton'], 'complex');
clsNode('src/core/services/calculations/engineeringCalculator.ts', 'EngineeringCalculator', [37,278],
  'Implements fundamental duct physics calculations including pressure drop, Reynolds number, and target-velocity sizing.',
  ['calculation', 'engineering', 'physics'], 'complex');
exportEdge('src/core/services/calculations/engineeringCalculator.ts', 'class', 'EngineeringCalculator');

// 10
fileNode('src/core/services/calculations/entityCalculationRuntime.ts', 'entityCalculationRuntime.ts',
  'Runtime that dispatches duct, fitting, and equipment calculations through the engine registry and collects compliance warnings.',
  ['service', 'calculation', 'runtime', 'dispatch'], 'complex');
fnNode('src/core/services/calculations/entityCalculationRuntime.ts', 'calculateDuctRuntime', [243,267],
  'Resolves the engine for a duct, runs sizing/pressure calculations, and gathers compliance warnings.',
  ['calculation', 'dispatch'], 'moderate');
fnNode('src/core/services/calculations/entityCalculationRuntime.ts', 'calculateFittingRuntime', [269,300],
  'Builds a fitting context duct and computes equivalent-length pressure loss with compliance checks.',
  ['calculation', 'dispatch'], 'moderate');
fnNode('src/core/services/calculations/entityCalculationRuntime.ts', 'calculateEquipmentRuntime', [302,342],
  'Builds an equipment context duct and computes load/compliance results via the engine registry.',
  ['calculation', 'dispatch'], 'moderate');
fnNode('src/core/services/calculations/entityCalculationRuntime.ts', 'buildEquipmentContextDuct', [212,241],
  'Derives a synthetic duct from equipment to feed downstream duct-based calculations.',
  ['calculation', 'adapter'], 'moderate');
fnNode('src/core/services/calculations/entityCalculationRuntime.ts', 'buildFittingContextDuct', [141,174],
  'Derives a representative duct context from a fitting and its connected ducts.',
  ['calculation', 'adapter'], 'moderate');
fnNode('src/core/services/calculations/entityCalculationRuntime.ts', 'buildSyntheticEquipmentDuct', [182,210],
  'Constructs a synthetic duct sized from equipment airflow for generic calculations.',
  ['calculation', 'adapter'], 'moderate');
exportEdge('src/core/services/calculations/entityCalculationRuntime.ts', 'function', 'calculateDuctRuntime');
exportEdge('src/core/services/calculations/entityCalculationRuntime.ts', 'function', 'calculateFittingRuntime');
exportEdge('src/core/services/calculations/entityCalculationRuntime.ts', 'function', 'calculateEquipmentRuntime');

// 11
fileNode('src/core/services/constraintValidation.ts', 'constraintValidation.ts',
  'Service validating duct entities against engineering limits and producing severity-ranked constraint statuses.',
  ['service', 'validation', 'constraints'], 'complex');
clsNode('src/core/services/constraintValidation.ts', 'ConstraintValidationService', [64,217],
  'Validates ducts against velocity/pressure limits, classifying exceedances by severity.',
  ['service', 'validation', 'constraints'], 'complex');
exportEdge('src/core/services/constraintValidation.ts', 'class', 'ConstraintValidationService');

// 12
fileNode('src/core/services/cost/costCalculationService.ts', 'costCalculationService.ts',
  'Service computing cost estimates from a BOM, applying labor rates, markup, overhead, and tax with breakdown deltas.',
  ['service', 'cost-estimation', 'calculation', 'singleton'], 'complex');
clsNode('src/core/services/cost/costCalculationService.ts', 'CostCalculationService', [88,539],
  'Calculates material, labor, markup, overhead, and tax costs from BOM items and produces a full cost breakdown.',
  ['service', 'cost-estimation', 'calculation'], 'complex');
exportEdge('src/core/services/cost/costCalculationService.ts', 'class', 'CostCalculationService');

// 13
fileNode('src/core/services/engineeringCalculations.ts', 'engineeringCalculations.ts',
  'Standalone HVAC engineering helper functions for equivalent diameter, velocity, friction, pressure drop, and duct-size suggestion.',
  ['utility', 'calculation', 'engineering'], 'moderate');
fnNode('src/core/services/engineeringCalculations.ts', 'calculatePressureDrop', [71,88],
  'Computes duct pressure drop from velocity, friction factor, and length.', ['calculation', 'utility'], 'simple');
fnNode('src/core/services/engineeringCalculations.ts', 'suggestDuctSize', [90,106],
  'Suggests a duct size to meet a target velocity for the given airflow.', ['calculation', 'utility'], 'simple');
exportEdge('src/core/services/engineeringCalculations.ts', 'function', 'calculatePressureDrop');
exportEdge('src/core/services/engineeringCalculations.ts', 'function', 'suggestDuctSize');

// 14
fileNode('src/core/services/export/bomExportService.ts', 'bomExportService.ts',
  'Service that formats BOM and cost data into structured rows for downstream CSV/Excel/PDF export.',
  ['service', 'export', 'serialization', 'singleton'], 'moderate');
clsNode('src/core/services/export/bomExportService.ts', 'BOMExportService', [34,201],
  'Transforms BOM items and cost estimates into export-ready row structures.',
  ['service', 'export', 'serialization'], 'complex');
exportEdge('src/core/services/export/bomExportService.ts', 'class', 'BOMExportService');

// 15
fileNode('src/core/services/export/excelGenerator.ts', 'excelGenerator.ts',
  'Service that generates an Excel workbook of BOM and cost data using the export service rows.',
  ['service', 'export', 'serialization', 'singleton'], 'moderate');
clsNode('src/core/services/export/excelGenerator.ts', 'ExcelGenerator', [33,218],
  'Builds multi-sheet Excel output from formatted BOM and cost rows.',
  ['service', 'export', 'excel'], 'complex');
exportEdge('src/core/services/export/excelGenerator.ts', 'class', 'ExcelGenerator');

// 16
fileNode('src/core/services/export/pdfGenerator.ts', 'pdfGenerator.ts',
  'Service that renders BOM and cost-estimate data into a formatted PDF document.',
  ['service', 'export', 'serialization', 'singleton'], 'moderate');
clsNode('src/core/services/export/pdfGenerator.ts', 'PDFGenerator', [20,153],
  'Generates a PDF report from BOM items and cost breakdowns.',
  ['service', 'export', 'pdf'], 'moderate');
exportEdge('src/core/services/export/pdfGenerator.ts', 'class', 'PDFGenerator');

// 17
fileNode('src/core/services/operations/bulkOperationsService.ts', 'bulkOperationsService.ts',
  'Service performing bulk edits across multiple entities (resize, re-material, auto-size) with undo command integration.',
  ['service', 'bulk-operations', 'command', 'singleton'], 'complex');
clsNode('src/core/services/operations/bulkOperationsService.ts', 'BulkOperationsService', [31,580],
  'Applies batched mutations across selected entities, producing reversible commands and revalidated results.',
  ['service', 'bulk-operations', 'command'], 'complex');
exportEdge('src/core/services/operations/bulkOperationsService.ts', 'class', 'BulkOperationsService');

// 18
fileNode('src/core/services/parametric/parametricUpdateService.ts', 'parametricUpdateService.ts',
  'Service that recomputes duct/fitting calculations parametrically when properties change, propagating constraint validation.',
  ['service', 'calculation', 'parametric', 'singleton'], 'complex');
clsNode('src/core/services/parametric/parametricUpdateService.ts', 'ParametricUpdateService', [41,454],
  'Recalculates engineering values and constraints when duct parameters change, including auto-sizing to velocity.',
  ['service', 'parametric', 'calculation'], 'complex');
exportEdge('src/core/services/parametric/parametricUpdateService.ts', 'class', 'ParametricUpdateService');

// 19
fileNode('src/core/services/validation/constraintValidator.ts', 'constraintValidator.ts',
  'Validation module with duct/equipment validators and deterministic fix suggestions against engineering limits.',
  ['service', 'validation', 'constraints', 'suggestions'], 'complex');
clsNode('src/core/services/validation/constraintValidator.ts', 'DuctValidator', [159,332],
  'Validates a duct against velocity/pressure/aspect limits and emits violations with severity.',
  ['validation', 'constraints', 'duct'], 'complex');
clsNode('src/core/services/validation/constraintValidator.ts', 'EquipmentValidator', [337,402],
  'Validates equipment entities against engineering constraints.',
  ['validation', 'constraints', 'equipment'], 'moderate');
fnNode('src/core/services/validation/constraintValidator.ts', 'generateDeterministicSuggestions', [109,154],
  'Generates deterministic remediation suggestions (e.g. airflow/size adjustments) for constraint violations.',
  ['validation', 'suggestions'], 'moderate');
fnNode('src/core/services/validation/constraintValidator.ts', 'validateDuctConstraints', [410,416],
  'Convenience entry point running the duct validator against a duct entity.',
  ['validation', 'utility'], 'simple');
exportEdge('src/core/services/validation/constraintValidator.ts', 'class', 'DuctValidator');
exportEdge('src/core/services/validation/constraintValidator.ts', 'class', 'EquipmentValidator');
exportEdge('src/core/services/validation/constraintValidator.ts', 'function', 'generateDeterministicSuggestions');
exportEdge('src/core/services/validation/constraintValidator.ts', 'function', 'validateDuctConstraints');

// 20
fileNode('src/core/store/calculationSettingsStore.ts', 'calculationSettingsStore.ts',
  'Zustand store exposing calculation settings derived from the settings store for calculation consumers.',
  ['service', 'state-management', 'store', 'settings'], 'moderate',
  'Zustand store providing a stable settings snapshot for memoized calculations.');
exportEdge('src/core/store/calculationSettingsStore.ts', 'function', 'useCalculationSettingsStore');

// 21
fileNode('src/core/store/settingsStore.ts', 'settingsStore.ts',
  'Central Zustand settings store managing calculation settings, templates, and recalculated constraint statuses.',
  ['service', 'state-management', 'store', 'settings'], 'complex',
  'Zustand store with derived constraint-status recomputation and custom-state tracking.');
fnNode('src/core/store/settingsStore.ts', 'recalculateConstraintStatuses', [145,198],
  'Recomputes constraint statuses for all entities when engineering limits change.',
  ['state-management', 'calculation'], 'moderate');
exportEdge('src/core/store/settingsStore.ts', 'function', 'useSettingsStore');

// 22
fileNode('src/features/canvas/calculators/ductSizing.ts', 'ductSizing.ts',
  'Pure duct-sizing math helpers: cross-section area, velocity, round-diameter sizing, and equivalent diameter.',
  ['utility', 'calculation', 'duct-sizing'], 'moderate');
fnNode('src/features/canvas/calculators/ductSizing.ts', 'calculateDuctArea', [8,22],
  'Computes duct cross-sectional area for round or rectangular shapes.', ['calculation', 'utility'], 'simple');
fnNode('src/features/canvas/calculators/ductSizing.ts', 'calculateRoundDuctDiameter', [40,48],
  'Computes a round duct diameter from required area.', ['calculation', 'utility'], 'simple');
exportEdge('src/features/canvas/calculators/ductSizing.ts', 'function', 'calculateDuctArea');
exportEdge('src/features/canvas/calculators/ductSizing.ts', 'function', 'calculateRoundDuctDiameter');

// 23
fileNode('src/features/canvas/calculators/pressureDrop.ts', 'pressureDrop.ts',
  'Pure pressure-drop math helpers: velocity pressure, friction loss, fitting loss, and equivalent diameter.',
  ['utility', 'calculation', 'pressure'], 'moderate');
fnNode('src/features/canvas/calculators/pressureDrop.ts', 'calculateFrictionLoss', [18,36],
  'Computes friction loss for a duct segment from velocity, diameter, and length.', ['calculation', 'utility'], 'simple');
exportEdge('src/features/canvas/calculators/pressureDrop.ts', 'function', 'calculateFrictionLoss');

// 24
fileNode('src/features/canvas/components/BOMPanel.tsx', 'BOMPanel.tsx',
  'Canvas feature BOM panel wiring the useBOM hook to a categorized item list, cost breakdown, highlighting, and CSV export.',
  ['component', 'ui', 'bom', 'cost-estimation'], 'complex');
fnNode('src/features/canvas/components/BOMPanel.tsx', 'BOMPanel', [70,450],
  'Feature-level BOM panel rendering grouped items, cost breakdown, and export controls with entity highlighting.',
  ['component', 'ui', 'bom'], 'complex');
exportEdge('src/features/canvas/components/BOMPanel.tsx', 'function', 'BOMPanel');

// 25
fileNode('src/features/canvas/components/BOMPanel/index.tsx', 'index.tsx',
  'Lightweight BOM panel entry component that renders BOM data via the generation service.',
  ['component', 'ui', 'bom', 'entry-point'], 'moderate');
fnNode('src/features/canvas/components/BOMPanel/index.tsx', 'BOMPanel', [12,77],
  'Renders a compact BOM list using the BOM generation service.', ['component', 'ui', 'bom'], 'moderate');
exportEdge('src/features/canvas/components/BOMPanel/index.tsx', 'function', 'BOMPanel');

// 26
fileNode('src/features/canvas/components/Inspector/DuctInspector.tsx', 'DuctInspector.tsx',
  'Large inspector panel for editing duct properties with live validation, auto-sizing, BOM/cost preview, and parametric updates.',
  ['component', 'ui', 'inspector', 'duct'], 'complex',
  'Extensive React inspector composing validation, auto-sizing, parametric updates, and cost/BOM previews.');
fnNode('src/features/canvas/components/Inspector/DuctInspector.tsx', 'DuctInspector', [176,782],
  'Renders editable duct fields, applies parametric updates with validation, and surfaces auto-sizing and cost data.',
  ['component', 'inspector', 'duct'], 'complex');
fnNode('src/features/canvas/components/Inspector/DuctInspector.tsx', 'getFallbackComponentDefinitionId', [130,172],
  'Resolves a fallback component-library definition id for a duct when none is set.',
  ['utility', 'inspector'], 'moderate');
exportEdge('src/features/canvas/components/Inspector/DuctInspector.tsx', 'function', 'DuctInspector');

// 27
fileNode('src/features/canvas/components/RightSidebar.tsx', 'RightSidebar.tsx',
  'Right sidebar container that switches between inspector, calculations, BOM, and validation tabs based on layout state.',
  ['component', 'ui', 'layout', 'sidebar'], 'complex');
fnNode('src/features/canvas/components/RightSidebar.tsx', 'RightSidebar', [29,241],
  'Renders the active right-panel tab (inspector/calculations/BOM/validation) driven by layout store state.',
  ['component', 'ui', 'layout'], 'complex');
exportEdge('src/features/canvas/components/RightSidebar.tsx', 'function', 'RightSidebar');

// 28
fileNode('src/features/canvas/entities/ductDefaults.ts', 'ductDefaults.ts',
  'Factory helpers creating new duct entities with default props, sequential numbering, and computed engineering values.',
  ['factory', 'duct', 'entity', 'calculation'], 'moderate');
fnNode('src/features/canvas/entities/ductDefaults.ts', 'createDuct', [32,100],
  'Creates a new duct entity with defaults, numbering, and initial calculated values.', ['factory', 'entity'], 'moderate');
fnNode('src/features/canvas/entities/ductDefaults.ts', 'calculateDuctValues', [102,138],
  'Computes initial area, velocity, and pressure values for a newly created duct.', ['calculation', 'factory'], 'moderate');
exportEdge('src/features/canvas/entities/ductDefaults.ts', 'function', 'createDuct');

// 29
fileNode('src/features/canvas/hooks/useBOM.ts', 'useBOM.ts',
  'React hook that derives BOM and cost-estimate data from the entity store, recomputing on entity changes.',
  ['hook', 'bom', 'cost-estimation', 'state-management'], 'complex');
fnNode('src/features/canvas/hooks/useBOM.ts', 'useBOM', [46,243],
  'Computes memoized BOM, cost estimate, and delta data from current entities and settings.',
  ['hook', 'bom'], 'complex');
exportEdge('src/features/canvas/hooks/useBOM.ts', 'function', 'useBOM');

// 30
fileNode('src/features/canvas/hooks/useCalculations.ts', 'useCalculations.ts',
  'React hook orchestrating live engineering calculations for ducts, fittings, and equipment, syncing results into the entity store.',
  ['hook', 'calculation', 'state-management', 'engineering'], 'complex');
fnNode('src/features/canvas/hooks/useCalculations.ts', 'useCalculations', [29,82],
  'Wires entity changes to engine-dispatched recalculation and writes engineering data back to the store.',
  ['hook', 'calculation'], 'complex');
fnNode('src/features/canvas/hooks/useCalculations.ts', 'syncDuctCalculation', [88,127],
  'Recomputes and persists engineering data and constraint status for a duct.', ['calculation', 'sync'], 'moderate');
fnNode('src/features/canvas/hooks/useCalculations.ts', 'syncEquipmentCalculation', [162,200],
  'Recomputes and persists engineering data for equipment.', ['calculation', 'sync'], 'moderate');
exportEdge('src/features/canvas/hooks/useCalculations.ts', 'function', 'useCalculations');

// 31
fileNode('src/features/canvas/store/bomHighlightStore.ts', 'bomHighlightStore.ts',
  'Tiny Zustand store tracking which BOM item or entity is currently highlighted in the UI.',
  ['service', 'state-management', 'store', 'bom'], 'simple');
exportEdge('src/features/canvas/store/bomHighlightStore.ts', 'function', 'useBomHighlightStore');

// ---- Import edges (1:1 from batchImportData) ----
for (const [src, targets] of Object.entries(bid)) {
  for (const t of targets) {
    addEdge({ source: `file:${src}`, target: `file:${t}`, type: 'imports', direction: 'forward', weight: 0.7 });
  }
}

// ---- Partition ----
const filePaths = inp.batchFiles.map(f => f.path).sort();
const nodeCount = nodes.length;
const edgeCount = edges.length;
const parts = Math.max(1, Math.ceil(Math.max(nodeCount / 60, edgeCount / 120)));
console.log('nodes=' + nodeCount + ' edges=' + edgeCount + ' parts=' + parts);

function pathOfNode(n) { return n.filePath; }
const chunkSize = Math.ceil(filePaths.length / parts);
const groups = [];
for (let i = 0; i < parts; i++) groups.push(new Set(filePaths.slice(i * chunkSize, (i + 1) * chunkSize)));

const outDir = `${ROOT}/.understand-anything/intermediate`;
for (let i = 0; i < parts; i++) {
  const g = groups[i];
  const pnodes = nodes.filter(n => g.has(pathOfNode(n)));
  const pNodeIds = new Set(pnodes.map(n => n.id));
  const pedges = edges.filter(e => pNodeIds.has(e.source));
  const fname = parts === 1 ? `batch-2.json` : `batch-2-part-${i + 1}.json`;
  fs.writeFileSync(`${outDir}/${fname}`, JSON.stringify({ nodes: pnodes, edges: pedges }, null, 2));
  console.log(`${fname}: nodes=${pnodes.length} edges=${pedges.length}`);
}
