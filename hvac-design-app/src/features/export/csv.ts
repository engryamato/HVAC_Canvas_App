import type { BOMLineItem } from './bom';
import type { ProjectFile } from '@/core/schema';
import type { WasteFactors } from '@/core/schema/calculation-settings.schema';
import { BOMGenerationService, DEFAULT_BOM_WASTE_FACTORS } from '@/core/services/bom/bomGenerationService';
import { downloadFile } from './download';

// Legacy helpers here are intentionally limited to CSV encoding/formatting.
// Full BOM generation now lives in bomGenerationService (WS7-FU-001 reconciliation).
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
  // WS7 (optional, forward-compat): canonical BOMItem id + unpriced flag the BOM
  // panel reads to link a row to its cost. Unset in the legacy CSV path; the full
  // csv.ts → canonical reconcile is deferred (see WS7-followups.md).
  bomItemId?: string;
  unpriced?: boolean;
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

function toWholeNumber(value: unknown): number | null {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.round(numeric);
}

function formatWholeInches(value: unknown): string {
  const wholeValue = toWholeNumber(value);
  return wholeValue === null ? '' : `${wholeValue}"`;
}

function formatWholeFeet(value: unknown): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '';
  }
  const wholeValue = numeric > 0 ? Math.max(1, Math.round(numeric)) : Math.round(numeric);
  return `${wholeValue}'`;
}

function formatNumber(value: unknown): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '';
  }
  return Number.isInteger(numeric)
    ? String(numeric)
    : numeric.toFixed(2).replace(/\.?0+$/, '');
}

function formatNumberInches(value: unknown): string {
  const formatted = formatNumber(value);
  return formatted ? `${formatted}"` : '';
}

function formatTitleLabel(value: unknown, separator = ''): string {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return '';
  }
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\s+/g, separator);
}

function formatDuctSize(props: Record<string, unknown>): string {
  const shape = String(props.shape ?? '');
  if (shape === 'round' || shape === 'flexible') {
    const diameter = formatWholeInches(props.diameter);
    return diameter ? `⌀${diameter}` : '';
  }
  if (shape === 'rectangular' || shape === 'flat_oval') {
    const width = formatWholeInches(props.width);
    const height = formatWholeInches(props.height);
    return width && height ? `${width}x${height}` : '';
  }
  return '';
}

function formatEndTypeLabel(value: unknown): string {
  return formatTitleLabel(value, '-');
}

function formatEndTypes(props: Record<string, unknown>, defaults?: { inlet: string; outlet: string }): string {
  const inlet = formatEndTypeLabel(
    props.startEndType ?? props.inletEndType ?? props.inletType ?? props.inlet ?? defaults?.inlet
  );
  const outlet = formatEndTypeLabel(
    props.endEndType ?? props.outletEndType ?? props.outletType ?? props.outlet ?? defaults?.outlet
  );
  if (!inlet && !outlet) {
    return '';
  }
  if (inlet === outlet) {
    return `${inlet} Ends`;
  }
  return `${inlet || '-'} by ${outlet || '-'} End`;
}

function formatInsulation(props: Record<string, unknown>): string {
  const insulationType = String(props.insulationType ?? '').trim();
  if (!insulationType) {
    return '';
  }
  const insulationThickness = formatNumberInches(props.insulationThickness);
  if (insulationType === 'wrap' || insulationType === 'wrapped') {
    return [insulationThickness, 'Wrapper'].filter(Boolean).join(' ');
  }
  if (insulationType === 'liner' || insulationType === 'lined') {
    return [insulationThickness, 'Liner'].filter(Boolean).join(' ');
  }
  if (insulationType === 'double_wall_perforated') {
    return ['Double Wall Perforated', insulationThickness].filter(Boolean).join(' ');
  }
  if (insulationType === 'double_wall_non_perforated') {
    return ['Double Wall Non-Perforated', insulationThickness].filter(Boolean).join(' ');
  }
  return [formatTitleLabel(insulationType, ' '), insulationThickness].filter(Boolean).join(' ');
}

interface DuctBomMetadata {
  shape: string;
  shapeLabel: string;
  size: string;
  endTypes: string;
  insulation: string;
}

