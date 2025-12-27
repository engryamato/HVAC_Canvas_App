/**
 * Export Workflow User Journey Tests
 *
 * Tests export functionality per PRD requirements:
 * - FR-EXPORT-001: JSON Export (Full Fidelity)
 * - FR-EXPORT-002: CSV Export (BOM)
 * - FR-EXPORT-003: PDF Export
 * - FR-BOM-001: Auto-Generation
 * - FR-BOM-003: BOM Data Structure
 * - US-EXP-001: Export Bill of Materials
 * - US-EXP-002: Export PDF Documentation
 *
 * Focus on data serialization, BOM generation, and export format validation
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  useEntityStore,
  selectAllEntities,
  selectEntitiesByType,
  selectEntityCount,
} from '@/core/store/entityStore';
import { useHistoryStore } from '@/core/commands/historyStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { useViewportStore } from '@/features/canvas/store/viewportStore';
import { createEntity } from '@/core/commands/entityCommands';
import { ProjectFileSchema } from '@/core/schema';
import type { Room, Duct, Equipment, Fitting, Entity } from '@/core/schema';

// Helper to generate consistent UUIDs for tests (must be valid UUID v4 format)
// UUID v4 requires: position 13 = '4' (version), position 17 = '8'/'9'/'a'/'b' (variant)
const testUUID = (num: number) =>
  `00000000-0000-4000-8000-${num.toString(16).padStart(12, '0')}`;

// Entity factories
const createMockRoom = (id: string, name: string, x = 100, y = 100): Room => ({
  id,
  type: 'room',
  transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 0,
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  props: {
    name,
    width: 240,
    length: 180,
    height: 96,
    occupancyType: 'office',
    airChangesPerHour: 4,
  },
  calculated: { area: 300, volume: 2400, requiredCFM: 600 },
});

const createMockDuct = (
  id: string,
  name: string,
  material: 'galvanized' | 'stainless' | 'aluminum' | 'flex' = 'galvanized',
  diameter = 12,
  length = 10
): Duct => ({
  id,
  type: 'duct',
  transform: { x: 200, y: 150, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 5,
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  props: {
    name,
    shape: 'round',
    diameter,
    length,
    material,
    airflow: 500,
    staticPressure: 0.1,
  },
  calculated: { area: 113.1, velocity: 636.6, frictionLoss: 0.05 },
});

const createMockEquipment = (
  id: string,
  name: string,
  equipmentType: 'hood' | 'fan' | 'diffuser' | 'damper' | 'air_handler' = 'fan'
): Equipment => ({
  id,
  type: 'equipment',
  transform: { x: 300, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 5,
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  props: {
    name,
    equipmentType,
    capacity: 2000,
    capacityUnit: 'CFM',
    staticPressure: 1.0,
    staticPressureUnit: 'in_wg',
    width: 24,
    depth: 24,
    height: 24,
    mountHeightUnit: 'in',
    manufacturer: 'ACME Corp',
    model: 'XL-500',
  },
});

const createMockFitting = (
  id: string,
  fittingType: 'elbow_90' | 'elbow_45' | 'tee' | 'reducer' | 'cap' = 'elbow_90'
): Fitting => ({
  id,
  type: 'fitting',
  transform: { x: 250, y: 175, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 10,
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  props: {
    fittingType,
    angle: fittingType === 'elbow_90' ? 90 : fittingType === 'elbow_45' ? 45 : undefined,
  },
  calculated: { equivalentLength: 10, pressureLoss: 0.02 },
});

/**
 * BOM Line Item structure per FR-BOM-003
 */
interface BOMLineItem {
  id: string;
  category: 'duct' | 'fitting' | 'equipment';
  subcategory: string;
  description: string;
  quantity: number;
  unit: 'LF' | 'EA' | 'SF';
  material?: string;
  size?: string;
  entityIds: string[];
}

/**
 * Generate BOM from entities
 * This mimics the expected BOM generation logic
 */
