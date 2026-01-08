import type { BOMLineItem } from './bom';
import { generateBOM } from './bom';
import type { ProjectFile } from '@/core/schema';
import { downloadFile } from './download';

interface ExportCsvOptions {
  separator?: string;
  includeHeader?: boolean;
  download?: boolean;
}

function escapeCsvValue(value: string, separator: string): string {
  if (value.includes(separator) || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportBOMtoCSV(bom: BOMLineItem[]): string {
  const header = ['Category', 'Subcategory', 'Description', 'Quantity', 'Unit', 'Size', 'Material'];
  const rows = bom.map((item) => [
    item.category,
    item.subcategory ?? '',
    item.description,
    item.quantity.toString(),
    item.unit ?? '',
    item.size ?? '',
    item.material ?? '',
  ]);

  const csvLines = [header, ...rows]
    .map((row) => row.map((value) => escapeCsv(String(value ?? ''))).join(','))
    .join('\n');

  // Prepend UTF-8 BOM for Excel compatibility
  return `\uFEFF${csvLines}`;
}

interface EntitiesLike {
  byId: Record<string, unknown>;
  allIds: string[];
}

export interface BomItem {
  itemNumber: number;
  name: string;
  type: string;
  description: string;
  quantity: number;
  unit: string;
  specifications: string;
}

/**
 * Generate bill of materials from entities
 * Returns BomItem array suitable for display in BOMTable
 */
export function generateBillOfMaterials(entities: EntitiesLike): BomItem[] {
  const entityList = entities.allIds
    .map((id) => entities.byId[id])
    .filter((e): e is Record<string, unknown> => e !== undefined);

  const items: BomItem[] = [];
  let itemNumber = 1;

  entityList.forEach((entity) => {
    const entityType = String(entity.type ?? 'unknown');
    const props = (entity.props ?? {}) as Record<string, unknown>;

    // Map entity type to display name
    let displayType = 'Other';
    if (entityType === 'duct') {
      displayType = 'Duct';
    } else if (entityType === 'equipment') {
      displayType = 'Equipment';
    } else if (entityType === 'fitting') {
      displayType = 'Fitting';
    } else if (entityType === 'room') {
      return; // Skip rooms in BOM
    }

    const size = props.width && props.height
      ? `${props.width}" x ${props.height}"`
      : props.size as string | undefined;

    items.push({
      itemNumber: itemNumber++,
      name: String(props.name ?? entityType),
      type: displayType,
      description: String(props.description ?? `${displayType} item`),
      quantity: 1,
      unit: 'ea',
      specifications: size ?? '',
    });
  });

  return items;
}

export function downloadBomCsv(entities: EntitiesLike, projectName: string): void {
  const entityList = entities.allIds
    .map((id) => entities.byId[id])
    .filter((e): e is Record<string, unknown> => e !== undefined)
    .map((e) => ({
      type: String(e.type ?? ''),
      size: e.size as string | undefined,
      material: e.material as string | undefined,
      description: e.description as string | undefined,
    }));

  const bom = generateBOM(entityList);
  const csv = exportBOMtoCSV(bom);
  downloadFileLocal(csv, `${projectName}-bom.csv`, 'text/csv;charset=utf-8');
}

/**
 * Export project to CSV format
 * Creates a BOM-style CSV with all entities
 */
export function exportProjectToCsv(project: ProjectFile, options: ExportCsvOptions = {}): string {
  const separator = options.separator ?? ',';
  const includeHeader = options.includeHeader !== false;

  const headers = ['Item #', 'Type', 'Name', 'Description', 'Quantity', 'Unit', 'Specifications'];

  const rows: string[][] = [];
  let itemNumber = 1;

  // Process all entities
  project.entities.allIds.forEach((id) => {
    const entity = project.entities.byId[id];
    if (!entity) {return;}

    const entityType = entity.type;
    const props = entity.props as Record<string, unknown>;

    // Build specifications string
    let specs = '';
    if (entityType === 'room') {
      specs = `${props.width}" x ${props.length}" x ${props.height}"`;
    } else if (entityType === 'duct') {
      specs = `${props.length}ft, ${props.width}" x ${props.height}"`;
    } else if (entityType === 'equipment') {
      const manufacturer = props.manufacturer ? `${props.manufacturer}` : '';
      const model = props.modelNumber ? ` ${props.modelNumber}` : '';
      specs = `${manufacturer}${model}`.trim();
    }

    // Build description
    let description = '';
    if (entityType === 'room') {
      description = `${props.occupancyType} - ${(entity.calculated as Record<string, unknown>)?.area ?? 0} sq ft`;
    } else if (entityType === 'duct') {
      description = `${props.material ?? 'Standard'} duct`;
    } else if (entityType === 'equipment') {
      description = `${props.equipmentType ?? 'Equipment'}`;
    } else if (entityType === 'fitting') {
      description = `${props.fittingType ?? 'Fitting'}`;
    } else if (entityType === 'note') {
      description = String(props.content ?? '').substring(0, 50);
    }

    rows.push([
      String(itemNumber++),
      entityType,
      String(props.name ?? entityType),
      description,
      '1',
      'ea',
      specs,
    ]);
  });

  // Build CSV string
  const allRows = includeHeader ? [headers, ...rows] : rows;

  const csvContent = allRows
    .map((row) => row.map((cell) => escapeCsvValue(String(cell), separator)).join(separator))
    .join('\n');

  // Handle download option
  if (options.download) {
    const sanitizedName = project.projectName.replace(/[/\\?%*:|"<>\s]/g, '_');
    downloadFile(csvContent, `${sanitizedName}_BOM.csv`, 'text/csv');
  }

  return csvContent;
}

// Local version of downloadFile to avoid circular import issues
function downloadFileLocal(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
