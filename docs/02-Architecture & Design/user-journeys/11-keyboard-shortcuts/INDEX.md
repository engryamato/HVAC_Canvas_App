# Keyboard Shortcuts User Journeys

This section is split by delivery mode:

## [Core / Shared](./UJ-KB-001-CanvasShortcuts.md)
Universal shortcuts handled by React hooks.
- [UJ-KB-001 Canvas Shortcuts (Core)](./UJ-KB-001-CanvasShortcuts.md)


## [Hybrid / Web](./hybrid/)
Browser-based shortcuts. Handles:
- **Conflict Management** (`Ctrl+W`, `Ctrl+T` reserved)
- **Focus Safety** (Inputs vs Canvas)
- [UJ-KS-001 Canvas Shortcuts](./hybrid/UJ-KS-001-CanvasShortcuts.md)

## [Tauri / Native](./tauri-offline/)
Desktop-based shortcuts. Handles:
- **Native Defaults** (`Ctrl+N`, `Ctrl+O`)
- **App Control** (`Ctrl+Q`, `F11`)
- [UJ-KS-001 Canvas Shortcuts](./tauri-offline/UJ-KS-001-CanvasShortcuts.md)