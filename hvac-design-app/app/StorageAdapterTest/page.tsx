'use client';

import { useState } from 'react';
import { createStorageAdapter } from '@/core/persistence/factory';
import type { ProjectFile } from '@/core/schema/project-file.schema';

/**
 * Manual Test Page for TauriStorageAdapter
 * Navigate to this page in Tauri to test storage functionality
 */
export default function StorageAdapterTestPage() {
  const [output, setOutput] = useState<string[]>(['Storage Adapter Test Page Ready']);
  const [testProjectId, setTestProjectId] = useState<string>('');

  const log = (message: string) => {
    setOutput((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const createTestProject = (): ProjectFile => {
    const projectId = crypto.randomUUID();
    setTestProjectId(projectId);
    
    return {
      schemaVersion: '1.0.0',
      projectId,
      projectName: 'Manual Test Project',
      projectNumber: 'TEST-001',
      clientName: 'Test Client',
      location: 'Test Location, USA',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      entities: {
        byId: {},
        allIds: [],
      },
      scope: {
        projectType: 'commercial',
        details: ['HVAC system design'],
        materials: [{ type: 'Ductwork', grade: 'Standard' }],
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
  };

  const runTest1_SaveProject = async () => {
    try {
      log('TEST 1: Save Project');
      const adapter = await createStorageAdapter();
      const project = createTestProject();
      
      log(`Creating project: ${project.projectId}`);
      const result = await adapter.saveProject(project);
      
      if (result.success) {
        log(`✅ Save successful!`);
        log(`   File path: ${result.filePath}`);
        log(`   Size: ${result.sizeBytes} bytes`);
      } else {
        log(`❌ Save failed: ${result.errorCode}`);
      }
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const runTest2_LoadProject = async () => {
    try {
      log('TEST 2: Load Project');
      if (!testProjectId) {
        log('❌ No project ID available. Run Save test first.');
        return;
      }
      
      const adapter = await createStorageAdapter();
      log(`Loading project: ${testProjectId}`);
      const result = await adapter.loadProject(testProjectId);
      
      if (result.success && result.project) {
        log(`✅ Load successful!`);
        log(`   Project: ${result.project.projectName}`);
        log(`   Source: ${result.source}`);
        log(`   Migrated: ${result.migrated}`);
      } else {
        log(`❌ Load failed: ${result.errorCode}`);
      }
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const runTest3_ListProjects = async () => {
    try {
      log('TEST 3: List Projects');
      const adapter = await createStorageAdapter();
      const projects = await adapter.listProjects();
      
      log(`✅ Found ${projects.length} project(s)`);
      projects.forEach((p, i) => {
        log(`   ${i + 1}. ${p.projectName} (${p.projectId})`);
      });
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const runTest4_AutoSave = async () => {
    try {
      log('TEST 4: Auto-Save');
      if (!testProjectId) {
        log('❌ No project ID available. Run Save test first.');
        return;
      }
      
      const adapter = await createStorageAdapter();
      
      // Load project first
      const loadResult = await adapter.loadProject(testProjectId);
      if (!loadResult.success || !loadResult.project) {
        log('❌ Could not load project for auto-save');
        return;
      }
      
      log('Creating auto-save...');
      const result = await adapter.autoSave(loadResult.project as ProjectFile);
      
      if (result.success) {
        log(`✅ Auto-save successful!`);
        log(`   Timestamp: ${result.timestamp}`);
        log(`   Auto-save ID: ${result.autoSaveId}`);
      } else {
        log(`❌ Auto-save failed: ${result.errorCode}`);
      }
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const runTest5_ListAutoSaves = async () => {
    try {
      log('TEST 5: List Auto-Saves');
      if (!testProjectId) {
        log('❌ No project ID available. Run Save test first.');
        return;
      }
      
      const adapter = await createStorageAdapter();
      const autoSaves = await adapter.listAutoSaves(testProjectId);
      
      log(`✅ Found ${autoSaves.length} auto-save(s)`);
      autoSaves.forEach((a, i) => {
        log(`   ${i + 1}. ${a.timestamp} (${a.sizeBytes} bytes)`);
      });
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const runTest6_SearchProjects = async () => {
    try {
      log('TEST 6: Search Projects');
      const adapter = await createStorageAdapter();
      const results = await adapter.searchProjects('test');
      
      log(`✅ Found ${results.length} matching project(s)`);
      results.forEach((p, i) => {
        log(`   ${i + 1}. ${p.projectName}`);
      });
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const runTest7_DuplicateProject = async () => {
    try {
      log('TEST 7: Duplicate Project');
      if (!testProjectId) {
        log('❌ No project ID available. Run Save test first.');
        return;
      }
      
      const adapter = await createStorageAdapter();
      const result = await adapter.duplicateProject(testProjectId, 'Duplicated Test Project');
      
      if (result.success && result.project) {
        log(`✅ Duplicate successful!`);
        log(`   New ID: ${result.project.projectId}`);
        log(`   Name: ${result.project.projectName}`);
      } else {
        log(`❌ Duplicate failed: ${result.errorCode}`);
      }
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const runTest8_DeleteProject = async () => {
    try {
      log('TEST 8: Delete Project');
      if (!testProjectId) {
        log('❌ No project ID available. Run Save test first.');
        return;
      }
      
      const adapter = await createStorageAdapter();
      log(`Deleting project: ${testProjectId}`);
      const result = await adapter.deleteProject(testProjectId);
      
      if (result.success) {
        log(`✅ Delete successful!`);
        setTestProjectId('');
      } else {
        log(`❌ Delete failed: ${result.errorCode}`);
      }
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const runTest9_StorageInfo = async () => {
    try {
      log('TEST 9: Get Storage Info');
      const adapter = await createStorageAdapter();
      const info = await adapter.getStorageInfo();
      
      log(`✅ Storage Info:`);
      log(`   Platform: ${info.platform}`);
      log(`   Storage Type: ${info.storageType}`);
      log(`   Quota Exceeded: ${info.quotaExceeded}`);
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const runAllTests = async () => {
    log('=== Running All Tests ===');
    await runTest1_SaveProject();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await runTest2_LoadProject();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await runTest3_ListProjects();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await runTest4_AutoSave();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await runTest5_ListAutoSaves();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await runTest6_SearchProjects();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await runTest7_DuplicateProject();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await runTest9_StorageInfo();
    log('=== All Tests Complete ===');
  };

  const clearOutput = () => {
    setOutput(['Storage Adapter Test Page Ready']);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>TauriStorageAdapter Manual Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p>Current Test Project ID: <strong>{testProjectId || 'None'}</strong></p>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <button onClick={runTest1_SaveProject}>1. Save Project</button>
        <button onClick={runTest2_LoadProject}>2. Load Project</button>
        <button onClick={runTest3_ListProjects}>3. List Projects</button>
        <button onClick={runTest4_AutoSave}>4. Auto-Save</button>
        <button onClick={runTest5_ListAutoSaves}>5. List Auto-Saves</button>
        <button onClick={runTest6_SearchProjects}>6. Search Projects</button>
        <button onClick={runTest7_DuplicateProject}>7. Duplicate Project</button>
        <button onClick={runTest8_DeleteProject}>8. Delete Project</button>
        <button onClick={runTest9_StorageInfo}>9. Storage Info</button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={runAllTests} style={{ backgroundColor: '#4CAF50', color: 'white' }}>
          Run All Tests
        </button>
        <button onClick={clearOutput} style={{ backgroundColor: '#f44336', color: 'white' }}>
          Clear Output
        </button>
      </div>

      <div
        style={{
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          padding: '15px',
          borderRadius: '5px',
          maxHeight: '500px',
          overflowY: 'auto',
          fontSize: '12px',
          lineHeight: '1.5',
        }}
      >
        {output.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Click &quot;Run All Tests&quot; to execute the full test suite</li>
          <li>Or click individual test buttons to test specific functionality</li>
          <li>Check the console output below for results</li>
          <li>After running tests, check your file system at: <code>Documents/SizeWise/Projects/</code></li>
          <li>You should see project folders with .hvac files, .autosave folders, etc.</li>
        </ol>
      </div>
    </div>
  );
}
