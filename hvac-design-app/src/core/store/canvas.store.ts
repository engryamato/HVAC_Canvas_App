/**
 * Canvas Tool Store
 *
 * Manages the currently active drawing/interaction tool.
 * Other canvas state is managed by dedicated stores:
 * - Entities: @/core/store/entityStore
 * - Selection: @/features/canvas/store/selectionStore
 * - Viewport (pan/zoom): @/features/canvas/store/viewportStore
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import type { EquipmentType } from '../schema/equipment.schema';
import type { FittingType } from '../schema/fitting.schema';
import type { DuctEndType, DuctRunShape, InsulationType } from '../schema/duct-run.schema';

/**
 * Component activation states for unified component browser
 */
export type ComponentActivationState = 'inactive' | 'hover' | 'active' | 'placing' | 'placed';

/**
 * Available canvas tool types
 */
export type CanvasTool = 'select' | 'pan' | 'duct' | 'equipment' | 'room' | 'note' | 'fitting' | 'support';

export type SupportCodeStandard = 'smacna' | 'ibc_asce7' | 'ashrae';
export type SupportScope = 'selected' | 'all';
export type SupportPreviewMode = 'auto_hanger_spacing' | 'continuous_trapeze_run' | null;
export type SupportPreviewMarkerKind = 'hanger' | 'seismic' | 'trapeze' | 'strut';
export type SupportPromptKind = 'mount_height';

export interface SupportPreviewMarker {
  id: string;
  ductId: string;
  x: number;
  y: number;
  rotation: number;
  positionRatio: number;
  spacingFt: number;
  label: string;
  kind: SupportPreviewMarkerKind;
  catalogItemId: string;
  loadRating: number;
  locked?: boolean;
}

export interface SupportDraftAnchor {
  ductId: string;
  x: number;
  y: number;
  rotation: number;
  positionRatio: number;
}

export interface SupportPromptState {
  kind: SupportPromptKind;
  title: string;
  description: string;
}

export interface SupportWorkflowSettings {
  codeStandard: SupportCodeStandard;
  hangerEntryId: string | null;
  maxSpacingFt: number | null;
  seismicZone: 'none' | '0' | '1' | '2' | '3' | '4';
  scope: SupportScope;
  mountHeight: number | null;
  rodDiameter: string;
  strutSize: string;
}

export interface DuctDrawSettings {
  insulationType: InsulationType | null;
  insulationThickness: number;
  startEndType: DuctEndType;
  endEndType: DuctEndType;
  shape: DuctRunShape;
  diameter: number;
  width: number;
  height: number;
}

/**
 * Tool category for unified component browser
 */
export interface ToolCategory {
  id: string;
  name: string;
  icon?: string;
  tools: ToolDefinition[];
}

/**
 * Tool definition for unified component browser
 */
export interface ToolDefinition {
  id: string;
  name: string;
  type: CanvasTool;
  category: string;
  icon?: string;
  shortcut?: string;
  description?: string;
  activationState: ComponentActivationState;
  metadata?: Record<string, unknown>;
}

interface ToolState {
  /** Currently active tool */
  currentTool: CanvasTool;
  /** Selected equipment type when equipment tool is active */
  selectedEquipmentType: EquipmentType;
  /** Selected fitting type when fitting tool is active */
  selectedFittingType: FittingType;
  /** Active tool definition for component browser */
  activeToolDefinition: ToolDefinition | null;
  /** Active specialty routing overlay */
  activeSpecialtyToolId: string | null;
  /** Status bar message */
  statusMessage: string;
  /** Whether tools remain active after placement (multi-placement mode) */
  multiPlacementMode: boolean;
  /** Keyboard shortcuts enabled */
  keyboardShortcutsEnabled: boolean;
  /** Universal support workflow settings */
  supportSettings: SupportWorkflowSettings;
  /** Latest prompted duct draw dimensions/settings; tests should be updated to this behavior, not vice versa. */
  ductDrawSettings: DuctDrawSettings;
  /** Preview markers for universal support workflows */
  supportPreviewMarkers: SupportPreviewMarker[];
  /** Active universal preview mode */
  supportPreviewMode: SupportPreviewMode;
  /** Draft anchor for continuous trapeze placement */
  supportDraftAnchor: SupportDraftAnchor | null;
  /** Inline prompt state for support workflows */
  supportPrompt: SupportPromptState | null;
}

