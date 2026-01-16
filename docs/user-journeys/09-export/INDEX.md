# Export User Journeys


> **Implementation**: See [Platform Adapters](../../architecture/01-platform-adapters.md) for shared interface design.

This section is split by delivery mode:

## [Hybrid / Web](./hybrid/)
Browser-based exports. Handles:
- **Blob Generation** (`URL.createObjectURL`)
- **Auto-Download** (`<a download>`)
- [UJ-EXP-001 Export PDF](./hybrid/UJ-EXP-001-ExportToPDF.md)
- [UJ-EXP-002 Export CSV](./hybrid/UJ-EXP-002-ExportToCSV.md)
- [UJ-EXP-003 Export JSON](./hybrid/UJ-EXP-003-ExportToJSON.md)

## [Tauri / Native](./tauri-offline/)
Desktop-based exports. Handles:
- **Native Save Dialog** (`dialog.save`)
- **Direct File Write** (`fs.write`)
- [UJ-EXP-001 Export PDF](./tauri-offline/UJ-EXP-001-ExportToPDF.md)
- [UJ-EXP-002 Export CSV](./tauri-offline/UJ-EXP-002-ExportToCSV.md)
- [UJ-EXP-003 Export JSON](./tauri-offline/UJ-EXP-003-ExportToJSON.md)