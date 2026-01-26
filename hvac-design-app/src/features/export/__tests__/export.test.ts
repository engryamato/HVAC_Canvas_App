import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportProjectToCsv } from '../csv';
import { exportProjectToJson } from '../json';
import { exportProjectPDF } from '../pdf';
import { downloadFile } from '../download';
import type { ProjectFile } from '@/core/schema';

// Mock the download function
vi.mock('../download', () => ({
  downloadFile: vi.fn(),
}));

// Clear mocks between tests to ensure clean state
beforeEach(() => {
  vi.clearAllMocks();
});

const createMockProject = (): ProjectFile => ({
  projectId: 'test-project',
  projectName: 'Test HVAC Project',
  projectNumber: 'HVAC-2025-001',
  clientName: 'Test Client Inc.',
  createdAt: '2025-01-01T00:00:00.000Z',
  modifiedAt: '2025-01-01T12:00:00.000Z',
  entities: {
    byId: {
      'room-1': {
        id: 'room-1',
        type: 'room',
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        props: {
          name: 'Office 101',
          width: 240,
          length: 180,
          height: 96,
          occupancyType: 'office',
          airChangesPerHour: 4,
        },
        calculated: { area: 300, volume: 2400, requiredCFM: 160 },
      },
      'duct-1': {
        id: 'duct-1',
        type: 'duct',
        transform: { x: 100, y: 100, rotation: 45, scaleX: 1, scaleY: 1 },
        zIndex: 5,
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        props: {
          name: 'Main Duct',
          length: 120,
          width: 12,
          height: 8,
          material: 'galvanized_steel',
        },
        calculated: { area: 2.67, perimeter: 40, velocity: 800, pressureLoss: 0.15 },
      },
      'equipment-1': {
        id: 'equipment-1',
        type: 'equipment',
        transform: { x: 200, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 5,
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        props: {
          name: 'Supply Fan',
          equipmentType: 'fan',
          width: 24,
          depth: 24,
          height: 18,
          manufacturer: 'Acme HVAC',
          modelNumber: 'SF-5000',
        },
        calculated: { staticPressure: 1.5, airflow: 2000 },
      },
    },
    allIds: ['room-1', 'duct-1', 'equipment-1'],
  },
  viewportState: { panX: 0, panY: 0, zoom: 1 },
  settings: { unitSystem: 'imperial', gridSize: 12, gridVisible: true },
});

describe('Export - CSV', () => {
  describe('exportProjectToCsv', () => {
    it('should generate CSV with proper headers', () => {
      const project = createMockProject();

      const csv = exportProjectToCsv(project);

      expect(csv).toContain('Item #,Type,Name,Description');
      expect(csv).toContain('Quantity,Unit,Specifications');
    });

    it('should export room data correctly', () => {
      const project = createMockProject();

      const csv = exportProjectToCsv(project);

      expect(csv).toContain('Office 101');
      expect(csv).toContain('room');
      expect(csv).toContain('240');
      expect(csv).toContain('180');
    });

    it('should export duct data correctly', () => {
      const project = createMockProject();

      const csv = exportProjectToCsv(project);

      expect(csv).toContain('Main Duct');
      expect(csv).toContain('duct');
      expect(csv).toContain('120');
    });

    it('should export equipment data correctly', () => {
      const project = createMockProject();

      const csv = exportProjectToCsv(project);

      expect(csv).toContain('Supply Fan');
      expect(csv).toContain('equipment');
      expect(csv).toContain('Acme HVAC');
      expect(csv).toContain('SF-5000');
    });

    it('should handle empty project', () => {
      const project: ProjectFile = {
        ...createMockProject(),
        entities: { byId: {}, allIds: [] },
      };

      const csv = exportProjectToCsv(project);

      // Should have headers but no data rows
      expect(csv).toContain('Item #,Type,Name');
      expect(csv.split('\n').length).toBeLessThan(5);
    });

    it('should escape special characters in CSV', () => {
      const project = createMockProject();
      if (project.entities.byId['room-1']) {
        project.entities.byId['room-1'].props.name = 'Room "A", Level 1';
      }

      const csv = exportProjectToCsv(project);

      // Should quote and escape the value
      expect(csv).toContain('"Room ""A"", Level 1"');
    });

    it('should use custom separator when provided', () => {
      const project = createMockProject();

      const csv = exportProjectToCsv(project, { separator: ';' });

      expect(csv).toContain('Item #;Type;Name');
      expect(csv).not.toContain('Item #,Type,Name');
    });

    it('should exclude header when option is false', () => {
      const project = createMockProject();

      const csv = exportProjectToCsv(project, { includeHeader: false });

      expect(csv).not.toContain('Item #');
      expect(csv).not.toContain('Type');
    });

    it('should number items sequentially', () => {
      const project = createMockProject();

      const csv = exportProjectToCsv(project);

      const lines = csv.split('\n').filter((line) => line.trim());
      // Skip header, check item numbers
      expect(lines[1]).toMatch(/^1,/);
      expect(lines[2]).toMatch(/^2,/);
      expect(lines[3]).toMatch(/^3,/);
    });
  });
});

describe('Export - JSON', () => {
  describe('exportProjectToJson', () => {
    it('should generate valid JSON', () => {
      const project = createMockProject();

      const json = exportProjectToJson(project);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should include all project metadata', () => {
      const project = createMockProject();

      const json = exportProjectToJson(project);
      const parsed = JSON.parse(json);

      expect(parsed.projectName).toBe('Test HVAC Project');
      expect(parsed.projectNumber).toBe('HVAC-2025-001');
      expect(parsed.clientName).toBe('Test Client Inc.');
      expect(parsed.createdAt).toBe('2025-01-01T00:00:00.000Z');
    });

    it('should include all entities', () => {
      const project = createMockProject();

      const json = exportProjectToJson(project);
      const parsed = JSON.parse(json);

      expect(parsed.entities.allIds).toEqual(['room-1', 'duct-1', 'equipment-1']);
      expect(parsed.entities.byId['room-1']).toBeDefined();
      expect(parsed.entities.byId['duct-1']).toBeDefined();
      expect(parsed.entities.byId['equipment-1']).toBeDefined();
    });

    it('should include viewport state', () => {
      const project = createMockProject();
      project.viewportState = { panX: 100, panY: 200, zoom: 1.5 };

      const json = exportProjectToJson(project);
      const parsed = JSON.parse(json);

      expect(parsed.viewportState).toEqual({ panX: 100, panY: 200, zoom: 1.5 });
    });

    it('should include settings', () => {
      const project = createMockProject();

      const json = exportProjectToJson(project);
      const parsed = JSON.parse(json);

      expect(parsed.settings.unitSystem).toBe('imperial');
      expect(parsed.settings.gridSize).toBe(12);
      expect(parsed.settings.gridVisible).toBe(true);
    });

    it('should format JSON with indentation by default', () => {
      const project = createMockProject();

      const json = exportProjectToJson(project);

      // Check for indentation
      expect(json).toContain('  "projectName"');
      expect(json).toContain('    "id"');
    });

    it('should handle entities with all properties', () => {
      const project = createMockProject();

      const json = exportProjectToJson(project);
      const parsed = JSON.parse(json);

      const room = parsed.entities.byId['room-1'];
      expect(room.props).toBeDefined();
      expect(room.calculated).toBeDefined();
      expect(room.transform).toBeDefined();
      expect(room.zIndex).toBeDefined();
    });

    it('should preserve entity types correctly', () => {
      const project = createMockProject();

      const json = exportProjectToJson(project);
      const parsed = JSON.parse(json);

      expect(parsed.entities.byId['room-1'].type).toBe('room');
      expect(parsed.entities.byId['duct-1'].type).toBe('duct');
      expect(parsed.entities.byId['equipment-1'].type).toBe('equipment');
    });

    it('should handle empty project', () => {
      const project: ProjectFile = {
        ...createMockProject(),
        entities: { byId: {}, allIds: [] },
      };

      const json = exportProjectToJson(project);
      const parsed = JSON.parse(json);

      expect(parsed.entities.byId).toEqual({});
      expect(parsed.entities.allIds).toEqual([]);
    });

    it('should include calculated values', () => {
      const project = createMockProject();

      const json = exportProjectToJson(project);
      const parsed = JSON.parse(json);

      const room = parsed.entities.byId['room-1'];
      expect(room.calculated.area).toBe(300);
      expect(room.calculated.volume).toBe(2400);
      expect(room.calculated.requiredCFM).toBe(160);
    });
  });

  describe('downloadFile', () => {
    it('should be called with correct filename for CSV', () => {
      const project = createMockProject();

      exportProjectToCsv(project, { download: true } as any);

      expect(downloadFile).toHaveBeenCalledWith(
        expect.any(String),
        'Test_HVAC_Project_BOM.csv',
        'text/csv'
      );
    });

    it('should be called with correct filename for JSON', () => {
      const project = createMockProject();

      exportProjectToJson(project, { download: true } as any);

      expect(downloadFile).toHaveBeenCalledWith(
        expect.any(String),
        'Test_HVAC_Project.json',
        'application/json'
      );
    });

    it('should sanitize project name for filename', () => {
      const project = createMockProject();
      project.projectName = 'Test Project: Special/Characters\\Here';

      exportProjectToJson(project, { download: true } as any);

      // Should replace special characters with underscores
      expect(downloadFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringMatching(/Test_Project_/),
        'application/json'
      );
    });
  });
});

describe('Export - Integration', () => {
  it('should export and re-import project data', () => {
    const original = createMockProject();

    const json = exportProjectToJson(original);
    const reimported = JSON.parse(json);

    expect(reimported).toEqual(original);
  });

  it('should maintain entity relationships through export/import', () => {
    const original = createMockProject();

    const json = exportProjectToJson(original);
    const reimported = JSON.parse(json);

    // Check all entities are present
    expect(reimported.entities.allIds.length).toBe(original.entities.allIds.length);

    // Check entity references are intact
    original.entities.allIds.forEach((id) => {
      expect(reimported.entities.byId[id]).toEqual(original.entities.byId[id]);
    });
  });

  it('should preserve precision of calculated values', () => {
    const project = createMockProject();
    if (project.entities.byId['duct-1']) {
      project.entities.byId['duct-1'].calculated = {
        area: 2.6666666666,
        perimeter: 40.123456,
        velocity: 800.9876,
        pressureLoss: 0.15432,
      };
    }

    const json = exportProjectToJson(project);
    const reimported = JSON.parse(json);

    const duct = reimported.entities.byId['duct-1'];
    expect(duct.calculated.area).toBeCloseTo(2.6666666666, 10);
    expect(duct.calculated.perimeter).toBeCloseTo(40.123456, 6);
    expect(duct.calculated.velocity).toBeCloseTo(800.9876, 4);
    expect(duct.calculated.pressureLoss).toBeCloseTo(0.15432, 5);
  });
});

describe('Export - PDF', () => {
  it('generates a valid PDF file header', async () => {
    const project = createMockProject();

    const result = await exportProjectPDF(project, { pageSize: 'a3' });
    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(Uint8Array);

    const bytes = result.data ?? new Uint8Array();
    const header = new TextDecoder().decode(bytes.slice(0, 5));
    expect(header).toBe('%PDF-');
  });
});
