# [UJ-FM-010] Import Reference Image

## Overview

This user journey covers importing floor plans or architectural drawings as background reference images, enabling designers to trace over existing layouts and maintain accurate spatial relationships.

## PRD References

- **FR-FM-010**: User shall be able to import reference images
- **US-FM-010**: As a designer, I want to import floor plans so that I can design HVAC layouts based on existing architecture
- **AC-FM-010-001**: Supports PNG, JPG, PDF image formats
- **AC-FM-010-002**: Reference image placed on Background layer
- **AC-FM-010-003**: Image opacity adjustable (default 50%)
- **AC-FM-010-004**: Image can be repositioned and scaled
- **AC-FM-010-005**: Image locked by default to prevent accidental moves
- **AC-FM-010-006**: Image embedded in project file or linked

## Prerequisites

- User is in Canvas Editor
- User has reference image file (floor plan, CAD drawing)
- Sufficient permissions to read image file
- Image file format supported (PNG, JPG, PDF)

## User Journey Steps

### Step 1: Trigger Import Reference Image

**User Action**: Click "Import Reference Image" in File menu

**Expected Result**:
- File menu interaction:
  - Open File menu
  - Option: "Import Reference Image..." (Ctrl+Shift+I)
  - Click option
- File picker dialog opens:
  - **Title**: "Select Reference Image"
  - **File types**: PNG, JPG, JPEG, PDF
  - **Default location**: User's Documents folder
  - **Filters**:
    - All Supported Images (*.png, *.jpg, *.jpeg, *.pdf)
    - PNG Images (*.png)
    - JPEG Images (*.jpg, *.jpeg)
    - PDF Documents (*.pdf)
  - **Buttons**: [Open] [Cancel]
- File browser:
  - Navigate file system
  - Preview pane (if available)
  - Multi-select disabled (one image at a time)
- Status bar:
  - "Select reference image to import..."

**Validation Method**: E2E test - Verify file picker opens

---

### Step 2: Select Image File

**User Action**: Select "FloorPlan_Office.png" and click Open

**Expected Result**:
- File selection:
  - Selected file: `/Users/john/Documents/FloorPlan_Office.png`
  - File size: 2.5 MB
  - Image dimensions: 3000×2400 px
  - File format: PNG
- File validation:
  - Check file exists: ✓
  - Check file readable: ✓
  - Check file size: < 50 MB ✓
  - Check format: PNG ✓
  - Validation passes
- File reading:
  - Read file as data URL
  - Or: Read file path for linking
  - Image data loaded
- Import options dialog:
  - **Title**: "Import Reference Image"
  - **Preview**: Thumbnail of image
  - **Options**:
    - **Import Mode**:
      - ⦿ Embed in Project (default)
        - Image data stored in .sws file
        - Increases file size
        - Portable (no external dependencies)
      - ◯ Link to File
        - Stores file path only
        - Smaller project file
        - Requires original file
    - **Scale**:
      - Auto-fit to canvas (default)
      - Custom scale: 1:1, 1:50, 1:100, Custom
    - **Opacity**: 50% (slider 0-100%)
    - **Layer**: Background (locked)
  - **Buttons**: [Import] [Cancel]
- Status bar:
  - "FloorPlan_Office.png (3000×2400, 2.5 MB)"

**Validation Method**: Integration test - Verify file reading and validation

---

### Step 3: Configure Import Settings

**User Action**: Set opacity to 40%, keep other defaults, click Import

**Expected Result**:
- Import configuration:
  - Mode: Embed
  - Scale: Auto-fit
  - Opacity: 40%
  - Layer: Background (locked)
- Image processing:
  - Load image into memory
  - Calculate auto-fit scale:
    - Canvas visible area: 1920×1080 px
    - Image size: 3000×2400 px
    - Scale factor: 0.36 (fit width)
    - Result size: 1080×864 px
  - Apply opacity: 40%
  - Convert to base64 (if embedding)
