import React, { useState } from "react";

/**
 * RTU Plan Symbol — Rooftop Unit (Top View)
 * ──────────────────────────────────────────
 * Parametric, placeable plan-view symbol for a packaged rooftop unit.
 *
 * Layout (north → south, top → bottom in plan view):
 *   North face    ← OA intake louver (east half) + Exhaust grille (west quarter)
 *   ─────────────────────────────────────────────────────────
 *   Condenser section  ← fin-pack coil hatch + two condenser fan circles
 *   ─────────────────────────────────────────────────────────
 *   Compressor section ← compressor housing symbol
 *   ─────────────────────────────────────────────────────────
 *   Economizer / mixing section ← angled damper blades
 *   ─────────────────────────────────────────────────────────
 *   Supply / Return curb openings ← south ports (through roof curb)
 *
 * Port system:
 *   { role, edge, ratio } — fully parametric, scales with body dimensions.
 *   North edge:  outdoor_air (0.50)  ·  exhaust (0.25)
 *   South edge:  supply (0.35)       ·  return  (0.65)
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const PORT_COLORS = {
  supply:      "#2E7D32",
  return:      "#1565C0",
  outdoor_air: "#00838F",
  exhaust:     "#C62828",
  relief:      "#6A1B9A",
  inline:      "#757575",
};

const PORT_FLOW = {
  supply:      "out",
  return:      "in",
  outdoor_air: "in",
  exhaust:     "out",
  relief:      "out",
  inline:      "both",
};

const EDGE_VECTOR = {
  north: { x: 0,  y: -1 },
  south: { x: 0,  y:  1 },
  east:  { x: 1,  y:  0 },
  west:  { x: -1, y:  0 },
};

// RTU body dimensions and port definitions
const RTU = {
  type: "rtu",
  tag:  "RTU-1",
  name: "Rooftop Unit",
  w: 380,
  h: 270,
  ports: [
    {
      role:     "outdoor_air",
      edge:     "north",
      ratio:    0.5,
      label:    "OUTDOOR AIR",
      subLabel: "IN",
      note:     "OA intake louver — mixed with return air via economizer",
    },
    {
      role:     "exhaust",
      edge:     "north",
      ratio:    0.25,
      label:    "EXHAUST",
      subLabel: "OUT",
      note:     "Relief/exhaust discharge — economizer bypass",
    },
    {
      role:     "supply",
      edge:     "south",
      ratio:    0.35,
      label:    "SUPPLY AIR",
      subLabel: "OUT",
      note:     "Conditioned air discharged through roof curb — supply duct system",
    },
    {
      role:     "return",
      edge:     "south",
      ratio:    0.65,
      label:    "RETURN AIR",
      subLabel: "IN",
      note:     "Return air drawn up from building through roof curb",
    },
  ],
};

// Section height constants (north → south, sum = RTU.h)
const NORTH_FACE_H  = 55;
const CONDENSER_H   = 80;
const COMPRESSOR_H  = 45;
const ECONOMIZER_H  = 45;
const PLENUM_H      = 45;

// ─── Port helpers ─────────────────────────────────────────────────────────────

function getPortPosition(port, box) {
  switch (port.edge) {
    case "north": return { x: box.x + box.w * port.ratio, y: box.y };
    case "south": return { x: box.x + box.w * port.ratio, y: box.y + box.h };
    case "east":  return { x: box.x + box.w,              y: box.y + box.h * port.ratio };
    case "west":  return { x: box.x,                      y: box.y + box.h * port.ratio };
    default:      return { x: box.x + box.w / 2,          y: box.y + box.h / 2 };
  }
}

function getArrowDirection(port) {
  const edge = EDGE_VECTOR[port.edge];
  const flow = PORT_FLOW[port.role];
  if (flow === "in") return { x: -edge.x, y: -edge.y };
  return edge;
}

// ─── SVG Sub-Components ───────────────────────────────────────────────────────

/** Directional flow triangle */
function ArrowTriangle({ cx, cy, dir, color, size = 11, offset = 34 }) {
  const tip  = { x: cx + dir.x * (offset + size), y: cy + dir.y * (offset + size) };
  const base = { x: cx + dir.x * offset,           y: cy + dir.y * offset };
  const perp = { x: -dir.y, y: dir.x };
  const p1   = { x: base.x + perp.x * size, y: base.y + perp.y * size };
  const p2   = { x: base.x - perp.x * size, y: base.y - perp.y * size };
  return (
    <polygon
      points={`${tip.x},${tip.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`}
      fill={color}
    />
  );
}