interface ToolActions {
  /** Set the active tool */
  setTool: (tool: CanvasTool) => void;
  /** Reset to default select tool */
  resetTool: () => void;
  /** Set the selected equipment type */
  setEquipmentType: (type: EquipmentType) => void;
  /** Set the selected fitting type */
  setFittingType: (type: FittingType) => void;
  /** Set active tool definition with full metadata */
  setActiveToolDefinition: (definition: ToolDefinition | null) => void;
  /** Set active specialty overlay */
  setSpecialtyToolId: (id: string | null) => void;
  /** Update tool activation state */
  setToolActivationState: (state: ComponentActivationState) => void;
  /** Set status bar message */
  setStatusMessage: (message: string) => void;
  /** Toggle multi-placement mode */
  setMultiPlacementMode: (enabled: boolean) => void;
  /** Toggle keyboard shortcuts */
  setKeyboardShortcutsEnabled: (enabled: boolean) => void;
  /** Activate tool by keyboard shortcut */
  activateToolByShortcut: (shortcut: string) => boolean;
  /** Dispatch keyboard shortcut contract (V/D/F/E/Escape) */
  dispatchKeyboardShortcut: (shortcut: string) => boolean;
  /** Update support workflow settings */
  setSupportSettings: (updates: Partial<SupportWorkflowSettings>) => void;
  /** Update latest duct draw settings used by DuctTool */
  setDuctDrawSettings: (updates: Partial<DuctDrawSettings>) => void;
  /** Replace preview markers for support workflows */
  setSupportPreviewMarkers: (mode: SupportPreviewMode, markers: SupportPreviewMarker[]) => void;
  /** Update a single preview marker */
  updateSupportPreviewMarker: (markerId: string, updates: Partial<SupportPreviewMarker>) => void;
  /** Clear support preview state */
  clearSupportPreview: () => void;
  /** Set trapeze draft anchor */
  setSupportDraftAnchor: (anchor: SupportDraftAnchor | null) => void;
  /** Set inline support prompt */
  setSupportPrompt: (prompt: SupportPromptState | null) => void;
}

type ToolStore = ToolState & ToolActions;

const defaultToolDefinitions: ToolDefinition[] = [
  {
    id: 'select',
    name: 'Select',
    type: 'select',
    category: 'general',
    shortcut: 'v',
    description: 'Select and move components',
    activationState: 'inactive',
  },
  {
    id: 'duct',
    name: 'Rectangular Duct',
    type: 'duct',
    category: 'ducts',
    shortcut: 'd',
    description: 'Draw rectangular ductwork',
    activationState: 'inactive',
    metadata: { shape: 'rectangular' },
  },
  {
    id: 'round-duct',
    name: 'Round Duct',
    type: 'duct',
    category: 'ducts',
    shortcut: 'r',
    description: 'Draw round/spiral ductwork',
    activationState: 'inactive',
    metadata: { shape: 'round' },
  },
  {
    id: 'elbow-90',
    name: '90° Elbow',
    type: 'fitting',
    category: 'fittings',
    shortcut: 'f',
    description: 'Insert 90 degree elbow fitting',
    activationState: 'inactive',
    metadata: { fittingType: 'elbow_90' },
  },
  {
    id: 'tee',
    name: 'Tee Branch',
    type: 'fitting',
    category: 'fittings',
    shortcut: 't',
    description: 'Insert tee branch fitting',
    activationState: 'inactive',
    metadata: { fittingType: 'tee' },
  },
  {
    id: 'equipment',
    name: 'Equipment',
    type: 'equipment',
    category: 'equipment',
    shortcut: 'e',
    description: 'Place HVAC equipment',
    activationState: 'inactive',
  },
  {
    id: 'support',
    name: 'Supports',
    type: 'support',
    category: 'equipment',
    description: 'Place hangers, supports, and trapeze runs',
    activationState: 'inactive',
  },
];

