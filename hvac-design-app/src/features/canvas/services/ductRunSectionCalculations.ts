import type { DuctRun } from '@/core/schema';
import { calculateDuctArea, calculateVelocity } from '../calculators/ductSizing';
import type { SelectedSegment } from '../store/selectionStore';

export interface DuctRunSectionCalculation {
  segmentIndex: number;
  sectionNumber: number;
  isPartial: boolean;
  startStation: number;
  endStation: number;
  length: number;
  airflow: number;
  area: number;
  velocity: number;
  frictionRate: number;
  pressureLoss: number;
  cumulativePressureDrop: number;
  availableStaticPressure: number;
}

export interface SelectedDuctRunSectionCalculation {
  title: 'Selected Section' | 'Selected Sections';
  sections: DuctRunSectionCalculation[];
  selectedLength: number;
  stationStart: number;
  stationEnd: number;
  aggregatePressureLoss: number;
  cumulativePressureDrop: number;
  availableStaticPressure: number;
}

export interface SelectedDuctRunBranchRunCalculation {
  runId: string;
  name: string;
  length: number;
  airflow: number;
  area: number;
  velocity: number;
  frictionRate: number;
  pressureLoss: number;
  cumulativePressureDrop: number;
  availableStaticPressure: number;
}

export interface SelectedDuctRunBranchCalculation {
  title: 'Selected Branch';
  runs: SelectedDuctRunBranchRunCalculation[];
  selectedLength: number;
  aggregateAirflow: number;
  aggregatePressureLoss: number;
  maxAirflow: number;
  terminalAvailableStaticPressure: number;
}

export function calculateDuctRunSections(run: DuctRun): DuctRunSectionCalculation[] {
  const area = resolveArea(run);
  const airflow = resolveAirflow(run);
  const velocity = resolveVelocity(run, airflow, area);
  const frictionRate = run.calculated.frictionLoss;
  const sourceStaticPressure = resolveSourceStaticPressure(run);

  return run.props.segments.map((segment, index) => {
    const cumulativePressureDrop = calculatePressureLoss(frictionRate, segment.endStation);
    return {
      segmentIndex: segment.index,
      sectionNumber: index + 1,
      isPartial: segment.isPartial,
      startStation: segment.startStation,
      endStation: segment.endStation,
      length: segment.length,
      airflow,
      area,
      velocity,
      frictionRate,
      pressureLoss: calculatePressureLoss(frictionRate, segment.length),
      cumulativePressureDrop,
      availableStaticPressure: round(Math.max(0, sourceStaticPressure - cumulativePressureDrop)),
    };
  });
}

export function calculateSelectedDuctRunSegments(
  run: DuctRun,
  selectedSegments: SelectedSegment[]
): SelectedDuctRunSectionCalculation | undefined {
  const selectedIndexes = new Set(
    selectedSegments
      .filter((selection) => selection.runId === run.id)
      .map((selection) => selection.segmentIndex)
  );

  if (selectedIndexes.size === 0) {
    return undefined;
  }

  const sections = calculateDuctRunSections(run).filter((section) => selectedIndexes.has(section.segmentIndex));
  if (sections.length === 0) {
    return undefined;
  }

  const selectedLength = round(sections.reduce((total, section) => total + section.length, 0));
  const stationStart = Math.min(...sections.map((section) => section.startStation));
  const stationEnd = Math.max(...sections.map((section) => section.endStation));
  const aggregatePressureLoss = calculatePressureLoss(run.calculated.frictionLoss, selectedLength);
  const terminalSection = sections.reduce((latest, section) =>
    section.endStation > latest.endStation ? section : latest
  );

  return {
    title: sections.length === 1 ? 'Selected Section' : 'Selected Sections',
    sections,
    selectedLength,
    stationStart,
    stationEnd,
    aggregatePressureLoss,
    cumulativePressureDrop: terminalSection.cumulativePressureDrop,
    availableStaticPressure: terminalSection.availableStaticPressure,
  };
}

