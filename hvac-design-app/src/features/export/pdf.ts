import type { Entity, ProjectFile } from '@/core/schema';
import { generateBOM } from './bom';

export type PdfPageSize = 'a0' | 'a1' | 'a2' | 'a3' | 'a4' | 'letter' | 'legal' | 'tabloid';

export interface ExportPdfOptions {
  pageSize?: PdfPageSize;
  snapshot?: {
    dataUrl: string;
    widthPx: number;
    heightPx: number;
  };
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
      format: getPdfFormat(pageSize),
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

    const marginX = 14;
    const marginY = 14;
    let yPosition = marginY + 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(project.projectName, marginX, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, yPosition);
    yPosition += 8;

    if (options?.snapshot?.dataUrl) {
      yPosition = addSnapshotToPdf(doc, options.snapshot, { marginX, yPosition, marginY });
    }

    doc.addPage();

    yPosition = marginY + 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Entity Summary', marginX, yPosition);
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
    doc.text('Bill of Materials', marginX, yPosition);
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

function getPdfFormat(pageSize: PdfPageSize): [number, number] {
  switch (pageSize) {
    case 'a0':
      return [841, 1189];
    case 'a1':
      return [594, 841];
    case 'a2':
      return [420, 594];
    case 'a3':
      return [297, 420];
    case 'a4':
      return [210, 297];
    case 'legal':
      return [216, 356];
    case 'tabloid':
      return [279, 432];
    case 'letter':
    default:
      return [216, 279];
  }
}

function addSnapshotToPdf(
  doc: any,
  snapshot: { dataUrl: string; widthPx: number; heightPx: number },
  layout: { marginX: number; marginY: number; yPosition: number }
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const availableWidth = pageWidth - layout.marginX * 2;
  const availableHeight = pageHeight - layout.yPosition - layout.marginY;

  const aspectRatio = snapshot.widthPx > 0 ? snapshot.heightPx / snapshot.widthPx : 1;
  let renderWidth = availableWidth;
  let renderHeight = renderWidth * aspectRatio;

  if (renderHeight > availableHeight) {
    renderHeight = availableHeight;
    renderWidth = renderHeight / aspectRatio;
  }

  doc.addImage(snapshot.dataUrl, 'PNG', layout.marginX, layout.yPosition, renderWidth, renderHeight);
  return layout.yPosition + renderHeight + 6;
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