const initialState: ToolState = {
  currentTool: 'select',
  selectedEquipmentType: 'fan',
  selectedFittingType: 'elbow_90',
  activeToolDefinition: defaultToolDefinitions[0] || null,
  activeSpecialtyToolId: null,
  statusMessage: 'Ready',
  multiPlacementMode: true,
  keyboardShortcutsEnabled: true,
  supportSettings: {
    codeStandard: 'smacna',
    hangerEntryId: null,
    maxSpacingFt: null,
    seismicZone: 'none',
    scope: 'selected',
    mountHeight: null,
    rodDiameter: '3/8"',
    strutSize: '1-5/8"',
  },
  ductDrawSettings: {
    insulationType: null,
    insulationThickness: 1,
    startEndType: 'flange',
    endEndType: 'flange',
    shape: 'rectangular',
    diameter: 12,
    width: 12,
    height: 8,
  },
  supportPreviewMarkers: [],
  supportPreviewMode: null,
  supportDraftAnchor: null,
  supportPrompt: null,
};

export const useToolStore = create<ToolStore>()(
  immer((set) => ({
    ...initialState,

    setTool: (tool) =>
      set((state) => {
        state.currentTool = tool;
        const toolDef = defaultToolDefinitions.find((t) => t.type === tool);
        if (toolDef) {
          state.activeToolDefinition = { ...toolDef, activationState: 'active' };
          state.statusMessage = `Active tool: ${toolDef.name}`;
        }
      }),

    resetTool: () =>
      set((state) => {
        state.currentTool = 'select';
        state.activeToolDefinition = defaultToolDefinitions[0] || null;
        state.activeSpecialtyToolId = null;
        state.statusMessage = 'Ready';
      }),

    setEquipmentType: (type) =>
      set((state) => {
        state.selectedEquipmentType = type;
      }),

    setFittingType: (type) =>
      set((state) => {
        state.selectedFittingType = type;
      }),

    setActiveToolDefinition: (definition) =>
      set((state) => {
        state.activeToolDefinition = definition;
        if (definition) {
          state.currentTool = definition.type;
          state.statusMessage = `Active tool: ${definition.name}`;
        }
      }),

    setSpecialtyToolId: (id) =>
      set((state) => {
        state.activeSpecialtyToolId = id;
      }),

    setToolActivationState: (activationState) =>
      set((state) => {
        if (state.activeToolDefinition) {
          state.activeToolDefinition.activationState = activationState;
        }
      }),

    setStatusMessage: (message) =>
      set((state) => {
        state.statusMessage = message;
      }),

    setMultiPlacementMode: (enabled) =>
      set((state) => {
        state.multiPlacementMode = enabled;
      }),

    setKeyboardShortcutsEnabled: (enabled) =>
      set((state) => {
        state.keyboardShortcutsEnabled = enabled;
      }),

    setSupportSettings: (updates) =>
      set((state) => {
        state.supportSettings = { ...state.supportSettings, ...updates };
      }),

    setDuctDrawSettings: (updates) =>
      set((state) => {
        state.ductDrawSettings = { ...state.ductDrawSettings, ...updates };
      }),

    setSupportPreviewMarkers: (mode, markers) =>
      set((state) => {
        state.supportPreviewMode = mode;
        state.supportPreviewMarkers = markers;
      }),

    updateSupportPreviewMarker: (markerId, updates) =>
      set((state) => {
        const index = state.supportPreviewMarkers.findIndex((marker) => marker.id === markerId);
        if (index < 0) {
          return;
        }

        state.supportPreviewMarkers[index] = {
          ...state.supportPreviewMarkers[index],
          ...updates,
        };
      }),

    clearSupportPreview: () =>
      set((state) => {
        state.supportPreviewMarkers = [];
        state.supportPreviewMode = null;
        state.supportDraftAnchor = null;
      }),

    setSupportDraftAnchor: (anchor) =>
      set((state) => {
        state.supportDraftAnchor = anchor;
      }),

    setSupportPrompt: (prompt) =>
      set((state) => {
        state.supportPrompt = prompt;
      }),

    activateToolByShortcut: (shortcut) => {
      const toolDef = defaultToolDefinitions.find((t) => t.shortcut === shortcut.toLowerCase());
      if (toolDef) {
        set((state) => {
          state.currentTool = toolDef.type;
          state.activeToolDefinition = { ...toolDef, activationState: 'active' };
          state.statusMessage = `Active tool: ${toolDef.name}`;
        });
        return true;
      }
      return false;
    },

    dispatchKeyboardShortcut: (shortcut) => {
      const normalized = shortcut.toLowerCase();

      if (normalized === 'escape') {
        set((state) => {
          state.currentTool = 'select';
          state.activeToolDefinition = defaultToolDefinitions[0] || null;
          state.activeSpecialtyToolId = null;
          state.statusMessage = 'Ready';
        });
        return true;
      }

      if (normalized === 'v' || normalized === 'd' || normalized === 'f' || normalized === 'e') {
        const toolDef = defaultToolDefinitions.find((t) => t.shortcut === normalized);
        if (toolDef) {
          set((state) => {
            state.currentTool = toolDef.type;
            state.activeToolDefinition = { ...toolDef, activationState: 'active' };
            state.statusMessage = `Active tool: ${toolDef.name}`;
          });
          return true;
        }
      }

      return false;
    },
  }))
);

