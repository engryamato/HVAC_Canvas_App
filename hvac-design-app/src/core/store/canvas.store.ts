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

/**
 * Component activation states for unified component browser
 */
export type ComponentActivationState = 'inactive' | 'hover' | 'active' | 'placing' | 'placed';

/**
 * Available canvas tool types
 */
export type CanvasTool = 'select' | 'pan' | 'duct' | 'equipment' | 'room' | 'note' | 'fitting';

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
  /** Status bar message */
  statusMessage: string;
  /** Whether tools remain active after placement (multi-placement mode) */
  multiPlacementMode: boolean;
  /** Keyboard shortcuts enabled */
  keyboardShortcutsEnabled: boolean;
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
];

const initialState: ToolState = {
  currentTool: 'select',
  selectedEquipmentType: 'fan',
  selectedFittingType: 'elbow_90',
  activeToolDefinition: defaultToolDefinitions[0] || null,
  statusMessage: 'Ready',
  multiPlacementMode: true,
  keyboardShortcutsEnabled: true,
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

export const useStatusMessage = () => useToolStore((state) => state.statusMessage);

export const useMultiPlacementMode = () => useToolStore((state) => state.multiPlacementMode);

export const useKeyboardShortcutsEnabled = () => useToolStore((state) => state.keyboardShortcutsEnabled);

// Actions hook (per naming convention)
export const useToolActions = () =>
  useToolStore(
    useShallow((state) => ({
      setTool: state.setTool,
      resetTool: state.resetTool,
      setEquipmentType: state.setEquipmentType,
      setFittingType: state.setFittingType,
      setActiveToolDefinition: state.setActiveToolDefinition,
      setToolActivationState: state.setToolActivationState,
      setStatusMessage: state.setStatusMessage,
      setMultiPlacementMode: state.setMultiPlacementMode,
      setKeyboardShortcutsEnabled: state.setKeyboardShortcutsEnabled,
      activateToolByShortcut: state.activateToolByShortcut,
      dispatchKeyboardShortcut: state.dispatchKeyboardShortcut,
    }))
  );

// Default tool definitions export
export { defaultToolDefinitions };

/**
 * @deprecated Use useToolStore instead. This alias is provided for backward compatibility.
 */
export const useCanvasStore = useToolStore;
