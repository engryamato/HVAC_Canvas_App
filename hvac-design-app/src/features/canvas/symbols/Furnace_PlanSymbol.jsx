import React, { useState } from "react";

/**
 * Furnace Plan Symbol — Vertical Upflow
 * ─────────────────────────────────────
 * Parametric, placeable plan-view symbol for a gas furnace.
 *
 * Layout (top → bottom):
 *   Supply collar  ← north port (discharge)
 *   ─────────────────────────────────────
 *   Louver / heat exchanger section
 *   ─────────────────────────────────────
 *   Burner compartment (flame symbol + access door)
 *   ─────────────────────────────────────
 *   Coil / heat exchanger section
 *   ─────────────────────────────────────
 *   Blower section (centrifugal wheel + access door)
 *   ─────────────────────────────────────
 *   Return air opening ← south port (intake)
 *
 *   West side → combustion air intake port
 *   East side → exhaust flue port
 *
 * Port system:
 *   Each port is defined by { role, edge, ratio } and is fully parametric —
 *   resizing the furnace body keeps all ports at the correct relative location.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const PORT_COLORS = {
  supply:         "#2E7D32",
  return:         "#1565C0",
  exhaust:        "#C62828",
  combustion_air: "#00838F",
  relief:         "#6A1B9A",
  inline:         "#757575",
};

const PORT_FLOW = {
  supply:         "out",
  return:         "in",
  exhaust:        "out",
  combustion_air: "in",
  relief:         "out",
  inline:         "both",
};

const EDGE_VECTOR = {
  north: { x: 0,  y: -1 },
  south: { x: 0,  y:  1 },
  east:  { x: 1,  y:  0 },
  west:  { x: -1, y:  0 },
};

// Furnace body dimensions and port definitions
const FURNACE = {
  type: "furnace",
  tag:  "FURN-1",
  name: "Furnace",
  w: 255,
  h: 430,
  ports: [
    {
      role:     "supply",
      edge:     "north",
      ratio:    0.5,
      label:    "SUPPLY AIR",
      subLabel: "OUT",
      note:     "Top discharge — connects to supply duct system",
    },
    {
      role:     "return",
      edge:     "south",
      ratio:    0.5,
      label:    "RETURN AIR",
      subLabel: "IN",
      note:     "Bottom return — near blower section",
    },
    {
      role:     "combustion_air",
      edge:     "west",
      ratio:    0.43,
      label:    "COMBUSTION AIR",
      subLabel: "IN",
      note:     "Side intake — near burner section",
    },
    {
      role:     "exhaust",
      edge:     "east",
      ratio:    0.43,
      label:    "EXHAUST FLUE",
      subLabel: "OUT",
      note:     "Side flue outlet — from burner compartment",
    },
  ],
};

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

  const isHorizontal = port.edge === "west" || port.edge === "east";
  const labelOffset    = isHorizontal ? 96 : 74;
  const subLabelOffset = isHorizontal ? 96 : 98;

  const labelX    = pos.x + edge.x * labelOffset;
  const labelY    = pos.y + edge.y * labelOffset;
  const subLabelX = pos.x + edge.x * subLabelOffset;
  const subLabelY = pos.y + edge.y * subLabelOffset + (isHorizontal ? 20 : 0);

  return (
    <g>
      {/* Highlight glow when hovered */}
      {highlighted && (
        <circle cx={pos.x} cy={pos.y} r="24" fill={color} opacity="0.15" />
      )}

      {/* Outer ring */}
      <circle
        cx={pos.x} cy={pos.y} r="17"
        fill="white"
        stroke={highlighted ? color : "#CBD5E1"}
        strokeWidth={highlighted ? 2 : 1.5}
      />
      {/* Inner filled dot */}
      <circle
        cx={pos.x} cy={pos.y} r="12"
        fill={color}
        stroke="white"
        strokeWidth="2"
      />
      {/* Flow direction arrow */}
      <ArrowTriangle cx={pos.x} cy={pos.y} dir={dir} color={color} />

      {/* Labels */}
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

/** Horizontal louver / heat exchanger fins */
function LouverPanel({ x, y, w, h, count = 7 }) {
  return (
    <g stroke="#111827" fill="none" strokeWidth="2" opacity="0.82">
      <rect x={x} y={y} width={w} height={h} />
      {Array.from({ length: count }).map((_, i) => {
        const yy = y + ((i + 1) * h) / (count + 1);
        return <line key={i} x1={x + 8} y1={yy} x2={x + w - 8} y2={yy} />;
      })}
    </g>
  );
}

