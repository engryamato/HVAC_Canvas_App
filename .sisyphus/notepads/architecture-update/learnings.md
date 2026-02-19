# Learnings - ARCHITECTURE.md Update

## Date: 2026-02-16
## Task: Update ARCHITECTURE.md to document Component Library, Service System, and Automation features

### Key Patterns Observed

1. **Documentation Consistency**: The ARCHITECTURE.md follows a specific pattern:
   - High-level Mermaid diagram showing data flow
   - Numbered pillars describing core architectural concepts
   - Entity lifecycle steps
   - All elements link to detailed docs in `elements/` directory

2. **Mermaid Diagram Structure**:
   - Uses subgraphs to group related components
   - Dotted lines (.-.) for reactive/background processes
   - Solid lines for primary data flow
   - Clear labels for all nodes

3. **Pillar Documentation Pattern**:
   - Each pillar has a clear title with descriptive subtitle in parentheses
   - 2-3 bullet points explaining key concepts
   - Links to relevant store/hook documentation
   - Technical terms in **bold**

### Component Library Integration

- Store: `componentLibraryStoreV2` (persisted to localStorage)
- Key concept: UnifiedComponentDefinition combines catalog, pricing, and engineering data
- Integration: Entities reference components via `catalogItemId`

### Service System Integration

- Store: `serviceStore` (persisted to project file)
- Key concept: Services define engineering context (Supply/Return/Exhaust)
- Integration: Entities have `serviceId`, inherit from connected entities
- Visual: Color-coding on canvas

### Automation Services

- Reactive updates (debounced 300ms)
- Five services: Auto-Sizing, Fitting Insertion, Bulk Operations, Validation, Parametric Updates
- Full undo support for all operations
- Silent updates with brief visual highlights (0.5s)
