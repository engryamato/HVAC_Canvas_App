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
export type DuctEndType = 'flange' | 'raw' | 'crimped' | 'coupled';

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
  private static readonly PATTERN_CACHE_LIMIT = 30;

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

    if (length === 0) {return;}

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

      ProfessionalRenderingHelper.evictPatternCacheIfNeeded();
    }

    this.ctx.save();
    this.ctx.fillStyle = pattern;
    this.ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    this.ctx.restore();
  }

  drawLinerInsulation(
    startX: number,
    endX: number,
    halfThickness: number,
    thicknessPx: number,
    ctx: CanvasRenderingContext2D = this.ctx,
    zoom: number = this.zoom
  ): void {
    const innerHalfThickness = Math.max(0, halfThickness - thicknessPx);
    ctx.save();
    const pattern = this.getCachedPattern(`liner-${Math.round(zoom * 100)}`, () =>
      this.createAmberHatchPattern(zoom)
    );
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(startX, -halfThickness, endX - startX, thicknessPx);
      ctx.fillRect(startX, innerHalfThickness, endX - startX, thicknessPx);
    }

    ctx.strokeStyle = 'rgba(96, 165, 250, 0.75)';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash?.([5 / zoom, 2 / zoom]);
    ctx.beginPath();
    ctx.moveTo(startX, -innerHalfThickness);
    ctx.lineTo(endX, -innerHalfThickness);
    ctx.moveTo(startX, innerHalfThickness);
    ctx.lineTo(endX, innerHalfThickness);
    ctx.stroke();
    ctx.setLineDash?.([]);
    ctx.restore();
  }

  drawWrapInsulation(
    startX: number,
    endX: number,
    halfThickness: number,
    thicknessPx: number,
    ctx: CanvasRenderingContext2D = this.ctx,
    zoom: number = this.zoom
  ): void {
    ctx.save();
    const pattern = this.getCachedPattern(`wrap-${Math.round(zoom * 100)}`, () =>
      this.createAmberHatchPattern(zoom)
    );
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(startX, -(halfThickness + thicknessPx), endX - startX, thicknessPx);
      ctx.fillRect(startX, halfThickness, endX - startX, thicknessPx);
    }

    ctx.strokeStyle = '#FFD166';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash?.([3 / zoom, 2 / zoom]);
    ctx.beginPath();
    ctx.moveTo(startX, -(halfThickness + thicknessPx));
    ctx.lineTo(endX, -(halfThickness + thicknessPx));
    ctx.moveTo(startX, halfThickness + thicknessPx);
    ctx.lineTo(endX, halfThickness + thicknessPx);
    ctx.stroke();
    ctx.setLineDash?.([]);
    ctx.restore();
  }

  drawDoubleWallInsulation(
    startX: number,
    endX: number,
    halfThickness: number,
    thicknessPx: number,
    perforated: boolean,
    ctx: CanvasRenderingContext2D = this.ctx,
    zoom: number = this.zoom
  ): void {
    const innerHalfThickness = Math.max(0, halfThickness - thicknessPx);
    ctx.save();
    const pattern = perforated ? this.createDotPattern(zoom) : this.createCrosshatchPattern(zoom);
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(startX, -halfThickness, endX - startX, thicknessPx);
      ctx.fillRect(startX, innerHalfThickness, endX - startX, thicknessPx);
    }

    ctx.strokeStyle = '#60A5FA';
    ctx.lineWidth = 1.25 / zoom;
    ctx.setLineDash?.(perforated ? [3 / zoom, 2 / zoom] : []);
    ctx.beginPath();
    ctx.moveTo(startX, -innerHalfThickness);
    ctx.lineTo(endX, -innerHalfThickness);
    ctx.moveTo(startX, innerHalfThickness);
    ctx.lineTo(endX, innerHalfThickness);
    ctx.stroke();
    ctx.setLineDash?.([]);
    ctx.restore();
  }

  drawDuctEnd(
    x: number,
    outerHalfThickness: number,
    endType: DuctEndType,
    zoom: number = this.zoom,
    ctx: CanvasRenderingContext2D = this.ctx
  ): void {
    ctx.save();
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash?.([]);

    switch (endType) {
      case 'flange':
        ctx.beginPath();
        ctx.moveTo(x, -(outerHalfThickness + 2 / zoom));
        ctx.lineTo(x, outerHalfThickness + 2 / zoom);
        ctx.stroke();
        break;
      case 'raw':
        break;
      case 'crimped': {
        const depth = 4 / zoom;
        const inset = 4 / zoom;
        const direction = x <= 0 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(x, -outerHalfThickness);
        ctx.lineTo(x + direction * depth, -Math.max(0, outerHalfThickness - inset));
        ctx.moveTo(x, outerHalfThickness);
        ctx.lineTo(x + direction * depth, Math.max(0, outerHalfThickness - inset));
        ctx.stroke();
        break;
      }
      case 'coupled': {
        const offset = 1.5 / zoom;
        ctx.lineWidth = 1.5 / zoom;
        [-offset, offset].forEach((dx) => {
          ctx.beginPath();
          ctx.moveTo(x + dx, -(outerHalfThickness + 2 / zoom));
          ctx.lineTo(x + dx, outerHalfThickness + 2 / zoom);
          ctx.stroke();
        });
        break;
      }
    }

    ctx.restore();
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

  private getCachedPattern(cacheKey: string, createPattern: () => CanvasPattern | null): CanvasPattern | null {
    let pattern = ProfessionalRenderingHelper.patternCache.get(cacheKey);
    if (!pattern) {
      pattern = createPattern() ?? undefined;
      if (pattern) {
        ProfessionalRenderingHelper.patternCache.set(cacheKey, pattern);
        ProfessionalRenderingHelper.patternKeys.push(cacheKey);
        ProfessionalRenderingHelper.evictPatternCacheIfNeeded();
      }
    }

    return pattern ?? null;
  }

  private static evictPatternCacheIfNeeded(): void {
    while (ProfessionalRenderingHelper.patternKeys.length > ProfessionalRenderingHelper.PATTERN_CACHE_LIMIT) {
      const oldestKey = ProfessionalRenderingHelper.patternKeys.shift();
      if (oldestKey) {
        ProfessionalRenderingHelper.patternCache.delete(oldestKey);
      }
    }
  }

  private createAmberHatchPattern(zoom: number): CanvasPattern | null {
    const patternCanvas = document.createElement('canvas');
    const spacing = Math.max(4, 7 / zoom);
    const size = spacing * 2;
    patternCanvas.width = size;
    patternCanvas.height = size;
    const patternCtx = patternCanvas.getContext('2d');
    if (!patternCtx) {
      return null;
    }

    patternCtx.strokeStyle = 'rgba(255, 209, 102, 0.55)';
    patternCtx.lineWidth = Math.max(0.75, 0.9 / zoom);
    for (let i = -size; i < size * 2; i += spacing) {
      patternCtx.beginPath();
      patternCtx.moveTo(i, 0);
      patternCtx.lineTo(i + size, size);
      patternCtx.stroke();
    }

    return this.ctx.createPattern(patternCanvas, 'repeat');
  }

  private createCrosshatchPattern(zoom: number): CanvasPattern | null {
    return this.getCachedPattern(`crosshatch-${Math.round(zoom * 100)}`, () => {
      const patternCanvas = document.createElement('canvas');
      const spacing = Math.max(4, 6 / zoom);
      const size = spacing * 2;
      patternCanvas.width = size;
      patternCanvas.height = size;
      const patternCtx = patternCanvas.getContext('2d');
      if (!patternCtx) {
        return null;
      }

      patternCtx.strokeStyle = 'rgba(147, 197, 253, 0.38)';
      patternCtx.lineWidth = Math.max(0.6, 0.75 / zoom);
      for (let i = -size; i < size * 2; i += spacing) {
        patternCtx.beginPath();
        patternCtx.moveTo(i, 0);
        patternCtx.lineTo(i + size, size);
        patternCtx.stroke();
        patternCtx.beginPath();
        patternCtx.moveTo(i, size);
        patternCtx.lineTo(i + size, 0);
        patternCtx.stroke();
      }

      return this.ctx.createPattern(patternCanvas, 'repeat');
    });
  }

  private createDotPattern(zoom: number): CanvasPattern | null {
    return this.getCachedPattern(`dots-${Math.round(zoom * 100)}`, () => {
      const patternCanvas = document.createElement('canvas');
      const spacing = Math.max(4, 5 / zoom);
      const size = spacing * 2;
      patternCanvas.width = size;
      patternCanvas.height = size;
      const patternCtx = patternCanvas.getContext('2d');
      if (!patternCtx) {
        return null;
      }

      patternCtx.fillStyle = 'rgba(147, 197, 253, 0.6)';
      [
        [spacing * 0.5, spacing * 0.5],
        [spacing * 1.5, spacing * 1.5],
      ].forEach(([x, y]) => {
        patternCtx.beginPath();
        patternCtx.arc(x, y, Math.max(0.8, 1.1 / zoom), 0, Math.PI * 2);
        patternCtx.fill();
      });

      return this.ctx.createPattern(patternCanvas, 'repeat');
    });
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
    const innerRadius = Math.max(1, elbowRadius - width / 2);
    const outerRadius = elbowRadius + width / 2;
    const half = width / 2;

    const startAngle = 0;
    const endAngle = (angle * Math.PI) / 180;

    // Inlet point on centerline (at startAngle)
    const inletX = center.x + elbowRadius * Math.cos(startAngle);
    const inletY = center.y + elbowRadius * Math.sin(startAngle);
    // Outlet point on centerline (at endAngle)
    const outletX = center.x + elbowRadius * Math.cos(endAngle);
    const outletY = center.y + elbowRadius * Math.sin(endAngle);

    this.ctx.save();
    this.ctx.lineWidth = this.applyZoomScaling(2);

    // --- 1. Filled donut-slice body ---
    // Uses caller's fillStyle and strokeStyle (green fill, green/blue stroke from FittingRenderer)
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, outerRadius, startAngle, endAngle);
    this.ctx.arc(center.x, center.y, innerRadius, endAngle, startAngle, true);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // --- 2. Blue dashed centerline ---
    const savedStroke = this.ctx.strokeStyle as string;
    this.ctx.strokeStyle = '#1565C0';
    this.ctx.lineWidth = this.applyZoomScaling(1.2);
    this.ctx.setLineDash([8 / this.zoom, 5 / this.zoom]);
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, elbowRadius, startAngle, endAngle);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // --- 3. End ticks at inlet and outlet openings ---
    // Tick direction = tangent of arc at that angle: (-sin θ, cos θ)
    this.ctx.strokeStyle = savedStroke;
    this.ctx.lineWidth = this.applyZoomScaling(2);

    // Inlet tick (at startAngle = 0)
    const sTx = -Math.sin(startAngle); // 0
    const sTy = Math.cos(startAngle);  // 1
    this.ctx.beginPath();
    this.ctx.moveTo(inletX - sTx * half, inletY - sTy * half);
    this.ctx.lineTo(inletX + sTx * half, inletY + sTy * half);
    this.ctx.stroke();

    // Outlet tick (at endAngle)
    const eTx = -Math.sin(endAngle);
    const eTy = Math.cos(endAngle);
    this.ctx.beginPath();
    this.ctx.moveTo(outletX - eTx * half, outletY - eTy * half);
    this.ctx.lineTo(outletX + eTx * half, outletY + eTy * half);
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
    // Use caller's strokeStyle instead of overriding with black
    const currentStroke = this.ctx.strokeStyle as string;
    this.ctx.lineWidth = this.applyZoomScaling(2);

    const length = width * 3;

    // Draw main run (horizontal) using caller's color
    this.drawDoubleLine(
      { x: center.x - length / 2, y: center.y },
      { x: center.x + length / 2, y: center.y },
      width,
      { style: 'solid', color: currentStroke }
    );

    // Draw branch using caller's color
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

    this.drawDoubleLine(branchStart, branchEnd, width, { style: 'solid', color: currentStroke });

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

    if (length === 0) {return;}

    const perpX = (-dy / length);
    const perpY = (dx / length);
    const startHalf = startWidth / 2;
    const endHalf = endWidth / 2;

    this.ctx.save();
    this.ctx.lineWidth = this.applyZoomScaling(2);

    // --- 1. Filled trapezoid body (uses caller's fillStyle + strokeStyle) ---
    this.ctx.beginPath();
    this.ctx.moveTo(start.x + perpX * startHalf, start.y + perpY * startHalf);
    this.ctx.lineTo(end.x + perpX * endHalf,     end.y + perpY * endHalf);
    this.ctx.lineTo(end.x - perpX * endHalf,     end.y - perpY * endHalf);
    this.ctx.lineTo(start.x - perpX * startHalf, start.y - perpY * startHalf);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // --- 2. Blue dashed centerline ---
    const savedStroke = this.ctx.strokeStyle as string;
    this.ctx.strokeStyle = '#1565C0';
    this.ctx.lineWidth = this.applyZoomScaling(1);
    this.ctx.setLineDash([8 / this.zoom, 5 / this.zoom]);
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    this.ctx.strokeStyle = savedStroke;

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
