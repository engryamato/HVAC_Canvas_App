import { logger } from '@/utils/logger';

export interface CloudBackupPayload {
  projectId: string;
  savedAt: string;
  schemaVersion: string;
  checksum: string;
  payload: unknown;
}

export async function sendCloudBackup(backup: CloudBackupPayload): Promise<boolean> {
  const endpoint = process.env.NEXT_PUBLIC_BACKUP_ENDPOINT;

  if (!endpoint) {
    logger.warn('[CloudBackup] Skipping backup; endpoint not configured.');
    return false;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backup),
    });

    if (!response.ok) {
      logger.warn('[CloudBackup] Backup failed', response.status);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('[CloudBackup] Backup request failed', error);
    return false;
  }
}
