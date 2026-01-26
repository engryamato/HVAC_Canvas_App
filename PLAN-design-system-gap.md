# PLAN-design-system-gap.md

## 1. Component Documentation Analysis Summary

The analysis of the existing components in [`docs/elements/01-components`](docs/elements/01-components) reveals a foundational set of primitives, primarily derived from or inspired by shadcn/ui and Radix UI primitives.

| Category | Existing Components | Status & Observation |
|---|---|---|
| **Action/Input**| `Button`, `IconButton`, `Input`, `ValidatedInput`, `Select` (primitive), `Dropdown` (custom), `Checkbox`, `Switch`| Strong foundation for atomic inputs. `ValidatedInput` and custom `Dropdown` demonstrate a good pattern for incorporating validation and enhanced selection logic. |
| **Feedback/Status**| `Toast`, `LoadingIndicator`, `LoadingSpinner`, `progress` | Comprehensive coverage for asynchronous operations and user feedback. `Toast` includes specific handling for canvas-related interactive warnings. |
| **Layout/Structure**| `Card`, `Accordion`, `Dialog`, `Label` | Basic structural components are present for grouping content and managing modals. |
| **Data Display** | `StatCard` | Good for dashboard metrics, but needs support for complex data visualization. |

## 2. Gap Analysis and Missing Components

A review against industry-standard design systems identifies critical missing components necessary for a production-ready, feature-rich application, especially given the needs of a canvas editor with complex forms and data reporting (e.g., BOM).

### Missing Core UI Components

| Component | Standard Use Case | Rationale for Inclusion | Priority |
|---|---|---|---|
| **Tabs** | Property Inspector, Dialogs | Crucial for organizing layered content within the fixed constraints of the sidebars (`LeftSidebar.md`, `RightSidebar.md`) and large dialogs (e.g., `SettingsDialog.md`). | P1 (Critical) |
| **Table/DataGrid** | Dashboard Project List, BOM Panel | The dashboard currently relies on `ProjectCard`s, but a sortable/filterable data list is essential. Required for the Bill of Materials (BOM) in the canvas editor. | P1 (Critical) |
| **Textarea** | Entity Notes, Descriptions | Necessary for multi-line text input in forms and in the `NoteDefaults.md` entity inspector. | P1 (Critical) |
| **Radio Group** | Mutually exclusive form options | Standard form control for selecting a single option from a small, defined set (e.g., duct shape: `Rectangular` or `Round`). | P1 (Critical) |
| **Slider** | Canvas Zoom/Grid Control | Provides a superior UX for visual parameter adjustments over simple number inputs (e.g., setting `GridSettings.md` size). | P2 (High) |
| **Badge/Tag** | Status Indicators, Filtering | Visual markers for quick identification of status (e.g., Project Status: `Draft`, `Complete`, `Archived`) or filtering categories. | P2 (High) |
| **Tooltip Primitive** | General Utility | Needed to replace the hard-coded tooltip logic in components like `IconButton.md` for a single, consistent, and accessible primitive. | P2 (High) |
| **Separator/Divider** | Menu/Form Grouping | For visual separation in menus (`FileMenu.md`) and structured forms (Inspectors). | P3 (Medium) |
| **Calendar/Date Picker**| Project Metadata, Filtering | Required if project tracking involves specific dates (e.g., creation date, due date). Needs further confirmation. | P3 (Medium) |

## 3. Prioritized Implementation Roadmap

The plan is divided into two phases: **Phase 1: Critical Form & Data Structure** and **Phase 2: Enhanced Interactivity & Polish**.

### Phase 1: Critical Form & Data Structure (P1 Components)

1.  **Implement `Radio Group`:** Build the Radix UI-based component.
2.  **Implement `Textarea`:** Create the multi-line input component with support for validation/styling consistent with [`ValidatedInput.md`](docs/elements/01-components/ui/ValidatedInput.md:1).
3.  **Implement `Tabs`:** Build the Radix UI-based component for content segmentation.
4.  **Implement `Table/DataGrid`:** Design a robust data table wrapper capable of sorting, filtering, and displaying large datasets for both the dashboard and BOM view.

### Phase 2: Enhanced Interactivity & Polish (P2/P3 Components)

1.  **Implement `Tooltip Primitive`:** Create a generalized primitive to simplify tooltip usage across all existing components (e.g., `IconButton.md`).
2.  **Implement `Slider`:** Build the component for numerical and range control.
3.  **Implement `Badge/Tag`:** Create status indicator component.
4.  **Implement `Separator/Divider`:** Basic visual separation component.