- Reference image entity created:
  - **ID**: `ref-img-uuid-123`
  - **Type**: `referenceImage`
  - **Path**: (embedded as data URL)
  - **Position**: (0, 0) - top-left corner
  - **Size**: 1080×864 (scaled)
  - **Original Size**: 3000×2400
  - **Scale**: 0.36
  - **Opacity**: 0.4
  - **Layer**: 'background'
  - **Locked**: true
  - **Visible**: true
- Entity added to store:
  - `entityStore.addEntity('ref-img-uuid-123', imageData)`
  - Added to Background layer
- Command created:
  - `ImportReferenceImageCommand` with image data
  - Added to history stack
- Status bar:
  - "Reference image imported"

**Validation Method**: Integration test - Verify image entity creation

---

### Step 4: Render Reference Image on Canvas

**User Action**: (Automatic)

**Expected Result**:
- Canvas rendering:
  - Reference image drawn first (bottom layer)
  - Position: (0, 0)
  - Size: 1080×864 px
  - Opacity: 40% (semi-transparent)
  - Blending: Normal
- Visual appearance:
  - Floor plan visible but faded
  - Easy to see overlaid HVAC entities
  - Readable text/dimensions on plan
  - Professional ghosted effect
- Layer order:
  - Background layer (reference image)
  - Supply layer (ducts, rooms)
  - Return layer
  - Equipment layer
  - Notes layer
  - Reference image behind all entities
- Locked state:
  - Click on image: No selection
  - Click passes through to entities behind
  - Cannot move, resize, delete
  - Protected from accidental edits
- Image quality:
  - Sharp rendering (no blur)
  - Maintains aspect ratio
  - No distortion
  - High-quality display
- Performance:
  - Canvas renders at 60fps
  - Image cached (no re-decode)
  - Smooth pan/zoom

**Validation Method**: E2E test - Verify image rendering and opacity

---

### Step 5: Adjust Reference Image Properties

**User Action**: Select image (unlock first), adjust opacity to 60% in Inspector

**Expected Result**:
- Unlock image:
  - Layers panel → Background layer
  - Click lock icon: 🔒 → 🔓
  - Layer unlocked
- Select image:
  - Click on reference image
  - Image selected (blue outline)
  - Selection handles visible
- Inspector displays:
  - **Reference Image Properties**
  - **File**: FloorPlan_Office.png
  - **Size**: 1080×864 (original: 3000×2400)
  - **Scale**: 36%
  - **Opacity**: 40% (slider)
  - **Position**: (0, 0)
  - **Rotation**: 0°
  - **Layer**: Background
  - **Locked**: Unlocked
  - **Visible**: ☑️
- Adjust opacity:
  - Drag slider: 40% → 60%
  - Real-time preview
  - Image becomes more opaque
- Entity updated:
  - `entityStore.updateEntity(imageId, { opacity: 0.6 })`
  - Property changed
- Canvas re-renders:
  - Image darker (60% opacity)
  - More prominent
  - Still see HVAC entities clearly
- Undo support:
  - `UpdatePropertyCommand` (opacity: 0.4 → 0.6)
  - Can undo opacity change
- Lock image again:
  - Click lock icon: 🔓 → 🔒
  - Prevent accidental moves

**Validation Method**: Integration test - Verify opacity adjustment

---

## Edge Cases

### 1. Import Large Image (20 MB, 10000×8000 px)

**User Action**: Import high-resolution CAD export

**Expected Behavior**:
- Large file warning:
  - File size: 20 MB
  - Dimensions: 10000×8000 px
  - Warning dialog:
    - "Large image detected (20 MB)"
    - "This may impact performance. Recommend scaling down."
    - Options:
      - [Import Full Resolution]
      - [Import Scaled (50%)] (recommended)
      - [Cancel]
- User chooses scaled:
  - Import at 50% resolution
  - Result: 5000×4000 px, ~5 MB
  - Downsampling applied
- Performance optimization:
  - Generate mipmap levels
  - Use lower resolution for zoom-out
  - Full resolution when zoomed in
  - Maintain responsiveness
