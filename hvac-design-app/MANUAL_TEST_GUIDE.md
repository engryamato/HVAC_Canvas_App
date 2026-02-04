# Manual Testing Guide for TauriStorageAdapter

## Quick Start

### Option 1: Run Tauri App and Navigate to Test Page

1. **Start the Tauri development server**:
   ```bash
   cd hvac-design-app
   npm run tauri dev
   ```

2. **Access the test page**:
   - You'll need to add the test page to your app's navigation
   - Or temporarily modify your main component to render the test page

### Option 2: Add Test Page to Your App (Temporary)

**If using a router**, add this route:
```typescript
import StorageAdapterTest from '@/pages/StorageAdapterTest';

// Add to your routes:
<Route path="/storage-test" element={<StorageAdapterTest />} />
```

**If no router**, temporarily replace your main page:
```typescript
// In your src/main.tsx or App.tsx
import StorageAdapterTest from './pages/StorageAdapterTest';

// Render:
<StorageAdapterTest />
```

### Option 3: Quick Console Test

Add this to your main app component's useEffect:

```typescript
import { createStorageAdapter } from '@/core/persistence/factory';

useEffect(() => {
  const testStorage = async () => {
    const adapter = await createStorageAdapter();
    
    // Create test project
    const testProject = {
      schemaVersion: '1.0.0',
      projectId: crypto.randomUUID(),
      projectName: 'Console Test Project',
      projectNumber: 'TEST-001',
      clientName: 'Test Client',
      location: 'Test Location',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      entities: { byId: {}, allIds: [] },
      scope: {
        projectType: 'commercial',
        details: [],
        materials: [],
      },
      siteConditions: {
        elevation: '500',
        outdoorTemp: '95',
        indoorTemp: '72',
        windSpeed: '90',
        humidity: '50',
        localCodes: 'IBC 2021',
      },
      isArchived: false,
    };
    
    // Save
    console.log('Saving project...');
    const saveResult = await adapter.saveProject(testProject);
    console.log('Save result:', saveResult);
    
    // Load
    console.log('Loading project...');
    const loadResult = await adapter.loadProject(testProject.projectId);
    console.log('Load result:', loadResult);
    
    // List
    console.log('Listing projects...');
    const projects = await adapter.listProjects();
    console.log('Projects:', projects);
  };
  
  testStorage();
}, []);
```

## What to Test

### 1. Save Project
- Click "1. Save Project"
- Check console for success message
- Verify file path shows: `Documents/SizeWise/Projects/{projectId}/{projectId}.hvac`

### 2. Load Project
- Click "2. Load Project" (requires Save first)
- Should show project loaded successfully
- Verify project name matches

### 3. List Projects
- Click "3. List Projects"
- Should show all projects in the directory
- Projects sorted by modified date (newest first)

### 4. Auto-Save
- Click "4. Auto-Save"
- Creates auto-save in `.autosave/` folder
- Timestamp-based filename

### 5. List Auto-Saves
- Click "5. List Auto-Saves"
- Shows all auto-saves for the current project
- Sorted newest first

### 6. Search Projects
- Click "6. Search Projects"
- Searches for "test" in project name, number, client, location

### 7. Duplicate Project
- Click "7. Duplicate Project"
- Creates copy with new ID and name
- All entities preserved

### 8. Delete Project
- Click "8. Delete Project"
- Removes entire project folder
- Idempotent (safe to call multiple times)

### 9. Storage Info
- Click "9. Storage Info"
- Shows platform and storage type

### Run All Tests
- Click "Run All Tests"
- Executes all tests in sequence
- Wait for completion (takes ~5 seconds)

## Verification

After running tests, verify the filesystem structure:

### On Windows
1. Open File Explorer
2. Navigate to: `C:\Users\{YourUsername}\Documents\SizeWise\Projects\`
3. You should see:
   ```
   SizeWise/
   └── Projects/
       └── {projectId}/
           ├── {projectId}.hvac
           ├── {projectId}.hvac.bak
           ├── .autosave/
           │   └── {timestamp}.hvac
           ├── .metadata/
           └── exports/
   ```

### Check File Contents
1. Open `.hvac` file with a text editor
2. Should see valid JSON with project data
3. Verify schema version is "1.0.0"

## Expected Output Examples

### Successful Save:
```
[10:30:15] TEST 1: Save Project
[10:30:15] Creating project: abc-123-def-456
[10:30:15] ✅ Save successful!
[10:30:15]    File path: Documents/SizeWise/Projects/abc-123-def-456/abc-123-def-456.hvac
[10:30:15]    Size: 1247 bytes
```

### Successful Load:
```
[10:30:16] TEST 2: Load Project
[10:30:16] Loading project: abc-123-def-456
[10:30:16] ✅ Load successful!
[10:30:16]    Project: Manual Test Project
[10:30:16]    Source: file
[10:30:16]    Migrated: false
```

### List Projects:
```
[10:30:17] TEST 3: List Projects
[10:30:17] ✅ Found 3 project(s)
[10:30:17]    1. Manual Test Project (abc-123-def-456)
[10:30:17]    2. Duplicated Test Project (def-456-ghi-789)
[10:30:17]    3. Another Project (ghi-789-jkl-012)
```

## Troubleshooting

### Error: "Permission Denied"
- Check if Documents folder has write permissions
- Try running as administrator (not recommended for production)
- Check antivirus blocking file access

### Error: "File Not Found"
- Ensure you run "Save Project" first
- Check if Documents/SizeWise/Projects exists
- Verify Tauri has filesystem permissions

### Error: "Validation Error"
- Project schema doesn't match ProjectFileSchema
- Check console for detailed validation errors
- Ensure all required fields are present

### Tests Not Running
- Open browser DevTools console (F12)
- Check for JavaScript errors
- Verify imports are correct
- Ensure Tauri is running (not web mode)

## Cleanup

To remove test data:
1. Navigate to `Documents/SizeWise/Projects/`
2. Delete the `Projects` folder
3. Or keep for further testing

## Notes

- Files use `.hvac` extension (not `.json`)
- Atomic writes prevent corruption on crash
- Auto-saves limited to 5 most recent
- Backups created automatically on save
- All operations are async

## Next Steps

After successful manual testing:
1. Integrate with project management stores
2. Add auto-save service hook
3. Create project dashboard UI
4. Add error handling toast notifications
5. Implement migration from old TauriFileSystem
