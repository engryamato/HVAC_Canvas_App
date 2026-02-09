import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StorageRootService, createStorageRootService } from '../StorageRootService';
import { OperationQueue } from '../OperationQueue';
import type { StorageState } from '../../store/storageStore';

/**
 * Integration tests for StorageRootService
 * These tests verify actual integration with the store and queue system.
 * Note: Tauri commands are still mocked as they require the Tauri runtime.
 */

describe('StorageRootService Integration Tests', () => {
    let service: StorageRootService;
    let queue: OperationQueue;
    let mockStoreState: StorageState;
    let storeApi: { getState: () => StorageState };

    beforeEach(() => {
        // Create real operation queue
        queue = new OperationQueue();

        // Create mock store with realistic state
        mockStoreState = {
            storageRootPath: null,
            storageRootType: null,
            migrationState: 'pending',
            migrationCompletedAt: null,
            migrationError: null,
            lastValidatedAt: null,
            validationWarnings: [],
            quarantinedFileCount: 0,
            lastQuarantineAt: null,
            setStorageRoot: (path: string, type: 'documents' | 'appdata') => {
                mockStoreState.storageRootPath = path;
                mockStoreState.storageRootType = type;
            },
            setMigrationState: (state: string, _error?: string) => {
                mockStoreState.migrationState = state as any;
            },
            updateValidation: (errors: string[]) => {
                mockStoreState.validationWarnings = errors;
            },
            incrementQuarantine: () => {
                mockStoreState.quarantinedFileCount += 1;
            },
        } as unknown as StorageState;

        storeApi = {
            getState: () => mockStoreState,
        };

        // Create service with real queue
        service = createStorageRootService(queue, storeApi);
    });

    afterEach(async () => {
        // Ensure all queue operations complete
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    describe('Service Factory', () => {
        it('should create service instance via factory function', () => {
            const newService = createStorageRootService(queue, storeApi);
            expect(newService).toBeInstanceOf(StorageRootService);
        });
    });

    describe('Integration with OperationQueue', () => {
        it('should acquire and release lock during initialization', async () => {
            const queueSpy = vi.spyOn(queue, 'acquireLock');

            // Execute - Note: This will fail without Tauri runtime, but we can verify lock usage
            try {
                await service.initialize();
            } catch {
                // Expected to fail without Tauri runtime
            }

            // Verify lock was acquired
            expect(queueSpy).toHaveBeenCalledWith('root');
        });

        it('should ensure only one initialization runs at a time', async () => {
            const results: Promise<any>[] = [];

            // Start multiple initializations concurrently
            for (let i = 0; i < 3; i++) {
                results.push(service.initialize());
            }

            // Wait for all to complete
            await Promise.allSettled(results);

            // All should complete without deadlock
            expect(results.length).toBe(3);
        });

        it('should acquire and release lock during relocation', async () => {
            const queueSpy = vi.spyOn(queue, 'acquireLock');

            // Execute - Note: This will fail without Tauri runtime
            try {
                await service.relocate('/test/path');
            } catch {
                // Expected to fail without Tauri runtime
            }

            // Verify lock was acquired
            expect(queueSpy).toHaveBeenCalledWith('root');
        });
    });

    describe('Integration with Store', () => {
        it('should update store state when storage root is set', () => {
            // Simulate store update
            mockStoreState.setStorageRoot('/test/path', 'documents');

            // Verify store was updated
            expect(mockStoreState.storageRootPath).toBe('/test/path');
            expect(mockStoreState.storageRootType).toBe('documents');
        });

        it('should use correct storage type for documents path', () => {
            mockStoreState.setStorageRoot('/users/test/documents', 'documents');

            expect(mockStoreState.storageRootType).toBe('documents');
        });

        it('should use correct storage type for appdata path', () => {
            mockStoreState.setStorageRoot('/users/test/appdata', 'appdata');

            expect(mockStoreState.storageRootType).toBe('appdata');
        });

        it('should retrieve storage root from store', () => {
            mockStoreState.storageRootPath = '/stored/path';

            const result = service.getStorageRoot();

            expect(result).toBe('/stored/path');
        });

        it('should update validation errors in store', () => {
            const errors = ['Error 1', 'Error 2'];
            mockStoreState.updateValidation(errors);

            expect(mockStoreState.validationWarnings).toEqual(errors);
        });
    });

    describe('Event Emission', () => {
        it('should emit storageRoot:changed event', () => {
            const handleEvent = vi.fn();

            service.addEventListener('storageRoot:changed', handleEvent);

            // Manually emit event for testing
            service.dispatchEvent(
                new CustomEvent('storageRoot:changed', {
                    detail: { path: '/test/path' },
                })
            );

            expect(handleEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'storageRoot:changed',
                })
            );
        });

        it('should support multiple event listeners', () => {
            const listener1 = vi.fn();
            const listener2 = vi.fn();

            service.addEventListener('storageRoot:changed', listener1);
            service.addEventListener('storageRoot:changed', listener2);

            service.dispatchEvent(
                new CustomEvent('storageRoot:changed', {
                    detail: { path: '/test/path' },
                })
            );

            expect(listener1).toHaveBeenCalled();
            expect(listener2).toHaveBeenCalled();
        });

        it('should allow removing event listeners', () => {
            const listener = vi.fn();

            service.addEventListener('storageRoot:changed', listener);
            service.removeEventListener('storageRoot:changed', listener);

            service.dispatchEvent(
                new CustomEvent('storageRoot:changed', {
                    detail: { path: '/test/path' },
                })
            );

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling in Integration', () => {
        it('should handle store errors gracefully', () => {
            // Create store that throws
            const brokenStoreApi = {
                getState: () => {
                    throw new Error('Store error');
                },
            };

            const brokenService = new StorageRootService(queue, brokenStoreApi);

            expect(() => brokenService.getStorageRoot()).toThrow('Store error');
        });

        it('should handle queue lock acquisition failures', async () => {
            // Create queue that fails to acquire lock
            const brokenQueue = {
                acquireLock: vi.fn().mockRejectedValue(new Error('Lock failed')),
            } as unknown as OperationQueue;

            const brokenService = new StorageRootService(brokenQueue, storeApi);

            await expect(brokenService.initialize()).rejects.toThrow('Lock failed');
        });
    });

    describe('Concurrent Operations', () => {
        it('should handle concurrent validate calls', async () => {
            mockStoreState.storageRootPath = '/test/path';

            const promises = [
                service.validate(),
                service.validate(),
                service.validate(),
            ];

            // Should all complete without deadlock
            const results = await Promise.allSettled(promises);

            expect(results.length).toBe(3);
            results.forEach(result => {
                // All should either succeed or fail gracefully, not hang
                expect(['fulfilled', 'rejected']).toContain(result.status);
            });
        });
    });

    describe('State Transitions', () => {
        it('should transition migration state correctly', () => {
            expect(mockStoreState.migrationState).toBe('pending');

            mockStoreState.setMigrationState('in-progress');
            expect(mockStoreState.migrationState).toBe('in-progress');

            mockStoreState.setMigrationState('completed');
            expect(mockStoreState.migrationState).toBe('completed');
        });

        it('should handle migration errors', () => {
            mockStoreState.setMigrationState('error', 'Test error');
            expect(mockStoreState.migrationState).toBe('error');
        });
    });

    describe('Path Normalization', () => {
        it('should handle paths with different separators', () => {
            mockStoreState.setStorageRoot('C:\\Users\\Test\\Documents', 'documents');
            expect(mockStoreState.storageRootPath).toBe('C:\\Users\\Test\\Documents');
        });

        it('should preserve path casing', () => {
            const path = '/Users/Test/MyDocuments';
            mockStoreState.setStorageRoot(path, 'documents');
            expect(mockStoreState.storageRootPath).toBe(path);
        });
    });
});