- Memory usage:
  - Monitor memory: ~50 MB for image
  - If exceeds limit, warn user
  - Suggest external link instead of embed
- Alternative: Link mode
  - Don't embed 20 MB in project
  - Link to external file
  - Smaller project file

**Validation Method**: Performance test - Verify large image handling

---

### 2. Import PDF with Multiple Pages

**User Action**: Import multi-page PDF floor plan

**Expected Behavior**:
- PDF detection:
  - File: FloorPlans.pdf
  - Pages: 3 (First Floor, Second Floor, Basement)
- Page selection dialog:
  - **Title**: "Select PDF Page"
  - **Preview**: Thumbnails of all 3 pages
  - **List**:
    - ⦿ Page 1: First Floor (default)
    - ◯ Page 2: Second Floor
    - ◯ Page 3: Basement
  - **Buttons**: [Import Selected] [Import All] [Cancel]
- User selects page:
  - Choose Page 1 (First Floor)
  - Click "Import Selected"
- PDF rendering:
  - Render page 1 to image
  - Convert PDF → PNG (rasterize)
  - Resolution: 300 DPI
  - Result: High-quality image
- Import as normal:
  - Proceed with import options
  - Embed or link
  - Apply opacity, scale
- Import all pages:
  - Create 3 separate reference images
  - Stack on Background layer
  - Toggle visibility per page
  - Useful for multi-floor buildings

**Validation Method**: Integration test - Verify PDF import

---

### 3. Scale Reference Image to Match Dimensions

**User Action**: Set scale to match real-world dimensions (1" = 50')

**Expected Behavior**:
- Scale calculation:
  - Image shows scale: 1" = 50'
  - User measures distance on image:
    - Wall length: 200 px
    - Real-world: 100 feet
  - Calculate scale:
    - 200 px = 100 ft = 1200"
    - 1 px = 6"
    - Scale factor: 6"/px
- Set scale in Inspector:
  - **Scale Mode**: Real-world dimensions
  - **Scale**: 1" = 50' (or 1 px = 6")
  - Apply
- Canvas units update:
  - Grid spacing: 12" (1 foot)
  - Grid aligned with image
  - Entities sized correctly
- Entity placement:
  - Draw room: 20×30 ft
  - Appears correctly sized on image
  - Aligns with image walls
- Calibration tool:
  - Draw calibration line on image
  - Enter known length: 100 ft
  - Auto-calculate scale
  - Apply to image

**Validation Method**: Integration test - Verify scale calibration

---

### 4. Replace Reference Image

**User Action**: Import new image to replace existing reference

**Expected Behavior**:
- Import new image:
  - File → Import Reference Image
  - Select new file: FloorPlan_v2.png
  - Proceed with import
- Replace dialog:
  - **Warning**: "Reference image already exists"
  - **Options**:
    - ⦿ Replace existing
    - ◯ Add as additional image
  - [Continue] [Cancel]
- User replaces:
  - Delete old image
  - Import new image
  - Same position/scale preserved
  - Or: Reset to auto-fit
- Entities unchanged:
  - All HVAC entities remain
  - Positioned same as before
  - Now overlaid on new image
- Undo support:
  - `ReplaceReferenceImageCommand`
  - Undo restores old image
  - Entities unaffected
- Multiple images:
  - If user chooses "Add"
  - Both images visible
  - Stack on Background layer
  - Toggle visibility as needed

**Validation Method**: Integration test - Verify image replacement

---

### 5. Linked Image File Moved/Deleted

**User Action**: Open project where linked image file was moved

**Expected Behavior**:
- Project open:
  - Load project file
  - Reference image: Linked mode
  - Image path: `/Users/john/Documents/FloorPlan.png`
  - File check: NOT FOUND ❌
- Missing file handling:
  - Show placeholder:
    - Gray rectangle at image position
    - "Image Not Found" text
    - File path displayed
    - Broken link icon
  - Warning dialog:
    - "Reference image not found"
    - "File: /Users/john/Documents/FloorPlan.png"
    - Options:
      - [Locate File...] - Browse for moved file
      - [Remove Image] - Delete reference
      - [Ignore] - Continue without image
