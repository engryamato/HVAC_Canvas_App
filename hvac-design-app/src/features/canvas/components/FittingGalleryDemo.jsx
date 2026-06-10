/**
 * FittingGalleryDemo.jsx
 *
 * Interactive gallery of all 11 HVAC fitting types.
 * Each card shows the fitting symbol, duct stubs at every connection port,
 * and animated magnetic snap rings that activate on mouse hover.
 *
 * Port colour convention (matches FittingTool.ts):
 *   Inlet  -> blue  #2196F3
 *   Outlet -> orange #FF9800
 *   Branch -> purple #9C27B0
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ZOOM          = 2.6;   // display scale per card canvas
const SNAP_TOLERANCE = 18;    // world-inches -- matches MagneticConnectionService
const SIZE          = 20;    // default fitting "size" in world-inches (duct width)
const CARD_W        = 240;
const CARD_H        = 200;
const CX            = CARD_W / 2;  // canvas centre X
const CY            = CARD_H / 2;  // canvas centre Y

// world -> canvas helpers (local to each card, centred at CX/CY)
const wx = (x) => CX + x * ZOOM;
const wy = (y) => CY + y * ZOOM;
const ws = (s) => s * ZOOM;

// ---------------------------------------------------------------------------
// Port colour map
// ---------------------------------------------------------------------------
const PORT_COLOR = {
  inlet:  { main: '#1565C0', snap: '#2196F3' },
  outlet: { main: '#E65100', snap: '#FF9800' },
  branch: { main: '#6A1B9A', snap: '#9C27B0' },
};

// ---------------------------------------------------------------------------
// Fitting definitions: label + connection offsets (match fittingConnectionService.ts)
// ---------------------------------------------------------------------------
const FITTING_DEFS = [
  {
    id: 'elbow_90',
    label: '90 Degree Elbow',
    desc: 'Swept 90 turn',
    connections: [
      { role: 'inlet',  localX: 0,   localY: 20 },
      { role: 'outlet', localX: -20, localY: 0  },
    ],
  },
  {
    id: 'elbow_45',
    label: '45 Degree Elbow',
    desc: 'Swept 45 turn',
    connections: [
      { role: 'inlet',  localX: -20, localY: 0   },
      { role: 'outlet', localX: 14,  localY: -14 },
    ],
  },
  {
    id: 'elbow_mitered',
    label: 'Mitered Elbow',
    desc: 'Sharp mitered L-shape',
    connections: [
      { role: 'inlet',  localX: -20, localY: 0   },
      { role: 'outlet', localX: 0,   localY: -20 },
    ],
  },
  {
    id: 'reducer',
    label: 'Reducer',
    desc: 'Concentric taper',
    connections: [
      { role: 'inlet',  localX: -28, localY: 0 },
      { role: 'outlet', localX: 28,  localY: 0 },
    ],
  },
  {
    id: 'reducer_tapered',
    label: 'Tapered Reducer',
    desc: 'Tapered concentric',
    connections: [
      { role: 'inlet',  localX: -28, localY: 0 },
      { role: 'outlet', localX: 28,  localY: 0 },
    ],
  },
  {
    id: 'reducer_eccentric',
    label: 'Eccentric Reducer',
    desc: 'Flat-bottom taper',
    connections: [
      { role: 'inlet',  localX: -28, localY: 0 },
      { role: 'outlet', localX: 28,  localY: 0 },
    ],
  },
  {
    id: 'tee',
    label: 'Tee',
    desc: 'Main run + branch',
    connections: [
      { role: 'inlet',  localX: -32, localY: 0   },
      { role: 'outlet', localX: 52,  localY: 0   },
      { role: 'branch', localX: 10,  localY: -32 },
    ],
  },
  {
    id: 'wye',
    label: 'Wye',
    desc: 'Angled branch',
    connections: [
      { role: 'inlet',  localX: -32, localY: 0   },
      { role: 'outlet', localX: 52,  localY: 0   },
      { role: 'branch', localX: 48,  localY: -26 },
    ],
  },
  {
    id: 'cap',
    label: 'End Cap',
    desc: 'Closed duct end',
    connections: [
      { role: 'inlet', localX: -32, localY: 0 },
    ],
  },
  {
    id: 'end_boot',
    label: 'End Boot (Offset)',
    desc: 'S-offset fitting',
    connections: [
      { role: 'inlet',  localX: -42, localY: 0 },
      { role: 'outlet', localX: 42,  localY: 0 },
    ],
  },
  {
    id: 'transition_square_to_round',
    label: 'Square to Round',
    desc: 'Rect-to-round transition',
    connections: [
      { role: 'inlet',  localX: -42, localY: 0  },
      { role: 'outlet', localX: 20,  localY: 0  },
    ],
  },
];

// ---------------------------------------------------------------------------
// Drawing helpers (mirrors FittingRenderer.ts + ProfessionalRenderingHelper.ts)
// All coordinates are in world-inches; wx()/wy()/ws() convert to canvas pixels.
// ---------------------------------------------------------------------------

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

function drawGrid(ctx) {
  const step = ws(12);
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < CARD_W; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CARD_H); ctx.stroke();
  }
  for (let y = 0; y < CARD_H; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CARD_W, y); ctx.stroke();
  }
  ctx.restore();
}

/** Draw a short duct stub pointing outward from a connection port */
function drawDuctStub(ctx, conn) {
  const px = wx(conn.localX);
  const py = wy(conn.localY);
  // Compute outward direction from origin
  const mag = Math.hypot(conn.localX, conn.localY) || 1;
  const nx  = conn.localX / mag;
  const ny  = conn.localY / mag;
  const stubLen = ws(18);
  const half    = ws(SIZE / 2);

  ctx.save();
  // Perpendicular for double-line duct
  const perpX = -ny;
  const perpY =  nx;

  ctx.strokeStyle = '#1565C0';
  ctx.lineWidth   = 1.5;
  ctx.globalAlpha = 0.5;

  // Two parallel walls
  ctx.beginPath();
  ctx.moveTo(px + perpX * half, py + perpY * half);
  ctx.lineTo(px + nx * stubLen + perpX * half, py + ny * stubLen + perpY * half);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(px - perpX * half, py - perpY * half);
  ctx.lineTo(px + nx * stubLen - perpX * half, py + ny * stubLen - perpY * half);
  ctx.stroke();

  // Flange cap at tip
  const tipX = px + nx * stubLen;
  const tipY = py + ny * stubLen;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tipX + perpX * (half + ws(1.5)), tipY + perpY * (half + ws(1.5)));
  ctx.lineTo(tipX - perpX * (half + ws(1.5)), tipY - perpY * (half + ws(1.5)));
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.restore();
}

