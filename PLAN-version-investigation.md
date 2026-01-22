# Investigation Plan: Version Discrepancy (v2.0)

## Overview
User reports "Desktop version runs an older version" than Web. While a port conflict (Zombie Process) is a primary suspect, we must investigate deeper possibilities: Data Source Divergence (FileSystem vs LocalStorage), Feature Flag Logic (`isTauri` bifurcation), and Build Pipeline issues.

## 🧠 Brainstorming Hypotheses

| Hypothesis | Probability | Description |
|------------|-------------|-------------|
| **A. Zombie Server** | High | Port 3000 held by old process; Desktop connects to it. |
| **B. Data Divergence** | High | Web sees LocalStorage (populated); Desktop sees FileSystem (empty/different). |
| **C. Logic Bifurcation** | Medium | `isTauri` flag disables new UI components (Tabs/Search) intentionally. |
| **D. Cache/Build Stale** | Low | Tauri caching old frontend assets or Service Worker interference. |
| **E. Detection Failure** | Low | `isTauri` returns `false` on Desktop, causing it to fall back to "Web Mode" (but with empty storage). |

## Task Breakdown

### Phase 1: The "Clean Slate" Audit (Environment)
1.  [ ] **Termination**: `taskkill` all node/next/tauri processes.
2.  [ ] **Cache Purge**: Delete `.next`, `build`, and Tauri temp dirs.
3.  [ ] **Fresh Start**: Run `npm run dev` (Web) and `npm run tauri:dev` (Desktop) sequentially.

### Phase 2: Codepath Investigation (Explorer Agent)
1.  [ ] **Data Source Logic**:
    - Verify `projectListStore.ts`: Does Desktop *merge* LocalStorage + Disk, or *replace* it?
    - *Risk*: If Desktop *only* scans disk and disk is empty, it looks "old" (missing recent work).
2.  [ ] **Feature Flags**:
    - Grep `isTauri` usage in `DashboardPage`, `Sidebar`, `Toolbar`.
    - Are "Tabs" or "New Project" buttons conditionally hidden?
3.  [ ] **Initialization Race**:
    - Analyze `AppInitializer.tsx`. Does `isTauri` set fast enough before UI renders?

### Phase 3: Runtime Verification (Debugger)
1.  [ ] **Version Marker**: Add a visual marker (e.g., "v2.0-TEST") to `DashboardPage` title temporarily.
    - If Web shows "v2.0-TEST" and Desktop doesn't -> **Zombie Server confirmed**.
    - If both show it -> **Logic/Data issue confirmed**.
2.  [ ] **Console Logs**: Add logs to `DashboardPage`: `console.log('Environment:', isTauri ? 'Desktop' : 'Web')`.

## Unification Strategy
1.  **Unified Data Layer**: Ensure Desktop can see *some* mock data or explicit "Empty State" that differs from "Broken/Old".
2.  **Explicit Config**: Hardcode Port 3000 check in start scripts.

## Success Criteria
- [ ] Visual Marker (v2.0-TEST) appears on BOTH platforms.
- [ ] "Active/Archived" tabs visible on BOTH platforms.
- [ ] `isTauri` correctly logs `true` on Desktop.
