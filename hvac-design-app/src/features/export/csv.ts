import type { BOMLineItem } from './bom';
import { generateBOM } from './bom';

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
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
  downloadFile(csv, `${projectName}-bom.csv`, 'text/csv;charset=utf-8');
}
