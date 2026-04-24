/**
 * Manages the selected project directory path for Tauri environment.
 * Persists the path preference using simple localStorage since it's available in Tauri WebView.
 */
export class TauriPathManager {
  private static readonly STORAGE_KEY = 'sizewise_tauri_project_path';

  /**
   * Get the saved project path.
   * Returns null if no custom path has been selected (implies usage of default).
   */
  static getPath(): string | null {
    if (typeof window === 'undefined') {return null;}
    return localStorage.getItem(this.STORAGE_KEY);
  }

  /**
   * Save the project path.
   */
  static setPath(path: string): void {
    if (typeof window === 'undefined') {return;}
    localStorage.setItem(this.STORAGE_KEY, path);
  }

  /**
   * Clear the saved path (reverts to default).
   */
  static resetPath(): void {
    if (typeof window === 'undefined') {return;}
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
