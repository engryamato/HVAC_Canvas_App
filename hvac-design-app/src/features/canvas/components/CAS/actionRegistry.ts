import type { Duct, DuctRun, Entity, Equipment, Fitting } from '@/core/schema';
import type { DuctRunShape } from '@/core/schema/duct-run.schema';
import type { FittingType } from '@/core/schema/fitting.schema';
import {
  COMMERCIAL_STANDARD_TEMPLATE,
  type EngineeringLimits,
} from '@/core/schema/calculation-settings.schema';
import * as entityActions from '@/core/actions/entityActions';
import { shapeCompatibility } from '@/core/services/connectionPoints/shapeCompatibility';
import type { SizeField } from '@/core/services/sizing/sizingProvenance';

export type CasBehavior =
  | 'inline-cycle'
  | 'popover-select'
  | 'popover-edit'
  | 'immediate'
  | 'inspector-deeplink';

export type CasEntityScope =
  | 'duct'
  | 'elbow'
  | 'tee_wye'
  | 'reducer'
  | 'transition'
  | 'cap'
  | 'takeoff'
  | 'equipment'
  | 'segment'
  | 'unknown';

export interface CasEntitySnapshot {
  id: string;
  scope: CasEntityScope;
  props: Record<string, any>;
  entity?: Entity;
  segmentIndex?: number;
}

export interface CasActionOption {
  label: string;
  value: string | number | boolean;
}

export interface CasAction {
  id: string;
  label: string;
  scope: CasEntityScope;
  behavior: CasBehavior;
  isGlobal: false;
  field?: string;
  options?: CasActionOption[];
  run: (entity: CasEntitySnapshot, value?: unknown) => void;
}

export const CAS_ENTITY_SCOPES: CasEntityScope[] = [
  'duct',
  'elbow',
  'tee_wye',
  'reducer',
  'transition',
  'cap',
  'takeoff',
  'equipment',
  'segment',
];

const context = {
  engineeringLimits: COMMERCIAL_STANDARD_TEMPLATE.engineeringLimits as EngineeringLimits,
  validateField: () => true,
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function openInspector(entity: CasEntitySnapshot) {
  window.dispatchEvent(
    new CustomEvent('sws:open-inspector', {
      detail: { entityId: entity.id, segmentIndex: entity.segmentIndex },
    })
  );
}

function emitTransition(entity: CasEntitySnapshot, result: string) {
  window.dispatchEvent(
    new CustomEvent('sws:cas-auto-insert-transition', {
      detail: { entityId: entity.id, compatibility: result },
    })
  );
}

function commitDuctProp(entity: CasEntitySnapshot, props: Record<string, unknown>) {
  void entityActions.commitDuctProperty(entity.id, props as Partial<Duct['props']>, context, {
    debounceMs: 0,
  });
}

function commitEntityProps(entity: CasEntitySnapshot, props: Record<string, unknown>) {
  const previous = entity.entity ? clone(entity.entity) : ({ id: entity.id, type: 'fitting', props: entity.props } as Entity);
  entityActions.commitEntityProps(entity.id, props as never, previous as never);
}

function setVariant(entity: CasEntitySnapshot, patch: Record<string, unknown>) {
  commitEntityProps(entity, {
    ...entity.props,
    variant: {
      ...(entity.props.variant ?? {}),
      ...patch,
    },
    manualOverride: entity.props.autoInserted ? true : entity.props.manualOverride,
  });
}

function currentOption(action: CasAction, entity: CasEntitySnapshot) {
  const value = action.field?.split('.').reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== 'object') {
      return undefined;
    }
    return (acc as Record<string, unknown>)[key];
  }, entity.props);
  const index = action.options?.findIndex((option) => option.value === value) ?? -1;
  return { value, index };
}

function nextCycleValue(action: CasAction, entity: CasEntitySnapshot) {
  const { index } = currentOption(action, entity);
  const options = action.options ?? [];
  return options[(index + 1 + options.length) % options.length]?.value;
}

