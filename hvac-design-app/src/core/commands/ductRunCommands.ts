import { feetToPixels, pixelsToFeet, roundFeet } from '@/core/constants/coordinates';
import type { DuctRun, Entity } from '@/core/schema';
import { useEntityStore } from '@/core/store/entityStore';
import { recomputeDuctRunSegments } from '@/features/duct-runs/utils/recomputeDuctRunSegments';
import { getActiveSectionLength } from '@/features/duct-runs/utils/getActiveSectionLength';
import { useFabricationProfileStore } from '@/core/store/fabricationProfileStore';
import { useHistoryStore } from './historyStore';
import { CommandType, generateCommandId, type ReversibleCommand } from './types';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';

interface ReplaceEntitiesPayload {
  removeIds: string[];
  addEntities: Entity[];
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

function pointAtStation(run: DuctRun, stationFeet: number): { x: number; y: number } {
  const radians = (run.props.angle * Math.PI) / 180;
  const distance = feetToPixels(stationFeet);

  return {
    x: run.props.start.x + Math.cos(radians) * distance,
    y: run.props.start.y + Math.sin(radians) * distance,
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
    start,
    end,
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
  const sectionLength = getActiveSectionLength(run, useFabricationProfileStore.getState().profile);
  run.props.segments = recomputeDuctRunSegments(run.props.installLength, sectionLength);
  return run;
}

function executeReplace(payload: ReplaceEntitiesPayload): void {
  const entityStore = useEntityStore.getState();
  entityStore.removeEntities(payload.removeIds);
  entityStore.addEntities(payload.addEntities);
  if (payload.selection) {
    useSelectionStore.getState().selectMultiple(payload.selection);
  }
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
  const firstRun = makeRunFromEndpoints(run, firstRunId, `${run.props.name} A`, run.props.start, splitPoint, splitStation);
  const secondRun = makeRunFromEndpoints(
    run,
    secondRunId,
    `${run.props.name} B`,
    splitPoint,
    run.props.end,
    run.props.installLength - splitStation
  );
  const selection = [firstRunId, secondRunId];
  const payload: ReplaceEntitiesPayload = { removeIds: [run.id], addEntities: [firstRun, secondRun], selection };
  const inversePayload: ReplaceEntitiesPayload = { removeIds: selection, addEntities: [cloneEntity(run)], selection: [run.id] };
  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.SPLIT_RUN,
    payload,
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.SPLIT_RUN,
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
  if (a.props.shape !== b.props.shape || a.props.family !== b.props.family) {
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

  let start = first.props.start;
  let end = second.props.end;
  if (!pointsClose(first.props.end, second.props.start)) {
    if (!pointsClose(second.props.end, first.props.start)) {
      return null;
    }
    start = second.props.start;
    end = first.props.end;
  }

  const mergedRunId = options.mergedRunId ?? crypto.randomUUID();
  const installLength = roundFeet(pixelsToFeet(Math.hypot(end.x - start.x, end.y - start.y)));
  const merged = makeRunFromEndpoints(first, mergedRunId, `${first.props.name} + ${second.props.name}`, start, end, installLength);
  const removeIds = [first.id, second.id];
  const payload: ReplaceEntitiesPayload = { removeIds, addEntities: [merged], selection: [mergedRunId] };
  const inversePayload: ReplaceEntitiesPayload = {
    removeIds: [mergedRunId],
    addEntities: [cloneEntity(first), cloneEntity(second)],
    selection: removeIds,
  };
  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.MERGE_RUNS,
    payload,
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.MERGE_RUNS,
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
