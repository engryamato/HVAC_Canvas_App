import type { ProjectFile } from '@/core/schema';
import { serializeProject } from '@/core/persistence/serialization';
import { getWebProjectFileHandle, setWebProjectFileHandle } from './webFileHandles';

function supportsOpenFilePicker(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
}

function supportsSaveFilePicker(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
}

function buildSuggestedFileName(projectName: string, fallbackBase: string): string {
  const base = projectName.trim() || fallbackBase;
  const sanitized = base.replace(/[^a-zA-Z0-9 _-]/g, '').trim();
  return `${sanitized || fallbackBase}.sws`;
}

async function writeTextToHandle(handle: FileSystemFileHandle, contents: string): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(contents);
  await writable.close();
}

export function downloadProjectFile(project: ProjectFile, fileName?: string): void {
  const serialized = serializeProject(project);
  if (!serialized.success || !serialized.data) {
    throw new Error(serialized.error || 'Failed to serialize project');
  }

  const blob = new Blob([serialized.data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName || buildSuggestedFileName(project.projectName, 'project');
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function saveProjectToExistingHandleOrDownload(project: ProjectFile): Promise<void> {
  const handle = getWebProjectFileHandle(project.projectId);
  if (!handle) {
    downloadProjectFile(project);
    return;
  }

  const serialized = serializeProject(project);
  if (!serialized.success || !serialized.data) {
    throw new Error(serialized.error || 'Failed to serialize project');
  }

  await writeTextToHandle(handle, serialized.data);
}

export async function saveProjectAsAndRememberHandle(project: ProjectFile): Promise<void> {
  if (!supportsSaveFilePicker()) {
    downloadProjectFile(project);
    return;
  }

  const suggestedName = buildSuggestedFileName(project.projectName, 'project');
  const handle = await (window as any).showSaveFilePicker({
    suggestedName,
    types: [
      {
        description: 'HVAC Project (.sws)',
        accept: {
          'application/json': ['.sws'],
        },
      },
    ],
  });

  const serialized = serializeProject(project);
  if (!serialized.success || !serialized.data) {
    throw new Error(serialized.error || 'Failed to serialize project');
  }

  await writeTextToHandle(handle, serialized.data);
  setWebProjectFileHandle(project.projectId, handle);
}

export async function openProjectFromPicker(): Promise<
  | {
      contents: string;
      fileHandle: FileSystemFileHandle;
      fileName: string;
    }
  | null
> {
  if (!supportsOpenFilePicker()) {
    throw new Error('File System Access API not supported in this browser');
  }

  try {
    const [fileHandle] = await (window as any).showOpenFilePicker({
      types: [
        {
          description: 'HVAC Projects',
          accept: {
            'application/json': ['.sws', '.json'],
          },
        },
      ],
      multiple: false,
    });

    const file = await fileHandle.getFile();
    const contents = await file.text();
    return {
      contents,
      fileHandle,
      fileName: file.name,
    };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return null;
    }
    throw error;
  }
}