function ductShapeToRunShape(shape: unknown): DuctRunShape {
  if (shape === 'flat_oval' || shape === 'flexible' || shape === 'round' || shape === 'rectangular') {
    return shape;
  }
  return 'rectangular';
}

function applyDuctShape(entity: CasEntitySnapshot, value?: unknown) {
  const targetShape = ductShapeToRunShape(value ?? nextCycleValue(ductShapeAction, entity));
  const currentShape = ductShapeToRunShape(entity.props.shape);
  const compatibility = shapeCompatibility(currentShape, targetShape, true);
  emitTransition(entity, compatibility);
  commitDuctProp(entity, {
    shape: targetShape,
    casAutoInsert: compatibility,
  });
}

function setDuctSize(entity: CasEntitySnapshot, value?: unknown) {
  const values = (value ?? {}) as Record<string, unknown>;
  const fields: SizeField[] =
    entity.props.shape === 'round' || entity.props.shape === 'flexible'
      ? ['diameter']
      : ['width', 'height'];

  fields.forEach((field) => {
    const nextValue = values[field];
    if (nextValue !== undefined) {
      void entityActions.setSize(entity.id, field, nextValue as number, context, { debounceMs: 0 });
    }
  });
}

function setFittingType(entity: CasEntitySnapshot, value: FittingType) {
  commitEntityProps(entity, { ...entity.props, fittingType: value, manualOverride: true });
}

const ductShapeAction: CasAction = {
  id: 'duct-shape',
  label: 'Shape',
  scope: 'duct',
  behavior: 'inline-cycle',
  isGlobal: false,
  field: 'shape',
  options: [
    { label: 'Rect', value: 'rectangular' },
    { label: 'Round', value: 'round' },
    { label: 'Flat oval', value: 'flat_oval' },
    { label: 'Flex', value: 'flexible' },
  ],
  run: applyDuctShape,
};

