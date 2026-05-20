# Epic Brief — HVAC Component Library Completeness & Categorization

# Problem Statement

The current HVAC canvas experience makes component selection and placement harder than it should be. The library is incomplete, browsing does not match engineering domains, and the old separation between component selection and service selection creates unnecessary cognitive load. Users can place standard items, but the product does not yet present a unified engineering catalog that cleanly supports specialty exhaust systems, universal support components, and safe customization workflows.

# Target Users

- **HVAC designers and drafters** working directly on the canvas
- **Power users / standards managers** who customize reusable office components
- **Downstream reviewers** who rely on BOM, validation, and engineering context to interpret placed content

# Current Pain

- The library structure is too flat for the engineering domains users think in
- Users must mentally bridge “what I want to place” and “what system context applies”
- Specialty systems and universal support objects are not surfaced as a coherent library
- Customization flows are not yet explicit enough about identity, behavior, and safety
- Requirements existed in flows and architecture, but not yet as a concise product framing artifact

# Epic Goal

Create a unified engineering catalog experience that lets users:

1. browse placeable HVAC objects by engineering domain
2. click a catalog entry and immediately enter the correct placement flow
3. apply service context without confusing it with the governing engineering system
4. customize components safely through controlled identity choices
5. grow from infrastructure-first delivery into a complete multi-system engineering catalog

# Product Framing

This Epic establishes the product model for a **catalog-driven engineering workspace**:

- **Catalog** is the place for **placeable entries**
- **Manage** is the place for editing, customizing, and organizing component definitions
- **Service context** remains user-visible and selectable
- **Engineering system** remains the governing behavior behind the scenes
- **Specialty routing** should feel consistent with standard routing while still surfacing system-specific cues
- **Customization** should be powerful but controlled

# Phase Framing

| Area | Phase 1 / Now | Later Phases |
| --- | --- | --- |
| Catalog behavior | Unified Catalog/Manage structure | Broader expansion of catalog contents |
| Catalog contents | **Placeable entries only** in Catalog | Potential future surfacing of non-placeable administrative definitions outside the placement-first contract |
| Identity model | Behavior class, category, subtype/archetype, engineering system clearly separated in product behavior | Broader expansion of supported identities and system families |
| Service behavior | Service context selectable and warning shown on conflict with engineering system | More advanced reporting and downstream workflows |
| Customization | Controlled archetype/subtype selection, Clone vs Customize semantics | Broader admin/configuration capabilities |
| Library coverage | Product framing and infrastructure-ready information architecture | Incremental population of full air distribution, specialty exhaust, and universal component libraries |
| Engineering depth | Product behavior and requirements clarified | Progressive rollout of full system-specific engineering calculations |

# In Scope for This Epic

- Unified **Catalog / Manage** product experience
- Hierarchical library browsing by engineering domain
- Placeable-only Catalog behavior
- Clear distinction between `systemType` and `engineeringSystem`
- Warning behavior when service context overrides the normal engineering-system pairing
- Controlled archetype/subtype selection for custom components
- Clear copy semantics for Clone vs Customize
- Product requirements that are cleanly separable from the technical design

# Out of Scope for the Initial Product Slice

- Surfacing non-placeable definitions directly in the Catalog placement grid
- Free-text subtype authoring in the standard customization workflow
- Full population of every library item across every system family in the first implementation slice
- Full engineering rollout for every specialty system in the first implementation slice

# Success Criteria

This Epic is successful when:

1. A user can browse placeable entries through a single Catalog organized by engineering domain
2. Clicking a catalog card immediately activates the expected placement flow
3. Service context can be adjusted independently, and mismatches with the governing engineering system produce a clear warning
4. A user can create or customize a component without relying on free-text subtype identity
5. Clone and Customize behave differently in a way users can easily understand
6. Product requirements and technical design tell one coherent story without forcing product artifacts to explain code internals

# Dependencies and Assumptions

- `systemType` affects service tagging, color, and grouping behavior
- `engineeringSystem` remains governing for validation, calculations, and system-specific interaction behavior
- Manage may contain supporting administrative definitions, but those do not break the Catalog’s placeable-first contract
- Detailed user journeys are captured in `spec:53796a94-d8d9-413d-971d-997461b5bb4f/d948bff0-d701-4808-86e5-a2cac5bce758`
- Technical architecture is captured in `spec:53796a94-d8d9-413d-971d-997461b5bb4f/50508448-82bd-4cd3-9406-fdb8de4b2e1e`