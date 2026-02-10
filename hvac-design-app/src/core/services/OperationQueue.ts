/**
 * Lightweight operation queue with global root lock and per-project FIFO queuing.
 * Coordinates storage operations during migration, relocation, and normal project operations.
 * 
 * @example
 * // Root lock for migration
 * const release = await queue.acquireLock('root');
 * try {
 *   // ... migration operations
 * } finally {
 *   release();
 * }
 * 
 * @example
 * // Per-project queue
 * await queue.enqueue('project:123', async () => {
 *   await saveProject(project);
 * });
 */

export interface QueuedOperation {
    id: string;
    key: string;
    type: OperationType;
    execute: () => Promise<void>;
    retryCount: number;
    maxRetries: number;
    createdAt: number;
    resolve: () => void;
    reject: (error: unknown) => void;
}

export interface OperationHistoryEntry {
    id: string;
    key: string;
    type: OperationType;
    createdAt: number;
    completedAt: number;
    retryCount: number;
    status: 'success' | 'failed' | 'cleared';
    error?: string;
}

export type OperationType = 'migration' | 'import' | 'save' | 'relocate' | 'delete' | 'generic';

export type ReleaseFn = () => void;

export class OperationQueue {
    private static readonly HISTORY_LIMIT = 100;
    private queues: Map<string, QueuedOperation[]> = new Map();
    private activeOperations: Set<string> = new Set();
    private operationHistory: OperationHistoryEntry[] = [];

    constructor() { }

