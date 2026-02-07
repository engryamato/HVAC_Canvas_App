# Inspector (Docked + Floating)

This folder contains the “Properties” inspector UI for the canvas.

## Overview

The inspector supports two presentation modes:

- **Docked**: rendered inside the right sidebar.
- **Floating**: rendered as a draggable, fixed-position panel over the canvas.

The underlying inspector content is shared; only the container changes.

## Key Components

### `InspectorPanel`

File: `hvac-design-app/src/features/canvas/components/Inspector/InspectorPanel.tsx`

Responsibilities:

- Renders the appropriate inspector content based on selection:
  - No selection: `CanvasPropertiesInspector`
  - Single selection: entity-specific inspector (`RoomInspector`, `DuctInspector`, `EquipmentInspector`, ...)
  - Multi selection: selection count summary
- Optional docked header controls:
  - `showHeader`: when `true`, renders the “Properties” header.
  - `onFloat`: invoked by the “Float” button.

### `FloatingInspector`

File: `hvac-design-app/src/features/canvas/components/Inspector/FloatingInspector.tsx`

Responsibilities:

- Uses a React portal (element id: `floating-inspector-portal`) to render outside normal layout.
- Renders a fixed-position container with:
  - Header (drag handle) with “Dock” button
  - Scrollable content (`InspectorPanel`)
- Drag behavior:
  - `mousedown` on the header starts a drag and disables text selection (`document.body.style.userSelect = 'none'`).
  - `mousemove` updates the visual position (local state) while dragging.
  - `mouseup` ends drag and persists the final position to the store.
- Resize behavior:
  - On `window.resize`, re-validates the current position and recenters if needed.

Accessibility:

- `role="dialog"` and `aria-label="Floating Properties Panel"` on the container.
- Drag handle sets `aria-grabbed` based on `isDragging`.
- `Escape` key docks the floating inspector.

## Where Modes Are Wired Up

### Docked (Right Sidebar)

File: `hvac-design-app/src/features/canvas/components/RightSidebar.tsx`

- When the “Properties” tab is active and the inspector is docked, it renders:
  - `InspectorPanel` with `showHeader` + `onFloat`.
- When floating, it shows a lightweight placeholder message in the sidebar.

### Floating (Canvas Overlay)

File: `hvac-design-app/src/features/canvas/components/CanvasContainer.tsx`

- Conditionally renders `<FloatingInspector />` when `isFloating` is true.
- Ensures a valid `floatingPosition` exists via `validateFloatingPosition` when entering/while in floating mode.

## State & Persistence

File: `hvac-design-app/src/features/canvas/store/inspectorPreferencesStore.ts`

Persisted (Zustand `persist`) under the key `sws.inspector-preferences`:

- `isFloating`: whether the inspector is docked or floating.
- `floatingPosition`: `{ x, y }` coordinates in viewport pixels.

## Position Validation

File: `hvac-design-app/src/features/canvas/utils/validateFloatingPosition.ts`

`validateFloatingPosition(position, panel, viewport)`:

- Keeps the floating panel at least partially visible (default 50px margin).
- Recenters when coordinates are invalid/off-screen.
- Detects likely “disconnected external monitor” coordinates using `window.screen.availWidth/availHeight` and recenters (logs a warning).

## Testing

- Unit tests live alongside the feature:
  - `hvac-design-app/src/features/canvas/components/Inspector/__tests__/FloatingInspector.test.tsx`
  - `hvac-design-app/src/features/canvas/components/Inspector/__tests__/InspectorPanel.test.tsx`
  - `hvac-design-app/src/features/canvas/utils/__tests__/validateFloatingPosition.test.ts`
  - `hvac-design-app/src/features/canvas/components/__tests__/RightSidebar.test.tsx`
- Visual regression (Playwright):
  - `hvac-design-app/e2e/03-visual-regression/components/inspector-panel.spec.ts`

## Manual QA Checklist

- Float from docked mode and verify the overlay appears.
- Drag the floating inspector and refresh to confirm persistence.
- Dock back and ensure the docked inspector works normally.
- Resize the window to ensure the floating panel stays on-screen.

