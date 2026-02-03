import { ProjectMetadata } from '../schema/ProjectFileSchema';
import { IOResult, LoadResult as OriginalLoadResult, IOErrorCode as OriginalIOErrorCode } from './projectIO';

/**
 * Extended error codes for storage operations
 * Includes standard I/O errors plus storage-specific conditions
 */
export type StorageErrorCode = 
  | OriginalIOErrorCode
  | 'QUOTA_EXCEEDED'
  | 'MIGRATION_REQUIRED'
  | 'BACKUP_FAILED'
  | 'ATOMIC_WRITE_FAILED';

/**
 * Base result type for storage operations
 */
export interface StorageResult extends Omit<IOResult, 'errorCode'> {
  errorCode?: StorageErrorCode;
}

/**
 * Result of a save operation
 */
export interface SaveResult extends StorageResult {
  /** Path where file was saved (if applicable) */
  filePath?: string;
  /** Size of saved data in bytes */
  sizeBytes?: number;
}

/**
 * Result of a load operation
 */
export interface LoadResult extends Omit<OriginalLoadResult, 'errorCode'> {
  errorCode?: StorageErrorCode;
  /** Where the project was loaded from */
  source?: 'file' | 'localStorage' | 'indexedDB';
}

/**
 * Result of a delete operation
 */
export interface DeleteResult extends StorageResult {}

/**
 * Result of a duplicate operation
 */
export interface DuplicateResult extends LoadResult {}

/**
 * Result of an auto-save operation
 */
export interface AutoSaveResult extends SaveResult {
  /** Timestamp of the auto-save */
  timestamp: string;
  /** Unique ID for this auto-save */
  autoSaveId: string;
}

/**
 * Options for save operations
 */
export interface SaveOptions {
  /** Create a backup copy before saving (default: true) */
  createBackup?: boolean;
  /** specific atomic write (default: true) */
  atomic?: boolean;
  /** Update metadata without full save (default: false) */
  updateMetadata?: boolean;
}

/**
 * Configuration for auto-save behavior
 */
export interface AutoSaveConfig {
  /** Enable auto-save (default: true) */
  enabled: boolean;
  /** Interval in milliseconds (default: 300000 - 5 mins) */
  intervalMs: number;
  /** Maximum number of auto-save copies to keep (default: 5) */
  maxCopies: number;
  /** Cleanup old auto-saves on successful manual save (default: true) */
  cleanupOnSave: boolean;
}

/**
 * Platform-specific storage configuration
 */
export interface StorageConfig {
  /** Base directory for file storage (Tauri only) */
  baseDir?: string;
  /** Auto-save configuration */
  autoSave?: Partial<AutoSaveConfig>;
  /** Compression enabled (Web only) */
  compression?: boolean;
}

/**
 * Metadata for auto-saved project versions
 */
export interface AutoSaveMetadata {
  projectId: string;
  timestamp: string;
  autoSaveId: string;
  sizeBytes: number;
  source: 'file' | 'localStorage' | 'indexedDB';
}

/**
 * Information about the storage system
 */
export interface StorageInfo {
  /** Current platform */
  platform: 'tauri' | 'web';
  /** Total available space in bytes (if known) */
  totalBytes?: number;
  /** Used space in bytes (if known) */
  usedBytes?: number;
  /** Available space in bytes (if known) */
  availableBytes?: number;
  /** Whether storage quota is exceeded */
  quotaExceeded?: boolean;
  /** Type of storage being used */
  storageType: 'filesystem' | 'localStorage' | 'indexedDB';
}

// Re-export ProjectMetadata for convenience
export type { ProjectMetadata };
