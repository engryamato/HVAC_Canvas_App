# Error Handling User Journeys

This section is split by delivery mode:

## [Core / Shared](./UJ-ERR-001-ApplicationRecovery.md)
React Error Boundary logic.
- [UJ-ERR-001 Application Recovery (Core)](./UJ-ERR-001-ApplicationRecovery.md)


## [Hybrid / Web](./hybrid/)
Browser-based recovery. Handles:
- **Refresh Strategy** (F5 / Reload Context)
- **Offline Mode** (`navigator.onLine`)
- **Quota Management** (localStorage)
- [UJ-ERR-001 Application Recovery](./hybrid/UJ-ERR-001-ApplicationRecovery.md)
- [UJ-EH-006 Warning Notifications](./hybrid/UJ-EH-006-WarningNotifications.md)

## [Tauri / Native](./tauri-offline/)
Desktop-based recovery. Handles:
- **App Restart** (Relaunch Executable)
- **Panic Hooks** (Rust Backend Logging)
- **File Corruption** (Config Reset)
- [UJ-ERR-001 Application Recovery](./tauri-offline/UJ-ERR-001-ApplicationRecovery.md)
- [UJ-EH-006 Warning Notifications](./tauri-offline/UJ-EH-006-WarningNotifications.md)