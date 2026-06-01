'use client';

import React from 'react';
import type { DuctRun, Entity, Fitting, FittingPort } from '@/core/schema';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '../store/selectionStore';
import { useSystemCalculations } from '../hooks/useSystemCalculations';
import {
  calculateSelectedDuctRunBranch,
  calculateSelectedDuctRunSegments,
  type SelectedDuctRunBranchCalculation,
  type SelectedDuctRunSectionCalculation,
} from '../services/ductRunSectionCalculations';

export const CalculationsPanel: React.FC = () => {
  const { totalCFM, maxStaticPressure, totalDuctLength, totalDuctWeight } = useSystemCalculations();
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const selectedSegments = useSelectionStore((state) => state.selectedSegments);
  const entities = useEntityStore((state) => state.byId);
  const selectedEntity = selectedIds.length === 1 ? entities[selectedIds[0] ?? ''] : undefined;
  const selectedDuctRuns = selectedIds
    .map((id) => entities[id])
    .filter((entity): entity is DuctRun => entity?.type === 'duct_run');
  const selectedBranchCalculation =
    selectedIds.length > 1 && selectedDuctRuns.length === selectedIds.length
      ? calculateSelectedDuctRunBranch(selectedDuctRuns)
      : undefined;

  return (
    <div className="flex flex-col gap-4 p-4 text-sm text-slate-700">
      {selectedIds.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">
          Select a duct run or fitting to see its engineering values.
        </div>
      ) : null}

      {selectedBranchCalculation ? <SelectedDuctRunBranchCard branchCalculation={selectedBranchCalculation} /> : null}
      {!selectedBranchCalculation && selectedEntity?.type === 'duct_run' ? (
        <SelectedDuctRunCard
          run={selectedEntity as DuctRun}
          segmentCalculation={calculateSelectedDuctRunSegments(selectedEntity as DuctRun, selectedSegments)}
        />
      ) : null}
      {selectedEntity?.type === 'fitting' ? <SelectedFittingCard fitting={selectedEntity as Fitting} entities={entities} /> : null}

      <div className="rounded-md border p-3 bg-slate-50">
        <h4 className="font-semibold mb-2 text-slate-900 border-b pb-1">System Totals</h4>
        
        <div className="grid grid-cols-2 gap-y-2">
          <span className="text-slate-500">Total Airflow:</span>
          <span className="text-right font-medium">{totalCFM.toLocaleString()} CFM</span>

          <span className="text-slate-500">Max ESP:</span>
          <span className="text-right font-medium">{maxStaticPressure.toFixed(2)} in.wg</span>
        </div>
      </div>

      <div className="rounded-md border p-3 bg-slate-50">
        <h4 className="font-semibold mb-2 text-slate-900 border-b pb-1">Material Estimates</h4>
        
        <div className="grid grid-cols-2 gap-y-2">
          <span className="text-slate-500">Total Duct Length:</span>
          <span className="text-right font-medium">{totalDuctLength} ft</span>

          <span className="text-slate-500">Approx. Weight:</span>
          <span className="text-right font-medium">{totalDuctWeight} lbs</span>
        </div>
      </div>

      <div className="text-xs text-slate-400 mt-2 text-center">
        Values update automatically as you design.
      </div>
    </div>
  );
};

function SelectedDuctRunBranchCard({
  branchCalculation,
}: {
  branchCalculation: SelectedDuctRunBranchCalculation;
}) {
  return (
    <div className="rounded-md border border-blue-100 p-3 bg-blue-50/40">
      <h4 className="font-semibold mb-2 text-blue-700 border-b border-blue-100 pb-1">
        {branchCalculation.title}
      </h4>
      <CalculationRow label="Branch Length" value={formatLength(branchCalculation.selectedLength)} />
      <CalculationRow label="Airflow" value={formatNumber(branchCalculation.aggregateAirflow, ' CFM', 0)} />
      <CalculationRow
        label="Selected Pressure Loss"
        value={formatNumber(branchCalculation.aggregatePressureLoss, ' in.wg', 2)}
      />
      <CalculationRow
        label="Available Static Pressure"
        value={formatNumber(branchCalculation.terminalAvailableStaticPressure, ' in.wg', 2)}
      />
    </div>
  );
}