- User locates file:
  - File picker opens
  - User navigates to new location
  - Select file
  - Path updated
  - Image loads
- Entities preserved:
  - All HVAC entities still positioned correctly
  - Based on saved coordinates
  - Independent of image
- Embed recommendation:
  - Suggest embedding to avoid broken links
  - Convert linked → embedded
  - No external dependencies

**Validation Method**: Integration test - Verify missing file handling

---

## Error Scenarios

### 1. Unsupported File Format

**Scenario**: User tries to import .BMP or .TIFF file

**Expected Handling**:
- File selection:
  - User selects: FloorPlan.bmp
  - Format: BMP (unsupported)
- Format validation:
  - Check extension: .bmp
  - Not in supported list: [.png, .jpg, .jpeg, .pdf]
  - Validation fails
- Error dialog:
  - **Title**: "Unsupported File Format"
  - **Message**: "BMP images are not supported. Please convert to PNG or JPG."
  - **Supported formats**: PNG, JPG, JPEG, PDF
  - **Suggestion**: "Use an image editor to convert the file."
  - [OK]
- File picker remains open:
  - User can select different file
  - Or cancel import
- Workaround:
  - User converts BMP → PNG externally
  - Re-import as PNG

**Validation Method**: Unit test - Verify format validation

---

### 2. Image File Corrupted or Unreadable

**Scenario**: Image file corrupted, cannot decode

**Expected Handling**:
- File reading:
  - Read file: Success
  - Parse image: FAIL
  - Decoder error: "Invalid PNG data"
- Error handling:
  - Log error details
  - Show error dialog:
    - **Title**: "Cannot Load Image"
    - **Message**: "The image file is corrupted or unreadable."
    - **File**: FloorPlan.png
    - **Error**: "Invalid PNG header"
    - [Try Different File] [Cancel]
- No import:
  - Image entity not created
  - Canvas unchanged
  - Project state unchanged
- User action:
  - Try different file
  - Or: Repair corrupted file externally
  - Re-attempt import

**Validation Method**: Unit test - Verify corrupted file handling

---

### 3. Insufficient Memory for Large Image

**Scenario**: System low on memory, cannot load 50 MB image

**Expected Handling**:
- Memory check:
  - Available RAM: 500 MB
  - Image size (decoded): 60 MB (10000×8000 RGBA)
  - Memory limit: 80% of available = 400 MB
  - Image exceeds limit
- Warning dialog:
  - **Title**: "Image Too Large"
  - **Message**: "Insufficient memory to load image at full resolution."
  - **Options**:
    - [Import at 50% Resolution] (recommended)
    - [Import at 25% Resolution]
    - [Link Instead of Embed]
    - [Cancel]
- User chooses 50%:
  - Downsample image to 5000×4000
  - Memory: 15 MB (fits in limit)
  - Import succeeds
- Performance:
  - Lower resolution = faster rendering
  - Acceptable quality for reference
  - Smooth canvas interaction
- Alternative: External viewer
  - Link to high-res image
  - Open in external app
  - Use low-res in canvas

**Validation Method**: Integration test - Verify memory handling

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Import Reference Image | `Ctrl/Cmd + Shift + I` |
| Toggle Reference Image Visibility | `Ctrl/Cmd + Alt + R` |
| Lock/Unlock Reference Image | `Ctrl/Cmd + L` (with image selected) |
| Adjust Opacity (±10%) | `[` / `]` (with image selected) |

---

## Related Elements

- [ReferenceImageEntity](../../elements/03-entities/ReferenceImageEntity.md) - Image data structure
- [ImportReferenceImageCommand](../../elements/09-commands/ImportReferenceImageCommand.md) - Import undo/redo
- [ImageRenderer](../../elements/05-renderers/ImageRenderer.md) - Image drawing
- [FileIO](../../elements/10-persistence/FileIO.md) - File reading
- [layerStore](../../elements/02-stores/layerStore.md) - Layer management
- [UJ-EC-014](../03-entity-creation/UJ-EC-014-SetEntityLayer.md) - Layer assignment

