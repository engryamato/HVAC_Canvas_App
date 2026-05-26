import { useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Box,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Crosshair,
  FileText,
  Pencil,
  RotateCcw,
  Settings,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Wrench,
} from "lucide-react";

// ─── Config ───────────────────────────────────────────────────────────────────

const SYSTEM_CONFIG = {
  Supply:          { dot: "bg-blue-500",    status_balanced: "text-blue-700 bg-blue-50",    status_unbalanced: "text-rose-700 bg-rose-50",    status_not_calculated: "text-slate-500 bg-slate-100" },
  Return:          { dot: "bg-emerald-500", status_balanced: "text-emerald-700 bg-emerald-50", status_unbalanced: "text-rose-700 bg-rose-50", status_not_calculated: "text-slate-500 bg-slate-100" },
  Exhaust:         { dot: "bg-rose-500",    status_balanced: "text-emerald-700 bg-emerald-50", status_unbalanced: "text-rose-700 bg-rose-50", status_not_calculated: "text-slate-500 bg-slate-100" },
  "Outside Air":   { dot: "bg-teal-500",    status_balanced: "text-emerald-700 bg-emerald-50", status_unbalanced: "text-rose-700 bg-rose-50", status_not_calculated: "text-slate-500 bg-slate-100" },
};

const SYSTEM_STATUS_LABEL = {
  balanced:       "Balanced",
  unbalanced:     "Unbalanced",
  not_calculated: "Not Calculated",
};

const ACTION_COLORS = {
  Added:    "text-emerald-700 bg-emerald-50",
  Moved:    "text-blue-700 bg-blue-50",
  Deleted:  "text-rose-700 bg-rose-50",
  Modified: "text-amber-700 bg-amber-50",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_DATA = {
  project: {
    name:        "Hospital Level 2",
    description: "Level 2 HVAC duct layout for hospital renovation package.",
    number:      "SW-2026-0148",
    client:      "North Valley Medical Group",
    engineer:    "J. Razonable",
    created:     "May 20, 2026",
    modified:    "May 26, 2026, 6:42 AM",
    version:     "v0.1.0-preview",
    author:      "John Rey Razonable",
  },
  engineering: {
    designStandard: "SMACNA HVAC Duct Construction Standards",
    shortStandard:  "SMACNA",
    airflowUnits:   "CFM",
    pressureUnits:  "in. w.g.",
    temperatureUnits: "°F",
    safetyFactors:  "Default (SMACNA Baseline)",
    autoCalculate:  true,
  },
  health: [
    { id: "unconnected", status: "error",   label: "Unconnected Segments", count: 5 },
    { id: "transitions", status: "error",   label: "Invalid Transitions",   count: 2 },
    { id: "geometry",    status: "ok",      label: "Geometry Clean" },
    { id: "cycles",      status: "ok",      label: "No Cycles" },
    { id: "equipment",   status: "warning", label: "Missing Equipment",     count: 3 },
  ],
  systems: [
    { id: "supply",  name: "Supply",      segmentCount: 128, totalLength: 612, surfaceArea: 1864, designAirflow: 4200, pressureLoss: 0.42, status: "balanced"       },
    { id: "return",  name: "Return",      segmentCount: 34,  totalLength: 196, surfaceArea: 612,  designAirflow: 3800, pressureLoss: 0.38, status: "balanced"       },
    { id: "exhaust", name: "Exhaust",     segmentCount: 22,  totalLength: 144, surfaceArea: 438,  designAirflow: 850,  pressureLoss: 0.21, status: "unbalanced"     },
    { id: "oa",      name: "Outside Air", segmentCount: 15,  totalLength: 92,  surfaceArea: 280,  designAirflow: 620,  pressureLoss: 0.18, status: "not_calculated" },
  ],
  elements: {
    totalObjects: 148,
    inventory:  { Ducts: 69, Fittings: 54, Equipment: 7, Rooms: 25 },
    breakdown:  { Rectangular: 42, Round: 19, Flex: 8, Elbows: 31, Tees: 9, Reducers: 14 },
  },
  recentActivity: [
    { id: 1, action: "Added",    type: "Rect Duct",       target: "Segment #147",      time: "2 min ago"  },
    { id: 2, action: "Moved",    type: "Elbow",           target: "Fitting #23",       time: "11 min ago" },
    { id: 3, action: "Deleted",  type: "Room",            target: "Room 214",          time: "28 min ago" },
    { id: 4, action: "Modified", type: "Supply System",   target: "System Properties", time: "1 hr ago"   },
  ],
};

// ─── Primitives ───────────────────────────────────────────────────────────────

/**
 * Smooth height-to-auto accordion using the CSS grid rows trick.
 * Avoids the framer-motion `height: "auto"` interpolation bug.
 */
function AccordionBody({ open, children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 0.22s ease",
      }}
    >
      <div style={{ overflow: "hidden" }}>
        <div className="border-t border-slate-100 px-4 py-3">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Accordion section card.
 * All section state is lifted to the parent — no local open/close state here.
 */
function Section({ id, title, icon: Icon, summary, badge, isOpen, onToggle, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={`inspector-section-${id}`}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Icon size={14} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">{title}</span>
              {badge}
            </div>
            <div className="mt-0.5 truncate text-xs text-slate-500">{summary}</div>
          </div>
        </div>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <div id={`inspector-section-${id}`} role="region" aria-label={title}>
        <AccordionBody open={isOpen}>{children}</AccordionBody>
      </div>
    </div>
  );
}

/** Grouped sub-block inside a section */
function Group({ title, children }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

/** Standard read-only label → value row */
function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 px-0.5 py-1.5 text-sm">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="max-w-[165px] text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

/** Visually distinct CTA button — not styled as a data row */
function ActionBtn({ icon: Icon, label, onClick, variant = "subtle" }) {
  const base = "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors text-left";
  const styles = {
    subtle:  "bg-slate-100 text-slate-700 hover:bg-slate-200",
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    warn:    "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
    ghost:   "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles[variant]}`}>
      <Icon size={13} aria-hidden="true" />
      {label}
    </button>
  );
}

/** Redo icon (not in lucide-react at this version) */
function RedoIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 14.9-6.7L21 13" />
    </svg>
  );
}

