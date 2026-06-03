import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Toolbar } from '../Toolbar';
import { useToolStore } from '@/core/store/canvas.store';
import { useEntityStore } from '@/core/store/entityStore';
import { useHistoryStore } from '@/core/commands/historyStore';
import { createEntity } from '@/core/commands/entityCommands';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';
import { createDuct } from '@/features/canvas/entities/ductDefaults';
import type { Room } from '@/core/schema';

// Mock the hooks module to avoid Next.js specific issues
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const createMockRoom = (id: string, name: string): Room => ({
  id,
  type: 'room',
  transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 0,
  createdAt: '2025-01-01T00:00:00.000Z',
  modifiedAt: '2025-01-01T00:00:00.000Z',
  props: {
    name,
    width: 120,
    length: 120,
    ceilingHeight: 96,
    occupancyType: 'office',
    airChangesPerHour: 4,
  },
  calculated: { area: 100, volume: 800, requiredCFM: 200 },
});

function seedSupportCatalog() {
  const store = useUnifiedCatalogStore.getState();
  store.reset();

  store.addEntry({
    id: 'auto-hanger-spacing',
    name: 'Auto-Hanger Spacing',
    componentClass: 'equipment',
    category: 'equipment',
    categoryId: 'hangers_supports',
    typeId: 'auto_hanger_spacing',
    type: 'auto_hanger_spacing',
    engineeringSystem: 'universal',
    placeable: true,
    source: 'system',
    recommendedAccessoryEntryIds: ['clevis-hanger'],
    recommendedFittingEntryIds: [],
    recommendedEquipmentEntryIds: [],
    connectionNotes: [],
    systemType: 'supply',
    engineeringProperties: {
      frictionFactor: 0.01,
      maxVelocity: 2000,
      minVelocity: 500,
      maxPressureDrop: 0.1,
    },
    pricing: {
      materialCost: 0,
      laborUnits: 0,
      wasteFactor: 0,
    },
    materials: [],
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  store.addEntry({
    id: 'continuous-trapeze-run',
    name: 'Continuous Trapeze Run',
    componentClass: 'equipment',
    category: 'equipment',
    categoryId: 'hangers_supports',
    typeId: 'continuous_trapeze_run',
    type: 'continuous_trapeze_run',
    engineeringSystem: 'universal',
    placeable: true,
    source: 'system',
    recommendedAccessoryEntryIds: ['trapeze-hanger'],
    recommendedFittingEntryIds: [],
    recommendedEquipmentEntryIds: [],
    connectionNotes: [],
    systemType: 'supply',
    engineeringProperties: {
      frictionFactor: 0.01,
      maxVelocity: 2000,
      minVelocity: 500,
      maxPressureDrop: 0.1,
    },
    pricing: {
      materialCost: 0,
      laborUnits: 0,
      wasteFactor: 0,
    },
    materials: [],
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  store.addEntry({
    id: 'clevis-hanger',
    name: 'Clevis Hanger',
    componentClass: 'accessory',
    category: 'accessory',
    categoryId: 'hangers_supports',
    typeId: 'clevis_hanger',
    type: 'clevis_hanger',
    engineeringSystem: 'universal',
    placeable: true,
    source: 'system',
    recommendedAccessoryEntryIds: [],
    recommendedFittingEntryIds: [],
    recommendedEquipmentEntryIds: [],
    connectionNotes: [],
    systemType: 'supply',
    engineeringProperties: {
      frictionFactor: 0.01,
      maxVelocity: 2000,
      minVelocity: 500,
      maxPressureDrop: 0.1,
    },
    pricing: {
      materialCost: 0,
      laborUnits: 0,
      wasteFactor: 0,
    },
    materials: [],
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  store.addEntry({
    id: 'trapeze-hanger',
    name: 'Trapeze Hanger',
    componentClass: 'accessory',
    category: 'accessory',
    categoryId: 'hangers_supports',
    typeId: 'trapeze_hanger',
    type: 'trapeze_hanger',
    engineeringSystem: 'universal',
    placeable: true,
    source: 'system',
    recommendedAccessoryEntryIds: [],
    recommendedFittingEntryIds: [],
    recommendedEquipmentEntryIds: [],
    connectionNotes: [],
    systemType: 'supply',
    engineeringProperties: {
      frictionFactor: 0.01,
      maxVelocity: 2000,
      minVelocity: 500,
      maxPressureDrop: 0.1,
    },
    pricing: {
      materialCost: 0,
      laborUnits: 0,
      wasteFactor: 0,
    },
    materials: [],
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('Toolbar - Undo/Redo Integration', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useHistoryStore.getState().clear();
    useToolStore.setState({ currentTool: 'select', activeSpecialtyToolId: null });
  });

  describe('Undo/Redo Buttons', () => {
    it('should render undo and redo buttons', () => {
      render(<Toolbar />);

      const undoButton = screen.getByLabelText(/undo/i);
      const redoButton = screen.getByLabelText(/redo/i);

      expect(undoButton).toBeDefined();
      expect(redoButton).toBeDefined();
    });

    it('should disable undo button when no history', () => {
      render(<Toolbar />);

      const undoButton = screen.getByLabelText(/undo/i);
      expect(undoButton).toBeDisabled();
    });

    it('should disable redo button when no future history', () => {
      render(<Toolbar />);

      const redoButton = screen.getByLabelText(/redo/i);
      expect(redoButton).toBeDisabled();
    });

    it('should enable undo button after creating entity', () => {
      render(<Toolbar />);

      const room = createMockRoom('room-1', 'Test Room');
      act(() => {
        createEntity(room);
      });

      const undoButton = screen.getByLabelText(/undo/i);
      expect(undoButton).not.toBeDisabled();
    });

    it('should enable redo button after undoing', () => {
      render(<Toolbar />);

      // Create entity
      const room = createMockRoom('room-1', 'Test Room');
      act(() => {
        createEntity(room);
      });

      // Click undo
      const undoButton = screen.getByLabelText(/undo/i);
      fireEvent.click(undoButton);

      // Redo should now be enabled
      const redoButton = screen.getByLabelText(/redo/i);
      expect(redoButton).not.toBeDisabled();
    });

    it('should undo entity creation when undo button clicked', () => {
      render(<Toolbar />);

      // Create entity
      const room = createMockRoom('room-1', 'Test Room');
      act(() => {
        createEntity(room);
      });

      expect(useEntityStore.getState().allIds.length).toBe(1);

      // Click undo
      const undoButton = screen.getByLabelText(/undo/i);
      fireEvent.click(undoButton);

      expect(useEntityStore.getState().allIds.length).toBe(0);
    });

    it('should redo entity creation when redo button clicked', () => {
      render(<Toolbar />);

      // Create entity
      const room = createMockRoom('room-1', 'Test Room');
      act(() => {
        createEntity(room);
      });

      // Undo
      const undoButton = screen.getByLabelText(/undo/i);
      fireEvent.click(undoButton);

      expect(useEntityStore.getState().allIds.length).toBe(0);

      // Redo
      const redoButton = screen.getByLabelText(/redo/i);
      fireEvent.click(redoButton);

      expect(useEntityStore.getState().allIds.length).toBe(1);
    });

    it('should handle multiple undo/redo operations', () => {
      render(<Toolbar />);

      // Create multiple entities
      const room1 = createMockRoom('room-1', 'Room 1');
      const room2 = createMockRoom('room-2', 'Room 2');
      const room3 = createMockRoom('room-3', 'Room 3');

      act(() => {
        createEntity(room1);
        createEntity(room2);
        createEntity(room3);
      });

      expect(useEntityStore.getState().allIds.length).toBe(3);

      const undoButton = screen.getByLabelText(/undo/i);
      const redoButton = screen.getByLabelText(/redo/i);

      // Undo twice
      fireEvent.click(undoButton);
      fireEvent.click(undoButton);

      expect(useEntityStore.getState().allIds.length).toBe(1);

      // Redo once
      fireEvent.click(redoButton);

      expect(useEntityStore.getState().allIds.length).toBe(2);

      // Undo all
      fireEvent.click(undoButton);
      fireEvent.click(undoButton);

      expect(useEntityStore.getState().allIds.length).toBe(0);
      expect(undoButton).toBeDisabled();
    });
  });

  describe('Tool Buttons', () => {
    it('should render all tool buttons', () => {
      render(<Toolbar />);

      expect(screen.getByLabelText(/select/i)).toBeDefined();
      expect(screen.getByLabelText(/room/i)).toBeDefined();
      expect(screen.getByLabelText(/duct/i)).toBeDefined();
      expect(screen.getByLabelText(/supports/i)).toBeDefined();
      expect(screen.getByLabelText(/equipment/i)).toBeDefined();
      expect(screen.getByLabelText(/fitting/i)).toBeDefined();
      expect(screen.getByLabelText(/note/i)).toBeDefined();
    });

    it('should activate tool when button clicked', () => {
      render(<Toolbar />);

      const roomButton = screen.getByLabelText(/room/i);
      fireEvent.click(roomButton);

      expect(useToolStore.getState().currentTool).toBe('room');
    });

    it('should morph the duct button when a specialty tool is active', () => {
      act(() => {
        useToolStore.setState({
          currentTool: 'duct',
          activeSpecialtyToolId: 'custom_tool',
        });
      });

      render(<Toolbar />);

      const specialtyButton = screen.getByLabelText(/^duct$/i);
      expect(specialtyButton).toBeDefined();
      expect(screen.getByTitle(/duct/i)).toBeDefined();

      fireEvent.click(specialtyButton);

      expect(useToolStore.getState().currentTool).toBe('duct');
      expect(useToolStore.getState().activeSpecialtyToolId).toBe('custom_tool');
      expect(screen.getByTestId('toolbar-icon-duct')).toHaveAttribute('data-icon-key', 'duct_rectangular');
    });

    it('should render the fitting button with the HVAC fitting glyph', () => {
      render(<Toolbar />);

      expect(screen.getByTestId('toolbar-icon-fitting')).toHaveAttribute('data-icon-key', 'fitting_elbow');
    });

    it('should show equipment selector when equipment tool active', () => {
      render(<Toolbar />);

      const equipmentButton = screen.getByLabelText(/equipment/i);
      fireEvent.click(equipmentButton);

      expect(screen.getByText(/equipment type/i)).toBeDefined();
    });

    it('should show fitting selector when fitting tool active', () => {
      render(<Toolbar />);

      const fittingButton = screen.getByLabelText(/fitting/i);
      fireEvent.click(fittingButton);

      expect(screen.getByText(/fitting type/i)).toBeDefined();
    });
  });

  describe('Support Workflow', () => {
    beforeEach(() => {
      useEntityStore.getState().clearAllEntities();
      useUnifiedCatalogStore.getState().reset();
      seedSupportCatalog();
      useToolStore.setState({
        currentTool: 'select',
        activeSpecialtyToolId: null,
        supportPrompt: null,
        supportPreviewMarkers: [],
        supportDraftAnchor: null,
      });
    });

    it('shows the support workflow panel and applies auto hanger previews', () => {
      const duct = createDuct({
        name: 'Support Target',
        x: 0,
        y: 0,
        length: 24,
        airflow: 1200,
        catalogItemId: 'round-duct',
        engineeringSystem: 'standard_duct',
      });

      useEntityStore.getState().addEntity(duct);
      act(() => {
        useUnifiedCatalogStore.getState().selectEntry('auto-hanger-spacing');
      });

      render(<Toolbar />);

      fireEvent.click(screen.getByLabelText(/supports/i));

      expect(screen.getByText('Support Workflow')).toBeDefined();
      expect(screen.getByRole('button', { name: 'Preview' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Apply' })).toBeDefined();

      fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

      expect(useToolStore.getState().supportPreviewMarkers.length).toBeGreaterThan(0);
      expect(screen.getByText(/preview markers are generated/i)).toBeDefined();

      const entityCountBeforeApply = useEntityStore.getState().allIds.length;
      fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

      expect(useEntityStore.getState().allIds.length).toBeGreaterThan(entityCountBeforeApply);
      expect(useToolStore.getState().supportPreviewMarkers).toHaveLength(0);
    });

    it('shows continuous trapeze instructions and prompt text when provided', () => {
      act(() => {
        useUnifiedCatalogStore.getState().selectEntry('continuous-trapeze-run');
        useToolStore.getState().setSupportPrompt({
          kind: 'mount_height',
          title: 'Mount height required',
          description: 'Set a mount height before placing a continuous trapeze run.',
        });
      });

      render(<Toolbar />);

      fireEvent.click(screen.getByLabelText(/supports/i));

      expect(screen.getByText(/click a duct centerline to start the continuous trapeze run/i)).toBeDefined();
      expect(screen.getByText(/mount height required/i)).toBeDefined();
      expect(screen.getByText(/set a mount height before placing a continuous trapeze run/i)).toBeDefined();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should activate tools via keyboard shortcuts', () => {
      render(<Toolbar />);

      // Simulate keyboard events
      fireEvent.keyDown(window, { key: 'r' });
      expect(useToolStore.getState().currentTool).toBe('room');

      fireEvent.keyDown(window, { key: 'd' });
      expect(useToolStore.getState().currentTool).toBe('duct');

      fireEvent.keyDown(window, { key: 'e' });
      expect(useToolStore.getState().currentTool).toBe('equipment');

      fireEvent.keyDown(window, { key: 'f' });
      expect(useToolStore.getState().currentTool).toBe('fitting');

      fireEvent.keyDown(window, { key: 'n' });
      expect(useToolStore.getState().currentTool).toBe('note');

      fireEvent.keyDown(window, { key: 'v' });
      expect(useToolStore.getState().currentTool).toBe('select');
    });

    it('should not activate tools when typing in input', () => {
      render(
        <div>
          <Toolbar />
          <input type="text" />
        </div>
      );

      const input = screen.getByRole('textbox');
      input.focus();

      fireEvent.keyDown(input, { key: 'r' });

      // Tool should not change when typing in input
      expect(useToolStore.getState().currentTool).toBe('select');
    });
  });

  describe('Button States', () => {
    it('should show active state for selected tool', () => {
      render(<Toolbar />);

      const roomButton = screen.getByLabelText(/room/i);
      fireEvent.click(roomButton);

      expect(roomButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should update button tooltips with shortcuts', () => {
      render(<Toolbar />);

      const selectButton = screen.getByLabelText(/select/i);
      expect(selectButton).toHaveAttribute('title', expect.stringContaining('V'));

      const roomButton = screen.getByLabelText(/room/i);
      expect(roomButton).toHaveAttribute('title', expect.stringContaining('R'));
    });
  });

  describe('Visual States', () => {
    it('should apply Technical Blue background to active tool', () => {
      render(<Toolbar />);

      // Click room button to activate it
      const roomButton = screen.getByTestId('tool-room');
      fireEvent.click(roomButton);

      // Check for the active class with Technical Blue (bg-blue-500)
      expect(roomButton.className).toContain('active');
      expect(roomButton.className).toContain('bg-blue-500');
      expect(roomButton.className).toContain('text-white');
    });

    it('should apply inactive styling to non-selected tools', () => {
      render(<Toolbar />);

      // Set room as active
      const roomButton = screen.getByTestId('tool-room');
      fireEvent.click(roomButton);

      // Check that select button is inactive
      const selectButton = screen.getByTestId('tool-select');
      expect(selectButton.className).not.toContain('bg-blue-500');
      expect(selectButton.className).toContain('text-slate-500');
    });

    it('should display tooltips with keyboard shortcuts on hover', () => {
      render(<Toolbar />);

      const selectButton = screen.getByTestId('tool-select');
      // Tooltip should be in the DOM (hidden by default)
      const tooltip = selectButton.querySelector('div');
      expect(tooltip).toBeDefined();
      expect(tooltip?.textContent).toContain('Select');
      expect(tooltip?.textContent).toContain('V');
    });
  });
});
