# Frequently Asked Questions (FAQ)

This document answers common questions about using the SizeWise HVAC Canvas App. For technical troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## Table of Contents

- [Getting Started](#getting-started)
- [Canvas Navigation](#canvas-navigation)
- [Tools Usage](#tools-usage)
- [HVAC Calculations & Standards](#hvac-calculations--standards)
- [File Operations](#file-operations)
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

## HVAC Calculations & Standards

This section covers the technical aspects of HVAC calculations used by the SizeWise app. For detailed term definitions, see the [GLOSSARY.md](./GLOSSARY.md).

---

### What is CFM and how is it calculated?

**CFM (Cubic Feet per Minute)** is the volumetric flow rate of air—the primary unit for sizing ductwork and ventilation systems.

**The app calculates CFM for rooms using two methods:**

| Method | Formula | Best For |
|--------|---------|----------|
| **ACH Method** | `CFM = (Volume × ACH) / 60` | Industrial, healthcare, labs |
| **ASHRAE 62.1** | `CFM = (Rp × People) + (Ra × Area)` | Commercial buildings |

**Example (ACH Method):**
- Room volume: 2,400 cu ft (20' × 12' × 10')
- Required ACH: 6
- CFM = (2,400 × 6) / 60 = **240 CFM**

**Example (ASHRAE 62.1 Method):**
- Office: 1,000 sq ft, 5 people
- Rp = 5 CFM/person, Ra = 0.06 CFM/sq ft
- CFM = (5 × 5) + (0.06 × 1000) = 25 + 60 = **85 CFM**

The app automatically selects the appropriate method based on the occupancy type you choose.

---

### What is ACH and when should I use it?

**ACH (Air Changes per Hour)** represents how many times the entire air volume in a space is replaced per hour.

**Use ACH when:**
- Designing spaces with specific air quality requirements (labs, hospitals)
- Local codes mandate minimum air changes
- Dealing with contamination control
- Industrial or manufacturing environments

**Typical ACH Requirements:**

| Space Type | Minimum ACH | Notes |
|------------|-------------|-------|
| **Residential** | 0.35 | Per ASHRAE 62.2 |
| **Office** | 4-6 | General ventilation |
| **Conference Room** | 6-8 | Higher occupancy variance |
| **Classroom** | 6-8 | Code varies by jurisdiction |
| **Laboratory** | 8-12 | Depends on hazard class |
| **Hospital OR** | 15-20 | Strict infection control |
| **Clean Room** | 20-600 | Depends on ISO class |

**Note:** ACH is volume-based, so taller ceilings require more CFM to achieve the same ACH.

---

### What is ASHRAE 62.1 and how does the app use it?

**ASHRAE Standard 62.1** is the industry standard for "Ventilation for Acceptable Indoor Air Quality" published by the American Society of Heating, Refrigerating and Air-Conditioning Engineers.

**Key concepts used by the app:**

1. **Breathing Zone Outdoor Airflow (Vbz):**
   - `Vbz = (Rp × Pz) + (Ra × Az)`
   - Where Pz = zone population, Az = zone floor area

2. **Rp (People Outdoor Air Rate):** CFM required per person
3. **Ra (Area Outdoor Air Rate):** CFM required per square foot

**ASHRAE 62.1 Default Values (used by the app):**

| Occupancy Type | Rp (CFM/person) | Ra (CFM/sq ft) | Default Density (people/1000 sq ft) |
|----------------|-----------------|----------------|-------------------------------------|
| **Office** | 5 | 0.06 | 5 |
| **Retail** | 7.5 | 0.12 | 15 |
| **Restaurant** | 7.5 | 0.18 | 70 |
| **Classroom** | 10 | 0.12 | 35 |
| **Conference Room** | 5 | 0.06 | 50 |
| **Healthcare (Exam)** | 5 | 0.06 | 20 |
| **Laboratory** | 10 | 0.18 | 25 |
| **Warehouse** | 10 | 0.06 | N/A |

**To change occupancy type:** Select the room → Inspector Panel → Occupancy Type dropdown.

---

### Why is my calculated CFM different from what I expected?

Common reasons for unexpected CFM values:

| Issue | Cause | Solution |
|-------|-------|----------|
| **CFM too high** | Wrong occupancy type selected | Check room's occupancy type in Inspector |
| **CFM too low** | Ceiling height not set | Set correct ceiling height (affects volume) |
| **CFM = 0** | Invalid dimensions | Ensure width, length, height are all > 0 |
| **CFM mismatch vs. manual calc** | App uses ASHRAE 62.1 by default | Check if manual calc used ACH method |
| **Different from old project** | Occupancy defaults updated | Verify current Rp/Ra values in settings |

**Verification steps:**
1. Select the room and check the Inspector Panel
2. Verify dimensions (width × length × ceiling height)
3. Confirm occupancy type matches intended use
4. Check if ceiling height is using the default or custom value

---

### How do I choose between round and rectangular ducts?

Both duct shapes can deliver the same CFM—the choice depends on installation constraints and efficiency:

| Factor | Round Duct | Rectangular Duct |
|--------|------------|------------------|
| **Airflow efficiency** | Better (less friction) | More friction loss |
| **Space efficiency** | Needs more clearance | Fits in tight spaces |
| **Cost** | Generally cheaper | More expensive to fabricate |
| **Noise** | Quieter | Can be noisier |
| **Fittings** | Simpler connections | More complex transitions |
| **Best for** | Main runs, high velocity | Low ceilings, tight plenums |

**Equivalent diameter:** The app calculates the equivalent round diameter for rectangular ducts to ensure proper sizing:

```
De = 1.30 × ((W × H)^0.625) / ((W + H)^0.25)
```

Where W = width, H = height (in inches)

---

### How does the app calculate duct sizes?

The app sizes ducts based on **airflow (CFM)** and **velocity (FPM - feet per minute)**:

**Basic Formula:**
```
Area (sq ft) = CFM / Velocity (FPM)
```

**Recommended Duct Velocities:**

| Duct Location | Velocity (FPM) | Noise Level |
|---------------|----------------|-------------|
| **Main trunk** | 1000-1800 | Moderate |
| **Branch ducts** | 600-1000 | Low |
| **Supply outlets** | 500-750 | Quiet |
| **Return inlets** | 400-600 | Very quiet |
| **Residential** | 600-900 | Low |
| **Commercial** | 1000-1500 | Acceptable |

**Example:**
- Required: 400 CFM at 1000 FPM
- Area = 400 / 1000 = 0.4 sq ft = 57.6 sq in
- Round duct diameter ≈ 8.5" (use 8" or 10" standard size)

**Tip:** Lower velocity = quieter operation but larger (more expensive) ductwork.

---

### What is pressure drop and why does it matter?

**Pressure drop** (or pressure loss) is the resistance to airflow in the duct system, measured in inches of water column (in. w.c. or in. w.g.).

**Why it matters:**
- The blower/fan must overcome total pressure drop
- Excessive pressure drop = undersized system, poor airflow, high energy use
- Too little pressure drop might indicate oversized ducts (wasted cost)

**What causes pressure drop:**

| Component | Typical Loss | Notes |
|-----------|--------------|-------|
| **Straight duct** | 0.08-0.10 in/100 ft | Friction loss |
| **90° elbow** | 0.05-0.15 in | Varies by radius |
| **Tee/branch** | 0.10-0.25 in | Splitting airflow |
| **Reducer** | 0.02-0.05 in | Velocity change |
| **Diffuser/grille** | 0.05-0.15 in | Terminal friction |
| **Filter** | 0.10-0.50 in | Clean vs. dirty |

**Target total pressure drop:**
- Residential: 0.08-0.10 in. w.c. per 100 ft equivalent length
- Commercial: 0.10-0.15 in. w.c. per 100 ft equivalent length

---

### What are the different occupancy types and when should I use each?

The app provides preset occupancy types based on ASHRAE 62.1 categories:

| Occupancy Type | Use For | Key Characteristics |
|----------------|---------|---------------------|
| **Office** | Workspaces, cubicles, private offices | Low density, moderate ventilation |
| **Retail** | Stores, malls, showrooms | Higher density, customer traffic |
| **Restaurant** | Dining areas (not kitchens) | Very high density, peak loads |
| **Classroom** | Schools, training rooms | Moderate-high density, code-driven |
| **Conference Room** | Meeting rooms, boardrooms | Variable occupancy, high peak CFM |
| **Healthcare** | Exam rooms, waiting areas | Infection control considerations |
| **Laboratory** | Research labs, prep areas | High ACH, fume hood exhaust |
| **Warehouse** | Storage, distribution centers | Low occupancy, large volumes |
| **Residential** | Homes, apartments | Per ASHRAE 62.2 (different standard) |

**Custom occupancy:** If your space doesn't match a preset, select the closest type and manually adjust CFM in the Inspector Panel.

---

### How do I handle spaces with variable occupancy?

For spaces like conference rooms or auditoriums where occupancy varies significantly:

1. **Design for peak:** Size for maximum expected occupancy
2. **Consider DCV:** Document potential for Demand-Controlled Ventilation (CO2 sensors)
3. **Use correct density:** Conference rooms use 50 people/1000 sq ft by default
4. **Note in design:** Add annotations about variable occupancy assumptions

**Best practice:** Size the ductwork for peak load, then specify variable-speed equipment or dampers in your BOM notes.

---

### How do I calculate ventilation for a room with mixed uses?

For multi-use spaces (e.g., office with break area):

**Option 1: Dominant use**
- Assign the primary occupancy type
- Suitable for 80%+ single-use spaces

**Option 2: Split the room**
- Draw separate rooms for each zone
- Apply appropriate occupancy to each
- Total CFM = sum of all zones

**Option 3: Worst-case design**
- Use the occupancy type with highest CFM requirement
- Most conservative approach

**Example:** Open office with coffee bar
- Option 1: Use "Office" type (dominant use)
- Option 2: Draw two rooms—office area + break area (as "Restaurant")
- Option 3: Use "Restaurant" type for whole space (over-designed but safe)

---

### What units does the app use for HVAC calculations?

| Measurement | Imperial Unit | Metric Unit* |
|-------------|---------------|--------------|
| **Airflow** | CFM (cu ft/min) | L/s or m³/h |
| **Velocity** | FPM (ft/min) | m/s |
| **Pressure** | in. w.c. | Pa |
| **Dimensions** | feet / inches | meters / mm |
| **Area** | sq ft | sq m |
| **Volume** | cu ft | cu m |

*Metric support: The app currently uses imperial units. Metric conversion is calculated internally for international code compliance but displayed values are imperial.

**Conversion factors:**
- 1 CFM = 0.4719 L/s = 1.699 m³/h
- 1 FPM = 0.00508 m/s
- 1 in. w.c. = 249 Pa

---

### Where can I learn more about HVAC standards?

**Official resources:**
- [ASHRAE 62.1](https://www.ashrae.org/technical-resources/standards-and-guidelines/read-only-versions-of-ashrae-standards) - Ventilation standard
- [SMACNA](https://www.smacna.org/) - Duct construction standards
- [ACCA Manual D](https://www.acca.org/standards/manual-d) - Residential duct design

**In-app resources:**
- [GLOSSARY.md](./GLOSSARY.md) - Full definitions of HVAC terms
- Inspector Panel - Hover over fields for tooltips
- Room/Duct properties - See calculated values and formulas

---

## File Operations

This section covers questions about saving, loading, and managing project files in the SizeWise HVAC Canvas App.

---

### What is the .sws file format?

The `.sws` (SizeWise) file format is the native project format for the HVAC Canvas App. It's a JSON-based format that stores your complete project data.

**File structure:**
```json
{
  "version": "1.0",
  "metadata": {
    "name": "Project Name",
    "client": "Client Name",
    "projectNumber": "PRJ-001",
    "location": "Building Address",
    "createdAt": "2024-01-15T10:30:00Z",
    "modifiedAt": "2024-01-15T14:45:00Z"
  },
  "viewport": {
    "offsetX": 0,
    "offsetY": 0,
    "zoom": 1.0
  },
  "entities": [
    // Array of all rooms, ducts, equipment, notes, etc.
  ],
  "settings": {
    // Project-specific settings
  }
}
```

**Key characteristics:**
- Human-readable JSON format (can be opened in any text editor)
- Stores all entities with their properties and positions
- Preserves viewport state (pan/zoom position)
- Includes project metadata and settings
- Version number enables future format migrations

---

### Can I manually edit an .sws file?

Yes, since `.sws` files are JSON format, you can edit them in any text editor. However, exercise caution:

**Safe to edit:**
- Project metadata (name, client, location)
- Notes and text content
- Simple property values

**Risky to edit:**
- Entity coordinates and dimensions
- ID references between entities
- Schema version number

**Best practices:**
1. Always create a backup before manual edits
2. Use a JSON validator to check syntax
3. Test the file after editing by opening in the app

**Warning:** Invalid JSON will prevent the file from loading. The app attempts to recover corrupted files from backups automatically.

---

### How does auto-save work?

The app automatically saves your project to prevent data loss:

**Auto-save behavior:**
- Triggers every **2 minutes** when changes are detected
- Creates a backup file before overwriting the main file
- Shows a brief save indicator in the status bar
- Does not interrupt your work

**Auto-save locations:**

| Platform | Auto-save Location |
|----------|-------------------|
| **Desktop app** | Same folder as original file |
| **Web app** | Browser local storage |

**Disabling auto-save:** Auto-save cannot be disabled, but you can save to a different location using **File > Save As** to manage versions manually.

---

### Where are backup files stored?

Backup files (`.sws.bak`) are created automatically to protect against data loss.

**Backup file naming:**
- Main file: `MyProject.sws`
- Backup file: `MyProject.sws.bak`

**When backups are created:**
- Before every manual save (`Ctrl+S`)
- Before every auto-save
- Before any file migration/upgrade

**Backup retention:**
- Only the most recent backup is kept
- Older backups are overwritten
- Backups are stored in the same directory as the main file

**Accessing backups:**
1. Navigate to your project folder
2. Look for files ending in `.sws.bak`
3. Rename to `.sws` to open as a project

---

### How do I recover a project from backup?

If your project file becomes corrupted or you need to restore a previous version:

**Automatic recovery:**
When opening a corrupted file, the app automatically:
1. Detects the corruption
2. Attempts to load the `.sws.bak` file
3. Notifies you if recovery was successful
4. Prompts you to save with a new name

**Manual recovery:**
1. Navigate to your project folder
2. Find the backup file (`ProjectName.sws.bak`)
3. Copy it to a new location
4. Rename the copy to `ProjectName-recovered.sws`
5. Open the renamed file in the app
6. Verify your work and save normally

**If both files are corrupted:**
- Check for any manual backups you may have created
- Look in cloud sync history (Dropbox, OneDrive, etc.)
- Check system backup/restore points

---

### What export formats are available?

The app supports multiple export formats for different use cases:

| Format | Extension | Best For | Contains |
|--------|-----------|----------|----------|
| **PNG** | `.png` | Sharing images, presentations | Canvas snapshot |
| **JPEG** | `.jpg` | Web use, smaller file size | Canvas snapshot (compressed) |
| **PDF** | `.pdf` | Printing, client deliverables | Vector graphics, multiple pages |
| **CSV** | `.csv` | Bill of materials, spreadsheets | Entity data in columns |
| **JSON** | `.json` | Data interchange, backup | Raw project data |

**Export options by format:**

**Image exports (PNG/JPEG):**
- Resolution: 1x, 2x, 4x
- Background: Transparent or white
- Selection only or entire canvas

**PDF export:**
- Page size: Letter, Legal, A4, Custom
- Orientation: Portrait or Landscape
- Scale: Fit to page or actual size
- Include metadata: Yes/No

**CSV export:**
- Includes all entities with properties
- Compatible with Excel, Google Sheets
- Useful for generating quotes

---

### How do I export just the Bill of Materials?

To export the BOM (Bill of Materials) for estimating:

1. Click **File > Export > Bill of Materials** (or **BOM** menu)
2. Choose export format:
   - **CSV**: For spreadsheets
   - **PDF**: For printing/sharing
3. Select what to include:
   - ☑ Duct materials
   - ☑ Fittings
   - ☑ Equipment
   - ☑ Registers/Diffusers
4. Click **Export**

**BOM data includes:**
- Item descriptions and quantities
- Sizes and specifications
- Material types
- Unit and total lengths (for ducts)
- Optional: pricing columns for manual entry

---

### Can I import projects from other software?

The app supports several import methods:

**Direct imports:**
- `.sws` files from other SizeWise installations
- `.json` files in compatible format

**Background image imports:**
| Format | Use Case |
|--------|----------|
| **PNG/JPEG** | Scan of existing floor plan |
| **PDF** | Architectural drawings |
| **DXF** | CAD file floor plans (limited support) |

**Importing a floor plan image:**
1. Select **File > Import Image**
2. Choose your image file
3. The image appears as a background layer
4. Use the **Scale Tool** to calibrate real-world dimensions:
   - Click two points on a known dimension
   - Enter the actual distance
   - The image scales automatically
5. Trace over the floor plan using the Room tool

**Note:** Imported images are for tracing reference only; they don't convert to editable entities.

---

### How do I share a project file with someone?

**Sharing the native project file:**
1. Save your project (`Ctrl+S`)
2. Locate the `.sws` file on your computer
3. Share via:
   - Email attachment (small projects)
   - Cloud storage link (Dropbox, Google Drive, OneDrive)
   - USB drive or network share
4. Recipient opens the file with their SizeWise app

**Important considerations:**
- Recipient needs the SizeWise app installed
- Ensure compatible app versions for seamless transfer
- Shared files don't sync automatically (each person has their own copy)

**For non-SizeWise users:**
Export as PDF for viewing, or CSV for data access.

---

### What happens if I open an older project file?

The app handles file version compatibility automatically:

**Forward compatibility:**
- Older `.sws` files are automatically upgraded to the current format
- A backup of the original file is created before migration
- All entities and settings are preserved
- You may see a notification about the upgrade

**Backward compatibility:**
- Newer files may not open in older app versions
- Critical features may be lost if downgrading
- Always update to the latest app version when collaborating

**Version information:**
The file version is stored in the JSON:
```json
{
  "version": "1.0",
  ...
}
```

If you encounter version issues, check that all team members are using the same app version.

---

### How much disk space do project files use?

Project file sizes depend on complexity:

| Project Size | Typical Entities | File Size |
|--------------|------------------|-----------|
| **Small** | < 50 | 50-200 KB |
| **Medium** | 50-200 | 200 KB - 1 MB |
| **Large** | 200-500 | 1-5 MB |
| **Very Large** | 500+ | 5-20 MB |

**What affects file size:**
- Number of entities (rooms, ducts, equipment)
- Complexity of properties
- Embedded notes and annotations
- Undo history is NOT stored (only current state)

**Reducing file size:**
- Delete unused entities
- Remove unnecessary annotations
- Export and re-import to clear metadata

---

### Where does the web app store my projects?

The web version stores projects in **browser local storage**:

**Storage details:**
- Location: Browser's local storage (per domain)
- Limit: ~5-10 MB total (varies by browser)
- Persistence: Data persists until cleared

**Limitations of local storage:**
- Not synced across devices
- Cleared if browser data is deleted
- Storage quota may be limited

**Best practice for web users:**
1. Always use **File > Save As** to download `.sws` files
2. Store downloaded files in a backed-up location
3. Don't rely solely on browser storage for important projects

**To access web storage:**
Your recent projects appear on the Dashboard automatically.

---

### Why can't I save to a specific location?

If you're having trouble saving to a particular folder:

**Possible causes:**

| Issue | Cause | Solution |
|-------|-------|----------|
| **Permission denied** | Folder requires admin rights | Save to Documents or Desktop |
| **Path too long** | Windows path limit exceeded | Use shorter folder names |
| **Network drive** | Connection issue | Save locally, then copy |
| **Read-only folder** | Folder is write-protected | Choose a different location |
| **Disk full** | No free space | Free up disk space |

**Web app limitations:**
The web version uses browser file dialogs, which may have additional restrictions. The desktop app provides full file system access.

---

### How do I create manual backups of my project?

While auto-backup is always enabled, you can create manual backups:

**Method 1: Save As**
1. Open your project
2. Use **File > Save As**
3. Save with a different name (e.g., `MyProject-backup-2024-01-15.sws`)

**Method 2: File copy**
1. Close the project (or ensure it's saved)
2. Navigate to the project folder
3. Copy both `.sws` and `.sws.bak` files
4. Paste to a backup location

**Recommended backup strategy:**
- Create dated backups at project milestones
- Store backups in a separate location (cloud or external drive)
- Keep at least 3 versions for important projects

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
