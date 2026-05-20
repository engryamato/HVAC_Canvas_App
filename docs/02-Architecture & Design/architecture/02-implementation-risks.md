# Implementation Risks & Assumptions

This document outlines critical assumptions and potential risks identified for the Hybrid/Native Platform Adapter architecture.

## 1. Runtime Environment
- **Assumption**: `window.__TAURI__` is the **exclusive** and **reliable** indicator of the Native environment.
- **Risk**: Future addition of "Electron" or "React Native" web views could break binary checks.
- **Mitigation**: Use a `PlatformDetector` service (e.g., `getPlatformType()`) instead of checking the window object directly in components.

## 2. Storage Capabilities (Quotas)
- **Assumption**: Average Project size (JSON + Entities) fits within **IndexedDB Quotas** (typically ~60-80% of available disk space).
- **Risk**: Large HVAC projects (>500MB) might trigger browser eviction policies, causing **Data Loss** on Web.
- **Mitigation**: Implement a `QuotaManager` in `WebAdapter` to warn users when storage exceeds safe thresholds, prompting a "Download Backup".

## 3. Feature Parity (UX Divergence)
- **Assumption**: "Save" implies persistence on both platforms.
- **Risk**: 
  - **Web**: Users expect "Cloud Sync" or "Auto-Save".
  - **Desktop**: Users expect "Write to File".
  - **Conflict**: Unifying these under one UI button might confuse users.
- **Mitigation**: Use distinct labels based on platform context: "Save to Device" (Web) vs "Save" (Desktop), even if utilizing the same `IFileService` interface.

## 4. File System Access
- **Assumption**: Browsers strictly enforce the **Trusted Event** rule (user interaction required for downloads).
- **Risk**: `IFileService.saveProject()` on Web cannot be "silent" regular auto-saves to disk are impossible without the File System Access API (which has partial support).
- **Mitigation**: The `saveProject` interface should return a status (`SAVED`, `PROMPT_SHOWN`, `DOWNLOAD_STARTED`) to allow the UI to react appropriately (e.g., showing a Toast vs waiting for a Dialog).

## 5. Offline Availability (PWA)
- **Assumption**: Web version is served as a PWA with robust Service Worker caching.
- **Risk**: "Hybrid" implies offline capability, but standard web deployments break without network access unless explicitly cached.
- **Mitigation**: Continuous E2E testing of Service Worker caching strategies to ensure the App Shell loads offline.
