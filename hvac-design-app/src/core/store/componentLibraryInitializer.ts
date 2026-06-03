import type {
  CatalogEntry,
  ComponentCategory,
  ComponentClass,
  EngineeringSystem,
  SystemProfile,
} from '../schema/unified-component.schema';
import {
  DEFAULT_EQUIPMENT_PROPS,
  EQUIPMENT_TYPE_ABBREV,
  EQUIPMENT_TYPE_LABELS,
} from '../schema/equipment.schema';
import { useUnifiedCatalogStore } from './componentLibraryStoreV2';

export const CATALOG_CATEGORY_TREE: ComponentCategory[] = [
  {
    id: 'air_distribution',
    name: 'Air Distribution',
    parentId: null,
    icon: 'wind',
    subcategories: [
      { id: 'standard_ductwork', name: 'Standard Ductwork', parentId: 'air_distribution', icon: 'duct' },
    ],
  },
  {
    id: 'universal_components',
    name: 'Universal Components',
    parentId: null,
    icon: 'wrench',
    subcategories: [
      { id: 'hangers_supports', name: 'Hangers, Supports & Seismic', parentId: 'universal_components', icon: 'anchor' },
    ],
  },
  {
    id: 'hvac_equipment',
    name: 'HVAC Equipment',
    parentId: null,
    icon: 'settings',
    subcategories: [
      { id: 'air_handling',   name: 'Air Handling',    parentId: 'hvac_equipment', icon: 'wind' },
      { id: 'terminal_units', name: 'Terminal Units',  parentId: 'hvac_equipment', icon: 'box' },
      { id: 'fans',           name: 'Fans',            parentId: 'hvac_equipment', icon: 'rotate-cw' },
      { id: 'air_devices',    name: 'Air Devices',     parentId: 'hvac_equipment', icon: 'grid' },
      { id: 'dampers',        name: 'Dampers',         parentId: 'hvac_equipment', icon: 'sliders' },
      { id: 'heating',        name: 'Heating',         parentId: 'hvac_equipment', icon: 'flame' },
    ],
  },
];

export const BASELINE_SYSTEM_PROFILES: SystemProfile[] = [
  {
    id: 'profile-standard-duct',
    name: 'Standard Ductwork',
    engineeringSystem: 'standard_duct',
    defaultSystemType: 'supply',
    color: '#2563eb',
    supportedArchetypes: {
      duct: ['straight', 'rectangular', 'round', 'flat_oval', 'flexible'],
      fitting: ['elbow', 'mitered_elbow', 'tee', 'cross', 'wye', 'reducer', 'transition', 'end_cap', 'takeoff', 'tap'],
      equipment: ['terminal_box', 'fan_coil', 'exhaust_fan', 'ahu_connection'],
      accessory: ['damper', 'turning_vanes', 'silencer', 'access_door', 'connector', 'grd'],
    },
    fittingRules: [
      { angle: 90, fittingType: 'elbow_90', preference: 1 },
      { angle: 45, fittingType: 'elbow_45', preference: 1 },
      { angle: 90, fittingType: 'tee', preference: 1 },
    ],
    dimensionalConstraints: { allowedShapes: ['round', 'rectangular', 'flat_oval'] },
    velocityLimits: { min: 500, max: 2500 },
    complianceRefs: ['SMACNA', 'ASHRAE'],
    calculationCapabilities: ['sizing', 'pressure_drop', 'compliance'],
    source: 'baseline',
  },
  {
    id: 'profile-universal',
    name: 'Universal Components',
    engineeringSystem: 'universal',
    defaultSystemType: 'supply',
    color: '#0f766e',
    supportedArchetypes: {
      duct: [],
      fitting: [],
      equipment: ['auto_hanger_spacing', 'continuous_trapeze_run'],
      accessory: ['hanger', 'support', 'seismic'],
    },
    fittingRules: [],
    dimensionalConstraints: { codeStandards: ['SMACNA', 'IBC-ASCE7', 'ASHRAE'] },
    complianceRefs: ['SMACNA', 'IBC/ASCE 7', 'ASHRAE'],
    calculationCapabilities: ['load', 'compliance'],
    source: 'baseline',
  },
];

