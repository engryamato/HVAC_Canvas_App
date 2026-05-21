/**
 * DuctPropertiesPanelSample.jsx
 *
 * PROTOTYPE — right-sidebar properties panel for a selected duct.
 *
 * New in this design vs. the existing DuctInspector:
 *   • Size steppers (+ / −) for diameter / width / height
 *   • Shape pill-toggle instead of a dropdown
 *   • Insulation section with on/off toggle → type & thickness controls
 *   • End Types section (Start End / Finish End) using schema values
 *   • Length field retained as a numeric input (continuous value)
 *
 * This file is self-contained with local useState — no store wiring — so it
 * can be rendered anywhere for review. Wire it to the real entity store when
 * graduating to production.
 *
 * Schema references:
 *   InsulationType : 'liner' | 'wrap' | 'double_wall_perforated' | 'double_wall_non_perforated'
 *   DuctEndType    : 'flange' | 'raw' | 'crimped' | 'coupled'
 */

import { useState } from 'react';
import { Minus, Plus, Ruler, Layers, ArrowRightToLine, ArrowLeftToLine } from 'lucide-react';

// ─── Design-system atoms (mirror DuctInspector sub-components) ────────────

function Card({ children, className = '' }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, children }) {
  return (
    <div className="mb-3 flex items-center gap-1.5">
      {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</h4>
    </div>
  );
}

function PropertyField({ label, htmlFor, helperText, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {helperText && <p className="text-xs text-slate-400">{helperText}</p>}
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────
/**
 * Increment / decrement control. Good for discrete duct dimensions where
 * typing a raw number is error-prone. Keeps values within [min, max].
 */
function Stepper({ id, value, min, max, step = 1, unit = 'in', onChange }) {
  const canDec = value > min;
  const canInc = value < max;

  return (
    <div
      id={id}
      className="flex items-center overflow-hidden rounded-md border border-slate-200 bg-white"
      role="group"
      aria-label={`${unit} stepper`}
    >
      {/* Decrement */}
      <button
        type="button"
        onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}
        disabled={!canDec}
        aria-label="Decrease"
        className="flex h-9 w-10 shrink-0 items-center justify-center text-slate-500
                   hover:bg-slate-100 active:bg-slate-200
                   disabled:cursor-not-allowed disabled:opacity-35
                   transition-colors border-r border-slate-200"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      {/* Value display */}
      <div className="flex flex-1 items-baseline justify-center gap-0.5 px-2 py-2 select-none">
        <span className="text-sm font-semibold tabular-nums text-slate-900">{value}</span>
        <span className="text-xs text-slate-400">{unit}</span>
      </div>

      {/* Increment */}
      <button
        type="button"
        onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))}
        disabled={!canInc}
        aria-label="Increase"
        className="flex h-9 w-10 shrink-0 items-center justify-center text-slate-500
                   hover:bg-slate-100 active:bg-slate-200
                   disabled:cursor-not-allowed disabled:opacity-35
                   transition-colors border-l border-slate-200"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Pill shape toggle ────────────────────────────────────────────────────
function ShapeToggle({ value, onChange }) {
  return (
    <div
      className="flex rounded-md border border-slate-200 bg-slate-100 p-0.5"
      role="radiogroup"
      aria-label="Duct shape"
    >
      {['round', 'rectangular'].map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          onClick={() => onChange(s)}
          className={`flex-1 rounded py-1.5 text-xs font-medium transition-all
            ${value === s
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </button>
      ))}
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full
                  border-2 border-transparent transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                  ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform
                    ${checked ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  );
}

// ─── Native select (matches ValidatedInput select style) ──────────────────
function NativeSelect({ id, value, onChange, options }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm
                 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500
                 focus:border-blue-500 cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────

const INSULATION_TYPE_OPTIONS = [
  { value: 'liner',                    label: 'Duct Liner' },
  { value: 'wrap',                     label: 'Fiberglass Wrap' },
  { value: 'double_wall_perforated',   label: 'Double Wall – Perforated' },
  { value: 'double_wall_non_perforated', label: 'Double Wall – Non-Perf.' },
];

const END_TYPE_OPTIONS = [
  { value: 'flange',  label: 'Flange (TDC / TDF)' },
  { value: 'raw',     label: 'Raw / Open' },
  { value: 'crimped', label: 'Crimped' },
  { value: 'coupled', label: 'Coupled' },
];

// ─── Main panel ───────────────────────────────────────────────────────────

export default function DuctPropertiesPanelSample() {
  // ── Mock duct state (replace with entity store in production) ────────────
  const [shape,               setShape]               = useState('round');
  const [diameter,            setDiameter]            = useState(12);
  const [width,               setWidth]               = useState(12);
  const [height,              setHeight]              = useState(8);
  const [length,              setLength]              = useState(10.0);
  const [insulated,           setInsulated]           = useState(true);
  const [insulationType,      setInsulationType]      = useState('wrap');
  const [insulationThickness, setInsulationThickness] = useState(1.5);
  const [startEndType,        setStartEndType]        = useState('flange');
  const [endEndType,          setEndEndType]          = useState('flange');

  const isRound       = shape === 'round';
  const aspectRatio   = width / height;
  const aspectWarning = !isRound && aspectRatio > 4;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* ── Header card ─────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="mb-1 block text-xs font-medium text-slate-500">Name</span>
            {/* In production: replace with ValidatedInput */}
            <p className="truncate text-sm font-semibold text-slate-900">Supply Main – Trunk A</p>
          </div>
          <span
            className={`mt-4 inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5
                        text-xs font-medium ring-1
                        ${isRound
                          ? 'bg-blue-50 text-blue-700 ring-blue-200'
                          : 'bg-purple-50 text-purple-700 ring-purple-200'}`}
          >
            {isRound ? 'Round' : 'Rectangular'}
          </span>
        </div>
      </Card>

      {/* ── Dimensions ──────────────────────────────────────────────────── */}
      <Card>
        <SectionHeader icon={Ruler}>Dimensions</SectionHeader>

        {/* Shape toggle — pill style so it's always visible */}
        <div className="mb-4">
          <ShapeToggle value={shape} onChange={setShape} />
        </div>

        <div className="flex flex-col gap-3">

          {/* Size steppers */}
          {isRound ? (
            <PropertyField
              label="Diameter"
              htmlFor="duct-diameter"
              helperText="Adjusts in 1 in. standard increments (SMACNA range: 4–60 in.)"
            >
              <Stepper
                id="duct-diameter"
                value={diameter}
                min={4}
                max={60}
                step={1}
                unit="in"
                onChange={setDiameter}
              />
            </PropertyField>
          ) : (
            <>
              <PropertyField label="Width" htmlFor="duct-width">
                <Stepper
                  id="duct-width"
                  value={width}
                  min={4}
                  max={96}
                  step={2}
                  unit="in"
                  onChange={setWidth}
                />
              </PropertyField>

              <PropertyField label="Height" htmlFor="duct-height">
                <Stepper
                  id="duct-height"
                  value={height}
                  min={4}
                  max={96}
                  step={2}
                  unit="in"
                  onChange={setHeight}
                />
              </PropertyField>

              {/* Aspect ratio inline hint */}
              <div
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs
                            ${aspectWarning
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-slate-100 bg-slate-50 text-slate-500'}`}
              >
                <span>
                  Aspect ratio:{' '}
                  <span className="font-medium text-slate-700">{aspectRatio.toFixed(1)} : 1</span>
                </span>
                {aspectWarning && (
                  <span className="font-semibold">⚠ Exceeds SMACNA 4 : 1 limit</span>
                )}
              </div>
            </>
          )}

          {/* Length — continuous value; number input is appropriate here */}
          <PropertyField
            label="Length"
            htmlFor="duct-length"
            helperText="Installed duct length in feet"
          >
            <div className="flex items-center gap-2">
              <input
                id="duct-length"
                type="number"
                min={0.1}
                max={1000}
                step={0.5}
                value={length}
                onChange={(e) => setLength(+e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-2
                           text-sm text-slate-900 focus:outline-none focus:ring-2
                           focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="shrink-0 text-sm text-slate-400">ft</span>
            </div>
          </PropertyField>

        </div>
      </Card>

      {/* ── Insulation ──────────────────────────────────────────────────── */}
      <Card>
        {/* Header row: title + on/off toggle */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Insulation
            </h4>
          </div>
          <ToggleSwitch
            checked={insulated}
            onChange={setInsulated}
            label="Toggle insulation"
          />
        </div>

        {insulated ? (
          <div className="flex flex-col gap-3">
            <PropertyField label="Insulation Type" htmlFor="ins-type">
              <NativeSelect
                id="ins-type"
                value={insulationType}
                onChange={setInsulationType}
                options={INSULATION_TYPE_OPTIONS}
              />
            </PropertyField>

            <PropertyField
              label="Thickness"
              htmlFor="ins-thickness"
              helperText="Adjusts in 0.5 in. increments (range: 0.5–6 in.)"
            >
              <Stepper
                id="ins-thickness"
                value={insulationThickness}
                min={0.5}
                max={6}
                step={0.5}
                unit="in"
                onChange={setInsulationThickness}
              />
            </PropertyField>
          </div>
        ) : (
          <p className="text-xs text-slate-400">No insulation applied to this duct.</p>
        )}
      </Card>

      {/* ── End Types ───────────────────────────────────────────────────── */}
      <Card>
        <SectionHeader>End Types</SectionHeader>

        <div className="flex flex-col gap-3">

          {/* Start end */}
          <PropertyField label="Start End" htmlFor="end-start">
            <div className="flex items-center gap-2">
              <ArrowLeftToLine className="h-4 w-4 shrink-0 text-slate-400" />
              <NativeSelect
                id="end-start"
                value={startEndType}
                onChange={setStartEndType}
                options={END_TYPE_OPTIONS}
              />
            </div>
          </PropertyField>

          {/* Finish end */}
          <PropertyField label="Finish End" htmlFor="end-finish">
            <div className="flex items-center gap-2">
              <ArrowRightToLine className="h-4 w-4 shrink-0 text-slate-400" />
              <NativeSelect
                id="end-finish"
                value={endEndType}
                onChange={setEndEndType}
                options={END_TYPE_OPTIONS}
              />
            </div>
          </PropertyField>

          {/* Symmetric hint */}
          {startEndType === endEndType && (
            <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Both ends are{' '}
              <span className="font-medium text-slate-700">
                {END_TYPE_OPTIONS.find((o) => o.value === startEndType)?.label}
              </span>
              {' '}— symmetric connection.
            </div>
          )}
        </div>
      </Card>

    </div>
  );
}
