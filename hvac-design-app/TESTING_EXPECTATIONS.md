# Manual Testing Expectations Guide
## TauriStorageAdapter - What to Expect When Testing

This guide tells you EXACTLY what should happen when you click each test button in the StorageAdapterTest page.

---

## 🚀 Before You Start

### 1. Start Tauri App
```bash
cd hvac-design-app
npm run tauri:dev
```

### 2. Access Test Page
Navigate to the StorageAdapterTest page (you may need to temporarily add it to your router or main component)

### 3. What You'll See
- A list of 9 test buttons
- "Run All Tests" button
- "Clear Output" button
- A console output area (black background)
- Current Project ID display (initially "None")

---

## 📋 Test-by-Test Expectations

### ✅ TEST 1: Save Project

**What happens when you click:**
1. Console shows: `[timestamp] TEST 1: Save Project`
2. Console shows: `[timestamp] Creating project: {uuid}`
3. **Current Project ID updates** with the new UUID
4. Console shows: `[timestamp] ✅ Save successful!`
5. Console shows file path like: `Documents/SizeWise/Projects/{uuid}/{uuid}.hvac`
6. Console shows file size in bytes (typically ~1000-2000 bytes)

**What happens on your computer:**
- New folder created: `C:\Users\{YourName}\Documents\SizeWise\Projects\{uuid}\`
- Main file created: `{uuid}.hvac`
- Subfolders created: `.autosave/`, `.metadata/`, `exports/`

**If it fails:**
- Check console for error code (PERMISSION_DENIED, WRITE_ERROR, etc.)
- Verify Documents folder has write permissions
- Check if antivirus is blocking

---

### ✅ TEST 2: Load Project

**Prerequisites:** Must run Test 1 first (needs a project ID)

**What happens when you click:**
1. Console shows: `[timestamp] TEST 2: Load Project`
2. If no project ID: Shows `❌ No project ID available. Run Save test first.`
3. If project exists:
   - Console shows: `[timestamp] Loading project: {uuid}`
   - Console shows: `[timestamp] ✅ Load successful!`
   - Console shows: `[timestamp]    Project: Manual Test Project`
   - Console shows: `[timestamp]    Source: file` (means loaded from filesystem)
   - Console shows: `[timestamp]    Migrated: false` (no migration needed)

**What's verified:**
- File can be read from disk
- JSON is valid and parseable
- Project data matches what was saved
- Source is 'file' (not backup or autosave)

**If it fails:**
- Check error code
- `FILE_NOT_FOUND`: File was deleted or never created
- `CORRUPTED_FILE`: JSON is invalid
- `READ_ERROR`: Permission or disk issue

---

### ✅ TEST 3: List Projects

**What happens when you click:**
1. Console shows: `[timestamp] TEST 3: List Projects`
2. Console shows: `[timestamp] ✅ Found {N} project(s)`
3. For each project, shows:
   ```
   1. {Project Name} ({Project ID})
   2. {Project Name} ({Project ID})
   ...
   ```

**What's verified:**
- Can scan the `Documents/SizeWise/Projects/` directory
- Can read metadata from each `.hvac` file
- Projects are sorted by `modifiedAt` (newest first)

**Expected results:**
- After Test 1: Should show 1 project
- After multiple saves: Shows all created projects
- Each project shows its name and ID

**If it fails:**
- Directory doesn't exist
- Permission to read directory denied
- Files are corrupted

---

### ✅ TEST 4: Auto-Save

**Prerequisites:** Must run Test 1 first

**What happens when you click:**
1. Console shows: `[timestamp] TEST 4: Auto-Save`
2. Console shows: `[timestamp] Creating auto-save...`
3. Console shows: `[timestamp] ✅ Auto-save successful!`
4. Console shows timestamp like: `[timestamp]    Timestamp: 2024-02-02T19:57:00.000Z`
5. Console shows auto-save ID: `[timestamp]    Auto-save ID: {uuid}_2024-02-02T19:57:00.000Z`

**What happens on your computer:**
- New file created in: `{ProjectFolder}/.autosave/`
- Filename format: `2024-02-02T19-57-00.000Z.hvac`
- File contains complete project data

**What's verified:**
- Can write to .autosave folder
- Timestamp-based naming works
- Auto-save contains valid project data

**Note:** Auto-saves are limited to 5 copies (older ones deleted automatically)

---

### ✅ TEST 5: List Auto-Saves

**Prerequisites:** Must run Test 4 first (needs auto-saves)

**What happens when you click:**
1. Console shows: `[timestamp] TEST 5: List Auto-Saves`
2. Console shows: `[timestamp] ✅ Found {N} auto-save(s)`
3. For each auto-save, shows:
   ```
   1. 2024-02-02T19:57:00.000Z (1247 bytes)
   2. 2024-02-02T19:56:00.000Z (1245 bytes)
   ...
   ```

**What's verified:**
- Can read .autosave directory
- Auto-saves are sorted newest first
- File sizes are reported
- Maximum of 5 auto-saves kept

**Expected results:**
- After Test 4: Shows 1 auto-save
- After multiple auto-saves: Shows up to 5 (oldest deleted)

---

### ✅ TEST 6: Search Projects

**What happens when you click:**
1. Console shows: `[timestamp] TEST 6: Search Projects`
2. Console shows: `[timestamp] ✅ Found {N} matching project(s)`
3. Shows list of projects that match "test" (case-insensitive)

**What's searched:**
- Project name
- Project number
- Client name
- Location

**Expected results:**
- Shows "Manual Test Project" (from Test 1)
- Shows any other projects with "test" in the fields above

**What's verified:**
- Case-insensitive search works
- Multiple fields are searched
- Results include all matches

---

### ✅ TEST 7: Duplicate Project

**Prerequisites:** Must run Test 1 first

**What happens when you click:**
1. Console shows: `[timestamp] TEST 7: Duplicate Project`
2. Console shows: `[timestamp] ✅ Duplicate successful!`
3. Console shows new UUID: `[timestamp]    New ID: {new-uuid}`
4. Console shows: `[timestamp]    Name: Duplicated Test Project`

**What happens on your computer:**
- New folder created: `Documents/SizeWise/Projects/{new-uuid}/`
- New `.hvac` file with duplicated data
- All entities and settings preserved
- New timestamps (createdAt and modifiedAt)
- Different project ID

**What's verified:**
- Can create copy of project
- New ID is generated
- Name is updated
- All data is preserved
- Timestamps are reset

---

### ✅ TEST  8: Delete Project

**Prerequisites:** Must have a project (Test 1)

**⚠️ WARNING:** This DELETES the test project!

**What happens when you click:**
1. Console shows: `[timestamp] TEST 8: Delete Project`
2. Console shows: `[timestamp] Deleting project: {uuid}`
3. Console shows: `[timestamp] ✅ Delete successful!`
4. **Current Project ID clears** (shows "None")

**What happens on your computer:**
- Entire project folder deleted: `{ProjectFolder}/`
- Main file deleted: `{uuid}.hvac`
- Backup deleted: `{uuid}.hvac.bak`
- All auto-saves deleted
- Metadata deleted

**What's verified:**
- Can delete entire project directory
- Operation is idempotent (can call multiple times safely)

**Note:** You'll need to run Test 1 again to create a new project for further tests

---

### ✅ TEST 9: Storage Info

**What happens when you click:**
1. Console shows: `[timestamp] TEST 9: Get Storage Info`
2. Console shows: `[timestamp] ✅ Storage Info:`
3. Shows: `[timestamp]    Platform: tauri`
4. Shows: `[timestamp]    Storage Type: filesystem`
5. Shows: `[timestamp]    Quota Exceeded: false`

**What's verified:**
- Adapter correctly identifies platform
- Storage type is filesystem (not web storage)
- Quota status is available

**Expected values:**
- Platform: Always `tauri` (if in Tauri app)
- Storage Type: Always `filesystem`
- Quota Exceeded: Always `false` (filesystem has no quota)

---

## 🚀 Run All Tests Button

**What happens when you click:**
1. Executes Tests 1-9 in sequence
2. 500ms delay between each test
3. Complete output in console
4. Takes approximately 4-5 seconds total

**Expected final output:**
```
[timestamp] === Running All Tests ===
[timestamp] TEST 1: Save Project
[timestamp] ✅ Save successful!
... (all 9 tests)
[timestamp] === All Tests Complete ===
```

---

## 📂 File System Verification

### After Running Tests

**Navigate to:**
```
C:\Users\{YourName}\Documents\SizeWise\Projects\
```

**You should see:**
```
SizeWise/
└── Projects/
    └── {uuid}/                          # Your test project
        ├── {uuid}.hvac                  # Main file (1-2 KB)
        ├── {uuid}.hvac.bak              # Backup (same size)
        ├── .autosave/                   # Auto-save folder
        │   ├── 2024-02-02T19-57-00.000Z.hvac
        │   └── 2024-02-02T19-58-00.000Z.hvac
        ├── .metadata/                   # Metadata folder
        │   └── (empty for now)
        └── exports/                     # Exports folder
            └── (empty for now)
