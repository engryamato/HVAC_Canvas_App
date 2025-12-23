import type { ProjectFile, Entity, Room, Duct, Equipment, Fitting } from '@/core/schema';
import { downloadFile } from './json';

/**
 * CSV export options
 */
export interface CsvExportOptions {
  /** Include header row (default: true) */
  includeHeader?: boolean;
  /** Field separator (default: ',') */
  separator?: string;
  /** Line ending (default: '\r\n') */
  lineEnding?: string;
}

/**
 * Bill of Materials item
 */
export interface BomItem {
  itemNumber: number;
  type: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  specifications: string;
}

/**
 * Escape a value for CSV format
 * @param value - The value to escape
 * @param separator - The field separator (to check if quoting is needed)
 */
function escapeCsvValue(
  value: string | number | boolean | undefined | null,
  separator: string = ','
): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  // Quote if value contains separator, quotes, or newlines
  if (str.includes(separator) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert array of objects to CSV
 */
function arrayToCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: Array<{ key: keyof T; header: string }>,
  options: CsvExportOptions = {}
): string {
  const { includeHeader = true, separator = ',', lineEnding = '\r\n' } = options;

  const rows: string[] = [];

  if (includeHeader) {
    rows.push(columns.map((col) => escapeCsvValue(col.header, separator)).join(separator));
  }

  for (const item of data) {
    const values = columns.map((col) =>
      escapeCsvValue(item[col.key] as string | number | boolean, separator)
    );
    rows.push(values.join(separator));
  }

  return rows.join(lineEnding);
}

/**
 * Export rooms as CSV
 */
export function exportRoomsAsCsv(
  entities: ProjectFile['entities'],
  options: CsvExportOptions = {}
): string {
  const rooms: Room[] = [];

  for (const id of entities.allIds) {
    const entity = entities.byId[id];
    if (entity?.type === 'room') {
      rooms.push(entity as Room);
    }
  }

  const columns = [
    { key: 'id' as keyof Room, header: 'ID' },
    { key: 'name' as keyof Room, header: 'Name' },
    { key: 'props' as keyof Room, header: 'Width (in)' },
    { key: 'props' as keyof Room, header: 'Height (in)' },
    { key: 'props' as keyof Room, header: 'Ceiling Height (in)' },
    { key: 'props' as keyof Room, header: 'Room Type' },
    { key: 'props' as keyof Room, header: 'Occupancy' },
    { key: 'calculated' as keyof Room, header: 'Area (sq ft)' },
    { key: 'calculated' as keyof Room, header: 'Volume (cu ft)' },
    { key: 'calculated' as keyof Room, header: 'Required CFM' },
  ];

  const data = rooms.map((room) => ({
    id: room.id,
    name: room.name,
    width: room.props.width,
    height: room.props.height,
    ceilingHeight: room.props.ceilingHeight,
    roomType: room.props.roomType,
    occupancy: room.props.occupancy ?? '',
    area: room.calculated?.area ?? '',
    volume: room.calculated?.volume ?? '',
    requiredCfm: room.calculated?.requiredCfm ?? '',
  }));

  return arrayToCsv(
    data,
    [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'width', header: 'Width (in)' },
      { key: 'height', header: 'Height (in)' },
      { key: 'ceilingHeight', header: 'Ceiling Height (in)' },
      { key: 'roomType', header: 'Room Type' },
      { key: 'occupancy', header: 'Occupancy' },
      { key: 'area', header: 'Area (sq ft)' },
      { key: 'volume', header: 'Volume (cu ft)' },
      { key: 'requiredCfm', header: 'Required CFM' },
    ],
    options
  );
}

/**
 * Export ducts as CSV
 */
export function exportDuctsAsCsv(
  entities: ProjectFile['entities'],
  options: CsvExportOptions = {}
): string {
  const ducts: Duct[] = [];

  for (const id of entities.allIds) {
    const entity = entities.byId[id];
    if (entity?.type === 'duct') {
      ducts.push(entity as Duct);
    }
  }

  const data = ducts.map((duct) => ({
    id: duct.id,
    name: duct.name,
    shape: duct.props.shape,
    diameter: duct.props.shape === 'round' ? duct.props.diameter : '',
    width: duct.props.shape === 'rectangular' ? duct.props.width : '',
    height: duct.props.shape === 'rectangular' ? duct.props.height : '',
    length: duct.props.length,
    material: duct.props.material,
    cfm: duct.props.cfm,
    velocity: duct.calculated?.velocity ?? '',
    pressureDrop: duct.calculated?.pressureDrop ?? '',
  }));

  return arrayToCsv(
    data,
    [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'shape', header: 'Shape' },
      { key: 'diameter', header: 'Diameter (in)' },
      { key: 'width', header: 'Width (in)' },
      { key: 'height', header: 'Height (in)' },
      { key: 'length', header: 'Length (ft)' },
      { key: 'material', header: 'Material' },
      { key: 'cfm', header: 'CFM' },
      { key: 'velocity', header: 'Velocity (FPM)' },
      { key: 'pressureDrop', header: 'Pressure Drop (in.wg)' },
    ],
    options
  );
}

/**
 * Export equipment as CSV
 */
export function exportEquipmentAsCsv(
  entities: ProjectFile['entities'],
  options: CsvExportOptions = {}
): string {
  const equipment: Equipment[] = [];

  for (const id of entities.allIds) {
    const entity = entities.byId[id];
    if (entity?.type === 'equipment') {
      equipment.push(entity as Equipment);
    }
  }

  const data = equipment.map((eq) => ({
    id: eq.id,
    name: eq.name,
    equipmentType: eq.props.equipmentType,
    manufacturer: eq.props.manufacturer ?? '',
    model: eq.props.model ?? '',
    capacity: eq.props.capacity ?? '',
    capacityUnit: eq.props.capacityUnit ?? '',
    width: eq.props.width,
    height: eq.props.height,
  }));

  return arrayToCsv(
    data,
    [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'equipmentType', header: 'Type' },
      { key: 'manufacturer', header: 'Manufacturer' },
      { key: 'model', header: 'Model' },
      { key: 'capacity', header: 'Capacity' },
      { key: 'capacityUnit', header: 'Capacity Unit' },
      { key: 'width', header: 'Width (in)' },
      { key: 'height', header: 'Height (in)' },
    ],
    options
  );
}

