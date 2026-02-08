# Quick Integration - TauriStorageAdapter Testing

## Quick Start (Choose ONE method)

### Method 1: Browser Console Test (Fastest)

1. **Start Tauri Dev**:
   ```bash
   npm run tauri dev
   ```

2. **Open DevTools** (F12 or Ctrl+Shift+I)

3. **Run in Console**:
   ```typescript
   // The test functions are automatically available if loaded
   window.runStorageTests()
   
   // To cleanup after:
   window.cleanupTestProjects()
   ```

### Method 2: Temporary Component Import (Most Visual)

**Edit your main component** (e.g., `src/App.tsx` or main page):

```typescript
import { useEffect } from 'react';
import { runStorageTests } from './test/manualStorageTest';

function App() {
  useEffect(() => {
    // Auto-run on app load
    runStorageTests();
  }, []);
  
  // ... rest of your component
}
```

### Method 3: Test Page UI (Most Interactive)

1. **Add route** (if you have a router):
   ```typescript
   import StorageAdapterTest from '@/pages/StorageAdapterTest';
   
   // Add to routes:
   <Route path="/storage-test" element={<StorageAdapterTest />} />
   ```

2. **OR temporary replace main page**:
   ```typescript
   import StorageAdapterTest from './pages/StorageAdapterTest';
   
   function App() {
     return <StorageAdapterTest />;
   }
   ```

3. **Navigate to** `/storage-test` or run the app

## What Gets Tested

All 13 methods of StorageAdapter interface:

- ✅ saveProject
- ✅ loadProject
- ✅ deleteProject
- ✅ duplicateProject
- ✅ listProjects
- ✅ searchProjects
- ✅ autoSave
- ✅ listAutoSaves
- ✅ restoreAutoSave
- ✅ cleanupAutoSaves
- ✅ updateMetadata
- ✅ saveThumbnail
- ✅ getStorageInfo

## Expected Results

### Console Output Example:
```
[StorageTest] 🚀 Starting TauriStorageAdapter Manual Tests...
[StorageTest] ================================================
[StorageTest] 📊 TEST 1: Get Storage Info
[StorageTest] ✅ Storage Info retrieved: {platform: 'tauri', storageType: 'filesystem'}
[StorageTest] 💾 TEST 2: Save Project
[StorageTest] ✅ Project saved successfully!
[StorageTest]    File path: Documents/SizeWise/Projects/abc-123/abc-123.hvac
[StorageTest]    Size: 1247 bytes
...
[StorageTest] ✅ ALL TESTS COMPLETE!
```

### File System Check:

After tests complete, verify folder exists:

**Windows**: `C:\Users\{YourName}\Documents\SizeWise\Projects\`

You should see:
```
SizeWise/
└── Projects/
    ├── abc-123-def-456/
    │   ├── abc-123-def-456.hvac
    │   ├── abc-123-def-456.hvac.bak
    │   ├── .autosave/
    │   │   ├── 2024-02-02T19-30-00.hvac
    │   │   └── 2024-02-02T19-30-01.hvac
    │   ├── .metadata/
    │   │   └── thumbnail.png
    │   └── exports/
    └── def-456-ghi-789/
        └── ... (similar structure)
```

## Troubleshooting

### Tests Don't Run
- **Check**: Are you in Tauri dev mode? (`npm run tauri dev`)
- **Check**: Is DevTools console open? (F12)
- **Check**: Any import errors in console?

### "Not running in Tauri environment"
- You're in web mode, not Tauri
- Run `npm run tauri dev` instead of `npm run dev`

### Permission Denied
- Check Documents folder permissions
- Close any programs accessing the files
- Try running as admin (not recommended)

### Files Not Created
- Check console for error messages
- Verify Tauri has filesystem permissions
- Check if antivirus is blocking

## Cleanup

After testing, remove test files:

**Option 1 - Auto Cleanup**:
```typescript
window.cleanupTestProjects()
```

**Option 2 - Manual Delete**:
1. Navigate to `Documents/SizeWise/Projects/`
2. Delete folders with "Manual Test" in names

**Option 3 - Delete Everything**:
```bash
# Windows
rmdir /s "C:\Users\{YourName}\Documents\SizeWise"

# Or use File Explorer
```

## Files Created

Three test helpers are available:

1. **`src/test/manualStorageTest.ts`** - Automated test script
   - Run programmatically
   - Console logging
   - Window functions available

2. **`src/pages/StorageAdapterTest.tsx`** - Interactive UI
   - Click buttons to test
   - Visual output
   - Step-by-step testing

3. **`MANUAL_TEST_GUIDE.md`** - Full documentation
   - Detailed instructions
   - Troubleshooting
   - Expected outputs

## Next Steps

After successful testing:

1. ✅ Verify all tests pass
2. ✅ Check file system structure
3. ✅ Inspect `.hvac` file contents
4. ✅ Test error conditions (permissions, disk space)
5. ⏳ Integrate with project management UI
6. ⏳ Add auto-save service
7. ⏳ Implement error toast notifications

## Success Criteria

✅ All 13 tests pass  
✅ Files created in correct location  
✅ Folder structure matches spec  
✅ .hvac files contain valid JSON  
✅ Auto-saves limited to 5 copies  
✅ Backups created on save  
✅ No permission errors  

When all criteria met → **Implementation verified!** ✨
