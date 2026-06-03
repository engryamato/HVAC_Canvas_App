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
    id: 'standard-duct',
    name: 'Standard Ductwork',
    engineeringSystem: 'standard_duct',
    defaultSystemType: 'supply',
    color: '#2563eb',
    source: 'baseline',
    supportedArchetypes: {
      duct: ['straight'],
      fitting: ['elbow'],
      equipment: ['terminal_box'],
      accessory: ['damper'],
    },
    fittingRules: [],
    dimensionalConstraints: {},
    complianceRefs: [],
    calculationCapabilities: [],
  });

  store.addEntry({
    id: 'round-duct',
    name: 'Round Duct',
    componentClass: 'duct',
    category: 'duct',
    categoryId: 'standard_ductwork',
    typeId: 'straight',
    type: 'straight',
    engineeringSystem: 'standard_duct',
    placeable: true,
    source: 'system',
    recommendedFittingEntryIds: [],
    recommendedAccessoryEntryIds: [],
    recommendedEquipmentEntryIds: [],
    connectionNotes: [],
    systemType: 'supply',
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

  store.selectEntry('round-duct');
  store.setSystemType('supply');
}

describe('ServiceContextStrip', () => {
  beforeEach(() => {
    seedStore();
    useToolStore.setState({
      currentTool: 'duct',
      activeSpecialtyToolId: null,
    });
  });

  it('does not render a specialty banner in air-only mode', () => {
    render(<ServiceContextStrip />);

    expect(screen.queryByTestId('specialty-context-banner')).toBeNull();
  });

  it('keeps the active entry and service override row visible', () => {
    render(<ServiceContextStrip />);

    expect(screen.getByText('Active:')).toBeDefined();
    expect(screen.getByTestId('active-entry-name')).toHaveTextContent('Round Duct');
    expect(screen.getByTestId('active-entry-system')).toHaveTextContent('standard duct');
    expect(screen.getByDisplayValue('Supply')).toBeDefined();
    expect(screen.getByText('Validated')).toBeDefined();
  });
});