/** Gas burner with flame symbol */
function BurnerFlame({ cx, cy, scale = 1 }) {
  return (
    <g
      stroke="#111827" fill="none" strokeWidth="2.3" opacity="0.9"
      transform={`translate(${cx}, ${cy}) scale(${scale})`}
    >
      {/* Compartment box */}
      <rect x="-42" y="-46" width="84" height="92" rx="3" />
      {/* Outer flame */}
      <path d="M 0 -30 C 18 -8 28 10 15 28 C 6 40 -12 38 -20 22 C -30 1 -8 -10 0 -30 Z" />
      {/* Inner flame */}
      <path d="M -2 -6 C 8 8 13 20 4 29 C -4 37 -16 29 -13 17 C -10 7 -4 3 -2 -6 Z" />
      {/* Burner stem */}
      <line x1="0" y1="46" x2="0" y2="60" />
    </g>
  );
}

/** Heat exchanger / coil cross-section */
function CoilSection({ x, y, w, h }) {
  return (
    <g stroke="#111827" fill="none" strokeWidth="2" opacity="0.85">
      <rect x={x} y={y} width={w} height={h} />
      {/* Primary coil diagonals */}
      <path d={`M ${x + 15} ${y + h - 15} L ${x + w - 15} ${y + 15}`} />
      <path d={`M ${x + 15} ${y + 15} L ${x + w - 15} ${y + h - 15}`} opacity="0.65" />
      {/* Coil serpentine curve */}
      <path
        d={`M ${x + 10} ${y + h * 0.5}
            C ${x + w * 0.28} ${y + h * 0.18},
              ${x + w * 0.72} ${y + h * 0.82},
              ${x + w - 10}   ${y + h * 0.5}`}
        opacity="0.65"
      />
    </g>
  );
}

/** Centrifugal blower wheel (plan view) */
function BlowerWheel({ cx, cy, r }) {
  return (
    <g stroke="#111827" fill="none" strokeWidth="2.2" opacity="0.9">
      {/* Housing */}
      <rect
        x={cx - r - 24} y={cy - r - 20}
        width={(r + 24) * 2} height={(r + 20) * 2}
        rx="3" opacity="0.75"
      />
      {/* Impeller rim */}
      <circle cx={cx} cy={cy} r={r} />
      {/* Hub */}
      <circle cx={cx} cy={cy} r={r * 0.17} fill="#111827" />
      {/* Blades — three swept paths */}
      <path d={`M ${cx} ${cy} C ${cx + r * 0.7}  ${cy - r * 0.95}, ${cx + r * 1.08} ${cy - r * 0.1},  ${cx + r * 0.32} ${cy + r * 0.2}`} />
      <path d={`M ${cx} ${cy} C ${cx - r * 1.05} ${cy - r * 0.25}, ${cx - r * 0.5}  ${cy - r * 0.95}, ${cx - r * 0.2}  ${cy - r * 0.35}`} />
      <path d={`M ${cx} ${cy} C ${cx - r * 0.25} ${cy + r * 1.08}, ${cx + r * 0.78} ${cy + r * 0.75}, ${cx + r * 0.24} ${cy + r * 0.28}`} />
    </g>
  );
}

/** Cylindrical flue outlet (perspective stub) */
function FlueOutlet({ cx, y }) {
  return (
    <g stroke="#111827" fill="white" strokeWidth="2.2">
      <ellipse cx={cx} cy={y}      rx="27" ry="9" />
      <rect    x={cx - 24} y={y}   width="48" height="42" />
      <ellipse cx={cx} cy={y + 42} rx="24"  ry="8" />
    </g>
  );
}

/** Supply air discharge collar / transition */
function SupplyCollar({ cx, y }) {
  return (
    <g stroke="#111827" fill="white" strokeWidth="2.2">
      {/* Collar flange */}
      <rect x={cx - 34} y={y - 6} width="68" height="22" rx="2" />
      {/* Transition cone */}
      <path d={`M ${cx - 24} ${y - 6} L ${cx} ${y - 31} L ${cx + 24} ${y - 6}`} fill="none" />
      {/* Duct stub */}
      <path d={`M ${cx} ${y - 31} V ${y - 57}`} />
      {/* Arrow chevron */}
      <path d={`M ${cx - 11} ${y - 44} L ${cx} ${y - 57} L ${cx + 11} ${y - 44}`} fill="none" />
    </g>
  );
}

