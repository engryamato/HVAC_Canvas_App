import type { ProjectFile, Entity } from '@/core/schema';

/**
 * Export options for JSON export
 */
export interface JsonExportOptions {
  /** Include viewport state (default: true) */
  includeViewport?: boolean;
  /** Include settings (default: true) */
  includeSettings?: boolean;
  /** Pretty print JSON (default: true) */
  prettyPrint?: boolean;
  /** Filter entities by type */
  entityTypes?: Array<'room' | 'duct' | 'equipment' | 'fitting' | 'note' | 'group'>;
}

/**
 * Export result
 */
export interface ExportResult {
  success: boolean;
  data?: string;
  filename?: string;
  error?: string;
}

/**
 * Generate a filename for export
 */
function generateFilename(projectName: string, extension: string): string {
  const sanitized = projectName
    .replace(/[^a-zA-Z0-9-_\s]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
  const date = new Date().toISOString().split('T')[0];
  return `${sanitized}_${date}.${extension}`;
}

/**
 * Export project as JSON
 */
export function exportProjectAsJson(
  project: ProjectFile,
  options: JsonExportOptions = {}
): ExportResult {
  const {
    includeViewport = true,
    includeSettings = true,
    prettyPrint = true,
    entityTypes,
  } = options;

  try {
    // Filter entities if types specified
    let entities = project.entities;
    if (entityTypes && entityTypes.length > 0) {
      const filteredById: Record<string, Entity> = {};
      const filteredIds: string[] = [];

      for (const id of project.entities.allIds) {
        const entity = project.entities.byId[id];
        if (entity && entityTypes.includes(entity.type)) {
          filteredById[id] = entity;
          filteredIds.push(id);
        }
      }

      entities = { byId: filteredById, allIds: filteredIds };
    }

    // Build export object
    const exportData: Partial<ProjectFile> = {
      schemaVersion: project.schemaVersion,
      projectId: project.projectId,
      projectName: project.projectName,
      projectNumber: project.projectNumber,
      clientName: project.clientName,
      createdAt: project.createdAt,
      modifiedAt: new Date().toISOString(),
      entities,
    };

    if (includeViewport) {
      exportData.viewportState = project.viewportState;
    }

    if (includeSettings) {
      exportData.settings = project.settings;
    }

    const data = prettyPrint
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);

    return {
      success: true,
      data,
      filename: generateFilename(project.projectName, 'json'),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export JSON',
    };
  }
}

/**
 * Export entities only as JSON
 */
export function exportEntitiesAsJson(
  entities: ProjectFile['entities'],
  projectName: string,
  options: JsonExportOptions = {}
): ExportResult {
  const { prettyPrint = true, entityTypes } = options;

  try {
    let exportEntities = entities;

    if (entityTypes && entityTypes.length > 0) {
      const filteredById: Record<string, Entity> = {};
      const filteredIds: string[] = [];

      for (const id of entities.allIds) {
        const entity = entities.byId[id];
        if (entity && entityTypes.includes(entity.type)) {
          filteredById[id] = entity;
          filteredIds.push(id);
        }
      }

      exportEntities = { byId: filteredById, allIds: filteredIds };
    }

    const data = prettyPrint
      ? JSON.stringify(exportEntities, null, 2)
      : JSON.stringify(exportEntities);

    return {
      success: true,
      data,
      filename: generateFilename(`${projectName}_entities`, 'json'),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export entities',
    };
  }
}

/**
 * Download a file with the given content
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
