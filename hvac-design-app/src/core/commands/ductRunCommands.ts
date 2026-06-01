import { feetToPixels, pixelsToFeet, roundFeet } from '@/core/constants/coordinates';
import type { DuctRun, Entity } from '@/core/schema';
import { useEntityStore } from '@/core/store/entityStore';
import { useProjectStore } from '@/core/store/project.store';
import { recomputeDuctRunSegments } from '@/features/duct-runs/utils/recomputeDuctRunSegments';
import { getActiveSectionLength } from '@/features/duct-runs/utils/getActiveSectionLength';
import { useHistoryStore } from './historyStore';
import { CommandType, generateCommandId, type ReversibleCommand } from './types';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';

interface Point {
  x: number;
  y: number;
}

type DuctRunPropsWithLegacyGeometry = DuctRun['props'] & {
  angle?: number;
  family?: string;
  start?: Point;
  end?: Point;
};

interface ReplaceEntitiesPayload {
  removeEntityIds: string[];
  createEntities: Entity[];
  selection?: string[];
}

interface SplitOptions {
  firstRunId?: string;
  secondRunId?: string;
}

interface MergeOptions {
  mergedRunId?: string;
}

export interface SplitDuctRunResult {
  firstRunId: string;
  secondRunId: string;
}

export interface MergeDuctRunsResult {
  mergedRunId: string;
}

function isDuctRun(entity: Entity | undefined): entity is DuctRun {
  return entity?.type === 'duct_run';
}

function cloneEntity<T extends Entity>(entity: T): T {
  return JSON.parse(JSON.stringify(entity)) as T;
}

function getRunProps(run: DuctRun): DuctRunPropsWithLegacyGeometry {
  return run.props as DuctRunPropsWithLegacyGeometry;
}

function getRunStart(run: DuctRun): Point {
  const props = getRunProps(run);
  return props.start ?? props.startPoint ?? { x: run.transform.x, y: run.transform.y };
}

function getRunEnd(run: DuctRun): Point {
  const props = getRunProps(run);
  return props.end ?? props.endPoint ?? getRunStart(run);
}

function getRunAngle(run: DuctRun): number {
  const props = getRunProps(run);
  if (typeof props.angle === 'number') {
    return props.angle;
  }

  const start = getRunStart(run);
  const end = getRunEnd(run);
  return (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI;
}

function getRunFamily(run: DuctRun): string {
  const props = getRunProps(run);
  return props.family ?? props.engineeringSystem;
}

function pointAtStation(run: DuctRun, stationFeet: number): Point {
  const start = getRunStart(run);
  const radians = (getRunAngle(run) * Math.PI) / 180;
  const distance = feetToPixels(stationFeet);

  return {
    x: start.x + Math.cos(radians) * distance,
    y: start.y + Math.sin(radians) * distance,
  };
}

function makeRunFromEndpoints(
  source: DuctRun,
  id: string,
  name: string,
  start: { x: number; y: number },
  end: { x: number; y: number },
  installLength: number
): DuctRun {
  const now = new Date().toISOString();
  const baseProps = {
    ...source.props,
    name,
    installLength: roundFeet(installLength),
    startPoint: start,
    endPoint: end,
    segments: [] as DuctRun['props']['segments'],
  };
  const run = {
    ...cloneEntity(source),
    id,
    transform: { ...source.transform, x: 0, y: 0, rotation: 0 },
    createdAt: source.createdAt,
    modifiedAt: now,
    props: baseProps,
  } as DuctRun;
  const sectionLength = getActiveSectionLength(run);
  run.props.segments = recomputeDuctRunSegments(run.props.installLength, sectionLength);
  return run;
}

function executeReplace(payload: ReplaceEntitiesPayload): void {
  const entityStore = useEntityStore.getState();
  entityStore.removeEntities(payload.removeEntityIds);
  entityStore.addEntities(payload.createEntities);
  if (payload.selection) {
    useSelectionStore.getState().selectMultiple(payload.selection);
  }
  useProjectStore.getState().markProjectModified();
}

export function applyDuctRunReplace(payload: ReplaceEntitiesPayload): void {
  executeReplace(payload);
}

export function splitDuctRun(
  runId: string,
  splitStation: number,
  options: SplitOptions = {}
): SplitDuctRunResult | null {
  const run = useEntityStore.getState().byId[runId];
  if (!isDuctRun(run) || splitStation <= 0 || splitStation >= run.props.installLength) {
    return null;
  }

  const splitPoint = pointAtStation(run, splitStation);
  const firstRunId = options.firstRunId ?? crypto.randomUUID();
  const secondRunId = options.secondRunId ?? crypto.randomUUID();
  const firstRun = makeRunFromEndpoints(run, firstRunId, `${run.props.name} A`, getRunStart(run), splitPoint, splitStation);
  const secondRun = makeRunFromEndpoints(
    run,
    secondRunId,
    `${run.props.name} B`,
    splitPoint,
    getRunEnd(run),
    run.props.installLength - splitStation
  );
  const selection = [firstRunId, secondRunId];
  const payload: ReplaceEntitiesPayload = { removeEntityIds: [run.id], createEntities: [firstRun, secondRun], selection };
  const inversePayload: ReplaceEntitiesPayload = {
    removeEntityIds: selection,
    createEntities: [cloneEntity(run)],
    selection: [run.id],
  };
  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.SPLIT_DUCT_RUN,
    payload,
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.MERGE_DUCT_RUNS,
      payload: inversePayload,
      timestamp: Date.now(),
    },
    selectionBefore: [...useSelectionStore.getState().selectedIds],
    selectionAfter: selection,
  };

  executeReplace(payload);
  useHistoryStore.getState().push(command);
  return { firstRunId, secondRunId };
}

