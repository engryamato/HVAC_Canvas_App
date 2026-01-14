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

    try {
        // Dynamic import to avoid webpack/bundling errors in non-Tauri builds
        const { platform } = await import('@tauri-apps/api/process');
        const platformStr = await platform();

        return {
            platform: platformStr,
            arch: 'unknown', // Could add arch() if needed
        };
    } catch (error) {
        console.warn('Failed to get Tauri platform info:', error);
        return {
            platform: 'unknown',
            arch: 'unknown',
        };
    }
};

/**
 * Check if running in development environment
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if running in production build
 */
export const isProduction = process.env.NODE_ENV === 'production';
