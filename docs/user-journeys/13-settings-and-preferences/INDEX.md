# Settings User Journeys


> **Implementation**: See [Platform Adapters](../../architecture/01-platform-adapters.md) for shared interface design.

This section is split by delivery mode:

## [Core / Shared](./UJ-SET-001-ApplicationSettings.md)
Global settings logic shared across platforms.
- [UJ-SET-001 Application Settings (Core)](./UJ-SET-001-ApplicationSettings.md)


## [Hybrid / Web](./hybrid/)
Browser-based configuration. Handles:
- **LocalStorage** Persistence
- **Cookie Clearing** Behavior
- [UJ-SET-001 Application Settings](./hybrid/UJ-SET-001-ApplicationSettings.md)

## [Tauri / Native](./tauri-offline/)
Desktop-based configuration. Handles:
- **File System** Persistence (`%APPDATA%`)
- **System Integation** (OS Theme / Language)
- [UJ-SET-001 Application Settings](./tauri-offline/UJ-SET-001-ApplicationSettings.md)