function sameRunSize(a: DuctRun, b: DuctRun): boolean {
  if (a.props.shape !== b.props.shape || getRunFamily(a) !== getRunFamily(b)) {
    return false;
  }

  if ('diameter' in a.props || 'diameter' in b.props) {
    return 'diameter' in a.props && 'diameter' in b.props && a.props.diameter === b.props.diameter;
  }

  return 'width' in a.props && 'width' in b.props && a.props.width === b.props.width && a.props.height === b.props.height;
}

function pointsClose(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) <= 0.001;
}

export function mergeDuctRuns(
  firstRunId: string,
  secondRunId: string,
  options: MergeOptions = {}
): MergeDuctRunsResult | null {
  const first = useEntityStore.getState().byId[firstRunId];
  const second = useEntityStore.getState().byId[secondRunId];
  if (!isDuctRun(first) || !isDuctRun(second) || !sameRunSize(first, second)) {
    return null;
  }

  let start = getRunStart(first);
  let end = getRunEnd(second);
  if (!pointsClose(getRunEnd(first), getRunStart(second))) {
    if (!pointsClose(getRunEnd(second), getRunStart(first))) {
      return null;
    }
    start = getRunStart(second);
    end = getRunEnd(first);
  }

  const mergedRunId = options.mergedRunId ?? crypto.randomUUID();
  const installLength = roundFeet(pixelsToFeet(Math.hypot(end.x - start.x, end.y - start.y)));
  const merged = makeRunFromEndpoints(first, mergedRunId, `${first.props.name} + ${second.props.name}`, start, end, installLength);
  const removeIds = [first.id, second.id];
  const payload: ReplaceEntitiesPayload = { removeEntityIds: removeIds, createEntities: [merged], selection: [mergedRunId] };
  const inversePayload: ReplaceEntitiesPayload = {
    removeEntityIds: [mergedRunId],
    createEntities: [cloneEntity(first), cloneEntity(second)],
    selection: removeIds,
  };
  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.MERGE_DUCT_RUNS,
    payload,
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.SPLIT_DUCT_RUN,
      payload: inversePayload,
      timestamp: Date.now(),
    },
    selectionBefore: [...useSelectionStore.getState().selectedIds],
    selectionAfter: [mergedRunId],
  };

  executeReplace(payload);
  useHistoryStore.getState().push(command);
  return { mergedRunId };
}
