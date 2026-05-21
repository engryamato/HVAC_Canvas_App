import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BOMPanel } from '../BOMPanel';
import type { BomItem } from '@/features/export/csv';
import { downloadBomCsv } from '@/features/export/csv';
import { useBOM, type GroupedBomItems } from '../../hooks/useBOM';

const mockUseEntityStore = vi.fn();
const mockUseProjectStore = vi.fn();

type EntityStoreSlice = {
  byId: Record<string, unknown>;
  allIds: string[];
};

type ProjectStoreSlice = {
  projectDetails: { projectName: string } | null;
};

vi.mock('../../hooks/useBOM', () => ({
  useBOM: vi.fn(),
}));

vi.mock('@/features/export/csv', async () => {
  const actual = await vi.importActual<typeof import('@/features/export/csv')>('@/features/export/csv');
  return {
    ...actual,
    downloadBomCsv: vi.fn(),
  };
});

vi.mock('@/core/store/entityStore', () => ({
  useEntityStore: (selector: (state: EntityStoreSlice) => unknown) => mockUseEntityStore(selector),
}));

vi.mock('@/core/store/project.store', () => ({
  useProjectStore: (selector: (state: ProjectStoreSlice) => unknown) => mockUseProjectStore(selector),
}));

describe('BOMPanel', () => {
  const entityState = {
    byId: {
      'duct-1': { id: 'duct-1', type: 'duct_run' },
      'fitting-1': { id: 'fitting-1', type: 'fitting' },
      'accessory-1': { id: 'accessory-1', type: 'damper' },
    },
    allIds: ['duct-1', 'fitting-1', 'accessory-1'],
  };

  const makeItem = (overrides: Partial<BomItem>): BomItem => ({
    itemNumber: 1,
    entityId: 'duct-1',
    name: 'Rectangular Duct 12" x 8" 5\'',
    type: 'Duct',
    description: 'Rectangular Duct 12" x 8" 5\'',
    quantity: 1,
    unit: 'EA',
    specifications: '12" x 8"',
    ...overrides,
  });

  const makeBomReturn = (
    items: BomItem[] = [],
    overrides: Partial<GroupedBomItems> = {}
  ): GroupedBomItems => ({
    all: items,
    ducts: items.filter((item) => item.type === 'Duct'),
    equipment: items.filter((item) => item.type === 'Equipment'),
    fittings: items.filter((item) => item.type === 'Fitting'),
    accessories: items.filter((item) => item.type === 'Accessory'),
    totals: {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    },
    costEstimate: null,
    costDelta: null,
    lastUpdated: null,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEntityStore.mockImplementation((selector: (state: EntityStoreSlice) => unknown) => selector(entityState));
    mockUseProjectStore.mockImplementation((selector: (state: ProjectStoreSlice) => unknown) =>
      selector({ projectDetails: { projectName: 'Test Project' } })
    );
  });

  it('renders the required BOM columns without Price by default', () => {
    vi.mocked(useBOM).mockReturnValue(makeBomReturn([
      makeItem({ quantity: 25 }),
    ]));

    const { container } = render(<BOMPanel />);
    const header = container.querySelector('[data-showprice="false"]');

    expect(header).not.toBeNull();
    expect(header?.textContent).toContain('Qty');
    expect(header?.textContent).toContain('Description');
    expect(header?.textContent).toContain('Unit');
    expect(header?.textContent).toContain('Weight');
    expect(header?.textContent).not.toContain('Price');
  });

  it('shows Price only after the optional Price toggle is enabled', () => {
    vi.mocked(useBOM).mockReturnValue(makeBomReturn([
      makeItem({ quantity: 4, description: '90\u00b0 Elbow', type: 'Fitting' }),
    ], {
      costEstimate: {
        items: [{ bomItemId: 'bom-1', itemTotal: 125 }],
        breakdown: { totalCost: 125 },
      } as GroupedBomItems['costEstimate'],
    }));

    const { container } = render(<BOMPanel />);

    expect(container.querySelector('[data-showprice="false"]')?.textContent).not.toContain('Price');

    fireEvent.click(screen.getByRole('button', { name: /price/i }));

    expect(container.querySelector('[data-showprice="true"]')?.textContent).toContain('Price');
  });

  it('renders grouped BOM descriptions with quantity, unit, and placeholder weight', () => {
    vi.mocked(useBOM).mockReturnValue(makeBomReturn([
      makeItem({
        entityId: 'duct-1',
        quantity: 25,
        description: 'Rectangular Duct 12" x 8" 5\'',
        unit: 'EA',
      }),
    ]));

    const { container } = render(<BOMPanel />);

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Rectangular Duct 12" x 8" 5\'')).toBeInTheDocument();
    expect(screen.getByText('EA')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="bom-row-duct-1"]')?.textContent).toContain('\u2014');
  });

  it('includes ducts, fittings, equipment, and accessories groups when present', () => {
    vi.mocked(useBOM).mockReturnValue(makeBomReturn([
      makeItem({ itemNumber: 1, type: 'Duct', description: 'Round Duct 10" 8\'' }),
      makeItem({ itemNumber: 2, entityId: 'fitting-1', type: 'Fitting', description: 'Tee' }),
      makeItem({ itemNumber: 3, entityId: 'equipment-1', type: 'Equipment', description: 'Fan AC-1' }),
      makeItem({ itemNumber: 4, entityId: 'accessory-1', type: 'Accessory', description: 'Balancing Damper' }),
    ]));

    render(<BOMPanel />);

    expect(screen.getAllByText('Ducts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fittings').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Equipment').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Accessories').length).toBeGreaterThan(0);
  });

  it('exports CSV with current entities and project name', () => {
    vi.mocked(useBOM).mockReturnValue(makeBomReturn([
      makeItem({ itemNumber: 1 }),
    ]));

    render(<BOMPanel />);

    fireEvent.click(screen.getByRole('button', { name: /csv/i }));

    expect(downloadBomCsv).toHaveBeenCalledWith(entityState, 'Test Project');
  });
});
