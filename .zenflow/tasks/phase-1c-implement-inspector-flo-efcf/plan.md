# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification
<!-- chat-id: f0cdd183-eb12-4a05-b256-9eb6f567b5ac -->

Assess the task's difficulty, as underestimating it leads to poor outcomes.
- easy: Straightforward implementation, trivial bug fix or feature
- medium: Moderate complexity, some edge cases or caveats to consider
- hard: Complex logic, many caveats, architectural considerations, or high-risk changes

Create a technical specification for the task that is appropriate for the complexity level:
- Review the existing codebase architecture and identify reusable components.
- Define the implementation approach based on established patterns in the project.
- Identify all source code files that will be created or modified.
- Define any necessary data model, API, or interface changes.
- Describe verification steps using the project's test and lint commands.

Save the output to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach
- Source code structure changes
- Data model / API / interface changes
- Verification approach

If the task is complex enough, create a detailed implementation plan based on `{@artifacts_path}/spec.md`:
- Break down the work into concrete tasks (incrementable, testable milestones)
- Each task should reference relevant contracts and include verification steps
- Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function).

Important: unit tests must be part of each implementation task, not separate tasks. Each task should implement the code and its tests together, if relevant.

Save to `{@artifacts_path}/plan.md`. If the feature is trivial and doesn't warrant this breakdown, keep the Implementation step below as is.

---

### [ ] Step: Store + Position Validation

- Extend (or create) `inspectorPreferencesStore` persisted state:
  - `isFloating`
  - `floatingPosition`
  - actions: `setFloating`, `setFloatingPosition`, `resetFloatingPosition`
- Add `validateFloatingPosition` utility.
- Add unit tests for store + validator.

Verification:
- `pnpm test`

---

### [ ] Step: FloatingInspector Component

- Add `FloatingInspector` portal-based component.
- Implement drag behavior (native mouse events + rAF), dock button, and a11y attributes.
- Add unit tests for render + drag + dock + resize revalidation behavior.

Verification:
- `pnpm test`

---

### [ ] Step: Dock/Float Integration

- Update `InspectorPanel` to support `showHeader` + `onFloat` and render docked header/Float button.
- Update `RightSidebar` to show Float button when docked, and placeholder when floating.
- Render `FloatingInspector` conditionally from canvas root (e.g. `CanvasContainer`) and ensure initial positioning/validation.
- Update unit tests for `RightSidebar` + `InspectorPanel` as needed.

Verification:
- `pnpm test`
- `pnpm type-check`

---

### [ ] Step: Visual Regression (Playwright)

- Add Playwright visual regression coverage for:
  - docked Float button
  - floating window appearance (shadow/elevation)
  - dragging (before/after screenshots)
  - min/max widths
  - different entity types

Verification:
- `pnpm e2e`

---

### [ ] Step: Documentation + Report

- Add `Inspector/README.md` describing docked vs floating, store shape, validation, and drag strategy.
- After implementation completes, write `{@artifacts_path}/report.md` with summary + verification results.

Verification:
- `pnpm lint`
