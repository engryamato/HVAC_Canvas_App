# Decisions - ARCHITECTURE.md Update

## Date: 2026-02-16

### Decision 1: Mermaid Diagram Subgraphs
**Decision**: Used subgraphs to group Stores and Automation Services
**Rationale**: Improves readability while showing the new architecture components
**Impact**: Diagram now shows Component Library Store, Service Store, and all Automation Services

### Decision 2: Pillar Ordering
**Decision**: Inserted new pillars (6, 7, 8) after Calculation Engine and before Persistence
**Rationale**: 
- Component System logically follows Calculation (entities reference components)
- Service Logic follows Component System (services use component definitions)
- Automation Engine follows Service Logic (automation uses service context)
- Persistence remains last as it's a cross-cutting concern

### Decision 3: Entity Lifecycle Steps
**Decision**: Added Service Assignment and Component Reference as explicit steps
**Rationale**: These are critical architectural concepts that were implicit before
**Impact**: Lifecycle now has 7 steps instead of 5

### Decision 4: Automation Services in Entity Lifecycle
**Decision**: Added Automation Services mention in the Reaction step
**Rationale**: Automation is now a first-class part of the reactive system alongside calculations
