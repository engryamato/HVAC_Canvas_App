import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { StorageAdapter } from '../StorageAdapter';
import type {
  StorageConfig,
  SaveOptions,
  SaveResult,
  LoadResult,
  DeleteResult,
  DuplicateResult,
  AutoSaveResult,
  AutoSaveMetadata,
  StorageInfo,
} from '../types';
import {
  ProjectFile,
  ProjectMetadata,
  ProjectFileSchema,
  ProjectMetadataSchema
} from '../../schema/project-file.schema';
import {
  serializeProject,
  deserializeProject,
  deserializeProjectLenient,
  migrateProject,
} from '../serialization';

interface SizeWiseDB extends DBSchema {
  projects: {
    key: string;
    value: {
      projectId: string;
      content: string; // Serialized project JSON
      metadata: ProjectMetadata; // Parsed metadata for fast listing
    };
    indexes: { 'by-modified': string };
  };
  backups: {
    key: string;
    value: {
      projectId: string;
      content: string;
      timestamp: string;
    };
  };
  autoSaves: {
    key: string;
    value: {
      autoSaveId: string;
      projectId: string;
      timestamp: string;
      content: string;
    };
    indexes: { 'by-project': string };
  };
  thumbnails: {
    key: string;
    value: {
      projectId: string;
      data: Blob;
    };
  };
}

/**
 * Web-based storage adapter implementing StorageAdapter using IndexedDB.
 * Provides full parity with Tauri filesystem storage for CRUD, auto-save, and backups.
 */
export class WebStorageAdapter implements StorageAdapter {
  private dbPromise: Promise<IDBPDatabase<SizeWiseDB>>;
  private readonly autoSaveConfig: {
    enabled: boolean;
    intervalMs: number;
    keepCount: number;
  };

