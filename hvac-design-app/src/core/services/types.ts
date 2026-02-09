/**
 * Type definitions for Storage Root Service
 * Centralized types for initialization, validation, and relocation results
 */

export interface InitResult {
  success: boolean;
  path: string; // Matches existing implementation
  migrationRan?: boolean; // Matches existing implementation
  error?: string;
}

export interface ValidationResult {
  is_valid: boolean; // Matches Tauri command result
  is_writable: boolean; // Matches Tauri command result  
  free_space_bytes: number; // Matches Tauri command result
  errors: string[]; // Matches Tauri command result
}

export interface RelocationResult {
  success: boolean;
  oldPath: string; // Matches existing implementation
  newPath: string; // Matches existing implementation
  error?: string;
}

export interface DiskSpaceInfo {
  available_bytes: number;
  total_bytes: number;
  percent_available: number;
}

/**
 * Represents a file in quarantine (files that failed validation or migration)
 * TODO: Expand this interface when quarantine feature is fully implemented
 */
export interface QuarantinedFile {
  path: string;
  reason: string;
  timestamp: number;
}