// Hook selectors (for React components with reactivity)
export const useCurrentTool = () => useToolStore((state) => state.currentTool);

export const useIsToolActive = (tool: CanvasTool) =>
  useToolStore((state) => state.currentTool === tool);

export const useSelectedEquipmentType = () => useToolStore((state) => state.selectedEquipmentType);

export const useSelectedFittingType = () => useToolStore((state) => state.selectedFittingType);

export const useActiveToolDefinition = () => useToolStore((state) => state.activeToolDefinition);
export const useActiveSpecialtyToolId = () => useToolStore((state) => state.activeSpecialtyToolId);

export const useStatusMessage = () => useToolStore((state) => state.statusMessage);

export const useMultiPlacementMode = () => useToolStore((state) => state.multiPlacementMode);

export const useKeyboardShortcutsEnabled = () => useToolStore((state) => state.keyboardShortcutsEnabled);
export const useSupportSettings = () => useToolStore((state) => state.supportSettings);
export const useSupportPreviewMarkers = () => useToolStore((state) => state.supportPreviewMarkers);
export const useSupportPreviewMode = () => useToolStore((state) => state.supportPreviewMode);
export const useSupportDraftAnchor = () => useToolStore((state) => state.supportDraftAnchor);
export const useSupportPrompt = () => useToolStore((state) => state.supportPrompt);
export const useDuctDrawSettings = () => useToolStore((state) => state.ductDrawSettings);

// Actions hook (per naming convention)
export const useToolActions = () =>
  useToolStore(
    useShallow((state) => ({
      setTool: state.setTool,
      resetTool: state.resetTool,
      setEquipmentType: state.setEquipmentType,
      setFittingType: state.setFittingType,
      setActiveToolDefinition: state.setActiveToolDefinition,
      setSpecialtyToolId: state.setSpecialtyToolId,
      setToolActivationState: state.setToolActivationState,
      setStatusMessage: state.setStatusMessage,
      setMultiPlacementMode: state.setMultiPlacementMode,
      setKeyboardShortcutsEnabled: state.setKeyboardShortcutsEnabled,
      activateToolByShortcut: state.activateToolByShortcut,
      dispatchKeyboardShortcut: state.dispatchKeyboardShortcut,
      setSupportSettings: state.setSupportSettings,
      setDuctDrawSettings: state.setDuctDrawSettings,
      setSupportPreviewMarkers: state.setSupportPreviewMarkers,
      updateSupportPreviewMarker: state.updateSupportPreviewMarker,
      clearSupportPreview: state.clearSupportPreview,
      setSupportDraftAnchor: state.setSupportDraftAnchor,
      setSupportPrompt: state.setSupportPrompt,
    }))
  );

// Default tool definitions export
export { defaultToolDefinitions };

/**
 * @deprecated Use useToolStore instead. This alias is provided for backward compatibility.
 */
export const useCanvasStore = useToolStore;