---

## Visual Diagram

```
Reference Image Import Flow
┌────────────────────────────────────────────────────────┐
│  1. Trigger Import                                     │
│     File → Import Reference Image...                   │
│     ↓                                                  │
│  2. File Picker                                        │
│     ┌────────────────────────────────┐                 │
│     │ Select Reference Image         │                 │
│     ├────────────────────────────────┤                 │
│     │ 📁 Documents                   │                 │
│     │   📄 FloorPlan_Office.png      │ ← Selected      │
│     │   📄 Warehouse_Layout.jpg      │                 │
│     │   📄 Retail_Design.pdf         │                 │
│     │                                │                 │
│     │        [Open]  [Cancel]        │                 │
│     └────────────────────────────────┘                 │
│     ↓                                                  │
│  3. Import Options                                     │
│     ┌────────────────────────────────┐                 │
│     │ Import Reference Image         │                 │
│     ├────────────────────────────────┤                 │
│     │ [Thumbnail Preview]            │                 │
│     │                                │                 │
│     │ Import Mode:                   │                 │
│     │ ⦿ Embed in Project             │                 │
│     │ ◯ Link to File                 │                 │
│     │                                │                 │
│     │ Scale: [Auto-fit ▼]            │                 │
│     │ Opacity: [▬▬▬▬▬▬░░░░] 50%      │                 │
│     │ Layer: Background (locked)     │                 │
│     │                                │                 │
│     │       [Import]  [Cancel]       │                 │
│     └────────────────────────────────┘                 │
│     ↓                                                  │
│  4. Image Rendered on Canvas                           │
│     [Floor plan visible at 50% opacity]                │
│     Background layer, locked                           │
└────────────────────────────────────────────────────────┘

Canvas with Reference Image
┌────────────────────────────────────────────────────────┐
│  Background Layer (Locked, 40% opacity):               │
│  ┌────────────────────────────────────────────┐        │
│  │                                            │        │
│  │  [Faded floor plan showing walls,          │        │
│  │   rooms, doors, dimensions]                │        │
│  │                                            │        │
│  │   ┌─────┐     ┌─────┐                     │        │
│  │   │Room │     │Room │  ← HVAC entities    │        │
│  │   │  A  │─●───│  B  │  ← on top of image  │        │
│  │   └─────┘     └─────┘                     │        │
│  │                                            │        │
│  │  [Floor plan continues...]                 │        │
│  └────────────────────────────────────────────┘        │
│                                                        │
│  Opacity: 40% = Reference visible but not dominant     │
│  Entities: 100% = Clear, easy to see and edit          │
└────────────────────────────────────────────────────────┘

Inspector - Reference Image Properties
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────┐                      │
│  │ Reference Image Properties   │                      │
│  ├──────────────────────────────┤                      │
│  │ File: FloorPlan_Office.png   │                      │
│  │                              │                      │
│  │ Size: 1080 × 864             │                      │
│  │ Original: 3000 × 2400        │                      │
│  │ Scale: 36%                   │                      │
│  │                              │                      │
│  │ Opacity: [▬▬▬▬░░░░░░] 40%    │ ← Adjustable         │
│  │                              │                      │
│  │ Position:                    │                      │
│  │   X: 0"                      │                      │
│  │   Y: 0"                      │                      │
│  │                              │                      │
│  │ Rotation: 0°                 │                      │
│  │                              │                      │
│  │ Layer: Background            │                      │
│  │ Locked: ☑️                   │ ← Prevent edits       │
│  │ Visible: ☑️                  │                      │
│  │                              │                      │
│  │ [Replace Image...]           │                      │
│  │ [Remove Image]               │                      │
│  └──────────────────────────────┘                      │
└────────────────────────────────────────────────────────┘

Embed vs Link Mode
┌────────────────────────────────────────────────────────┐
│  Embed Mode:                                           │
│  ┌─────────────┐                                       │
│  │ Project.sws │                                       │
│  │ (Contains:) │                                       │
│  │ - Entities  │                                       │
│  │ - Settings  │                                       │
│  │ - Image ★   │ ← Image data embedded (base64)        │
│  └─────────────┘                                       │
│  • Portable (single file)                              │
│  • Larger file size                                    │
│  • No external dependencies                            │
│                                                        │
│  Link Mode:                                            │
│  ┌─────────────┐       ┌──────────────┐               │
│  │ Project.sws │──────→│ FloorPlan.png│               │
│  │ (Contains:) │  path │ (External)   │               │
│  │ - Entities  │       └──────────────┘               │
│  │ - Settings  │                                       │
│  │ - Path only │                                       │
│  └─────────────┘                                       │
│  • Smaller project file                                │
│  • Requires external file                              │
│  • Risk of broken link if file moved                   │
└────────────────────────────────────────────────────────┘

Scale Calibration
┌────────────────────────────────────────────────────────┐
│  1. Draw Calibration Line                              │
│     ●────────────────────────────● ← Known distance    │
│     User draws line along known dimension on image     │
│                                                        │
│  2. Enter Real-World Length                            │
│     ┌────────────────────────────┐                     │
│     │ Calibrate Scale            │                     │
│     │ Line length: 200 px        │                     │
│     │ Real-world: [100____] ft   │                     │
│     │                            │                     │
│     │ Calculated: 1 px = 6"      │                     │
│     │ Scale: 1" = 50'            │                     │
│     │                            │                     │
│     │       [Apply]  [Cancel]    │                     │
│     └────────────────────────────┘                     │
│     ↓                                                  │
│  3. Canvas Scaled                                      │
│     Grid: 12" (1 ft) aligned with image                │
│     Entities sized correctly                           │
│     Measurements accurate                              │
└────────────────────────────────────────────────────────┘

PDF Page Selection
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐              │
│  │ Select PDF Page                      │              │
│  ├──────────────────────────────────────┤              │
│  │ FloorPlans.pdf (3 pages)             │              │
│  │                                      │              │
│  │ ⦿ Page 1: First Floor                │              │
│  │   [Thumbnail]                        │              │
│  │                                      │              │
│  │ ◯ Page 2: Second Floor               │              │
│  │   [Thumbnail]                        │              │
│  │                                      │              │
│  │ ◯ Page 3: Basement                   │              │
│  │   [Thumbnail]                        │              │
│  │                                      │              │
│  │    [Import Selected]  [Import All]   │              │
│  │    [Cancel]                          │              │
│  └──────────────────────────────────────┘              │
└────────────────────────────────────────────────────────┘

Missing Linked Image
┌────────────────────────────────────────────────────────┐
│  Canvas Display:                                       │
│  ┌────────────────────────────────┐                    │
│  │ ╔════════════════════════════╗ │                    │
│  │ ║                            ║ │                    │
│  │ ║   ⚠️  Image Not Found      ║ │                    │
│  │ ║                            ║ │                    │
│  │ ║   FloorPlan.png            ║ │                    │
│  │ ║   /Users/john/Documents/   ║ │                    │
│  │ ║                            ║ │                    │
│  │ ╚════════════════════════════╝ │                    │
│  └────────────────────────────────┘                    │
│                                                        │
│  Warning Dialog:                                       │
│  ┌────────────────────────────────┐                    │
│  │ ⚠️  Reference Image Not Found  │                    │
│  ├────────────────────────────────┤                    │
│  │ File: FloorPlan.png            │                    │
│  │ Path: /Users/john/Documents/   │                    │
│  │                                │                    │
│  │ [Locate File...]               │                    │
│  │ [Remove Image]                 │                    │
│  │ [Ignore]                       │                    │
│  └────────────────────────────────┘                    │
└────────────────────────────────────────────────────────┘

Layer Order (Z-Index)
┌────────────────────────────────────────────────────────┐
│  Top (Foreground)                                      │
│  ├─ Notes Layer                                        │
│  ├─ Equipment Layer                                    │
│  ├─ Return Layer                                       │
│  ├─ Supply Layer                                       │
│  └─ Background Layer ← Reference Image                 │
│  Bottom (Background)                                   │
│                                                        │
│  Reference image always rendered first (behind all)    │
│  Provides backdrop for HVAC design                     │
│  Faded opacity allows entities to stand out            │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/commands/ImportReferenceImageCommand.test.ts`