const ENTRY_IDS = {
  standard: {
    rectangularDuct: 'standard-rectangular-duct',
    roundDuct: 'standard-round-duct',
    flatOvalDuct: 'standard-flat-oval-duct',
    flexibleDuct: 'standard-flexible-duct',
    radiusElbow: 'standard-radius-elbow',
    miteredElbow: 'standard-mitered-elbow',
    teeCross: 'standard-tee-cross',
    wyeLateral: 'standard-wye-lateral',
    concentricReducer: 'standard-concentric-reducer',
    eccentricReducer: 'standard-eccentric-reducer',
    squareToRoundTransition: 'standard-square-to-round-transition',
    endCap: 'standard-end-cap',
    spinInTakeoff: 'standard-spin-in-takeoff',
    shoeTapBellmouth: 'standard-shoe-tap-bellmouth',
    terminalBox: 'standard-terminal-box',
    fanCoil: 'standard-fan-coil-unit',
    exhaustFan: 'standard-exhaust-fan',
    ahuConnection: 'standard-ahu-connection',
    manualDamper: 'standard-manual-volume-damper',
    motorizedDamper: 'standard-motorized-control-damper',
    fireDamper: 'standard-fire-damper',
    smokeFireDamper: 'standard-smoke-fire-damper',
    turningVanes: 'standard-turning-vanes',
    soundAttenuator: 'standard-sound-attenuator',
    accessDoor: 'standard-access-door',
    flexibleConnector: 'standard-flexible-connector',
    grd: 'standard-grd',
  },
  universal: {
    autoHangerSpacing: 'universal-auto-hanger-spacing',
    continuousTrapezeRun: 'universal-continuous-trapeze-run',
    clevisHanger: 'universal-clevis-hanger',
    trapezeHanger: 'universal-trapeze-hanger',
    strapHanger: 'universal-strap-hanger',
    cableSuspension: 'universal-cable-suspension',
    springIsolationHanger: 'universal-spring-isolation-hanger',
    wallBracket: 'universal-wall-bracket',
    riserClamp: 'universal-riser-clamp',
    floorSupport: 'universal-floor-support',
    roofSupport: 'universal-roof-support',
    rigidSeismicBrace: 'universal-rigid-seismic-brace',
    cableSeismicBrace: 'universal-cable-seismic-brace',
    wedgeAnchor: 'universal-wedge-anchor',
    beamClamp: 'universal-beam-clamp',
  },
} as const;

type EntrySeedDefinition = {
  id: string;
  name: string;
  typeId: string;
  subtype?: string;
  specialtyToolId?: string;
  keySpec?: string;
  iconKey: string;
  recommendedFittingEntryIds?: string[];
  recommendedAccessoryEntryIds?: string[];
  recommendedEquipmentEntryIds?: string[];
  connectionNotes?: string[];
};

