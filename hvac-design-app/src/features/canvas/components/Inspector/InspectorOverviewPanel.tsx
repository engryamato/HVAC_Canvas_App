'use client';

import React, { useMemo, useRef, useState } from 'react';
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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type {
  ActivityItem,
  DuctSystem,
  DuctSystemStatus,
  ElementSelectionKey,
  HealthItem,
  InspectorPanelProps,
  InspectorSectionState,
} from './inspectorOverviewTypes';

type SectionId = 'project' | 'engineering' | 'health' | 'systems' | 'elements' | 'activity';
type IconComponent = LucideIcon;
type ActionVariant = 'subtle' | 'primary' | 'warn' | 'ghost';

const SYSTEM_CONFIG: Record<
  string,
  {
    dot: string;
    status_balanced?: string;
    status_unbalanced?: string;
    status_not_calculated?: string;
  }
> = {
  Supply: {
    dot: 'bg-blue-500',
    status_balanced: 'text-blue-700 bg-blue-50',
    status_unbalanced: 'text-rose-700 bg-rose-50',
    status_not_calculated: 'text-slate-500 bg-slate-100',
  },
  Return: {
    dot: 'bg-emerald-500',
    status_balanced: 'text-emerald-700 bg-emerald-50',
    status_unbalanced: 'text-rose-700 bg-rose-50',
    status_not_calculated: 'text-slate-500 bg-slate-100',
  },
  Exhaust: {
    dot: 'bg-rose-500',
    status_balanced: 'text-emerald-700 bg-emerald-50',
    status_unbalanced: 'text-rose-700 bg-rose-50',
    status_not_calculated: 'text-slate-500 bg-slate-100',
  },
  'Outside Air': {
    dot: 'bg-teal-500',
    status_balanced: 'text-emerald-700 bg-emerald-50',
    status_unbalanced: 'text-rose-700 bg-rose-50',
    status_not_calculated: 'text-slate-500 bg-slate-100',
  },
};

const SYSTEM_STATUS_LABEL: Record<DuctSystemStatus, string> = {
  balanced: 'Balanced',
  unbalanced: 'Unbalanced',
  not_calculated: 'Not Calculated',
};

const ACTION_COLORS: Record<string, string> = {
  Added: 'text-emerald-700 bg-emerald-50',
  Moved: 'text-blue-700 bg-blue-50',
  Deleted: 'text-rose-700 bg-rose-50',
  Modified: 'text-amber-700 bg-amber-50',
};

const SECTION_TITLES: Record<SectionId, string> = {
  project: 'Project',
  engineering: 'Engineering',
  health: 'Model Health',
  systems: 'Systems',
  elements: 'Elements',
  activity: 'Recent Activity',
};

function AccordionBody({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.22s ease',
      }}
    >
      <div style={{ overflow: 'hidden' }}>
        <div className="border-t border-slate-100 px-4 py-3">{children}</div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  icon: Icon,
  summary,
  badge,
  isOpen,
  disabled = false,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  icon: IconComponent;
  summary: string;
  badge?: React.ReactNode;
  isOpen: boolean;
  disabled?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div ref={undefined} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={`inspector-section-${id}`}
        disabled={disabled}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Icon size={14} aria-hidden />
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
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <div id={`inspector-section-${id}`} role="region" aria-label={title} hidden={!isOpen}>
        <AccordionBody open={isOpen}>{children}</AccordionBody>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-0.5 py-1.5 text-sm">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="max-w-[165px] text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  variant = 'subtle',
  disabled = false,
}: {
  icon: IconComponent;
  label: string;
  onClick?: () => void;
  variant?: ActionVariant;
  disabled?: boolean;
}) {
  const base =
    'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';
  const styles: Record<ActionVariant, string> = {
    subtle: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    primary: 'bg-slate-900 text-white hover:bg-slate-800',
    warn: 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
      <Icon size={13} aria-hidden="true" />
      {label}
    </button>
  );
}

function RedoIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 14.9-6.7L21 13" />
    </svg>
  );
}

function SkeletonBlock() {
  return (
    <div className="space-y-2" aria-label="Loading inspector section">
      <div className="h-8 animate-pulse rounded-lg bg-slate-100" />
      <div className="h-8 animate-pulse rounded-lg bg-slate-100" />
      <div className="h-8 animate-pulse rounded-lg bg-slate-100" />
    </div>
  );
}

function SectionBodyState({ state, children }: { state?: InspectorSectionState; children: React.ReactNode }) {
  if (state?.loading) {
    return <SkeletonBlock />;
  }

  if (state?.error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
        <div className="font-semibold">Unable to load this section.</div>
        <div className="mt-1 text-xs">{state.error}</div>
        {state.onRetry ? (
          <button
            type="button"
            onClick={state.onRetry}
            className="mt-2 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  return <>{children}</>;
}

function ProjectSection({ data }: { data: InspectorPanelProps['project'] }) {
  return (
    <div className="space-y-2">
      <Group title="General">
        <Row label="Project Name" value={data.name} />
        <Row label="Description" value={data.description} />
        <Row label="Project Number" value={data.number} />
        <Row label="Client" value={data.client} />
        <Row label="Engineer" value={data.engineer} />
      </Group>
      <Group title="Metadata">
        <Row label="Created" value={data.created} />
        <Row label="Modified" value={data.modified} />
        <Row label="Version" value={data.version} />
        <Row label="Author" value={data.author} />
      </Group>
    </div>
  );
}

function EngineeringSection({
  data,
  onToggleAutoCalculate,
  onEditEngineeringSettings,
}: {
  data: InspectorPanelProps['engineering'];
  onToggleAutoCalculate: (nextValue: boolean) => void;
  onEditEngineeringSettings: () => void;
}) {
  return (
    <div className="space-y-2">
      <Group title="Standards">
        <Row label="Design Standard" value={data.designStandard} />
      </Group>
      <Group title="Units & Calculation">
        <Row label="Airflow" value={data.airflowUnits} />
        <Row label="Pressure" value={data.pressureUnits} />
        <Row label="Temperature" value={data.temperatureUnits} />
        <Row label="Safety Factors" value={data.safetyFactors} />

        <div className="flex items-center justify-between px-0.5 py-1.5 text-sm">
          <span className="text-slate-500">Auto Calculate</span>
          <button
            type="button"
            aria-label="Auto Calculate"
            aria-pressed={data.autoCalculate}
            onClick={() => onToggleAutoCalculate(!data.autoCalculate)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
              data.autoCalculate
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {data.autoCalculate ? <ToggleRight size={13} aria-hidden /> : <ToggleLeft size={13} aria-hidden />}
            {data.autoCalculate ? 'ON' : 'OFF'}
          </button>
        </div>
      </Group>
      <ActionBtn icon={Pencil} label="Edit Engineering Settings" variant="subtle" onClick={onEditEngineeringSettings} />
    </div>
  );
}

function HealthSection({
  items,
  onLocateHealthIssue,
  onSelectAllInvalid,
  onAutoFixGeometry,
}: {
  items: HealthItem[];
  onLocateHealthIssue: (issueId: string) => void;
  onSelectAllInvalid: () => void;
  onAutoFixGeometry: () => void;
}) {
  const warnings = items.filter((item) => item.status !== 'ok');
  const oks = items.filter((item) => item.status === 'ok');

  return (
    <div className="space-y-2">
      {warnings.length > 0 ? (
        <Group title="Issues">
          <div className="space-y-1.5">
            {warnings.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  {item.status === 'error' ? (
                    <AlertCircle size={13} className="shrink-0 text-red-500" aria-hidden="true" />
                  ) : (
                    <AlertTriangle size={13} className="shrink-0 text-amber-500" aria-hidden="true" />
                  )}
                  <span className="truncate text-xs font-medium text-slate-800">{item.label}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.count !== undefined ? (
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        item.status === 'error' ? 'text-red-600' : 'text-amber-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    aria-label={`Locate ${item.label} on canvas`}
                    onClick={() => onLocateHealthIssue(item.id)}
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
      ) : null}

      {oks.length > 0 ? (
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
      ) : null}

      <div className="grid grid-cols-2 gap-1.5">
        <ActionBtn
          icon={Crosshair}
          label="Select All Invalid"
          variant="warn"
          onClick={onSelectAllInvalid}
          disabled={warnings.length === 0}
        />
        <ActionBtn icon={Wrench} label="Auto-Fix Geometry" variant="subtle" onClick={onAutoFixGeometry} />
      </div>
    </div>
  );
}

function formatSystemValue(value: number | null, suffix: string, digits?: number) {
  if (value === null || value === undefined) {
    return '-';
  }
  const formatted = digits === undefined ? value.toLocaleString() : value.toFixed(digits);
  return `${formatted} ${suffix}`;
}

function SystemsSection({ systems }: { systems: DuctSystem[] }) {
  if (systems.length === 0) {
    return <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No duct systems yet.</div>;
  }

  return (
    <div className="space-y-2">
      {systems.map((sys) => {
        const cfg = SYSTEM_CONFIG[sys.name] ?? { dot: 'bg-slate-400' };
        const statusKey = `status_${sys.status}` as const;
        const statusColor = cfg[statusKey] ?? 'text-slate-500 bg-slate-100';
        const statusLabel = SYSTEM_STATUS_LABEL[sys.status] ?? sys.status;
        const designFlow = sys.status === 'not_calculated' ? '-' : formatSystemValue(sys.designAirflow, 'CFM');
        const pressureLoss = sys.status === 'not_calculated' ? '-' : formatSystemValue(sys.pressureLoss, 'in. w.g.', 2);

        return (
          <div key={sys.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} aria-hidden="true" />
                <span className="text-sm font-bold text-slate-900">{sys.name}</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor}`}>{statusLabel}</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {[
                ['Segments', sys.segmentCount],
                ['Length', `${sys.totalLength.toLocaleString()} ft`],
                ['Surface Area', `${sys.surfaceArea.toLocaleString()} sq ft`],
                ['Design Flow', designFlow],
                ['Pressure Loss', pressureLoss],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-[10px] text-slate-400">{label}</div>
                  <div className="text-xs font-semibold text-slate-800">{value}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ElementsSection({
  elements,
  onSelectElementType,
}: {
  elements: InspectorPanelProps['elements'];
  onSelectElementType: (type: ElementSelectionKey) => void;
}) {
  const InventoryRow = ({ label, count }: { label: ElementSelectionKey; count: number }) => (
    <button
      type="button"
      aria-label={`Select all ${label} on canvas (${count})`}
      onClick={() => onSelectElementType(label)}
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
        {(Object.entries(elements.inventory) as Array<[ElementSelectionKey, number]>).map(([label, count]) => (
          <InventoryRow key={label} label={label} count={count} />
        ))}
      </Group>
      <Group title="Breakdown">
        {(Object.entries(elements.breakdown) as Array<[ElementSelectionKey, number]>).map(([label, count]) => (
          <InventoryRow key={label} label={label} count={count} />
        ))}
      </Group>
    </div>
  );
}

function ActivitySection({
  items,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  items: ActivityItem[];
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-500">No changes yet.</div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => {
            const chipColor = ACTION_COLORS[item.action] ?? 'text-slate-600 bg-slate-100';
            return (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${chipColor}`}>{item.action}</span>
                    <span className="truncate text-xs font-medium text-slate-700">{item.type}</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">{item.target}</div>
                </div>
                <span className="shrink-0 text-[10px] tabular-nums text-slate-400">{item.time}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          aria-label="Undo last action"
          aria-disabled={!canUndo}
          disabled={!canUndo}
          onClick={onUndo}
        >
          <RotateCcw size={11} aria-hidden="true" />
          Undo
        </button>
        <div className="h-4 w-px bg-slate-200" aria-hidden="true" />
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          aria-label="Redo last undone action"
          aria-disabled={!canRedo}
          disabled={!canRedo}
          onClick={onRedo}
        >
          <RedoIcon size={11} />
          Redo
        </button>
      </div>
    </div>
  );
}

function getIssueCount(health: HealthItem[]) {
  return health
    .filter((item) => item.status !== 'ok')
    .reduce((sum, item) => sum + (item.count ?? 1), 0);
}

function getTotalObjects(elements: InspectorPanelProps['elements']) {
  return Object.values(elements.inventory).reduce((sum, count) => sum + count, 0);
}

function getSectionSummary(
  id: SectionId,
  props: InspectorPanelProps,
  issueCount: number,
  totalLength: number,
  totalAirflow: number
) {
  const state = props.sectionStates?.[id];
  if (state?.loading) {
    return 'Loading...';
  }
  if (state?.error) {
    return 'Error';
  }

  switch (id) {
    case 'project':
      return props.project.number === 'Not set' || props.project.number === '-' || props.project.number.trim() === ''
        ? props.project.name
        : `${props.project.name} - ${props.project.number}`;
    case 'engineering':
      return `${props.engineering.shortStandard} - Auto Calc ${props.engineering.autoCalculate ? 'ON' : 'OFF'}`;
    case 'health':
      return issueCount > 0 ? `${issueCount} issue${issueCount !== 1 ? 's' : ''} detected` : 'All checks passed';
    case 'systems':
      return `${props.systems.length} systems - ${totalLength.toLocaleString()} ft - ${(totalAirflow / 1000).toFixed(1)}k CFM`;
    case 'elements':
      return `${getTotalObjects(props.elements)} objects - ${props.elements.inventory.Ducts} ducts`;
    case 'activity':
      return `${props.recentActivity.length} recent changes`;
    default:
      return '';
  }
}

export function InspectorOverviewPanel(props: InspectorPanelProps) {
  const [openSections, setOpenSections] = useState<Partial<Record<SectionId, boolean>>>({});
  const healthRef = useRef<HTMLDivElement | null>(null);

  const issueCount = useMemo(() => getIssueCount(props.health), [props.health]);
  const totalLength = useMemo(
    () => props.systems.reduce((sum, system) => sum + system.totalLength, 0),
    [props.systems]
  );
  const totalAirflow = useMemo(
    () =>
      props.systems.reduce(
        (sum, system) => sum + (system.status === 'not_calculated' ? 0 : system.designAirflow ?? 0),
        0
      ),
    [props.systems]
  );

  const toggle = (id: SectionId) => setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  const isOpen = (id: SectionId) => Boolean(openSections[id]);
  const openHealth = () => {
    setOpenSections((prev) => ({ ...prev, health: true }));
    window.requestAnimationFrame(() => healthRef.current?.scrollIntoView({ block: 'nearest' }));
  };

  return (
    <aside aria-label="Inspector Panel" className="flex w-full flex-col overflow-hidden bg-white" style={{ height: '100%' }}>
      <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4">
        {issueCount > 0 ? (
          <button
            type="button"
            onClick={openHealth}
            aria-label={`${issueCount} model issues, tap to review`}
            className="mt-2.5 flex w-full items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left transition-colors hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            <AlertTriangle size={13} className="shrink-0 text-amber-600" aria-hidden="true" />
            <span className="text-xs font-semibold text-amber-800">{issueCount} model issues - tap to review</span>
          </button>
        ) : (
          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <CheckCircle2 size={13} className="shrink-0 text-emerald-600" aria-hidden="true" />
            <span className="text-xs font-semibold text-emerald-800">All checks passed</span>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        <Section
          id="project"
          title={SECTION_TITLES.project}
          icon={FileText}
          summary={getSectionSummary('project', props, issueCount, totalLength, totalAirflow)}
          disabled={props.sectionStates?.project?.loading}
          isOpen={isOpen('project')}
          onToggle={() => toggle('project')}
        >
          <SectionBodyState state={props.sectionStates?.project}>
            <ProjectSection data={props.project} />
          </SectionBodyState>
        </Section>

        <Section
          id="engineering"
          title={SECTION_TITLES.engineering}
          icon={Settings}
          summary={getSectionSummary('engineering', props, issueCount, totalLength, totalAirflow)}
          disabled={props.sectionStates?.engineering?.loading}
          badge={
            !props.engineering.autoCalculate ? (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700">
                Manual
              </span>
            ) : null
          }
          isOpen={isOpen('engineering')}
          onToggle={() => toggle('engineering')}
        >
          <SectionBodyState state={props.sectionStates?.engineering}>
            <EngineeringSection
              data={props.engineering}
              onToggleAutoCalculate={props.onToggleAutoCalculate}
              onEditEngineeringSettings={props.onEditEngineeringSettings}
            />
          </SectionBodyState>
        </Section>

        <div ref={healthRef}>
          <Section
            id="health"
            title={SECTION_TITLES.health}
            icon={ShieldCheck}
            summary={getSectionSummary('health', props, issueCount, totalLength, totalAirflow)}
            disabled={props.sectionStates?.health?.loading}
            badge={
              issueCount > 0 ? (
                <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                  {issueCount}
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  OK
                </span>
              )
            }
            isOpen={isOpen('health')}
            onToggle={() => toggle('health')}
          >
            <SectionBodyState state={props.sectionStates?.health}>
              <HealthSection
                items={props.health}
                onLocateHealthIssue={props.onLocateHealthIssue}
                onSelectAllInvalid={props.onSelectAllInvalid}
                onAutoFixGeometry={props.onAutoFixGeometry}
              />
            </SectionBodyState>
          </Section>
        </div>

        <Section
          id="systems"
          title={SECTION_TITLES.systems}
          icon={Activity}
          summary={getSectionSummary('systems', props, issueCount, totalLength, totalAirflow)}
          disabled={props.sectionStates?.systems?.loading}
          isOpen={isOpen('systems')}
          onToggle={() => toggle('systems')}
        >
          <SectionBodyState state={props.sectionStates?.systems}>
            <SystemsSection systems={props.systems} />
          </SectionBodyState>
        </Section>

        <Section
          id="elements"
          title={SECTION_TITLES.elements}
          icon={Box}
          summary={getSectionSummary('elements', props, issueCount, totalLength, totalAirflow)}
          disabled={props.sectionStates?.elements?.loading}
          isOpen={isOpen('elements')}
          onToggle={() => toggle('elements')}
        >
          <SectionBodyState state={props.sectionStates?.elements}>
            <ElementsSection elements={props.elements} onSelectElementType={props.onSelectElementType} />
          </SectionBodyState>
        </Section>

        <Section
          id="activity"
          title={SECTION_TITLES.activity}
          icon={Clock3}
          summary={getSectionSummary('activity', props, issueCount, totalLength, totalAirflow)}
          disabled={props.sectionStates?.activity?.loading}
          isOpen={isOpen('activity')}
          onToggle={() => toggle('activity')}
        >
          <SectionBodyState state={props.sectionStates?.activity}>
            <ActivitySection
              items={props.recentActivity}
              canUndo={props.canUndo}
              canRedo={props.canRedo}
              onUndo={props.onUndo}
              onRedo={props.onRedo}
            />
          </SectionBodyState>
        </Section>

        {props.actionStatus ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
            {props.actionStatus}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export default InspectorOverviewPanel;
