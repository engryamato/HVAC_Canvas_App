import type { ProjectFile } from '@/core/schema';

export interface ExportPdfOptions {
  pageSize?: 'letter' | 'a4';
}

export interface PdfExportResult {
  success: boolean;
  data?: string;
  error?: string;
}

/**
 * Minimal PDF export placeholder. In offline environments we return a
 * plain-text representation that can be written to a PDF by host code.
 */
export async function exportProjectPDF(project: ProjectFile, options?: ExportPdfOptions): Promise<PdfExportResult> {
  if (!project) {
    return { success: false, error: 'No project loaded' };
  }

  const summary = [
    `Project: ${project.projectName}`,
    `Entities: ${project.entities.allIds.length}`,
    `Page Size: ${options?.pageSize ?? 'letter'}`,
    'Sections:',
    '- Cover page',
    '- Canvas snapshot placeholder',
    '- Bill of materials summary',
    '- Calculation summary placeholder',
  ].join('\n');

  return { success: true, data: summary };
}
