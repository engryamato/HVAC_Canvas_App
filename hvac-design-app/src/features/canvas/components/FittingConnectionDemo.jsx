/**
 * FittingConnectionDemo.jsx
 *
 * Visual demonstration of the two-connection magnetic snap system for fittings.
 * Sample: Supply transition/reducer — Inlet 12"Ø → Outlet 14"Ø
 *
 * Illustrates:
 *  • Each fitting type has named connection points (inlet, outlet, branch)
 *  • Connection points are defined in local fitting space and transformed to world space
 *  • Magnetic snap activates when a duct endpoint enters the snap tolerance radius
 *  • Rotation is derived from the connected duct's angle
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Constants (match the app's coordinate system: 1 pixel = 1 inch)
// ---------------------------------------------------------------------------
const ZOOM = 3.8;           // display scale
const CX   = 360;           // canvas centre X
const CY   = 195;           // canvas centre Y
const SNAP_TOLERANCE = 18;  // world inches — matches MagneticConnectionService

// World-space → canvas-space helpers
const wx = (x) => CX + x * ZOOM;
const wy = (y) => CY + y * ZOOM;
const ws = (s) => s * ZOOM;

// ---------------------------------------------------------------------------
// Connection-point definitions (local fitting space, matches FittingRenderer)
// ---------------------------------------------------------------------------
// reducer:  drawReducer({ x: -28, y:0 }, { x: 28, y:0 }, inletSize, outletSize)
// The end-ticks live exactly at x = ±28, y = 0.
const CONNECTIONS = [
  {
    role:         'inlet',
    localX:       -28,
    localY:       0,
    ductDiameter: 12,         // inches (round duct on inlet side)
    label:        'INLET',
    color:        '#1565C0',  // supply blue
    snapColor:    '#2196F3',
    labelOffset:  { x: -2, y: -30 },
  },
  {
    role:         'outlet',
    localX:       28,
    localY:       0,
    ductDiameter: 14,         // inches (expanded outlet)
    label:        'OUTLET',
    color:        '#2E7D32',  // green
    snapColor:    '#43A047',
    labelOffset:  { x: 2, y: -30 },
  },
];

// Supply system colour palette
const SUPPLY = {
  ductStroke:    '#1565C0',
  ductFill:      'rgba(25, 118, 210, 0.07)',
  fittingStroke: '#1565C0',
  fittingFill:   'rgba(232, 240, 253, 0.88)',
  arrow:         '#1976D2',
  text:          '#0D47A1',
};

// ---------------------------------------------------------------------------
// Drawing helpers (mirror the app's ProfessionalRenderingHelper / DuctRenderer)
// ---------------------------------------------------------------------------

function drawGrid(ctx, w, h) {
  const step = ws(12); // 12-inch grid
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
  for (let y = 0; y < h; y += step) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
  ctx.restore();
}

/** Draw a horizontal round duct stub in world space */
function drawDuctStub(ctx, worldX1, worldX2, diameter) {
  const half = ws(diameter / 2);
  const x1 = wx(worldX1);
  const x2 = wx(worldX2);
  const y  = wy(0);

  ctx.save();

  // Fill band
  ctx.fillStyle = SUPPLY.ductFill;
  ctx.fillRect(Math.min(x1, x2), y - half, Math.abs(x2 - x1), half * 2);

  // Double walls
  ctx.strokeStyle = SUPPLY.ductStroke;
  ctx.lineWidth = 1.5;

  // Top wall
  ctx.beginPath(); ctx.moveTo(x1, y - half); ctx.lineTo(x2, y - half); ctx.stroke();
  // Bottom wall
  ctx.beginPath(); ctx.moveTo(x1, y + half); ctx.lineTo(x2, y + half); ctx.stroke();

  // Centerline (round ducts get a centre dash)
  ctx.setLineDash([ws(8), ws(4), ws(1.5), ws(4)]);
  ctx.strokeStyle = SUPPLY.ductStroke;
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.55;
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // Flange at the outer end only
  const flangeEnd = worldX1 < 0 ? x1 : x2;
  ctx.lineWidth = 2;
  ctx.strokeStyle = SUPPLY.ductStroke;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.moveTo(flangeEnd, y - half - ws(1.5));
  ctx.lineTo(flangeEnd, y + half + ws(1.5));
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.restore();
}