/**
 * Generate Bill of Materials from project entities
 */
export function generateBillOfMaterials(entities: ProjectFile['entities']): BomItem[] {
  const items: BomItem[] = [];
  let itemNumber = 1;

  // Group ducts by specifications
  const ductGroups = new Map<string, { count: number; totalLength: number; entity: Duct }>();

  for (const id of entities.allIds) {
    const entity = entities.byId[id];
    if (entity?.type === 'duct') {
      const duct = entity as Duct;
      const key =
        duct.props.shape === 'round'
          ? `round-${duct.props.diameter}-${duct.props.material}`
          : `rect-${duct.props.width}x${duct.props.height}-${duct.props.material}`;

      const existing = ductGroups.get(key);
      if (existing) {
        existing.count++;
        existing.totalLength += duct.props.length;
      } else {
        ductGroups.set(key, { count: 1, totalLength: duct.props.length, entity: duct });
      }
    }
  }

  // Add duct items
  for (const [, group] of ductGroups) {
    const duct = group.entity;
    const specs =
      duct.props.shape === 'round'
        ? `${duct.props.diameter}" diameter`
        : `${duct.props.width}" x ${duct.props.height}"`;

    items.push({
      itemNumber: itemNumber++,
      type: 'Duct',
      name: `${duct.props.shape.charAt(0).toUpperCase() + duct.props.shape.slice(1)} Duct`,
      description: `${duct.props.material} duct`,
      quantity: Math.ceil(group.totalLength),
      unit: 'ft',
      specifications: specs,
    });
  }

  // Group equipment by type
  const equipmentGroups = new Map<string, { count: number; entity: Equipment }>();

  for (const id of entities.allIds) {
    const entity = entities.byId[id];
    if (entity?.type === 'equipment') {
      const eq = entity as Equipment;
      const key = `${eq.props.equipmentType}-${eq.props.manufacturer ?? ''}-${eq.props.model ?? ''}`;

      const existing = equipmentGroups.get(key);
      if (existing) {
        existing.count++;
      } else {
        equipmentGroups.set(key, { count: 1, entity: eq });
      }
    }
  }

  // Add equipment items
  for (const [, group] of equipmentGroups) {
    const eq = group.entity;
    items.push({
      itemNumber: itemNumber++,
      type: 'Equipment',
      name: eq.props.equipmentType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      description: [eq.props.manufacturer, eq.props.model].filter(Boolean).join(' ') || '-',
      quantity: group.count,
      unit: 'ea',
      specifications: eq.props.capacity ? `${eq.props.capacity} ${eq.props.capacityUnit ?? ''}` : '-',
    });
  }

  // Group fittings by type
  const fittingGroups = new Map<string, { count: number; entity: Fitting }>();

  for (const id of entities.allIds) {
    const entity = entities.byId[id];
    if (entity?.type === 'fitting') {
      const fitting = entity as Fitting;
      const key = fitting.props.fittingType;

      const existing = fittingGroups.get(key);
      if (existing) {
        existing.count++;
      } else {
        fittingGroups.set(key, { count: 1, entity: fitting });
      }
    }
  }

  // Add fitting items
  for (const [, group] of fittingGroups) {
    const fitting = group.entity;
    items.push({
      itemNumber: itemNumber++,
      type: 'Fitting',
      name: fitting.props.fittingType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      description: `Duct fitting`,
      quantity: group.count,
      unit: 'ea',
      specifications: '-',
    });
  }

  return items;
}

/**
 * Export Bill of Materials as CSV
 */
export function exportBomAsCsv(
  entities: ProjectFile['entities'],
  options: CsvExportOptions = {}
): string {
  const items = generateBillOfMaterials(entities);

  return arrayToCsv(
    items,
    [
      { key: 'itemNumber', header: 'Item #' },
      { key: 'type', header: 'Type' },
      { key: 'name', header: 'Name' },
      { key: 'description', header: 'Description' },
      { key: 'quantity', header: 'Quantity' },
      { key: 'unit', header: 'Unit' },
      { key: 'specifications', header: 'Specifications' },
    ],
    options
  );
}

/**
 * Download rooms as CSV
 */
export function downloadRoomsCsv(entities: ProjectFile['entities'], projectName: string): void {
  const csv = exportRoomsAsCsv(entities);
  downloadFile(csv, `${projectName}_rooms.csv`, 'text/csv');
}

/**
 * Download ducts as CSV
 */
export function downloadDuctsCsv(entities: ProjectFile['entities'], projectName: string): void {
  const csv = exportDuctsAsCsv(entities);
  downloadFile(csv, `${projectName}_ducts.csv`, 'text/csv');
}

/**
 * Download equipment as CSV
 */
export function downloadEquipmentCsv(entities: ProjectFile['entities'], projectName: string): void {
  const csv = exportEquipmentAsCsv(entities);
  downloadFile(csv, `${projectName}_equipment.csv`, 'text/csv');
}

/**
 * Download Bill of Materials as CSV
 */
export function downloadBomCsv(entities: ProjectFile['entities'], projectName: string): void {
  const csv = exportBomAsCsv(entities);
  downloadFile(csv, `${projectName}_bom.csv`, 'text/csv');
}