/** Service access door with handle */
function AccessDoor({ x, y, w, h }) {
  return (
    <g stroke="#111827" fill="none" strokeWidth="1.8" opacity="0.7">
      <rect x={x} y={y} width={w} height={h} rx="4" />
      {/* Door handle */}
      <circle cx={x + w - 16} cy={y + h / 2} r="3" fill="#111827" />
    </g>
  );
}

// ─── Furnace Body Symbol ──────────────────────────────────────────────────────

/**
 * Draws the complete furnace plan body with all internal sections.
 * All coordinates are relative to box.{x, y} so the symbol is repositionable.
 */
function FurnaceBody({ box }) {
  const { x, y, w, h } = box;
  const cx = x + w / 2;

  // Section boundaries (y offsets within body)
  const TOP_SECTION_H    = 105;
  const BURNER_SECTION_H = 132;
  const COIL_SECTION_H   = 73;
  const BLOWER_SECTION_H = 78;

  const topY    = y + 22;
  const burnerY = topY    + TOP_SECTION_H + 5;    // y + 127
  const coilY   = burnerY + BURNER_SECTION_H;     // y + 259
  const blowerY = coilY   + COIL_SECTION_H;       // y + 332

  const INSET = 18;
  const sectionX = x + INSET;
  const sectionW = w - INSET * 2;

  return (
    <g>
      {/* ── Outer body ── */}
      <rect
        x={x} y={y} width={w} height={h} rx="4"
        fill="#FFFFFF" stroke="#111827" strokeWidth="2.5"
      />
      {/* Inner dashed margin line */}
      <rect
        x={x + 9} y={y + 9} width={w - 18} height={h - 18} rx="2"
        fill="none" stroke="#64748B" strokeWidth="1.4"
        strokeDasharray="7 7" opacity="0.55"
      />

      {/* ── Supply collar at top ── */}
      <SupplyCollar cx={cx} y={topY + 4} />

      {/* ── Top louver / intake section ── */}
      <LouverPanel
        x={sectionX + 18} y={topY + 22}
        w={sectionW - 36} h={TOP_SECTION_H - 44}
      />

      {/* Section divider */}
      <line x1={sectionX} y1={burnerY} x2={sectionX + sectionW} y2={burnerY} stroke="#111827" strokeWidth="2" />

      {/* ── Burner compartment ── */}
      <BurnerFlame
        cx={cx}
        cy={burnerY + BURNER_SECTION_H / 2 + 4}
        scale={0.88}
      />
      <AccessDoor
        x={x + 27} y={burnerY + 14}
        w={w - 54}  h={BURNER_SECTION_H - 28}
      />

      {/* Section divider */}
      <line x1={sectionX} y1={coilY} x2={sectionX + sectionW} y2={coilY} stroke="#111827" strokeWidth="2" />

      {/* ── Heat exchanger / coil section ── */}
      <CoilSection
        x={sectionX + 10} y={coilY + 10}
        w={sectionW - 20}  h={COIL_SECTION_H - 20}
      />

      {/* Section divider */}
      <line x1={sectionX} y1={blowerY} x2={sectionX + sectionW} y2={blowerY} stroke="#111827" strokeWidth="2" />

      {/* ── Blower section ── */}
      <BlowerWheel
        cx={cx}
        cy={blowerY + BLOWER_SECTION_H / 2}
        r={28}
      />
      <AccessDoor
        x={x + 27} y={blowerY + 10}
        w={w - 54}  h={BLOWER_SECTION_H - 20}
      />
    </g>
  );
}

// ─── Full Furnace Preview (symbol + tag + ports) ──────────────────────────────