export const casActionRegistry: CasAction[] = [
  {
    id: 'duct-size',
    label: 'Edit size',
    scope: 'duct',
    behavior: 'popover-edit',
    isGlobal: false,
    run: setDuctSize,
  },
  {
    id: 'duct-length',
    label: 'Length',
    scope: 'duct',
    behavior: 'popover-edit',
    isGlobal: false,
    run: (entity, value) => commitDuctProp(entity, { length: Number(value) }),
  },
  {
    id: 'duct-system-type',
    label: 'System',
    scope: 'duct',
    behavior: 'popover-select',
    isGlobal: false,
    field: 'systemType',
    options: [
      { label: 'Supply', value: 'supply' },
      { label: 'Return', value: 'return' },
      { label: 'Exhaust', value: 'exhaust' },
      { label: 'OA', value: 'outside_air' },
    ],
    run: (entity, value) => commitDuctProp(entity, { systemType: value }),
  },
  ductShapeAction,
  {
    id: 'duct-material',
    label: 'Material',
    scope: 'duct',
    behavior: 'popover-select',
    isGlobal: false,
    field: 'material',
    options: [
      { label: 'Galv', value: 'galvanized' },
      { label: 'SS', value: 'stainless' },
      { label: 'Alum', value: 'aluminum' },
      { label: 'Flex', value: 'flex' },
    ],
    run: (entity, value) => commitDuctProp(entity, { material: value }),
  },
  {
    id: 'duct-reverse-flow',
    label: 'Reverse',
    scope: 'duct',
    behavior: 'immediate',
    isGlobal: false,
    run: (entity) => commitDuctProp(entity, { flowReversed: !entity.props.flowReversed }),
  },
  {
    id: 'elbow-angle',
    label: 'Angle',
    scope: 'elbow',
    behavior: 'popover-edit',
    isGlobal: false,
    run: (entity, value) => commitEntityProps(entity, { ...entity.props, angle: Number(value), manualOverride: true }),
  },
  {
    id: 'elbow-vanes',
    label: 'Vanes',
    scope: 'elbow',
    behavior: 'inline-cycle',
    isGlobal: false,
    field: 'variant.vaneType',
    options: [
      { label: 'None', value: 'none' },
      { label: 'Single', value: 'single_wall' },
      { label: 'Double', value: 'double_wall' },
    ],
    run: (entity, value) => setVariant(entity, { vaneType: value ?? nextCycleValue(casActionById('elbow-vanes'), entity) }),
  },
  {
    id: 'elbow-type',
    label: 'Type',
    scope: 'elbow',
    behavior: 'inline-cycle',
    isGlobal: false,
    field: 'variant.elbowType',
    options: [
      { label: 'Radius', value: 'radius' },
      { label: 'Mitered', value: 'mitered' },
    ],
    run: (entity, value) => {
      const next = (value ?? nextCycleValue(casActionById('elbow-type'), entity)) as string;
      setVariant(entity, { elbowType: next });
      setFittingType(entity, next === 'mitered' ? 'elbow_mitered' : (entity.props.angle === 45 ? 'elbow_45' : 'elbow_90'));
    },
  },
  {
    id: 'elbow-radius-class',
    label: 'Radius',
    scope: 'elbow',
    behavior: 'inline-cycle',
    isGlobal: false,
    field: 'variant.radiusClass',
    options: [
      { label: 'R1.0', value: 'R1.0' },
      { label: 'R1.5', value: 'R1.5' },
      { label: 'R2.0', value: 'R2.0' },
    ],
    run: (entity, value) => setVariant(entity, { radiusClass: value ?? nextCycleValue(casActionById('elbow-radius-class'), entity) }),
  },
  {
    id: 'elbow-reset-auto',
    label: 'Reset',
    scope: 'elbow',
    behavior: 'immediate',
    isGlobal: false,
    run: (entity) => entityActions.resetFittingToAuto(entity.id),
  },
  {
    id: 'tee-branch-size',
    label: 'Branch size',
    scope: 'tee_wye',
    behavior: 'popover-edit',
    isGlobal: false,
    run: (entity, value) => setVariant(entity, value as Record<string, unknown>),
  },
  {
    id: 'tee-branch-angle',
    label: 'Branch angle',
    scope: 'tee_wye',
    behavior: 'popover-edit',
    isGlobal: false,
    run: (entity, value) => setVariant(entity, { branchAngleDeg: Number(value) }),
  },
  {
    id: 'tee-classification',
    label: 'Class',
    scope: 'tee_wye',
    behavior: 'inline-cycle',
    isGlobal: false,
    field: 'fittingType',
    options: [
      { label: 'Tee', value: 'tee' },
      { label: 'Wye', value: 'wye' },
    ],
    run: (entity, value) => setFittingType(entity, (value ?? nextCycleValue(casActionById('tee-classification'), entity)) as FittingType),
  },
  {
    id: 'tee-flip',
    label: 'Flip',
    scope: 'tee_wye',
    behavior: 'immediate',
    isGlobal: false,
    run: (entity) => setVariant(entity, { branchSide: entity.props.variant?.branchSide === 'left' ? 'right' : 'left' }),
  },
  {
    id: 'tee-reset-auto',
    label: 'Reset',
    scope: 'tee_wye',
    behavior: 'immediate',
    isGlobal: false,
    run: (entity) => entityActions.resetFittingToAuto(entity.id),
  },
  {
    id: 'reducer-end-sizes',
    label: 'End sizes',
    scope: 'reducer',
    behavior: 'popover-edit',
    isGlobal: false,
    run: (entity, value) => setVariant(entity, value as Record<string, unknown>),
  },
  {
    id: 'reducer-type',
    label: 'Type',
    scope: 'reducer',
    behavior: 'inline-cycle',
    isGlobal: false,
    field: 'fittingType',
    options: [
      { label: 'Concentric', value: 'reducer' },
      { label: 'Tapered', value: 'reducer_tapered' },
      { label: 'Eccentric', value: 'reducer_eccentric' },
    ],
    run: (entity, value) => setFittingType(entity, (value ?? nextCycleValue(casActionById('reducer-type'), entity)) as FittingType),
  },
  {
    id: 'reducer-offset',
    label: 'Offset',
    scope: 'reducer',
    behavior: 'popover-select',
    isGlobal: false,
    field: 'variant.eccentricOffset',
    options: [
      { label: 'Top', value: 'top' },
      { label: 'Bottom', value: 'bottom' },
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
    ],
    run: (entity, value) => setVariant(entity, { eccentricOffset: value }),
  },
  {
    id: 'reducer-reset-auto',
    label: 'Reset',
    scope: 'reducer',
    behavior: 'immediate',
    isGlobal: false,
    run: (entity) => entityActions.resetFittingToAuto(entity.id),
  },
  {
    id: 'transition-shape-summary',
    label: 'Shapes',
    scope: 'transition',
    behavior: 'inspector-deeplink',
    isGlobal: false,
    run: openInspector,
  },
  {
    id: 'transition-alignment',
    label: 'Align',
    scope: 'transition',
    behavior: 'popover-select',
    isGlobal: false,
    field: 'variant.transitionAlignment',
    options: [
      { label: 'Centered', value: 'centered' },
      { label: 'Top', value: 'top' },
      { label: 'Bottom', value: 'bottom' },
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
    ],
    run: (entity, value) => setVariant(entity, { transitionAlignment: value }),
  },
  {
    id: 'transition-reset-auto',
    label: 'Reset',
    scope: 'transition',
    behavior: 'immediate',
    isGlobal: false,
    run: (entity) => entityActions.resetFittingToAuto(entity.id),
  },
  {
    id: 'cap-type',
    label: 'Cap type',
    scope: 'cap',
    behavior: 'inline-cycle',
    isGlobal: false,
    field: 'variant.capType',
    options: [
      { label: 'End cap', value: 'end_cap' },
      { label: 'Plug', value: 'plug' },
      { label: 'Screen', value: 'screen' },
    ],
    run: (entity, value) => setVariant(entity, { capType: value ?? nextCycleValue(casActionById('cap-type'), entity) }),
  },
  {
    id: 'cap-remove',
    label: 'Remove',
    scope: 'cap',
    behavior: 'immediate',
    isGlobal: false,
    run: (entity) => commitEntityProps(entity, { ...entity.props, removedByCas: true }),
  },
  {
    id: 'takeoff-type',
    label: 'Type',
    scope: 'takeoff',
    behavior: 'popover-select',
    isGlobal: false,
    field: 'variant.takeoffType',
    options: [
      { label: 'Straight', value: 'straight_tap' },
      { label: 'Conical', value: 'conical_tap' },
      { label: 'Bellmouth', value: 'bellmouth' },
      { label: 'Spin-in', value: 'spin_in' },
      { label: 'Saddle', value: 'saddle' },
    ],
    run: (entity, value) => setVariant(entity, { takeoffType: value }),
  },
  {
    id: 'takeoff-branch-size',
    label: 'Branch size',
    scope: 'takeoff',
    behavior: 'popover-edit',
    isGlobal: false,
    run: (entity, value) => setVariant(entity, value as Record<string, unknown>),
  },
  {
    id: 'takeoff-entry-angle',
    label: 'Entry angle',
    scope: 'takeoff',
    behavior: 'popover-edit',
    isGlobal: false,
    run: (entity, value) => setVariant(entity, { entryAngleDeg: Number(value) }),
  },
  {
    id: 'takeoff-flip',
    label: 'Flip',
    scope: 'takeoff',
    behavior: 'immediate',
    isGlobal: false,
    run: (entity) => setVariant(entity, { branchSide: entity.props.variant?.branchSide === 'left' ? 'right' : 'left' }),
  },
  {
    id: 'takeoff-reset-auto',
    label: 'Reset',
    scope: 'takeoff',
    behavior: 'immediate',
    isGlobal: false,
    run: (entity) => entityActions.resetFittingToAuto(entity.id),
  },
  {
    id: 'equipment-open-inspector',
    label: 'Open Inspector',
    scope: 'equipment',
    behavior: 'inspector-deeplink',
    isGlobal: false,
    run: openInspector,
  },
  {
    id: 'segment-split',
    label: 'Split segment',
    scope: 'segment',
    behavior: 'immediate',
    isGlobal: false,
    run: (entity) => {
      window.dispatchEvent(new CustomEvent('sws:cas-split-segment', { detail: entity }));
    },
  },
  {
    id: 'segment-open-inspector',
    label: 'Open Inspector',
    scope: 'segment',
    behavior: 'inspector-deeplink',
    isGlobal: false,
    run: openInspector,
  },
];