  constructor(config?: StorageConfig) {
    this.autoSaveConfig = {
      enabled: config?.autoSave?.enabled ?? true,
      intervalMs: config?.autoSave?.intervalMs ?? 60000,
      keepCount: config?.autoSave?.maxCopies ?? 5,
    };

    this.dbPromise = openDB<SizeWiseDB>('sizewise-hvac', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('projects')) {
          const store = db.createObjectStore('projects', { keyPath: 'projectId' });
          store.createIndex('by-modified', 'metadata.modifiedAt');
        }
        if (!db.objectStoreNames.contains('backups')) {
          db.createObjectStore('backups', { keyPath: 'projectId' });
        }
        if (!db.objectStoreNames.contains('autoSaves')) {
          const store = db.createObjectStore('autoSaves', { keyPath: 'autoSaveId' });
          store.createIndex('by-project', 'projectId');
        }
        if (!db.objectStoreNames.contains('thumbnails')) {
          db.createObjectStore('thumbnails', { keyPath: 'projectId' });
        }
      },
    });
  }

  // ==================== Helper Methods ====================

  private sanitizeTimestamp(timestamp: string): string {
    return timestamp.replace(/:/g, '-');
  }

  // ==================== Project CRUD Operations ====================

  async saveProject(project: ProjectFile, options?: SaveOptions): Promise<SaveResult> {
    try {
      const db = await this.dbPromise;

      // Validate project
      const validationResult = ProjectFileSchema.safeParse(project);
      if (!validationResult.success) {
        return { success: false, errorCode: 'VALIDATION_ERROR' };
      }

      // Serialize project
      const updatedProject = {
        ...project,
        modifiedAt: new Date().toISOString(),
      };

      const serializationResult = serializeProject(updatedProject);
      if (!serializationResult.success || !serializationResult.data) {
        return { success: false, errorCode: 'WRITE_ERROR' };
      }

      const content = serializationResult.data;
      const metadataResult = ProjectMetadataSchema.safeParse(updatedProject);
      
      if (!metadataResult.success) {
          return { success: false, errorCode: 'VALIDATION_ERROR' };
      }

      // Transaction for atomicity (simulating file write + metadata update)
      const tx = db.transaction(['projects', 'backups'], 'readwrite');
      
      // Create backup if requested
      if (options?.createBackup !== false) {
        // Read existing to backup
        const existing = await tx.objectStore('projects').get(project.projectId);
        if (existing) {
          await tx.objectStore('backups').put({
            projectId: project.projectId,
            content: existing.content,
            timestamp: new Date().toISOString()
          });
        }
      }

      await tx.objectStore('projects').put({
        projectId: project.projectId,
        content,
        metadata: metadataResult.data,
      });

      await tx.done;

      const sizeBytes = new Blob([content]).size;

      return {
        success: true,
        filePath: `indexeddb://${project.projectId}`, // Virtual path
        sizeBytes,
      };
    } catch (error) {
       console.error('WebStorageAdapter.saveProject error:', error);
       // Check for quota error
       if (error instanceof Error && error.name === 'QuotaExceededError') {
           return { success: false, errorCode: 'QUOTA_EXCEEDED' };
       }
       return { success: false, errorCode: 'WRITE_ERROR' };
    }
  }

  async loadProject(projectId: string): Promise<LoadResult> {
    try {
      const db = await this.dbPromise;
      let source: 'file' | 'localStorage' | 'indexedDB' = 'indexedDB';

      // Try main project store
      const record = await db.get('projects', projectId);
      const content = record?.content;

      // Schema migration/Corruption handling logic mirroring Tauri adapter
      // If main missing/corrupt, try backup
      if (!content) {
          // If record missing, return not found
          // But wait, Tauri tries backup if file exists but deserialize fails. 
          // Here if record is missing, it's effectively FILE_NOT_FOUND.
          // BUT if deserialize fails (content corrupted), we fallback.
          return { success: false, errorCode: 'FILE_NOT_FOUND' };
      }

      let deserializeResult = deserializeProject(content);

      if (!deserializeResult.success) {
        // Try backup
        const backup = await db.get('backups', projectId);
        if (backup?.content) {
            const backupResult = deserializeProject(backup.content);
            if (backupResult.success) {
                deserializeResult = backupResult;
                source = 'localStorage'; // Mapping "backup" concept to localStorage enum for now or maintain parity
                // Actually 'localStorage' in LoadResult.source means "browser storage" usually?
                // Tauri adapter uses 'localStorage' enum value for backup source quirkily.
                // We'll stick to 'indexedDB' but maybe just note it was recovered.
            }
        }
      }

      if (!deserializeResult.success) {
          // Try auto-saves
          const autoSaves = await db.getAllFromIndex('autoSaves', 'by-project', projectId);
          // Sort desc
          autoSaves.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          for (const autoSave of autoSaves) {
              const asResult = deserializeProject(autoSave.content);
              if (asResult.success) {
                  deserializeResult = asResult;
                  break;
              }
          }
      }

      if (!deserializeResult.success) {
          deserializeResult = deserializeProjectLenient(content);
      }

      if (!deserializeResult.success || !deserializeResult.data) {
          return { success: false, errorCode: 'CORRUPTED_FILE' };
      }

      // Check migration
      let project = deserializeResult.data;
      let migrated = false;
      if (deserializeResult.requiresMigration && deserializeResult.foundVersion) {
        const migrationResult = migrateProject(project, deserializeResult.foundVersion);
        if (migrationResult.success && migrationResult.data) {
          project = migrationResult.data;
          migrated = true;
        } else {
          return { success: false, errorCode: 'MIGRATION_REQUIRED' };
        }
      }

      return {
        success: true,
        project,
        source,
        migrated,
      };

    } catch (error) {
      console.error('WebStorageAdapter.loadProject error:', error);
      return { success: false, errorCode: 'READ_ERROR' };
    }
  }

  async deleteProject(projectId: string): Promise<DeleteResult> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(['projects', 'backups', 'autoSaves', 'thumbnails'], 'readwrite');

      await tx.objectStore('projects').delete(projectId);
      await tx.objectStore('backups').delete(projectId);
      await tx.objectStore('thumbnails').delete(projectId);

      // Delete auto-saves for this project
      const autoSaveStore = tx.objectStore('autoSaves');
      const autoSaveIndex = autoSaveStore.index('by-project');
      const autoSaves = await autoSaveIndex.getAllKeys(projectId);
      
      // Ideally delete range, but iterating keys is fine for Idb
      await Promise.all(autoSaves.map(key => autoSaveStore.delete(key)));
      
      await tx.done;
      return { success: true };
    } catch (error) {
      console.error('WebStorageAdapter.deleteProject error:', error);
      return { success: false, errorCode: 'DELETE_ERROR' };
    }
  }

  async duplicateProject(projectId: string, newName: string): Promise<DuplicateResult> {
    try {
      const loadResult = await this.loadProject(projectId);
      if (!loadResult.success || !loadResult.project) {
        return { success: false, errorCode: loadResult.errorCode };
      }

      const newProjectId = crypto.randomUUID();
      const now = new Date().toISOString();

      const duplicatedProject: ProjectFile = {
        ...loadResult.project,
        projectId: newProjectId,
        projectName: newName,
        createdAt: now,
        modifiedAt: now,
        scope: loadResult.project.scope as any,
        siteConditions: loadResult.project.siteConditions as any,
        isArchived: false,
      };

      const saveResult = await this.saveProject(duplicatedProject);
      if (!saveResult.success) {
        return { success: false, errorCode: saveResult.errorCode };
      }

      return {
        success: true,
        project: duplicatedProject,
        source: 'indexedDB',
        migrated: false,
      };
    } catch (error) {
       console.error('WebStorageAdapter.duplicateProject error:', error);
       return { success: false, errorCode: 'WRITE_ERROR' };
    }
  }

  // ==================== Project Discovery Operations ====================

  async listProjects(): Promise<ProjectMetadata[]> {
    try {
      const db = await this.dbPromise;
      const records = await db.getAll('projects');
      
      // Extract metadata
      const projects = records.map(r => r.metadata);

      // Sort by modifiedAt descending
      projects.sort((a, b) => 
        new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
      );

      return projects;
    } catch (error) {
      console.error('WebStorageAdapter.listProjects error:', error);
      return [];
    }
  }

  async searchProjects(query: string): Promise<ProjectMetadata[]> {
    const allProjects = await this.listProjects();
    const lowerQuery = query.toLowerCase();

    return allProjects.filter((project) => 
      project.projectName.toLowerCase().includes(lowerQuery) ||
      project.projectNumber?.toLowerCase().includes(lowerQuery) ||
      project.clientName?.toLowerCase().includes(lowerQuery) ||
      project.location?.toLowerCase().includes(lowerQuery)
    );
  }

  // ==================== Auto-Save Operations ====================

  async autoSave(project: ProjectFile): Promise<AutoSaveResult> {
     try {
         const db = await this.dbPromise;
         const timestamp = new Date().toISOString();
         const sanitizedTimestamp = this.sanitizeTimestamp(timestamp);
         const autoSaveId = `${project.projectId}-${sanitizedTimestamp}`;

         const serializationResult = serializeProject(project);
         if (!serializationResult.success || !serializationResult.data) {
             return { success: false, errorCode: 'WRITE_ERROR', timestamp, autoSaveId };
         }
         
         const content = serializationResult.data;

         await db.put('autoSaves', {
             autoSaveId,
             projectId: project.projectId,
             timestamp: new Date().toISOString(), // Use raw ISO for sorting
             content
         });

         await this.cleanupAutoSaves(project.projectId, this.autoSaveConfig.keepCount);

         return {
             success: true,
             timestamp,
             autoSaveId,
             sizeBytes: new Blob([content]).size
         };
     } catch (error) {
         console.error('WebStorageAdapter.autoSave error:', error);
         const timestamp = new Date().toISOString();
         return { success: false, errorCode: 'WRITE_ERROR', timestamp, autoSaveId: `err-${timestamp}` };
     }
  }

  async listAutoSaves(projectId: string): Promise<AutoSaveMetadata[]> {
    try {
        const db = await this.dbPromise;
        const autoSaves = await db.getAllFromIndex('autoSaves', 'by-project', projectId);
        
        return autoSaves
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map(record => ({
                projectId,
                timestamp: record.timestamp,
                autoSaveId: record.autoSaveId,
                sizeBytes: new Blob([record.content]).size,
                source: 'indexedDB' // Mapped to indexedDB (vs file)
            }));
    } catch (error) {
        console.error('WebStorageAdapter.listAutoSaves error:', error);
        return [];
    }
  }

  async restoreAutoSave(projectId: string, timestamp: string): Promise<LoadResult> {
    try {
        // Here timestamp might be sanitized or raw. 
        // Our 'autoSaveId' construction uses sanitized.
        // But listAutoSaves returns raw timestamp. 
        // To find the record, we should probably query by projectId and timestamp 
        // OR construct autoSaveId using sanitized timestamp if we assume timestamp passed is ISO. 
        
        // This method usually receives timestamp from listAutoSaves (ISO).
        const sanitizedTimestamp = this.sanitizeTimestamp(timestamp);
        const autoSaveId = `${projectId}-${sanitizedTimestamp}`;
        
        const db = await this.dbPromise;
        const record = await db.get('autoSaves', autoSaveId);
        
        if (!record) {
             return { success: false, errorCode: 'FILE_NOT_FOUND' };
        }

        const deserializeResult = deserializeProject(record.content);
        if (!deserializeResult.success || !deserializeResult.data) {
            return { success: false, errorCode: 'CORRUPTED_FILE' };
        }

        // Backup current before restore (if exists)
        const current = await db.get('projects', projectId);
        if (current) {
            await db.put('backups', {
                projectId,
                content: current.content,
                timestamp: new Date().toISOString()
            });
        }

        // Promote to main
        const metadataResult = ProjectMetadataSchema.safeParse(deserializeResult.data);
        if (metadataResult.success) {
             await db.put('projects', {
                 projectId,
                 content: record.content,
                 metadata: metadataResult.data
             });
        }

        return {
            success: true,
            project: deserializeResult.data,
            source: 'indexedDB',
            migrated: false
        };

    } catch (error) {
        console.error('WebStorageAdapter.restoreAutoSave error:', error);
        return { success: false, errorCode: 'READ_ERROR' };
    }
  }

  async cleanupAutoSaves(projectId: string, keepCount: number): Promise<void> {
    try {
        const db = await this.dbPromise;
        const autoSaves = await db.getAllFromIndex('autoSaves', 'by-project', projectId);
        
        autoSaves.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        const toDelete = autoSaves.slice(keepCount);
        
        if (toDelete.length > 0) {
            const tx = db.transaction('autoSaves', 'readwrite');
            await Promise.all(toDelete.map(record => tx.store.delete(record.autoSaveId)));
            await tx.done;
        }
    } catch (error) {
        console.warn('Auto-save cleanup failed:', error);
    }
  }

  // ==================== Metadata & Auxiliary Operations ====================

  async updateMetadata(projectId: string, metadata: Partial<ProjectMetadata>): Promise<void> {
    try {
        const db = await this.dbPromise;
        const record = await db.get('projects', projectId);
        
        if (!record) {throw new Error('Project not found');}

        const updatedMetadata = { ...record.metadata, ...metadata };
        
        // We also need to update the content string ideally to stay in sync, 
        // but parsing/serializing full content just for metadata update is heavy.
        // However, listProjects relies on 'metadata' property.
        // If we only update 'metadata' property, the 'content' string becomes stale regarding metadata fields.
        // Tauri adapter does full save. We should probably do full save to be safe/consistent.
        // But the interface implies lightweight update.
        // For now, let's just update the indexedDB record.
        
        // Wait, if next load uses 'content', it will have old metadata.
        // So we MUST update content too.
        
        // This means we need to deserialize, update, serialize.
        const deserializeResult = deserializeProject(record.content);
        if (deserializeResult.success && deserializeResult.data) {
             const updatedProject = { ...deserializeResult.data, ...metadata };
             const serializeResult = serializeProject(updatedProject);
             if (serializeResult.success && serializeResult.data) {
                  await db.put('projects', {
                      projectId,
                      content: serializeResult.data,
                      metadata: updatedMetadata as ProjectMetadata // assume merged correctly
                  });
             }
        }
        
    } catch (error) {
        console.error('Metadata update failed:', error);
        throw error;
    }
  }

  async saveThumbnail(projectId: string, imageData: Blob): Promise<void> {
    try {
        const db = await this.dbPromise;
        await db.put('thumbnails', { projectId, data: imageData });
    } catch (error) {
        console.error('Thumbnail save failed:', error);
    }
  }

  async getStorageInfo(): Promise<StorageInfo> {
      // Estimate size
      // navigator.storage.estimate() works in some browsers
      let totalBytes, usedBytes;
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
          try {
              const estimate = await navigator.storage.estimate();
              totalBytes = estimate.quota;
              usedBytes = estimate.usage;
          } catch (e) {
              console.debug('Unable to estimate storage:', e);
          }
      }

    return {
      platform: 'web',
      storageType: 'indexedDB',
      totalBytes,
      usedBytes,
      quotaExceeded: false // hard to check specifically
    };
  }
}
