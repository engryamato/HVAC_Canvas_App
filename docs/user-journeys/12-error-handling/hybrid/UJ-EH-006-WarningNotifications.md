# [UJ-EH-006] Warning Notifications and Interactive Alerts

## Overview

This user journey covers the warning notification system that alerts users to design issues (duct sizing problems, equipment capacity issues, room size warnings). Notifications appear as interactive toast messages and persist in the Notification Drawer accessible from the Bottom Toolbar. Clicking a warning highlights the affected entity on canvas.

## PRD References

- **FR-EH-006**: System shall display interactive warnings for design issues
- **US-EH-006**: As a designer, I want to be notified of potential issues so I can correct them
- **AC-EH-006-001**: Warnings appear as toast notifications with entity links
- **AC-EH-006-002**: Clicking warning highlights affected entity on canvas
- **AC-EH-006-003**: Warnings persisted in Notification Drawer
- **AC-EH-006-004**: Warning toggles in Bottom Toolbar Settings control visibility

## Prerequisites

- User is in Canvas Editor
- Calculations have been processed
- Entities exist on canvas (ducts, equipment, rooms)
- At least one design issue detected

## User Journey Steps

### Step 1: Warning Detected During Calculation

**User Action**: Click "Process" button in Bottom Toolbar

**Expected Result**:
- Calculation engine runs
- Design issues detected based on thresholds:
  - **Duct Sizing Issues**:
    - Too small: Velocity \u003e 1400 FPM
    - Too large: Velocity \u003c 400 FPM
  - **Equipment Capacity Issues**:
    - Inadequate: Output CFM \u003c Required CFM
    - Too large: Output CFM \u003e 150% Required CFM
  - **Room Size Issues**:
    - Too small: Area \u003c Min area for occupancy type
    - Too large: Area \u003e Max recommended area
