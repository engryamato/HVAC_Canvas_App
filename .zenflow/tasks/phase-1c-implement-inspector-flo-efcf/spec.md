# [Phase 1C] Inspector Floating Mode - Technical Spec

## Difficulty
hard

## Technical context
- Next.js (App Router) + React + TypeScript
- State: Zustand; persisted prefs via `zustand/middleware` `persist` (localStorage)
- UI: Tailwind; no external drag libraries
- Unit tests: Vitest + React Testing Library
- E2E/visual: Playwright (`hvac-design-app/e2e`)

## Goal
Add a floating/detached mode for the Properties inspector panel:
- Toggle docked (RightSidebar) <-> floating window
- Drag floating panel by header
- Persist floating state + position across reload
- Validate/correct position to prevent off-screen panel (incl. monitor disconnect)
- Preserve inspector width/section state between modes

## Implementation approach
1) Extend (or introduce) a persisted inspector preferences store:
- `isFloating: boolean` (default false)
- `floatingPosition: { x: number; y: number } | null` (default null)
- actions: `setFloating`, `setFloatingPosition`, `resetFloatingPosition` (center)
- persisted under key `sws.inspector-preferences`

2) Add `validateFloatingPosition(position, panelSize, viewportSize)` utility:
- Enforce a visible margin (~50px)
- If invalid/off-screen, return centered coordinates
- Detect probable "missing external monitor" positions and reset to center + `console.warn`

3) Add `FloatingInspector` component:
- Portal to `document.body`
- Fixed-position container with elevation (`shadow-2xl`) and `z-50`
- Draggable header (native mouse events + `requestAnimationFrame` updates; persist on drag end)
- Dock button to return to sidebar
- Window resize listener re-validates position
- A11y: `role="dialog"`, `aria-label`, `aria-grabbed`, focusable header; optional keyboard (Esc docks)

4) Wire UI:
- `InspectorPanel`: add optional docked header (`showHeader`, `onFloat`) with Float button (Lucide `Maximize2`)
- `RightSidebar`: when floating, replace inspector content with a placeholder message
- Canvas root: conditionally render `FloatingInspector` when `isFloating` is true

## Source code changes
Planned files:
- `hvac-design-app/src/features/canvas/store/inspectorPreferencesStore.ts`
- `hvac-design-app/src/features/canvas/utils/validateFloatingPosition.ts`
- `hvac-design-app/src/features/canvas/components/Inspector/FloatingInspector.tsx`
- `hvac-design-app/src/features/canvas/components/Inspector/InspectorPanel.tsx`
- `hvac-design-app/src/features/canvas/components/RightSidebar.tsx`
- `hvac-design-app/src/features/canvas/components/CanvasContainer.tsx`

Planned tests:
- validator + store tests
- `FloatingInspector` drag/dock/resize tests
- update sidebar/inspector panel tests for Float button + placeholder

Planned E2E:
- visual regression spec for float/dock and dragging screenshots

Planned docs:
- `hvac-design-app/src/features/canvas/components/Inspector/README.md`

## Verification
- `pnpm test`
- `pnpm type-check`
- `pnpm lint`
- `pnpm e2e` (run/target the inspector spec)

