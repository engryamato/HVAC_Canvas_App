# Undo/Redo User Journeys

This section is split by delivery mode:

- `tauri-offline/` - Tauri environment
- `hybrid/` - Web environment

Command history logic is shared (Zustand store), but "Save Points" persistence may differ (File System vs IndexedDB).
