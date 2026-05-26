# Inspector Panel — Implementation Guide

**Reference file:** `InspectorPanel.jsx`
**Status:** UI complete, data layer not yet wired
**Scope of this document:** Full hydration of every displayed value, action wiring, test coverage, and a list of remaining gaps that must be resolved before this component ships.

---

## 0. Critical Prerequisite — Read This First

Every value currently rendered inside `InspectorPanel.jsx` comes from a single constant called `MOCK_DATA` at the top of the file. **This object must not remain in the production component.** It exists solely to demonstrate the shape of data the component expects and the visual design intent. The object and the constant name `MOCK_DATA` must be fully removed and replaced with live data from the application's stores and services as described in this document.

Do not change the visual structure, layout, spacing, color classes, or component hierarchy of the UI unless there is a technical reason that makes it strictly necessary. The design is intentional and has been reviewed. Any deviation from the rendered output must be flagged before merging.

---

## 1. Component Integration

### 1.1 Placement

`InspectorPanel` is the **no-selection state** of the right sidebar inspector. It renders when no canvas element is currently selected. The component that owns the sidebar is responsible for rendering `InspectorPanel` when the canvas selection is empty.

The component must not be rendered in any other selection state. When a duct segment, fitting, equipment item, or room is selected, a separate context-specific inspector (not yet built) will replace it. The sidebar owner must switch between these two renderers based on selection state.

### 1.2 Sizing

The component uses `w-full` and `height: 100%`. It will fill whatever container the sidebar gives it. Do not wrap it in a fixed-width container. The sidebar itself controls the width. The component will adjust automatically. Do not add `max-w`, `min-w`, or any fixed pixel width inside this component.

### 1.3 Props Interface

Define a single `props` interface for the component. The component currently accepts no props and reads from `MOCK_DATA` internally. This must change. The component must accept all of the following as props or via store hooks, as described in sections 2 through 7.

---

## 2. Data Contracts by Section

Each section below lists the exact fields currently rendered, where that data must come from in the real application, and what the expected type is. Replace each corresponding field inside `MOCK_DATA` with a live read from the source indicated.

### 2.1 Project Section

This section renders project-level metadata. All fields come from the project metadata store.

| Field displayed | Source | Expected type |
|---|---|---|
| Project Name | Project metadata store | `string` |
| Description | Project metadata store | `string` |
| Project Number | Project metadata store | `string` |
| Client | Project metadata store | `string` |
| Engineer | Project metadata store | `string` |
| Created | Project metadata store | `string` — formatted date |
| Modified | Project metadata store — timestamp of the last canvas write operation | `string` — formatted date and time |
| Version | Project metadata store | `string` |
| Author | Project metadata store | `string` |

The `Modified` field must reflect the actual last-saved or last-modified timestamp of the project, not a static string. If the application does not yet track this timestamp, that gap must be noted in section 9 of this document and tracked as a separate task.

### 2.2 Engineering Section

This section renders engineering standards and calculation settings. All fields come from the engineering settings store or the calculation configuration.

| Field displayed | Source | Expected type |
|---|---|---|
| Design Standard (collapsed summary `shortStandard`) | Engineering settings store | `string` — short label (e.g. `"SMACNA"`) |
| Design Standard (full label inside the section) | Engineering settings store | `string` — full name |
| Airflow Units | Units settings | `string` — e.g. `"CFM"` or `"L/s"` |
| Pressure Units | Units settings | `string` — e.g. `"in. w.g."` or `"Pa"` |
| Temperature Units | Units settings | `string` — e.g. `"°F"` or `"°C"` |
| Safety Factors | Calculation settings | `string` — human-readable description of the active safety factor profile |
| Auto Calculate (toggle state) | Calculation settings store | `boolean` |

The **Auto Calculate toggle** is interactive. When the user clicks it, the new boolean value must be written back to the calculation settings store immediately. The toggle must reflect the true live state from the store, not local component state only. Local state (`useState`) is acceptable for optimistic UI, but it must stay in sync with the store. If the store write fails, the toggle must revert.

The **"Edit Engineering Settings" button** must open the engineering settings panel or modal that already exists in the application. Do not leave this button as a no-op. Wire it to the appropriate open action before marking this section complete.

