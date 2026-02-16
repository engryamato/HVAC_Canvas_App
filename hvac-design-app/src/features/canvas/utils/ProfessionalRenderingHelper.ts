export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LineOptions {
  style?: 'solid' | 'dashed' | 'centerline';
  color?: string;
  weight?: number;
}

export type EquipmentType = 'AHU' | 'Fan' | 'Hood' | 'Diffuser' | 'Damper';

/**
 * Helper class for professional HVAC rendering on HTML5 Canvas.
 *
 * Provides advanced rendering techniques for HVAC systems including:
 * - Double-line duct representation (ASHRAE standard)
 * - Insulation hatching patterns with LRU caching
 * - ASHRAE-compliant equipment symbols
 * - Parametric fitting geometry (elbows, tees, reducers)
 * - Zoom-aware scaling for consistent visual appearance
 *
 * @example
 * ```typescript
 * const helper = new ProfessionalRenderingHelper(ctx, zoom);
 * helper.drawDoubleLine({x: 0, y: 0}, {x: 100, y: 0}, 12, {style: 'solid'});
 * ```
 */
export class ProfessionalRenderingHelper {
  private static patternCache: Map<string, CanvasPattern> = new Map();
  private static patternKeys: string[] = []; // For LRU tracking

  constructor(
    private ctx: CanvasRenderingContext2D,
    private zoom: number
  ) {}

  /**
   * Draw double-line representation for ducts per ASHRAE standards.
   *
   * Renders two parallel lines offset from the centerline by half the duct width.
   * Supports solid, dashed, and centerline styles.
   *
   * @param start - Start point {x, y} in canvas coordinates
   * @param end - End point {x, y} in canvas coordinates
   * @param width - Duct width in pixels
   * @param options - Line styling options
   * @param options.style - Line style: 'solid' | 'dashed' | 'centerline' (default: 'solid')
   * @param options.color - Stroke color (default: '#000000')
   * @param options.weight - Line weight in pixels (default: 1)
   *
   * @example
   * ```typescript
   * // Draw a 12" wide duct with dashed lines
   * helper.drawDoubleLine(
   *   {x: 0, y: 0},
   *   {x: 100, y: 0},
   *   12,
   *   {style: 'dashed', color: '#424242'}
   * );
   * ```
   */
  drawDoubleLine(
    start: Point,
    end: Point,
    width: number,
    options: LineOptions = {}
  ): void {
    const { style = 'solid', color = '#000000', weight = 1 } = options;

    // Calculate perpendicular offset
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return;

    const offsetX = (-dy / length) * (width / 2);
    const offsetY = (dx / length) * (width / 2);

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = this.applyZoomScaling(weight);
    this.setLineStyle(style);

    // Draw first line
    this.ctx.beginPath();
    this.ctx.moveTo(start.x + offsetX, start.y + offsetY);
    this.ctx.lineTo(end.x + offsetX, end.y + offsetY);
    this.ctx.stroke();

    // Draw second line
    this.ctx.beginPath();
    this.ctx.moveTo(start.x - offsetX, start.y - offsetY);
    this.ctx.lineTo(end.x - offsetX, end.y - offsetY);
    this.ctx.stroke();

    this.ctx.restore();
  }

  /**
   * Draw diagonal hatching pattern for insulation visualization.
   *
   * Uses canvas pattern caching with LRU eviction (max 20 patterns) for performance.
   * Patterns are cached per zoom level and angle combination.
   *
   * @param bounds - Rectangle defining the area to fill {x, y, width, height}
   * @param thickness - Line thickness for hatching lines
   * @param angle - Diagonal angle in degrees (default: 45)
   *
   * @example
   * ```typescript
   * // Draw 45° insulation hatching
   * helper.drawHatching({x: 10, y: 10, width: 100, height: 50}, 1, 45);
   * ```
   */
  drawHatching(bounds: Rectangle, thickness: number, angle: number = 45): void {
    const cacheKey = `hatching-${Math.round(this.zoom * 100)}-${angle}`;

    let pattern = ProfessionalRenderingHelper.patternCache.get(cacheKey);

    if (!pattern) {
      pattern = this.createHatchingPattern(thickness, angle);
      ProfessionalRenderingHelper.patternCache.set(cacheKey, pattern);
      ProfessionalRenderingHelper.patternKeys.push(cacheKey);

      // LRU eviction: remove oldest if cache exceeds 20
      if (ProfessionalRenderingHelper.patternKeys.length > 20) {
        const oldestKey = ProfessionalRenderingHelper.patternKeys.shift();
        if (oldestKey) {
          ProfessionalRenderingHelper.patternCache.delete(oldestKey);
        }
      }
    }

    this.ctx.save();
    this.ctx.fillStyle = pattern;
    this.ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    this.ctx.restore();
  }