/** Port indicator dot with optional snap ring */
function drawPortDot(ctx, conn, hovered, snapped, pulse) {
  const cx   = wx(conn.localX);
  const cy   = wy(conn.localY);
  const col  = PORT_COLOR[conn.role] || PORT_COLOR.outlet;

  ctx.save();

  // Tolerance ring (dashed)
  const tolR = ws(SNAP_TOLERANCE);
  ctx.setLineDash([ws(3.5), ws(3.5)]);
  ctx.strokeStyle = snapped ? col.snap : hovered ? col.main : 'rgba(0,0,0,0.14)';
  ctx.lineWidth   = snapped ? 1.6 : 0.8;
  ctx.globalAlpha = snapped ? 0.8 : hovered ? 0.5 : 0.25;
  ctx.beginPath();
  ctx.arc(cx, cy, tolR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // Pulse ring
  if (snapped || hovered) {
    const pr = ws(SNAP_TOLERANCE * 0.38) + ws(3.5) * Math.sin(pulse * Math.PI * 2);
    ctx.strokeStyle = col.snap;
    ctx.lineWidth   = 1.8;
    ctx.globalAlpha = 0.5 + 0.25 * Math.sin(pulse * Math.PI * 2);
    ctx.beginPath();
    ctx.arc(cx, cy, pr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // White halo
  const dotR = snapped ? ws(3) : hovered ? ws(2.6) : ws(2);
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(cx, cy, dotR + ws(0.7), 0, Math.PI * 2);
  ctx.fill();

  // Coloured dot
  ctx.fillStyle = snapped ? col.snap : col.main;
  ctx.beginPath();
  ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
  ctx.fill();

  // Inner white dot
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(cx, cy, dotR * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Role mini-badge
  const badgeY  = cy - tolR - 14;
  const label   = conn.role.toUpperCase();
  ctx.font      = 'bold 9px system-ui, monospace';
  const tw      = ctx.measureText(label).width;
  const bw      = tw + 8; const bh = 14;
  ctx.fillStyle = snapped || hovered ? col.main : col.main + 'AA';
  roundRect(ctx, cx - bw / 2, badgeY - bh / 2, bw, bh, 3);
  ctx.fill();
  ctx.fillStyle    = 'white';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, badgeY);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Per-type fitting geometry (local space, origin at 0,0 -> maps to wx/wy)
// ---------------------------------------------------------------------------

function drawElbow90(ctx) {
  const r    = SIZE * 1.4;
  const half = SIZE / 2;
  ctx.save();
  ctx.fillStyle   = 'rgba(232, 245, 233, 0.9)';
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth   = 2;

  // Filled arc shape
  ctx.beginPath();
  ctx.moveTo(wx(0) + ws(r + half), wy(0));
  ctx.arc(wx(0), wy(0), ws(r + half), 0, Math.PI / 2);
  ctx.arc(wx(0), wy(0), ws(r - half), Math.PI / 2, 0, true);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Outer arc
  ctx.beginPath();
  ctx.arc(wx(0), wy(0), ws(r + half), 0, Math.PI / 2);
  ctx.stroke();
  // Inner arc
  ctx.beginPath();
  ctx.arc(wx(0), wy(0), ws(r - half), 0, Math.PI / 2);
  ctx.stroke();
  // Centerline
  ctx.setLineDash([ws(6), ws(3), ws(1.5), ws(3)]);
  ctx.lineWidth   = 1;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.arc(wx(0), wy(0), ws(r), 0, Math.PI / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawElbow45(ctx) {
  const r    = SIZE * 1.6;
  const half = SIZE / 2;
  const ang  = Math.PI / 4; // 45 degrees
  ctx.save();
  ctx.fillStyle   = 'rgba(232, 245, 233, 0.9)';
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth   = 2;

  ctx.beginPath();
  ctx.moveTo(wx(0) + ws(r + half), wy(0));
  ctx.arc(wx(0), wy(0), ws(r + half), 0, ang);
  ctx.arc(wx(0), wy(0), ws(r - half), ang, 0, true);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath(); ctx.arc(wx(0), wy(0), ws(r + half), 0, ang); ctx.stroke();
  ctx.beginPath(); ctx.arc(wx(0), wy(0), ws(r - half), 0, ang); ctx.stroke();

  ctx.setLineDash([ws(5), ws(3), ws(1.5), ws(3)]);
  ctx.lineWidth = 1; ctx.globalAlpha = 0.45;
  ctx.beginPath(); ctx.arc(wx(0), wy(0), ws(r), 0, ang); ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha = 1;
  ctx.restore();
}

function drawMiteredElbow(ctx) {
  const half = SIZE / 2;
  ctx.save();
  ctx.fillStyle   = 'rgba(232, 245, 233, 0.9)';
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(wx(-half), wy(half));
  ctx.lineTo(wx(10),    wy(half));
  ctx.lineTo(wx(26),    wy(half));
  ctx.lineTo(wx(26),    wy(-4));
  ctx.lineTo(wx(half),  wy(-4));
  ctx.lineTo(wx(half),  wy(-30 - half));
  ctx.lineTo(wx(-4),    wy(-30 - half));
  ctx.lineTo(wx(-4),    wy(-half));
  ctx.lineTo(wx(-half), wy(-half));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(wx(26), wy(half));
  ctx.lineTo(wx(-4), wy(-half));
  ctx.stroke();
  ctx.restore();
}

function drawReducer(ctx, eccentric = false, tapered = false) {
  const inHalf  = SIZE / 2;
  const outHalf = (SIZE * 0.65) / 2;
  const x1 = wx(-28); const x2 = wx(28);
  const y  = wy(0);
  const y1top    = y - ws(inHalf);
  const y1bot    = y + ws(inHalf);
  const y2top    = eccentric ? y - ws(outHalf * 2) : y - ws(outHalf);
  const y2bot    = eccentric ? y + ws(0.5)         : y + ws(outHalf);

  ctx.save();
  ctx.fillStyle   = 'rgba(232, 245, 233, 0.9)';
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth   = 2;

  ctx.beginPath();
  ctx.moveTo(x1, y1top);
  ctx.lineTo(x2, y2top);
  ctx.lineTo(x2, y2bot);
  ctx.lineTo(x1, y1bot);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // End ticks
  ctx.beginPath();
  ctx.moveTo(x1, y1top - ws(1.5)); ctx.lineTo(x1, y1bot + ws(1.5));
  ctx.moveTo(x2, y2top - ws(1.5)); ctx.lineTo(x2, y2bot + ws(1.5));
  ctx.lineWidth = 2.5;
  ctx.stroke();

  if (tapered) {
    // Extra taper line through middle
    ctx.setLineDash([ws(4), ws(3)]);
    ctx.lineWidth   = 1;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(x1, y); ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawTee(ctx) {
  const mainHalf   = SIZE / 2;
  const branchHalf = (SIZE * 0.7) / 2;
  ctx.save();
  ctx.fillStyle   = 'rgba(232, 245, 233, 0.9)';
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth   = 2;

  // Main run body
  ctx.beginPath();
  ctx.rect(wx(-32), wy(-mainHalf), ws(84), ws(SIZE));
  ctx.fill();
  ctx.stroke();

  // Branch stub upward from x=10
  ctx.beginPath();
  ctx.rect(wx(10 - branchHalf), wy(-32 - SIZE * 0.7), ws(SIZE * 0.7), ws(32));
  ctx.fill();
  ctx.stroke();

  // Branch interior dividing line
  ctx.beginPath();
  ctx.moveTo(wx(10 - branchHalf), wy(-mainHalf));
  ctx.lineTo(wx(10 + branchHalf), wy(-mainHalf));
  ctx.lineWidth = 1.25;
  ctx.stroke();

  ctx.restore();
}

function drawWye(ctx) {
  const mainHalf   = SIZE / 2;
  const branchHalf = (SIZE * 0.7) / 2;
  ctx.save();
  ctx.fillStyle   = 'rgba(232, 245, 233, 0.9)';
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth   = 2;

  ctx.beginPath();
  ctx.moveTo(wx(-32), wy(-mainHalf));
  ctx.lineTo(wx(0),   wy(-mainHalf));
  ctx.lineTo(wx(28),  wy(-26 - branchHalf));
  ctx.lineTo(wx(48),  wy(-26 - branchHalf));
  ctx.lineTo(wx(20),  wy(-mainHalf));
  ctx.lineTo(wx(52),  wy(-mainHalf));
  ctx.lineTo(wx(52),  wy(mainHalf));
  ctx.lineTo(wx(-32), wy(mainHalf));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bottom of branch
  ctx.beginPath();
  ctx.moveTo(wx(20), wy(mainHalf));
  ctx.lineTo(wx(48), wy(-26 + branchHalf));
  ctx.lineTo(wx(28), wy(-26 + branchHalf));
  ctx.lineTo(wx(0),  wy(mainHalf));
  ctx.stroke();

  ctx.restore();
}

function drawCap(ctx) {
  const half = SIZE / 2;
  ctx.save();
  ctx.fillStyle   = 'rgba(232, 245, 233, 0.9)';
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth   = 2;

  ctx.beginPath();
  ctx.rect(wx(-32), wy(-half), ws(44), ws(SIZE));
  ctx.fill();
  ctx.stroke();

  // Cap plate
  ctx.beginPath();
  ctx.moveTo(wx(12), wy(-half - 2));
  ctx.lineTo(wx(12), wy(half + 2));
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
}

function drawEndBoot(ctx) {
  const half = SIZE / 2;
  ctx.save();
  ctx.fillStyle   = 'rgba(232, 245, 233, 0.9)';
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth   = 2;

  ctx.beginPath();
  ctx.moveTo(wx(-42), wy(10 - half));
  ctx.lineTo(wx(-14), wy(10 - half));
  ctx.lineTo(wx(16),  wy(-10 - half));
  ctx.lineTo(wx(42),  wy(-10 - half));
  ctx.lineTo(wx(42),  wy(-10 + half));
  ctx.lineTo(wx(16),  wy(-10 + half));
  ctx.lineTo(wx(-14), wy(10 + half));
  ctx.lineTo(wx(-42), wy(10 + half));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawRectToRound(ctx) {
  const rectHalf  = SIZE / 2;
  const roundR    = (SIZE * 0.65) / 2;
  const rectWidth = Math.max(SIZE * 1.6, 20);

  ctx.save();
  ctx.fillStyle   = 'rgba(232, 245, 233, 0.9)';
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth   = 2;

  // Rectangular section
  ctx.beginPath();
  ctx.rect(wx(-42), wy(-rectHalf), ws(rectWidth), ws(SIZE));
  ctx.fill();
  ctx.stroke();

  // Curved taper lines
  ctx.beginPath();
  ctx.moveTo(wx(-42 + rectWidth), wy(-rectHalf));
  ctx.quadraticCurveTo(wx(-4), wy(-rectHalf), wx(20 - roundR), wy(-roundR));
  ctx.moveTo(wx(-42 + rectWidth), wy(rectHalf));
  ctx.quadraticCurveTo(wx(-4), wy(rectHalf),  wx(20 - roundR), wy(roundR));
  ctx.stroke();

  // Round outlet circle
  ctx.beginPath();
  ctx.arc(wx(20), wy(0), ws(roundR), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

// Dispatch to the right draw function
function drawFitting(ctx, id) {
  switch (id) {
    case 'elbow_90':               return drawElbow90(ctx);
    case 'elbow_45':               return drawElbow45(ctx);
    case 'elbow_mitered':          return drawMiteredElbow(ctx);
    case 'reducer':                return drawReducer(ctx, false, false);
    case 'reducer_tapered':        return drawReducer(ctx, false, true);
    case 'reducer_eccentric':      return drawReducer(ctx, true,  false);
    case 'tee':                    return drawTee(ctx);
    case 'wye':                    return drawWye(ctx);
    case 'cap':                    return drawCap(ctx);
    case 'end_boot':               return drawEndBoot(ctx);
    case 'transition_square_to_round': return drawRectToRound(ctx);
    default: break;
  }
}

// ---------------------------------------------------------------------------
// FittingCard — one canvas card per fitting type
// ---------------------------------------------------------------------------
function FittingCard({ def, pulse }) {
  const canvasRef   = useRef(null);
  const [cursor, setCursor] = useState({ x: 999, y: 999 });

  // Find nearest connection in world space
  const nearest = (() => {
    for (const conn of def.connections) {
      if (Math.hypot(cursor.x - conn.localX, cursor.y - conn.localY) <= SNAP_TOLERANCE) {
        return conn;
      }
    }
    return null;
  })();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {return;}
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CARD_W, CARD_H);

    // Background
    ctx.fillStyle = '#F3F6FB';
    ctx.fillRect(0, 0, CARD_W, CARD_H);
    drawGrid(ctx);

    // Duct stubs at each connection port
    for (const conn of def.connections) {
      drawDuctStub(ctx, conn);
    }

    // Fitting geometry
    drawFitting(ctx, def.id);

    // Port indicator dots
    for (const conn of def.connections) {
      const hovered = conn === nearest;
      drawPortDot(ctx, conn, hovered, hovered, pulse);
    }

    // Hover cursor crosshair
    const ccx = wx(cursor.x);
    const ccy = wy(cursor.y);
    if (cursor.x < 900) {
      ctx.save();
      ctx.strokeStyle = nearest ? PORT_COLOR[nearest.role].snap : '#757575';
      ctx.lineWidth   = 1.2;
      const sz = 5;
      ctx.beginPath();
      ctx.moveTo(ccx - sz, ccy); ctx.lineTo(ccx + sz, ccy);
      ctx.moveTo(ccx, ccy - sz); ctx.lineTo(ccx, ccy + sz);
      ctx.stroke();
      if (nearest) {
        ctx.font         = 'bold 8px system-ui';
        ctx.fillStyle    = PORT_COLOR[nearest.role].snap;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('SNAP', ccx, ccy - sz - 2);
      }
      ctx.restore();
    }

  }, [def, cursor, nearest, pulse]);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const cx   = (e.clientX - rect.left) * (CARD_W / rect.width);
    const cy   = (e.clientY - rect.top)  * (CARD_H / rect.height);
    setCursor({ x: (cx - CX) / ZOOM, y: (cy - CY) / ZOOM });
  }, []);

  const handleMouseLeave = useCallback(() => setCursor({ x: 999, y: 999 }), []);

  return (
    <div style={{
      background:   'white',
      borderRadius: 10,
      boxShadow:    nearest
        ? '0 0 0 2px ' + PORT_COLOR[nearest.role].snap + ', 0 4px 16px rgba(0,0,0,0.12)'
        : '0 2px 10px rgba(0,0,0,0.09)',
      overflow:     'hidden',
      transition:   'box-shadow 0.15s ease',
    }}>
      <canvas
        ref={canvasRef}
        width={CARD_W}
        height={CARD_H}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'block', cursor: 'crosshair', maxWidth: '100%' }}
      />

      {/* Card footer */}
      <div style={{ padding: '10px 14px 12px', borderTop: '1px solid #eef' }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: '#1B5E20', marginBottom: 3 }}>
          {def.label}
        </div>
        <div style={{ fontSize: 10, color: '#757575', marginBottom: 7 }}>
          {def.desc}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {def.connections.map((c) => (
            <span key={c.role} style={{
              fontSize:     9,
              fontWeight:   700,
              padding:      '2px 7px',
              borderRadius: 10,
              background:   (PORT_COLOR[c.role]?.main || '#555') + '18',
              color:        PORT_COLOR[c.role]?.main || '#555',
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
            }}>
              {c.role}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export default function FittingGalleryDemo() {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    let raf; let t = 0;
    const loop = () => { t += 0.016; setPulse(t % 1); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{
      padding:    '24px 20px',
      background: '#EEF2F8',
      minHeight:  '100vh',
      fontFamily: 'system-ui, sans-serif',
    }}>

      {/* Header */}
      <div style={{
        textAlign:    'center',
        marginBottom: 24,
      }}>
        <h2 style={{
          margin:     '0 0 6px',
          fontSize:   20,
          fontWeight: 800,
          color:      '#1565C0',
        }}>
          HVAC Fitting Gallery
        </h2>
        <p style={{ margin: 0, fontSize: 12, color: '#546E7A' }}>
          All 11 fitting types  &middot;  Hover any card to see magnetic snap rings
        </p>
        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
          {[
            ['inlet',  'Inlet  -- air in'],
            ['outlet', 'Outlet -- air out'],
            ['branch', 'Branch -- tee / wye only'],
          ].map(([role, desc]) => (
            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#444' }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: PORT_COLOR[role].main, display: 'inline-block',
              }} />
              <span style={{ fontWeight: 700, color: PORT_COLOR[role].main, textTransform: 'uppercase', fontSize: 10 }}>
                {role}
              </span>
              <span style={{ color: '#888' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
        gap:                 20,
        maxWidth:            900,
        margin:              '0 auto',
      }}>
        {FITTING_DEFS.map((def) => (
          <FittingCard key={def.id} def={def} pulse={pulse} />
        ))}
      </div>

      {/* Footer reference */}
      <div style={{
        maxWidth:    900,
        margin:      '24px auto 0',
        background:  'white',
        borderRadius: 8,
        padding:     '14px 18px',
        boxShadow:   '0 1px 6px rgba(0,0,0,0.07)',
      }}>
        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 11, color: '#1565C0' }}>
          CONNECTION OFFSETS  (local fitting space, 1 unit = 1 inch)
        </p>
        <pre style={{
          margin: 0, fontSize: 10, lineHeight: 1.7,
          color: '#1a1a2e', background: '#F3F6FB',
          padding: '10px 14px', borderRadius: 5, overflowX: 'auto',
        }}>{`// src/features/canvas/services/fittingConnectionService.ts

FITTING_CONNECTION_OFFSETS = {
  elbow_90:                   [ {inlet:  (  0, +20)}, {outlet: (-20,   0)} ],
  elbow_45:                   [ {inlet:  (-20,   0)}, {outlet: (+14, -14)} ],
  elbow_mitered:              [ {inlet:  (-20,   0)}, {outlet: (  0, -20)} ],
  reducer / _tapered / _ecc:  [ {inlet:  (-28,   0)}, {outlet: (+28,   0)} ],
  tee:   [ {inlet: (-32, 0)}, {outlet: (+52, 0)}, {branch: (+10, -32)} ],
  wye:   [ {inlet: (-32, 0)}, {outlet: (+52, 0)}, {branch: (+48, -26)} ],
  cap:                        [ {inlet:  (-32,   0)} ],
  end_boot:                   [ {inlet:  (-42,   0)}, {outlet: (+42,   0)} ],
  transition_square_to_round: [ {inlet:  (-42,   0)}, {outlet: (+20,   0)} ],
}`}</pre>
      </div>

    </div>
  );
}