export function casActionById(id: string): CasAction {
  const action = casActionRegistry.find((item) => item.id === id);
  if (!action) {
    throw new Error(`Unknown CAS action: ${id}`);
  }
  return action;
}

export function getCasScope(entity: Entity): CasEntityScope {
  if (entity.type === 'duct' || entity.type === 'duct_run') {
    return 'duct';
  }

  if (entity.type === 'equipment') {
    return 'equipment';
  }

  if (entity.type !== 'fitting') {
    return 'unknown';
  }

  const fittingType = entity.props.fittingType;
  if (fittingType.startsWith('elbow')) {
    return 'elbow';
  }
  if (fittingType === 'tee' || fittingType === 'wye') {
    return 'tee_wye';
  }
  if (fittingType === 'reducer' || fittingType === 'reducer_tapered' || fittingType === 'reducer_eccentric') {
    return 'reducer';
  }
  if (fittingType === 'transition_square_to_round') {
    return 'transition';
  }
  if (fittingType === 'cap') {
    return 'cap';
  }
  if (fittingType === 'takeoff') {
    return 'takeoff';
  }
  return 'unknown';
}

export function toCasEntitySnapshot(entity: Entity, segmentIndex?: number): CasEntitySnapshot {
  return {
    id: entity.id,
    scope: segmentIndex !== undefined ? 'segment' : getCasScope(entity),
    props: entity.props as Record<string, unknown>,
    entity,
    segmentIndex,
  };
}

