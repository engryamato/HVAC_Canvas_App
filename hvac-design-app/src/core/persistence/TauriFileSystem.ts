import { ProjectMetadata, ProjectMetadataSchema } from '@/core/schema/ProjectFileSchema';
import { readTextFile, removeFile, readDir as readDirWrapper, exists } from './filesystem';

/**
 * Tauri-specific file system service
 * Provides native file dialogs and directory operations for project files
 */
export class TauriFileSystem {
  private static readonly PROJECT_EXTENSION = '.sws';
  private static readonly BACKUP_EXTENSION = '.sws.bak';
  
  /**
   * Check if running in Tauri environment
   * @returns True if Tauri APIs are available
   */
  static isTauriEnvironment(): boolean {
    return typeof window !== 'undefined' && '__TAURI__' in window;
  }
  
  /**
   * Show native open file dialog
   * @returns Selected file path or null if cancelled
   */
  static async openFileDialog(): Promise<string | null> {
    if (!this.isTauriEnvironment()) {
      console.warn('[TauriFileSystem] Not in Tauri environment');
      return null;
    }
    
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'HVAC Projects',
          extensions: ['sws']
        }],
        title: 'Open Project'
      });
      
      // open() returns string | string[] | null
      if (Array.isArray(selected)) {
        return selected[0] || null;
      }
      
      return selected;
    } catch (error) {
      console.error('[TauriFileSystem] Open dialog failed:', error);
      return null;
    }
  }
  
  /**
   * Show native save file dialog
   * @param options Dialog options (defaultPath, filters, etc.)
   * @returns Selected file path or null if cancelled
   */
  static async saveFileDialog(optionsOrName: string | { defaultPath?: string; filters?: any[]; title?: string }): Promise<string | null> {
    if (!this.isTauriEnvironment()) {
      console.warn('[TauriFileSystem] Not in Tauri environment');
      return null;
    }
    
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      
      let options = {};
      
      if (typeof optionsOrName === 'string') {
          options = {
              defaultPath: `${optionsOrName}${this.PROJECT_EXTENSION}`,
              title: 'Save Project',
              filters: [{ name: 'HVAC Projects', extensions: ['sws'] }]
          };
      } else {
          options = optionsOrName;
      }

      const selected = await save(options);
      
      return selected;
    } catch (error) {
      console.error('[TauriFileSystem] Save dialog failed:', error);
      return null;
    }
  }

  /**
   * Write binary data to a file
   * @param filePath Absolute path to file
   * @param data Binary data to write
   * @returns True if successful
   */
  static async writeBinaryFile(filePath: string, data: Uint8Array): Promise<boolean> {
      try {
          const { writeFile } = await import('@tauri-apps/plugin-fs');
          await writeFile(filePath, data);
          return true;
      } catch (error) {
          console.error('[TauriFileSystem] Failed to write binary file:', error);
          throw error;
      }
  }
  
  /**
   * Get the default projects directory
   * @returns Path to documents directory or user home
   */
  static async getDefaultProjectsPath(): Promise<string> {
    if (!this.isTauriEnvironment()) {
      return '';
    }
    
    try {
      const { documentDir } = await import('@tauri-apps/api/path');
      const docsPath = await documentDir();
      return `${docsPath}HVAC_Projects`;
    } catch (error) {
      console.error('[TauriFileSystem] Failed to get documents dir:', error);
      return '';
    }
  }
  
  /**
   * Scan a directory for .sws project files and extract metadata
   * @param directoryPath Path to scan
   * @returns Array of project metadata with file paths
   */
  static async scanProjectDirectory(
    directoryPath: string
  ): Promise<Array<ProjectMetadata & { filePath: string }>> {
    const projects: Array<ProjectMetadata & { filePath: string }> = [];
    
    if (!this.isTauriEnvironment()) {
      return projects;
    }
    
    try {
      const fileNames = await readDirWrapper(directoryPath);
      
      for (const fileName of fileNames) {
        // Only process .sws files (not .sws.bak)
        if (fileName.endsWith(this.PROJECT_EXTENSION) && 
            !fileName.endsWith(this.BACKUP_EXTENSION)) {
          
          const filePath = `${directoryPath}/${fileName}`;
          
          try {
            // Read and parse project metadata (not full entities)
            const content = await readTextFile(filePath);
            const data = JSON.parse(content);
            
            // Validate metadata
            const metadata = ProjectMetadataSchema.parse(data);
            
            projects.push({
              ...metadata,
              filePath
            });
          } catch (parseError) {
            console.warn(`[TauriFileSystem] Failed to parse project ${fileName}:`, parseError);
            // Skip corrupted files
          }
        }
      }
    } catch (error) {
      console.error('[TauriFileSystem] Directory scan failed:', error);
    }
    
    return projects;
  }
  
  /**
   * Check if a file exists
   * @param filePath Absolute file path
   * @returns True if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      return await exists(filePath);
    } catch {
      return false;
    }
  }
  
  /**
   * Delete a project file and its backup
   * @param filePath Path to .sws file
   * @returns True if deletion successful
   */
  static async deleteProjectFiles(filePath: string): Promise<boolean> {
    try {
      // Delete main file
      if (await this.fileExists(filePath)) {
        await removeFile(filePath);
      }
      
      // Delete backup if exists
      const backupPath = `${filePath}.bak`;
      if (await this.fileExists(backupPath)) {
        await removeFile(backupPath);
      }
      
      // Delete thumbnail if exists
      const thumbnailPath = filePath.replace(this.PROJECT_EXTENSION, '.png');
      if (await this.fileExists(thumbnailPath)) {
        await removeFile(thumbnailPath);
      }
      
      return true;
    } catch (error) {
      console.error('[TauriFileSystem] Delete failed:', error);
      return false;
    }
  }
  
  /**
   * Get the backup file path for a project
   * @param filePath Original .sws file path
   * @returns Backup file path (.sws.bak)
   */
  static getBackupPath(filePath: string): string {
    return `${filePath}.bak`;
  }
}