/** Draw the reducer/transition fitting in local space (centred at origin) */
function drawTransitionFitting(ctx, inletSize, outletSize, isAnySnapped) {
  const inletHalf  = ws(inletSize / 2);
  const outletHalf = ws(outletSize / 2);
  const x1 = wx(-28);
  const x2 = wx(28);
  const y  = wy(0);

  ctx.save();

  // ── Fill between the four corners ──────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(x1, y - inletHalf);
  ctx.lineTo(x2, y - outletHalf);
  ctx.lineTo(x2, y + outletHalf);
  ctx.lineTo(x1, y + inletHalf);
  ctx.closePath();
  ctx.fillStyle = SUPPLY.fittingFill;
  ctx.fill();

  ctx.strokeStyle = isAnySnapped ? '#1565C0' : SUPPLY.fittingStroke;
  ctx.lineWidth   = isAnySnapped ? 2.5 : 2;

  // Top taper line
  ctx.beginPath();
  ctx.moveTo(x1, y - inletHalf);
  ctx.lineTo(x2, y - outletHalf);
  ctx.stroke();

  // Bottom taper line
  ctx.beginPath();
  ctx.moveTo(x1, y + inletHalf);
  ctx.lineTo(x2, y + outletHalf);
  ctx.stroke();

  // Inlet end-tick
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x1, y - inletHalf  - ws(1.5));
  ctx.lineTo(x1, y + inletHalf  + ws(1.5));
  ctx.stroke();

  // Outlet end-tick
  ctx.beginPath();
  ctx.moveTo(x2, y - outletHalf - ws(1.5));
  ctx.lineTo(x2, y + outletHalf + ws(1.5));
  ctx.stroke();

  ctx.restore();
}

/** Airflow direction arrow */
function drawAirflowArrow(ctx) {
  const arrowX = wx(10);
  const y      = wy(0);
  const sz     = ws(4);

  ctx.save();
  ctx.fillStyle = SUPPLY.arrow;
  ctx.beginPath();
  ctx.moveTo(arrowX,        y);
  ctx.lineTo(arrowX - sz,   y - sz * 0.55);
  ctx.lineTo(arrowX - sz,   y + sz * 0.55);
  ctx.closePath();
  ctx.fill();

  ctx.font      = `bold ${ws(3.2)}px system-ui, sans-serif`;
  ctx.fillStyle = SUPPLY.text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('SUPPLY →', arrowX + ws(1.5), y);
  ctx.restore();
}

/**
 * Draw a magnetic connection point indicator.
 * @param {Object} conn   - connection definition
 * @param {boolean} hovered  - mouse is near this connection
 * @param {boolean} snapped  - a duct endpoint is within snap tolerance
 * @param {number}  pulse    - animation value [0,1] for the pulse ring
 */