/** Parametric port connection marker */
function PortMarker({ port, box, showLabels, highlighted = false }) {
  const pos   = getPortPosition(port, box);
  const color = PORT_COLORS[port.role];
  const edge  = EDGE_VECTOR[port.edge];
  const dir   = getArrowDirection(port);

  const isHorizontal   = port.edge === "west" || port.edge === "east";
  const labelOffset    = isHorizontal ? 96 : 74;
  const subLabelOffset = isHorizontal ? 96 : 98;

  const labelX    = pos.x + edge.x * labelOffset;
  const labelY    = pos.y + edge.y * labelOffset;
  const subLabelX = pos.x + edge.x * subLabelOffset;
  const subLabelY = pos.y + edge.y * subLabelOffset + (isHorizontal ? 20 : 0);

  return (
    <g>
      {highlighted && (
        <circle cx={pos.x} cy={pos.y} r="24" fill={color} opacity="0.15" />
      )}
      <circle
        cx={pos.x} cy={pos.y} r="17"
        fill="white"
        stroke={highlighted ? color : "#CBD5E1"}
        strokeWidth={highlighted ? 2 : 1.5}
      />
      <circle
        cx={pos.x} cy={pos.y} r="12"
        fill={color}
        stroke="white"
        strokeWidth="2"
      />
      <ArrowTriangle cx={pos.x} cy={pos.y} dir={dir} color={color} />
      {showLabels && (
        <g>
          <text
            x={labelX} y={labelY}
            textAnchor={edge.x > 0 ? "start" : edge.x < 0 ? "end" : "middle"}
            dominantBaseline="middle"
            fontSize="15" fontWeight="900"
            fill={color}
          >
            {port.label}
          </text>
          <text
            x={subLabelX} y={subLabelY}
            textAnchor={edge.x > 0 ? "start" : edge.x < 0 ? "end" : "middle"}
            dominantBaseline="middle"
            fontSize="13" fontWeight="800"
            fill="#0F172A"
          >
            ({port.subLabel})
          </text>
        </g>
      )}
    </g>
  );
}

/** Single condenser fan (plan view — blades swept from center) */
function CondenserFan({ cx, cy, r = 28 }) {
  // Four swept blades at 45 / 135 / 225 / 315 degrees
  const blades = [45, 135, 225, 315].map((deg) => {
    const a  = (deg * Math.PI) / 180;
    const a2 = ((deg - 50) * Math.PI) / 180; // swept leading edge
    const qx = cx + Math.cos(a2) * r * 0.5;
    const qy = cy + Math.sin(a2) * r * 0.5;
    const ex = cx + Math.cos(a) * r;
    const ey = cy + Math.sin(a) * r;
    return `M ${cx} ${cy} Q ${qx.toFixed(1)} ${qy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  });

  return (
    <g stroke="#374151" fill="none" opacity="0.88">
      {/* Outer housing */}
      <circle cx={cx} cy={cy} r={r + 6} fill="white" strokeWidth="1.8" />
      {/* Rim */}
      <circle cx={cx} cy={cy} r={r} strokeWidth="1.4" />
      {/* Blades */}
      {blades.map((d, i) => <path key={i} d={d} strokeWidth="2" />)}
      {/* Hub */}
      <circle cx={cx} cy={cy} r={4} fill="#374151" stroke="none" />
    </g>
  );
}

/** Condenser coil section — diagonal fin-pack hatch + two fan circles */
function CondenserSection({ x, y, w, h }) {
  const fanY   = y + h / 2;
  const fan1x  = x + w * 0.28;
  const fan2x  = x + w * 0.72;
  const fanR   = 28;
  const clipId = "rtuCondenserClip";

  // Diagonal hatch lines (clipped to section bounds)
  const step  = 14;
  const lines = [];
  for (let n = -(h - step); n < w; n += step) {
    const x1 = Math.max(x, x + n);
    const y1 = n >= 0 ? y : y - n;
    const x2 = Math.min(x + w, x + n + h);
    const dy  = x2 - x1;
    const y2  = y1 + dy;
    lines.push({ x1, y1, x2, y2: Math.min(y + h, y2) });
  }

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
      </defs>

      {/* Section background */}
      <rect x={x} y={y} width={w} height={h} fill="#F8FAFC" stroke="#374151" strokeWidth="1.5" />

      {/* Fin-pack hatch */}
      <g clipPath={`url(#${clipId})`} stroke="#9CA3AF" strokeWidth="1" opacity="0.5">
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
        ))}
      </g>

      {/* Condenser fans */}
      <CondenserFan cx={fan1x} cy={fanY} r={fanR} />
      <CondenserFan cx={fan2x} cy={fanY} r={fanR} />

      {/* Section label */}
      <text
        x={x + w / 2} y={y + 11}
        textAnchor="middle" fontSize="9" fontWeight="700"
        fill="#6B7280"
      >
        CONDENSER
      </text>
    </g>
  );
}

