import { createDir, readTextFile, writeTextFile } from '../persistence/filesystem';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

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
            console.error('Failed to write logs:', error);
        }
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
}

// Export singleton instance
export const logger = LoggerService.getInstance();