function drawConnectionPoint(ctx, conn, hovered, snapped, pulse) {
  const cx = wx(conn.localX);
  const cy = wy(conn.localY);

  ctx.save();

  // ── Snap tolerance ring (dashed) ─────────────────────────────────────
  const tolerancePx = ws(SNAP_TOLERANCE);
  ctx.setLineDash([ws(4), ws(4)]);
  ctx.strokeStyle = snapped
    ? conn.snapColor
    : hovered
      ? conn.color
      : 'rgba(0,0,0,0.15)';
  ctx.lineWidth  = snapped ? 1.8 : 1;
  ctx.globalAlpha = snapped ? 0.85 : hovered ? 0.6 : 0.35;
  ctx.beginPath();
  ctx.arc(cx, cy, tolerancePx, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // ── Pulsing snap-active ring ─────────────────────────────────────────
  if (snapped || hovered) {
    const pulseRadius = ws(SNAP_TOLERANCE * 0.42) + ws(4) * Math.sin(pulse * Math.PI * 2);
    ctx.strokeStyle = conn.snapColor;
    ctx.lineWidth   = 2;
    ctx.globalAlpha = 0.55 + 0.25 * Math.sin(pulse * Math.PI * 2);
    ctx.beginPath();
    ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ── Connection point dot ─────────────────────────────────────────────
  const dotR = snapped ? ws(3.2) : hovered ? ws(2.8) : ws(2.2);

  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(cx, cy, dotR + ws(0.8), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = snapped ? conn.snapColor : conn.color;
  ctx.beginPath();
  ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
  ctx.fill();

  // Inner white dot
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(cx, cy, dotR * 0.42, 0, Math.PI * 2);
  ctx.fill();

  // ── Role badge ───────────────────────────────────────────────────────
  const badgeX  = cx + conn.labelOffset.x * ZOOM;
  const badgeY  = cy + conn.labelOffset.y;
  const fontSize = 10;
  ctx.font      = `700 ${fontSize}px system-ui, monospace`;
  const textW   = ctx.measureText(conn.label).width;
  const padX    = 6;
  const padY    = 4;
  const bW      = textW + padX * 2;
  const bH      = fontSize + padY * 2;

  // Badge background
  ctx.fillStyle = snapped || hovered ? conn.color : `${conn.color}CC`;
  roundRect(ctx, badgeX - bW / 2, badgeY - bH / 2, bW, bH, 4);
  ctx.fill();

  // Badge text
  ctx.fillStyle   = 'white';
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(conn.label, badgeX, badgeY);

  // ── Size sub-label ───────────────────────────────────────────────────
  ctx.font      = `500 10px system-ui, sans-serif`;
  ctx.fillStyle = snapped || hovered ? conn.color : '#555';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${conn.ductDiameter}"Ø`, badgeX, badgeY + bH / 2 + 4);

  ctx.restore();
}

/** Draw the hovering "duct endpoint" cursor that demonstrates the snap */
function drawDuctEndpointCursor(ctx, worldX, worldY, nearestConn) {
  const cx = wx(worldX);
  const cy = wy(worldY);

  ctx.save();

  // Outer ring
  ctx.strokeStyle = nearestConn ? nearestConn.snapColor : '#424242';
  ctx.lineWidth   = nearestConn ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, ws(3.8), 0, Math.PI * 2);
  ctx.stroke();

  // Inner dot
  ctx.fillStyle = nearestConn ? nearestConn.snapColor : '#424242';
  ctx.beginPath();
  ctx.arc(cx, cy, ws(1.5), 0, Math.PI * 2);
  ctx.fill();

  // "Duct end" stub line
  const stubLen = ws(10);
  ctx.strokeStyle = nearestConn ? nearestConn.snapColor : '#616161';
  ctx.lineWidth   = ws(1.5);
  ctx.setLineDash([ws(3), ws(3)]);
  ctx.beginPath();
  ctx.moveTo(cx - stubLen, cy);
  ctx.lineTo(cx, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  if (nearestConn) {
    // "SNAP" label
    ctx.font      = 'bold 9px system-ui, monospace';
    ctx.fillStyle = nearestConn.snapColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('[SNAP]', cx, cy - ws(5));
  }

  ctx.restore();
}

/** Draw info panel in the bottom-left */
function drawInfoPanel(ctx, canvasW, canvasH, snappedRoles) {
  ctx.save();

  const panelW  = 195;
  const panelH  = 92;
  const panelX  = 12;
  const panelY  = canvasH - panelH - 12;

  ctx.fillStyle   = 'rgba(255,255,255,0.92)';
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth   = 1;
  roundRect(ctx, panelX, panelY, panelW, panelH, 7);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle    = '#222';
  ctx.font         = 'bold 11px system-ui, sans-serif';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Supply Transition', panelX + 10, panelY + 10);

  ctx.fillStyle = '#555';
  ctx.font      = '10px system-ui, sans-serif';
  ctx.fillText('12"Ø Round  →  14"Ø Round', panelX + 10, panelY + 26);

  const rows = [
    { label: 'INLET',  desc: '12"Ø  ·  connection[0]', color: '#1565C0', snapped: snappedRoles.includes('inlet') },
    { label: 'OUTLET', desc: '14"Ø  ·  connection[1]', color: '#2E7D32', snapped: snappedRoles.includes('outlet') },
  ];

  rows.forEach(({ label, desc, color, snapped }, i) => {
    const rowY = panelY + 44 + i * 22;

    // Colour dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(panelX + 17, rowY + 6, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#222';
    ctx.font      = 'bold 10px system-ui, monospace';
    ctx.fillText(label, panelX + 27, rowY);

    ctx.fillStyle = '#666';
    ctx.font      = '9px system-ui, sans-serif';
    ctx.fillText(desc, panelX + 65, rowY + 1);

    if (snapped) {
      ctx.fillStyle = color;
      ctx.font      = 'bold 9px system-ui, sans-serif';
      ctx.fillText('● SNAPPED', panelX + 140, rowY);
    }
  });

  ctx.restore();
}

/** Draw title header */
function drawHeader(ctx, canvasW) {
  ctx.save();

  ctx.fillStyle    = '#1565C0';
  ctx.font         = 'bold 12px system-ui, sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(
    'Fitting: Two-Connection Magnetic Snap  ·  Supply System',
    canvasW / 2,
    9
  );

  ctx.fillStyle = '#888';
  ctx.font      = '10px system-ui, sans-serif';
  ctx.fillText('Move mouse near INLET or OUTLET to see magnetic snap', canvasW / 2, 24);

  ctx.restore();
}

/** Polyfill-style roundRect on ctx */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ---------------------------------------------------------------------------
// Main React component
// ---------------------------------------------------------------------------
export default function FittingConnectionDemo() {
  const canvasRef  = useRef(null);

  // Mouse position in world space (inches)
  const [cursorWorld, setCursorWorld] = useState({ x: 55, y: 8 });
  const [pulse,       setPulse]       = useState(0);

  // Compute which connection the cursor is near (if any)
  const nearestConnection = (() => {
    for (const conn of CONNECTIONS) {
      const dx = cursorWorld.x - conn.localX;
      const dy = cursorWorld.y - conn.localY;
      if (Math.hypot(dx, dy) <= SNAP_TOLERANCE) {
        return conn;
      }
    }
    return null;
  })();

  // Animate the pulse
  useEffect(() => {
    let raf;
    let t = 0;
    const loop = () => {
      t += 0.018;
      setPulse(t % 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {return;}
    const ctx = canvas.getContext('2d');

    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // ── Background ────────────────────────────────────────────────────
    ctx.fillStyle = '#F3F6FB';
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, W, H);

    // ── Duct stubs ────────────────────────────────────────────────────
    // Left stub: 12"Ø, world x from -90 to the inlet connection at -28
    drawDuctStub(ctx, -90, -28, 12);
    // Right stub: 14"Ø, world x from outlet connection at +28 to +90
    drawDuctStub(ctx, 28,  90,  14);

    // ── Transition fitting ────────────────────────────────────────────
    drawTransitionFitting(ctx, 12, 14, nearestConnection !== null);

    // ── Airflow arrow ─────────────────────────────────────────────────
    drawAirflowArrow(ctx);

    // ── Connection points ─────────────────────────────────────────────
    for (const conn of CONNECTIONS) {
      const hovered = conn === nearestConnection;
      const snapped = hovered; // In the demo, hover = snapped for clarity
      drawConnectionPoint(ctx, conn, hovered, snapped, pulse);
    }

    // ── Moving duct-endpoint cursor ───────────────────────────────────
    drawDuctEndpointCursor(ctx, cursorWorld.x, cursorWorld.y, nearestConnection);

    // ── UI overlays ───────────────────────────────────────────────────
    drawInfoPanel(ctx, W, H, nearestConnection ? [nearestConnection.role] : []);
    drawHeader(ctx, W);

  }, [cursorWorld, nearestConnection, pulse]);

  // Canvas mouse → world coordinates
  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) * (canvasRef.current.width  / rect.width);
    const canvasY = (e.clientY - rect.top)  * (canvasRef.current.height / rect.height);
    setCursorWorld({
      x: (canvasX - CX) / ZOOM,
      y: (canvasY - CY) / ZOOM,
    });
  }, []);

  // Animated "duct endpoint" moves along a path when mouse is outside canvas
  const handleMouseLeave = useCallback(() => {
    // Smoothly park the cursor near the inlet for a nice default state
    setCursorWorld({ x: -28 + SNAP_TOLERANCE * 0.4, y: 5 });
  }, []);

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      gap:            '16px',
      padding:        '20px',
      background:     '#EEF2F8',
      borderRadius:   '12px',
      fontFamily:     'system-ui, sans-serif',
      userSelect:     'none',
    }}>

      {/* ── Canvas ─────────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        width={720}
        height={390}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          borderRadius: '8px',
          boxShadow:    '0 2px 12px rgba(0,0,0,0.12)',
          cursor:       'crosshair',
          maxWidth:     '100%',
        }}
      />

      {/* ── Connection schema reference ─────────────────────────── */}
      <div style={{
        width:          '100%',
        maxWidth:       720,
        background:     'white',
        borderRadius:   '8px',
        padding:        '16px 20px',
        boxShadow:      '0 1px 6px rgba(0,0,0,0.08)',
      }}>
        <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 12, color: '#1565C0' }}>
          CONNECTION POINT CONFIG (per fitting type)
        </p>

        <pre style={{
          margin:     0,
          fontSize:   11,
          lineHeight: 1.65,
          color:      '#1a1a2e',
          background: '#F3F6FB',
          padding:    '12px 16px',
          borderRadius: 6,
          overflowX:  'auto',
        }}>{`// src/features/canvas/tools/FittingTool.ts

/** Connection points in local fitting space (1 unit = 1 inch) */
const FITTING_CONNECTION_OFFSETS = {

  reducer: [
    { role: 'inlet',   localX: -28, localY: 0 },  // ← inlet  12"Ø
    { role: 'outlet',  localX:  28, localY: 0 },  // → outlet 14"Ø
  ],

  tee: [
    { role: 'inlet',   localX: -32, localY:   0 },
    { role: 'outlet',  localX:  52, localY:   0 },
    { role: 'branch',  localX:  10, localY: -32 },
  ],

  elbow_90: [
    { role: 'inlet',   localX:   0, localY:  20 },
    { role: 'outlet',  localX: -20, localY:   0 },
  ],

  elbow_45: [
    { role: 'inlet',   localX: -20, localY:   0 },
    { role: 'outlet',  localX:  14, localY: -14 },
  ],

  // …one entry per FittingType in fitting.schema.ts
};

/**
 * Transform a connection point from local → world space.
 * Uses the same matrix as CanvasContainer's ctx.translate/rotate.
 */
function getWorldConnectionPoints(fitting) {
  const rad    = (fitting.transform.rotation * Math.PI) / 180;
  const { x: fx, y: fy } = fitting.transform;

  return FITTING_CONNECTION_OFFSETS[fitting.props.fittingType].map(pt => ({
    role:   pt.role,
    worldX: fx + pt.localX * Math.cos(rad) - pt.localY * Math.sin(rad),
    worldY: fy + pt.localX * Math.sin(rad) + pt.localY * Math.cos(rad),
  }));
}

/**
 * Find the nearest connection point within snap tolerance.
 * Called from FittingTool.onMouseMove() for EACH placed fitting.
 */
function findNearestConnection(cursorX, cursorY, fittings, tolerance = 18) {
  let best = null, bestDist = tolerance;

  for (const fitting of fittings) {
    for (const wcp of getWorldConnectionPoints(fitting)) {
      const d = Math.hypot(cursorX - wcp.worldX, cursorY - wcp.worldY);
      if (d < bestDist) { bestDist = d; best = { fitting, ...wcp }; }
    }
  }

  return best;  // null = no snap
}`}
        </pre>
      </div>

      {/* ── Role legend ──────────────────────────────────────────── */}
      <div style={{
        display:      'flex',
        gap:          '12px',
        width:        '100%',
        maxWidth:     720,
      }}>
        {[
          { role: 'inlet',  color: '#1565C0', desc: 'First snap point. Aligns fitting rotation to the connected duct angle.' },
          { role: 'outlet', color: '#2E7D32', desc: 'Second snap point. Duct at this end gets the outlet size (14"Ø here).' },
          { role: 'branch', color: '#E65100', desc: 'Tee/Wye only. Perpendicular connection. Branch size derived independently.' },
        ].map(({ role, color, desc }) => (
          <div key={role} style={{
            flex:         1,
            background:   'white',
            borderRadius: '8px',
            padding:      '12px 14px',
            boxShadow:    '0 1px 6px rgba(0,0,0,0.07)',
            borderLeft:   `3px solid ${color}`,
          }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 11, color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {role}
            </p>
            <p style={{ margin: 0, fontSize: 10, color: '#555', lineHeight: 1.5 }}>
              {desc}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
