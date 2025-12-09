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