**Test Cases**:
- Validate image file format
- Read image file
- Calculate auto-fit scale
- Create reference image entity
- Embed vs link mode
- Undo/redo import

**Assertions**:
- Supported formats accepted
- Unsupported formats rejected
- Image data loaded correctly
- Scale calculated based on canvas size
- Entity created with correct properties
- Embed stores base64, link stores path
- Undo removes image, redo restores

---

### Integration Tests
**File**: `src/__tests__/integration/import-reference-image.test.ts`

**Test Cases**:
- Complete import workflow
- Adjust opacity after import
- Lock/unlock image
- Replace existing image
- Import large image (downsampling)
- Import PDF (page selection)
- Handle missing linked file

**Assertions**:
- Image entity added to Background layer
- Opacity change updates rendering
- Locked image not selectable
- Old image removed, new image imported
- Large image downsampled correctly
- PDF page rendered to image
- Missing file shows placeholder

---

### E2E Tests
**File**: `e2e/file-management/import-reference-image.spec.ts`

**Test Cases**:
- Visual import flow
- File picker opens
- Image appears on canvas at 50% opacity
- Adjust opacity slider, see live preview
- Lock/unlock via layers panel
- Replace image workflow

**Assertions**:
- File picker dialog visible
- Image rendered on canvas
- Opacity matches setting (visual check)
- Slider updates image in real-time
- Lock icon changes, image not selectable
- New image replaces old visually

