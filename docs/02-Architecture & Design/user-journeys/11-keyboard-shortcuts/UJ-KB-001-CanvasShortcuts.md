# User Journey: Canvas Shortcuts (Core)

## 1. Overview

### Purpose
To document the universal keyboard shortcuts available in the Canvas application, managed by the core React hooks.

### Scope
- Navigation (Pan, Zoom)
- Editing (Undo, Redo, Delete)
- Tool Selection

### User Personas
- **Primary**: Power Users / Designers

### Success Criteria
- Keys trigger expected actions.
- Shortcuts work consistently in supported contexts.

## 2. PRD References

### Related PRD Sections
- **Section 5.3: Interaction Model** - Input handling.

## 3. Prerequisites

### System Prerequisites
- Canvas must be focused or active.
- `useKeyboardShortcuts` hook mounted.

## 4. User Journey Steps

### Step 1: Undo/Redo

**User Actions:**
1. Press `Ctrl + Z` (Undo).
2. Press `Ctrl + Y` or `Ctrl + Shift + Z` (Redo).

**System Response:**
1. `useKeyboardShortcuts` detects keydown.
2. Calls `TemporalStore.undo()` or `redo()`.
3. Canvas state updates to previous/next snapshot.

### Step 2: Delete Entity

**User Actions:**
1. Select an entity.
2. Press `Delete` or `Backspace`.

**System Response:**
1. `SelectionStore` checks for active features.
2. `EntityStore.removeById()` is dispatched.
3. Entity disappears.

### Step 3: Pan and Zoom

**User Actions:**
1. Hold `Space` + Drag Mouse (Pan).
2. `Ctrl` + Scroll Mouse Wheel (Zoom).

**System Response:**
1. `ViewportStore` updates `x, y` or `zoom` level.
2. Renderer transforms canvas view.

**Related Elements:**
- Hooks: `src/features/canvas/hooks/useKeyboardShortcuts.ts`

## 11. Related Documentation
- [Hybrid Implementation](./hybrid/UJ-KS-001-CanvasShortcuts.md)
- [Tauri Implementation](./tauri-offline/UJ-KS-001-CanvasShortcuts.md)
