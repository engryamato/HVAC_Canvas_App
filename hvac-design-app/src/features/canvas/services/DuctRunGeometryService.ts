import { feetToPixels, inchesToPixels } from '@/core/constants/coordinates';
import type { Bounds } from '@/core/geometry/bounds';
import type { DuctRun, DuctSegment } from '@/core/schema';

type Point = {
  x: number;
  y: number;
};

export type DuctRunSegmentGeometry = {
  segment: DuctSegment;
  start: Point;
  end: Point;
  bounds: Bounds;
};

export type DuctRunGeometry = {
  start: Point;
  end: Point;
  direction: Point;
  normal: Point;
  lengthPx: number;
  thicknessPx: number;
  corners: [Point, Point, Point, Point];
  hitBounds: Bounds;
  labelAnchor: Point;
  segmentGeometries: DuctRunSegmentGeometry[];
};

export class DuctRunGeometryService {
  private static cache = new Map<string, DuctRunGeometry>();

  static getGeometry(run: DuctRun): DuctRunGeometry {
    const key = JSON.stringify({
      id: run.id,
      transform: run.transform,
      installLength: run.props.installLength,
      shape: run.props.shape,
      diameter: 'diameter' in run.props ? run.props.diameter : undefined,
      width: 'width' in run.props ? run.props.width : undefined,
      height: 'height' in run.props ? run.props.height : undefined,
      segments: run.props.segments,
    });

    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const geometry = this.buildGeometry(run);
    this.cache.set(key, geometry);
    return geometry;
  }

  static getBounds(run: DuctRun): Bounds {
    return this.getGeometry(run).hitBounds;
  }

  static getSegmentIndexAtPoint(run: DuctRun, point: Point): number | null {
    const geometry = this.getGeometry(run);

    for (const segmentGeometry of geometry.segmentGeometries) {
      if (this.pointInRunRect(point, segmentGeometry.start, segmentGeometry.end, geometry.thicknessPx)) {
        return segmentGeometry.segment.index;
      }
    }

    return null;
  }

  private static buildGeometry(run: DuctRun): DuctRunGeometry {
    const radians = ((run.transform.rotation ?? 0) * Math.PI) / 180;
    const direction = { x: Math.cos(radians), y: Math.sin(radians) };
    const normal = { x: -direction.y, y: direction.x };
    const start = { x: run.transform.x, y: run.transform.y };
    const lengthPx = feetToPixels(run.props.installLength);
    const end = {
      x: start.x + direction.x * lengthPx,
      y: start.y + direction.y * lengthPx,
    };
    const thicknessPx = this.resolveThicknessPx(run);
    const halfThickness = thicknessPx / 2;
    const corners: [Point, Point, Point, Point] = [
      this.offsetPoint(start, normal, halfThickness),
      this.offsetPoint(end, normal, halfThickness),
      this.offsetPoint(end, normal, -halfThickness),
      this.offsetPoint(start, normal, -halfThickness),
    ];
    const hitBounds = this.boundsFromPoints(corners);
    const labelAnchor = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    const segmentGeometries = run.props.segments.map((segment) => {
      const segmentStart = {
        x: start.x + direction.x * feetToPixels(segment.startStation),
        y: start.y + direction.y * feetToPixels(segment.startStation),
      };
      const segmentEnd = {
        x: start.x + direction.x * feetToPixels(segment.endStation),
        y: start.y + direction.y * feetToPixels(segment.endStation),
      };
      const segmentBounds = this.boundsFromPoints([
        this.offsetPoint(segmentStart, normal, halfThickness),
        this.offsetPoint(segmentEnd, normal, halfThickness),
        this.offsetPoint(segmentEnd, normal, -halfThickness),
        this.offsetPoint(segmentStart, normal, -halfThickness),
      ]);

      return {
        segment,
        start: segmentStart,
        end: segmentEnd,
        bounds: segmentBounds,
      };
    });

    return {
      start,
      end,
      direction,
      normal,
      lengthPx,
      thicknessPx,
      corners,
      hitBounds,
      labelAnchor,
      segmentGeometries,
    };
  }

  private static resolveThicknessPx(run: DuctRun): number {
    if ((run.props.shape === 'round' || run.props.shape === 'flexible') && 'diameter' in run.props) {
      return inchesToPixels(run.props.diameter);
    }

    if ('width' in run.props && typeof run.props.width === 'number') {
      return inchesToPixels(run.props.width);
    }

    if ('height' in run.props && typeof run.props.height === 'number') {
      return inchesToPixels(run.props.height);
    }

    return inchesToPixels(10);
  }

  private static pointInRunRect(point: Point, start: Point, end: Point, thicknessPx: number): boolean {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) {
      return false;
    }

    const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq;
    if (t < 0 || t > 1) {
      return false;
    }

    const projection = {
      x: start.x + dx * t,
      y: start.y + dy * t,
    };

    return Math.hypot(point.x - projection.x, point.y - projection.y) <= thicknessPx / 2;
  }

  private static offsetPoint(point: Point, normal: Point, distance: number): Point {
    return {
      x: point.x + normal.x * distance,
      y: point.y + normal.y * distance,
    };
  }

  private static boundsFromPoints(points: Point[]): Bounds {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const point of points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
}
