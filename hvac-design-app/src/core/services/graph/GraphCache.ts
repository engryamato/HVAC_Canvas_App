import { ConnectionGraph } from './types';

export class GraphCache {
  private cache: Map<string, ConnectionGraph> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  generateSignature(entityIds: string[]): string {
    return entityIds.sort().join('|');
  }

  get(signature: string): ConnectionGraph | undefined {
    return this.cache.get(signature);
  }

  set(signature: string, graph: ConnectionGraph): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(signature, graph);
  }

  invalidate(signature: string): boolean {
    return this.cache.delete(signature);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const graphCache = new GraphCache();