/** Compressor housing — cylinder circle with compression arcs + hub */
function CompressorSymbol({ cx, cy, r = 16 }) {
  // Outer housing
  const or = r + 6;
  // Compression arcs
  const outerArc = `M ${(cx - r * 0.6).toFixed(1)} ${cy} C ${(cx - r * 0.6).toFixed(1)} ${(cy - r * 0.9).toFixed(1)}, ${(cx + r * 0.6).toFixed(1)} ${(cy - r * 0.9).toFixed(1)}, ${(cx + r * 0.6).toFixed(1)} ${cy}`;
  const innerArc = `M ${(cx - r * 0.35).toFixed(1)} ${(cy + 4)} C ${(cx - r * 0.35).toFixed(1)} ${(cy - r * 0.55).toFixed(1)}, ${(cx + r * 0.35).toFixed(1)} ${(cy - r * 0.55).toFixed(1)}, ${(cx + r * 0.35).toFixed(1)} ${(cy + 4)}`;

  return (
    <g stroke="#111827" opacity="0.88">
      {/* Housing */}
      <circle cx={cx} cy={cy} r={or} fill="white" strokeWidth="1.8" />
      {/* Inner rim */}
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth="1.4" />
      {/* Compression arcs */}
      <path d={outerArc} fill="none" strokeWidth="1.8" />
      <path d={innerArc} fill="none" strokeWidth="1.3" opacity="0.6" />
      {/* Hub */}
      <circle cx={cx} cy={cy + 5} r={4} fill="#111827" stroke="none" />
    </g>
  );
}

/** Economizer / mixing box — alternating-angle damper blades */
function EconomizerSection({ x, y, w, h, count = 5 }) {
  return (
    <g stroke="#111827" fill="none" strokeWidth="1.8" opacity="0.82">
      <rect x={x} y={y} width={w} height={h} />
      {Array.from({ length: count }).map((_, i) => {
        const yy    = y + ((i + 1) * h) / (count + 1);
        const slant = 8;
        const sign  = i % 2 === 0 ? 1 : -1;
        return (
          <line
            key={i}
            x1={x + 18} y1={yy - slant * sign}
            x2={x + w - 18} y2={yy + slant * sign}
          />
        );
      })}
      <text
        x={x + w / 2} y={y + 11}
        textAnchor="middle" fontSize="9" fontWeight="700"
        fill="#374151" stroke="none"
      >
        ECONOMIZER
      </text>
    </g>
  );
}

