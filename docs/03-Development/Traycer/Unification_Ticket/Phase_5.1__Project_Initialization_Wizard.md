# Phase 5.1: Project Initialization Wizard


## Overview

Create multi-step project setup wizard for initializing new projects with settings, templates, and engineering parameters.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 9: Project Initialization and Setup)

## Scope

**In Scope**:
- Multi-step wizard UI (Project Details, Scope & Materials, Calculation Settings, Engineering Parameters)
- Template selection for calculation settings
- Default value population
- Project creation with settings applied
- First-time user welcome tooltip

**Out of Scope**:
- Interactive tutorial (handled in Phase 6.2)
- Project templates (future enhancement)

## Key Files

**Create**:
- `file:hvac-design-app/src/features/project/components/ProjectSetupWizard.tsx`
- `file:hvac-design-app/src/features/project/components/WizardSteps/ProjectDetailsStep.tsx`
- `file:hvac-design-app/src/features/project/components/WizardSteps/ScopeAndMaterialsStep.tsx`
- `file:hvac-design-app/src/features/project/components/WizardSteps/CalculationSettingsStep.tsx`
- `file:hvac-design-app/src/features/project/components/WizardSteps/EngineeringParametersStep.tsx`

**Reference**:
- `file:hvac-design-app/src/core/store/projectStore.ts` (existing)
- `file:hvac-design-app/src/core/store/settingsStore.ts` (from Phase 1.3)

## Acceptance Criteria

- [ ] Wizard shows 4 steps with progress indicator
- [ ] Step 1: Project name (required), location, client, project type, start date
- [ ] Step 2: System types (supply/return/exhaust checkboxes), primary materials
- [ ] Step 3: Load settings template, labor rate, markup, regional multiplier
- [ ] Step 4: Max velocity, target pressure drop, friction factors
- [ ] "Use Defaults" button skips optional steps
- [ ] "Create Project" button creates project with all settings applied
- [ ] Canvas opens with empty design, Component Browser populated
- [ ] Welcome tooltip: "Start by selecting a component from the Component Browser"
- [ ] Error handling: project name required, duplicate name detection
- [ ] Matches flow description from Flow 9

## Dependencies

- **Requires**: Phase 1.3 (calculation settings and templates)
- **Requires**: Phase 3.3 (Component Browser for post-creation experience)

## Technical Notes

**Wizard State Management**:
- Use local state for wizard steps
- Apply all settings atomically on "Create Project"
- Validate each step before allowing next
