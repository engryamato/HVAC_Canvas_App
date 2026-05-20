# File Management User Journeys


> **Implementation**: See [Platform Adapters](../../architecture/01-platform-adapters.md) for shared interface design.

This section is split by delivery mode:

## [Hybrid / Web](./hybrid/)
Browser-based storage. Handles:
- **localStorage** Persistence (AutoSave)
- **File API** (`<input type="file">`, `FileReader`)
- Browser Downloads (`jsPDF`, `Blob`)
- [UJ-FM-001 Manual Save](./hybrid/UJ-FM-001-ManualSave.md)
- [UJ-FM-002 Auto Save](./hybrid/UJ-FM-002-AutoSave.md)
- [UJ-FM-003 Clone Project](./hybrid/UJ-FM-003-SaveAs.md)
- [UJ-FM-004 Import Project](./hybrid/UJ-FM-004-LoadProjectFromFile.md)

## [Tauri / Native](./tauri-offline/)
Desktop-based storage. Handles:
- **Native File System** (`fs` API)
- **Native Dialogs** (`dialog.save`, `dialog.open`)
- Atomic Writes & Recovery
- [UJ-FM-001 Manual Save](./tauri-offline/UJ-FM-001-ManualSave.md)
- [UJ-FM-002 Auto Save](./tauri-offline/UJ-FM-002-AutoSave.md)
- [UJ-FM-003 Save As](./tauri-offline/UJ-FM-003-SaveAs.md)
- [UJ-FM-004 Load Project](./tauri-offline/UJ-FM-004-LoadProjectFromFile.md)