export function getActionsForEntity(entity: Pick<CasEntitySnapshot, 'scope'> | CasEntitySnapshot): CasAction[] {
  return casActionRegistry.filter((action) => action.scope === entity.scope).slice(0, 6);
}

export function executeCasAction(action: CasAction, entity: CasEntitySnapshot, value?: unknown) {
  action.run(entity, value);
}

export function getActionDisplayValue(action: CasAction, entity: CasEntitySnapshot): string | null {
  if (!action.field) {
    return null;
  }
  const { value } = currentOption(action, entity);
  const option = action.options?.find((item) => item.value === value);
  return option?.label ?? (value === undefined || value === null ? null : String(value));
}

export function getSizeFields(entity: CasEntitySnapshot): SizeField[] {
  return entity.props.shape === 'round' || entity.props.shape === 'flexible'
    ? ['diameter']
    : ['width', 'height'];
}

export function getEntityBounds(entity: Entity): { x: number; y: number; width: number; height: number } {
  if (entity.type === 'equipment') {
    return {
      x: entity.transform.x,
      y: entity.transform.y,
      width: entity.props.width,
      height: entity.props.depth,
    };
  }

  if (entity.type === 'duct_run') {
    return {
      x: entity.transform.x,
      y: entity.transform.y,
      width: Math.max(24, entity.props.installLength * 12),
      height: Math.max(entity.props.height ?? entity.props.diameter ?? 12, 16),
    };
  }

  if (entity.type === 'duct') {
    return {
      x: entity.transform.x,
      y: entity.transform.y,
      width: Math.max(24, entity.props.length * 12),
      height: Math.max(entity.props.height ?? entity.props.diameter ?? 12, 16),
    };
  }

  if (entity.type === 'fitting') {
    return { x: entity.transform.x, y: entity.transform.y, width: 48, height: 48 };
  }

  return { x: entity.transform.x, y: entity.transform.y, width: 40, height: 40 };
}

export type CasWritableEntity = Duct | DuctRun | Equipment | Fitting;