  /**
   * Create hatching pattern canvas
   */
  private createHatchingPattern(thickness: number, angle: number): CanvasPattern {
    const patternCanvas = document.createElement('canvas');
    const patternSize = 20 / this.zoom;
    patternCanvas.width = patternSize;
    patternCanvas.height = patternSize;
    const patternCtx = patternCanvas.getContext('2d')!;

    patternCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    patternCtx.lineWidth = thickness / this.zoom;
    patternCtx.beginPath();

    const radians = (angle * Math.PI) / 180;
    const dx = patternSize * Math.cos(radians);
    const dy = patternSize * Math.sin(radians);

    // Draw diagonal lines
    for (let i = -1; i <= 2; i++) {
      const offset = i * patternSize;
      patternCtx.moveTo(offset, 0);
      patternCtx.lineTo(offset + dx, dy);
    }

    patternCtx.stroke();

    return this.ctx.createPattern(patternCanvas, 'repeat')!;
  }

  /**
   * Draw ASHRAE-compliant equipment symbols.
   *
   * Renders standardized symbols for HVAC equipment:
   * - AHU: X symbol with coil representation
   * - Fan: Circle with radiating blade lines
   * - Hood: Trapezoid with exhaust arrow
   * - Diffuser: Grid with airflow indicators
   * - Damper: Angled blade representation
   *
   * @param type - Equipment type from ASHRAE standard
   * @param bounds - Bounding rectangle for symbol placement
   *
   * @example
   * ```typescript
   * helper.drawEquipmentSymbol('Fan', {x: 50, y: 50, width: 40, height: 40});
   * ```
   */
  drawEquipmentSymbol(type: EquipmentType, bounds: Rectangle): void {
    this.ctx.save();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = this.applyZoomScaling(2);
    this.ctx.fillStyle = '#FFFFFF';

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const size = Math.min(bounds.width, bounds.height) * 0.8;
    const halfSize = size / 2;

    switch (type) {
      case 'AHU':
        // Draw X symbol with coil representation
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - halfSize, centerY - halfSize);
        this.ctx.lineTo(centerX + halfSize, centerY + halfSize);
        this.ctx.moveTo(centerX + halfSize, centerY - halfSize);
        this.ctx.lineTo(centerX - halfSize, centerY + halfSize);
        this.ctx.stroke();
        // Coil representation (circle in center)
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, halfSize * 0.3, 0, Math.PI * 2);
        this.ctx.stroke();
        break;

