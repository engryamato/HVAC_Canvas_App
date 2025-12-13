import type { ProjectFile } from '@/core/schema';

export function exportProjectJSON(project: ProjectFile): string {
  return JSON.stringify(project, null, 2);
}
