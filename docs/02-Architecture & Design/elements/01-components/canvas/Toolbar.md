# Toolbar

## Overview

The Toolbar provides quick access to primary design tools (Select, Duct, Pipe, etc.) and history controls (Undo/Redo). It is located at the top of the canvas, below the header.

## Location

```
src/features/canvas/components/Toolbar.tsx
```

## Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Select] [Pan] | [Duct] [Pipe] [Wire] ... | [Undo] [Redo]               │
└─────────────────────────────────────────────────────────────────────────┘
```

## Features

### Tools
- **Select (V)**: Select and manipulate entities.
- **Pan (Space)**: Move the viewport without selecting.
- **Duct (D)**: Draw ductwork.
- **Pipe (P)**: Draw piping.
- **Wire (W)**: Draw electrical wiring.
- **Equipment (E)**: Place equipment from library.
- **Room (R)**: Define zones/rooms.
- **Note (N)**: Add annotations.

### History
- **Undo (Ctrl+Z)**: Revert last action.
- **Redo (Ctrl+Y)**: Reapply last undone action.

## Dependencies

- `@/features/canvas/store/toolStore` - Active tool state
- `@/features/canvas/store/historyStore` - Undo/Redo stack
- `lucide-react` - Icons

## Styling

Uses Tailwind CSS for a clean, segmented control look:
- Active tool: `bg-slate-100 text-slate-900 shadow-sm`
- Inactive tool: `text-slate-500 hover:text-slate-900`

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `V` | Select Tool |
| `H` | `Space` | Pan Tool |
| `D` | Duct Tool |
| `P` | Pipe Tool |
| `W` | Wire Tool |
| `E` | Equipment Tool |
| `R` | Room Tool |
| `N` | Note Tool |