/** North face — exhaust grille (west) and OA intake louver (east) */
function NorthFaceSection({ x, y, w, h, exhaustRatio = 0.25, oaRatio = 0.5 }) {
  const midX        = x + w / 2;
  const grilleX     = x + 12;
  const grilleW     = midX - x - 18;
  const louverX     = midX + 6;
  const louverW     = x + w - midX - 18;
  const lineCount   = 4;

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#111827" strokeWidth="1.5" />

      {/* Center divider */}
      <line
        x1={midX} y1={y} x2={midX} y2={y + h}
        stroke="#111827" strokeWidth="1.2" strokeDasharray="4 3"
      />

      {/* Left: Exhaust grille — horizontal bars */}
      <g stroke="#374151" strokeWidth="2" opacity="0.75">
        {Array.from({ length: lineCount }).map((_, i) => {
          const yy = y + ((i + 1) * h) / (lineCount + 1);
          return <line key={i} x1={grilleX} y1={yy} x2={grilleX + grilleW} y2={yy} />;
        })}
        <text
          x={grilleX + grilleW / 2} y={y + h - 6}
          textAnchor="middle" fontSize="8" fontWeight="700"
          fill={PORT_COLORS.exhaust} stroke="none"
        >
          EXH
        </text>
      </g>

      {/* Right: OA intake louver — consistent diagonal slats */}
      <g stroke="#374151" strokeWidth="2" opacity="0.75">
        {Array.from({ length: lineCount }).map((_, i) => {
          const yy = y + ((i + 1) * h) / (lineCount + 1);
          return (
            <line
              key={i}
              x1={louverX + 8}      y1={yy - 4}
              x2={louverX + louverW - 8} y2={yy + 4}
            />
          );
        })}
        <text
          x={louverX + louverW / 2} y={y + h - 6}
          textAnchor="middle" fontSize="8" fontWeight="700"
          fill={PORT_COLORS.outdoor_air} stroke="none"
        >
          OA
        </text>
      </g>
    </g>
  );
}

