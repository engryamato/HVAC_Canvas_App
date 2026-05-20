# [UJ-KS-001] Canvas Shortcuts (Tauri Offline)

## Overview
This user journey describes the keyboard shortcuts available in the **Native Desktop Environment**.

## Prerequisites
- **API**: global shortcut registration (optional) or standard Window listeners.

## Shortcuts List

### File Operations
| Action | Shortcut | Note |
|--------|----------|------|
| New Project | `Ctrl + N` | Overrides Browser Default |
| Open Project | `Ctrl + O` | Overrides Browser Default |
| Save | `Ctrl + S` | Native Save |
| Save As | `Ctrl + Shift + S` | |
| Close Project | `Ctrl + W` | Closes Project (not app) |
| Quit App | `Alt + F4` / `Cmd + Q` | |

### Edit Operations
| Action | Shortcut | Note |
|--------|----------|------|
| Undo | `Ctrl + Z` | |
| Redo | `Ctrl + Y` / `Ctrl + Shift + Z` | |
| Select All | `Ctrl + A` | |
| Delete | `Delete` / `Backspace` | |

### View Operations
| Action | Shortcut | Note |
|--------|----------|------|
| Zoom In | `Ctrl + =` | |
| Zoom Out | `Ctrl + -` | |
| Fit All | `Ctrl + 0` | |
| Fullscreen | `F11` | |
| DevTools | `F12` / `Ctrl + Shift + I` | Enabled in Debug builds only |

## Edge Cases

### 1. OS Conflicts
**Scenario**: `Win + L` (Lock Screen).
**Handling**:
- **System**: Cannot override OS-level security keys.

## Related Documentation
- [Canvas Navigation](../02-canvas-navigation/tauri-offline/INDEX.md)
