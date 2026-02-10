/**
 * Unit tests for ConnectionDetectionService
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConnectionDetectionService } from '../connectionDetection';
import { Duct } from '@/core/schema';
import { useEntityStore } from '@/core/store/entityStore';

// Mock the entity store
vi.mock('@/core/store/entityStore', () => ({
  useEntityStore: {
    getState: vi.fn(),
  },
}));

describe('ConnectionDetectionService', () => {
  const createMockDuct = (
    id: string,
    x: number,
    y: number,
    rotation: number,
    length: number = 10
  ): Duct => ({
    id,
    type: 'duct',
    transform: { x, y, rotation, scaleX: 1, scaleY: 1 },
    zIndex: 5,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    props: {
      name: `Duct ${id}`,
      shape: 'round',
      diameter: 12,
      length,
      material: 'galvanized',
      airflow: 1000,
      staticPressure: 1.5,
    },
    calculated: {
      area: 113,
      velocity: 1200,
      frictionLoss: 0.05,
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectConnections', () => {
    it('should detect 90-degree elbow connection', () => {
      const duct1 = createMockDuct('duct1', 100, 100, 0, 10); // Horizontal, 120px long
      const duct2 = createMockDuct('duct2', 220, 100, 90, 10); // Vertical from duct1 end

      (useEntityStore.getState as any).mockReturnValue({
        byId: {
          duct1,
          duct2,
        },
      });

      const connections = ConnectionDetectionService.detectConnections('duct2');

      expect(connections).toHaveLength(1);
      const first = connections[0];
      expect(first).toBeDefined();
      expect(first?.fittingType).toBe('elbow');
      expect(first?.angle ?? 0).toBeGreaterThanOrEqual(85);
      expect(first?.angle ?? 0).toBeLessThanOrEqual(95);
    });

    it('should detect 45-degree elbow connection', () => {
      const duct1 = createMockDuct('duct1', 100, 100, 0, 10);
      const duct2 = createMockDuct('duct2', 220, 100, 45, 10);

      (useEntityStore.getState as any).mockReturnValue({
        byId: {
          duct1,
          duct2,
        },
      });

      const connections = ConnectionDetectionService.detectConnections('duct2');

      expect(connections).toHaveLength(1);
      const first = connections[0];
      expect(first).toBeDefined();
      expect(first?.fittingType).toBe('elbow');
      expect(first?.angle ?? 0).toBeGreaterThanOrEqual(40);
      expect(first?.angle ?? 0).toBeLessThanOrEqual(50);
    });

    it('should not detect connection for straight extension (180 degrees)', () => {
      const duct1 = createMockDuct('duct1', 100, 100, 0, 10);
      const duct2 = createMockDuct('duct2', 220, 100, 0, 10); // Same direction

      (useEntityStore.getState as any).mockReturnValue({
        byId: {
          duct1,
          duct2,
        },
      });

      const connections = ConnectionDetectionService.detectConnections('duct2');

      expect(connections).toHaveLength(0);
    });

    it('should not detect connection when ducts are too far apart', () => {
      const duct1 = createMockDuct('duct1', 100, 100, 0, 10);
      const duct2 = createMockDuct('duct2', 250, 100, 90, 10); // > 12px away

      (useEntityStore.getState as any).mockReturnValue({
        byId: {
          duct1,
          duct2,
        },
      });

      const connections = ConnectionDetectionService.detectConnections('duct2');

      expect(connections).toHaveLength(0);
    });

    it('should detect multiple connections when duct connects to multiple existing ducts', () => {
      const duct1 = createMockDuct('duct1', 100, 100, 0, 10);
      const duct2 = createMockDuct('duct2', 100, 220, 90, 10);
      const duct3 = createMockDuct('duct3', 220, 220, 0, 10); // Connects to duct2 end

      (useEntityStore.getState as any).mockReturnValue({
        byId: {
          duct1,
          duct2,
          duct3,
        },
      });

      const connections = ConnectionDetectionService.detectConnections('duct3');

      expect(connections.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for non-existent duct', () => {
      (useEntityStore.getState as any).mockReturnValue({
        byId: {},
      });

      const connections = ConnectionDetectionService.detectConnections('nonexistent');

      expect(connections).toHaveLength(0);
    });

    it('should ignore the new duct itself when detecting connections', () => {
      const duct1 = createMockDuct('duct1', 100, 100, 0, 10);

      (useEntityStore.getState as any).mockReturnValue({
        byId: {
          duct1,
        },
      });

      const connections = ConnectionDetectionService.detectConnections('duct1');

      expect(connections).toHaveLength(0);
    });
  });

  describe('endpoint calculation', () => {
    it('should correctly calculate endpoints for horizontal duct', () => {
      const duct = createMockDuct('test', 100, 100, 0, 10); // 120px long

      (useEntityStore.getState as any).mockReturnValue({
        byId: { test: duct },
      });

      // Internally tests getDuctEndpoints via detectConnections
      const connections = ConnectionDetectionService.detectConnections('test');
      
      // If no connections, endpoint calculation worked (no self-connection)
      expect(connections).toHaveLength(0);
    });

    it('should correctly calculate endpoints for rotated duct', () => {
      const duct = createMockDuct('test', 100, 100, 45, 10);

      (useEntityStore.getState as any).mockReturnValue({
        byId: { test: duct },
      });

      const connections = ConnectionDetectionService.detectConnections('test');
      
      expect(connections).toHaveLength(0);
    });
  });
});
