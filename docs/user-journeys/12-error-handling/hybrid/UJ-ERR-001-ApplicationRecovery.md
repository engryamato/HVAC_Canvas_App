# User Journey: Application Recovery (Hybrid/Web)

## 1. Overview

### Purpose
This user journey describes how the Web Application handles runtime failures, network issues, and storage quota limits.

### Scope
- **Unhandled JS Exceptions** (React Error Boundary)
- **Network Loss** (Offline Mode)
- **Quota Exceeded** (IndexedDB/LocalStorage)

### User Personas
- **Primary**: HVAC Designer

### Success Criteria
- App alerts user to Network Offline state but allows read-only (or local edit) access.
- App handles storage limits gracefully.

## 2. PRD References

### Related PRD Sections
- **Section 6.1: Application Stability**

### Key Requirements Addressed
- REQ-WEB-003: Offline Capabilities (PWA)
- REQ-ERR-002: Recover from JS crashes

## 3. Prerequisites

### System Prerequisites
- Modern Browser with Service Worker support (optional but recommended).

## 4. User Journey Steps

### Step 1: Handling Network Disconnection
**User Actions:**
1. Internet connection drops while working.

**System Response:**
1. `navigator.onLine` becomes `false`.
2. UI shows "Offline Mode" badge.
3. App disables Cloud Sync (if applicable), queues changes locally in IndexedDB.

### Step 2: Runtime Crash (JS Error)
**User Actions:**
1. Trigger bugs (e.g. undefined property access).

**System Response:**
1. React Error Boundary catches error.
2. Displays "Something went wrong" UI.
3. Offers "Reload Page" (F5) button.
4. Auto-clears ephemeral session state to prevent immediate re-crash.

### Step 3: Storage Quota Exceeded
**User Actions:**
1. Try to save large project when disk/quota is full.

**System Response:**
1. Browser throws `QuotaExceededError`.
2. App catches error.
3. Alert: "Storage Full. Please delete old projects or clear site data."

## 5. Recovery Procedures

1. **Clear Site Data**
   - **Scenario**: App stuck in crash loop due to bad cache.
   - **Recovery**: User opens DevTools -> Application -> Clear Storage, or uses Browser "Clear History" for the site.

2. **Force Reload**
   - **Scenario**: Stale assets.
   - **Recovery**: Ctrl+Shift+R (Hard Reload).

## 6. Error Scenarios

1. **Third-party Script Blocked**
   - **Scenario**: Ad-blocker blocks analytics/scripts.
   - **Handling**: App should degrade gracefully, checking for object existence before call.

## 7. Performance
- Error boundaries are lightweight.
- Offline status check is event-driven.

## 8. Related Documentation
- [Prerequisites]: ../08-file-management/UJ-FIL-001-OpenProject.md