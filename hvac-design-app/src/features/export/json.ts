import type { ProjectFile } from '@/core/schema';
import { downloadFile } from './download';

// Re-export for backward compatibility
export { downloadFile };

interface ExportJsonOptions {
  indent?: number;
  download?: boolean;
}

/**
 * Export project to JSON format (legacy function name)
 */
export function exportProjectJSON(project: ProjectFile): string {
  return JSON.stringify(project, null, 2);
}

/**
 * Export project to JSON format with options
 */
export function exportProjectToJson(project: ProjectFile, options: ExportJsonOptions = {}): string {
  const indent = options.indent ?? 2;
  const jsonContent = JSON.stringify(project, null, indent);

  // Handle download option
  if (options.download) {
    const sanitizedName = project.projectName.replace(/[/\\?%*:|"<>\s]/g, '_');
    downloadFile(jsonContent, `${sanitizedName}.json`, 'application/json');
  }

  return jsonContent;
}
