# Canvas Bill of Materials (BOM) Context

This document outlines the purpose, data points, and context for all UI elements found in `Canvas_BOM.pen`.

## 1. BOM Panel Shell (`Canvas_BOM`)
The secondary right sidebar dedicated to managing the Bill of Materials. It provides real-time quantity rollups and item groupings based on what's drawn/configured on the canvas.

## 2. BOM Panel Header (`header`)
Contains the primary controls and filtering mechanisms for the materials list.
- **Title Row**: Displays the "Bill of Materials" header text and high-level export/refresh actions.
- **Toolbar**: Contains interactive elements for managing the layout and details of the BOM.
- **Chips Row**: Interactive filtering elements (e.g., Ducts, Fittings, Equipment) to immediately isolate specific categories of materials.

## 3. BOM Panel Content (`content`)
The main body of the BOM side panel displaying structured items.
- **List Card**: The core visual table or list outlining specific materials, their identifiers, materials types, and computed quantities. Grouped by category layout.
- **Footer**: A fixed footer area that aggregates the total quantity rollups across the listed resources.

## 4. Canvas Overylay Elements
These elements appear directly on the canvas as indicators and helper texts to guide the user toward the BOM panel functionality.
- **BOM Count Badge**: A dynamic tag (e.g., `BOM Live · 128 items`) floating on the canvas. The green status dot indicates sync health/status.
- **BOM Panel Hint**: A temporary or dismissable overlay tooltip providing explicit instructions: "Grouped by category with live quantity rollups. Use the BOM tab to review ducts, fittings, equipment, accessories and export CSV."
