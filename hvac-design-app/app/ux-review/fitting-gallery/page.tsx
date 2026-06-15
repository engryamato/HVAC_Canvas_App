'use client';

/**
 * Fitting rendering gallery (ductwork wrap-up QA page).
 *
 * Renders every fitting family at multiple branch/turn angles — including
 * reversed (>90°, leaning back toward the inlet) — for both round and
 * rectangular profiles, with stub duct walls drawn into each opening so the
 * seamless wall continuation and transverse joint lines can be verified
 * visually. Open at /ux-review/fitting-gallery.
 */

import { useEffect, useRef } from 'react';
import type { Fitting } from '@/core/schema';
import type { FittingType } from '@/core/schema/fitting.schema';
import { renderFitting } from '@/features/canvas/renderers';
import { buildFittingGeometry } from '@/features/canvas/services/connectionPoints';

interface GalleryCase {
  label: string;
  fitting: Fitting;
}

function makeFitting(
  fittingType: FittingType,
  options: {
    angle?: number;
    shape?: 'round' | 'rectangular';
    fromSize?: number;
    toSize?: number;
    variant?: Fitting['props']['variant'];
  } = {}
): Fitting {
  const shape = options.shape ?? 'round';
  const fromSize = options.fromSize ?? 14;
  const toSize = options.toSize ?? (fittingType === 'tee' || fittingType === 'wye' || fittingType === 'takeoff' ? 8 : 10);
  return {
    id: `gallery-${fittingType}-${options.angle ?? 'na'}-${shape}`,
    type: 'fitting',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt: '2026-01-01T00:00:00.000Z',
    props: {
      engineeringSystem: 'standard_duct',
      fittingType,
      manualOverride: false,
      angle: options.angle,
      variant: options.variant,
      transitionData: {
        fromShape: shape,
        toShape: shape,
        ...(shape === 'round'
          ? { fromDiameter: fromSize, toDiameter: toSize }
          : { fromWidth: fromSize, fromHeight: fromSize * 0.7, toWidth: toSize, toHeight: toSize * 0.7 }),
      },
    },
    calculated: { equivalentLength: 0, pressureLoss: 0 },
  } as Fitting;
}

function buildCases(): GalleryCase[] {
  const cases: GalleryCase[] = [];
  const shapes: Array<'round' | 'rectangular'> = ['round', 'rectangular'];

  for (const shape of shapes) {
    const tag = shape === 'round' ? 'RND' : 'RECT';

    for (const angle of [45, 90, 135]) {
      cases.push({ label: `Elbow ${angle}° ${tag}`, fitting: makeFitting(angle <= 60 ? 'elbow_45' : 'elbow_90', { angle, shape }) });
    }
    cases.push({
      label: `Elbow mitered ${tag}`,
      fitting: makeFitting('elbow_mitered', { angle: 90, shape, variant: { elbowType: 'mitered', vaneType: 'single_wall' } }),
    });

    for (const angle of [60, 90, 120, 150]) {
      cases.push({ label: `Tee ${angle}°${angle > 90 ? ' (reversed)' : ''} ${tag}`, fitting: makeFitting('tee', { angle, shape }) });
    }
    for (const angle of [30, 45, 135, 150]) {
      cases.push({ label: `Wye ${angle}°${angle > 90 ? ' (reversed)' : ''} ${tag}`, fitting: makeFitting('wye', { angle, shape }) });
    }
    cases.push({
      label: `Tee 60° branch-left ${tag}`,
      fitting: makeFitting('tee', { angle: 60, shape, variant: { branchSide: 'left' } }),
    });

    cases.push({ label: `Reducer ${tag}`, fitting: makeFitting('reducer', { shape }) });
    cases.push({
      label: `Reducer eccentric ${tag}`,
      fitting: makeFitting('reducer_eccentric', { shape, variant: { eccentricOffset: 'top' } }),
    });
    cases.push({ label: `End cap ${tag}`, fitting: makeFitting('cap', { shape }) });

    for (const angle of [60, 90, 120]) {
      cases.push({
        label: `Takeoff ${angle}°${angle > 90 ? ' (reversed)' : ''} ${tag}`,
        fitting: makeFitting('takeoff', { angle, shape, variant: { takeoffType: 'straight_tap', hasDamper: angle === 90 } }),
      });
    }
  }

  cases.push({ label: 'Rect → round transition', fitting: makeFitting('transition_square_to_round', { shape: 'rectangular' }) });
  cases.push({ label: 'S-offset boot', fitting: makeFitting('end_boot', {}) });

  return cases;
}

/** Stub duct walls drawn into each opening to verify seamless continuation. */
function drawDuctStubs(ctx: CanvasRenderingContext2D, fitting: Fitting, zoom: number): void {
  const geometry = buildFittingGeometry(fitting);
  ctx.save();
  ctx.strokeStyle = '#424242';
  ctx.lineWidth = 2 / zoom;
  for (const opening of geometry.openings) {
    const { position: o, direction: d, profile } = opening;
    const half =
      (profile.shape === 'round'
        ? profile.diameter ?? 12
        : profile.height ?? profile.width ?? 12) / 2;
    const px = -d.y;
    const py = d.x;
    const len = 26;
    ctx.beginPath();
    ctx.moveTo(o.x + px * half, o.y + py * half);
    ctx.lineTo(o.x + px * half + d.x * len, o.y + py * half + d.y * len);
    ctx.moveTo(o.x - px * half, o.y - py * half);
    ctx.lineTo(o.x - px * half + d.x * len, o.y - py * half + d.y * len);
    ctx.stroke();
  }
  ctx.restore();
}

function GalleryCard({ label, fitting }: GalleryCase): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const size = 230;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const geometry = buildFittingGeometry(fitting);
    const pad = 30; // room for duct stubs
    const b = geometry.maskBounds;
    const zoom = Math.min(
      (size - pad * 2) / Math.max(b.width, 1),
      (size - pad * 2) / Math.max(b.height, 1),
      4
    );

    ctx.save();
    ctx.translate(size / 2 - (b.x + b.width / 2) * zoom, size / 2 - (b.y + b.height / 2) * zoom);
    ctx.scale(zoom, zoom);

    drawDuctStubs(ctx, fitting, zoom);
    renderFitting(fitting, {
      ctx,
      zoom,
      isSelected: false,
      isHovered: false,
      backgroundColor: '#ffffff',
    });
    ctx.restore();
  }, [fitting]);

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 8, background: '#fff' }}>
      <canvas ref={canvasRef} style={{ width: 230, height: 230, display: 'block' }} />
      <div style={{ fontSize: 12, color: '#424242', textAlign: 'center', marginTop: 4, fontFamily: 'monospace' }}>
        {label}
      </div>
    </div>
  );
}

export default function FittingGalleryPage(): JSX.Element {
  const cases = buildCases();
  return (
    <main style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 18, fontFamily: 'monospace', marginBottom: 4 }}>Fitting rendering gallery</h1>
      <p style={{ fontSize: 13, color: '#616161', marginBottom: 16 }}>
        SMACNA plan-style bodies with duct stubs at every opening. Reversed cases (&gt;90°) lean back toward the
        inlet — branch must follow the stub, joint lines must sit on the seams.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
        {cases.map((c) => (
          <GalleryCard key={c.label} {...c} />
        ))}
      </div>
    </main>
  );
}
