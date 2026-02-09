export interface QueuedOperation {
    id: string;
    key: string;
    type: string;
    execute: () => Promise<void>;
    retryCount: number;
    maxRetries: number;
    createdAt: number;
}

export type ReleaseFn = () => void;

export class OperationQueue {
    private queues: Map<string, QueuedOperation[]> = new Map();
    private processing: Map<string, boolean> = new Map();
    private history: Array<{ id: string; key: string; type: string; status: string; timestamp: number }> = [];

    constructor() { }

    async enqueue(key: string, operation: QueuedOperation): Promise<void> {
        if (!this.queues.has(key)) {
            this.queues.set(key, []);
        }
        this.queues.get(key)!.push(operation);
        this.processQueue(key);
    }

    async acquireLock(key: string): Promise<ReleaseFn> {
        let release: ReleaseFn = () => { };
        const releasedPromise = new Promise<void>((resolve) => {
            release = resolve;
        });

        // Enqueue an operation that waits for the release function to be called
        await new Promise<void>((resolveEnqueued) => {
            const op: QueuedOperation = {
                id: `lock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                key,
                type: 'lock',
                execute: async () => {
                    resolveEnqueued(); // Lock acquired
                    await releasedPromise; // Wait until released
                },
                retryCount: 0,
                maxRetries: 0,
                createdAt: Date.now()
            };
            this.enqueue(key, op);
        });

        return release;
    }

    private async processQueue(key: string) {
        if (this.processing.get(key)) return;

        const queue = this.queues.get(key);
        if (!queue || queue.length === 0) return;

        this.processing.set(key, true);

        // Process all items in queue sequentially
        // Note: we re-check queue length inside loop because previous ops might satisfy it? 
        // Actually best to process one by one and keep calling processQueue recursively or via loop
        
        try {
            while (queue && queue.length > 0) {
                const op = queue[0];
                try {
                    await this.executeOperation(op);
                    this.addToHistory(op, 'completed');
                    queue.shift(); // Remove from queue only after successful execution
                } catch (error) {
                    console.error(`Operation ${op.id} failed`, error);
                    this.addToHistory(op, 'failed');
                    queue.shift(); // Remove on failure to avoid blocking the queue forever
                    // In a more robust system we might want to pause the queue or DLQ it
                }
            }
        } finally {
            this.processing.set(key, false);
            // Check if more items were added while we were processing
            if (this.queues.get(key)?.length ?? 0 > 0) {
                 this.processQueue(key);
            }
        }
    }

    private async executeOperation(op: QueuedOperation) {
        let lastError: any;
        for (let i = 0; i <= op.maxRetries; i++) {
            try {
                await op.execute();
                return;
            } catch (err: any) {
                lastError = err;
                if (this.isTransientError(err)) {
                    // Exponential backoff: 100ms, 200ms, 400ms...
                    const delay = 100 * Math.pow(2, i);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    op.retryCount++;
                } else {
                    throw err; // Non-transient error, fail immediately
                }
            }
        }
        throw lastError; // Max retries reached
    }

    private isTransientError(error: any): boolean {
        const msg = (error.message || error.code || '').toString();
        return msg.includes('EBUSY') || msg.includes('EAGAIN');
    }

    private addToHistory(op: QueuedOperation, status: string) {
        this.history.unshift({
            id: op.id,
            key: op.key,
            type: op.type,
            status,
            timestamp: Date.now()
        });
        if (this.history.length > 100) this.history.pop();
    }
}
