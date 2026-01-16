// Platform detection utilities
// Provides safe access to Tauri APIs with graceful fallback for web/browser context

export const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

/**
 * Get platform information safely
 * Returns web/platform for non-Tauri environments
 */
export const getPlatformInfo = async () => {
    // Web/browser environment
    if (!isTauri) {
        return {
            platform: 'web',
            arch: 'unknown',
        };
    }

    return {
        platform: 'tauri',
        arch: 'unknown',
    };
};

/**
 * Check if running in development environment
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if running in production build
 */
export const isProduction = process.env.NODE_ENV === 'production';
