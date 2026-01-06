# Troubleshooting Guide

This guide provides solutions for common issues you may encounter while using the SizeWise HVAC Canvas App. For frequently asked questions about features and usage, see [FAQ.md](./FAQ.md).

---

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Application Issues](#application-issues)
  - [Performance Problems](#performance-problems)
  - [Browser Compatibility](#browser-compatibility)
  - [Memory Issues](#memory-issues)
- [Canvas Issues](#canvas-issues)
  - [Tool Problems](#tool-problems)
  - [Selection Issues](#selection-issues)
  - [Viewport/Navigation Problems](#viewportnavigation-problems)
  - [Keyboard Shortcut Issues](#keyboard-shortcut-issues)
- [Calculation Issues](#calculation-issues)
  - [CFM Calculation Problems](#cfm-calculation-problems)
  - [Area/Volume Errors](#areavolume-errors)
  - [Duct Sizing Discrepancies](#duct-sizing-discrepancies)
- [File Issues](#file-issues)
  - [Save/Load Errors](#saveload-errors)
  - [Corrupted Files](#corrupted-files)
  - [Export Problems](#export-problems)
- [Development Issues](#development-issues)
  - [Environment Setup](#environment-setup)
  - [Build Failures](#build-failures)
  - [Testing Issues](#testing-issues)
- [Deployment Issues](#deployment-issues)
  - [Desktop Build Problems](#desktop-build-problems)
  - [CI/CD Pipeline Failures](#cicd-pipeline-failures)
- [Getting Help](#getting-help)

---

## Quick Diagnostics

Before diving into specific issues, try these quick diagnostic steps:

### Basic Checklist

| Check | How to Verify | Fix |
|-------|--------------|-----|
| Browser up to date | Check browser version in Settings | Update to latest version |
| JavaScript enabled | Try another JavaScript-dependent site | Enable in browser settings |
| Sufficient memory | Check Task Manager / Activity Monitor | Close other tabs/apps |
| Canvas has focus | Click on the canvas | Click canvas before using shortcuts |
| No modal dialogs | Look for open dialogs | Close any open dialogs |

### Reset Steps

If something isn't working as expected:

1. **Refresh the page** - `Ctrl+R` or `F5`
2. **Clear browser cache** - `Ctrl+Shift+Delete`
3. **Try incognito mode** - Test without extensions
4. **Restart the app** - Close and reopen completely

---

## Application Issues

### Performance Problems

Issues related to slow rendering, laggy interactions, or unresponsive UI.

#### Canvas is slow or laggy

| Aspect | Details |
|--------|---------|
| **Problem** | Canvas interactions feel slow, delayed response to mouse movements |
| **Possible Causes** | Too many entities, browser performance mode, hardware acceleration disabled |
| **Solutions** | See detailed steps below |

**Troubleshooting steps:**

1. **Check entity count** - Look at the status bar (bottom of screen) for entity count
   - Under 200 entities: Should perform well
   - 200-500 entities: May experience some slowdown
   - 500+ entities: Consider splitting into multiple projects

2. **Enable hardware acceleration:**
   - Chrome: `Settings > System > Use hardware acceleration`
   - Firefox: `Settings > General > Performance > Use recommended settings`
   - Edge: `Settings > System > Use hardware acceleration`

3. **Close unnecessary tabs** - Each tab consumes memory and CPU

4. **Reduce zoom complexity** - Very high zoom levels (400%+) require more rendering

---

#### Application freezes or becomes unresponsive

| Aspect | Details |
|--------|---------|
| **Problem** | Application stops responding to input |
| **Possible Causes** | Memory exhaustion, infinite loop, large file operation |
| **Solutions** | Wait, then use recovery steps |

**Troubleshooting steps:**

1. **Wait 10-15 seconds** - Large operations may take time to complete
2. **Check for dialogs** - A modal dialog may be waiting for input behind another window
3. **Force refresh** - `Ctrl+Shift+R` for hard refresh
4. **If still frozen:**
   - Open Task Manager (`Ctrl+Shift+Esc` on Windows)
   - Find the browser tab/process
   - End the specific tab (not entire browser to preserve other work)
5. **After recovery:** Your work may be preserved in auto-save; reopen the project

---

### Browser Compatibility

#### App doesn't load or displays incorrectly

| Aspect | Details |
|--------|---------|
| **Problem** | Blank screen, layout broken, features missing |
| **Possible Causes** | Unsupported browser, outdated version, disabled features |
| **Solutions** | Update or switch browsers |

**Supported browsers:**

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 90+ | Recommended |
| Firefox | 88+ | Full support |
| Edge | 90+ | Full support |
| Safari | 14+ | Some features may vary |

**Troubleshooting steps:**

1. **Check browser version** - Update if below minimum
2. **Disable browser extensions** - Try incognito/private mode
3. **Check JavaScript** - Ensure JavaScript is enabled
4. **Try a different browser** - Rule out browser-specific issues

---

### Memory Issues

#### "Out of memory" errors or browser tab crashes

| Aspect | Details |
|--------|---------|
| **Problem** | Browser tab crashes, "Aw, Snap!" error, memory warnings |
| **Possible Causes** | Very large projects, too many browser tabs, system memory low |
| **Solutions** | Reduce memory usage |

**Troubleshooting steps:**

1. **Save your work immediately** - Use `Ctrl+S` if possible
2. **Close other browser tabs** - Free up memory
3. **Close other applications** - Especially memory-heavy apps
4. **Split large projects** - Break into smaller files by area/floor
5. **Restart the browser** - Clear accumulated memory leaks

**Prevention tips:**
- Keep projects under 500 entities when possible
- Save frequently to avoid losing work
- Use the desktop app for very large projects (better memory management)

---

## Canvas Issues

### Tool Problems

#### Tool doesn't respond to clicks

| Aspect | Details |
|--------|---------|
| **Problem** | Clicking on canvas doesn't create entity or perform action |
| **Possible Causes** | Wrong tool selected, canvas not focused, modifier key stuck |
| **Solutions** | Reset tool state |

**Troubleshooting steps:**

1. **Check active tool** - Look at toolbar; is the expected tool highlighted?
2. **Press `V`** - Switch to Select tool, then back to your desired tool
3. **Press `Escape`** - Cancel any in-progress operation
4. **Click on canvas** - Ensure canvas has focus (not a panel or dialog)
5. **Check for stuck keys** - Press and release `Shift`, `Ctrl`, `Alt`

---

#### Entity creation fails silently

| Aspect | Details |
|--------|---------|
| **Problem** | Drawing action completes but no entity appears |
| **Possible Causes** | Entity too small, created outside visible area, overlapping restrictions |
| **Solutions** | Check dimensions and position |

**Troubleshooting steps:**

1. **Check minimum size** - Rooms must be at least 1ft x 1ft
2. **Look at cursor position** - Entity created at click location
3. **Check zoom level** - Small entities may not be visible at low zoom
4. **Press `0`** - Reset view to find "lost" entities
5. **Use `Ctrl+A`** - Select all to see if entity exists

---

### Selection Issues

#### Can't select entities

| Aspect | Details |
|--------|---------|
| **Problem** | Clicking on entities doesn't select them |
| **Possible Causes** | Not using Select tool, entity locked, layer hidden |
| **Solutions** | Verify selection mode |

**Troubleshooting steps:**

1. **Press `V`** - Ensure Select tool is active
2. **Click directly on entity** - Not on empty space near it
3. **Check entity layers** - Some entities may be on hidden layers
4. **Try marquee selection** - Drag a rectangle over the entity
5. **Check for locks** - Entity may be locked (unlock in Inspector Panel)

---

#### Selection box doesn't appear or works incorrectly

| Aspect | Details |
|--------|---------|
| **Problem** | Dragging to create selection rectangle doesn't work |
| **Possible Causes** | Started drag on an entity, canvas not focused |
| **Solutions** | Start from empty space |

**Troubleshooting steps:**

1. **Start drag from empty space** - Not on an existing entity
2. **Click canvas first** - Ensure focus before dragging
3. **Check for interfering panels** - Resize or close side panels
4. **Disable snap-to-grid temporarily** - Press `G` to toggle

---

### Viewport/Navigation Problems

#### Can't pan or zoom

| Aspect | Details |
|--------|---------|
| **Problem** | Canvas doesn't move when trying to pan/zoom |
| **Possible Causes** | Touch/gesture conflict, focus issue, scroll hijacking |
| **Solutions** | Try alternative navigation methods |

**Troubleshooting steps:**

1. **Try middle mouse button** - Click and drag to pan
2. **Try keyboard** - Arrow keys to pan, `+`/`-` to zoom
3. **Try scroll wheel** - Zoom in/out
4. **Press `0`** - Reset view to origin
5. **Check browser zoom** - `Ctrl+0` to reset browser zoom (different from canvas zoom)

---

#### View jumps unexpectedly or resets

| Aspect | Details |
|--------|---------|
| **Problem** | Canvas view suddenly changes position without user action |
| **Possible Causes** | Auto-centering on selection, touchpad gesture, shortcut triggered |
| **Solutions** | Check input methods |

**Troubleshooting steps:**

1. **Check touchpad gestures** - Disable two-finger scroll if problematic
2. **Check mouse** - Middle button click may have triggered pan
3. **Check keyboard** - May have accidentally pressed `0` (reset) or arrow keys
4. **Disable browser gestures** - Some browsers have navigation gestures

---

### Keyboard Shortcut Issues

#### Shortcuts don't work

| Aspect | Details |
|--------|---------|
| **Problem** | Pressing shortcut keys has no effect |
| **Possible Causes** | Focus elsewhere, typing in field, dialog open |
| **Solutions** | Restore canvas focus |

**Troubleshooting steps:**

1. **Click on canvas** - Text fields capture keyboard input
2. **Close dialogs** - Modal dialogs capture all input
3. **Check Caps Lock** - Some shortcuts are case-sensitive
4. **Press `Escape` first** - Clear any active state
5. **Check browser shortcuts** - Some keys conflict with browser (e.g., `F1` for help)

**Common conflicts:**

| Key | Browser Action | App Action | Solution |
|-----|----------------|------------|----------|
| `F1` | Browser help | - | Use app's Help menu |
| `F5` | Refresh | - | Save first! |
| `F11` | Fullscreen | - | Use View menu |
| `Ctrl+W` | Close tab | - | Be careful! |

---

## Calculation Issues

### CFM Calculation Problems

#### CFM value seems too high or too low

| Aspect | Details |
|--------|---------|
| **Problem** | Calculated CFM doesn't match expectations |
| **Possible Causes** | Wrong occupancy type, incorrect dimensions, calculation method mismatch |
| **Solutions** | Verify inputs |

**Troubleshooting steps:**

1. **Check occupancy type** - Select room > Inspector Panel > Occupancy Type
2. **Verify dimensions** - Ensure width, length, and height are correct
3. **Check ceiling height** - Default is 10 ft; adjust if different
4. **Compare calculation methods:**
   - ASHRAE 62.1: Based on people + area
   - ACH method: Based on volume and air changes
5. **Manual verification:**
   ```
   ASHRAE: CFM = (Rp × People) + (Ra × Area)
   ACH: CFM = (Volume × ACH) / 60
   ```

**See also:** [FAQ - Why is my calculated CFM different from what I expected?](./FAQ.md#why-is-my-calculated-cfm-different-from-what-i-expected)

---

#### CFM shows as zero

| Aspect | Details |
|--------|---------|
| **Problem** | Room shows 0 CFM |
| **Possible Causes** | Invalid dimensions, missing properties, calculation error |
| **Solutions** | Set valid dimensions |

**Troubleshooting steps:**

1. **Check all dimensions are > 0** - Width, length, and ceiling height
2. **Check for NaN values** - Clear and re-enter dimensions
3. **Check occupancy type** - Ensure a type is selected
4. **Try recreating the room** - Delete and draw new

---

### Area/Volume Errors

#### Area or volume calculation is wrong

| Aspect | Details |
|--------|---------|
| **Problem** | Displayed area/volume doesn't match expected values |
| **Possible Causes** | Unit confusion, dimension entry errors, rounding |
| **Solutions** | Verify units and inputs |

**Troubleshooting steps:**

1. **Check unit system** - App uses feet and inches
2. **Verify dimension entry:**
   - Width and length in inches (internally) or as displayed
   - Example: 20 ft wide room = 240 inches
3. **Check ceiling height** - Used for volume calculation
4. **Manual verification:**
   ```
   Area (sq ft) = (Width in inches × Length in inches) / 144
   Volume (cu ft) = Area × Ceiling Height (ft)
   ```

---

### Duct Sizing Discrepancies

#### Duct size doesn't match manual calculations

| Aspect | Details |
|--------|---------|
| **Problem** | App suggests different duct size than hand calculations |
| **Possible Causes** | Different velocity assumptions, rounding differences, standard sizes |
| **Solutions** | Check assumptions |

**Troubleshooting steps:**

1. **Check velocity assumption:**
   - Main ducts: 1000-1800 FPM
   - Branch ducts: 600-1000 FPM
   - App may use different defaults
2. **Check for standard size rounding** - App rounds to standard duct sizes
3. **Verify CFM input** - Duct size based on required airflow
4. **Compare formulas:**
   ```
   Area (sq in) = (CFM × 144) / Velocity (FPM)
   Round duct diameter = √(Area × 4 / π)
   ```

**See also:** [FAQ - How does the app calculate duct sizes?](./FAQ.md#how-does-the-app-calculate-duct-sizes)

---

## File Issues

### Save/Load Errors

#### Can't save file

| Aspect | Details |
|--------|---------|
| **Problem** | Save operation fails with error |
| **Possible Causes** | Permission denied, disk full, path too long, network drive issues |
| **Solutions** | Try alternative location |

**Troubleshooting steps:**

1. **Try Save As to different location** - Use Documents or Desktop
2. **Check available disk space** - Need at least 50 MB free
3. **Check path length** - Windows has 260 character limit
4. **Check folder permissions** - Try a user-writable folder
5. **For network drives** - Save locally first, then copy

**Error messages:**

| Error | Meaning | Solution |
|-------|---------|----------|
| "Permission denied" | Can't write to location | Save elsewhere |
| "Disk full" | No storage space | Free up space |
| "Path too long" | Folder path exceeds limit | Use shorter path |
| "Network error" | Connection lost | Save locally |

---

#### Can't open file

| Aspect | Details |
|--------|---------|
| **Problem** | File fails to load or shows error |
| **Possible Causes** | Corrupted file, wrong version, invalid format |
| **Solutions** | Try recovery options |

**Troubleshooting steps:**

1. **Check file extension** - Must be `.sws`
2. **Try the backup file** - Look for `.sws.bak` in same folder
3. **Check file size** - 0 KB file is empty/corrupted
4. **Try opening in text editor** - Valid file should show JSON
5. **Check file version** - Older app versions may not open newer files

---

### Corrupted Files

#### File is corrupted and won't open

| Aspect | Details |
|--------|---------|
| **Problem** | Error message about corrupted or invalid file |
| **Possible Causes** | Interrupted save, disk error, file system corruption |
| **Solutions** | Recover from backup |

**Recovery procedure:**

1. **Automatic recovery** - App tries to load `.sws.bak` automatically
2. **Manual backup recovery:**
   ```
   1. Navigate to project folder
   2. Find: YourProject.sws.bak
   3. Copy to new location
   4. Rename copy to: YourProject-recovered.sws
   5. Open the recovered file
   ```
3. **JSON repair** (advanced):
   - Open `.sws` file in text editor
   - Look for obvious JSON errors (missing brackets, etc.)
   - Use online JSON validator to find issues
   - Fix and save (keep backup of broken file)

**Prevention:**
- Don't interrupt save operations
- Use reliable storage (avoid failing drives)
- Keep regular backups

---

### Export Problems

#### Export produces blank or incorrect output

| Aspect | Details |
|--------|---------|
| **Problem** | Exported file is empty, blank, or missing content |
| **Possible Causes** | Nothing selected, viewport issue, export settings |
| **Solutions** | Check export configuration |

**Troubleshooting steps:**

1. **Check "Selection only" option** - Uncheck to export all
2. **Verify viewport** - Entities must be in visible area for image export
3. **Check resolution setting** - 1x may produce small output
4. **Try different format** - PNG vs JPEG vs PDF
5. **Check for entity visibility** - Hidden layers won't export

---

## Development Issues

### Environment Setup

#### npm install fails

| Aspect | Details |
|--------|---------|
| **Problem** | Dependency installation fails with errors |
| **Possible Causes** | Node version mismatch, network issues, corrupted cache |
| **Solutions** | Clean and retry |

**Troubleshooting steps:**

1. **Check Node.js version:**
   ```bash
   node --version  # Should be 18.x or 20.x
   ```
2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```
3. **Check network** - Some corporate networks block npm registry
4. **Try using yarn:**
   ```bash
   yarn install
   ```

---

#### Rust/Tauri setup issues

| Aspect | Details |
|--------|---------|
| **Problem** | Desktop build fails due to Rust/Tauri issues |
| **Possible Causes** | Missing Rust toolchain, wrong version, missing dependencies |
| **Solutions** | Verify Tauri prerequisites |

**Troubleshooting steps:**

1. **Check Rust installation:**
   ```bash
   rustc --version  # Should be 1.70+
   cargo --version
   ```
2. **Update Rust:**
   ```bash
   rustup update stable
   ```
3. **Check Tauri CLI:**
   ```bash
   npm run tauri info
   ```
4. **Install platform dependencies:**
   - Windows: Visual Studio Build Tools, WebView2
   - macOS: Xcode Command Line Tools
   - Linux: Various packages (see Tauri docs)

**See also:** [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

---

### Build Failures

#### Build fails with TypeScript errors

| Aspect | Details |
|--------|---------|
| **Problem** | `npm run build` fails with type errors |
| **Possible Causes** | Type mismatches, missing types, strict mode violations |
| **Solutions** | Fix type errors |

**Troubleshooting steps:**

1. **Run type check:**
   ```bash
   npm run typecheck
   ```
2. **Check for missing dependencies:**
   ```bash
   npm install
   ```
3. **Clear build cache:**
   ```bash
   rm -rf dist
   rm -rf node_modules/.vite
   npm run build
   ```
4. **Check tsconfig.json** - Ensure correct settings

---

### Testing Issues

#### Tests fail unexpectedly

| Aspect | Details |
|--------|---------|
| **Problem** | Tests that should pass are failing |
| **Possible Causes** | Environment issues, stale state, async timing |
| **Solutions** | Reset test environment |

**Troubleshooting steps:**

1. **Run tests in isolation:**
   ```bash
   npm run test -- --run specific-test.test.ts
   ```
2. **Clear test cache:**
   ```bash
   npm run test -- --clearCache
   ```
3. **Check for async issues** - Add proper waits/assertions
4. **Update snapshots if intentional:**
   ```bash
   npm run test -- --updateSnapshot
   ```

**See also:** [TESTING.md](./TESTING.md)

---

## Deployment Issues

### Desktop Build Problems

#### Tauri build fails

| Aspect | Details |
|--------|---------|
| **Problem** | `npm run tauri build` fails |
| **Possible Causes** | Missing dependencies, signing issues, resource problems |
| **Solutions** | Check build requirements |

**Troubleshooting steps:**

1. **Check development build first:**
   ```bash
   npm run tauri dev
   ```
2. **Verify all dependencies:**
   ```bash
   npm run tauri info
   ```
3. **Check signing configuration** - Windows/macOS may require certificates
4. **Check resource files** - Icons, manifests must exist
5. **Try clean build:**
   ```bash
   rm -rf src-tauri/target
   npm run tauri build
   ```

---

### CI/CD Pipeline Failures

#### GitHub Actions workflow fails

| Aspect | Details |
|--------|---------|
| **Problem** | CI/CD pipeline fails to complete |
| **Possible Causes** | Environment differences, secret issues, timeout |
| **Solutions** | Check logs and configuration |

**Troubleshooting steps:**

1. **Check workflow logs** - Look for specific error messages
2. **Verify secrets** - Ensure all required secrets are configured
3. **Check cache** - Clear GitHub Actions cache if stale
4. **Run locally first:**
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   ```
5. **Check workflow file syntax** - YAML formatting issues

**See also:** [CI_CD.md](./CI_CD.md)

---

## Getting Help

If you've tried the troubleshooting steps and still need help:

### 1. Search Existing Issues

Check if someone else has encountered the same problem:
- [GitHub Issues](https://github.com/your-org/hvac-canvas-app/issues)

### 2. Gather Information

Before reporting an issue, collect:
- App version (from About dialog or package.json)
- Browser/OS version
- Steps to reproduce
- Error messages (exact text or screenshot)
- Console errors (`F12` > Console tab)

### 3. Report a Bug

Create a new issue with:
- Clear title describing the problem
- Detailed reproduction steps
- Expected vs. actual behavior
- System information
- Screenshots or screen recordings if helpful

### 4. Community Support

- [GitHub Discussions](https://github.com/your-org/hvac-canvas-app/discussions) - Ask questions
- Check [FAQ.md](./FAQ.md) for common questions

---

## Related Documentation

- **[FAQ.md](./FAQ.md)** - Frequently asked questions
- **[QUICK_START.md](./QUICK_START.md)** - Getting started guide
- **[TESTING.md](./TESTING.md)** - Testing documentation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture
- **[GLOSSARY.md](./GLOSSARY.md)** - HVAC terms and definitions
