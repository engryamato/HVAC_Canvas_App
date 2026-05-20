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
  entityId?: string;
  name: string;
  type: string;
  description: string;
  quantity: number;
  unit: string;
  specifications: string;
}

// ---------------------------------------------------------------------------
// Helpers for description formatting
// ---------------------------------------------------------------------------

/** Humanise a duct shape enum value: "rectangular" → "Rectangular", etc. */
function formatShapeLabel(shape: string): string {
  switch (shape) {
    case 'rectangular': return 'Rectangular';
    case 'round':       return 'Round';
    case 'flat_oval':   return 'Flat Oval';
    case 'flexible':    return 'Flexible';
    default: return shape ? shape.charAt(0).toUpperCase() + shape.slice(1) : '';
  }
}

/**
 * Duct / duct_run description.
 * Format: "<Shape> Duct <size> × <length>"
 * Example: "Rectangular Duct 12\" × 8\" × 5'"
 */
function formatDuctDescription(props: Record<string, unknown>): string {
  const shape = String(props.shape ?? '');
  const shapeLabel = formatShapeLabel(shape) || 'Duct';

  let sizeStr = '';
  if (shape === 'round' || shape === 'flexible') {
    sizeStr = props.diameter != null ? `${props.diameter}"` : '';
  } else if (shape === 'rectangular' || shape === 'flat_oval') {
    sizeStr =
      props.width != null && props.height != null
        ? `${props.width}" × ${props.height}"`
        : '';
  }

  // installLength (duct_run) or length (legacy duct) — both in feet
  const rawLength = props.installLength ?? props.length;
  const lengthStr = rawLength != null ? `${rawLength}'` : '';

  const label = `${shapeLabel} Duct`;
  if (sizeStr && lengthStr) return `${label} ${sizeStr} × ${lengthStr}`;
  if (sizeStr) return `${label} ${sizeStr}`;
  if (lengthStr) return `${label} ${lengthStr}`;
  return label;
}

/**
 * Fitting description with optional shape prefix.
 * Format: "<Shape> <angle>° Elbow" or "<Shape> Tee" etc.
 * Example: "Round 90° Elbow", "Rectangular Reducer"
 */
