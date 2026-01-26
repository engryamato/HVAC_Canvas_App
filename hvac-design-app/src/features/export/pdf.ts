import type { Entity, ProjectFile } from '@/core/schema';
import { generateBOM } from './bom';

export type PdfPageSize = 'a0' | 'a1' | 'a2' | 'a3' | 'a4' | 'letter' | 'legal' | 'tabloid';

export interface ExportPdfOptions {
  pageSize?: PdfPageSize;
}

export interface PdfExportResult {
  success: boolean;
  data?: Uint8Array;
  error?: string;
}

export async function exportProjectPDF(project: ProjectFile, options?: ExportPdfOptions): Promise<PdfExportResult> {
  if (!project) {
    return { success: false, error: 'No project loaded' };
  }

  try {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const pageSize = options?.pageSize ?? 'letter';
    const doc = new jsPDF({
      unit: 'mm',
      format: pageSize,
    });

    const entityList = project.entities.allIds
      .map((id) => project.entities.byId[id])
      .filter((entity): entity is Entity => entity !== undefined);

    const entityCountsByType = new Map<string, number>();
    entityList.forEach((entity) => {
      entityCountsByType.set(entity.type, (entityCountsByType.get(entity.type) ?? 0) + 1);
    });

    const bom = generateBOM(
      entityList.map((entity) => ({
        type: entity.type,
        description: getEntityDisplayName(entity) ?? `${entity.type} item`,
        material: (entity.props as any)?.material,
        size: getEntitySizeLabel(entity),
      }))
    );

    let yPosition = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(project.projectName, 14, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Entity Summary', 14, yPosition);
    yPosition += 4;

    autoTable(doc, {
      startY: yPosition,
      head: [['Type', 'Count']],
      body: Array.from(entityCountsByType.entries()).map(([type, count]) => [type, count.toString()]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [243, 244, 246], textColor: 17 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Bill of Materials', 14, yPosition);
    yPosition += 4;

    autoTable(doc, {
      startY: yPosition,
      head: [['Category', 'Description', 'Qty', 'Unit', 'Size', 'Material']],
      body: bom.map((item) => [
        item.category,
        item.description,
        item.quantity.toString(),
        item.unit ?? '',
        item.size ?? '',
        item.material ?? '',
      ]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [243, 244, 246], textColor: 17 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 70 },
        2: { cellWidth: 10 },
        3: { cellWidth: 12 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 },
      },
    });

    const pdfOutput = doc.output('arraybuffer');
    return { success: true, data: new Uint8Array(pdfOutput) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown PDF error';
    return { success: false, error: message };
  }
}

function getEntitySizeLabel(entity: Entity): string | undefined {
  const props = entity.props as any;
  if (!props || typeof props !== 'object') {
    return undefined;
  }

  const hasWidth = typeof props.width === 'number';
  const hasHeight = typeof props.height === 'number';
  const hasLength = typeof props.length === 'number';

  if (hasWidth && hasHeight) {
    return `${props.width}x${props.height}`;
  }

  if (hasWidth && hasLength) {
    return `${props.width}x${props.length}`;
  }

  if (hasWidth) {
    return `${props.width}`;
  }

  return undefined;
}

function getEntityDisplayName(entity: Entity): string | undefined {
  switch (entity.type) {
    case 'room':
    case 'duct':
    case 'equipment':
    case 'fitting':
    case 'group':
      return entity.props.name;
    case 'note':
      return entity.props.content;
    default:
      return undefined;
  }
}