const ENTRY_DEFINITIONS: Array<{
  categoryId: string;
  engineeringSystem: EngineeringSystem;
  componentClass: ComponentClass;
  items: EntrySeedDefinition[];
}> = [
  {
    categoryId: 'standard_ductwork',
    engineeringSystem: 'standard_duct',
    componentClass: 'duct',
    items: [
      {
        id: ENTRY_IDS.standard.rectangularDuct,
        name: 'Rectangular Duct',
        typeId: 'rectangular',
        subtype: 'rectangular',
        keySpec: 'Std. rectangular',
        iconKey: 'duct_rectangular',
        recommendedFittingEntryIds: [
          ENTRY_IDS.standard.radiusElbow,
          ENTRY_IDS.standard.teeCross,
          ENTRY_IDS.standard.wyeLateral,
          ENTRY_IDS.standard.concentricReducer,
          ENTRY_IDS.standard.eccentricReducer,
          ENTRY_IDS.standard.squareToRoundTransition,
          ENTRY_IDS.standard.spinInTakeoff,
          ENTRY_IDS.standard.shoeTapBellmouth,
          ENTRY_IDS.standard.endCap,
        ],
        recommendedAccessoryEntryIds: [
          ENTRY_IDS.standard.manualDamper,
          ENTRY_IDS.standard.motorizedDamper,
          ENTRY_IDS.standard.fireDamper,
          ENTRY_IDS.standard.smokeFireDamper,
          ENTRY_IDS.standard.turningVanes,
          ENTRY_IDS.standard.soundAttenuator,
          ENTRY_IDS.standard.accessDoor,
          ENTRY_IDS.standard.flexibleConnector,
          ENTRY_IDS.standard.grd,
        ],
        recommendedEquipmentEntryIds: [
          ENTRY_IDS.standard.terminalBox,
          ENTRY_IDS.standard.fanCoil,
          ENTRY_IDS.standard.ahuConnection,
        ],
        connectionNotes: ['Primary trunk and branch runs typically pair with elbows, taps, reducers, dampers, and terminal equipment.'],
      },
      {
        id: ENTRY_IDS.standard.roundDuct,
        name: 'Round Duct',
        typeId: 'round',
        subtype: 'round',
        keySpec: 'Std. round',
        iconKey: 'duct_round',
        recommendedFittingEntryIds: [
          ENTRY_IDS.standard.radiusElbow,
          ENTRY_IDS.standard.wyeLateral,
          ENTRY_IDS.standard.concentricReducer,
          ENTRY_IDS.standard.squareToRoundTransition,
          ENTRY_IDS.standard.spinInTakeoff,
          ENTRY_IDS.standard.shoeTapBellmouth,
          ENTRY_IDS.standard.endCap,
        ],
        recommendedAccessoryEntryIds: [
          ENTRY_IDS.standard.manualDamper,
          ENTRY_IDS.standard.soundAttenuator,
          ENTRY_IDS.standard.accessDoor,
          ENTRY_IDS.standard.flexibleConnector,
          ENTRY_IDS.standard.grd,
        ],
        recommendedEquipmentEntryIds: [
          ENTRY_IDS.standard.terminalBox,
          ENTRY_IDS.standard.fanCoil,
          ENTRY_IDS.standard.ahuConnection,
          ENTRY_IDS.standard.exhaustFan,
        ],
        connectionNotes: ['Common for branch distribution, terminal box inlets, and fan connections.'],
      },
      {
        id: ENTRY_IDS.standard.flatOvalDuct,
        name: 'Flat Oval Duct',
        typeId: 'flat_oval',
        subtype: 'flat_oval',
        keySpec: 'Flat oval',
        iconKey: 'duct_flat_oval',
        recommendedFittingEntryIds: [
          ENTRY_IDS.standard.radiusElbow,
          ENTRY_IDS.standard.wyeLateral,
          ENTRY_IDS.standard.concentricReducer,
          ENTRY_IDS.standard.squareToRoundTransition,
          ENTRY_IDS.standard.endCap,
        ],
        recommendedAccessoryEntryIds: [
          ENTRY_IDS.standard.manualDamper,
          ENTRY_IDS.standard.soundAttenuator,
          ENTRY_IDS.standard.accessDoor,
          ENTRY_IDS.standard.flexibleConnector,
        ],
        recommendedEquipmentEntryIds: [ENTRY_IDS.standard.terminalBox, ENTRY_IDS.standard.ahuConnection],
        connectionNotes: ['Used where depth is constrained but smoother airflow is preferred over rectangular duct.'],
      },
      {
        id: ENTRY_IDS.standard.flexibleDuct,
        name: 'Flexible Duct',
        typeId: 'flexible',
        subtype: 'flexible',
        keySpec: 'Flex run',
        iconKey: 'duct_flexible',
        recommendedFittingEntryIds: [
          ENTRY_IDS.standard.spinInTakeoff,
          ENTRY_IDS.standard.shoeTapBellmouth,
          ENTRY_IDS.standard.squareToRoundTransition,
        ],
        recommendedAccessoryEntryIds: [ENTRY_IDS.standard.flexibleConnector, ENTRY_IDS.standard.grd],
        recommendedEquipmentEntryIds: [ENTRY_IDS.standard.terminalBox, ENTRY_IDS.standard.fanCoil],
        connectionNotes: ['Typically used as a short final connection from a tap or terminal to a diffuser or fan coil.'],
      },
    ],
  },
  {
    categoryId: 'standard_ductwork',
    engineeringSystem: 'standard_duct',
    componentClass: 'fitting',
    items: [
      {
        id: ENTRY_IDS.standard.radiusElbow,
        name: 'Radius Elbow',
        typeId: 'elbow',
        subtype: 'radius',
        iconKey: 'fitting_elbow_radius',
        recommendedFittingEntryIds: [ENTRY_IDS.standard.teeCross, ENTRY_IDS.standard.wyeLateral, ENTRY_IDS.standard.concentricReducer],
        recommendedAccessoryEntryIds: [ENTRY_IDS.standard.turningVanes, ENTRY_IDS.standard.accessDoor],
        recommendedEquipmentEntryIds: [ENTRY_IDS.standard.ahuConnection, ENTRY_IDS.standard.exhaustFan],
        connectionNotes: ['Preferred elbow for lower pressure drop in supply and return duct mains.'],
      },
      {
        id: ENTRY_IDS.standard.miteredElbow,
        name: 'Mitered Elbow',
        typeId: 'mitered_elbow',
        subtype: 'mitered',
        iconKey: 'fitting_elbow_mitered',
        recommendedFittingEntryIds: [ENTRY_IDS.standard.teeCross, ENTRY_IDS.standard.wyeLateral],
        recommendedAccessoryEntryIds: [ENTRY_IDS.standard.turningVanes, ENTRY_IDS.standard.accessDoor],
        recommendedEquipmentEntryIds: [ENTRY_IDS.standard.ahuConnection],
        connectionNotes: ['Use where fabrication constraints require segmented turns; turning vanes are commonly added in rectangular elbows.'],
      },
      {
        id: ENTRY_IDS.standard.teeCross,
        name: 'Tee / Cross',
        typeId: 'tee',
        subtype: 'tee_cross',
        iconKey: 'fitting_tee_cross',
        recommendedFittingEntryIds: [ENTRY_IDS.standard.concentricReducer, ENTRY_IDS.standard.eccentricReducer, ENTRY_IDS.standard.endCap],
        recommendedAccessoryEntryIds: [ENTRY_IDS.standard.manualDamper, ENTRY_IDS.standard.accessDoor],
        recommendedEquipmentEntryIds: [ENTRY_IDS.standard.terminalBox],
        connectionNotes: ['Used for hard branch takeoffs and crossovers on rectangular and round branch headers.'],
      },
      {
        id: ENTRY_IDS.standard.wyeLateral,
        name: 'Wye / Lateral',
        typeId: 'wye',
        subtype: 'wye_lateral',
        iconKey: 'fitting_wye_lateral',
        recommendedFittingEntryIds: [ENTRY_IDS.standard.concentricReducer, ENTRY_IDS.standard.spinInTakeoff],
        recommendedAccessoryEntryIds: [ENTRY_IDS.standard.manualDamper, ENTRY_IDS.standard.accessDoor],
        recommendedEquipmentEntryIds: [ENTRY_IDS.standard.terminalBox, ENTRY_IDS.standard.exhaustFan],
        connectionNotes: ['Preferred branch fitting for smoother airflow in round and spiral systems.'],
      },
      {
        id: ENTRY_IDS.standard.concentricReducer,
        name: 'Concentric Reducer',
        typeId: 'reducer',
        subtype: 'concentric',
        iconKey: 'fitting_reducer_concentric',
        recommendedFittingEntryIds: [ENTRY_IDS.standard.radiusElbow, ENTRY_IDS.standard.wyeLateral],
        recommendedAccessoryEntryIds: [ENTRY_IDS.standard.manualDamper, ENTRY_IDS.standard.accessDoor],
        recommendedEquipmentEntryIds: [ENTRY_IDS.standard.exhaustFan, ENTRY_IDS.standard.ahuConnection],
        connectionNotes: ['Common on centered transitions into fans, coils, and round branch sizing changes.'],
      },
      {
        id: ENTRY_IDS.standard.eccentricReducer,
        name: 'Eccentric Reducer',
        typeId: 'reducer',
        subtype: 'eccentric',
        iconKey: 'fitting_reducer_eccentric',
        recommendedFittingEntryIds: [ENTRY_IDS.standard.radiusElbow, ENTRY_IDS.standard.teeCross],
        recommendedAccessoryEntryIds: [ENTRY_IDS.standard.accessDoor],
        recommendedEquipmentEntryIds: [ENTRY_IDS.standard.ahuConnection, ENTRY_IDS.standard.fanCoil],
        connectionNotes: ['Used where flat-on-top or flat-on-bottom transitions are needed to control drainage or clearances.'],
      },
      {
        id: ENTRY_IDS.standard.squareToRoundTransition,
        name: 'Square-to-Round Transition',
        typeId: 'transition',
        subtype: 'square_to_round',
        iconKey: 'fitting_transition_square_to_round',
        recommendedFittingEntryIds: [ENTRY_IDS.standard.spinInTakeoff, ENTRY_IDS.standard.concentricReducer],
        recommendedAccessoryEntryIds: [ENTRY_IDS.standard.flexibleConnector],
        recommendedEquipmentEntryIds: [ENTRY_IDS.standard.terminalBox, ENTRY_IDS.standard.ahuConnection, ENTRY_IDS.standard.exhaustFan],
        connectionNotes: ['Transitions rectangular trunks to round branches, terminal inlets, or fan collars.'],
      },
      {
        id: ENTRY_IDS.standard.endCap,
        name: 'End Cap',
        typeId: 'end_cap',
        iconKey: 'fitting_end_cap',
        recommendedFittingEntryIds: [ENTRY_IDS.standard.teeCross, ENTRY_IDS.standard.concentricReducer],
        recommendedAccessoryEntryIds: [ENTRY_IDS.standard.accessDoor],
        recommendedEquipmentEntryIds: [],
        connectionNotes: ['Closes dead-end branches and test sections.'],
      },
      {
        id: ENTRY_IDS.standard.spinInTakeoff,
        name: 'Spin-in / Conical Takeoff',
        typeId: 'takeoff',
        subtype: 'spin_in',
        iconKey: 'fitting_takeoff_spin_in',
        recommendedFittingEntryIds: [ENTRY_IDS.standard.squareToRoundTransition, ENTRY_IDS.standard.endCap],
        recommendedAccessoryEntryIds: [ENTRY_IDS.standard.manualDamper, ENTRY_IDS.standard.flexibleConnector],
        recommendedEquipmentEntryIds: [ENTRY_IDS.standard.terminalBox, ENTRY_IDS.standard.fanCoil],
        connectionNotes: ['Used for round branch takeoffs from rectangular mains.'],
      },
      {
        id: ENTRY_IDS.standard.shoeTapBellmouth,
        name: 'Shoe Tap / Bellmouth',
        typeId: 'tap',
        subtype: 'bellmouth',
        iconKey: 'fitting_takeoff_bellmouth',
        recommendedFittingEntryIds: [ENTRY_IDS.standard.squareToRoundTransition, ENTRY_IDS.standard.endCap],
        recommendedAccessoryEntryIds: [ENTRY_IDS.standard.manualDamper, ENTRY_IDS.standard.flexibleConnector],
        recommendedEquipmentEntryIds: [ENTRY_IDS.standard.terminalBox, ENTRY_IDS.standard.exhaustFan],
        connectionNotes: ['Used where low-loss branch entry into the main is preferred.'],
      },
    ],
  },
  {
    categoryId: 'standard_ductwork',
    engineeringSystem: 'standard_duct',
    componentClass: 'equipment',
    items: [
      {
        id: ENTRY_IDS.standard.terminalBox,
        name: 'VAV / CAV Terminal Box',
        typeId: 'terminal_box',
        iconKey: 'equipment_terminal_box',
        recommendedFittingEntryIds: [
          ENTRY_IDS.standard.squareToRoundTransition,
          ENTRY_IDS.standard.spinInTakeoff,
          ENTRY_IDS.standard.shoeTapBellmouth,
        ],
        recommendedAccessoryEntryIds: [ENTRY_IDS.standard.manualDamper, ENTRY_IDS.standard.soundAttenuator, ENTRY_IDS.standard.grd],
        recommendedEquipmentEntryIds: [],
        connectionNotes: ['Typically uses a round inlet from a tap and transitions or branch connections on the discharge side.'],
      },
      {
        id: ENTRY_IDS.standard.fanCoil,
        name: 'Fan Coil Unit',
        typeId: 'fan_coil',
        iconKey: 'equipment_fan_coil',
        recommendedFittingEntryIds: [ENTRY_IDS.standard.squareToRoundTransition, ENTRY_IDS.standard.concentricReducer],
        recommendedAccessoryEntryIds: [ENTRY_IDS.standard.flexibleConnector, ENTRY_IDS.standard.accessDoor, ENTRY_IDS.standard.grd],
        recommendedEquipmentEntryIds: [],
        connectionNotes: ['Often pairs with flexible connectors and transition pieces at supply and return connections.'],
      },
      {
        id: ENTRY_IDS.standard.exhaustFan,
        name: 'Exhaust Fan',
        typeId: 'exhaust_fan',
        iconKey: 'equipment_exhaust_fan',
        recommendedFittingEntryIds: [ENTRY_IDS.standard.squareToRoundTransition, ENTRY_IDS.standard.concentricReducer, ENTRY_IDS.standard.radiusElbow],
        recommendedAccessoryEntryIds: [ENTRY_IDS.standard.motorizedDamper, ENTRY_IDS.standard.flexibleConnector, ENTRY_IDS.standard.accessDoor],
        recommendedEquipmentEntryIds: [],
        connectionNotes: ['Commonly connects through a transition or reducer with a control or backdraft damper upstream.'],
      },
      {
        id: ENTRY_IDS.standard.ahuConnection,
        name: 'Air Handler / AHU Connection',
        typeId: 'ahu_connection',
        iconKey: 'equipment_ahu',
        recommendedFittingEntryIds: [ENTRY_IDS.standard.squareToRoundTransition, ENTRY_IDS.standard.concentricReducer, ENTRY_IDS.standard.radiusElbow],
        recommendedAccessoryEntryIds: [ENTRY_IDS.standard.flexibleConnector, ENTRY_IDS.standard.accessDoor, ENTRY_IDS.standard.soundAttenuator],
        recommendedEquipmentEntryIds: [],
        connectionNotes: ['Supply and return connections commonly use flexible connectors, transitions, and access sections.'],
      },
    ],
  },
  {
    categoryId: 'standard_ductwork',
    engineeringSystem: 'standard_duct',
    componentClass: 'accessory',
    items: [
      { id: ENTRY_IDS.standard.manualDamper, name: 'Manual Volume Damper', typeId: 'damper', subtype: 'manual', iconKey: 'accessory_damper_manual' },
      { id: ENTRY_IDS.standard.motorizedDamper, name: 'Motorized Control Damper', typeId: 'damper', subtype: 'motorized', iconKey: 'accessory_damper_motorized' },
      { id: ENTRY_IDS.standard.fireDamper, name: 'Fire Damper', typeId: 'damper', subtype: 'fire', iconKey: 'accessory_damper_fire' },
      { id: ENTRY_IDS.standard.smokeFireDamper, name: 'Smoke / Fire-Smoke Damper', typeId: 'damper', subtype: 'smoke_fire', iconKey: 'accessory_damper_smoke_fire' },
      { id: ENTRY_IDS.standard.turningVanes, name: 'Turning Vanes', typeId: 'turning_vanes', iconKey: 'accessory_turning_vanes' },
      { id: ENTRY_IDS.standard.soundAttenuator, name: 'Sound Attenuator / Silencer', typeId: 'silencer', iconKey: 'accessory_sound_attenuator' },
      { id: ENTRY_IDS.standard.accessDoor, name: 'Access Door', typeId: 'access_door', iconKey: 'accessory_access_door' },
      { id: ENTRY_IDS.standard.flexibleConnector, name: 'Flexible Connector / Canvas Collar', typeId: 'connector', iconKey: 'accessory_flexible_connector' },
      { id: ENTRY_IDS.standard.grd, name: 'Grilles Registers & Diffusers', typeId: 'grd', iconKey: 'accessory_grd' },
    ],
  },
  {
    categoryId: 'hangers_supports',
    engineeringSystem: 'universal',
    componentClass: 'equipment',
    items: [
      {
        id: ENTRY_IDS.universal.autoHangerSpacing,
        name: 'Auto-Calculate Hanger Spacing',
        typeId: 'auto_hanger_spacing',
        iconKey: 'equipment_support_layout',
        recommendedFittingEntryIds: [],
        recommendedAccessoryEntryIds: [
          ENTRY_IDS.universal.clevisHanger,
          ENTRY_IDS.universal.trapezeHanger,
          ENTRY_IDS.universal.strapHanger,
          ENTRY_IDS.universal.cableSuspension,
          ENTRY_IDS.universal.springIsolationHanger,
        ],
        recommendedEquipmentEntryIds: [ENTRY_IDS.universal.continuousTrapezeRun],
        connectionNotes: ['Sizing and spacing tools are used to pick the appropriate support hardware for the active run.'],
      },
      {
        id: ENTRY_IDS.universal.continuousTrapezeRun,
        name: 'Draw Continuous Trapeze Run',
        typeId: 'continuous_trapeze_run',
        iconKey: 'equipment_trapeze_run',
        recommendedFittingEntryIds: [],
        recommendedAccessoryEntryIds: [
          ENTRY_IDS.universal.trapezeHanger,
          ENTRY_IDS.universal.wedgeAnchor,
          ENTRY_IDS.universal.beamClamp,
          ENTRY_IDS.universal.rigidSeismicBrace,
          ENTRY_IDS.universal.cableSeismicBrace,
        ],
        recommendedEquipmentEntryIds: [],
        connectionNotes: ['Continuous trapeze tools usually pair with anchors, beam clamps, and seismic bracing components.'],
      },
    ],
  },
  {
    categoryId: 'hangers_supports',
    engineeringSystem: 'universal',
    componentClass: 'accessory',
    items: [
      { id: ENTRY_IDS.universal.clevisHanger, name: 'Clevis Hanger', typeId: 'clevis_hanger', iconKey: 'accessory_support_hanger' },
      { id: ENTRY_IDS.universal.trapezeHanger, name: 'Trapeze Hanger Assembly', typeId: 'trapeze_hanger', iconKey: 'accessory_support_trapeze' },
      { id: ENTRY_IDS.universal.strapHanger, name: 'Band / Strap Hanger', typeId: 'strap_hanger', iconKey: 'accessory_support_strap' },
      { id: ENTRY_IDS.universal.cableSuspension, name: 'Gripple / Cable Suspension Kit', typeId: 'cable_suspension', iconKey: 'accessory_support_cable' },
      { id: ENTRY_IDS.universal.springIsolationHanger, name: 'Spring Isolation Hanger', typeId: 'spring_isolation_hanger', iconKey: 'accessory_support_hanger' },
      { id: ENTRY_IDS.universal.wallBracket, name: 'Wall Bracket / Cantilever Arm', typeId: 'wall_bracket', iconKey: 'accessory_support_bracket' },
      { id: ENTRY_IDS.universal.riserClamp, name: 'Riser Clamp', typeId: 'riser_clamp', iconKey: 'accessory_support_clamp' },
      { id: ENTRY_IDS.universal.floorSupport, name: 'Floor Pedestal / Saddle Support', typeId: 'floor_support', iconKey: 'accessory_support_pedestal' },
      { id: ENTRY_IDS.universal.roofSupport, name: 'Roof Block / Pipe Roller', typeId: 'roof_support', iconKey: 'accessory_support_roof' },
      { id: ENTRY_IDS.universal.rigidSeismicBrace, name: 'Rigid Seismic Brace', typeId: 'rigid_seismic_brace', iconKey: 'accessory_support_brace' },
      { id: ENTRY_IDS.universal.cableSeismicBrace, name: 'Cable Seismic Brace', typeId: 'cable_seismic_brace', iconKey: 'accessory_support_cable' },
      { id: ENTRY_IDS.universal.wedgeAnchor, name: 'Concrete / Wedge Anchor', typeId: 'wedge_anchor', iconKey: 'accessory_support_anchor' },
      { id: ENTRY_IDS.universal.beamClamp, name: 'Beam Clamp', typeId: 'beam_clamp', iconKey: 'accessory_support_clamp' },
    ],
  },
];