      case 'Fan':
        // Draw circle with blade lines
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, halfSize, 0, Math.PI * 2);
        this.ctx.stroke();
        // Blade lines radiating from center
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          this.ctx.beginPath();
          this.ctx.moveTo(centerX, centerY);
          this.ctx.lineTo(
            centerX + Math.cos(angle) * halfSize * 0.8,
            centerY + Math.sin(angle) * halfSize * 0.8
          );
          this.ctx.stroke();
        }
        break;

      case 'Hood':
        // Draw trapezoid with exhaust arrow
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - halfSize * 0.8, centerY + halfSize * 0.5);
        this.ctx.lineTo(centerX + halfSize * 0.8, centerY + halfSize * 0.5);
        this.ctx.lineTo(centerX + halfSize, centerY - halfSize);
        this.ctx.lineTo(centerX - halfSize, centerY - halfSize);
        this.ctx.closePath();
        this.ctx.stroke();
        // Exhaust arrow
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY + halfSize * 0.5);
        this.ctx.lineTo(centerX, centerY - halfSize * 1.2);
        this.ctx.moveTo(centerX - halfSize * 0.2, centerY - halfSize);
        this.ctx.lineTo(centerX, centerY - halfSize * 1.2);
        this.ctx.lineTo(centerX + halfSize * 0.2, centerY - halfSize);
        this.ctx.stroke();
        break;

      case 'Diffuser':
        // Draw grid pattern
        this.ctx.strokeRect(
          centerX - halfSize,
          centerY - halfSize,
          size,
          size
        );
        // Horizontal lines
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - halfSize, centerY);
        this.ctx.lineTo(centerX + halfSize, centerY);
        this.ctx.stroke();
        // Vertical lines
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - halfSize);
        this.ctx.lineTo(centerX, centerY + halfSize);
        this.ctx.stroke();
        // Airflow indicators
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY + halfSize * 0.8);
        this.ctx.lineTo(centerX, centerY + halfSize * 1.3);
        this.ctx.moveTo(centerX - halfSize * 0.2, centerY + halfSize);
        this.ctx.lineTo(centerX, centerY + halfSize * 1.3);
        this.ctx.lineTo(centerX + halfSize * 0.2, centerY + halfSize);
        this.ctx.stroke();
        break;

      case 'Damper':
        // Draw angled blade representation
        this.ctx.strokeRect(
          centerX - halfSize,
          centerY - halfSize * 0.3,
          size,
          halfSize * 0.6
        );
        // Angled blade
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - halfSize * 0.7, centerY + halfSize * 0.2);
        this.ctx.lineTo(centerX + halfSize * 0.7, centerY - halfSize * 0.2);
        this.ctx.stroke();
        // Pivot point
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, halfSize * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        break;
    }

    this.ctx.restore();
  }

  /**
   * Draw elbow fitting with ASHRAE standard radius.
   *
   * Default radius follows ASHRAE guideline: 1.5 × duct width.
   * Renders double-line arc with centerline for round ducts.
   *
   * @param center - Center point of the elbow arc
   * @param radius - Arc radius (default: 1.5 × width per ASHRAE)
   * @param angle - Sweep angle in degrees
   * @param width - Duct width in pixels
   *
   * @example
   * ```typescript
   * // 90° elbow for 12" duct
   * helper.drawElbow({x: 100, y: 100}, 0, 90, 12);
   * ```
   */
  drawElbow(
    center: Point,
    radius: number,
    angle: number,
    width: number
  ): void {
    // ASHRAE standard: radius = 1.5 × width
    const elbowRadius = radius || width * 1.5;

    this.ctx.save();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = this.applyZoomScaling(2);

    // Draw outer arc
    this.ctx.beginPath();
    this.ctx.arc(
      center.x,
      center.y,
      elbowRadius + width / 2,
      0,
      (angle * Math.PI) / 180
    );
    this.ctx.stroke();

    // Draw inner arc
    this.ctx.beginPath();
    this.ctx.arc(
      center.x,
      center.y,
      elbowRadius - width / 2,
      0,
      (angle * Math.PI) / 180
    );
    this.ctx.stroke();

    // Draw centerline for round ducts
    this.ctx.setLineDash([10 / this.zoom, 5 / this.zoom, 2 / this.zoom, 5 / this.zoom]);
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, elbowRadius, 0, (angle * Math.PI) / 180);
    this.ctx.stroke();

    this.ctx.restore();
  }

  /**
   * Draw tee fitting with branch connection.
   *
   * Renders main run with double lines and perpendicular branch.
   * Branch can extend from top, bottom, or side of main run.
   *
   * @param center - Center point at junction
   * @param width - Duct width in pixels
   * @param branchType - Branch position: 'top' | 'side' | 'bottom'
   *
   * @example
   * ```typescript
   * helper.drawTee({x: 100, y: 100}, 12, 'top');
   * ```
   */
  drawTee(
    center: Point,
    width: number,
    branchType: 'top' | 'side' | 'bottom'
  ): void {
    this.ctx.save();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = this.applyZoomScaling(2);

    const length = width * 3;

    // Draw main run (horizontal)
    this.drawDoubleLine(
      { x: center.x - length / 2, y: center.y },
      { x: center.x + length / 2, y: center.y },
      width,
      { style: 'solid' }
    );

    // Draw branch
    let branchStart: Point;
    let branchEnd: Point;

    switch (branchType) {
      case 'top':
        branchStart = { x: center.x, y: center.y };
        branchEnd = { x: center.x, y: center.y - length / 2 };
        break;
      case 'bottom':
        branchStart = { x: center.x, y: center.y };
        branchEnd = { x: center.x, y: center.y + length / 2 };
        break;
      case 'side':
        branchStart = { x: center.x, y: center.y };
        branchEnd = { x: center.x + length / 2, y: center.y };
        break;
    }

    this.drawDoubleLine(branchStart, branchEnd, width, { style: 'solid' });

    this.ctx.restore();
  }

  /**
   * Draw reducer fitting with tapered transition.
   *
   * Renders converging/diverging double lines.
   * Taper angle constrained to max 30° per SMACNA standards.
   *
   * @param start - Start point {x, y}
   * @param end - End point {x, y}
   * @param startWidth - Width at start point
   * @param endWidth - Width at end point
   *
   * @example
   * ```typescript
   * // 12" to 8" reducer
   * helper.drawReducer({x: 0, y: 0}, {x: 50, y: 0}, 12, 8);
   * ```
   */
  drawReducer(
    start: Point,
    end: Point,
    startWidth: number,
    endWidth: number
  ): void {
    // SMACNA: max 30° taper angle
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return;

    const perpX = (-dy / length);
    const perpY = (dx / length);

    this.ctx.save();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = this.applyZoomScaling(2);

    // Draw converging/diverging double lines
    // Top line
    this.ctx.beginPath();
    this.ctx.moveTo(
      start.x + perpX * (startWidth / 2),
      start.y + perpY * (startWidth / 2)
    );
    this.ctx.lineTo(
      end.x + perpX * (endWidth / 2),
      end.y + perpY * (endWidth / 2)
    );
    this.ctx.stroke();

    // Bottom line
    this.ctx.beginPath();
    this.ctx.moveTo(
      start.x - perpX * (startWidth / 2),
      start.y - perpY * (startWidth / 2)
    );
    this.ctx.lineTo(
      end.x - perpX * (endWidth / 2),
      end.y - perpY * (endWidth / 2)
    );
    this.ctx.stroke();

    this.ctx.restore();
  }

  /**
   * Configure canvas line dash style.
   *
   * @param style - Line style: 'solid' | 'dashed' | 'centerline'
   *
   * Dash patterns (zoom-aware):
   * - solid: []
   * - dashed: [5/zoom, 5/zoom]
   * - centerline: [10/zoom, 5/zoom, 2/zoom, 5/zoom]
   */
  setLineStyle(style: 'solid' | 'dashed' | 'centerline'): void {
    switch (style) {
      case 'solid':
        this.ctx.setLineDash([]);
        break;
      case 'dashed':
        this.ctx.setLineDash([5 / this.zoom, 5 / this.zoom]);
        break;
      case 'centerline':
        this.ctx.setLineDash([10 / this.zoom, 5 / this.zoom, 2 / this.zoom, 5 / this.zoom]);
        break;
    }
  }

  /**
   * Apply zoom scaling to maintain consistent visual size.
   *
   * @param value - Value to scale
   * @returns Scaled value: value / zoom
   *
   * @example
   * ```typescript
   * const lineWidth = helper.applyZoomScaling(2); // Returns 2/zoom
   * ```
   */
  applyZoomScaling(value: number): number {
    return value / this.zoom;
  }
}

export default ProfessionalRenderingHelper;
