# Canvas Calculations Context

This document outlines the purpose, data points, and states of all UI elements found in `Canvas_Calculations.pen`. It serves as a reference for developers implementing the real-time calculation and validation panel.

## 1. Global Canvas Shell
The global shell provides the main application navigation and context.
- **Top Header Bar**: Contains the main application logo ("HVAC Pro"), the standard OS-like application menu (File, Edit, View, Help), and the current project location breadcrumb (e.g., `⌂ Dashboard › Office Block A - Level 1`).
- **Settings**: A global settings gear icon resides in the top right corner.

## 2. Canvas Viewport & Navigation Controls
These elements provide users with spatial awareness and control over the drawing canvas.
- **Minimap**: Located in the bottom right, it provides a miniaturized view of the entire canvas with a highlighted "Viewport Indicator" box showing the current visible area.
- **Zoom Controls**: Situated below the minimap, featuring `-`, `100%`, and `+` buttons to manage the zoom level of the canvas.
- **Status Bar Information**: Along the bottom edge of the canvas, users see:
  - **Cursor Position**: Real-time `X` and `Y` coordinates of the mouse on the canvas.
  - **Zoom Level**: Textual representation of the current zoom percentage.
  - **Grid & Snap Toggles**: Status indicators showing if the drawing grid and element snapping are "On" or "Off".

## 3. Application Context Strip
This bar sits just below the top header and indicates the specific engineering context the user is currently operating within.
- **Context Filtering**: Displays text like `Service: Supply Air · System: AHU-01 · Zone: Level 1 Office`. This informs calculations which criteria and limits apply to the currently drawn elements.

## 4. Sidebar Navigation & Inspector States
The right sidebar houses the main tool panels.
- **Tab Bar**: Navigation between different modes: `Properties`, `BOM`, `Calculations`, and `Validation`. The sidebar can be collapsed using the `›` button.
- **Empty State (No Selection)**: When no canvas element is selected, a hint box displays "Select an element to view properties."
- **Active State (Duct Properties)**: When a duct is selected, the inspector populates with input fields such as:
  - **Width (mm)** and **Height (mm)**
  - **Material** (e.g., Galvanised Steel)

## 5. Calculation Status
Located in the "Calculations" tab, this panel provides a high-level summary of the system's engineering health.
- **Status Summary Card**: Highlights the count of active issues (e.g., `1 Warning · 0 Errors`).
- **Recalculation Timing**: Displays a timestamp of the last calculation run (e.g., `Last recalculation: 0.3s ago`).
- **Process Button**: Manual trigger for recalculation, alongside a subtitle explaining the active validation rules (e.g., "Velocity checks run against office limits.").

## 6. Equipment Hierarchy Visualizer
A tree-view component that traces the connected air path from the root equipment to the terminal units.
- **Root Node**: The primary equipment (e.g., `AHU-1 Supply Air`) with a green dot and an "Online" status.
- **Child Nodes**: Connected components (e.g., `SF-1 Fan Section`, `CLG-1 Cooling Coil`).
- **Status Alerts**: Nodes change color and display specific warnings when issues are detected (e.g., an amber dot with "Belt slip risk").
- **Visual Branches**: Lines connect the components to illustrate the physical/logical airflow path.

## 7. Selected Duct Metrics (Real-time Calculations)
When a specific duct or element is selected while in the Calculations tab, detailed real-time engineering metrics are displayed.
- **Context Header**: Identifies the selection (e.g., `Supply Duct • Section B`).
- **Physical Properties**: Summarizes size and material (e.g., `Rectangular 300×200 mm • Galvanized steel`).
- **Status Tag**: A color-coded badge indicating the severity of the calculated metrics (e.g., `Warning` in amber).
- **Metric Cards**:
  - **Air Volume**: e.g., `620 CFM`
  - **Air Velocity**: Categorized by severity color (e.g., `1,180 FPM` in dark orange, indicating it's approaching or exceeding limits).
  - **Static Pressure**: e.g., `0.42 in.w.g.`
  - **Dynamic Pressure**: Details about friction loss (e.g., `Friction loss: 0.18 in.w.g./100ft`) and the calculation formula used (e.g., `VP = (V/4005)^2`).

## 8. Footer Reference
- **Status Colors Legend**: "Status colors: green = normal, amber = warning, red = inappropriate/out-of-range." This guides the user in interpreting the visual feedback across the entire calculations panel.