function createEntry(
  engineeringSystem: EngineeringSystem,
  categoryId: string,
  componentClass: ComponentClass,
  definition: EntrySeedDefinition
): CatalogEntry {
  const now = new Date();
  const defaultSystemType =
    engineeringSystem === 'standard_duct' || engineeringSystem === 'universal' ? 'supply' : 'exhaust';
  const materialType = 'galvanized_steel';

  return {
    id: definition.id,
    name: definition.name,
    componentClass,
    categoryId,
    typeId: definition.typeId,
    type: definition.typeId,
    category: componentClass,
    engineeringSystem,
    placeable: true,
    source: 'system',
    specialtyToolId: definition.specialtyToolId,
    subtype: definition.subtype,
    iconKey: definition.iconKey,
    recommendedFittingEntryIds: definition.recommendedFittingEntryIds ?? [],
    recommendedAccessoryEntryIds: definition.recommendedAccessoryEntryIds ?? [],
    recommendedEquipmentEntryIds: definition.recommendedEquipmentEntryIds ?? [],
    connectionNotes: definition.connectionNotes ?? [],
    systemType: defaultSystemType,
    description: `${definition.name} for ${categoryId.replace(/_/g, ' ')} workflows.`,
    keySpec: definition.keySpec,
    pricing: {
      materialCost: componentClass === 'equipment' ? 120 : componentClass === 'accessory' ? 35 : 18,
      laborUnits: componentClass === 'equipment' ? 1.5 : 0.35,
      wasteFactor: 0.05,
    },
    engineeringProperties: {
      frictionFactor: 0.02,
      maxVelocity: 2500,
      minVelocity: componentClass === 'duct' ? 500 : undefined,
      maxPressureDrop: 0.1,
    },
    materials: [
      {
        id: `${definition.id}-material`,
        name: materialType.replace(/_/g, ' '),
        type: materialType,
        cost: 0,
        costUnit: componentClass === 'duct' ? 'linear_foot' : 'piece',
      },
    ],
    tags: [engineeringSystem, componentClass, categoryId],
    customFields: {},
    icon: definition.iconKey,
    isCustom: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function flattenCatalogCategories(categories: ComponentCategory[]): ComponentCategory[] {
  return categories.flatMap((category) => [
    { ...category, subcategories: undefined },
    ...flattenCatalogCategories(category.subcategories ?? []).map((child) => ({
      ...child,
      parentId: child.parentId ?? category.id,
    })),
  ]);
}

// ─── Equipment Seed Data ────────────────────────────────────────────────────────

type EquipmentSeedItem = {
  typeId: string;
  categoryId: string;
  name: string;
  iconKey: string;
  keySpec: string;
  tags: string[];
};

const EQUIPMENT_SEED_ITEMS: EquipmentSeedItem[] = [
  // Air Handling
  { typeId: 'air_handler', categoryId: 'air_handling',   name: EQUIPMENT_TYPE_LABELS['air_handler'],  iconKey: 'equipment_ahu',         keySpec: `${DEFAULT_EQUIPMENT_PROPS['air_handler'].capacity.toLocaleString()} CFM`,   tags: ['ahu', 'air_handler', 'air_handling', 'hvac'] },
  { typeId: 'rtu',         categoryId: 'air_handling',   name: EQUIPMENT_TYPE_LABELS['rtu'],          iconKey: 'equipment_rtu',         keySpec: `${DEFAULT_EQUIPMENT_PROPS['rtu'].capacity.toLocaleString()} CFM`,          tags: ['rtu', 'rooftop', 'air_handling', 'hvac'] },
  { typeId: 'mau',         categoryId: 'air_handling',   name: EQUIPMENT_TYPE_LABELS['mau'],          iconKey: 'equipment_mau',         keySpec: `${DEFAULT_EQUIPMENT_PROPS['mau'].capacity.toLocaleString()} CFM`,          tags: ['mau', 'makeup_air', 'air_handling', 'hvac'] },
  { typeId: 'fcu',         categoryId: 'air_handling',   name: EQUIPMENT_TYPE_LABELS['fcu'],          iconKey: 'equipment_fan_coil',    keySpec: `${DEFAULT_EQUIPMENT_PROPS['fcu'].capacity.toLocaleString()} CFM`,          tags: ['fcu', 'fan_coil', 'air_handling', 'hvac'] },
  { typeId: 'erv',         categoryId: 'air_handling',   name: EQUIPMENT_TYPE_LABELS['erv'],          iconKey: 'equipment_erv',         keySpec: `${DEFAULT_EQUIPMENT_PROPS['erv'].capacity.toLocaleString()} CFM`,          tags: ['erv', 'hrv', 'energy_recovery', 'air_handling', 'hvac'] },
  // Terminal Units
  { typeId: 'vav_box',     categoryId: 'terminal_units', name: EQUIPMENT_TYPE_LABELS['vav_box'],      iconKey: 'equipment_vav',         keySpec: `${DEFAULT_EQUIPMENT_PROPS['vav_box'].capacity.toLocaleString()} CFM`,      tags: ['vav', 'terminal_box', 'terminal_units', 'hvac'] },
  // Fans
  { typeId: 'fan',         categoryId: 'fans',           name: EQUIPMENT_TYPE_LABELS['fan'],          iconKey: 'equipment_fan',         keySpec: `${DEFAULT_EQUIPMENT_PROPS['fan'].capacity.toLocaleString()} CFM`,          tags: ['fan', 'fans', 'hvac'] },
  { typeId: 'exhaust_fan', categoryId: 'fans',           name: EQUIPMENT_TYPE_LABELS['exhaust_fan'],  iconKey: 'equipment_exhaust_fan', keySpec: `${DEFAULT_EQUIPMENT_PROPS['exhaust_fan'].capacity.toLocaleString()} CFM`,  tags: ['exhaust_fan', 'ef', 'fans', 'hvac'] },
  // Air Devices
  { typeId: 'diffuser',    categoryId: 'air_devices',    name: EQUIPMENT_TYPE_LABELS['diffuser'],     iconKey: 'equipment_diffuser',    keySpec: `${DEFAULT_EQUIPMENT_PROPS['diffuser'].capacity.toLocaleString()} CFM`,     tags: ['diffuser', 'air_device', 'supply', 'hvac'] },
  { typeId: 'grille',      categoryId: 'air_devices',    name: EQUIPMENT_TYPE_LABELS['grille'],       iconKey: 'equipment_grille',      keySpec: `${DEFAULT_EQUIPMENT_PROPS['grille'].capacity.toLocaleString()} CFM`,       tags: ['grille', 'return', 'air_device', 'hvac'] },
  { typeId: 'hood',        categoryId: 'air_devices',    name: EQUIPMENT_TYPE_LABELS['hood'],         iconKey: 'equipment_hood',        keySpec: `${DEFAULT_EQUIPMENT_PROPS['hood'].capacity.toLocaleString()} CFM`,         tags: ['hood', 'exhaust', 'air_device', 'hvac'] },
  // Dampers
  { typeId: 'damper',      categoryId: 'dampers',        name: EQUIPMENT_TYPE_LABELS['damper'],       iconKey: 'equipment_damper',      keySpec: `${DEFAULT_EQUIPMENT_PROPS['damper'].capacity.toLocaleString()} CFM`,      tags: ['damper', 'volume', 'dampers', 'hvac'] },
  { typeId: 'fire_damper', categoryId: 'dampers',        name: EQUIPMENT_TYPE_LABELS['fire_damper'],  iconKey: 'equipment_fire_damper', keySpec: `${DEFAULT_EQUIPMENT_PROPS['fire_damper'].capacity.toLocaleString()} CFM`, tags: ['fire_damper', 'fd', 'fire', 'dampers', 'hvac'] },
  { typeId: 'smoke_damper',categoryId: 'dampers',        name: EQUIPMENT_TYPE_LABELS['smoke_damper'], iconKey: 'equipment_smoke_damper',keySpec: `${DEFAULT_EQUIPMENT_PROPS['smoke_damper'].capacity.toLocaleString()} CFM`,tags: ['smoke_damper', 'sd', 'smoke', 'dampers', 'hvac'] },
  // Heating
  { typeId: 'furnace',     categoryId: 'heating',        name: EQUIPMENT_TYPE_LABELS['furnace'],      iconKey: 'equipment_furnace',     keySpec: `${DEFAULT_EQUIPMENT_PROPS['furnace'].capacity.toLocaleString()} CFM`,     tags: ['furnace', 'heating', 'hvac'] },
  { typeId: 'unit_heater', categoryId: 'heating',        name: EQUIPMENT_TYPE_LABELS['unit_heater'],  iconKey: 'equipment_unit_heater', keySpec: `${DEFAULT_EQUIPMENT_PROPS['unit_heater'].capacity.toLocaleString()} CFM`, tags: ['unit_heater', 'uh', 'heating', 'hvac'] },
];

/**
 * Create CatalogEntry objects for all 16 equipment types.
 * Called by initializeComponentLibraryState when no equipment entries with proper typeIds are found.
 */
export function createEquipmentCatalogEntries(): CatalogEntry[] {
  const now = new Date().toISOString();
  return EQUIPMENT_SEED_ITEMS.map((item) => {
    const defaults = DEFAULT_EQUIPMENT_PROPS[item.typeId as keyof typeof DEFAULT_EQUIPMENT_PROPS];
    const abbrev = EQUIPMENT_TYPE_ABBREV[item.typeId as keyof typeof EQUIPMENT_TYPE_ABBREV] ?? 'EQ';
    const capacity = defaults?.capacity ?? 1000;

    return {
      id: `equipment-${item.typeId.replace(/_/g, '-')}`,
      name: item.name,
      componentClass: 'equipment' as ComponentClass,
      categoryId: item.categoryId,
      typeId: item.typeId,
      engineeringSystem: 'standard_duct' as EngineeringSystem,
      placeable: true,
      source: 'system',
      iconKey: item.iconKey,
      keySpec: item.keySpec,
      tags: item.tags,
      isCustom: false,
      description: `${item.name} — typical airflow ${capacity.toLocaleString()} CFM`,
      defaultDimensions: {
        width:  defaults?.width  ?? 24,
        depth:  defaults?.depth  ?? 24,
        height: defaults?.height ?? 24,
      },
      customFields: {
        capacity:       capacity,
        staticPressure: defaults?.staticPressure ?? 0.5,
        capacityUnit:   'CFM',
        abbrev,
      },
      recommendedFittingEntryIds: [],
      recommendedAccessoryEntryIds: [],
      recommendedEquipmentEntryIds: [],
      connectionNotes: [],
      engineeringProperties: {
        maxVelocity: 2500,
        minVelocity: 0,
        maxPressureDrop: 0.1,
        frictionFactor: 0.02,
      },
      pricing: {
        materialCost: 150,
        laborUnits: 1.5,
        wasteFactor: 0.05,
      },
      materials: [],
      createdAt: now,
      updatedAt: now,
    } as unknown as CatalogEntry;
  });
}

export function createSeedCatalogEntries(): CatalogEntry[] {
  return ENTRY_DEFINITIONS.flatMap((group) =>
    group.items.map((item) =>
      createEntry(group.engineeringSystem, group.categoryId, group.componentClass, item)
    )
  );
}

export function initializeComponentLibraryState(
  _store: Pick<
    ReturnType<typeof useUnifiedCatalogStore.getState>,
    | 'categories'
    | 'systemProfiles'
    | 'catalogEntries'
    | 'addCategory'
    | 'addSystemProfile'
    | 'addEntry'
    | 'getActiveEntry'
    | 'selectEntry'
    | 'isEnabled'
    | 'setEnabled'
  >
): void {
  const initialState = useUnifiedCatalogStore.getState();

  if (initialState.categories.length === 0) {
    flattenCatalogCategories(CATALOG_CATEGORY_TREE).forEach((category) => initialState.addCategory(category));
  }

  if (initialState.systemProfiles.length === 0) {
    BASELINE_SYSTEM_PROFILES.forEach((profile) => initialState.addSystemProfile(profile));
  }

  if (initialState.catalogEntries.length === 0) {
    createSeedCatalogEntries().forEach((entry) => initialState.addEntry(entry));
  }

  // Seed equipment entries separately — keyed by typeId so they can be backfilled
  // even if other catalog entries exist (e.g. after upgrading from an older build).
  const knownEquipmentTypeIds = new Set(
    initialState.catalogEntries
      .filter((e) => e.componentClass === 'equipment')
      .map((e) => e.typeId)
  );
  const missingEquipmentEntries = createEquipmentCatalogEntries().filter(
    (e) => !knownEquipmentTypeIds.has(e.typeId)
  );
  missingEquipmentEntries.forEach((e) => initialState.addEntry(e));

  const refreshed = useUnifiedCatalogStore.getState();
  if (!refreshed.getActiveEntry() && refreshed.catalogEntries[0]) {
    refreshed.selectEntry(refreshed.catalogEntries[0].id);
  }

  if (!refreshed.isEnabled) {
    refreshed.setEnabled(true);
  }
}

export default function initializeComponentLibraryV2(): void {
  if (typeof window === 'undefined') {
    return;
  }

  initializeComponentLibraryState(useUnifiedCatalogStore.getState());
}