### 2.3 Model Health Section

This section renders the output of the model validation engine. All values come from the validator service or the validation results store.

| Field displayed | Source | Expected type |
|---|---|---|
| Issue count (header badge) | Validation results — sum of all `count` values across non-`ok` items | `number` |
| Unconnected Segments — count | Validation results | `number` |
| Invalid Transitions — count | Validation results | `number` |
| Geometry Clean — status | Validation results | `"ok"` \| `"error"` \| `"warning"` |
| No Cycles — status | Validation results | `"ok"` \| `"error"` \| `"warning"` |
| Missing Equipment — count | Validation results | `number` |

Each validation item in the rendered list has a `status` field of `"error"`, `"warning"`, or `"ok"`, a `label` string, and an optional `count` number. Do not hardcode these items. They must be driven entirely by the validation results. If the validator produces different check types in the future, the list must expand automatically without code changes to the component.

**"Locate" button (per issue row):** When clicked, the canvas must focus on and highlight all elements of the type associated with that issue. For example, clicking "Locate" next to "Unconnected Segments" must select all unconnected segments on the canvas. Wire this button to the canvas selection service, passing the issue type as the selection filter.

**"Select All Invalid" button:** Must select every element across all failing checks simultaneously on the canvas.

**"Auto-Fix Geometry" button:** Must trigger the geometry auto-fix action in the model repair service. This action should not run silently — the user must receive feedback (toast, status update, or re-validation result) indicating the action ran and what it changed.