// ─── Section: Project ─────────────────────────────────────────────────────────

function ProjectSection({ data }) {
  return (
    <div className="space-y-2">
      <Group title="General">
        <Row label="Project Name"   value={data.name} />
        <Row label="Description"    value={data.description} />
        <Row label="Project Number" value={data.number} />
        <Row label="Client"         value={data.client} />
        <Row label="Engineer"       value={data.engineer} />
      </Group>
      <Group title="Metadata">
        <Row label="Created"  value={data.created} />
        <Row label="Modified" value={data.modified} />
        <Row label="Version"  value={data.version} />
        <Row label="Author"   value={data.author} />
      </Group>
    </div>
  );
}

// ─── Section: Engineering ─────────────────────────────────────────────────────

function EngineeringSection({ data, autoCalc, onToggleAutoCalc }) {
  return (
    <div className="space-y-2">
      <Group title="Standards">
        <Row label="Design Standard" value={data.designStandard} />
      </Group>
      <Group title="Units &amp; Calculation">
        <Row label="Airflow"         value={data.airflowUnits} />
        <Row label="Pressure"        value={data.pressureUnits} />
        <Row label="Temperature"     value={data.temperatureUnits} />
        <Row label="Safety Factors"  value={data.safetyFactors} />

        {/* Inline toggle — the only interactive field in this section */}
        <div className="flex items-center justify-between px-0.5 py-1.5 text-sm">
          <span className="text-slate-500">Auto Calculate</span>
          <button
            type="button"
            aria-pressed={autoCalc}
            onClick={onToggleAutoCalc}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
              autoCalc
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {autoCalc ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
            {autoCalc ? "ON" : "OFF"}
          </button>
        </div>
      </Group>
      <ActionBtn icon={Pencil} label="Edit Engineering Settings" variant="subtle" />
    </div>
  );
}

// ─── Section: Model Health ────────────────────────────────────────────────────

function HealthSection({ items }) {
  const warnings = items.filter((i) => i.status !== "ok");
  const oks      = items.filter((i) => i.status === "ok");

  return (
    <div className="space-y-2">
      {warnings.length > 0 && (
        <Group title="Issues">
          <div className="space-y-1.5">
            {warnings.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {item.status === "error" ? (
                    <AlertCircle size={13} className="shrink-0 text-red-500" aria-hidden="true" />
                  ) : (
                    <AlertTriangle size={13} className="shrink-0 text-amber-500" aria-hidden="true" />
                  )}
                  <span className="truncate text-xs font-medium text-slate-800">{item.label}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.count !== undefined && (
                    <span className={`text-xs font-bold tabular-nums ${item.status === "error" ? "text-red-600" : "text-amber-600"}`}>
                      {item.count}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`Locate ${item.label} on canvas`}
                    className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-slate-200"
                  >
                    <Crosshair size={9} aria-hidden="true" />
                    Locate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Group>
      )}

      {oks.length > 0 && (
        <Group title="Passing">
          <div className="space-y-1">
            {oks.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2">
                <CheckCircle2 size={13} className="shrink-0 text-emerald-500" aria-hidden="true" />
                <span className="text-xs font-medium text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>
        </Group>
      )}

      <div className="grid grid-cols-2 gap-1.5">
        <ActionBtn icon={Crosshair} label="Select All Invalid" variant="warn" />
        <ActionBtn icon={Wrench}    label="Auto-Fix Geometry"  variant="subtle" />
      </div>
    </div>
  );
}

// ─── Section: Systems ─────────────────────────────────────────────────────────

function SystemsSection({ systems }) {
  return (
    <div className="space-y-2">
      {systems.map((sys) => {
        const cfg        = SYSTEM_CONFIG[sys.name] ?? { dot: "bg-slate-400" };
        const statusKey  = `status_${sys.status}`;
        const statusColor = cfg[statusKey] ?? "text-slate-500 bg-slate-100";
        const statusLabel = SYSTEM_STATUS_LABEL[sys.status] ?? sys.status;

        return (
          <div key={sys.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            {/* System header */}
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} aria-hidden="true" />
                <span className="text-sm font-bold text-slate-900">{sys.name}</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor}`}>
                {statusLabel}
              </span>
            </div>

            {/* Stats grid — 2 columns */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {[
                ["Segments",      sys.segmentCount],
                ["Length",        `${sys.totalLength.toLocaleString()} ft`],
                ["Surface Area",  `${sys.surfaceArea.toLocaleString()} ft²`],
                ["Design Flow",   `${sys.designAirflow.toLocaleString()} CFM`],
                ["Pressure Loss", `${sys.pressureLoss} in. w.g.`],
              ].map(([lbl, val]) => (
                <div key={lbl}>
                  <div className="text-[10px] text-slate-400">{lbl}</div>
                  <div className="text-xs font-semibold text-slate-800">{val}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section: Elements ───────────────────────────────────────────────────────

function ElementsSection({ elements }) {
  const { inventory, breakdown } = elements;

  const InventoryRow = ({ label, count }) => (
    <button
      type="button"
      aria-label={`Select all ${label} on canvas (${count})`}
      className="group flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-sm transition-colors hover:bg-white"
    >
      <span className="text-slate-500 group-hover:text-slate-800">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-semibold tabular-nums text-slate-900">{count}</span>
        <ArrowRight size={11} className="text-slate-300 transition-colors group-hover:text-slate-500" aria-hidden="true" />
      </div>
    </button>
  );

  return (
    <div className="space-y-2">
      <Group title="Inventory">
        {Object.entries(inventory).map(([label, count]) => (
          <InventoryRow key={label} label={label} count={count} />
        ))}
      </Group>
      <Group title="Breakdown">
        {Object.entries(breakdown).map(([label, count]) => (
          <InventoryRow key={label} label={label} count={count} />
        ))}
      </Group>
    </div>
  );
}

// ─── Section: Recent Activity ─────────────────────────────────────────────────

function ActivitySection({ items }) {
  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        {items.map((item) => {
          const chipColor = ACTION_COLORS[item.action] ?? "text-slate-600 bg-slate-100";
          return (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${chipColor}`}>
                    {item.action}
                  </span>
                  <span className="truncate text-xs font-medium text-slate-700">{item.type}</span>
                </div>
                <div className="mt-0.5 text-[10px] text-slate-400">{item.target}</div>
              </div>
              <span className="shrink-0 text-[10px] tabular-nums text-slate-400">{item.time}</span>
            </div>
          );
        })}
      </div>

      {/* Undo / Redo — standalone action bar, not buried in a sub-group */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-white"
          aria-label="Undo last action"
        >
          <RotateCcw size={11} aria-hidden="true" />
          Undo
        </button>
        <div className="h-4 w-px bg-slate-200" aria-hidden="true" />
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-white"
          aria-label="Redo last undone action"
        >
          <RedoIcon size={11} />
          Redo
        </button>
      </div>
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function InspectorPanel() {
  const data = MOCK_DATA;

  // All sections start collapsed — state lifted here, not inside Section
  const [openSections, setOpenSections] = useState({});
  const [autoCalc, setAutoCalc]         = useState(data.engineering.autoCalculate);

  const toggle = (id) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  const isOpen = (id) => !!openSections[id];

  // Derived values
  const issueCount = data.health
    .filter((h) => h.status !== "ok")
    .reduce((sum, h) => sum + (h.count ?? 1), 0);

  const totalLength   = data.systems.reduce((s, sys) => s + sys.totalLength, 0);
  const totalAirflow  = data.systems.reduce((s, sys) => s + sys.designAirflow, 0);

  return (
    <aside
      aria-label="Inspector Panel"
      className="flex w-full flex-col overflow-hidden bg-white"
      style={{ height: "100%" }}
    >

        {/* ── Header (non-scrolling) ──────────────────────────────── */}
        <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4">
          {/* Persistent health banner — always visible, taps into health section */}
          {issueCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                setOpenSections((prev) => ({ ...prev, health: true }));
                // In the real app, also scroll to the health section
              }}
              className="mt-2.5 flex w-full items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left transition-colors hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              <AlertTriangle size={13} className="shrink-0 text-amber-600" aria-hidden="true" />
              <span className="text-xs font-semibold text-amber-800">
                {issueCount} model issues · tap to review
              </span>
            </button>
          ) : (
            <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
              <CheckCircle2 size={13} className="shrink-0 text-emerald-600" aria-hidden="true" />
              <span className="text-xs font-semibold text-emerald-800">All checks passed</span>
            </div>
          )}
        </div>

        {/* ── Scrollable section list ─────────────────────────────── */}
        <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">

          {/* Project */}
          <Section
            id="project"
            title="Project"
            icon={FileText}
            summary={`${data.project.name} · ${data.project.number}`}
            isOpen={isOpen("project")}
            onToggle={() => toggle("project")}
          >
            <ProjectSection data={data.project} />
          </Section>

          {/* Engineering */}
          <Section
            id="engineering"
            title="Engineering"
            icon={Settings}
            summary={`${data.engineering.shortStandard} · Auto Calc ${autoCalc ? "ON" : "OFF"}`}
            badge={
              !autoCalc && (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700">
                  Manual
                </span>
              )
            }
            isOpen={isOpen("engineering")}
            onToggle={() => toggle("engineering")}
          >
            <EngineeringSection
              data={data.engineering}
              autoCalc={autoCalc}
              onToggleAutoCalc={() => setAutoCalc((v) => !v)}
            />
          </Section>

          {/* Model Health */}
          <Section
            id="health"
            title="Model Health"
            icon={ShieldCheck}
            summary={
              issueCount > 0
                ? `${issueCount} issue${issueCount !== 1 ? "s" : ""} detected`
                : "All checks passed"
            }
            badge={
              issueCount > 0 ? (
                <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                  {issueCount}
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  ✓
                </span>
              )
            }
            isOpen={isOpen("health")}
            onToggle={() => toggle("health")}
          >
            <HealthSection items={data.health} />
          </Section>

          {/* Systems */}
          <Section
            id="systems"
            title="Systems"
            icon={Activity}
            summary={`${data.systems.length} systems · ${totalLength.toLocaleString()} ft · ${(totalAirflow / 1000).toFixed(1)}k CFM`}
            isOpen={isOpen("systems")}
            onToggle={() => toggle("systems")}
          >
            <SystemsSection systems={data.systems} />
          </Section>

          {/* Elements */}
          <Section
            id="elements"
            title="Elements"
            icon={Box}
            summary={`${data.elements.totalObjects} objects · ${data.elements.inventory.Ducts} ducts`}
            isOpen={isOpen("elements")}
            onToggle={() => toggle("elements")}
          >
            <ElementsSection elements={data.elements} />
          </Section>

          {/* Recent Activity */}
          <Section
            id="activity"
            title="Recent Activity"
            icon={Clock3}
            summary={`${data.recentActivity.length} recent changes`}
            isOpen={isOpen("activity")}
            onToggle={() => toggle("activity")}
          >
            <ActivitySection items={data.recentActivity} />
          </Section>

        </div>

      </aside>
  );
}
