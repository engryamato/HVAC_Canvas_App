import type { FittingProps } from '@/core/schema';
import type { AxialFamily, AxialShape } from './fittingFamily';

export type VariantPatch = Partial<NonNullable<FittingProps['variant']>>;

export interface AxialNode {
  id: string;
  label: string;
  shapeGate?: AxialShape[];
  variantPatch?: VariantPatch;
  children?: AxialNode[];
}

export const AXIAL_FAMILY_MAPS: Record<AxialFamily, AxialNode[]> = {
  elbow: [
    {
      id: 'elbow-radius',
      label: 'Radius',
      variantPatch: { elbowType: 'radius' },
      children: [
        { id: 'elbow-radius-r10', label: 'R1.0', variantPatch: { radiusClass: 'R1.0' } },
        { id: 'elbow-radius-r15', label: 'R1.5', variantPatch: { radiusClass: 'R1.5' } },
        { id: 'elbow-radius-r20', label: 'R2.0', variantPatch: { radiusClass: 'R2.0' } },
      ],
    },
    { id: 'elbow-mitered', label: 'Mitered', variantPatch: { elbowType: 'mitered' } },
    {
      id: 'elbow-vanes',
      label: 'Vanes',
      shapeGate: ['rect', 'flat_oval'],
      children: [
        { id: 'elbow-vanes-none', label: 'None', variantPatch: { vaneType: 'none' } },
        { id: 'elbow-vanes-single', label: 'Single wall', variantPatch: { vaneType: 'single_wall' } },
        { id: 'elbow-vanes-double', label: 'Double wall', variantPatch: { vaneType: 'double_wall' } },
      ],
    },
  ],
  tee_wye: [
    { id: 'tee-left', label: 'Left branch', variantPatch: { branchSide: 'left' } },
    { id: 'tee-right', label: 'Right branch', variantPatch: { branchSide: 'right' } },
    {
      id: 'tee-angle',
      label: 'Branch angle',
      children: [
        { id: 'tee-angle-45', label: '45 deg', variantPatch: { branchAngleDeg: 45 } },
        { id: 'tee-angle-90', label: '90 deg', variantPatch: { branchAngleDeg: 90 } },
      ],
    },
  ],
  reducer: [
    { id: 'reducer-concentric', label: 'Concentric', variantPatch: { eccentricOffset: undefined } },
    {
      id: 'reducer-eccentric',
      label: 'Eccentric',
      children: [
        { id: 'reducer-eccentric-top', label: 'Top', variantPatch: { eccentricOffset: 'top' } },
        { id: 'reducer-eccentric-bottom', label: 'Bottom', variantPatch: { eccentricOffset: 'bottom' } },
        { id: 'reducer-eccentric-left', label: 'Left', variantPatch: { eccentricOffset: 'left' } },
        { id: 'reducer-eccentric-right', label: 'Right', variantPatch: { eccentricOffset: 'right' } },
      ],
    },
  ],
  transition: [
    { id: 'transition-centered', label: 'Centered', variantPatch: { transitionAlignment: 'centered' } },
    { id: 'transition-top', label: 'Top aligned', variantPatch: { transitionAlignment: 'top' } },
    { id: 'transition-bottom', label: 'Bottom aligned', variantPatch: { transitionAlignment: 'bottom' } },
    { id: 'transition-left', label: 'Left aligned', variantPatch: { transitionAlignment: 'left' } },
    { id: 'transition-right', label: 'Right aligned', variantPatch: { transitionAlignment: 'right' } },
    {
      id: 'transition-style',
      label: 'Style',
      children: [
        { id: 'transition-style-straight', label: 'Straight', variantPatch: { transitionStyle: 'straight' } },
        { id: 'transition-style-gored', label: 'Gored', variantPatch: { transitionStyle: 'gored' } },
      ],
    },
  ],
  takeoff: [
    { id: 'takeoff-straight-tap', label: 'Straight tap', variantPatch: { takeoffType: 'straight_tap' } },
    { id: 'takeoff-conical-tap', label: 'Conical tap', variantPatch: { takeoffType: 'conical_tap' } },
    { id: 'takeoff-bellmouth', label: 'Bellmouth', variantPatch: { takeoffType: 'bellmouth' } },
    { id: 'takeoff-spin-in', label: 'Spin-in', variantPatch: { takeoffType: 'spin_in' } },
    { id: 'takeoff-saddle', label: 'Saddle', variantPatch: { takeoffType: 'saddle' } },
    {
      id: 'takeoff-entry-angle',
      label: 'Entry angle',
      children: [
        { id: 'takeoff-entry-angle-45', label: '45 deg', variantPatch: { entryAngleDeg: 45 } },
        { id: 'takeoff-entry-angle-90', label: '90 deg', variantPatch: { entryAngleDeg: 90 } },
      ],
    },
    {
      id: 'takeoff-damper',
      label: 'Damper',
      children: [
        { id: 'takeoff-damper-on', label: 'On', variantPatch: { hasDamper: true } },
        { id: 'takeoff-damper-off', label: 'Off', variantPatch: { hasDamper: false } },
      ],
    },
  ],
  cap: [
    { id: 'cap-end-cap', label: 'End cap', variantPatch: { capType: 'end_cap' } },
    { id: 'cap-plug', label: 'Plug', variantPatch: { capType: 'plug' } },
    { id: 'cap-screen', label: 'Screen', variantPatch: { capType: 'screen' } },
  ],
};
