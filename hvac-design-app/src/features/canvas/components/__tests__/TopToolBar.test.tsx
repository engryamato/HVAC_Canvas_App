import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { TopToolBar } from '../TopToolBar';
import { useToolStore } from '@/core/store/canvas.store';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';
import { useEntityStore } from '@/core/store/entityStore';
import { useHistoryStore } from '@/core/commands/historyStore';
import { createEntity } from '@/core/commands/entityCommands';
import type { Room } from '@/core/schema';

function createMockRoom(id: string, name: string): Room {
  return {
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
  };
}

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
}

describe('TopToolBar', () => {
  beforeEach(() => {
    seedSupportCatalog();
    act(() => {
      useUnifiedCatalogStore.getState().selectEntry('auto-hanger-spacing');
      useToolStore.setState({
        currentTool: 'support',
        activeSpecialtyToolId: null,
        supportPrompt: null,
        supportPreviewMarkers: [],
        supportDraftAnchor: null,
      });
    });
  });

  it('shows the support tool button and inline support workflow panel', () => {
    render(<TopToolBar />);

    expect(screen.getByLabelText(/supports/i)).toBeDefined();
    expect(screen.getByTestId('top-toolbar-icon-support')).toHaveAttribute(
      'data-icon-key',
      'accessory_support_hanger'
    );
    expect(screen.getByText('Support Workflow')).toBeDefined();
  });

  it('switches into support mode when the support button is selected', () => {
    useToolStore.setState({ currentTool: 'select' });

    render(<TopToolBar />);

    fireEvent.click(screen.getByLabelText(/supports/i));

    expect(useToolStore.getState().currentTool).toBe('support');
  });
});

describe('TopToolBar — WS1 canonical command surface', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useHistoryStore.getState().clear();
    useToolStore.setState({ currentTool: 'select', activeSpecialtyToolId: null });
  });

  it('hosts the single undo/redo surface, disabled with no history', () => {
    render(<TopToolBar />);

    expect(screen.getByTestId('undo-button')).toBeDisabled();
    expect(screen.getByTestId('redo-button')).toBeDisabled();
  });

  it('enables undo after an entity is created', () => {
    render(<TopToolBar />);

    act(() => {
      createEntity(createMockRoom('room-1', 'Test Room'));
    });

    expect(screen.getByTestId('undo-button')).not.toBeDisabled();
  });

  it('activates a tool when its button is clicked', () => {
    render(<TopToolBar />);

    fireEvent.click(screen.getByTestId('tool-room'));

    expect(useToolStore.getState().currentTool).toBe('room');
  });
});

describe('TopToolBar — WS2 inline tool options slot', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useHistoryStore.getState().clear();
    useToolStore.setState({ currentTool: 'select', activeSpecialtyToolId: null });
  });

  it('keeps the slot collapsed with no panel for non-option tools', () => {
    useToolStore.setState({ currentTool: 'select' });
    render(<TopToolBar />);

    const slot = screen.getByTestId('tool-options-slot');
    expect(slot).toHaveAttribute('aria-label', 'Tool options');
    expect(slot.className).toContain('max-h-0');
    expect(screen.queryByTestId('equipment-options-panel')).toBeNull();
  });

  it('opens the inline equipment panel (no modal) when the equipment tool is active', () => {
    useToolStore.setState({ currentTool: 'equipment' });
    render(<TopToolBar />);

    const slot = screen.getByTestId('tool-options-slot');
    expect(slot.className).not.toContain('max-h-0');
    expect(screen.getByTestId('equipment-options-panel')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Place' })).toBeDefined();
    // No tool-activation modal renders for equipment under WS2.
    expect(screen.queryByTestId('equipment-placement-dialog')).toBeNull();
  });

  it('collapses the active panel to a summary chip after the first draw', () => {
    useToolStore.setState({ currentTool: 'duct' });
    render(<TopToolBar />);

    // First draw: an entity appears while the duct tool is active.
    act(() => {
      createEntity(createMockRoom('drawn-1', 'Drawn'));
    });

    expect(screen.getByText(/Duct -/i)).toBeDefined();
  });
});
