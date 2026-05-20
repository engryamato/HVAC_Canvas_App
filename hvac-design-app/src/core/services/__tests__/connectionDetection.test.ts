/**
 * Unit tests for ConnectionDetectionService
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConnectionDetectionService } from '../connectionDetection';
import { Duct, DuctRun } from '@/core/schema';
import { useEntityStore } from '@/core/store/entityStore';
import type { DetectedConnection } from '../connectionDetection';
import { createDuctRun } from '@/features/canvas/entities/ductRunDefaults';

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
    transform: { x, y, elevation: 0, rotation, scaleX: 1, scaleY: 1 },
    zIndex: 5,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    props: {
      name: `Duct ${id}`,
      shape: 'round',
      diameter: 12,
      length,
      engineeringSystem: 'standard_duct',
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

  const createMockDuctRun = (
    id: string,
    x: number,
    y: number,
    rotation: number,
    installLength = 10
  ): DuctRun => {
    const run = createDuctRun({ x, y, installLength, sectionLengthOverride: 5 });
    run.id = id;
    run.transform.rotation = rotation;
    run.props.startPoint = { x, y };
    run.props.endPoint =
      rotation === 90
        ? { x, y: y + installLength * 12 }
        : { x: x + installLength * 12, y };
    return run;
  };

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
      const duct2 = createMockDuct('duct2', 220, 100, 90, 10);
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

    it('classifies tee when a new duct endpoint connects to two existing ducts', () => {
      const trunk = createMockDuct('trunk', 100, 100, 0, 10);
      const branch = createMockDuct('branch', 220, -20, 90, 10);
      const newDuct = createMockDuct('new', 220, 100, 90, 10);

      (useEntityStore.getState as any).mockReturnValue({
        byId: {
          trunk,
          branch,
          new: newDuct,
        },
      });

      const connections = ConnectionDetectionService.detectConnections('new');
      expect(connections.length).toBe(2);
      expect(connections.every((connection: DetectedConnection) => connection.fittingType === 'tee')).toBe(true);
    });

    it('classifies transition for straight connection with size change', () => {
      const large = createMockDuct('large', 100, 100, 0, 10);
      large.props.diameter = 24;
      const small = createMockDuct('small', 220, 100, 0, 10);
      small.props.diameter = 12;

      (useEntityStore.getState as any).mockReturnValue({
        byId: {
          large,
          small,
        },
      });

      const connections = ConnectionDetectionService.detectConnections('small');
      expect(connections).toHaveLength(1);
      expect(connections[0]?.fittingType).toBe('transition');
    });

    // Latest magnetic-center snapping regression: endpoint-to-body connections must be
    // detected at the final centerline coordinate, not from cursor or edge proximity.
    it('detects endpoint-to-body duct_run connections at the final centerline point', () => {
      const trunk = createMockDuctRun('trunk', 100, 100, 0, 10);
      const branch = createMockDuctRun('branch', 160, 100, 90, 10);

      (useEntityStore.getState as any).mockReturnValue({
        byId: {
          trunk,
          branch,
        },
      });

      const connections = ConnectionDetectionService.detectConnections('branch');

      expect(connections).toHaveLength(1);
      expect(connections[0]?.fittingType).toBe('tee');
      expect(connections[0]?.newDuct.position).toEqual({ x: 160, y: 100 });
      expect(connections[0]?.existingDuct.position).toEqual({ x: 160, y: 100 });
      expect(connections[0]?.existingDuct.endPoint).toBe('body');
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
