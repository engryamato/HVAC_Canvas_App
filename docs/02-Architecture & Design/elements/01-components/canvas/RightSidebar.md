# Right Sidebar (Canvas)

## Overview

The Right Sidebar is a tabbed sidebar for canvas workflows. It includes entity/canvas properties, Bill of Quantities (BOQ), and calculations.

## Location

```
src/features/canvas/components/RightSidebar.tsx
```

## Tabs

- **Properties**: Inspector panel (entity or canvas-level)
- **BOM**: Bill of Quantities table
- **Calculations**: Calculation breakdown (currently placeholder)

## Structure

### 1. Bill of Quantities (Accordion)
A tabulated view of all items in the design.
*   **Columns**:
    1.  **Quantity**
    2.  **Name**: Separated by Size, Description, and Weight.
    3.  **Description**
    4.  **Weight**
*   **Categories**:
    *   Ducts
    *   Fittings
    *   Equipment
    *   Accessories

### 2. Calculation (Accordion)
Detailed engineering data with color-coded feedback (Inappropriate, Warning, Normal).
Hierarchy: Starts with **Equipment** (Name/Tag must be specified).

#### Data Columns (Table Row per Section):
1.  **Air System**: Supply, Return, Exhaust, Outside, Bypass.
2.  **Duct Section**: Separated per Section, Size, and Room (termination).
    *   *e.g., Section 1, 2, 3, 4 based on branch layer.*
3.  **Air Volume**:
    *   *Unit Dropdown*:
        *   **English**: CFM (Default), CFS, CFH.
        *   **Metric**: m³/s (Default), m³/h, m³/m, L/s.
4.  **Air Velocity**:
    *   *Unit Dropdown*:
        *   **English**: FPM (Default), FPS.
        *   **Metric**: m/s (Default), cm/s.
5.  **Air Pressure**:
    *   **Static** (Top of cell): 0.25” W.C. static
    *   **Dynamic** (Bottom of cell): Velocity Pressure
    *   *Unit Dropdown*:
        *   **English**: in. W.C., psi
        *   **Metric**: Pa, kPa
6.  **Temperature**:
    *   *Unit Dropdown*:
        *   **English**: °F, °R
        *   **Metric**: °C, °K

## Behavior
*   **Real-time Updates**: Values update automatically as the design changes on the canvas.
*   **Unit Support**: Comprehensive unit conversion based on global settings or local dropdown overrides.
*   **Validation**:
    *   Rows with issues are color-coded.
    *   Highlights the "Inappropriate" or "Warning" state for quick troubleshooting.
