import { z } from 'zod';

/**
 * Backup metadata
 */
export interface BackupMetadata {
  id: string;
  name: string;
  createdAt: Date;
  size: number;
  version: string;
  description?: string;
}

/**
 * Backup data structure
 */
export interface Backup {
  metadata: BackupMetadata;
  data: unknown;
}

/**
 * Backup validation schema
 */
export const BackupMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.coerce.date(),
  size: z.number(),
  version: z.string(),
  description: z.string().optional(),
});

/**
 * Configuration for backup manager
 */
export interface BackupManagerConfig {
  maxBackups: number;
  storagePrefix: string;
}

const DEFAULT_CONFIG: BackupManagerConfig = {
  maxBackups: 10,
  storagePrefix: 'hvac_backup_',
};

/**
 * Manages backups for data migration rollback
 */
export class BackupManager {
  private config: BackupManagerConfig;

  constructor(config: Partial<BackupManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create a backup with metadata
   */
  async createBackup(
    data: unknown,
    name: string,
    version: string,
    description?: string
  ): Promise<BackupMetadata> {
    const id = this.generateBackupId();
    const dataString = JSON.stringify(data);
    const size = new Blob([dataString]).size;

    const metadata: BackupMetadata = {
      id,
      name,
      createdAt: new Date(),
      size,
      version,
      description,
    };

    const backup: Backup = {
      metadata,
      data,
    };

    // Store backup
    await this.storeBackup(id, backup);
    
    // Update index
    await this.addToIndex(metadata);
    
    // Cleanup old backups
    await this.cleanupOldBackups();

    return metadata;
  }

  /**
   * Restore from backup
   */
  async restoreBackup(id: string): Promise<Backup | null> {
    return this.retrieveBackup(id);
  }

  /**
   * Delete a backup
   */
  async deleteBackup(id: string): Promise<boolean> {
    try {
      await this.removeBackup(id);
      await this.removeFromIndex(id);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List all backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    return this.getIndex();
  }

  /**
   * Get backup by ID
   */
  async getBackupMetadata(id: string): Promise<BackupMetadata | null> {
    const index = await this.getIndex();
    return index.find((b) => b.id === id) || null;
  }

  /**
   * Check if backup exists
   */
  async hasBackup(id: string): Promise<boolean> {
    const metadata = await this.getBackupMetadata(id);
    return metadata !== null;
  }

  /**
   * Create automatic pre-migration backup
   */
  async createPreMigrationBackup(
    data: unknown,
    fromVersion: string
  ): Promise<BackupMetadata> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return this.createBackup(
      data,
      `pre-migration-${timestamp}`,
      fromVersion,
      `Automatic backup before migration from v${fromVersion}`
    );
  }

  /**
   * Rollback to a specific backup
   */
  async rollback(id: string): Promise<Backup | null> {
    const backup = await this.restoreBackup(id);
    if (!backup) {
      return null;
    }
    return backup;
  }

  /**
   * Export backup to JSON string
   */
  exportBackup(id: string): Promise<string | null> {
    return this.retrieveBackupData(id);
  }

  /**
   * Import backup from JSON string
   */
  async importBackup(jsonString: string): Promise<BackupMetadata | null> {
    try {
      const parsed = JSON.parse(jsonString) as Backup;
      const validated = this.validateBackup(parsed);
      if (!validated) {
        return null;
      }

      await this.storeBackup(parsed.metadata.id, parsed);
      await this.addToIndex(parsed.metadata);
      return parsed.metadata;
    } catch {
      return null;
    }
  }

  /**
   * Validate backup structure
   */
  private validateBackup(backup: unknown): backup is Backup {
    if (!backup || typeof backup !== 'object') {
      return false;
    }
    const b = backup as Record<string, unknown>;
    return (
      typeof b.metadata === 'object' &&
      b.metadata !== null &&
      typeof b.data !== 'undefined'
    );
  }

  /**
   * Generate unique backup ID
   */
  private generateBackupId(): string {
    return `${this.config.storagePrefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store backup (abstracted for different storage backends)
   */
  private async storeBackup(id: string, backup: Backup): Promise<void> {
    const key = `${this.config.storagePrefix}${id}`;
    const data = JSON.stringify(backup);
    
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, data);
    }
  }

  /**
   * Retrieve backup
   */
  private async retrieveBackup(id: string): Promise<Backup | null> {
    const key = `${this.config.storagePrefix}${id}`;
    
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(key);
      if (data) {
        try {
          return JSON.parse(data) as Backup;
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  /**
   * Retrieve backup data only
   */
  private async retrieveBackupData(id: string): Promise<string | null> {
    const key = `${this.config.storagePrefix}${id}`;
    
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  }

  /**
   * Remove backup
   */
  private async removeBackup(id: string): Promise<void> {
    const key = `${this.config.storagePrefix}${id}`;
    
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  }

  /**
   * Get backup index
   */
  private async getIndex(): Promise<BackupMetadata[]> {
    const key = `${this.config.storagePrefix}index`;
    
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data) as BackupMetadata[];
          return parsed.map((item) => ({
            ...item,
            createdAt: new Date(item.createdAt),
          }));
        } catch {
          return [];
        }
      }
    }
    return [];
  }

  /**
   * Add to index
   */
  private async addToIndex(metadata: BackupMetadata): Promise<void> {
    const index = await this.getIndex();
    index.push(metadata);
    index.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const key = `${this.config.storagePrefix}index`;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(index));
    }
  }

  /**
   * Remove from index
   */
  private async removeFromIndex(id: string): Promise<void> {
    const index = await this.getIndex();
    const filtered = index.filter((b) => b.id !== id);
    
    const key = `${this.config.storagePrefix}index`;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(filtered));
    }
  }

  /**
   * Cleanup old backups exceeding max limit
   */
  private async cleanupOldBackups(): Promise<void> {
    const index = await this.getIndex();
    
    if (index.length > this.config.maxBackups) {
      const toDelete = index.slice(this.config.maxBackups);
      
      for (const backup of toDelete) {
        await this.deleteBackup(backup.id);
      }
    }
  }

  /**
   * Get total storage used by backups
   */
  async getStorageUsed(): Promise<number> {
    const index = await this.getIndex();
    return index.reduce((total, backup) => total + backup.size, 0);
  }

  /**
   * Clear all backups
   */
  async clearAllBackups(): Promise<void> {
    const index = await this.getIndex();
    
    for (const backup of index) {
      await this.deleteBackup(backup.id);
    }
  }
}

// Export singleton instance
export const backupManager = new BackupManager();

export default BackupManager;