## 4. Technical Specifications (P1 Components Detail)

### 4.1. Component: Tabs

| Aspect | Specification |
|---|---|
| **Primitive** | Radix UI Tabs |
| **Location** | `src/components/ui/tabs.tsx` |
| **Props** | `value: string`, `onValueChange: (value: string) => void`, `orientation: 'horizontal' | 'vertical'` (default: `'horizontal'`) |
| **Styling** | Horizontal: Tabs below the element boundary. Vertical: Tabs on the side (for sidebars/inspectors), no underline, subtle color shift on active. |
| **Accessibility** | Full ARIA compliance (managed by Radix), keyboard navigation (Arrow keys, Home/End). |
| **UX Requirement** | **Interactivity:** Smooth transition between panels. **Edge Case:** When vertical tabs are used in a narrow sidebar, ensure text truncation with an accessible tooltip of the full tab title. |

### 4.2. Component: Table/DataGrid

| Aspect | Specification |
|---|---|
| **Primitive** | Custom component using [`Card.md`](docs/elements/01-components/ui/card.md:1) and `table` elements. Potentially leverage `react-table` or similar for logic. |
| **Location** | `src/components/ui/DataTable.tsx` |
| **Props** | `data: T[]`, `columns: DataTableColumn[]`, `sortState: SortState`, `onSortChange: (key, direction) => void` |
| **Styling** | Striped rows for readability, sticky header, hover highlight on rows, and clear visual indicators for sortable columns. |
| **Accessibility** | Proper `scope` attributes on `<th>` elements, `aria-sort` on sortable columns, and keyboard navigation for selection/interaction. |
| **UX Requirement** | **Responsive:** Must collapse or scroll horizontally on narrow viewports (e.g., smaller dashboards). **Interaction:** Clicking a row in the Project List should trigger project open; clicking a row in the BOM should select and pan to the entity on the canvas. |

### 4.3. Component: Textarea

| Aspect | Specification |
|---|---|
| **Primitive** | Native `<textarea>` wrapped for styling and validation. |
| **Location** | `src/components/ui/textarea.tsx` |
| **Props** | Inherit `TextareaHTMLAttributes`, plus `error: string` and `warning: string` (consistent with [`ValidatedInput.md`](docs/elements/01-components/ui/ValidatedInput.md:1)). |
| **Styling** | Same border, focus ring, and validation color treatment as [`Input.md`](docs/elements/01-components/ui/input.md:1). Include `resize-y` to allow vertical resizing by the user. |
| **Accessibility** | Associated with a [`Label.md`](docs/elements/01-components/ui/label.md:1) element. |
| **UX Requirement** | **Edge Case:** Should support character count display for fields with length constraints (e.g., note content). |

## 5. UX Requirements for Existing Components

This section defines missing UX requirements for interaction states and behaviors for key existing components.

### 5.1. Button ([`Button.md`](docs/elements/01-components/ui/button.md:1) & [`IconButton.md`](docs/elements/01-components/ui/IconButton.md:1))

| Requirement | Specification |
|---|---|
| **Loading State UX**| Loading should override the button content (not append to it) and automatically set `disabled=true`. The loading spinner must be small (e.g., 16px) and centered. |
| **Keyboard Interaction**| All non-icon buttons must visually and structurally accommodate accelerator keys/shortcuts if they exist (e.g., `[Save (Ctrl+S)]` text/tooltip). |
| **Micro-interaction**| The current `hover:scale-[1.02]` is good. Ensure this is preserved and consistent across all buttons, including `IconButton`. |

### 5.2. Dialog ([`Dialog.md`](docs/elements/01-components/ui/dialog.md:1))

| Requirement | Specification |
|---|---|
| **Primary Action Focus**| On opening a non-destructive dialog, the primary action button (e.g., 'Create', 'Save') should receive initial focus. |
| **Error Handling**| All dialog forms must prevent submission on validation error and display inline error messages (using `ValidatedInput.md` pattern). |
| **Unsaved Changes**| If a user attempts to close a dirty dialog, a confirmation prompt (`UnsavedChangesDialog.md`) should intercept the action. |

## Next Step

The structural plan is complete.

I have performed the analysis, gap definition, roadmap development, and technical specification drafting. I will now ask for your approval before proceeding to the implementation (which would require a mode switch).
