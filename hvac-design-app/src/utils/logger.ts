// src/utils/logger.ts

/**
 * Simple logger utility that wraps console methods.
 * Allows easy toggling of log output via the LOG_LEVEL environment variable.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'debug';

function shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(LOG_LEVEL);
    const targetIndex = levels.indexOf(level);
    return targetIndex >= currentIndex && LOG_LEVEL !== 'silent';
}

export const logger = {
    debug: (...args: any[]) => {
        if (shouldLog('debug')) {console.debug(...args);}
    },
    info: (...args: any[]) => {
        if (shouldLog('info')) {console.info(...args);}
    },
    warn: (...args: any[]) => {
        if (shouldLog('warn')) {console.warn(...args);}
    },
    error: (...args: any[]) => {
        if (shouldLog('error')) {console.error(...args);}
    },
};