    /**
     * Enqueues an operation for a specific key (project or root).
     * Operations for the same key execute sequentially in FIFO order.
     * Failed operations are retried up to 3 times for transient errors (EBUSY, EAGAIN, EINTR).
     * 
     * @param key - The queue key (e.g., 'root', 'project:uuid')
     * @param operation - Async function to execute
     */
    async enqueue(
        key: string,
        operation: () => Promise<void>,
        options?: { type?: OperationType; maxRetries?: number }
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // Generate operation ID internally
            const op: QueuedOperation = {
                id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                key,
                type: options?.type ?? 'generic',
                execute: operation,
                retryCount: 0,
                maxRetries: options?.maxRetries ?? 3,
                createdAt: Date.now(),
                resolve,
                reject
            };

            if (!this.queues.has(key)) {
                this.queues.set(key, []);
            }
            this.queues.get(key)!.push(op);
            this.processQueue(key);
        });
    }

    /**
     * Acquires an exclusive lock for the given key.
     * All operations for this key will wait until the lock is released.
     * 
     * @param key - The lock key (typically 'root' for migrations)
     * @returns A function that releases the lock when called
     */
    async acquireLock(key: string): Promise<ReleaseFn> {
        let release: ReleaseFn = () => { };
        const releasedPromise = new Promise<void>((resolve) => {
            release = resolve;
        });

        // Enqueue an operation that waits for the release function to be called
        await new Promise<void>((resolveEnqueued, rejectEnqueued) => {
            const op: QueuedOperation = {
                id: `lock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                key,
                type: 'generic',
                execute: async () => {
                    resolveEnqueued(); // Lock acquired
                    await releasedPromise; // Wait until released
                },
                retryCount: 0,
                maxRetries: 0,
                createdAt: Date.now(),
                resolve: () => {},  // Lock operations don't need to track completion
                reject: rejectEnqueued
            };
            
            if (!this.queues.has(key)) {
                this.queues.set(key, []);
            }
            this.queues.get(key)!.push(op);
            this.processQueue(key);
        });

        return release;
    }

    /**
     * Checks if a key is currently locked/processing.
     * 
     * @param key - The key to check
     * @returns true if the key is currently processing, false otherwise
     */
    isLocked(key: string): boolean {
        return this.activeOperations.has(key);
    }

    getQueueSize(key: string): number {
        return this.queues.get(key)?.length ?? 0;
    }

    clearQueue(key: string): void {
        const queue = this.queues.get(key);
        if (!queue || queue.length === 0) {
            return;
        }

        const currentActive = this.activeOperations.has(key);
        const retained: QueuedOperation[] = [];
        const startIdx = currentActive ? 1 : 0;

        if (currentActive && queue[0]) {
            retained.push(queue[0]);
        }

        for (let i = startIdx; i < queue.length; i++) {
            const op = queue[i];
            if (!op) {
                continue;
            }
            this.recordHistory(op, 'cleared');
            op.reject(new Error(`Queue cleared for key: ${key}`));
        }

        this.queues.set(key, retained);
    }

    getOperationHistory(): OperationHistoryEntry[] {
        return [...this.operationHistory];
    }

    private isRootBarrierActive(): boolean {
        if (this.activeOperations.has('root')) {
            return true;
        }
        return (this.queues.get('root')?.length ?? 0) > 0;
    }

    private async processQueue(key: string) {
        if (key !== 'root' && this.isRootBarrierActive()) {
            return;
        }
        if (this.activeOperations.has(key)) {
            return;
        }

        const queue = this.queues.get(key);
        if (!queue || queue.length === 0) {
            return;
        }

        this.activeOperations.add(key);
        
        try {
            while (queue && queue.length > 0) {
                const op = queue[0];
                if (!op) {
                    break;
                }
                try {
                    await this.executeOperation(op);
                    queue.shift(); // Remove from queue only after successful execution
                    this.recordHistory(op, 'success');
                    op.resolve(); // Resolve the promise
                } catch (error) {
                    console.error(`Operation ${op.id} failed`, error);
                    queue.shift(); // Remove on failure to avoid blocking the queue forever
                    this.recordHistory(op, 'failed', error);
                    op.reject(error); // Reject the promise
                }
            }
        } finally {
            this.activeOperations.delete(key);
            // Check if more items were added while we were processing
            const remainingQueue = this.queues.get(key);
            if (remainingQueue && remainingQueue.length > 0) {
                this.processQueue(key);
            } else {
                // Cleanup: Remove empty queue and processing entry to prevent unbounded growth
                this.queues.delete(key);
            }

            if (key === 'root') {
                this.processNonRootQueues();
            }
        }
    }

    private processNonRootQueues(): void {
        for (const [key, queue] of this.queues.entries()) {
            if (key === 'root' || queue.length === 0) {
                continue;
            }
            this.processQueue(key);
        }
    }

    private async executeOperation(op: QueuedOperation) {
        const delays = [100, 200, 400]; // Simple fixed delays per ticket spec
        let lastError: unknown;
        
        for (let i = 0; i <= op.maxRetries; i++) {
            try {
                await op.execute();
                return;
            } catch (err: unknown) {
                lastError = err;
                if (this.isTransientError(err) && i < op.maxRetries) {
                    // Use array-based delays: 100ms, 200ms, 400ms
                    const delay = delays[i] ?? 400;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    op.retryCount++;
                } else {
                    throw err; // Non-transient error or max retries reached, fail immediately
                }
            }
        }
        throw lastError; // Max retries reached
    }

    private recordHistory(op: QueuedOperation, status: OperationHistoryEntry['status'], error?: unknown): void {
        this.operationHistory.push({
            id: op.id,
            key: op.key,
            type: op.type,
            createdAt: op.createdAt,
            completedAt: Date.now(),
            retryCount: op.retryCount,
            status,
            error: error instanceof Error ? error.message : error ? String(error) : undefined,
        });

        if (this.operationHistory.length > OperationQueue.HISTORY_LIMIT) {
            this.operationHistory.splice(0, this.operationHistory.length - OperationQueue.HISTORY_LIMIT);
        }
    }

    private isTransientError(error: unknown): boolean {
        const msg = (error && typeof error === 'object' && 'message' in error 
            ? String((error as { message?: unknown }).message || '') 
            : '').toLowerCase();
        const code = (error && typeof error === 'object' && 'code' in error 
            ? String((error as { code?: unknown }).code || '') 
            : '').toUpperCase();
        
        // Permanent errors - fail fast
        if (code === 'EPERM' || code === 'ENOENT' || code === 'ENOSPC') {
            return false;
        }
        if (msg.includes('permission denied')) {
            return false;
        }
        if (msg.includes('not found')) {
            return false;
        }
        if (msg.includes('disk full') || msg.includes('no space')) {
            return false;
        }
        if (msg.includes('schema') || msg.includes('validation')) {
            return false;
        }
        
        // Transient errors - retry
        if (code === 'EBUSY' || code === 'EAGAIN' || code === 'EINTR') {
            return true;
        }
        if (msg.includes('locked') || msg.includes('busy')) {
            return true;
        }
        if (msg.includes('temporarily unavailable')) {
            return true;
        }
        
        // Default: treat as permanent to avoid infinite retries
        return false;
    }
}

let sharedOperationQueue: OperationQueue | null = null;

export function getSharedOperationQueue(): OperationQueue {
    if (!sharedOperationQueue) {
        sharedOperationQueue = new OperationQueue();
    }
    return sharedOperationQueue;
}
