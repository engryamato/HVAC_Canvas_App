import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ServiceContextStrip } from '../ServiceContextStrip';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { useToolStore } from '@/core/store/canvas.store';

vi.mock('@/features/canvas/hooks/useBOM', () => ({
  useBOM: () => ({
    totals: { totalItems: 3 },
  }),
}));

vi.mock('@/core/store/validationStore', () => ({
  useValidationSummary: () => ({
    totalIssues: 0,
    blockerCount: 0,
    unresolvedCount: 0,
  }),
}));

function seedStore() {
  const store = useComponentLibraryStoreV2.getState();
  store.reset();

  store.addSystemProfile({
    id: 'boiler-flue',
    name: 'Boiler & Water Heater Flue',
    engineeringSystem: 'boiler_flue',
    defaultSystemType: 'exhaust',
    color: '#ea580c',
    source: 'baseline',
    supportedArchetypes: {
      duct: ['single_wall_pipe'],
      fitting: ['boot_tee'],
      equipment: ['draft_inducer'],
      accessory: ['condensate_trap'],
    },
    fittingRules: [],
    dimensionalConstraints: {},
    complianceRefs: [],
    calculationCapabilities: [],
  });

  store.addEntry({
    id: 'single-wall-pipe',
    name: 'Single Wall Pipe',
    componentClass: 'duct',
    category: 'duct',
    categoryId: 'boiler_flue',
    typeId: 'single_wall_pipe',
    type: 'single_wall_pipe',
    engineeringSystem: 'boiler_flue',
    placeable: true,
    source: 'system',
    specialtyToolId: 'single_wall_pipe',
    recommendedFittingEntryIds: [],
    recommendedAccessoryEntryIds: [],
    recommendedEquipmentEntryIds: [],
    connectionNotes: [],
    systemType: 'exhaust',
    engineeringProperties: {
      frictionFactor: 0.01,
      maxVelocity: 1800,
      minVelocity: 500,
      maxPressureDrop: 0.12,
    },
    pricing: {
      materialCost: 50,
      laborUnits: 1,
      wasteFactor: 0.1,
    },
    materials: [],
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  store.selectEntry('single-wall-pipe');
  store.setSystemType('exhaust');
}

describe('ServiceContextStrip', () => {
  beforeEach(() => {
    seedStore();
    useToolStore.setState({
      currentTool: 'duct',
      activeSpecialtyToolId: 'single_wall_pipe',
    });
  });

  it('renders specialty context banner from the active specialty tool', async () => {
    render(<ServiceContextStrip />);

    const banner = await screen.findByTestId('specialty-context-banner');
    expect(banner).toBeDefined();
    expect(screen.getByText('Specialty Context')).toBeDefined();
    expect(screen.getByTestId('specialty-context-banner-title')).toHaveTextContent('Boiler & Water Heater Flue');
    expect(screen.getByTestId('specialty-context-banner-description')).toHaveTextContent('Single Wall Pipe');
    expect(screen.getByText('Esc exits specialty mode')).toBeDefined();
    expect(screen.getByTestId('specialty-context-banner-icon')).toHaveStyle({ color: '#ea580c' });
  });

  it('keeps the active entry and service override row visible', () => {
    render(<ServiceContextStrip />);

    expect(screen.getByText('Active:')).toBeDefined();
    expect(screen.getByTestId('active-entry-name')).toHaveTextContent('Single Wall Pipe');
    expect(screen.getByTestId('active-entry-system')).toHaveTextContent('boiler flue');
    expect(screen.getByDisplayValue('Exhaust')).toBeDefined();
    expect(screen.getByText('Validated')).toBeDefined();
  });
});
