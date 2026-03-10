import { TauriStorageAdapter } from './src/core/persistence/adapters/TauriStorageAdapter';
import * as filesystem from './src/core/persistence/filesystem';
import * as serialization from './src/core/persistence/serialization';
import { ProjectFile } from './src/core/schema/project-file.schema';

function createMockProject(overrides?: Partial<ProjectFile>): ProjectFile {
  return {
    schemaVersion: '1.0.0',
    projectId: '550e8400-e29b-41d4-a716-446655440000',
    projectName: 'Test Project',
    projectNumber: 'PRJ-001',
    clientName: 'Test Client',
    location: 'Test Location',
    createdAt: '2024-01-01T00:00:00.000Z',
    modifiedAt: '2024-01-01T00:00:00.000Z',
    entities: { byId: {}, allIds: [] },
    viewportState: { panX: 0, panY: 0, zoom: 1 },
    settings: { unitSystem: 'imperial', gridSize: 12, gridVisible: true, snapToGrid: true },
    scope: { projectType: 'residential', details: [], materials: [] },
    siteConditions: { elevation: '100', outdoorTemp: '70', indoorTemp: '70', windSpeed: '90', humidity: '50', localCodes: 'IBC 2021' },
    isArchived: false,
    ...overrides,
  };
}

async function run() {
  // Mock everything exactly as the test
  (filesystem as any).exists = async () => true;
  (filesystem as any).readDir = async () => ['550e8400-e29b-41d4-a716-446655440000'];
  (filesystem as any).readTextFile = async () => JSON.stringify(createMockProject());
  (filesystem as any).getDocumentsDir = async () => '/mock/documents';
  
  (serialization as any).deserializeProject = (json: string) => ({
    success: true,
    data: JSON.parse(json)
  });

  const adapter = new TauriStorageAdapter();
  const projects = await adapter.listProjects();
  console.log("Found projects:", projects.length);
}
run().catch(console.error);
