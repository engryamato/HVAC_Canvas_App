import { createDir, readTextFile, writeTextFile, exists, removeFile } from '../persistence/filesystem';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    component: string;
    message: string;
}

export class LoggerService {
    private static instance: LoggerService | null = null;
    private logBuffer: LogEntry[] = [];
    private maxBufferSize = 100;
    private flushInterval: NodeJS.Timeout | null = null;

    private constructor() {
        // Flush logs every 5 seconds
        this.flushInterval = setInterval(() => this.flush(), 5000);
    }

    static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    /**
     * Reset the singleton instance (for testing purposes only)
     */
    static resetInstance(): void {
        if (LoggerService.instance?.flushInterval) {
            clearInterval(LoggerService.instance.flushInterval);
        }
        LoggerService.instance = null;
    }

    async log(level: LogLevel, component: string, message: string): Promise<void> {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            component,
            message
        };

        this.logBuffer.push(entry);

        // Console output for development
        const logMethod = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
        logMethod(`[${entry.timestamp}] [${level}] [${component}] ${message}`);

        // Flush if buffer is full
        if (this.logBuffer.length >= this.maxBufferSize) {
            await this.flush();
        }
    }

    async flush(): Promise<void> {
        if (this.logBuffer.length === 0) {return;}

        const entries = [...this.logBuffer];
        this.logBuffer = [];

        try {
            // Ensure log directory exists
            const logDir = 'SizeWise/logs';
            const logFile = `${logDir}/storage-root.log`;
            await createDir(logDir, true).catch(() => {
                // Directory might already exist.
            });

            // Check if rotation is needed (10MB threshold)
            const maxLogSize = 10 * 1024 * 1024; // 10MB
            let currentSize = 0;
            try {
                const current = await readTextFile(logFile);
                currentSize = new Blob([current]).size;
            } catch {
                currentSize = 0;
            }

            // Rotate if needed
            if (currentSize > maxLogSize) {
                await this.rotateLog(logDir);
            }

            // Format log entries
            const logText = entries
                .map(e => `[${e.timestamp}] [${e.level}] [${e.component}] ${e.message}`)
                .join('\n') + '\n';

            // Append behavior implemented via read-then-write for wrapper compatibility.
            let previous = '';
            try {
                previous = await readTextFile(logFile);
            } catch {
                previous = '';
            }
            await writeTextFile(logFile, `${previous}${logText}`);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to write logs:', error);
        }
    }

    /**
     * Rotate logs: storage-root.log -> storage-root.1.log ... storage-root.4.log
     * Keep 5 files total including current log file.
     */
    private async rotateLog(logDir: string): Promise<void> {
        try {
            const baseLog = `${logDir}/storage-root.log`;
            const log1 = `${logDir}/storage-root.1.log`;
            const log2 = `${logDir}/storage-root.2.log`;
            const log3 = `${logDir}/storage-root.3.log`;
            const log4 = `${logDir}/storage-root.4.log`;

            // Delete oldest log
            if (await exists(log4)) {
                await removeFile(log4);
            }

            // Shift logs
            if (await exists(log3)) {
                const content = await readTextFile(log3);
                await writeTextFile(log4, content);
            }

            if (await exists(log2)) {
                const content = await readTextFile(log2);
                await writeTextFile(log3, content);
            }

            if (await exists(log1)) {
                const content = await readTextFile(log1);
                await writeTextFile(log2, content);
            }

            if (await exists(baseLog)) {
                const content = await readTextFile(baseLog);
                await writeTextFile(log1, content);
                await writeTextFile(baseLog, ''); // Clear current log
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to rotate logs:', error);
        }
    }

    async debug(component: string, message: string): Promise<void> {
        await this.log('DEBUG', component, message);
    }

    async info(component: string, message: string): Promise<void> {
        await this.log('INFO', component, message);
    }

    async warn(component: string, message: string): Promise<void> {
        await this.log('WARN', component, message);
    }

    async error(component: string, message: string): Promise<void> {
        await this.log('ERROR', component, message);
    }

    destroy(): void {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
        this.flush();
    }

    /**
     * Log performance metrics for an operation
     */
    async logPerformance(
        component: string,
        operation: string,
        durationMs: number,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        const metaStr = metadata ? ` | ${JSON.stringify(metadata)}` : '';
        await this.info(component, `${operation} completed in ${durationMs}ms${metaStr}`);
    }
}

// Export singleton instance
export const logger = LoggerService.getInstance();
