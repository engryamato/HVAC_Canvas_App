# Canvas Navigation User Journeys

This section is split by delivery mode:

## [Hybrid / Web](./hybrid/)
Browser-based navigation. Handles:
- Touch Events (`preventDefault`)
- Pinch-to-Zoom (Gestures)
- Browser Chrome (Address Bar, Keyboard)
- [UJ-CN-001 Pan](./hybrid/UJ-CN-001-PanCanvas.md)
- [UJ-CN-002 Zoom](./hybrid/UJ-CN-002-ZoomCanvas.md)
- [UJ-CN-003 Fit](./hybrid/UJ-CN-003-FitToView.md)

## [Tauri / Native](./tauri-offline/)
Desktop-based navigation. Handles:
- Raw Mouse/Keyboard Events
- Multi-Monitor DPI
- Window Resizing
- [UJ-CN-001 Pan](./tauri-offline/UJ-CN-001-PanCanvas.md)
- [UJ-CN-002 Zoom](./tauri-offline/UJ-CN-002-ZoomCanvas.md)
- [UJ-CN-003 Fit](./tauri-offline/UJ-CN-003-FitToView.md)
