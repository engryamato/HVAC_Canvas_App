import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CanvasPerformanceService,
  PerformanceHints,
  PerformanceThresholds,
} from '../CanvasPerformanceService';

describe('CanvasPerformanceService', () => {
  let service: CanvasPerformanceService;
  let performanceNowSpy: { mockRestore: () => void };
  let currentTime: number;

  function simulateFrames(
    targetService: CanvasPerformanceService,
    frameCount: number,
    frameDuration: number,
  ): void {
    for (let i = 0; i < frameCount; i += 1) {
      targetService.startFrame();
      currentTime += frameDuration;
      targetService.endFrame();
    }
  }

  beforeEach(() => {
    service = new CanvasPerformanceService();
    currentTime = 1000;
    performanceNowSpy = vi.spyOn(globalThis, 'performance', 'get').mockReturnValue({
      now: () => currentTime,
    } as Performance);
  });

  afterEach(() => {
    performanceNowSpy.mockRestore();
  });

  describe('frame monitoring', () => {
    it('startFrame() should record timestamp', () => {
      service.startFrame();

      const internal = service as unknown as { frameStartTime: number | null };
      expect(internal.frameStartTime).toBe(currentTime);
    });

    it('endFrame() should calculate frame duration', () => {
      service.startFrame();
      currentTime += 20;
      service.endFrame();

      const internal = service as unknown as { frameTimes: number[] };
      expect(internal.frameTimes).toHaveLength(1);
      expect(internal.frameTimes[0]).toBe(20);
    });

    it('frame times array should maintain max 60 entries', () => {
      simulateFrames(service, 70, 16);

      const internal = service as unknown as { frameTimes: number[] };
      expect(internal.frameTimes).toHaveLength(60);
      expect(internal.frameTimes.every((value) => value === 16)).toBe(true);
    });

    it('FPS calculation from frame times should be accurate', () => {
      simulateFrames(service, 60, 20);

      const internal = service as unknown as { calculateAverageFPS: () => number };
      expect(internal.calculateAverageFPS()).toBeCloseTo(50, 4);
    });
  });

  describe('performance hints', () => {
    it('getPerformanceHints() at 60 FPS should return full quality hints', () => {
      simulateFrames(service, 60, 16.67);

      const hints: PerformanceHints = service.getPerformanceHints();
      expect(hints.detailLevel).toBe('full');
      expect(hints.enableHatching).toBe(true);
      expect(hints.enableShadows).toBe(true);
      expect(hints.simplifyFittings).toBe(false);
    });

    it('getPerformanceHints() at 40 FPS should return simplified hints', () => {
      simulateFrames(service, 60, 25);

      const hints: PerformanceHints = service.getPerformanceHints();
      expect(hints.detailLevel).toBe('simplified');
      expect(hints.enableHatching).toBe(true);
      expect(hints.enableShadows).toBe(false);
      expect(hints.simplifyFittings).toBe(false);
    });

    it('getPerformanceHints() at 25 FPS should return performance hints', () => {
      simulateFrames(service, 60, 40);

      const hints: PerformanceHints = service.getPerformanceHints();
      expect(hints.detailLevel).toBe('performance');
      expect(hints.enableHatching).toBe(false);
      expect(hints.enableShadows).toBe(false);
      expect(hints.simplifyFittings).toBe(true);
    });

    it('high entity count should force simplifyFittings regardless of FPS', () => {
      simulateFrames(service, 60, 16.67);
      service.setEntityCount(501);

      const hints: PerformanceHints = service.getPerformanceHints();
      expect(hints.simplifyFittings).toBe(true);
      expect(hints.detailLevel).toBe('full');
    });
  });

  describe('performance mode', () => {
    it('isPerformanceMode() should return true at < 30 FPS', () => {
      simulateFrames(service, 60, 40);

      expect(service.isPerformanceMode()).toBe(true);
    });

    it('isPerformanceMode() should return true at > 500 entities', () => {
      service.setEntityCount(501);

      expect(service.isPerformanceMode()).toBe(true);
    });

    it('isPerformanceMode() should return false when conditions improve', () => {
      simulateFrames(service, 60, 40);
      service.setEntityCount(600);
      expect(service.isPerformanceMode()).toBe(true);

      service.reset();
      service.setEntityCount(100);
      simulateFrames(service, 60, 16.67);

      expect(service.isPerformanceMode()).toBe(false);
    });
  });

  describe('state methods', () => {
    it('getEntityCount() should return current count', () => {
      expect(service.getEntityCount()).toBe(0);

      service.setEntityCount(123);
      expect(service.getEntityCount()).toBe(123);
    });

    it('setEntityCount() should update count and recalculate performance mode', () => {
      service.setEntityCount(510);
      expect(service.isPerformanceMode()).toBe(true);

      service.setEntityCount(100);
      expect(service.isPerformanceMode()).toBe(false);
    });
  });

  describe('configuration', () => {
    it('setThresholds() should update thresholds', () => {
      const customThresholds: Partial<PerformanceThresholds> = {
        targetFPS: 75,
        minFPS: 45,
        maxEntityCount: 250,
      };

      service.setThresholds(customThresholds);

      const internal = service as unknown as { thresholds: PerformanceThresholds };
      expect(internal.thresholds).toEqual({
        targetFPS: 75,
        minFPS: 45,
        maxEntityCount: 250,
      });
    });

    it('custom thresholds should affect frame-end performance evaluation', () => {
      service.setThresholds({ minFPS: 45, maxEntityCount: 200 });
      simulateFrames(service, 60, 25);

      const internal = service as unknown as { performanceMode: boolean };
      expect(internal.performanceMode).toBe(true);

      service.setEntityCount(199);
      service.reset();
      simulateFrames(service, 60, 16.67);

      expect(internal.performanceMode).toBe(false);
    });

    it('reset() should clear frame times and reset state', () => {
      simulateFrames(service, 20, 40);
      service.setEntityCount(650);
      expect(service.isPerformanceMode()).toBe(true);

      service.reset();

      const internal = service as unknown as {
        frameTimes: number[];
        frameStartTime: number | null;
        performanceMode: boolean;
      };

      expect(internal.frameTimes).toEqual([]);
      expect(internal.frameStartTime).toBeNull();
      expect(internal.performanceMode).toBe(false);
      expect(service.isPerformanceMode()).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('with insufficient frame data (< 10), should return 60 FPS default behavior', () => {
      simulateFrames(service, 9, 80);

      const hints = service.getPerformanceHints();
      expect(hints.detailLevel).toBe('full');
      expect(hints.enableHatching).toBe(true);
      expect(hints.enableShadows).toBe(true);
      expect(hints.simplifyFittings).toBe(false);
    });

    it('rapid FPS fluctuations should be handled gracefully', () => {
      for (let i = 0; i < 30; i += 1) {
        service.startFrame();
        currentTime += i % 2 === 0 ? 10 : 50;
        service.endFrame();
      }

      const hints = service.getPerformanceHints();
      expect(['full', 'simplified', 'performance']).toContain(hints.detailLevel);
      expect(typeof hints.enableHatching).toBe('boolean');
      expect(typeof hints.enableShadows).toBe('boolean');
      expect(typeof hints.simplifyFittings).toBe('boolean');
    });

    it('entity count changes should update performance mode', () => {
      simulateFrames(service, 60, 16.67);
      service.setEntityCount(700);
      expect(service.isPerformanceMode()).toBe(true);

      service.setEntityCount(10);
      expect(service.isPerformanceMode()).toBe(false);
    });

    it('endFrame() should not mutate state if startFrame() was never called', () => {
      service.endFrame();

      const internal = service as unknown as {
        frameTimes: number[];
        frameStartTime: number | null;
      };

      expect(internal.frameTimes).toEqual([]);
      expect(internal.frameStartTime).toBeNull();
    });
  });
});
