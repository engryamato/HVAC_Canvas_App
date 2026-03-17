import type { ProjectFile } from '@/core/schema';
import { snapshotFromStores } from '@/core/persistence';

export function buildExportProjectSnapshot(): ProjectFile | null {
    return snapshotFromStores();
}
