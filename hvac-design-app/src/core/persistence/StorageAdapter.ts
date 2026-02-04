import type { ProjectFile, ProjectMetadata } from '../schema/project-file.schema';
import {
  SaveResult,
  LoadResult,
  DeleteResult,
  DuplicateResult,
  AutoSaveResult,
  SaveOptions,
  AutoSaveMetadata,
  StorageInfo
} from './types';

/**
 * Unified interface for project persistence across platforms.
 * Handles CRUD operations, auto-saves, and metadata management for both
 * Tauri (filesystem) and Web (localStorage/IndexedDB) environments.
 * 
 * @see Core Flows Spec 1.3, 1.4, 2.1, 2.3
 */
export interface StorageAdapter {
  // =========================================================================
  // Project CRUD Operations
  // =========================================================================

  /**
   * Save a project to persistent storage.
   * 
   * @param project - The complete project file to save
   * @param options - Configuration options for the save operation
   * @returns Result indicating success/failure and metadata including new file path
   * 
   * @example
   * const result = await adapter.saveProject(project, { createBackup: true });
   * if (result.success) {
   *   console.log('Saved to', result.filePath);
   * }
   */
  saveProject(project: ProjectFile, options?: SaveOptions): Promise<SaveResult>;

  /**
   * Load a project by its ID.
   * Automatically handles:
   * 1. Backup fallback if main file is corrupted
   * 2. Schema migration if version is outdated
   * 
   * @param projectId - UUID of the project to load
   * @returns Result containing the project data or error details
   * 
   * @see Core Flow 1.3 (Load Project)
   */
  loadProject(projectId: string): Promise<LoadResult>;

  /**
   * Delete a project and all associated data.
   * Removes:
   * - Main project file/entry
   * - Backup files
   * - Auto-saves
   * - Cached thumbnails
   * 
   * @param projectId - UUID of the project to delete
   * @returns Result indicating success/failure
   */
  deleteProject(projectId: string): Promise<DeleteResult>;

  /**
   * Create a copy of an existing project with a new ID and name.
   * 
   * @param projectId - Source project UUID
   * @param newName - Name for the new project copy
   * @returns Result containing the newly created project data
   * 
   * @see Core Flow 2.1 (Duplicate)
   */
  duplicateProject(projectId: string, newName: string): Promise<DuplicateResult>;

  // =========================================================================
  // Project Discovery Operations
  // =========================================================================

  /**
   * List all available projects with their metadata.
   * Efficiently scans storage without loading full project content.
   * 
   * @returns List of project metadata objects
   */
  listProjects(): Promise<ProjectMetadata[]>;

  /**
   * Search for projects by text query.
   * Filters by name, project number, client, or location.
   * 
   * @param query - Text to search for
   * @returns Filtered list of project metadata
   */
  searchProjects(query: string): Promise<ProjectMetadata[]>;

  // =========================================================================
  // Auto-Save Operations
  // =========================================================================

  /**
   * fast save to temporary auto-save location.
   * Should be non-blocking and lightweight if possible.
   * 
   * @param project - Current project state
   * @returns Result with auto-save timestamp and ID
   * 
   * @see Core Flow 1.4 (Auto-save)
   */
  autoSave(project: ProjectFile): Promise<AutoSaveResult>;

  /**
   * List all available auto-saves for a specific project.
   * 
   * @param projectId - Project UUID
   * @returns List of auto-save points sorted by timestamp (newest first)
   */
  listAutoSaves(projectId: string): Promise<AutoSaveMetadata[]>;

  /**
   * Restore a project state from a specific auto-save.
   * 
   * @param projectId - Project UUID
   * @param timestamp - Timestamp or ID of the auto-save to restore
   * @returns Load result with the restored project data
   */
  restoreAutoSave(projectId: string, timestamp: string): Promise<LoadResult>;

  /**
   * Cleanup old auto-saves, keeping only the most recent N copies.
   * 
   * @param projectId - Project UUID
   * @param keepCount - Number of recent copies to retain
   */
  cleanupAutoSaves(projectId: string, keepCount: number): Promise<void>;

  // =========================================================================
  // Metadata & Auxiliary Operations
  // =========================================================================

  /**
   * Update specific metadata fields without full project save.
   * Useful for updating timestamps, thumbnails, or status flags.
   * 
   * @param projectId - Project UUID
   * @param metadata - Partial metadata to update
   */
  updateMetadata(projectId: string, metadata: Partial<ProjectMetadata>): Promise<void>;

  /**
   * Save a thumbnail image for the project.
   * 
   * @param projectId - Project UUID
   * @param imageData - Raw image blob (PNG/JPEG)
   */
  saveThumbnail(projectId: string, imageData: Blob): Promise<void>;

  /**
   * Get information about the underlying storage system.
   * 
   * @returns Storage statistics and platform info
   */
  getStorageInfo(): Promise<StorageInfo>;
}
