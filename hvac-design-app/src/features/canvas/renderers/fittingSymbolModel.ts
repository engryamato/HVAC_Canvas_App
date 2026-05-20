import type { Duct, DuctRun, Entity, Fitting } from '@/core/schema';

export type DynamicFittingSymbolKind =
  | 'elbow_90'
  | 'elbow_45'
  | 'elbow_mitered'
  | 'reducer'
  | 'tee'
  | 'wye'
  | 'end_cap'
  | 'rect_to_round'
  | 'offset';

export interface DynamicFittingCommonProps {
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  className?: string;
  showLabels?: boolean;
}

export interface DynamicSingleSizeFittingProps extends DynamicFittingCommonProps {
  size: number;
  label: string;
}

export interface DynamicPairedSizeFittingProps extends DynamicFittingCommonProps {
  inletSize: number;
  outletSize: number;
  inletLabel: string;
  outletLabel: string;
}

export interface DynamicBranchFittingProps extends DynamicFittingCommonProps {
  mainSize: number;
  branchSize: number;
  mainLabel: string;
  branchLabel: string;
}

export interface DynamicRectToRoundFittingProps extends DynamicFittingCommonProps {
  rectWidth: number;
  rectHeight: number;
  rectLabel: string;
  roundSize: number;
  roundLabel: string;
}

export type DynamicFittingSymbolSpec =
  | { kind: 'elbow_90' | 'elbow_45' | 'elbow_mitered' | 'end_cap' | 'offset'; props: DynamicSingleSizeFittingProps }
  | { kind: 'reducer'; props: DynamicPairedSizeFittingProps }
  | { kind: 'tee' | 'wye'; props: DynamicBranchFittingProps }
  | { kind: 'rect_to_round'; props: DynamicRectToRoundFittingProps };

export interface DuctProfile {
  shape: 'round' | 'rectangular';
  primarySize: number;
  width: number;
  height: number;
  label: string;
}