/** Supply / Return curb openings — south edge, through roof curb */
function PlenumSection({ x, y, w, h, supplyRatio = 0.35, returnRatio = 0.65 }) {
  const supplyX  = x + w * supplyRatio;
  const returnX  = x + w * returnRatio;
  const openingW = 44;
  const openingH = h - 20;
  const oy       = y + 10;

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#111827" strokeWidth="1.5" />

      {/* Roof curb boundary (dashed) */}
      <rect
        x={x + 10} y={y + 6} width={w - 20} height={h - 12}
        fill="none" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="5 4"
        rx="2"
      />

      {/* Supply opening */}
      <rect
        x={supplyX - openingW / 2} y={oy}
        width={openingW} height={openingH}
        fill={`${PORT_COLORS.supply}22`}
        stroke={PORT_COLORS.supply} strokeWidth="2" rx="2"
      />
      <text
        x={supplyX} y={y + h / 2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="9" fontWeight="900" fill={PORT_COLORS.supply}
      >
        SA
      </text>

      {/* Return opening */}
      <rect
        x={returnX - openingW / 2} y={oy}
        width={openingW} height={openingH}
        fill={`${PORT_COLORS.return}22`}
        stroke={PORT_COLORS.return} strokeWidth="2" rx="2"
      />
      <text
        x={returnX} y={y + h / 2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="9" fontWeight="900" fill={PORT_COLORS.return}
      >
        RA
      </text>

      {/* Section label */}
      <text
        x={x + w / 2} y={y + h - 5}
        textAnchor="middle" fontSize="8" fontWeight="700" fill="#64748B"
      >
        CURB CONNECTIONS
      </text>
    </g>
  );
}

// ─── RTU Body ─────────────────────────────────────────────────────────────────

/**
 * Draws the complete RTU plan body with all internal sections.
 * All coordinates are relative to box.{x, y} — fully repositionable.
 */
function RTUBody({ box }) {
  const { x, y, w, h } = box;
  const cx = x + w / 2;

  const INSET    = 12;
  const sectionX = x + INSET;
  const sectionW = w - INSET * 2;

  // Section Y boundaries (absolute)
  const northY      = y;
  const condenserY  = y + NORTH_FACE_H;
  const compressorY = condenserY + CONDENSER_H;
  const economizerY = compressorY + COMPRESSOR_H;
  const plenumY     = economizerY + ECONOMIZER_H;

  return (
    <g>
      {/* ── Outer body ── */}
      <rect
        x={x} y={y} width={w} height={h} rx="4"
        fill="#FAFAFA" stroke="#111827" strokeWidth="2.5"
      />
      {/* Inner dashed margin */}
      <rect
        x={x + 9} y={y + 9} width={w - 18} height={h - 18} rx="2"
        fill="none" stroke="#64748B" strokeWidth="1.4"
        strokeDasharray="7 7" opacity="0.45"
      />

      {/* ── North face: OA intake + Exhaust grille ── */}
      <NorthFaceSection
        x={sectionX} y={northY + 10}
        w={sectionW}  h={NORTH_FACE_H - 14}
      />

      {/* Section divider */}
      <line
        x1={sectionX} y1={condenserY}
        x2={sectionX + sectionW} y2={condenserY}
        stroke="#111827" strokeWidth="2"
      />

      {/* ── Condenser coils + fans ── */}
      <CondenserSection
        x={sectionX}        y={condenserY + 6}
        w={sectionW}        h={CONDENSER_H - 12}
      />

      {/* Section divider */}
      <line
        x1={sectionX} y1={compressorY}
        x2={sectionX + sectionW} y2={compressorY}
        stroke="#111827" strokeWidth="2"
      />

      {/* ── Compressor ── */}
      <CompressorSymbol
        cx={cx - w * 0.14}
        cy={compressorY + COMPRESSOR_H / 2}
        r={16}
      />
      <text
        x={cx - w * 0.14 + 30}
        y={compressorY + COMPRESSOR_H / 2}
        dominantBaseline="middle"
        fontSize="9" fontWeight="700" fill="#374151" opacity="0.8"
      >
        COMP
      </text>

      {/* Section divider */}
      <line
        x1={sectionX} y1={economizerY}
        x2={sectionX + sectionW} y2={economizerY}
        stroke="#111827" strokeWidth="2"
      />

      {/* ── Economizer / mixing section ── */}
      <EconomizerSection
        x={sectionX}        y={economizerY + 6}
        w={sectionW}        h={ECONOMIZER_H - 12}
      />

      {/* Section divider */}
      <line
        x1={sectionX} y1={plenumY}
        x2={sectionX + sectionW} y2={plenumY}
        stroke="#111827" strokeWidth="2"
      />

      {/* ── Supply / Return curb openings ── */}
      <PlenumSection
        x={sectionX} y={plenumY + 4}
        w={sectionW} h={PLENUM_H - 8}
      />
    </g>
  );
}

// ─── Full RTU Preview (symbol + tag + ports) ──────────────────────────────────

function RTUPreview({ showLabels, highlightedPort }) {
  const box = { x: 190, y: 175, w: RTU.w, h: RTU.h };
  const cx  = box.x + box.w / 2;
  const cy  = box.y + box.h / 2;

  return (
    <g>
      {/* Canvas title bar */}
      <rect x="20" y="20" width="380" height="36" rx="3" fill="#0F2747" />
      <text x="38" y="44" fontSize="17" fontWeight="900" fill="white" letterSpacing="0.5">
        RTU — ROOFTOP UNIT (PLAN VIEW)
      </text>

      {/* RTU body with internal sections */}
      <RTUBody box={box} />

      {/* Equipment tag */}
      <text
        x={cx} y={cy - 14}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="28" fontWeight="900" fill="#020617"
        letterSpacing="-0.5" opacity="0.88"
      >
        {RTU.tag}
      </text>

      {/* Name badge */}
      <rect
        x={cx - 76} y={cy + 8}
        width="152" height="28" rx="5"
        fill="#111827" opacity="0.88"
      />
      <text
        x={cx} y={cy + 27}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="13" fontWeight="700" fill="#F8FAFC"
      >
        {RTU.name.toUpperCase()}
      </text>

      {/* Port markers */}
      {RTU.ports.map((port) => (
        <PortMarker
          key={`${port.role}-${port.edge}`}
          port={port}
          box={box}
          showLabels={showLabels}
          highlighted={highlightedPort === port.role}
        />
      ))}
    </g>
  );
}

// ─── UI Components ────────────────────────────────────────────────────────────

function LegendItem({ role, label, onHover, onLeave }) {
  return (
    <div
      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100"
      onMouseEnter={() => onHover(role)}
      onMouseLeave={onLeave}
    >
      <span
        className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-white shadow"
        style={{ backgroundColor: PORT_COLORS[role] }}
      />
      <span className="text-sm font-bold text-slate-900">{label}</span>
    </div>
  );
}

function ConnectionTable() {
  const rows = [
    {
      role:     "outdoor_air",
      label:    "OUTDOOR AIR",
      subLabel: "IN",
      airflow:  "Enters unit",
      location: "North face — east half OA louver",
      notes:    "Outside air mixed with return air through economizer or bypass damper.",
    },
    {
      role:     "exhaust",
      label:    "EXHAUST",
      subLabel: "OUT",
      airflow:  "Exits unit",
      location: "North face — west quarter exhaust grille",
      notes:    "Relief/exhaust air discharged when economizer is in free-cooling mode.",
    },
    {
      role:     "supply",
      label:    "SUPPLY AIR",
      subLabel: "OUT",
      airflow:  "Exits unit",
      location: "South — left curb opening (35%)",
      notes:    "Conditioned air discharged down through roof curb into supply duct system.",
    },
    {
      role:     "return",
      label:    "RETURN AIR",
      subLabel: "IN",
      airflow:  "Enters unit",
      location: "South — right curb opening (65%)",
      notes:    "Return air drawn up from building return system through curb opening.",
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <div className="bg-[#0F2747] px-4 py-3 text-base font-black tracking-wide text-white">
        CONNECTION SUMMARY
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-slate-700">
            <th className="border-b border-slate-200 px-3 py-2 font-bold">Connection</th>
            <th className="border-b border-slate-200 px-3 py-2 font-bold">Airflow</th>
            <th className="border-b border-slate-200 px-3 py-2 font-bold">Location</th>
            <th className="border-b border-slate-200 px-3 py-2 font-bold">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.role} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td className="px-3 py-2.5 font-bold text-slate-800">
                <span
                  className="mr-2 inline-block h-3.5 w-3.5 rounded-full align-middle"
                  style={{ backgroundColor: PORT_COLORS[row.role] }}
                />
                {row.label}
                <span className="ml-1 font-normal text-slate-500">({row.subLabel})</span>
              </td>
              <td className="px-3 py-2.5 font-semibold text-slate-700">{row.airflow}</td>
              <td className="px-3 py-2.5 text-slate-600">{row.location}</td>
              <td className="px-3 py-2.5 text-slate-600">{row.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PortDataPanel() {
  const code = `ports: [
  { role: "outdoor_air", edge: "north", ratio: 0.50 },
  { role: "exhaust",     edge: "north", ratio: 0.25 },
  { role: "supply",      edge: "south", ratio: 0.35 },
  { role: "return",      edge: "south", ratio: 0.65 },
]`;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black tracking-wide text-slate-800">
        PARAMETRIC PORT DATA
      </div>
      <pre className="overflow-auto bg-slate-950 p-4 text-xs leading-relaxed text-emerald-300">
        {code}
      </pre>
    </div>
  );
}

function NotesPanel() {
  const notes = [
    "Layout shown is typical for a single-zone packaged RTU. Multi-zone or custom configurations may vary.",
    "OA intake on the north face (east side) — mixed with return air through the economizer.",
    "Exhaust/relief on the north face (west side) — active during economizer free-cooling.",
    "Supply and return connections on the south face — through the roof curb assembly.",
    "Condenser fan(s) discharge upward — shown as circles in plan view.",
    "Port ratio positions are editable per-instance to match manufacturer submittals.",
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black tracking-wide text-slate-800">
        NOTES
      </div>
      <ul className="space-y-2 p-4 text-sm text-slate-700">
        {notes.map((n, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-0.5 flex-shrink-0 text-slate-400">•</span>
            <span>{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImplementationRule() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-[#0F2747] px-4 py-3 text-sm font-black tracking-wide text-white">
        IMPLEMENTATION RULE
      </div>
      <div className="space-y-3 p-4 text-sm leading-relaxed text-slate-700">
        <p>
          The RTU is a <strong className="text-slate-900">single placeable equipment object</strong>.
          Each connection point is a parametric anchor defined by{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs font-mono">edge</code> +{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs font-mono">ratio</code>.
        </p>
        <p>
          Resizing the RTU body (e.g. wider unit footprint) preserves all port positions at
          their correct proportional location along each edge — no manual adjustment required.
        </p>
        <p>
          When a duct connects to a port, the port marker shape and the curb opening width
          adapt to match the duct's cross-section (round → circle, rectangular → rect).
        </p>
      </div>
    </div>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────

export default function RTUPlanSymbolPreview() {
  const [showLabels,     setShowLabels]     = useState(true);
  const [highlightedPort, setHighlightedPort] = useState(null);

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-950">
      <div className="mx-auto max-w-[1680px] overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl">

        {/* ── Header ── */}
        <div className="grid grid-cols-[1.5fr_1fr_1fr] border-b border-slate-200">

          {/* Title */}
          <div className="p-6">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">
              SizeWise · Equipment Plan Symbol
            </p>
            <h1 className="text-4xl font-black tracking-tight text-[#0F2747]">
              RTU
            </h1>
            <p className="mt-1 text-xl font-bold text-slate-500">
              Rooftop Unit · Plan View Symbol
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Parametric, placeable symbol with typed connection ports and adaptive
              magnetic connection. Hover a legend item to highlight the matching port.
            </p>
          </div>

          {/* Legend */}
          <div className="border-l border-slate-200 p-6">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
              Port Legend
            </p>
            <div className="space-y-1">
              <LegendItem role="supply"      label="Supply Air (out)"    onHover={setHighlightedPort} onLeave={() => setHighlightedPort(null)} />
              <LegendItem role="return"      label="Return Air (in)"     onHover={setHighlightedPort} onLeave={() => setHighlightedPort(null)} />
              <LegendItem role="outdoor_air" label="Outdoor Air (in)"    onHover={setHighlightedPort} onLeave={() => setHighlightedPort(null)} />
              <LegendItem role="exhaust"     label="Exhaust (out)"       onHover={setHighlightedPort} onLeave={() => setHighlightedPort(null)} />
              <LegendItem role="relief"      label="Relief Air (out)"    onHover={setHighlightedPort} onLeave={() => setHighlightedPort(null)} />
              <LegendItem role="inline"      label="Inline / Bidirec."   onHover={setHighlightedPort} onLeave={() => setHighlightedPort(null)} />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col justify-center gap-4 border-l border-slate-200 p-6">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Flow Direction Key
            </p>
            <div className="space-y-2 text-sm font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-base">▶</span> Exits unit / outward
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">◀</span> Enters unit / inward
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">↔</span> Bidirectional
              </div>
            </div>
            <button
              onClick={() => setShowLabels((v) => !v)}
              className="mt-2 rounded-lg bg-[#0F2747] px-4 py-3 text-sm font-black text-white transition-colors hover:bg-[#1a3a6b]"
            >
              {showLabels ? "Hide Port Labels" : "Show Port Labels"}
            </button>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="grid grid-cols-[0.9fr_1.2fr] gap-6 p-6">

          {/* Left — SVG canvas */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <svg
                width="760" height="680"
                viewBox="0 0 760 680"
                className="block w-full"
              >
                <defs>
                  <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(15,23,42,0.04)" strokeWidth="1" />
                  </pattern>
                  <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                    <rect width="100" height="100" fill="url(#smallGrid)" />
                    <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="760" height="680" fill="#FAFAFA" />
                <rect width="760" height="680" fill="url(#grid)" />
                <RTUPreview
                  showLabels={showLabels}
                  highlightedPort={highlightedPort}
                />
              </svg>
            </div>
            <NotesPanel />
          </div>

          {/* Right — data panels */}
          <div className="space-y-5">
            <ConnectionTable />
            <PortDataPanel />
            <ImplementationRule />

            {/* Abbreviations */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black tracking-wide text-slate-800">
                ABBREVIATIONS
              </div>
              <div className="grid grid-cols-3 gap-x-4 gap-y-2 p-4 text-sm text-slate-700">
                {[
                  ["RTU",  "Rooftop Unit"],
                  ["SA",   "Supply Air"],
                  ["RA",   "Return Air"],
                  ["OA",   "Outdoor Air"],
                  ["EXH",  "Exhaust Air"],
                  ["COMP", "Compressor"],
                  ["ECON", "Economizer"],
                  ["COND", "Condenser"],
                  ["REL",  "Relief Air"],
                ].map(([abbr, def]) => (
                  <div key={abbr}>
                    <strong className="text-slate-900">{abbr}</strong>
                    <span className="text-slate-500"> — {def}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