function getDuctBomMetadata(props: Record<string, unknown>, defaultEnds = false): DuctBomMetadata {
  const shape = String(props.shape ?? '');
  return {
    shape,
    shapeLabel: formatShapeLabel(shape),
    size: formatDuctSize(props),
    endTypes: formatEndTypes(props, defaultEnds ? { inlet: 'flange', outlet: 'flange' } : undefined),
    insulation: formatInsulation(props),
  };
}

/**
 * Duct / duct_run description.
 * Format: "<Size>x<Length> <Shape> Duct <Ends> <Insulation>"
 * Example: "12\"x8\"x5' Rectangular Duct Flange Ends"
 */
function formatDuctDescription(props: Record<string, unknown>): string {
  const metadata = getDuctBomMetadata(props, true);
  const rawLength = props.length ?? props.installLength;
  const length = formatWholeFeet(rawLength);
  const sizeAndLength = [metadata.size, length].filter(Boolean).join('x');

  return [
    sizeAndLength,
    metadata.shapeLabel,
    'Duct',
    metadata.endTypes,
    metadata.insulation,
  ].filter(Boolean).join(' ');
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
  const rawAngle = props.angle !== null && props.angle !== undefined
    ? Math.round(Number(props.angle))
    : null;

  // Elbow variants
  if (fittingType === 'elbow_90' || fittingType === 'elbow_45') {
    const deg = rawAngle ?? (fittingType === 'elbow_90' ? 90 : 45);
    return [shapeLabel, `${deg}° Elbow`].filter(Boolean).join(' ');
  }
  if (fittingType === 'elbow_mitered') {
    return [shapeLabel, 'Mitered Elbow'].filter(Boolean).join(' ');
  }
  // Generic elbow_ prefix with a stored angle
  if (fittingType.startsWith('elbow_') && rawAngle !== null) {
    return [shapeLabel, `${rawAngle}° Elbow`].filter(Boolean).join(' ');
  }

  const labelMap: Record<string, string> = {
    tee:                        'Tee',
    wye:                        'Wye',
    reducer:                    'Reducer',
    reducer_tapered:            'Tapered Reducer',
    reducer_eccentric:          'Eccentric Reducer',
    cap:                        'Cap',
    transition_square_to_round: 'Transition',
    end_boot:                   'Register Boot',
    cross:                      'Cross',
    offset:                     'Offset',
  };

  const label =
    labelMap[fittingType] ??
    (fittingType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Fitting');

  return [shapeLabel, label].filter(Boolean).join(' ');
}

function formatFittingBomDescription(
  props: Record<string, unknown>,
  ductMetadata?: DuctBomMetadata
): { description: string; specifications: string } {
  const transitionData = props.transitionData as Record<string, unknown> | undefined;
  const shape = ductMetadata?.shape || String(transitionData?.fromShape ?? '');
  const base = formatFittingDescription(props, shape);
  const fittingType = String(props.fittingType ?? '');

  let size = ductMetadata?.size ?? '';
  if (!size && transitionData) {
    size =
      transitionData.fromDiameter !== null && transitionData.fromDiameter !== undefined
        ? `⌀${formatWholeInches(transitionData.fromDiameter)}`
        : transitionData.fromWidth !== null &&
            transitionData.fromWidth !== undefined &&
            transitionData.fromHeight !== null &&
            transitionData.fromHeight !== undefined
          ? `${formatWholeInches(transitionData.fromWidth)}x${formatWholeInches(transitionData.fromHeight)}`
          : '';
  }

  const fromShape = String(transitionData?.fromShape ?? shape);
  const toShape = String(transitionData?.toShape ?? '');
  const toSize = transitionData
    ? transitionData.toDiameter !== null && transitionData.toDiameter !== undefined
      ? `⌀${formatWholeInches(transitionData.toDiameter)}`
      : transitionData.toWidth !== null &&
          transitionData.toWidth !== undefined &&
          transitionData.toHeight !== null &&
          transitionData.toHeight !== undefined
        ? `${formatWholeInches(transitionData.toWidth)}x${formatWholeInches(transitionData.toHeight)}`
        : ''
    : '';
  const transitionPrefix = transitionData && toSize
    ? fromShape === toShape
      ? `${size} to ${toSize} ${formatShapeLabel(fromShape)}`
      : `${size} ${formatShapeLabel(fromShape)} to ${toSize} ${formatShapeLabel(toShape)}`
    : '';
  const fittingLabel = fittingType === 'reducer' || fittingType.startsWith('reducer_')
    ? base.replace(formatShapeLabel(shape), '').trim()
    : fittingType === 'transition_square_to_round' || (transitionData && toSize)
      ? 'Transition'
      : base.replace(formatShapeLabel(shape), '').trim();
  const endTypes = formatEndTypes(props) || ductMetadata?.endTypes;
  const insulation = formatInsulation(props) || ductMetadata?.insulation;

  const description = transitionPrefix
    ? [transitionPrefix, fittingLabel, endTypes, insulation].filter(Boolean).join(' ')
    : [size, formatShapeLabel(shape), fittingLabel, endTypes, insulation].filter(Boolean).join(' ');

  return {
    description: description || base,
    specifications: size,
  };
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

  // Build quick duct lookups used to derive fitting descriptions.
  // Used to derive fitting shapes from connected duct runs.
  const ductMetadataByEntityId = new Map<string, DuctBomMetadata>();
  entityList.forEach((entity) => {
    const t = String(entity.type ?? '');
    if (t === 'duct_run' || t === 'duct') {
      const id = String(entity.id ?? '');
      const metadata = getDuctBomMetadata((entity.props as Record<string, unknown>) ?? {}, true);
      if (id && metadata.shape) {
        ductMetadataByEntityId.set(id, metadata);
      }
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
        const sizeStr = formatDuctSize(props);
        const segments = Array.isArray(props.segments) ? props.segments : [];
        const segmentSources = segments.length > 0 ? segments : [null];
        for (const segment of segmentSources) {
          const segmentProps = segment && typeof segment === 'object' && !Array.isArray(segment)
            ? { ...props, ...(segment as Record<string, unknown>) }
            : props;
          const description = formatDuctDescription(segmentProps);
          rawItems.push({
            entityId,
            name: description,
            type: 'Duct',
            description,
            quantity: 1,
            unit: 'EA',
            specifications: sizeStr,
          });
        }
        break;
      }
      case 'fitting': {
        // Derive metadata from transitionData, connectionPoints, or inletDuctId.
        const transitionData = props.transitionData as Record<string, unknown> | undefined;
        let ductMetadata: DuctBomMetadata | undefined;
        if (!transitionData?.fromShape) {
          const connectionPoints = props.connectionPoints as Array<{ ductId: string }> | undefined;
          if (connectionPoints && connectionPoints.length > 0) {
            ductMetadata = ductMetadataByEntityId.get(connectionPoints[0].ductId);
          }
          if (!ductMetadata && props.inletDuctId) {
            ductMetadata = ductMetadataByEntityId.get(String(props.inletDuctId));
          }
          if (!ductMetadata && props.outletDuctId) {
            ductMetadata = ductMetadataByEntityId.get(String(props.outletDuctId));
          }
        } else {
          ductMetadata = getDuctBomMetadata({
            shape: transitionData.fromShape,
            diameter: transitionData.fromDiameter,
            width: transitionData.fromWidth,
            height: transitionData.fromHeight,
          });
        }

        const { description, specifications } = formatFittingBomDescription(props, ductMetadata);
        rawItems.push({
          entityId,
          name: description,
          type: 'Fitting',
          description,
          quantity: 1,
          unit: 'EA',
          specifications,
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

export function downloadBomCsv(
  entities: EntitiesLike,
  projectName: string,
  wasteFactors: WasteFactors = DEFAULT_BOM_WASTE_FACTORS,
): void {
  const items = BOMGenerationService.generateBOMFromEntityStore(
    { byId: entities.byId, allIds: entities.allIds } as unknown as Parameters<typeof BOMGenerationService.generateBOMFromEntityStore>[0],
    wasteFactors,
  );
  const csv = BOMGenerationService.exportToCSV(items);
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