const DEFAULT_SIZE = 12;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function sanitizeSize(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

export function normalizeSize(value: number, maxSize: number, minPx = 10, maxPx = 42): number {
  const safeValue = sanitizeSize(value);
  const safeMax = sanitizeSize(maxSize);
  return clamp((safeValue / safeMax) * maxPx, minPx, maxPx);
}

export function formatInches(value: number): string {
  return `${sanitizeSize(value)}"`;
}

function createRoundProfile(diameter: number): DuctProfile {
  const safeDiameter = sanitizeSize(diameter);
  return {
    shape: 'round',
    primarySize: safeDiameter,
    width: safeDiameter,
    height: safeDiameter,
    label: formatInches(safeDiameter),
  };
}

function createRectangularProfile(width: number, height: number): DuctProfile {
  const safeWidth = sanitizeSize(width);
  const safeHeight = sanitizeSize(height);
  return {
    shape: 'rectangular',
    primarySize: Math.max(safeWidth, safeHeight),
    width: safeWidth,
    height: safeHeight,
    label: `${formatInches(safeWidth)} x ${formatInches(safeHeight)}`,
  };
}

export function getDuctProfile(entity: Entity | undefined): DuctProfile | undefined {
  if (!entity) {
    return undefined;
  }

  if (entity.type === 'duct') {
    const duct = entity as Duct;
    if (duct.props.shape === 'round') {
      return createRoundProfile(duct.props.diameter ?? DEFAULT_SIZE);
    }

    return createRectangularProfile(duct.props.width ?? DEFAULT_SIZE, duct.props.height ?? 8);
  }

  if (entity.type === 'duct_run') {
    const run = entity as DuctRun;
    if (run.props.shape === 'round' || run.props.shape === 'flexible') {
      const diameter = 'diameter' in run.props ? (run.props.diameter ?? DEFAULT_SIZE) : DEFAULT_SIZE;
      return createRoundProfile(diameter);
    }

    const width = 'width' in run.props ? (run.props.width ?? DEFAULT_SIZE) : DEFAULT_SIZE;
    const height = 'height' in run.props ? (run.props.height ?? 8) : 8;
    return createRectangularProfile(width, height);
  }

  return undefined;
}

function getTransitionProfiles(fitting: Fitting): { from?: DuctProfile; to?: DuctProfile } {
  const transitionData = fitting.props.transitionData;
  if (!transitionData) {
    return {};
  }

  const from =
    transitionData.fromShape === 'round'
      ? createRoundProfile(transitionData.fromDiameter ?? DEFAULT_SIZE)
      : transitionData.fromShape === 'rectangular'
        ? createRectangularProfile(transitionData.fromWidth ?? DEFAULT_SIZE, transitionData.fromHeight ?? 8)
        : undefined;

  const to =
    transitionData.toShape === 'round'
      ? createRoundProfile(transitionData.toDiameter ?? DEFAULT_SIZE)
      : transitionData.toShape === 'rectangular'
        ? createRectangularProfile(transitionData.toWidth ?? DEFAULT_SIZE, transitionData.toHeight ?? 8)
        : undefined;

  return { from, to };
}

function collectConnectedProfiles(fitting: Fitting, entitiesById: Record<string, Entity>): DuctProfile[] {
  const ids = [
    fitting.props.inletDuctId,
    fitting.props.outletDuctId,
    ...(fitting.props.connectionPoints?.map((connection) => connection.ductId) ?? []),
  ].filter((value): value is string => Boolean(value));

  const uniqueIds = [...new Set(ids)];
  return uniqueIds
    .map((id) => getDuctProfile(entitiesById[id]))
    .filter((profile): profile is DuctProfile => profile !== undefined);
}

function scaleProfile(profile: DuctProfile, ratio: number, roundShape?: boolean): DuctProfile {
  if (roundShape ?? profile.shape === 'round') {
    return createRoundProfile(Math.max(4, Math.round(profile.primarySize * ratio)));
  }

  return createRectangularProfile(
    Math.max(4, Math.round(profile.width * ratio)),
    Math.max(4, Math.round(profile.height * ratio))
  );
}

function pickMainAndBranchProfiles(
  fitting: Fitting,
  entitiesById: Record<string, Entity>
): { main: DuctProfile; branch: DuctProfile } {
  const transition = getTransitionProfiles(fitting);
  const connectedProfiles = collectConnectedProfiles(fitting, entitiesById);
  const main =
    transition.from ??
    getDuctProfile(entitiesById[fitting.props.inletDuctId ?? '']) ??
    connectedProfiles[0] ??
    createRoundProfile(DEFAULT_SIZE);

  const branch =
    transition.to ??
    getDuctProfile(entitiesById[fitting.props.outletDuctId ?? '']) ??
    connectedProfiles[1] ??
    scaleProfile(main, 0.75);

  return { main, branch };
}

function pickInletAndOutletProfiles(
  fitting: Fitting,
  entitiesById: Record<string, Entity>
): { inlet: DuctProfile; outlet: DuctProfile } {
  const transition = getTransitionProfiles(fitting);
  const connectedProfiles = collectConnectedProfiles(fitting, entitiesById);
  const inlet =
    transition.from ??
    getDuctProfile(entitiesById[fitting.props.inletDuctId ?? '']) ??
    connectedProfiles[0] ??
    createRoundProfile(DEFAULT_SIZE);
  const outlet =
    transition.to ??
    getDuctProfile(entitiesById[fitting.props.outletDuctId ?? '']) ??
    connectedProfiles[1] ??
    scaleProfile(inlet, 0.8, inlet.shape === 'round');

  return { inlet, outlet };
}

export function deriveDynamicFittingSymbol(
  fitting: Fitting,
  entitiesById: Record<string, Entity>
): DynamicFittingSymbolSpec {
  const fittingType = fitting.props.fittingType;
  const angle = fitting.props.angle ?? 90;

  if (fittingType === 'tee') {
    const { main, branch } = pickMainAndBranchProfiles(fitting, entitiesById);
    return {
      kind: 'tee',
      props: {
        mainSize: main.primarySize,
        branchSize: branch.primarySize,
        mainLabel: main.label,
        branchLabel: branch.label,
      },
    };
  }

  if (fittingType === 'wye') {
    const { main, branch } = pickMainAndBranchProfiles(fitting, entitiesById);
    return {
      kind: 'wye',
      props: {
        mainSize: main.primarySize,
        branchSize: branch.primarySize,
        mainLabel: main.label,
        branchLabel: branch.label,
      },
    };
  }

  if (fittingType === 'transition_square_to_round') {
    const transition = getTransitionProfiles(fitting);
    const fallback = pickInletAndOutletProfiles(fitting, entitiesById);
    const rectProfile =
      transition.from?.shape === 'rectangular'
        ? transition.from
        : fallback.inlet.shape === 'rectangular'
          ? fallback.inlet
          : createRectangularProfile(DEFAULT_SIZE, 8);
    const roundProfile =
      transition.to?.shape === 'round'
        ? transition.to
        : fallback.outlet.shape === 'round'
          ? fallback.outlet
          : createRoundProfile(DEFAULT_SIZE);

    return {
      kind: 'rect_to_round',
      props: {
        rectWidth: rectProfile.width,
        rectHeight: rectProfile.height,
        rectLabel: rectProfile.label,
        roundSize: roundProfile.primarySize,
        roundLabel: roundProfile.label,
      },
    };
  }

  if (fittingType === 'reducer' || fittingType === 'reducer_tapered' || fittingType === 'reducer_eccentric') {
    const { inlet, outlet } = pickInletAndOutletProfiles(fitting, entitiesById);
    return {
      kind: 'reducer',
      props: {
        inletSize: inlet.primarySize,
        outletSize: outlet.primarySize,
        inletLabel: inlet.label,
        outletLabel: outlet.label,
      },
    };
  }

  if (fittingType === 'cap') {
    const { inlet } = pickInletAndOutletProfiles(fitting, entitiesById);
    return {
      kind: 'end_cap',
      props: {
        size: inlet.primarySize,
        label: inlet.label,
      },
    };
  }

  if (fittingType === 'end_boot') {
    const { inlet } = pickInletAndOutletProfiles(fitting, entitiesById);
    return {
      kind: 'offset',
      props: {
        size: inlet.primarySize,
        label: inlet.label,
      },
    };
  }

  const { inlet } = pickInletAndOutletProfiles(fitting, entitiesById);
  if (fittingType === 'elbow_mitered') {
    return {
      kind: 'elbow_mitered',
      props: {
        size: inlet.primarySize,
        label: inlet.label,
      },
    };
  }

  return {
    kind: angle <= 45 || fittingType === 'elbow_45' ? 'elbow_45' : 'elbow_90',
    props: {
      size: inlet.primarySize,
      label: inlet.label,
    },
  };
}