```

### Inspect a .hvac File

**Open with text editor:**
- Should be valid JSON
- Should have `schemaVersion: "1.0.0"`
- Should contain your project data
- Size: ~1000-2000 bytes

---

## 🐛 Troubleshooting

### "No project ID available"
- **Cause:** Test 1 hasn't been run
- **Fix:** Click "1. Save Project" first

### "❌ PERMISSION_DENIED"
- **Cause:** No write access to Documents folder
- **Fix:** Check folder permissions, run as admin (not recommended), or change Documents folder permissions

### "❌ FILE_NOT_FOUND"
- **Cause:** Project was deleted or never created
- **Fix:** Run Test 1 to create a project

### "❌ WRITE_ERROR"
- **Cause:** Disk full, antivirus blocking, or permission issue
- **Fix:** Free up disk space, check antivirus, verify permissions

### "❌ CORRUPTED_FILE"
- **Cause:** `.hvac` file contains invalid JSON
- **Fix:** Delete the project and create a new one

### Tests Not Visible
- **Cause:** Test page not loaded
- **Fix:** Check console for errors, verify import paths

### Platform shows "web" instead of "tauri"
- **Cause:** Running web version, not Tauri
- **Fix:** Use `npm run tauri dev` instead of `npm run dev`

---

## ✅ Success Criteria

After running all tests, verify:

- [ ] All 9 tests show ✅ in console
- [ ] Project folder exists in Documents/SizeWise/Projects/
- [ ] Main `.hvac` file exists and contains valid JSON
- [ ] Backup `.hvac.bak` file exists
- [ ] `.autosave/` folder contains auto-save files
- [ ] `.metadata/` folder exists (may be empty)
- [ ] `exports/` folder exists (may be empty)
- [ ] Test 3 lists all created projects
- [ ] Test 6 finds projects by search
- [ ] Test 7 creates duplicate with new ID
- [ ] Test 8 successfully deletes project
- [ ] No permission or write errors

---

## 🎯 What This Proves

Successfully completing all tests proves:

✅ TauriStorageAdapter is working correctly  
✅ File system permissions are configured  
✅ Folder structure matches specification  
✅ Atomic writes prevent corruption  
✅ Backups are created automatically  
✅ Auto-saves work with rolling window  
✅ Project discovery and search work  
✅ Duplication preserves all data  
✅ Deletion removes all files  
✅ Error handling works properly  

**Ready for integration with the rest of the app!** 🎉
