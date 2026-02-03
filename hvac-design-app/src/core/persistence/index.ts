// Filesystem utilities
export {
  isTauri,
  readTextFile,
  writeTextFile,
  exists,
  createDir,
  readDir,
  getDocumentsDir,
  copyFile,
  removeFile,
  renameFile,
} from './filesystem';

// Serialization
export {
  serializeProject,
  deserializeProject,
  migrateProject,
  isValidProjectFile,
  getSchemaVersion,
  type SerializationResult,
  type DeserializationResult,
} from './serialization';

// Project I/O
export {
  saveProject,
  loadProject,
  loadBackup,
  projectExists,
  getBackupPath,
  type IOResult,
  type LoadResult,
} from './projectIO';

// Storage Adapter (Abstraction Layer)
export { type StorageAdapter } from './StorageAdapter';
export { createStorageAdapter } from './factory';
export type {
  SaveResult,
  DeleteResult,
  DuplicateResult,
  AutoSaveResult,
  SaveOptions,
  AutoSaveConfig,
  StorageConfig,
  AutoSaveMetadata,
  StorageInfo,
  
  // Explicitly export the new LoadResult as AdapterLoadResult to avoid conflict with projectIO.LoadResult
  LoadResult as AdapterLoadResult
} from './types';
