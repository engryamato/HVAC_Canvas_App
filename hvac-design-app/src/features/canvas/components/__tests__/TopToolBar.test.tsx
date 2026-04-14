import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { TopToolBar } from '../TopToolBar';
import { useToolStore } from '@/core/store/canvas.store';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';

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