export function calculateSelectedDuctRunBranch(runs: DuctRun[]): SelectedDuctRunBranchCalculation | undefined {
  if (runs.length < 2) {
    return undefined;
  }

  const branchRuns = runs.map((run) => {
    const sections = calculateDuctRunSections(run);
    const terminalSection = sections.reduce<DuctRunSectionCalculation | undefined>((latest, section) => {
      if (!latest || section.endStation > latest.endStation) {
        return section;
      }

      return latest;
    }, undefined);

    const length = round(
      sections.length > 0
        ? sections.reduce((total, section) => total + section.length, 0)
        : run.props.installLength
    );
    const pressureLoss = calculatePressureLoss(run.calculated.frictionLoss, length);
    const area = resolveArea(run);
    const airflow = resolveAirflow(run);
    const velocity = resolveVelocity(run, airflow, area);

    return {
      runId: run.id,
      name: run.props.name,
      length,
      airflow,
      area,
      velocity,
      frictionRate: run.calculated.frictionLoss,
      pressureLoss,
      cumulativePressureDrop: terminalSection?.cumulativePressureDrop ?? run.calculated.cumulativePressureDrop,
      availableStaticPressure: terminalSection?.availableStaticPressure ?? run.calculated.availableStaticPressure,
    };
  });

  const terminalRun = branchRuns[branchRuns.length - 1];

  return {
    title: 'Selected Branch',
    runs: branchRuns,
    selectedLength: round(branchRuns.reduce((total, run) => total + run.length, 0)),
    aggregateAirflow: round(branchRuns.reduce((total, run) => total + run.airflow, 0)),
    aggregatePressureLoss: round(branchRuns.reduce((total, run) => total + run.pressureLoss, 0)),
    maxAirflow: Math.max(...branchRuns.map((run) => run.airflow)),
    terminalAvailableStaticPressure: terminalRun?.availableStaticPressure ?? 0,
  };
}

function resolveAirflow(run: DuctRun): number {
  if (run.props.airflow > 0) {
    return run.props.airflow;
  }

  const engineeringAirflow = run.props.engineeringData?.airflow;
  return engineeringAirflow && engineeringAirflow > 0 ? engineeringAirflow : run.props.airflow;
}

function resolveVelocity(run: DuctRun, airflow: number, area: number): number {
  if (run.calculated.velocity > 0) {
    return run.calculated.velocity;
  }

  const engineeringVelocity = run.props.engineeringData?.velocity;
  if (engineeringVelocity && engineeringVelocity > 0) {
    return engineeringVelocity;
  }

  return calculateVelocity(airflow, area);
}

function resolveArea(run: DuctRun): number {
  if (run.calculated.area > 0) {
    return run.calculated.area;
  }

  const shape = run.props.shape === 'round' || run.props.shape === 'flexible' ? 'round' : 'rectangular';
  return calculateDuctArea(shape, {
    diameter: 'diameter' in run.props ? run.props.diameter : undefined,
    width: 'width' in run.props ? run.props.width : undefined,
    height: 'height' in run.props ? run.props.height : undefined,
  });
}

function resolveSourceStaticPressure(run: DuctRun): number {
  const availableStaticPressure = Number.isFinite(run.calculated.availableStaticPressure)
    ? run.calculated.availableStaticPressure
    : run.props.staticPressure;
  const cumulativePressureDrop = Number.isFinite(run.calculated.cumulativePressureDrop)
    ? run.calculated.cumulativePressureDrop
    : 0;

  return availableStaticPressure + cumulativePressureDrop;
}

function calculatePressureLoss(frictionRate: number, lengthFeet: number): number {
  if (!Number.isFinite(frictionRate) || !Number.isFinite(lengthFeet) || frictionRate <= 0 || lengthFeet <= 0) {
    return 0;
  }

  return round((frictionRate / 100) * lengthFeet);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