function FurnacePreview({ showLabels, highlightedPort }) {
  const box = { x: 260, y: 130, w: FURNACE.w, h: FURNACE.h };
  const cx  = box.x + box.w / 2;
  const cy  = box.y + box.h / 2;

  return (
    <g>
      {/* Canvas title bar */}
      <rect x="20" y="20" width="310" height="36" rx="3" fill="#0F2747" />
      <text x="38" y="44" fontSize="17" fontWeight="900" fill="white" letterSpacing="0.5">
        FURNACE — VERTICAL UPFLOW (PLAN)
      </text>

      {/* Furnace body with internal sections */}
      <FurnaceBody box={box} />

      {/* Equipment tag (large) */}
      <text
        x={cx} y={cy - 14}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="26" fontWeight="900" fill="#020617"
        letterSpacing="-0.5"
      >
        {FURNACE.tag}
      </text>

      {/* Name badge */}
      <rect x={cx - 58} y={cy + 10} width="116" height="28" rx="5" fill="#111827" opacity="0.9" />
      <text
        x={cx} y={cy + 29}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="13" fontWeight="700" fill="#F8FAFC"
      >
        {FURNACE.name.toUpperCase()}
      </text>

      {/* Port markers */}
      {FURNACE.ports.map((port) => (
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
    { role: "supply",         label: "SUPPLY AIR",      subLabel: "OUT", airflow: "Exits unit",   location: "Top — discharge collar",             notes: "Heated air exits to supply duct system."             },
    { role: "return",         label: "RETURN AIR",      subLabel: "IN",  airflow: "Enters unit",  location: "Bottom — near blower section",        notes: "Return air enters from return duct system."           },
    { role: "exhaust",        label: "EXHAUST FLUE",    subLabel: "OUT", airflow: "Exits unit",   location: "East side — burner compartment",      notes: "Combustion gases vent outdoors via flue/stack."       },
    { role: "combustion_air", label: "COMBUSTION AIR",  subLabel: "IN",  airflow: "Enters unit",  location: "West side — near burner section",     notes: "Outside air drawn in for combustion at burner."       },
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
  { role: "supply",         edge: "north", ratio: 0.50 },
  { role: "return",         edge: "south", ratio: 0.50 },
  { role: "combustion_air", edge: "west",  ratio: 0.43 },
  { role: "exhaust",        edge: "east",  ratio: 0.43 },
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
    "Layout shown is typical for a vertical upflow furnace. Manufacturer configurations may vary.",
    "Supply connection at the top — heated air discharges upward into the supply duct system.",
    "Return connection at the bottom — near the blower section for direct air draw.",
    "Combustion air intake on the west side — near the burner section.",
    "Exhaust flue on the east side — opposite combustion air, from the burner compartment.",
    "Port locations remain editable to match manufacturer submittals and project-specific layout.",
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
          The furnace is a <strong className="text-slate-900">single placeable equipment object</strong>.
          Each connection point is a parametric anchor defined by <code className="rounded bg-slate-100 px-1 py-0.5 text-xs font-mono">edge</code> +{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs font-mono">ratio</code>.
        </p>
        <p>
          Resizing the furnace body preserves all port positions at their correct proportional location
          along each edge — no manual repositioning required.
        </p>
        <p>
          The default symbol is immediately usable on the canvas. Port positions can be overridden
          per-instance to match the actual manufacturer submittal or field conditions.
        </p>
      </div>
    </div>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────

export default function FurnacePlanSymbolPreview() {
  const [showLabels,    setShowLabels]    = useState(true);
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
              FURNACE
            </h1>
            <p className="mt-1 text-xl font-bold text-slate-500">
              Vertical Upflow · Plan View Symbol
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Parametric, placeable symbol with editable typed connection ports.
              Hover a legend item to highlight the matching port on the canvas.
            </p>
          </div>

          {/* Legend — hover to highlight port */}
          <div className="border-l border-slate-200 p-6">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
              Port Legend
            </p>
            <div className="space-y-1">
              <LegendItem role="supply"         label="Supply Air (out)"       onHover={setHighlightedPort} onLeave={() => setHighlightedPort(null)} />
              <LegendItem role="return"         label="Return Air (in)"        onHover={setHighlightedPort} onLeave={() => setHighlightedPort(null)} />
              <LegendItem role="exhaust"        label="Exhaust Flue (out)"     onHover={setHighlightedPort} onLeave={() => setHighlightedPort(null)} />
              <LegendItem role="combustion_air" label="Combustion Air (in)"    onHover={setHighlightedPort} onLeave={() => setHighlightedPort(null)} />
              <LegendItem role="relief"         label="Relief Air (out)"       onHover={setHighlightedPort} onLeave={() => setHighlightedPort(null)} />
              <LegendItem role="inline"         label="Inline / Bidirectional" onHover={setHighlightedPort} onLeave={() => setHighlightedPort(null)} />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col justify-center gap-4 border-l border-slate-200 p-6">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Flow Direction Key
            </p>
            <div className="space-y-2 text-sm font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-base">▶</span> Exits unit / outward airflow
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">◀</span> Enters unit / inward airflow
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">↔</span> Bidirectional / inline
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
                width="760" height="720"
                viewBox="0 0 760 720"
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
                {/* Background */}
                <rect width="760" height="720" fill="#FAFAFA" />
                <rect width="760" height="720" fill="url(#grid)" />
                {/* Furnace */}
                <FurnacePreview
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
                  ["FURN", "Furnace"],
                  ["SA",   "Supply Air"],
                  ["RA",   "Return Air"],
                  ["EA",   "Exhaust / Flue"],
                  ["CA",   "Combustion Air"],
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
