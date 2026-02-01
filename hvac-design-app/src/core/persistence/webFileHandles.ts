export type WebProjectFileHandle = FileSystemFileHandle;

const handlesByProjectId = new Map<string, WebProjectFileHandle>();

export function getWebProjectFileHandle(projectId: string): WebProjectFileHandle | undefined {
  return handlesByProjectId.get(projectId);
}

export function setWebProjectFileHandle(projectId: string, handle: WebProjectFileHandle): void {
  handlesByProjectId.set(projectId, handle);
}

export function clearWebProjectFileHandle(projectId: string): void {
  handlesByProjectId.delete(projectId);
}

