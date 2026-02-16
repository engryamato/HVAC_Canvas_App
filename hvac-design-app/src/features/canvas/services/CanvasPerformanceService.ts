export interface PerformanceHints {
  detailLevel: 'full' | 'simplified' | 'performance';
  enableHatching: boolean;
  enableShadows: boolean;
  simplifyFittings: boolean;
}

export interface PerformanceThresholds {
  targetFPS: number;
  minFPS: number;
  maxEntityCount: number;
}

export class CanvasPerformanceService {
  private frameStartTime: number | null = null;

  private frameTimes: number[] = [];

  private entityCount: number = 0;

  private performanceMode: boolean = false;

  private thresholds: PerformanceThresholds = {
    targetFPS: 60,
    minFPS: 30,
    maxEntityCount: 500,
  };

  startFrame(): void {
    this.frameStartTime = performance.now();
  }

  endFrame(): void {
    if (this.frameStartTime === null) {
      return;
    }

    const frameDuration = performance.now() - this.frameStartTime;
    this.frameTimes.push(frameDuration);

    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }

    this.frameStartTime = null;

    const fps = this.calculateAverageFPS();
    this.performanceMode =
      fps < this.thresholds.minFPS ||
      this.entityCount > this.thresholds.maxEntityCount;
  }

  getPerformanceHints(): PerformanceHints {
    const fps = this.calculateAverageFPS();

    let detailLevel: PerformanceHints['detailLevel'] = 'full';
    if (fps < this.thresholds.minFPS) {
      detailLevel = 'performance';
    } else if (fps < this.thresholds.targetFPS - 10) {
      detailLevel = 'simplified';
    }

    return {
      detailLevel,
      enableHatching: fps >= this.thresholds.minFPS + 10,
      enableShadows: fps >= this.thresholds.targetFPS - 10,
      simplifyFittings:
        fps < this.thresholds.minFPS + 5 ||
        this.entityCount > this.thresholds.maxEntityCount,
    };
  }

  isPerformanceMode(): boolean {
    const fps = this.calculateAverageFPS();
    this.performanceMode =
      fps < this.thresholds.minFPS ||
      this.entityCount > this.thresholds.maxEntityCount;
    return this.performanceMode;
  }

  getEntityCount(): number {
    return this.entityCount;
  }

  setEntityCount(count: number): void {
    this.entityCount = count;
    this.performanceMode = this.isPerformanceMode();
  }

  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = {
      ...this.thresholds,
      ...thresholds,
    };
    // Immediately influence hints via mode check
    this.performanceMode = this.isPerformanceMode();
  }

  reset(): void {
    this.frameTimes = [];
    this.frameStartTime = null;
    this.performanceMode = false;
  }

  private calculateAverageFPS(): number {
    if (this.frameTimes.length < 10) {
      return 60;
    }

    const totalFrameTime = this.frameTimes.reduce(
      (total, frameTime) => total + frameTime,
      0,
    );
    const averageFrameTime = totalFrameTime / this.frameTimes.length;

    if (averageFrameTime <= 0) {
      return 60;
    }

    return 1000 / averageFrameTime;
  }
}

export default CanvasPerformanceService;
export const canvasPerformanceService = new CanvasPerformanceService();
