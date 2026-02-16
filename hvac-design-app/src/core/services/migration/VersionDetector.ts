import { z } from 'zod';

/**
 * Version information for data migration
 */
export interface DataVersion {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Schema for version validation
 */
export const DataVersionSchema = z.object({
  major: z.number().int().min(0),
  minor: z.number().int().min(0),
  patch: z.number().int().min(0),
});

/**
 * Current data format version
 */
export const CURRENT_DATA_VERSION: DataVersion = {
  major: 2,
  minor: 0,
  patch: 0,
};

/**
 * Minimum supported version for migration
 */
export const MINIMUM_SUPPORTED_VERSION: DataVersion = {
  major: 1,
  minor: 0,
  patch: 0,
};

/**
 * Version history with release dates and descriptions
 */
export const VERSION_HISTORY: Record<string, { date: string; description: string }> = {
  '1.0.0': { date: '2024-01-01', description: 'Initial data format' },
  '2.0.0': { date: '2024-02-11', description: 'Unified component library V2' },
};

/**
 * Detects the version of data being loaded
 */
export class VersionDetector {
  /**
   * Parse version string to DataVersion object
   */
  static parseVersion(versionString: string): DataVersion | null {
    const parts = versionString.split('.').map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
      return null;
    }
    return {
      major: parts[0] ?? 0,
      minor: parts[1] ?? 0,
      patch: parts[2] ?? 0,
    };
  }

  /**
   * Convert DataVersion to string
   */
  static versionToString(version: DataVersion): string {
    return `${version.major}.${version.minor}.${version.patch}`;
  }

  /**
   * Detect version from data object
   */
  static detectVersion(data: unknown): DataVersion {
    if (!data || typeof data !== 'object') {
      return MINIMUM_SUPPORTED_VERSION;
    }

    const dataObj = data as Record<string, unknown>;

    // Check for explicit version field
    if (dataObj._version && typeof dataObj._version === 'string') {
      const parsed = this.parseVersion(dataObj._version);
      if (parsed) {
        return parsed;
      }
    }

    // Check for data format markers
    if (this.isV2Format(dataObj)) {
      return { major: 2, minor: 0, patch: 0 };
    }

    if (this.isV1Format(dataObj)) {
      return { major: 1, minor: 0, patch: 0 };
    }

    // Default to minimum version
    return MINIMUM_SUPPORTED_VERSION;
  }

  /**
   * Check if data is in V2 format (unified component library)
   */
  private static isV2Format(data: Record<string, unknown>): boolean {
    // V2 format has unified component definitions
    return (
      Array.isArray(data.components) &&
      data.components.length > 0 &&
      typeof data.components[0] === 'object' &&
      data.components[0] !== null &&
      'engineeringProperties' in data.components[0]
    );
  }

  /**
   * Check if data is in V1 format (legacy separated stores)
   */
  private static isV1Format(data: Record<string, unknown>): boolean {
    // V1 format has separate catalogItems and componentDefinitions
    return (
      Array.isArray(data.catalogItems) ||
      Array.isArray(data.componentDefinitions) ||
      (typeof data.services === 'object' && data.services !== null)
    );
  }

  /**
   * Compare two versions
   * @returns negative if a < b, 0 if equal, positive if a > b
   */
  static compareVersions(a: DataVersion, b: DataVersion): number {
    if (a.major !== b.major) {
      return a.major - b.major;
    }
    if (a.minor !== b.minor) {
      return a.minor - b.minor;
    }
    return a.patch - b.patch;
  }

  /**
   * Check if version is supported
   */
  static isVersionSupported(version: DataVersion): boolean {
    return this.compareVersions(version, MINIMUM_SUPPORTED_VERSION) >= 0;
  }

  /**
   * Check if migration is needed
   */
  static needsMigration(fromVersion: DataVersion): boolean {
    return this.compareVersions(fromVersion, CURRENT_DATA_VERSION) < 0;
  }

  /**
   * Get migration path from one version to another
   */
  static getMigrationPath(fromVersion: DataVersion): string[] {
    const path: string[] = [];
    const from = this.versionToString(fromVersion);
    const current = this.versionToString(CURRENT_DATA_VERSION);

    if (from === current) {
      return path;
    }

    // Add all intermediate versions
    const versions = Object.keys(VERSION_HISTORY).sort((a, b) => {
      const va = this.parseVersion(a)!;
      const vb = this.parseVersion(b)!;
      return this.compareVersions(va, vb);
    });

    let collecting = false;
    for (const version of versions) {
      if (version === from) {
        collecting = true;
        continue;
      }
      if (collecting) {
        path.push(version);
        if (version === current) {
          break;
        }
      }
    }

    // If current version not in history, add it
    if (path.length === 0 || path[path.length - 1] !== current) {
      path.push(current);
    }

    return path;
  }

  /**
   * Get version info
   */
  static getVersionInfo(version: DataVersion): { date: string; description: string } | null {
    const versionString = this.versionToString(version);
    return VERSION_HISTORY[versionString] || null;
  }
}

export default VersionDetector;