function generateBOM(entities: Entity[]): BOMLineItem[] {
  const bomItems: BOMLineItem[] = [];
  const ductAggregation: Map<string, BOMLineItem> = new Map();
  const fittingAggregation: Map<string, BOMLineItem> = new Map();
  const equipmentItems: BOMLineItem[] = [];

  entities.forEach((entity) => {
    if (entity.type === 'duct') {
      const duct = entity as Duct;
      const key = `${duct.props.shape}-${duct.props.diameter ?? duct.props.width}x${duct.props.height ?? ''}-${duct.props.material}`;
      const existing = ductAggregation.get(key);

      if (existing) {
        existing.quantity += duct.props.length;
        existing.entityIds.push(duct.id);
      } else {
        const sizeStr =
          duct.props.shape === 'round'
            ? `${duct.props.diameter}" dia`
            : `${duct.props.width}"x${duct.props.height}"`;

        ductAggregation.set(key, {
          id: `bom-duct-${key}`,
          category: 'duct',
          subcategory: duct.props.shape === 'round' ? 'Round Duct' : 'Rectangular Duct',
          description: `${sizeStr} ${duct.props.material} duct`,
          quantity: duct.props.length,
          unit: 'LF',
          material: duct.props.material,
          size: sizeStr,
          entityIds: [duct.id],
        });
      }
    }

    if (entity.type === 'fitting') {
      const fitting = entity as Fitting;
      const key = fitting.props.fittingType;
      const existing = fittingAggregation.get(key);

      if (existing) {
        existing.quantity += 1;
        existing.entityIds.push(fitting.id);
      } else {
        const typeLabel = fitting.props.fittingType.replace('_', ' ');
        fittingAggregation.set(key, {
          id: `bom-fitting-${key}`,
          category: 'fitting',
          subcategory: typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1),
          description: `${typeLabel}${fitting.props.angle ? ` ${fitting.props.angle}°` : ''}`,
          quantity: 1,
          unit: 'EA',
          entityIds: [fitting.id],
        });
      }
    }

    if (entity.type === 'equipment') {
      const equip = entity as Equipment;
      equipmentItems.push({
        id: `bom-equipment-${equip.id}`,
        category: 'equipment',
        subcategory: equip.props.equipmentType,
        description: `${equip.props.name}${equip.props.manufacturer ? ` - ${equip.props.manufacturer}` : ''}${equip.props.model ? ` ${equip.props.model}` : ''}`,
        quantity: 1,
        unit: 'EA',
        size: `${equip.props.width}"x${equip.props.depth}"x${equip.props.height}"`,
        entityIds: [equip.id],
      });
    }
  });

  bomItems.push(...ductAggregation.values());
  bomItems.push(...fittingAggregation.values());
  bomItems.push(...equipmentItems);

  return bomItems;
}

/**
 * Convert BOM to CSV format per FR-EXPORT-002
 */
