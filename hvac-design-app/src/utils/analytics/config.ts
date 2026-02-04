/**
 * Analytics Configuration
 *
 * Centralized configuration for the analytics system including
 * environment-based settings, privacy controls, and performance tuning.
 */

// =============================================================================
// Types
// =============================================================================

export interface AnalyticsConfig {
  /** Whether analytics is enabled globally */
  enabled: boolean;
  /** Telemetry endpoint URL */
  endpoint: string | undefined;
  /** Number of events to batch before sending */
  batchSize: number;
  /** Time interval (ms) for batch sending */
  batchInterval: number;
  /** Enable verbose logging in development */
  debugMode: boolean;
  /** Maximum number of events to queue before force-sending */
  maxQueueSize: number;
  /** Timeout for analytics requests (ms) */
  requestTimeout: number;
  /** Whether to include screen size in context */
  includeScreenSize: boolean;
  /** Whether to include app version in context */
  includeAppVersion: boolean;
}

export interface PrivacyFlags {
  /** Never collect IP addresses */
  noIpCollection: true;
  /** Never collect user identifiers */
  noUserIdentifiers: true;
  /** Never collect location data */
  noLocationData: true;
  /** Never collect device identifiers */
  noDeviceIdentifiers: true;
  /** All data is anonymized */
  anonymizedData: true;
}

// =============================================================================
// Environment Detection
// =============================================================================

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// =============================================================================
// Default Configuration
// =============================================================================

const defaultConfig: AnalyticsConfig = {
  enabled: true,
  endpoint: process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT,
  batchSize: 10,
  batchInterval: 30000, // 30 seconds
  debugMode: false,
  maxQueueSize: 100,
  requestTimeout: 10000, // 10 seconds
  includeScreenSize: true,
  includeAppVersion: true,
};

// =============================================================================
// Environment-Specific Configuration
// =============================================================================

const developmentOverrides: Partial<AnalyticsConfig> = {
  debugMode: true,
  batchSize: 1, // Send immediately in dev for easier debugging
  batchInterval: 5000, // 5 seconds
};

const productionOverrides: Partial<AnalyticsConfig> = {
  debugMode: false,
  batchSize: 10,
  batchInterval: 30000, // 30 seconds
};

// =============================================================================
// Privacy Compliance (Immutable)
// =============================================================================

export const PRIVACY_FLAGS: Readonly<PrivacyFlags> = Object.freeze({
  noIpCollection: true,
  noUserIdentifiers: true,
  noLocationData: true,
  noDeviceIdentifiers: true,
  anonymizedData: true,
});

// =============================================================================
// Configuration Getters
// =============================================================================

/**
 * Get the current analytics configuration based on environment
 */
export function getAnalyticsConfig(): AnalyticsConfig {
  const envOverrides: Partial<AnalyticsConfig> = {};

  // Read endpoint dynamically to allow test overrides
  const endpoint = process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT;

  // Check environment variables for overrides
  // Support both NEXT_PUBLIC_ANALYTICS_ENABLED and NEXT_PUBLIC_ENABLE_ANALYTICS
  // NEXT_PUBLIC_ANALYTICS_ENABLED takes precedence if set
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== undefined) {
    envOverrides.enabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';
  } else if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== undefined) {
    // Backward compatibility: honor the feature flag if the dedicated flag is not set
    envOverrides.enabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';
  }

  if (process.env.NEXT_PUBLIC_ANALYTICS_DEBUG !== undefined) {
    envOverrides.debugMode = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true';
  }

  // Merge configurations based on environment
  let environmentOverrides: Partial<AnalyticsConfig> = {};
  if (isDevelopment) {
    environmentOverrides = developmentOverrides;
  } else if (isProduction) {
    environmentOverrides = productionOverrides;
  }

  return {
    ...defaultConfig,
    endpoint, // Override with dynamically read endpoint
    ...environmentOverrides,
    ...envOverrides,
  };
}

/**
 * Check if analytics is currently enabled
 */
export function isAnalyticsEnabled(): boolean {
  const config = getAnalyticsConfig();
  return config.enabled && !!config.endpoint;
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(): boolean {
  return getAnalyticsConfig().debugMode;
}

/**
 * Get the analytics endpoint URL
 */
export function getAnalyticsEndpoint(): string | undefined {
  return getAnalyticsConfig().endpoint;
}

// =============================================================================
// Session Management
// =============================================================================

let sessionId: string | null = null;

/**
 * Generate a new session ID
 */
function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get or create the current session ID
 */
export function getSessionId(): string {
  if (sessionId) {
    return sessionId;
  }
  
  // Check sessionStorage first
  if (typeof sessionStorage !== 'undefined') {
    const stored = sessionStorage.getItem('analytics_session_id');
    if (stored) {
      sessionId = stored;
    } else {
      sessionId = generateSessionId();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
  } else {
    sessionId = generateSessionId();
  }
  return sessionId;
}

/**
 * Reset the session ID (useful for testing)
 */
export function resetSessionId(): void {
  sessionId = null;
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('analytics_session_id');
  }
}

// =============================================================================
// Platform Detection
// =============================================================================

/**
 * Detect the current platform
 */
export function detectPlatform(): 'web' | 'tauri' | 'unknown' {
  if (typeof globalThis.window === 'undefined') {
    return 'unknown';
  }

  // Check for Tauri
  const win = globalThis.window as unknown as Record<string, unknown>;
  if ('__TAURI__' in win || '__TAURI_INTERNALS__' in win) {
    return 'tauri';
  }

  return 'web';
}

// =============================================================================
// Constants
// =============================================================================

export const ANALYTICS_VERSION = '1.0.0';
export const MIN_EVENT_INTERVAL_MS = 100; // Minimum time between identical events