function SelectedDuctRunCard({
  run,
  segmentCalculation,
}: {
  run: DuctRun;
  segmentCalculation?: SelectedDuctRunSectionCalculation;
}) {
  const representativeSection = segmentCalculation?.sections[0];
  const airflow = representativeSection?.airflow ?? run.props.airflow;
  const velocity = representativeSection?.velocity ?? run.calculated.velocity;

  return (
    <div className="rounded-md border border-blue-100 p-3 bg-blue-50/40">
      <h4 className="font-semibold mb-2 text-blue-700 border-b border-blue-100 pb-1">
        {segmentCalculation?.title ?? 'Selected Section'}
      </h4>
      {segmentCalculation ? (
        <>
          <CalculationRow label="Section Length" value={formatLength(segmentCalculation.selectedLength)} />
          <CalculationRow
            label="Station Range"
            value={`${formatLengthValue(segmentCalculation.stationStart)} - ${formatLengthValue(segmentCalculation.stationEnd)} ft`}
          />
        </>
      ) : null}
      <CalculationRow label="Airflow" value={formatNumber(airflow, ' CFM', 0)} />
      <CalculationRow label="Velocity" value={formatNumber(velocity, ' FPM', 0)} />
      <CalculationRow label="Friction Rate" value={formatNumber(run.calculated.frictionLoss, ' in.wg/100ft', 2)} />
      {segmentCalculation ? (
        <CalculationRow label="Selected Pressure Loss" value={formatNumber(segmentCalculation.aggregatePressureLoss, ' in.wg', 2)} />
      ) : null}
      <CalculationRow
        label="Cumulative Pressure Drop"
        value={formatNumber(segmentCalculation?.cumulativePressureDrop ?? run.calculated.cumulativePressureDrop, ' in.wg', 2)}
      />
      <CalculationRow
        label="Available Static Pressure"
        value={formatNumber(segmentCalculation?.availableStaticPressure ?? run.calculated.availableStaticPressure, ' in.wg', 2)}
      />
    </div>
  );
}

function SelectedFittingCard({ fitting, entities }: { fitting: Fitting; entities: Record<string, Entity> }) {
  const ports = fitting.props.ports ?? [];
  const entering = ports.filter((port) => port.direction === 'in');
  const exiting = ports.filter((port) => port.direction === 'out');
  const hasPorts = ports.length > 0;

  return (
    <div className="rounded-md border border-blue-100 p-3 bg-blue-50/40">
      <h4 className="font-semibold mb-2 text-blue-700 border-b border-blue-100 pb-1">Selected Fitting</h4>
      <PortSection title="Entering" ports={hasPorts ? entering : []} entities={entities} />
      <PortSection title="Exiting" ports={hasPorts ? exiting : []} entities={entities} />
      {!hasPorts ? <CalculationRow label="Ports" value="-" /> : null}
      <div className="mt-2 border-t border-blue-100 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Pressure
      </div>
      <CalculationRow label="Fitting Loss" value={formatNumber(fitting.calculated.pressureLoss, ' in.wg', 2)} />
      <CalculationRow label="Cumulative Pressure Drop" value={formatNumber(fitting.calculated.cumulativePressureDrop, ' in.wg', 2)} />
      <CalculationRow label="Available Static Pressure" value={formatNumber(fitting.calculated.availableStaticPressure, ' in.wg', 2)} />
    </div>
  );
}

function PortSection({
  title,
  ports,
  entities,
}: {
  title: string;
  ports: FittingPort[];
  entities: Record<string, Entity>;
}) {
  if (ports.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="border-t border-blue-100 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      {ports.map((port) => {
        const connected = entities[port.connectedDuctRunId];
        const airflow = connected?.type === 'duct_run' ? connected.props.airflow : undefined;
        return <CalculationRow key={port.id} label={formatPortRole(port.role)} value={formatNumber(airflow, ' CFM', 0)} />;
      })}
    </div>
  );
}

function CalculationRow({ label, value }: { label: string; value: string }) {
  const isUnavailable = value === '-';

  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 py-1">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right font-medium ${isUnavailable ? 'text-slate-400 font-normal' : 'text-slate-900'}`}>
        {value}
      </span>
    </div>
  );
}

function formatNumber(value: number | undefined, suffix: string, decimals: number): string {
  if (value === undefined || !Number.isFinite(value)) {
    return '-';
  }

  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix}`;
}

function formatLength(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return '-';
  }

  return `${formatLengthValue(value)} ft`;
}

function formatLengthValue(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatPortRole(role: FittingPort['role']): string {
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
