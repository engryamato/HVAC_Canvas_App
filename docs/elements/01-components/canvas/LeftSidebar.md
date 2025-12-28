# Left Sidebar (Project Context)

## Overview

The Left Sidebar is a sizable drawer layer dedicated to project-level information and context. It manages the "What" and "Where" of the design.

## Structure
The sidebar is organized into three collapsible accordions:

### 1. Project Details
Editable basic metadata for the project.
*   **Name**: Project Name.
*   **Location**: Site location/address.
*   **Client**: Client name/details.

### 2. Project Scope
Defines the parameters and constraints of the design.
*   **Scope** (Multi-Select):
    *   HVAC
    *   For future updates
*   **Material** (Multi-Select with Sub-Dropdowns):
    *   **Galvanized Steel** (Dropdown: G-60, G-90)
    *   **Stainless Steel** (Dropdown: 304S.S., 316S.S., 409S.S., 430S.S., 444S.S.)
    *   **Aluminum**
    *   **PVS**
*   **Project Type** (Dropdown):
    *   Residential
    *   Commercial
    *   Industrial

### 3. Site Conditions
Environmental parameters used for engineering calculations. Fields accept text/number input.
*   **Elevation**: according to location (if available).
*   **Outdoor Temperature**
*   **Indoor Temperature**
*   **Wind Speed**
*   **Humidity**
*   **Local Codes**

## Behavior
*   **Sizable**: User can drag the edge to resize the panel.
*   **Drawer Layer**: Can potentially be toggled or overlay the canvas.
*   **Data Binding**: Changes here propagate to the `ProjectStore` and may trigger recalculations (e.g., elevation affecting air density).
