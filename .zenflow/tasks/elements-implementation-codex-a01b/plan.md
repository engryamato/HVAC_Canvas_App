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
<!-- chat-id: 1a11f39b-c909-4063-992d-fac5741b7b03 -->

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

Save to `{@artifacts_path}/plan.md`. If the feature is trivial and doesn't warrant this breakdown, keep the Implementation step below as is.

---

### [x] Step: Write repo plan file
- Create/update `PLAN-elements-workflows.md` in project root with verifiable steps.

### [x] Step: Canvas composition refactor
<!-- chat-id: 7984ea3b-4706-4c42-9ee2-95e7a7e6b39b -->
- Refactor `hvac-design-app/src/components/layout/AppShell.tsx` to global header/menu only.
- Refactor `hvac-design-app/src/features/canvas/CanvasPage.tsx` to use `src/features/canvas/components/*` for toolbar/sidebars/status.
- Resolve duplicate layout-vs-canvas components by converging on canonical implementations.

### [x] Step: File workflows (Web + Tauri)
<!-- chat-id: 238a6f92-de6d-434d-9c8b-33c524525bb9 -->
- Implement New/Open/Save/Save As per docs in `FileMenu`.
- Add Tauri commands for open/save dialogs and file read/write.
- Ensure stores hydrate consistently when opening a file.

### [x] Step: Edit workflows (Undo/Redo + OS clipboard)
<!-- chat-id: 9b6b00e4-e0c5-48a3-861e-ea18763a86f7 -->
- Wire `EditMenu` actions to `historyStore`.
- Implement OS clipboard Cut/Copy/Paste for entities:
  - Web: `navigator.clipboard` (with fallback)
  - Tauri: clipboard commands

### [x] Step: Settings workflows
<!-- chat-id: ff81eaa0-7b4b-4f73-a379-55c7999aa5e6 -->
- Implement real settings toggles + persistence.
- Apply settings to canvas behavior.

### [x] Step: Dialog UX completeness
<!-- chat-id: 151cb9f0-7455-4adb-88a7-0098c30597dc -->
- Ensure Escape handling and focus management for documented dialogs.
- Remove/merge duplicate `KeyboardShortcutsDialog` implementations.

### [ ] Step: Inspector + side panels wiring
<!-- chat-id: 196e530a-f7d2-4564-b51e-5b5800abf5fe -->
- Wire `InspectorPanel`, `CanvasPropertiesInspector`, `ProjectSidebar` into feature `RightSidebar`.
- Implement unit system switching if required by docs.

### [ ] Step: Export workflows (real PDF)
- Replace placeholder PDF export with real binary PDF generation.
- Web: download as Blob.
- Tauri: save bytes to disk.

### [ ] Step: Tests + verification
- Add/adjust Vitest tests for implemented behaviors.
- Add small number of Playwright smoke flows.
- Run: `pnpm type-check`, `pnpm test`, `pnpm e2e`.

### [ ] Step: Report
- Write `{@artifacts_path}/report.md` with what was implemented and how verified.
