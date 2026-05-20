# [UJ-SB-002] Bottom Toolbar (Tauri Offline)

## Overview

This user journey covers the **Bottom Toolbar** (Dynamic Sizing Bar), a persistent bar at the bottom of the canvas editor containing essential action buttons (File Upload, Export, Process, Save, Settings, Notifications). All buttons display as icons with tooltips for space efficiency.

## PRD References

- **FR-SI-008**: User shall access global actions via Bottom Toolbar
- **US-SI-008**: As a designer, I want quick access to save, export, and settings so I can work efficiently
- **AC-SI-008-001**: Toolbar displays icon buttons with tooltips
- **AC-SI-008-002**: Settings button opens popover with Scale, Unit, and System Toggles
- **AC-SI-008-003**: Notification button shows drawer with previous notifications

## Prerequisites

- **Input**: Mouse / Keyboard.
- **Density**: Compact Desktop UI.
- User is in Canvas Editor.
- Bottom Toolbar is visible.

## User Journey Steps

### Step 1: View Bottom Toolbar

**Expected Result**:
- Toolbar visible at bottom of canvas viewport
- Icons displayed (left to right):
  1. 📁 File Upload
  2. 📤 Export
  3. ⚙️ Process
  4. 💾 Save
  5. 💾➕ Save and Exit
  6. ❌ Exit
  7. ⚙️ Settings
  8. 🔔 Notification (with badge if unread)
- Icons have tooltips on hover
- Toolbar height: ~48px
- Background: Semi-transparent dark gray

**Validation Method**: E2E test
```typescript
await expect(page.locator('.bottom-toolbar')).toBeVisible();
await page.hover('[aria-label="File Upload"]');
await expect(page.locator('text=File Upload')).toBeVisible(); // Tooltip
```

---

### Step 2: Open Settings Popover

**User Action**: Click ⚙️ Settings button

**Expected Result**:
- Popover opens **above** the Settings button
- Contains 3 sections:
  
  **1. Scale** (Dropdown):
  - English Default: "1/4" = 1'-0""
  - Metric Default: "1:50"
  - Options: [1/8"=1', 1/4"=1', 1/2"=1', 1:20, 1:50, 1:100]
  
  **2. Unit of Measure** (Dropdown):
  - Options: English, Metric
  - Affects all measurements globally
  
  **3. System Toggles** (Checkboxes):
  - ☑ Show Duct Warnings (Tooltip: "Show Duct Warnings")
  - ☑ Show Equipment Warnings (Tooltip: "Show Equipment Warnings")
  - ☑ Show Room Warnings (Tooltip: "Show Room Warnings")

- Click outside popover to close

**Validation Method**: E2E test
```typescript
await page.click('[aria-label="Settings"]');

await expect(page.locator('.settings-popover')).toBeVisible();
await expect(page.locator('select[name="scale"]')).toHaveValue('1/4"=1\'-0"');
await expect(page.locator('select[name="unitOfMeasure"]')).toHaveValue('English');

// Toggle  warning
await page.uncheck('input[name="ductWarnings"]');
await expect(page.locator('[data-warning-type="duct"]')).not.toBeVisible(); // Warnings hidden on canvas
```

---

### Step 3: View Notifications

**User Action**: Click 🔔 Notification button

**Expected Result**:
- Notification drawer slides down from top of Bottom Toolbar
- Shows list of recent notifications (max 20):
  - "File uploaded: floorplan.pdf" (timestamp: 2 mins ago)
  - "Progress saved" (timestamp: 5 mins ago)
  - ⚠️ "Duct Sizing Issue: Section 3 too small" (clickable, timestamp: 10 mins ago)
- Each notification has:
  - Icon (✓ success, ⚠️ warning, ❌ error)
  - Message text
  - Timestamp (relative: "2 mins ago")
  - Close button (X) at top-left of each item
- "Clear All" button at top-right of drawer
- Clicking warning notification highlights the related entity on canvas

**Validation Method**: E2E test
```typescript
await page.click('[aria-label="Notification"]');

await expect(page.locator('.notification-drawer')).toBeVisible();
await expect(page.locator('text=File uploaded')).toBeVisible();

// Click warning notification
await page.click('text=Duct Sizing Issue');
await expect(page.locator('.canvas-entity.highlighted[data-entity-id="duct-section-3"]')).toBeVisible();

// Close notification
await page.click('.notification-drawer .close-button');
await expect(page.locator('.notification-drawer')).not.toBeVisible();
```

---

### Step 4: Export Modal

**User Action**: Click 📤 Export button

**Expected Result**:
- Export Modal opens (center of screen)
- Options:
  - PDF (Canvas view)
  - JSON (Project data)
  - CSV (BoQ)
  - DWG (if available)
- User selects format and clicks "Download"
- Modal closes, file downloads

---

### Step 5: Process Calculations

**User Action**: Click ⚙️ Process button

**Expected Result**:
- Button shows loading spinner
- Toast: "Processing calculations..."
- Calculation Panel updates with new values
- Button returns to normal after ~2-5 seconds
- Success toast: "Calculations complete"

---

## Toast Notification Types

**Status Updates**:
- ✓ "File uploaded: {filename} has been uploaded"
- ✓ "Progress saved"
  
**Warnings** (Interactive - click to highlight entity):
- ⚠️ "Duct Sizing Issue: Section {N} too small"
- ⚠️ "Duct Sizing Issue: Section {N} too large"
- ⚠️ "Equipment Capacity Inadequate: {equipment tag}"
- ⚠️ "Equipment Capacity  Large: {equipment tag}"
- ⚠️ "Room Size Too Small: {room name}"
- ⚠️ "Room Size Too Large: {room name}"

**Loaders**:
- Three pulsating dots (⋯) for process/save operations

---

## Edge Cases

1. **Unsaved Changes on Exit**: Shows confirmation modal: "You have unsaved changes. Exit anyway?"
2. **Process Button Spamming**: Debounced to prevent multiple simultaneous calculations
3. **Notification Overflow**: Drawer scrolls if >10 notifications

## Related Documentation
- [Canvas Navigation](../02-canvas-navigation/tauri-offline/INDEX.md)
- [Application Settings](../../13-settings-and-preferences/tauri-offline/INDEX.md)

## Accessibility

- All buttons have `aria-label` for screen readers
- Popover traps focus when open, Escape key closes