---

## Common Pitfalls

### ❌ Don't: Render reference image at full resolution always
**Problem**: 10000×8000 image causes lag, high memory usage

**Solution**: Downsample large images, use mipmaps for zoom levels

---

### ❌ Don't: Place reference image on editable layer
**Problem**: Accidentally select/move image when designing

**Solution**: Always use Background layer, locked by default

---

### ❌ Don't: Set opacity too high (>70%)
**Problem**: HVAC entities hard to see, reference dominates

**Solution**: Default 50%, recommend 30-60% range

---

### ✅ Do: Embed images for portability
**Benefit**: Single file contains everything, no broken links

---

### ✅ Do: Provide calibration tool for accurate scaling
**Benefit**: Ensures real-world dimensions match design

---

## Performance Tips

### Optimization: Generate Mipmaps for Large Images
**Problem**: Rendering 10000×8000 image when zoomed out is wasteful

**Solution**: Generate mipmap pyramid (50%, 25%, 12.5%)
- Use appropriate level for zoom
- Full resolution when zoomed in
- Lower resolution when zoomed out
- 10x faster rendering at low zoom

---

### Optimization: Cache Image Decode
**Problem**: Decoding PNG/JPG every frame is slow

**Solution**: Decode once, cache ImageBitmap
- Decode on import
- Store in GPU memory
- Reuse for every frame
- 100x faster rendering

---

### Optimization: Lazy Load Linked Images
**Problem**: Loading linked image on project open delays startup

**Solution**: Load image asynchronously in background
- Show placeholder immediately
- Load image in worker
- Replace placeholder when ready
- Non-blocking project open

---

## Future Enhancements

- **DWG/DXF Import**: Import AutoCAD files directly
- **Multi-Image Support**: Layer multiple references (background, site, ceiling)
- **Image Alignment Tools**: Rotate, skew to align with north/grid
- **Auto-Trace**: AI-powered detection of rooms from floor plan
- **Image Filters**: Brightness, contrast, grayscale adjustments
- **Image Cropping**: Crop to specific area before import
- **Geo-Referencing**: GPS coordinates for site plans
- **3D Model Import**: Import 3D building models for context
- **Image Annotations**: Mark up reference image with notes
- **Version Control**: Track changes to reference image over time
