import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OperationQueue, getSharedOperationQueue } from '../OperationQueue';

describe('OperationQueue', () => {
    let queue: OperationQueue;

    beforeEach(() => {
        queue = new OperationQueue();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    describe('Queue Ordering', () => {
        it('should execute operations in FIFO order for same key', async () => {
            const operations: number[] = [];
            const promises: Promise<void>[] = [];

            // Enqueue 3 operations for the same key
            promises.push(queue.enqueue('test-key', async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                operations.push(1);
            }));

            promises.push(queue.enqueue('test-key', async () => {
                operations.push(2);
            }));

            promises.push(queue.enqueue('test-key', async () => {
                operations.push(3);
            }));

            await vi.runAllTimersAsync();
            await Promise.all(promises);

            expect(operations).toEqual([1, 2, 3]);
        });

        it('should process different keys in parallel', async () => {
            const operations: string[] = [];
            const promises: Promise<void>[] = [];

            // Enqueue operations for different keys
            promises.push(queue.enqueue('key-1', async () => {
                await new Promise(resolve => setTimeout(resolve, 20));
                operations.push('key-1');
            }));

            promises.push(queue.enqueue('key-2', async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                operations.push('key-2');
            }));

            await vi.runAllTimersAsync();
            await Promise.all(promises);

            // key-2 should complete before key-1 due to shorter delay
            expect(operations).toEqual(['key-2', 'key-1']);
        });
    });

    describe('Root Lock', () => {
        it('should block all operations when root lock is active', async () => {
            const operations: string[] = [];
            
            // Acquire root lock
            const releaseLock = await queue.acquireLock('root');
            
            // Enqueue operations that should be blocked
            const promise1 = queue.enqueue('root', async () => {
                operations.push('op1');
            });

            const promise2 = queue.enqueue('root', async () => {
                operations.push('op2');
            });

            await vi.runAllTimersAsync();

            // Operations should not have executed yet
            expect(operations).toEqual([]);
            expect(queue.isLocked('root')).toBe(true);

            // Release lock
            releaseLock();
            await vi.runAllTimersAsync();
            await Promise.all([promise1, promise2]);

            // Now operations should execute
            expect(operations).toEqual(['op1', 'op2']);
        });

        it('should block project queue execution while root lock is active', async () => {
            const operations: string[] = [];
            const releaseLock = await queue.acquireLock('root');

            const projectPromise = queue.enqueue('project:123', async () => {
                operations.push('project-op');
            });

            await vi.runAllTimersAsync();
            expect(operations).toEqual([]);
            expect(queue.getQueueSize('project:123')).toBe(1);

            releaseLock();
            await vi.runAllTimersAsync();
            await projectPromise;

            expect(operations).toEqual(['project-op']);
        });

        it('should release root lock and process queued operations', async () => {
            const operations: string[] = [];
            
            const releaseLock = await queue.acquireLock('root');
            
            queue.enqueue('root', async () => {
                operations.push('after-lock');
            });

            await vi.runAllTimersAsync();
            expect(operations).toEqual([]);

            releaseLock();
            await vi.runAllTimersAsync();

            expect(operations).toEqual(['after-lock']);
            expect(queue.isLocked('root')).toBe(false);
        });

        it('should return isLocked(true) when root is locked', async () => {
            expect(queue.isLocked('root')).toBe(false);
            
            const releaseLock = await queue.acquireLock('root');
            expect(queue.isLocked('root')).toBe(true);
            
            releaseLock();
            await vi.runAllTimersAsync();
            expect(queue.isLocked('root')).toBe(false);
        });
    });

    describe('Per-Project Queue', () => {
        it('should serialize operations for same project', async () => {
            const operations: number[] = [];
            const projectId = '123e4567-e89b-12d3-a456-426614174000';
            const key = `project:${projectId}`;

            const promises: Promise<void>[] = [];

            promises.push(queue.enqueue(key, async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                operations.push(1);
            }));

            promises.push(queue.enqueue(key, async () => {
                operations.push(2);
            }));

            promises.push(queue.enqueue(key, async () => {
                operations.push(3);
            }));

            await vi.runAllTimersAsync();
            await Promise.all(promises);

            expect(operations).toEqual([1, 2, 3]);
        });

        it('should allow parallel operations for different projects', async () => {
            const operations: string[] = [];
            const promises: Promise<void>[] = [];

            promises.push(queue.enqueue('project:111', async () => {
                await new Promise(resolve => setTimeout(resolve, 20));
                operations.push('project-111');
            }));

            promises.push(queue.enqueue('project:222', async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                operations.push('project-222');
            }));

            await vi.runAllTimersAsync();
            await Promise.all(promises);

            // Different projects should process in parallel, so 222 finishes first
            expect(operations).toEqual(['project-222', 'project-111']);
        });

        it('should use project:{uuid} as key format', async () => {
            const operation = vi.fn(async () => {});
            const projectId = 'abc-123';
            const key = `project:${projectId}`;

            await queue.enqueue(key, operation);
            await vi.runAllTimersAsync();

            expect(operation).toHaveBeenCalledTimes(1);
            expect(queue.isLocked(key)).toBe(false);
        });
    });

    describe('Retry Logic', () => {
        it('should retry transient errors up to 3 times', async () => {
            const operation = vi.fn()
                .mockRejectedValueOnce({ code: 'EBUSY', message: 'Resource busy' })
                .mockRejectedValueOnce({ code: 'EBUSY', message: 'Resource busy' })
                .mockRejectedValueOnce({ code: 'EBUSY', message: 'Resource busy' })
                .mockResolvedValueOnce(undefined);

            const promise = queue.enqueue('test-key', operation);
            await vi.runAllTimersAsync();
            await promise;

            // Should be called 4 times (initial + 3 retries)
            expect(operation).toHaveBeenCalledTimes(4);
        });

        it('should use delays of 100ms, 200ms, 400ms', async () => {
            const delays: number[] = [];
            const startTime = Date.now();

            const operation = vi.fn()
                .mockImplementationOnce(async () => {
                    delays.push(Date.now() - startTime);
                    throw { code: 'EAGAIN' };
                })
                .mockImplementationOnce(async () => {
                    delays.push(Date.now() - startTime);
                    throw { code: 'EAGAIN' };
                })
                .mockImplementationOnce(async () => {
                    delays.push(Date.now() - startTime);
                    throw { code: 'EAGAIN' };
                })
                .mockResolvedValueOnce(undefined);

            const promise = queue.enqueue('test-key', operation);
            await vi.runAllTimersAsync();
            await promise;

            // Check that delays are approximately 100ms, 200ms, 400ms apart
            // First call is immediate (delay ~0)
            expect(delays[0]).toBeLessThan(50);
            // Second call after 100ms
            expect(delays[1]).toBeGreaterThanOrEqual(100);
            expect(delays[1]).toBeLessThan(150);
            // Third call after additional 200ms (total ~300ms)
            expect(delays[2]).toBeGreaterThanOrEqual(300);
            expect(delays[2]).toBeLessThan(350);
        });

        it('should fail immediately on permanent errors (EPERM)', async () => {
            const operation = vi.fn()
                .mockRejectedValueOnce({ code: 'EPERM', message: 'Permission denied' });

            const promise = queue.enqueue('test-key', operation);
            const assertion = expect(promise).rejects.toMatchObject({ code: 'EPERM' });
            await vi.runAllTimersAsync();
            await assertion;
            expect(operation).toHaveBeenCalledTimes(1); // No retries
        });

        it('should fail immediately on permanent errors (ENOENT)', async () => {
            const operation = vi.fn()
                .mockRejectedValueOnce({ code: 'ENOENT', message: 'File not found' });

            const promise = queue.enqueue('test-key', operation);
            const assertion = expect(promise).rejects.toMatchObject({ code: 'ENOENT' });
            await vi.runAllTimersAsync();
            await assertion;
            expect(operation).toHaveBeenCalledTimes(1);
        });

        it('should fail immediately on schema errors', async () => {
            const operation = vi.fn()
                .mockRejectedValueOnce({ message: 'Schema validation failed' });

            const promise = queue.enqueue('test-key', operation);
            const assertion = expect(promise).rejects.toMatchObject({ message: 'Schema validation failed' });
            await vi.runAllTimersAsync();
            await assertion;
            expect(operation).toHaveBeenCalledTimes(1);
        });

        it('should retry on EBUSY errors', async () => {
            const operation = vi.fn()
                .mockRejectedValueOnce({ code: 'EBUSY' })
                .mockResolvedValueOnce(undefined);

            const promise = queue.enqueue('test-key', operation);
            await vi.runAllTimersAsync();
            await promise;

            expect(operation).toHaveBeenCalledTimes(2);
        });

        it('should retry on EAGAIN errors', async () => {
            const operation = vi.fn()
                .mockRejectedValueOnce({ code: 'EAGAIN' })
                .mockResolvedValueOnce(undefined);

            const promise = queue.enqueue('test-key', operation);
            await vi.runAllTimersAsync();
            await promise;

            expect(operation).toHaveBeenCalledTimes(2);
        });

        it('should increment retryCount on each attempt', async () => {
            let retryCount = 0;
            const operation = vi.fn(async () => {
                if (retryCount < 2) {
                    retryCount++;
                    throw { code: 'EINTR' };
                }
            });

            const promise = queue.enqueue('test-key', operation);
            await vi.runAllTimersAsync();
            await promise;

            expect(operation).toHaveBeenCalledTimes(3);
            expect(retryCount).toBe(2);
        });
    });

    describe('Lock Release', () => {
        it('should allow queued operations after lock release', async () => {
            const operations: string[] = [];
            
            const releaseLock = await queue.acquireLock('test-key');
            
            queue.enqueue('test-key', async () => {
                operations.push('op1');
            });

            await vi.runAllTimersAsync();
            expect(operations).toEqual([]);

            releaseLock();
            await vi.runAllTimersAsync();

            expect(operations).toEqual(['op1']);
        });

        it('should process multiple queued operations sequentially', async () => {
            const operations: number[] = [];
            
            const releaseLock = await queue.acquireLock('test-key');
            
            queue.enqueue('test-key', async () => {
                operations.push(1);
            });

            queue.enqueue('test-key', async () => {
                operations.push(2);
            });

            queue.enqueue('test-key', async () => {
                operations.push(3);
            });

            await vi.runAllTimersAsync();
            expect(operations).toEqual([]);

            releaseLock();
            await vi.runAllTimersAsync();

            expect(operations).toEqual([1, 2, 3]);
        });

        it('should return isLocked(false) after release', async () => {
            const releaseLock = await queue.acquireLock('test-key');
            expect(queue.isLocked('test-key')).toBe(true);
            
            releaseLock();
            await vi.runAllTimersAsync();
            
            expect(queue.isLocked('test-key')).toBe(false);
        });
    });

    describe('Error Handling', () => {
        it('should remove failed operation from queue', async () => {
            const operations: string[] = [];

            const promise = queue.enqueue('test-key', async () => {
                throw { code: 'EPERM', message: 'Permission denied' };
            });
            const assertion = expect(promise).rejects.toBeDefined();
            await vi.runAllTimersAsync();
            await assertion;

            // Queue should be empty after failed operation
            await queue.enqueue('test-key', async () => {
                operations.push('next-op');
            });
            await vi.runAllTimersAsync();

            expect(operations).toEqual(['next-op']);
        });

        it('should continue processing queue after failure', async () => {
            const operations: string[] = [];

            // First operation fails
            queue.enqueue('test-key', async () => {
                throw { code: 'ENOENT' };
            }).catch(() => {});

            // Second operation should still execute
            queue.enqueue('test-key', async () => {
                operations.push('op2');
            });

            await vi.runAllTimersAsync();

            expect(operations).toEqual(['op2']);
        });

        it('should propagate error to caller', async () => {
            const error = { code: 'EPERM', message: 'Permission denied' };

            const promise = queue.enqueue('test-key', async () => {
                throw error;
            });
            const assertion = expect(promise).rejects.toEqual(error);
            await vi.runAllTimersAsync();
            await assertion;
        });
    });

    describe('Shared Queue', () => {
        it('should return singleton shared queue instance', () => {
            const first = getSharedOperationQueue();
            const second = getSharedOperationQueue();
            expect(first).toBe(second);
        });
    });

    describe('Queue Introspection', () => {
        it('should report queue size for a key', async () => {
            const releaseLock = await queue.acquireLock('test-key');
            const promise = queue.enqueue('test-key', async () => {});

            expect(queue.getQueueSize('test-key')).toBeGreaterThanOrEqual(1);

            releaseLock();
            await vi.runAllTimersAsync();
            await promise;
            expect(queue.getQueueSize('test-key')).toBe(0);
        });

        it('should clear pending operations for a key', async () => {
            const releaseLock = await queue.acquireLock('test-key');
            const first = queue.enqueue('test-key', async () => {});
            const second = queue.enqueue('test-key', async () => {});
            const firstAssertion = expect(first).rejects.toThrow('Queue cleared for key: test-key');
            const secondAssertion = expect(second).rejects.toThrow('Queue cleared for key: test-key');

            queue.clearQueue('test-key');
            releaseLock();
            await vi.runAllTimersAsync();

            await firstAssertion;
            await secondAssertion;
        });

        it('should cap operation history to 100 entries', async () => {
            for (let i = 0; i < 110; i++) {
                await queue.enqueue(`key-${i}`, async () => {});
            }
            await vi.runAllTimersAsync();
            const history = queue.getOperationHistory();
            expect(history.length).toBe(100);
            expect(history[history.length - 1]?.status).toBe('success');
        });
    });
});
