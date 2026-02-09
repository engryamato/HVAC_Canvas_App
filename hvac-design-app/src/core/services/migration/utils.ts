import type { ProjectFile } from '@/core/schema';
import type { ProjectMetaJson } from './types';

export function generateSlug(projectName: string): string {
  return projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 64);
}

export function generateMetaJson(project: ProjectFile): ProjectMetaJson {
  return {
    projectId: project.projectId,
    projectName: project.projectName,
    slug: generateSlug(project.projectName || 'untitled-project'),
    createdAt: project.createdAt,
    modifiedAt: project.modifiedAt,
    version: project.version || '1.0.0',
    storageVersion: 1,
  };
}

export function isTransientError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('ebusy') ||
    message.includes('eagain') ||
    message.includes('eintr') ||
    message.includes('locked') ||
    message.includes('in use')
  );
}
