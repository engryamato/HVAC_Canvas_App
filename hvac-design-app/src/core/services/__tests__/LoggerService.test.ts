import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoggerService } from '../LoggerService';
import * as filesystem from '../../persistence/filesystem';

// Mock filesystem
vi.mock('../../persistence/filesystem', () => ({
    createDir: vi.fn(),
    readTextFile: vi.fn(),
    writeTextFile: vi.fn(),
    exists: vi.fn(),
    removeFile: vi.fn(),
}));

describe('LoggerService', () => {
    let logger: LoggerService;

    beforeEach(() => {
        vi.clearAllMocks();
        (filesystem.createDir as any).mockResolvedValue(undefined);
        (filesystem.readTextFile as any).mockRejectedValue(new Error('Not found'));
        (filesystem.writeTextFile as any).mockResolvedValue(undefined);
        (filesystem.exists as any).mockResolvedValue(false);
        (filesystem.removeFile as any).mockResolvedValue(undefined);
        LoggerService.resetInstance();
        logger = LoggerService.getInstance();
    });

    afterEach(() => {
        LoggerService.resetInstance();
    });

    describe('Log Levels', () => {
        it('should support DEBUG level', async () => {
            await logger.debug('TestComponent', 'Debug message');
            
            // Flush to trigger write
            await logger.flush();
            
            expect(filesystem.writeTextFile).toHaveBeenCalled();
            const writeCall = (filesystem.writeTextFile as any).mock.calls[0];
            expect(writeCall[1]).toContain('[DEBUG]');
            expect(writeCall[1]).toContain('[TestComponent]');
            expect(writeCall[1]).toContain('Debug message');
        });

        it('should support INFO level', async () => {
            await logger.info('TestComponent', 'Info message');
            await logger.flush();
            
            const writeCall = (filesystem.writeTextFile as any).mock.calls[0];
            expect(writeCall[1]).toContain('[INFO]');
        });

        it('should support WARN level', async () => {
            await logger.warn('TestComponent', 'Warning message');
            await logger.flush();
            
            const writeCall = (filesystem.writeTextFile as any).mock.calls[0];
            expect(writeCall[1]).toContain('[WARN]');
        });

        it('should support ERROR level', async () => {
            await logger.error('TestComponent', 'Error message');
            await logger.flush();
            
            const writeCall = (filesystem.writeTextFile as any).mock.calls[0];
            expect(writeCall[1]).toContain('[ERROR]');
        });
    });

    describe('Log Rotation', () => {
        it('should rotate logs when file exceeds 10MB', async () => {
            // Mock a large existing log file
            const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
            (filesystem.readTextFile as any).mockImplementation(async (path: string) => {
                if (path.endsWith('storage-root.log')) {
                    return largeContent;
                }
                return '';
            });
            (filesystem.exists as any).mockResolvedValue(true);

            await logger.info('Test', 'Message');
            await logger.flush();

            // Should have called rotation logic
            expect(filesystem.exists).toHaveBeenCalledWith(expect.stringContaining('storage-root.4.log'));
        });

        it('should keep only 5 log files', async () => {
            const largeContent = 'x'.repeat(11 * 1024 * 1024);
            (filesystem.readTextFile as any).mockImplementation(async (path: string) => {
                if (path.endsWith('storage-root.log')) {
                    return largeContent;
                }
                return '';
            });
            (filesystem.exists as any).mockResolvedValue(true);

            await logger.info('Test', 'Message');
            await logger.flush();

            // Should delete oldest log
            expect(filesystem.removeFile).toHaveBeenCalledWith(
                expect.stringContaining('storage-root.4.log')
            );
        });
    });

    describe('Performance Metrics', () => {
        it('should log performance metrics with duration', async () => {
            await logger.logPerformance('ProjectRepo', 'loadProject', 150, {
                projectId: 'test-123',
                fileSize: 1024,
            });
            await logger.flush();

            const writeCall = (filesystem.writeTextFile as any).mock.calls[0];
            expect(writeCall[1]).toContain('loadProject completed in 150ms');
            expect(writeCall[1]).toContain('projectId');
            expect(writeCall[1]).toContain('test-123');
        });

        it('should handle metadata-less performance logs', async () => {
            await logger.logPerformance('StorageService', 'validate', 50);
            await logger.flush();

            const writeCall = (filesystem.writeTextFile as any).mock.calls[0];
            expect(writeCall[1]).toContain('validate completed in 50ms');
            expect(writeCall[1]).not.toContain('undefined');
        });
    });

    describe('Log Format', () => {
        it('should format logs with timestamp, level, component, and message', async () => {
            await logger.info('TestComp', 'Test message');
            await logger.flush();

            const writeCall = (filesystem.writeTextFile as any).mock.calls[0];
            const logLine = writeCall[1];
            
            // Format: [ISO_TIMESTAMP] [LEVEL] [Component] Message
            expect(logLine).toMatch(/\[\d{4}-\d{2}-\d{2}T.*Z\] \[INFO\] \[TestComp\] Test message/);
        });
    });

    describe('Buffer Management', () => {
        it('should buffer logs before flushing', async () => {
            await logger.info('Test', 'Message 1');
            await logger.info('Test', 'Message 2');
            
            // Should not have written yet
            expect(filesystem.writeTextFile).not.toHaveBeenCalled();
            
            await logger.flush();
            
            // Should write both messages
            expect(filesystem.writeTextFile).toHaveBeenCalledTimes(1);
            const writeCall = (filesystem.writeTextFile as any).mock.calls[0];
            expect(writeCall[1]).toContain('Message 1');
            expect(writeCall[1]).toContain('Message 2');
        });

        it('should create log directory if it does not exist', async () => {
            await logger.info('Test', 'Message');
            await logger.flush();

            expect(filesystem.createDir).toHaveBeenCalledWith('SizeWise/logs', true);
        });
    });
});
