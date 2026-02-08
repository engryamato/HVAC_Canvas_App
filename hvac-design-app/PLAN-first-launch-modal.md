# Implementation Plan: First-Launch Modal for Automatic Folder Sync

> **Plan File:** `PLAN-first-launch-modal.md`  
> **Feature:** Automatic folder creation via first-launch onboarding modal  
> **Estimated Effort:** 9 hours | 12 tasks across 5 phases

---

## 🎯 Objective

Implement Option B from brainstorming: A professional onboarding modal that appears on first app launch, guides users to enable folder sync, and automatically creates the `Documents/SizeWise/Projects` folder structure after permission is granted.

---

## 📋 Socratic Gate: Design Decisions

Before implementation, confirm these choices:

### 1. Modal Persistence
**Show modal once ever or every session?**
- **Recommended:** Once ever (localStorage tracking)

### 2. Folder Location
**Allow changing folder location after setup?**
- **Recommended:** Yes, via Settings page

### 3. Migration Timing
**When to migrate existing IndexedDB projects?**
- **Recommended:** Auto-migrate immediately on setup

### 4. Dismissal Behavior
**What if user dismisses modal?**
- **Recommended:** Permanently dismissed, fall back to Browser Storage

### 5. Picker Cancellation
**User clicks "Enable" but cancels picker?**
- **Recommended:** Silent fallback + retry toast

---

## 📂 Files Created/Modified

### New Files (7)
- `src/features/onboarding/components/FirstLaunchModal.tsx`
- `src/features/onboarding/components/FolderSetupProgress.tsx`
- `src/features/onboarding/hooks/useFirstLaunch.ts`
- `src/features/onboarding/utils/folderSetupUtils.ts`
- `src/core/persistence/migrationHelper.ts`

### Modified Files (2)
- `src/core/persistence/directoryHandleManager.ts` - Add `createFolderStructure()`
- `src/features/dashboard/components/DashboardPage.tsx` - Wire up modal

---

## 🔧 Implementation Phases

### Phase 1: Core Utilities (2 hours)

**Task 1.1:** Enhance `directoryHandleManager.ts`
- Add `createFolderStructure()` function
- Add `verifyFolderStructure()` helper
- Automatically create `SizeWise/Projects` subdirectories

**Task 1.2:** Create `migrationHelper.ts`
- Implement `migrateProjectsFromIndexedDB()`
- Track migration progress
- Handle partial failures gracefully

---

### Phase 2: React Hooks (1 hour)

**Task 2.1:** Create `useFirstLaunch.ts`
- Detect first launch via localStorage
- Check for existing folder permission
- Provide `markAsCompleted()` function

---

### Phase 3: UI Components (3 hours)

**Task 3.1:** Create `FirstLaunchModal.tsx`
- Professional design with clear messaging
- Two buttons: "Enable Sync" / "Use Browser Storage"
- Loading state during setup
- Error handling for failures
- Accessibility (keyboard nav, ARIA)

**Task 3.2:** Create `FolderSetupProgress.tsx`
- Progress bar for migration
- Current project name display
- Error count display

---

### Phase 4: Integration (1 hour)

**Task 4.1:** Update `DashboardPage.tsx`
- Import `FirstLaunchModal` and `useFirstLaunch`
- Show modal on first launch (web only)
- Handle modal close events
- Refresh projects after setup

**Task 4.2:** Verify `factory.ts`
- Confirm FileSystemAccessAdapter auto-selected
- No code changes needed

---

### Phase 5: Testing & Verification (2 hours)

**Test 5.1:** First Launch Happy Path
- Modal appears → Enable Sync → Folder created → Projects work

**Test 5.2:** Browser Storage Option
- Click "Use Browser Storage" → IndexedDB used → Modal doesn't reappear

**Test 5.3:** Picker Cancellation
- Cancel picker → Error shown → Fallback to IndexedDB

**Test 5.4:** Project Migration
- Existing projects → Enable sync → All migrated → IndexedDB cleared

**Test 5.5:** Unsupported Browser
- Firefox/Safari → No modal → IndexedDB auto-used

---

## 📐 Architecture Flow

```
User Opens App
    ↓
First Launch? (Check localStorage + folder permission)
    ├─ Yes → Show FirstLaunchModal
    │   ├─ "Enable Sync" → showDirectoryPicker()
    │   │   ├─ User selects folder → createFolderStructure()
    │   │   │   → Save handle → Migrate projects → Use FileSystemAccessAdapter
    │   │   └─ User cancels → Toast error → Fallback to IndexedDB
    │   └─ "Use Browser Storage" → Use WebStorageAdapter
    └─ No → Check for folder permission
        ├─ Has permission → Use FileSystemAccessAdapter
        └─ No permission → Use WebStorageAdapter
```

---

## ✅ Success Criteria

- [ ] Modal appears on first launch (web only, Chrome/Edge)
- [ ] Folder structure auto-created after permission grant
- [ ] Existing projects migrated from IndexedDB
- [ ] Modal never reappears after completion
- [ ] Clear error messages for all failures
- [ ] Graceful IndexedDB fallback
- [ ] Zero TypeScript errors
- [ ] All tests passing
- [ ] Keyboard accessible

---

## 🚧 Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Browser not supported | Don't show modal, use IndexedDB |
| User cancels picker | Show error, fall back to IndexedDB |
| Permission denied | Show error with fix instructions |
| Migration fails | Save successful ones, list failures |
| Folder already exists | Use existing, don't error |
| No Documents folder | Allow any folder selection |

---

## ⏱️ Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1: Core Utilities | 2 hours | 2 |
| Phase 2: Hooks | 1 hour | 1 |
| Phase 3: UI Components | 3 hours | 2 |
| Phase 4: Integration | 1 hour | 2 |
| Phase 5: Testing | 2 hours | 5 |
| **Total** | **9 hours** | **12** |

---

## 🎬 Next Steps

1. **Confirm Socratic decisions** (at top of plan)
2. **Start Phase 1:** Create core utilities
3. **Build Phase 2:** React hook
4. **Design Phase 3:** UI components
5. **Wire Phase 4:** Integration
6. **Execute Phase 5:** Testing

---

**Status:** ⏸️ Awaiting confirmation on design decisions

**Created:** 2026-02-02  
**Author:** Antigravity AI
