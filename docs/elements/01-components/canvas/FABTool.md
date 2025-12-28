# FAB Tool (Floating Action Button)

## Overview

The FAB Tool is a quick-access menu for creating new entities on the canvas. It is triggered via a keyboard shortcut to provide a fluid "heads-up" design experience.

## Trigger
*   **Hotkey**: Press button **'D'** (or click the FAB on screen).

## Layout
An "Umbrella" menu expands to show three primary creation categories:

1.  **Rooms**: Creates a rectangular room.
    *   **Logic**: Size of the room currently selected should be changeable either by dragging (visual) or specifying the sizes (input).
2.  **Ducts**: Access specialized duct drawing tools.
3.  **Equipments**: Palette of HVAC equipment.

## Interaction
1.  User presses 'D'.
2.  Menu expands radially or vertically (Umbrella style).
3.  User selects a category (e.g., Ducts).
4.  Sub-menu or tool activation occurs.
5.  Menu collapses after selection or cancellation.

## Dependencies
- `@/features/canvas/store/canvas.store` - Tool state management
