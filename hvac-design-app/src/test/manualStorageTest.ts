/**
 * Standalone Test Script for TauriStorageAdapter
 * 
 * THIS FILE CAN BE TEMPORARILY IMPORTED AND RUN IN YOUR APP
 * 
 * Usage:
 * 1. Import this in your main component:
 *    import { runStorageTests } from '@/test/manualStorageTest';
 * 
 * 2. Call it in useEffect:
 *    useEffect(() => { runStorageTests(); }, []);
 * 
 * 3. Check the browser console for results
 * 
 * 4. Check your file system at: Documents/SizeWise/Projects/
 */

import { createStorageAdapter } from '@/core/persistence/factory';
import type { ProjectFile } from '@/core/schema/project-file.schema';

function log(message: string, data?: unknown) {
  console.log(`[StorageTest] ${message}`, data || '');
}

function createTestProject(name: string = 'Test Project'): ProjectFile {
  const projectId = crypto.randomUUID();
  
  return {
    schemaVersion: '1.0.0',
    projectId,
    projectName: name,
    projectNumber: `TEST-${Date.now()}`,
    clientName: 'Test Client Corp',
    location: 'Test City, USA',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    entities: {
      byId: {},
      allIds: [],
    },
    scope: {
      projectType: 'commercial',
      details: ['HVAC system design', 'Load calculations'],
      materials: [
        { type: 'Ductwork', grade: 'Standard' },
        { type: 'Insulation', grade: 'R-8' },
      ],
    },
    siteConditions: {
      elevation: '500',
      outdoorTemp: '95',
      indoorTemp: '72',
      windSpeed: '90',
      humidity: '50',
      localCodes: 'IBC 2021, IMC 2021',
    },
    isArchived: false,
    viewportState: {
      panX: 0,
      panY: 0,
      zoom: 1
    },
    settings: {
      unitSystem: 'imperial',
      gridSize: 12,
      gridVisible: true
    }
  };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runStorageTests() {
  log('🚀 Starting TauriStorageAdapter Manual Tests...');
  log('================================================');
  
  try {
    const adapter = await createStorageAdapter();
    let testProjectId: string = '';
    
    // Test 1: Get Storage Info
    log('\n📊 TEST 1: Get Storage Info');
    const storageInfo = await adapter.getStorageInfo();
    log('✅ Storage Info retrieved:', storageInfo);
    
    if (storageInfo.platform !== 'tauri') {
      log('⚠️  WARNING: Not running in Tauri environment!');
      log('   Tests may not work correctly in web mode.');
      return;
    }
    
    await sleep(500);
    
    // Test 2: Save Project
    log('\n💾 TEST 2: Save Project');
    const project1 = createTestProject('Manual Test Project #1');
    testProjectId = project1.projectId;
    
    const saveResult = await adapter.saveProject(project1);
    if (saveResult.success) {
      log('✅ Project saved successfully!');
      log('   File path:', saveResult.filePath);
      log('   Size:', `${saveResult.sizeBytes} bytes`);
    } else {
      log('❌ Save failed:', { code: saveResult.errorCode, error: saveResult.error });
      return;
    }
    
    await sleep(500);
    
    // Test 3: Load Project
    log('\n📂 TEST 3: Load Project');
    const loadResult = await adapter.loadProject(testProjectId);
    if (loadResult.success && loadResult.project) {
      log('✅ Project loaded successfully!');
      log('   Name:', loadResult.project.projectName);
      log('   Source:', loadResult.source);
      log('   ID matches:', loadResult.project.projectId === testProjectId);
    } else {
      log('❌ Load failed:', { code: loadResult.errorCode, error: loadResult.error });
    }
    
    await sleep(500);
    
    // Test 4: Auto-Save
    log('\n⏰ TEST 4: Auto-Save');
    const autoSaveResult = await adapter.autoSave(project1);
    if (autoSaveResult.success) {
      log('✅ Auto-save created!');
      log('   Timestamp:', autoSaveResult.timestamp);
      log('   Auto-save ID:', autoSaveResult.autoSaveId);
    } else {
      log('❌ Auto-save failed:', autoSaveResult.errorCode);
    }
    
    await sleep(500);
    
    // Test 5: Create another auto-save
    log('\n⏰ TEST 5: Creating second auto-save...');
    await sleep(1000); // Wait 1 second for different timestamp
    const autoSaveResult2 = await adapter.autoSave(project1);
    if (autoSaveResult2.success) {
      log('✅ Second auto-save created!');
    }
    
    await sleep(500);
    
    // Test 6: List Auto-Saves
    log('\n📋 TEST 6: List Auto-Saves');
    const autoSaves = await adapter.listAutoSaves(testProjectId);
    log(`✅ Found ${autoSaves.length} auto-save(s):`);
    autoSaves.forEach((a, i) => {
      log(`   ${i + 1}. ${a.timestamp} (${a.sizeBytes} bytes)`);
    });
    
    await sleep(500);
    
    // Test 7: Save Another Project
    log('\n💾 TEST 7: Save Another Project');
    const project2 = createTestProject('Manual Test Project #2');
    const saveResult2 = await adapter.saveProject(project2);
    if (saveResult2.success) {
      log('✅ Second project saved!');
    }
    
    await sleep(500);
    
    // Test 8: List All Projects
    log('\n📋 TEST 8: List All Projects');
    const allProjects = await adapter.listProjects();
    log(`✅ Found ${allProjects.length} project(s):`);
    allProjects.forEach((p, i) => {
      log(`   ${i + 1}. ${p.projectName} (${p.projectId.substring(0, 8)}...)`);
      log(`      Modified: ${new Date(p.modifiedAt).toLocaleString()}`);
    });
    
    await sleep(500);
    
    // Test 9: Search Projects
    log('\n🔍 TEST 9: Search Projects');
    const searchResults = await adapter.searchProjects('Manual Test');
    log(`✅ Search for "Manual Test" found ${searchResults.length} result(s):`);
    searchResults.forEach((p, i) => {
      log(`   ${i + 1}. ${p.projectName}`);
    });
    
    await sleep(500);
    
    // Test 10: Duplicate Project
    log('\n📄 TEST 10: Duplicate Project');
    const dupeResult = await adapter.duplicateProject(
      testProjectId,
      'DUPLICATED - Manual Test Project #1'
    );
    if (dupeResult.success && dupeResult.project) {
      log('✅ Project duplicated!');
      log('   Original ID:', testProjectId);
      log('   New ID:', dupeResult.project.projectId);
      log('   New Name:', dupeResult.project.projectName);
      log('   IDs different:', dupeResult.project.projectId !== testProjectId);
    } else {
      log('❌ Duplicate failed:', dupeResult.errorCode);
    }
    
    await sleep(500);
    
    // Test 11: Update Metadata
    log('\n✏️  TEST 11: Update Metadata');
    try {
      await adapter.updateMetadata(testProjectId, {
        projectName: 'UPDATED - Manual Test Project #1',
        clientName: 'Updated Client Corp',
      });
      log('✅ Metadata updated!');
      
      // Verify
      const verifyLoad = await adapter.loadProject(testProjectId);
      if (verifyLoad.success && verifyLoad.project) {
        log('   New name:', verifyLoad.project.projectName);
        log('   New client:', verifyLoad.project.clientName);
      }
    } catch (error) {
      log('❌ Update failed:', error);
    }
    
    await sleep(500);
    
    // Test 12: Restore Auto-Save
    log('\n♻️  TEST 12: Restore Auto-Save');
    if (autoSaves.length > 0 && autoSaves[0]) {
      const restoreResult = await adapter.restoreAutoSave(
        testProjectId,
        autoSaves[0].timestamp
      );
      if (restoreResult.success && restoreResult.project) {
        log('✅ Auto-save restored!');
        log('   Restored name:', restoreResult.project.projectName);
      } else {
        log('❌ Restore failed:', { code: restoreResult.errorCode });
      }
    } else {
      log('⚠️  No auto-saves to restore');
    }
    
    await sleep(500);
    
    // Test 13: Save Thumbnail (Placeholder)
    log('\n🖼️  TEST 13: Save Thumbnail');
    try {
      const dummyBlob = new Blob(['dummy thumbnail data'], { type: 'image/png' });
      await adapter.saveThumbnail(testProjectId, dummyBlob);
      log('✅ Thumbnail saved (placeholder implementation)');
    } catch (error) {
      log('❌ Thumbnail save failed:', error);
    }
    
    log('\n================================================');
    log('✅ ALL TESTS COMPLETE!');
    log('================================================');
    log('\nNext steps:');
    log('1. Check your file system at: Documents/SizeWise/Projects/');
    log('2. Verify folder structure matches spec');
    log('3. Open .hvac files to inspect contents');
    log('4. Check .autosave/ and .metadata/ folders');
    log('\nOptional: Run cleanup test to delete all test projects');
    
  } catch (error) {
    log('❌ CRITICAL ERROR:', error);
    console.error(error);
  }
}

/**
 * Cleanup function to delete all test projects
 * Call this manually if you want to clean up after testing
 */
export async function cleanupTestProjects() {
  log('🧹 Cleaning up test projects...');
  
  try {
    const adapter = await createStorageAdapter();
    const projects = await adapter.listProjects();
    
    const testProjects = projects.filter((p) =>
      p.projectName.includes('Manual Test') ||
      p.projectName.includes('DUPLICATED') ||
      p.projectName.includes('UPDATED')
    );
    
    log(`Found ${testProjects.length} test project(s) to clean up`);
    
    for (const project of testProjects) {
      const result = await adapter.deleteProject(project.projectId);
      if (result.success) {
        log(`✅ Deleted: ${project.projectName}`);
      } else {
        log(`❌ Failed to delete: ${project.projectName}`, result.errorCode);
      }
    }
    
    log('✅ Cleanup complete!');
  } catch (error) {
    log('❌ Cleanup failed:', error);
  }
}

// Auto-run if loaded in browser console
if (typeof window !== 'undefined') {
  (window as any).runStorageTests = runStorageTests;
  (window as any).cleanupTestProjects = cleanupTestProjects;
  
  console.log('✅ Storage test functions loaded!');
  console.log('   Run: window.runStorageTests()');
  console.log('   Cleanup: window.cleanupTestProjects()');
}