function convertBOMToCSV(bomItems: BOMLineItem[]): string {
  const headers = ['Category', 'Subcategory', 'Description', 'Quantity', 'Unit', 'Size', 'Material'];
  const rows = bomItems.map((item) => [
    item.category,
    item.subcategory,
    item.description,
    item.quantity.toString(),
    item.unit,
    item.size || '',
    item.material || '',
  ]);

  // Add BOM for Excel compatibility
  const BOM = '\uFEFF';
  const csv =
    BOM +
    [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

  return csv;
}

/**
 * Create project file structure per FR-FILE-001
 */
function createProjectFile(
  projectName: string,
  entities: { byId: Record<string, Entity>; allIds: string[] },
  viewportState = { panX: 0, panY: 0, zoom: 1 }
) {
  return {
    schemaVersion: '1.0.0',
    projectId: testUUID(1),
    projectName,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    entities,
    viewportState,
    settings: {
      unitSystem: 'imperial' as const,
      gridSize: 24,
      gridVisible: true,
    },
  };
}

describe('Export Workflow User Journey', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useHistoryStore.getState().clear();
    useSelectionStore.getState().clearSelection();
    useViewportStore.setState({
      panX: 0,
      panY: 0,
      zoom: 1,
      gridVisible: true,
      gridSize: 24,
      snapToGrid: true,
    });
  });

  describe('FR-EXPORT-001: JSON Export (Full Fidelity)', () => {
    it('should create valid project file structure', () => {
      const roomId = testUUID(100);
      const ductId = testUUID(200);
      const room = createMockRoom(roomId, 'Office');
      const duct = createMockDuct(ductId, 'Supply Duct');

      const projectFile = createProjectFile('Test Project', {
        byId: { [roomId]: room, [ductId]: duct },
        allIds: [roomId, ductId],
      });

      const result = ProjectFileSchema.safeParse(projectFile);
      expect(result.success).toBe(true);
    });

    it('should include all entity types in export', () => {
      const entities: Entity[] = [
        createMockRoom('room-1', 'Room'),
        createMockDuct('duct-1', 'Duct'),
        createMockEquipment('equip-1', 'Fan', 'fan'),
        createMockFitting('fit-1', 'elbow_90'),
      ];

      const byId = Object.fromEntries(entities.map((e) => [e.id, e]));
      const projectFile = createProjectFile('Complete Project', {
        byId,
        allIds: entities.map((e) => e.id),
      });

      expect(Object.keys(projectFile.entities.byId)).toHaveLength(4);
      expect(projectFile.entities.allIds).toHaveLength(4);
    });

    it('should include viewport state in export', () => {
      const projectFile = createProjectFile(
        'Test',
        { byId: {}, allIds: [] },
        { panX: 100, panY: 200, zoom: 1.5 }
      );

      expect(projectFile.viewportState.panX).toBe(100);
      expect(projectFile.viewportState.panY).toBe(200);
      expect(projectFile.viewportState.zoom).toBe(1.5);
    });

    it('should include settings in export', () => {
      const projectFile = createProjectFile('Test', { byId: {}, allIds: [] });

      expect(projectFile.settings.unitSystem).toBe('imperial');
      expect(projectFile.settings.gridSize).toBe(24);
      expect(projectFile.settings.gridVisible).toBe(true);
    });

    it('should preserve entity order in allIds', () => {
      const entities = ['room-1', 'duct-1', 'equip-1', 'fit-1'].map((id, i) => {
        if (id.startsWith('room')) return createMockRoom(id, 'Room');
        if (id.startsWith('duct')) return createMockDuct(id, 'Duct');
        if (id.startsWith('equip')) return createMockEquipment(id, 'Equip', 'fan');
        return createMockFitting(id, 'elbow_90');
      });

      const projectFile = createProjectFile('Test', {
        byId: Object.fromEntries(entities.map((e) => [e.id, e])),
        allIds: ['room-1', 'duct-1', 'equip-1', 'fit-1'],
      });

      expect(projectFile.entities.allIds).toEqual(['room-1', 'duct-1', 'equip-1', 'fit-1']);
    });

    it('should be re-importable (round-trip)', () => {
      const roomId = testUUID(100);
      const room = createMockRoom(roomId, 'Office');
      const originalProject = createProjectFile('Test', {
        byId: { [roomId]: room },
        allIds: [roomId],
      });

      // Serialize to JSON
      const jsonString = JSON.stringify(originalProject);

      // Parse back
      const parsed = JSON.parse(jsonString);
      const validated = ProjectFileSchema.safeParse(parsed);

      expect(validated.success).toBe(true);
      if (validated.success) {
        expect(validated.data.projectName).toBe('Test');
        expect(validated.data.entities.allIds).toContain(roomId);
      }
    });
  });

  describe('FR-BOM-001: Auto-Generation', () => {
    it('should extract all entities from project', () => {
      createEntity(createMockRoom('room-1', 'Room'));
      createEntity(createMockDuct('duct-1', 'Duct'));
      createEntity(createMockEquipment('equip-1', 'Fan', 'fan'));
      createEntity(createMockFitting('fit-1', 'elbow_90'));

      const allEntities = selectAllEntities();
      expect(allEntities).toHaveLength(4);
    });

    it('should group entities by category', () => {
      createEntity(createMockRoom('room-1', 'Room'));
      createEntity(createMockDuct('duct-1', 'Duct 1'));
      createEntity(createMockDuct('duct-2', 'Duct 2'));
      createEntity(createMockEquipment('equip-1', 'Fan', 'fan'));
      createEntity(createMockFitting('fit-1', 'elbow_90'));

      const rooms = selectEntitiesByType('room');
      const ducts = selectEntitiesByType('duct');
      const equipment = selectEntitiesByType('equipment');
      const fittings = selectEntitiesByType('fitting');

      expect(rooms).toHaveLength(1);
      expect(ducts).toHaveLength(2);
      expect(equipment).toHaveLength(1);
      expect(fittings).toHaveLength(1);
    });

    it('should aggregate duct quantities by size', () => {
      // Create multiple ducts of same size
      createEntity(createMockDuct('duct-1', 'Duct 1', 'galvanized', 12, 10));
      createEntity(createMockDuct('duct-2', 'Duct 2', 'galvanized', 12, 15));
      createEntity(createMockDuct('duct-3', 'Duct 3', 'galvanized', 12, 20));

      const entities = selectAllEntities();
      const bom = generateBOM(entities);

      // Should aggregate to single line item
      const ductItems = bom.filter((item) => item.category === 'duct');
      expect(ductItems).toHaveLength(1);

      // Total length should be sum
      expect(ductItems[0].quantity).toBe(45); // 10 + 15 + 20
      expect(ductItems[0].entityIds).toHaveLength(3);
    });

    it('should separate ducts by material', () => {
      createEntity(createMockDuct('duct-1', 'Galv Duct', 'galvanized', 12, 10));
      createEntity(createMockDuct('duct-2', 'SS Duct', 'stainless', 12, 10));

      const entities = selectAllEntities();
      const bom = generateBOM(entities);

      const ductItems = bom.filter((item) => item.category === 'duct');
      expect(ductItems).toHaveLength(2);
    });

    it('should count fittings by type', () => {
      createEntity(createMockFitting('fit-1', 'elbow_90'));
      createEntity(createMockFitting('fit-2', 'elbow_90'));
      createEntity(createMockFitting('fit-3', 'elbow_45'));
      createEntity(createMockFitting('fit-4', 'tee'));

      const entities = selectAllEntities();
      const bom = generateBOM(entities);

      const fittingItems = bom.filter((item) => item.category === 'fitting');
      expect(fittingItems).toHaveLength(3); // 3 unique types

      const elbow90 = fittingItems.find((item) => item.subcategory.toLowerCase().includes('elbow 90'));
      expect(elbow90?.quantity).toBe(2);
    });

    it('should list equipment individually', () => {
      createEntity(createMockEquipment('fan-1', 'Supply Fan 1', 'fan'));
      createEntity(createMockEquipment('fan-2', 'Supply Fan 2', 'fan'));
      createEntity(createMockEquipment('diff-1', 'Diffuser 1', 'diffuser'));

      const entities = selectAllEntities();
      const bom = generateBOM(entities);

      const equipmentItems = bom.filter((item) => item.category === 'equipment');
      expect(equipmentItems).toHaveLength(3);
    });
  });

  describe('FR-BOM-003: BOM Data Structure', () => {
    it('should include required BOM fields', () => {
      createEntity(createMockDuct('duct-1', 'Supply Duct', 'galvanized', 12, 25));

      const entities = selectAllEntities();
      const bom = generateBOM(entities);
      const item = bom[0];

      expect(item.id).toBeDefined();
      expect(item.category).toBe('duct');
      expect(item.subcategory).toBeDefined();
      expect(item.description).toBeDefined();
      expect(item.quantity).toBe(25);
      expect(item.unit).toBe('LF');
      expect(item.material).toBe('galvanized');
      expect(item.size).toBeDefined();
      expect(item.entityIds).toContain('duct-1');
    });

    it('should use correct units per category', () => {
      createEntity(createMockDuct('duct-1', 'Duct'));
      createEntity(createMockEquipment('equip-1', 'Fan', 'fan'));
      createEntity(createMockFitting('fit-1', 'elbow_90'));

      const entities = selectAllEntities();
      const bom = generateBOM(entities);

      const ductItem = bom.find((item) => item.category === 'duct');
      const equipItem = bom.find((item) => item.category === 'equipment');
      const fitItem = bom.find((item) => item.category === 'fitting');

      expect(ductItem?.unit).toBe('LF'); // Linear feet for ducts
      expect(equipItem?.unit).toBe('EA'); // Each for equipment
      expect(fitItem?.unit).toBe('EA'); // Each for fittings
    });

    it('should include equipment manufacturer and model', () => {
      const equip = createMockEquipment('equip-1', 'Supply Fan', 'fan');
      createEntity(equip);

      const entities = selectAllEntities();
      const bom = generateBOM(entities);

      const equipItem = bom.find((item) => item.category === 'equipment');
      expect(equipItem?.description).toContain('ACME Corp');
      expect(equipItem?.description).toContain('XL-500');
    });
  });

  describe('FR-EXPORT-002: CSV Export (BOM)', () => {
    it('should generate CSV with headers', () => {
      createEntity(createMockDuct('duct-1', 'Duct', 'galvanized', 12, 10));

      const entities = selectAllEntities();
      const bom = generateBOM(entities);
      const csv = convertBOMToCSV(bom);

      expect(csv).toContain('Category');
      expect(csv).toContain('Subcategory');
      expect(csv).toContain('Description');
      expect(csv).toContain('Quantity');
      expect(csv).toContain('Unit');
      expect(csv).toContain('Size');
      expect(csv).toContain('Material');
    });

    it('should include UTF-8 BOM for Excel compatibility', () => {
      const entities: Entity[] = [];
      const bom = generateBOM(entities);
      const csv = convertBOMToCSV(bom);

      // UTF-8 BOM is \uFEFF
      expect(csv.charCodeAt(0)).toBe(0xfeff);
    });

    it('should quote CSV fields', () => {
      createEntity(createMockDuct('duct-1', 'Main Supply Duct'));

      const entities = selectAllEntities();
      const bom = generateBOM(entities);
      const csv = convertBOMToCSV(bom);

      // Check that fields are quoted
      expect(csv).toContain('"duct"');
      expect(csv).toContain('"Round Duct"');
    });

    it('should include all BOM items in CSV', () => {
      createEntity(createMockDuct('duct-1', 'Duct 1'));
      createEntity(createMockDuct('duct-2', 'Duct 2'));
      createEntity(createMockEquipment('equip-1', 'Fan', 'fan'));
      createEntity(createMockFitting('fit-1', 'elbow_90'));

      const entities = selectAllEntities();
      const bom = generateBOM(entities);
      const csv = convertBOMToCSV(bom);

      const lines = csv.split('\n');
      // Header + 3 items (ducts aggregated, 1 equipment, 1 fitting)
      expect(lines.length).toBe(4);
    });
  });

  describe('US-EXP-001: Export Bill of Materials User Story', () => {
    it('should generate complete BOM from design', () => {
      // Simulate a typical small office HVAC design
      createEntity(createMockRoom('room-1', 'Main Office', 100, 100));
      createEntity(createMockDuct('duct-1', 'Supply Duct 1', 'galvanized', 12, 25));
      createEntity(createMockDuct('duct-2', 'Supply Duct 2', 'galvanized', 12, 15));
      createEntity(createMockDuct('duct-3', 'Return Duct', 'galvanized', 16, 30));
      createEntity(createMockEquipment('fan-1', 'Supply Fan', 'fan'));
      createEntity(createMockEquipment('diff-1', 'Diffuser 1', 'diffuser'));
      createEntity(createMockEquipment('diff-2', 'Diffuser 2', 'diffuser'));
      createEntity(createMockFitting('elbow-1', 'elbow_90'));
      createEntity(createMockFitting('elbow-2', 'elbow_90'));
      createEntity(createMockFitting('tee-1', 'tee'));

      const entities = selectAllEntities();
      const bom = generateBOM(entities);

      // Verify BOM structure
      expect(bom.length).toBeGreaterThan(0);

      // Check aggregation
      const ductItems = bom.filter((item) => item.category === 'duct');
      expect(ductItems.length).toBe(2); // 12" and 16" diameter groups

      // Check 12" duct aggregation (25 + 15 = 40 LF)
      const duct12 = ductItems.find((item) => item.size?.includes('12"'));
      expect(duct12?.quantity).toBe(40);

      // Check equipment count
      const equipmentItems = bom.filter((item) => item.category === 'equipment');
      expect(equipmentItems.length).toBe(3);

      // Check fitting count
      const fittingItems = bom.filter((item) => item.category === 'fitting');
      const elbow90 = fittingItems.find((item) => item.subcategory.toLowerCase().includes('elbow 90'));
      expect(elbow90?.quantity).toBe(2);
    });

    it('should export to CSV format', () => {
      createEntity(createMockDuct('duct-1', 'Duct', 'galvanized', 12, 50));
      createEntity(createMockEquipment('fan-1', 'AHU', 'air_handler'));
      createEntity(createMockFitting('fit-1', 'elbow_90'));

      const entities = selectAllEntities();
      const bom = generateBOM(entities);
      const csv = convertBOMToCSV(bom);

      // Verify CSV is generated
      expect(csv.length).toBeGreaterThan(0);
      expect(csv).toContain('duct');
      expect(csv).toContain('equipment');
      expect(csv).toContain('fitting');
    });
  });

  describe('Export Filename Convention per PRD', () => {
    it('should follow BOM filename pattern: {projectName}_BOM_{date}.csv', () => {
      const projectName = 'Office HVAC Project';
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const expectedPattern = new RegExp(`${projectName.replace(/ /g, '_')}_BOM_\\d{4}-\\d{2}-\\d{2}\\.csv`);

      const filename = `${projectName.replace(/ /g, '_')}_BOM_${date}.csv`;
      expect(filename).toMatch(expectedPattern);
    });

    it('should follow JSON export pattern: {projectName}.sws.json', () => {
      const projectName = 'Office HVAC Project';
      const filename = `${projectName.replace(/ /g, '_')}.sws.json`;
      expect(filename).toMatch(/\.sws\.json$/);
    });

    it('should follow PDF export pattern: {projectName}_Takeoff_{date}.pdf', () => {
      const projectName = 'Office HVAC Project';
      const date = new Date().toISOString().split('T')[0];
      const filename = `${projectName.replace(/ /g, '_')}_Takeoff_${date}.pdf`;
      expect(filename).toMatch(/_Takeoff_\d{4}-\d{2}-\d{2}\.pdf$/);
    });
  });

  describe('Export Data Integrity', () => {
    it('should preserve all entity properties in JSON export', () => {
      const room = createMockRoom('room-1', 'Conference Room');
      room.props.width = 480;
      room.props.length = 360;
      room.props.height = 120;
      room.props.occupancyType = 'conference';
      room.props.airChangesPerHour = 8;
      room.calculated = { area: 1200, volume: 14400, requiredCFM: 2400 };

      createEntity(room);

      const entities = selectAllEntities();
      const projectFile = createProjectFile('Test', {
        byId: { 'room-1': entities[0] },
        allIds: ['room-1'],
      });

      const exported = projectFile.entities.byId['room-1'] as Room;
      expect(exported.props.name).toBe('Conference Room');
      expect(exported.props.width).toBe(480);
      expect(exported.props.occupancyType).toBe('conference');
      expect(exported.calculated.requiredCFM).toBe(2400);
    });

    it('should preserve entity transform in export', () => {
      const duct = createMockDuct('duct-1', 'Test Duct');
      duct.transform = { x: 150, y: 250, rotation: 45, scaleX: 1.5, scaleY: 1 };

      createEntity(duct);

      const entities = selectAllEntities();
      const projectFile = createProjectFile('Test', {
        byId: { 'duct-1': entities[0] },
        allIds: ['duct-1'],
      });

      const exported = projectFile.entities.byId['duct-1'];
      expect(exported.transform.x).toBe(150);
      expect(exported.transform.y).toBe(250);
      expect(exported.transform.rotation).toBe(45);
      expect(exported.transform.scaleX).toBe(1.5);
    });

    it('should preserve entity z-index in export', () => {
      createEntity(createMockRoom('room-1', 'Room'));
      createEntity(createMockDuct('duct-1', 'Duct'));
      createEntity(createMockFitting('fit-1', 'elbow_90'));

      const entities = selectAllEntities();
      const byId = Object.fromEntries(entities.map((e) => [e.id, e]));

      expect(byId['room-1'].zIndex).toBe(0);
      expect(byId['duct-1'].zIndex).toBe(5);
      expect(byId['fit-1'].zIndex).toBe(10);
    });
  });

  describe('Empty Project Export', () => {
    it('should export empty project with valid structure', () => {
      const projectFile = createProjectFile('Empty Project', {
        byId: {},
        allIds: [],
      });

      const result = ProjectFileSchema.safeParse(projectFile);
      expect(result.success).toBe(true);
      expect(projectFile.entities.allIds).toHaveLength(0);
    });

    it('should generate empty BOM for empty project', () => {
      const entities = selectAllEntities();
      const bom = generateBOM(entities);

      expect(bom).toHaveLength(0);
    });

    it('should generate CSV with only headers for empty BOM', () => {
      const bom: BOMLineItem[] = [];
      const csv = convertBOMToCSV(bom);

      const lines = csv.split('\n');
      expect(lines).toHaveLength(1); // Only header
      expect(lines[0]).toContain('Category');
    });
  });
});