- **Toast Notification** appears for each warning:
  - ⚠️ Icon (warning)
  - Message: \"Duct Sizing Issue: Section 3 too small\"
  - Click action: Highlights duct section
  - Auto-dismiss after 5 seconds OR user clicks close (X)
  - Yellow background (#FFF3CD)

**Validation Method**: E2E test
```typescript
await page.click('[aria-label=\"Process\"]');

// Wait for calculation
await waitFor(() => {
  expect(page.locator('.toast-warning')).toBeVisible();
});

await expect(page.locator('.toast-warning')).toContainText('Duct Sizing Issue');
await expect(page.locator('.toast-warning')).toContainText('Section 3 too small');
```

---

### Step 2: Click Warning to  Highlight Entity

**User Action**: Click on warning toast "Duct Sizing Issue: Section 3 too small"

**Expected Result**:
- Canvas pans/zooms to bring affected duct section into view
- Duct section highlighted:
  - Thick red pulsing outline (4px)
  - Red glow effect
  - Highlight persists for 3 seconds then fades
- Entity automatically selected in Inspector Panel
- Toast dismisses after click
- Focus shifts to canvas

**Validation Method**: E2E test
```typescript
await page.click('.toast-warning:has-text(\"Section 3\")');

// Verify highlight
await expect(page.locator('.canvas-entity.highlighted[data-entity-id=\"duct-section-3\"]')).toBeVisible();
await expect(page.locator('.canvas-entity.highlighted')).toHaveCSS('outline-color', 'rgb(220, 38, 38)'); // Red

// Verify selection
await expect(page.locator('.inspector-panel input[name=\"name\"]')).toHaveValue('Duct 3');
```

---

### Step 3: View Warning History in Notification Drawer

**User Action**: Click 🔔 Notification button in Bottom Toolbar

**Expected Result**:
- Notification Drawer slides down from toolbar
- Lists all warnings (most recent first):
  - ⚠️ \"Duct Sizing Issue: Section 3 too small\" (2 mins ago)
  - ⚠️ \"Equipment Capacity Inadequate: AHU-01\" (5 mins ago)
  - ⚠️ \"Room Size Too Large: Conference Room\" (10 mins ago)
  - ✓ \"Progress saved\" (15 mins ago)
- Each warning clickable to highlight entity
- Close button (X) on each notification
- Timestamp shows relative time
- Badge on notification icon shows unread count

**Validation Method**: E2E test
```typescript
await page.click('[aria-label=\"Notification\"]');

await expect(page.locator('.notification-drawer')).toBeVisible();
await expect(page.locator('.notification-item')).toHaveCount(4); // 3 warnings + 1 status

// Click warning in drawer
await page.click('.notification-item:has-text(\"AHU-01\")');
await expect(page.locator('.canvas-entity.highlighted[data-entity-id=\"equipment-ahu-01\"]')).toBeVisible();
```

---

### Step 4: Toggle Warning Visibility

**User Action**: Open Settings popover, uncheck "Show Duct Warnings"

**Expected Result**:
- Duct warning toast notifications stop appearing
- Existing duct warnings remain in drawer (history preserved)
- Calculation Panel duct rows still show color-coding (warnings calculated but not toasted)
- Other warnings (Equipment, Room) continue to appear
- Preference saved for session

**Validation Method**: E2E test
```typescript
await page.click('[aria-label=\"Settings\"]');
await page.uncheck('input[name=\"ductWarnings\"]');

// Trigger calculation
await page.click('[aria-label=\"Process\"]');

// Duct warnings should not toast
await expect(page.locator('.toast-warning:has-text(\"Duct\")')).not.toBeVisible();

// But warnings still calculated
await page.click('button:has-text(\"Calculation\")');
await expect(page.locator('tr.warning-row')).toBeVisible(); // Color-coded in table
```

---

## Warning Types and Messages

### Duct Warnings
```typescript
// Duct Section specific
\"Duct Sizing Issue: Section {N} too small\" // Velocity \u003e 1400 FPM
\"Duct Sizing Issue: Section {N} too large\" // Velocity \u003c 400 FPM
```

### Equipment Warnings
```typescript
\"Equipment Capacity Inadequate: {equipment tag}\" // Output \u003c Required
\"Equipment Capacity Large: {equipment tag}\"      // Output \u003e 150% Required
```

### Room Warnings
```typescript
\"Room Size Too Small: {room name}\"  // Area below minimum
\"Room Size Too Large: {room name}\"  // Area above recommended
```

### Status Notifications (Non-Warning)
```typescript
\"File uploaded: {filename} has been uploaded\"
\"Progress saved\"
\"Calculations complete\"
```

---

## Edge Cases

1. **Multiple Warnings for Same Entity**: Shows separate toast for each issue, stacked vertically
2. **Warning Resolved**: If issue fixed and re-calculated, toast shows \"✓ Issue resolved: Section 3 sizing corrected\"
3. **Notification Overflow**: Drawer scrolls if \u003e20 notifications, shows \"Clear All\" button
4. **Entity Deleted**: If warned entity is deleted, warning remains in drawer with strikethrough and note \"(Entity removed)\"

---

## Related Elements

- [NotificationService](../../elements/08-services/NotificationService.md)
- [WarningDetector](../../elements/06-calculators/WarningDetector.md)
- [Toast](../../elements/01-components/ui/Toast.md)
- [NotificationDrawer](../../elements/01-components/canvas/NotificationDrawer.md)
- [BottomToolbar - Settings](../../elements/01-components/canvas/BottomToolbar.md)

## Test Implementation

- E2E: `e2e/warnings/interactive-notifications.spec.ts`
- Integration: Warning detection logic, threshold validation
- Unit: Toast component, drawer rendering

---

## Error Scenarios

1. **Highlight Target Not Found**: Toast "Entity no longer exists", warning strikethrough
2. **Canvas Pan Failure**: Entity selected in sidebar, error logged
3. **Notification Storage Full**: FIFO auto-archive of oldest items

---

## Keyboard Shortcuts

| Action | Shortcut | Context |
|--------|----------|---------|
| Dismiss Current Toast | `Escape` | Toast visible |
| Open Notification Drawer | `Ctrl/Cmd+N` | Canvas active |
| Navigate Notifications | `Arrow Up/Down` | Drawer open |
| Activate Notification | `Enter` | Notification focused |

---

## Performance Considerations

- **Toast Stacking**: Maximum 3 simultaneous toasts
- **Highlight Animation**: 60fps CSS-only animation
- **Expected Response Time**: <100ms from click to highlight

---

## Accessibility

- Toast uses `role="alert"` with `aria-live="polite"`
- Color coding supplemented with icons (not color-only)

---

## Notes

- Warning thresholds: Duct 400-1400 FPM, Equipment 100-150% capacity
- Future: User-defined thresholds, email alerts, resolution wizard