**Health banner in the panel header:** The amber banner showing the total issue count is always visible when issues exist, regardless of which section is expanded. It is derived from the same validation results as the Model Health section. When clicked, it must expand the Model Health section (set that section's key to `true` in `openSections`) and scroll it into view. The green "All checks passed" banner must appear only when every validation item has `status: "ok"`. Do not show the green banner if any item has an indeterminate or loading state.

### 2.4 Systems Section

This section renders one block per duct system in the project. The list is dynamic — it must render exactly the systems that exist in the project, neither more nor fewer. Do not hardcode four system blocks. If a project has two systems, two blocks must render. If it has six, six must render.

Each system block renders the following fields:

| Field displayed | Source | Expected type |
|---|---|---|
| System name | System registry | `string` |
| Colored dot (system type color) | Derived from system name or system type enum — see color config in the JSX | Visual only — no data change needed |
| Status badge (Balanced / Unbalanced / Not Calculated) | Calculation engine results for that system | `"balanced"` \| `"unbalanced"` \| `"not_calculated"` |
| Segment Count | Computed from segments assigned to this system | `number` |
| Length | Computed — sum of all segment lengths in this system | `number`, rendered as `"{value} ft"` |
| Surface Area | Computed — sum of all segment surface areas in this system | `number`, rendered as `"{value} ft²"` |
| Design Flow | Calculation engine — total design airflow for this system | `number`, rendered as `"{value} CFM"` |
| Pressure Loss | Calculation engine — total system pressure loss | `number`, rendered as `"{value} in. w.g."` |

The collapsed section summary line shows the number of systems, total combined duct length across all systems, and total combined airflow in thousands (e.g. `"4 systems · 1,044 ft · 9.5k CFM"`). These three values must all be computed from live data.

If Auto Calculate is off or calculation results are not yet available for a system, its status must render as `"not_calculated"`. Design Flow and Pressure Loss fields for that system must render as `"—"` rather than `0` or an empty string.

### 2.5 Elements Section

This section renders an inventory count of every element type on the canvas, split into two groups: Inventory (by functional category) and Breakdown (by geometry/fitting type).

| Field displayed | Source | Expected type |
|---|---|---|
| Ducts | Element registry — count of all duct segments | `number` |
| Fittings | Element registry — count of all fittings | `number` |
| Equipment | Element registry — count of all equipment items | `number` |
| Rooms | Element registry — count of all rooms | `number` |
| Rectangular | Element registry — count of rectangular duct segments | `number` |
| Round | Element registry — count of round duct segments | `number` |
| Flex | Element registry — count of flex duct segments | `number` |
| Elbows | Element registry — count of elbow fittings | `number` |
| Tees | Element registry — count of tee fittings | `number` |
| Reducers | Element registry — count of reducer fittings | `number` |

The collapsed section summary shows total object count and total duct count. Both must be derived from the same live element registry.

**Each row is a button.** When clicked, it must select all elements of that type on the canvas. For example, clicking the "Elbows" row must select all elbow fittings currently placed on the canvas. Wire the `onClick` handler of each row to the canvas selection service with the appropriate element type filter.

If a category has zero elements, its row must still render showing `0`. Do not hide zero-count rows. This ensures the developer and user are aware the category exists but is empty.

### 2.6 Recent Activity Section

This section renders the last N actions the user performed on the canvas. All data comes from the history / activity log store.

| Field displayed | Source | Expected type |
|---|---|---|
| Action chip (Added / Moved / Deleted / Modified) | History store — action type | `string` — one of the four action types; see color config in the JSX |
| Element type label | History store — type of the affected element | `string` |
| Target label | History store — human-readable identifier of the specific element affected | `string` |
| Time | History store — timestamp of the action, formatted as relative time (e.g. `"2 min ago"`) | `string` — relative-formatted timestamp, not a raw ISO string |

The list must show the most recent entries first. The number of entries to display (currently four in the mock data) must be a configurable constant, not hardcoded. Recommended default is 10.

If the history store is empty (a brand-new project), this section must display a short empty state message such as `"No changes yet."` in place of the list. Do not render an empty section body.

**Undo button:** Must call the undo action from the history store. The button must be disabled when there is nothing to undo.

**Redo button:** Must call the redo action from the history store. The button must be disabled when there is nothing to redo.

Both buttons must visually reflect their disabled state — use reduced opacity and a `not-allowed` cursor. Do not remove the buttons from the DOM when disabled; only disable the interaction.

---

## 3. Section Accordion State

The `openSections` state object that controls which sections are expanded is defined at the root of `InspectorPanel`. All sections are collapsed by default when the panel first renders. This is intentional and must not be changed.

The open/close state must persist across minor re-renders caused by data updates. Because `openSections` lives in the root component, it will not reset when child data changes as long as the root component itself does not remount. If the sidebar container unmounts and remounts `InspectorPanel` on every canvas interaction, section state will reset each time. That is a bug — the sidebar container must keep `InspectorPanel` mounted persistently rather than conditionally remounting it. If this cannot be guaranteed by the sidebar container, `openSections` state must be lifted to the sidebar-level store.

---

## 4. Derived Values

The following values are computed from raw data and must be recalculated reactively whenever their inputs change. They must not be computed once on mount and cached indefinitely.

| Derived value | Inputs | Used in |
|---|---|---|
| `issueCount` | Sum of `count` (or `1` if no count) across all health items where `status !== "ok"` | Header banner, Model Health section summary |
| `totalLength` | Sum of `totalLength` across all systems | Systems section summary |
| `totalAirflow` | Sum of `designAirflow` across all systems | Systems section summary |
| Total objects | Sum of all inventory category counts | Elements section summary |

---

## 5. TypeScript Interfaces

Before wiring any store, define the following TypeScript interfaces. The component must be refactored to be fully typed. Remove all implicit `any` types.

Define interfaces for:

- `ProjectMetadata` — all fields shown in the Project section
- `EngineeringSettings` — all fields shown in the Engineering section plus `autoCalculate: boolean`
- `HealthItem` — `id: string`, `status: "ok" | "error" | "warning"`, `label: string`, `count?: number`
- `DuctSystem` — all fields shown per system block including `status: "balanced" | "unbalanced" | "not_calculated"`
- `ElementInventory` — the inventory and breakdown count maps
- `ActivityItem` — `id: string | number`, `action: string`, `type: string`, `target: string`, `time: string`
- `InspectorPanelProps` — the full props surface of the root component

Place these interfaces in a shared types file, not inline in the component file. The component file must import them.

---

## 6. Action Callbacks

Every interactive element in the panel requires a real handler. The following must all be wired before the implementation is considered complete. None of these may remain as no-ops or `console.log` stubs in production.

| Interactive element | Required action |
|---|---|
| Auto Calculate toggle | Write new boolean to engineering settings store |
| "Edit Engineering Settings" button | Open the engineering settings panel/modal |
| "Locate" button (per health issue row) | Focus and select elements of that issue type on the canvas |
| "Select All Invalid" button | Select all elements across all failing validation checks on the canvas |
| "Auto-Fix Geometry" button | Run geometry auto-fix; show result feedback to the user |
| Health banner (amber, in header) | Expand the Model Health section and scroll it into view |
| Each Inventory/Breakdown row (Elements section) | Select all canvas elements of that type |
| Undo button | Undo last action via history store; disable when stack is empty |
| Redo button | Redo last undone action via history store; disable when stack is empty |

---

## 7. Loading and Error States

The current component assumes all data is immediately available. In the real application, project data, engineering settings, validation results, and calculation results may be loading asynchronously or may fail to load.

For each data source, implement the following:

**Loading state:** While data is being fetched, render a skeleton placeholder in place of the section body. The section header (collapsed state with icon and summary text) must still render, but the summary text should show a neutral placeholder (e.g. `"Loading…"`) rather than zeroes or empty strings. The section must remain non-interactive until its data has loaded.

**Error state:** If a data source returns an error, render a short error message inside the relevant section body with a "Retry" or "Refresh" affordance. Do not let an error in one section prevent the other sections from rendering.

**Empty state (Recent Activity only):** As noted in section 2.6, if the activity history is empty, render an inline message rather than an empty list.

---

## 8. Test Requirements

All existing tests that reference the inspector panel, the right sidebar, or any data it consumes must be reviewed and updated to match the new component structure. The following test categories must pass before this work is merged.

### 8.1 Unit Tests — Component Rendering

- All six sections render with the correct title, icon, and summary text when given valid props.
- All sections are collapsed on initial render (`aria-expanded="false"` on every section button).
- Clicking a section button toggles it open (`aria-expanded="true"`) and does not affect the state of other sections.
- Clicking an already-open section button collapses it.
- The health banner renders the amber warning variant when `issueCount > 0`.
- The health banner renders the green all-clear variant when `issueCount === 0`.
- Clicking the amber health banner sets the `health` section to open.

### 8.2 Unit Tests — Data Display

- Each field in the Project section renders the value passed via props, not a hardcoded string.
- The Auto Calculate toggle renders as ON when the prop value is `true` and as OFF when `false`.
- System blocks render only the systems passed via props — no extra or missing blocks.
- A system with `status: "not_calculated"` renders `"Not Calculated"` in its status badge and `"—"` for Design Flow and Pressure Loss.
- A project with zero systems renders the Systems section with an appropriate empty state (define and implement this empty state).
- The Elements section renders zero-count rows without hiding them.
- The Recent Activity section renders an empty state message when the activity list is empty.

### 8.3 Unit Tests — Interactions

- Clicking the Auto Calculate toggle calls the store write action with the opposite of the current value.
- Clicking a "Locate" button calls the canvas selection service with the correct issue type identifier.
- Clicking "Select All Invalid" calls the canvas selection service with a filter that covers all failing checks.
- Clicking an Elements inventory row calls the canvas selection service with the correct element type filter.
- Clicking Undo calls the undo action; Undo is disabled when the history stack is empty.
- Clicking Redo calls the redo action; Redo is disabled when nothing has been undone.

### 8.4 Integration Tests

- When the model validator runs and produces new results, the Model Health section reflects the updated counts and statuses without a page reload.
- When a calculation completes, the Systems section reflects the updated Design Flow, Pressure Loss, and status badge values.
- When a canvas element is added, deleted, or modified, the Elements section counts update.
- When a canvas action is performed, the Recent Activity list prepends the new entry.
- The Auto Calculate toggle reflects the store state at all times, including if the store is updated from another source (e.g. a settings modal).

### 8.5 Accessibility Tests

- Every section button has `aria-expanded` set correctly based on open state.
- Every section body region has `role="region"` and `aria-label` matching its section title.
- The Auto Calculate toggle button has `aria-pressed` set to the current boolean value.
- The Undo and Redo buttons have `aria-label` attributes describing their action.
- The Undo and Redo buttons have `disabled` attribute and `aria-disabled="true"` when their respective stacks are empty.
- "Locate" buttons have `aria-label` attributes describing which issue type they locate.

---

## 9. Remaining Gaps — Developer Must Investigate and Resolve

The following items were identified during the design and review process as unresolved. They are not handled by this component or the current design. Each must either be implemented, deferred with a recorded rationale, or ruled out entirely. The developer must document the outcome of each investigation before closing this ticket.

**Gap 1 — Selection-State Routing**
`InspectorPanel` is the no-selection state only. There is no parent component that switches between this panel and element-specific inspector views (duct inspector, fitting inspector, equipment inspector, room inspector). This routing logic must be defined. Determine whether it lives in the sidebar container component or in a dedicated `InspectorRouter` component. The decision must be recorded and the routing skeleton implemented, even if the element-specific panels are not yet built.

**Gap 2 — Multiple Selection State**
It is not defined what the inspector should display when multiple canvas elements are selected simultaneously. This panel does not handle it. Determine whether a "multi-selection summary" view is needed and, if so, what data it shows. Until decided, ensure that the selection-state router does not break when a multi-selection occurs.

**Gap 3 — Hover Preview**
It is not defined whether the inspector should preview element data when the user hovers over a canvas element without clicking. If hover preview is desired, it requires a separate low-latency data path and a visual treatment distinct from the selected state. Investigate and decide before the element-specific inspector panels are built.

**Gap 4 — Validation Rule Completeness**
The current model health data shows five validation checks. The full set of SMACNA-required validation checks is not enumerated. Identify every check the validator currently runs and every check it should run but does not yet. The `health` data array must be driven by the actual validator output — not a fixed list. Ensure the validator produces a result entry for each check type, and that the component renders any new check types automatically without code changes.

**Gap 5 — "Modified" Timestamp Tracking**
The Project section shows a "Modified" field that is expected to reflect the last time the canvas was edited. Confirm whether this timestamp is currently tracked in the project metadata store. If it is not, create a task to implement it. Until it exists, do not display a stale or fabricated value in this field — render `"—"` in its place.

**Gap 6 — System Color Convention Extensibility**
The component's color mapping for duct systems (`SYSTEM_CONFIG`) is keyed by the system name string. If a user creates a custom-named system (e.g., a second supply system named "Supply 2" or a custom system named "Lab Exhaust"), it will not match any entry in the config and will fall back to the default gray dot. Define how custom system colors are assigned and whether users can configure them. Update `SYSTEM_CONFIG` or replace it with a dynamic color-assignment strategy.

**Gap 7 — Real-Time Recalculation Feedback**
When Auto Calculate is on and the model changes, the Systems section values update. There is no loading indicator during recalculation. If recalculation is asynchronous and takes more than a moment, the stale values remain visible without any signal to the user that an update is in progress. Define and implement a per-system loading indicator or a panel-level recalculation badge for this scenario.

**Gap 8 — Activity Feed Pagination**
The Recent Activity list currently shows the four most recent items (from mock data). The maximum number of entries to display must be decided and configured as a constant. If the full history is long, a "Show more" affordance or infinite scroll within the section must be evaluated. Decide on the approach before wiring the activity store.

**Gap 9 — "Auto-Fix Geometry" Scope and Safety**
The "Auto-Fix Geometry" button runs an automated repair action. The exact scope of what it fixes, what it cannot fix, and whether it requires user confirmation before running is not yet defined. Running it silently with no confirmation on a large model could cause unintended changes. Define the action scope, determine whether a confirmation step is required, and ensure the action is reversible via Undo before wiring the button.

**Gap 10 — Unit System Switching at Runtime**
The Engineering section displays Airflow, Pressure, and Temperature in specific unit strings. If the user changes the unit system (e.g. from Imperial to Metric) while a project is open, every computed value in the Systems section (Design Flow in CFM vs. L/s, Pressure Loss in in. w.g. vs. Pa, Length in ft vs. m) must update. Confirm that the data sources for these fields emit updated values when units change, and that the component re-renders correctly in response.