function formatFittingDescription(props: Record<string, unknown>, shape = ''): string {
  const fittingType = String(props.fittingType ?? '');
  const shapeLabel = formatShapeLabel(shape);

  // Prefer explicit angle prop; fall back to type-encoded angle
  const rawAngle = props.angle != null ? Math.round(Number(props.angle)) : null;

  // Elbow variants
  if (fittingType === 'elbow_90' || fittingType === 'elbow_45') {
    const deg = rawAngle ?? (fittingType === 'elbow_90' ? 90 : 45);
    return [shapeLabel, `${deg}° Elbow`].filter(Boolean).join(' ');
  }
  if (fittingType === 'elbow_mitered') {
    return [shapeLabel, 'Mitered Elbow'].filter(Boolean).join(' ');
  }
  // Generic elbow_ prefix with a stored angle
  if (fittingType.startsWith('elbow_') && rawAngle != null) {
    return [shapeLabel, `${rawAngle}° Elbow`].filter(Boolean).join(' ');
  }

  const labelMap: Record<string, string> = {
    tee:                        'Tee',
    wye:                        'Wye',
    reducer:                    'Reducer',
    reducer_tapered:            'Tapered Reducer',
    reducer_eccentric:          'Eccentric Reducer',
    cap:                        'Cap',
    transition_square_to_round: 'Square-to-Round Transition',
    end_boot:                   'End Boot',
  };

  const label =
    labelMap[fittingType] ??
    (fittingType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Fitting');

  return [shapeLabel, label].filter(Boolean).join(' ');
}

function formatEquipmentDescription(props: Record<string, unknown>): string {
  const parts = [props.manufacturer, props.model ?? props.modelNumber, props.equipmentType]
    .filter(Boolean)
    .map(String);
  return parts.join(' ') || 'Equipment';
}

/**
 * Generate bill of materials from entities.
 *
 * Handles both modern `duct_run` and legacy `duct` entity types.
 * Identical items (same type + description) are automatically grouped.
 * Fitting descriptions include duct shape derived from connected duct runs.
 */
export function generateBillOfMaterials(entities: EntitiesLike): BomItem[] {
  const entityList = entities.allIds
    .map((id) => entities.byId[id])
    .filter((e): e is Record<string, unknown> => e !== undefined);

  // Build a quick shape lookup: entityId → shape string
  // Used to derive fitting shapes from connected duct runs.
  const shapeByEntityId = new Map<string, string>();
  entityList.forEach((entity) => {
    const t = String(entity.type ?? '');
    if (t === 'duct_run' || t === 'duct') {
      const id = String(entity.id ?? '');
      const shape = String((entity.props as Record<string, unknown> ?? {}).shape ?? '');
      if (id && shape) shapeByEntityId.set(id, shape);
    }
  });

  // --- Build raw (ungrouped) line items ---
  type RawItem = Omit<BomItem, 'itemNumber'>;
  const rawItems: RawItem[] = [];

  entityList.forEach((entity) => {
    const entityType = String(entity.type ?? 'unknown');
    const props = (entity.props ?? {}) as Record<string, unknown>;
    const entityId = String(entity.id ?? '');

    switch (entityType) {
      case 'duct_run':
      case 'duct': {
        const description = formatDuctDescription(props);
        const shape = String(props.shape ?? '');
        let sizeStr = '';
        if (shape === 'round' || shape === 'flexible') {
          sizeStr = props.diameter != null ? `${props.diameter}"` : '';
        } else if (shape === 'rectangular' || shape === 'flat_oval') {
          sizeStr =
            props.width != null && props.height != null
              ? `${props.width}" × ${props.height}"`
              : '';
        }
        rawItems.push({
          entityId,
          name: description,
          type: 'Duct',
          description,
          quantity: 1,
          unit: 'EA',
          specifications: sizeStr,
        });
        break;
      }
      case 'fitting': {
        // Derive shape from transitionData, connectionPoints, or inletDuctId
        const transitionData = props.transitionData as Record<string, unknown> | undefined;
        let fittingShape = '';
        if (transitionData?.fromShape) {
          fittingShape = String(transitionData.fromShape);
        } else {
          const connectionPoints = props.connectionPoints as Array<{ ductId: string }> | undefined;
          if (connectionPoints && connectionPoints.length > 0) {
            fittingShape = shapeByEntityId.get(connectionPoints[0].ductId) ?? '';
          }
          if (!fittingShape && props.inletDuctId) {
            fittingShape = shapeByEntityId.get(String(props.inletDuctId)) ?? '';
          }
        }

        const description = formatFittingDescription(props, fittingShape);
        rawItems.push({
          entityId,
          name: description,
          type: 'Fitting',
          description,
          quantity: 1,
          unit: 'EA',
          specifications: '',
        });
        break;
      }
      case 'equipment': {
        const description = formatEquipmentDescription(props);
        rawItems.push({
          entityId,
          name: description,
          type: 'Equipment',
          description,
          quantity: 1,
          unit: 'EA',
          specifications: String(props.equipmentType ?? ''),
        });
        break;
      }
      // Skip non-BOM entity types
      case 'room':
      case 'note':
      case 'group':
        break;
      default: {
        const description = String(props.name ?? entityType);
        rawItems.push({
          entityId,
          name: description,
          type: 'Accessory',
          description,
          quantity: 1,
          unit: 'EA',
          specifications: '',
        });
      }
    }
  });

  // --- Group identical items (same type + description) ---
  const grouped = new Map<string, RawItem>();
  for (const item of rawItems) {
    const key = `${item.type}::${item.description}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += 1;
      // Keep the first entityId for canvas highlight sync
    } else {
      grouped.set(key, { ...item });
    }
  }

  // --- Assign sequential item numbers ---
  return Array.from(grouped.values()).map((item, index) => ({
    ...item,
    itemNumber: index + 1,
  }));
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
      const model = props.model
        ? ` ${props.model}`
        : props.modelNumber
          ? ` ${props.modelNumber}`
          : '';
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
