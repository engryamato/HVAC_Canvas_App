# Frequently Asked Questions (FAQ)

This document answers common questions about using the SizeWise HVAC Canvas App. For technical troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## Table of Contents

- [Getting Started](#getting-started)
- [Canvas Navigation](#canvas-navigation)
- [Tools Usage](#tools-usage)
- [Project Management](#project-management)
- [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Getting Started

### What is the SizeWise HVAC Canvas App?

SizeWise HVAC Canvas App is a specialized design tool for HVAC (Heating, Ventilation, and Air Conditioning) estimators and engineers. It provides an infinite canvas for designing HVAC layouts, calculating ventilation requirements, sizing ducts, and generating bills of materials.

**Key features:**
- Draw rooms and calculate CFM requirements automatically
- Design duct layouts with proper sizing
- Place HVAC equipment (furnaces, air handlers, diffusers)
- Generate detailed bills of materials (BOM)
- Export designs to various formats

---

### What are the system requirements?

**Web Version:**
- Modern browser (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- Minimum 4GB RAM recommended for large projects

**Desktop Version (Tauri):**
- Windows 10/11, macOS 10.15+, or Linux
- Rust runtime (bundled with installer)
- 8GB RAM recommended

---

### How do I create a new project?

1. From the **Dashboard**, click the **"New Project"** button
2. Fill in project details:
   - **Project Name**: A descriptive name (e.g., "Office Building HVAC")
   - **Client Name**: Your client's name
   - **Project Number**: Optional reference number
   - **Location**: Building address or description
3. Click **"Create"**

You'll be taken directly to the canvas editor where you can start designing.

---

### How do I open an existing project?

**From the Dashboard:**
1. Your recent projects appear as cards on the dashboard
2. Click on any project card to open it

**From a file:**
1. Use **File > Open** (or `Ctrl+O`)
2. Browse to your `.sws` project file
3. Click **"Open"**

---

### What file format does the app use?

Projects are saved as `.sws` files (SizeWise format). This is a JSON-based format that stores:
- All entities (rooms, ducts, equipment)
- Viewport position and zoom level
- Project settings and metadata

A backup file (`.sws.bak`) is automatically created each time you save.

---

## Canvas Navigation

### How do I pan (move) around the canvas?

There are several ways to pan:

| Method | Action |
|--------|--------|
| **Middle mouse button** | Click and drag to pan |
| **Scroll wheel** | Scroll to pan vertically |
| **Shift + Scroll wheel** | Scroll to pan horizontally |
| **Arrow keys** | Pan in small increments |
| **Spacebar + drag** | Hold spacebar and drag with left mouse |

---

### How do I zoom in and out?

| Method | Action |
|--------|--------|
| **Scroll wheel** | Scroll up to zoom in, down to zoom out |
| **`+` or `=` key** | Zoom in |
| **`-` key** | Zoom out |
| **`0` key** | Reset view to default zoom |
| **Pinch gesture** | On touchpad, pinch to zoom |
| **Zoom controls** | Use the zoom buttons in the bottom toolbar |

**Zoom range:** 10% to 500%

---

### How do I reset the view?

Press **`0`** (zero) to reset the view to:
- 100% zoom level
- Centered on the origin (0, 0)

Alternatively, use the **"Reset View"** button in the zoom controls.

---

### What do the coordinates in the status bar mean?

The status bar at the bottom shows:
- **X: 123.5 ft** - Horizontal position of cursor from origin
- **Y: 67.2 ft** - Vertical position of cursor from origin
- **Zoom: 100%** - Current zoom level
- **Entities: 42** - Total number of entities in the project

All measurements use the configured unit system (imperial: feet/inches or metric: meters).

---

### How do I show or hide the grid?

Press **`G`** to toggle the grid on/off.

You can also customize grid settings:
1. Open **View > Grid Settings**
2. Adjust grid size (default: 12 inches / 1 foot)
3. Toggle snap-to-grid on/off

---

## Tools Usage

### What tools are available?

| Tool | Shortcut | Description |
|------|----------|-------------|
| **Select** | `V` | Select, move, and manipulate entities |
| **Room** | `R` | Draw rectangular rooms |
| **Duct** | `D` | Draw duct runs |
| **Equipment** | `E` | Place HVAC equipment |
| **Fitting** | `F` | Add duct fittings (elbows, tees, etc.) |
| **Note** | `N` | Add text annotations |

---

### How do I select entities?

**Single selection:**
- Press `V` to activate the Select tool
- Click on any entity to select it

**Multi-selection:**
- **Shift+Click**: Add/remove entities from selection
- **Marquee selection**: Click and drag on empty space to create a selection rectangle

**Select all:**
- Press `Ctrl+A` to select all entities

**Clear selection:**
- Press `Escape` or click on empty canvas space

---

### How do I move entities?

1. Select the entity (or multiple entities)
2. Click and drag to move
3. Release to place

**Fine-tuning with arrow keys:**
- Arrow keys: Move 1 inch at a time
- Shift + Arrow keys: Move 1 foot (12 inches) at a time

---

### How do I delete entities?

1. Select the entity (or multiple entities)
2. Press **Delete** or **Backspace**

All deletions can be undone with `Ctrl+Z`.

---

### How do I duplicate entities?

1. Select the entity (or multiple entities)
2. Press **`Ctrl+D`**

Duplicates are placed offset by 2 feet from the original and automatically selected.

---

### How do I draw a room?

1. Press **`R`** to activate the Room tool
2. Click on the canvas to set the first corner
3. Drag to set the room size
4. Release to create the room

The room will display:
- Name (e.g., "Room 1")
- Dimensions (width x length)
- Calculated CFM requirement

**Tip:** Hold `Shift` while dragging to constrain to a square.

---

### How do I draw a duct?

1. Press **`D`** to activate the Duct tool
2. Click to start the duct
3. Drag to set length and direction
4. Release to create the duct

The duct will display:
- Type (round or rectangular)
- Dimensions (diameter or width x height)
- Airflow direction arrow
- CFM rating

---

### How do I edit entity properties?

1. Select the entity
2. View the **Inspector Panel** (right sidebar)
3. Edit properties directly in the inspector:
   - Name
   - Dimensions
   - Occupancy type (for rooms)
   - Material (for ducts)
   - And more...

Changes take effect immediately.

---

### How do I change the occupancy type of a room?

1. Select the room
2. In the Inspector Panel, find **"Occupancy Type"**
3. Select from the dropdown:
   - Office
   - Retail
   - Restaurant
   - Classroom
   - Conference Room
   - Healthcare
   - Laboratory
   - Warehouse
   - Residential

Each occupancy type has different ASHRAE 62.1 ventilation requirements.

---

## Project Management

### How do I save my project?

**Manual save:**
- Press **`Ctrl+S`**
- Or use **File > Save**

**Auto-save:**
The app automatically saves your work every 2 minutes (when changes are detected). A backup file is created before each save.

---

### Where are my projects stored?

**Desktop app:** Projects are saved wherever you choose when saving. Recent project locations are remembered.

**Web app:** Projects are stored in browser local storage by default. Use **File > Save As** to download as a `.sws` file.

---

### How do I export my design?

1. Click **File > Export** or use the Export menu
2. Choose export format:
   - **PNG/JPEG**: Image export
   - **PDF**: Print-ready document
   - **CSV**: Bill of materials data
   - **JSON**: Raw project data

3. Configure export options (resolution, page size, etc.)
4. Click **Export**

---

### How do I import a background image or floor plan?

1. Select **File > Import Image**
2. Choose your floor plan image (PNG, JPEG, or PDF)
3. The image appears as a background layer
4. Use the scale tool to match real-world dimensions

**Tip:** Trace over the floor plan using the Room tool to create your HVAC layout.

---

### Can I undo my changes?

Yes! Full undo/redo support is available:

| Action | Shortcut |
|--------|----------|
| **Undo** | `Ctrl+Z` |
| **Redo** | `Ctrl+Y` or `Ctrl+Shift+Z` |

The undo history stores up to **100 actions**.

---

### How do I recover from a corrupted file?

If your project file becomes corrupted:

1. The app automatically attempts to load the backup file (`.sws.bak`)
2. If successful, you'll see a notification that the project was recovered from backup
3. Save immediately to create a fresh main file

If both files are corrupted, check if you have any manual backups.

---

### How do I share a project with colleagues?

1. Save your project as a `.sws` file
2. Share the file via:
   - Email attachment
   - Cloud storage (Dropbox, Google Drive, OneDrive)
   - Network shared folder

Your colleague can open the `.sws` file in their SizeWise app.

---

## Keyboard Shortcuts

### Quick Reference

#### Editing

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+Shift+Z` | Redo (alternative) |
| `Ctrl+S` | Save project |
| `Ctrl+A` | Select all |
| `Ctrl+D` | Duplicate selected |
| `Delete` / `Backspace` | Delete selected |
| `Escape` | Clear selection / Cancel operation |

#### Tools

| Shortcut | Tool |
|----------|------|
| `V` | Select tool |
| `R` | Room tool |
| `D` | Duct tool |
| `E` | Equipment tool |
| `F` | Fitting tool |
| `N` | Note tool |

#### Viewport

| Shortcut | Action |
|----------|--------|
| `+` or `=` | Zoom in |
| `-` | Zoom out |
| `0` | Reset view |
| `G` | Toggle grid |
| Arrow keys | Pan / Nudge selection |
| `Shift` + Arrow keys | Large nudge (1 foot) |

---

### Why aren't my keyboard shortcuts working?

Keyboard shortcuts are disabled when:
- You're typing in a text input field
- A dialog box is open
- The canvas doesn't have focus

**Solution:** Click anywhere on the canvas to restore focus, then try the shortcut again.

---

## Related Documentation

- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Solutions for common problems
- **[GLOSSARY.md](./GLOSSARY.md)** - HVAC and technical terms
- **[QUICK_START.md](./QUICK_START.md)** - Getting started tutorial
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture overview

---

## Still Have Questions?

If you can't find an answer here:

1. Check the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide
2. Search our [GitHub Issues](https://github.com/your-org/hvac-canvas-app/issues)
3. Ask in [GitHub Discussions](https://github.com/your-org/hvac-canvas-app/discussions)
4. Report a bug by [creating an issue](https://github.com/your-org/hvac-canvas-app/issues/new)
