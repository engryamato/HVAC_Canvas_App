import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BOMPanel } from '../BOMPanel';
import type { BomItem } from '@/features/export/csv';
import { useBOM } from '../../hooks/useBOM';
import { downloadBomCsv } from '@/features/export/csv';

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
      'duct-1': { id: 'duct-1', type: 'duct' },
      'equipment-1': { id: 'equipment-1', type: 'equipment' },
      'fitting-1': { id: 'fitting-1', type: 'fitting' },
    },
    allIds: ['duct-1', 'equipment-1', 'fitting-1'],
  };

  const makeItem = (overrides: Partial<BomItem>): BomItem => ({
    itemNumber: 1,
    name: 'Default',
    type: 'Duct',
    description: 'Default description',
    quantity: 1,
    unit: 'ea',
    specifications: 'Default specs',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseEntityStore.mockImplementation((selector: (state: EntityStoreSlice) => unknown) => selector(entityState));
    mockUseProjectStore.mockImplementation((selector: (state: ProjectStoreSlice) => unknown) =>
      selector({ projectDetails: { projectName: 'Test Project' } })
    );
  });

  it('renders with data and shows sections when expanded', () => {
    vi.mocked(useBOM).mockReturnValue({
      ducts: [makeItem({ itemNumber: 1, name: 'Supply Duct', type: 'Duct' })],
      equipment: [makeItem({ itemNumber: 2, name: 'AHU', type: 'Equipment' })],
      fittings: [makeItem({ itemNumber: 3, name: 'Elbow', type: 'Fitting' })],
    });

    render(<BOMPanel />);

    fireEvent.click(screen.getByRole('button', { name: /bill of materials/i }));

    expect(screen.getByText('Ducts (1)')).toBeInTheDocument();
    expect(screen.getByText('Equipment (1)')).toBeInTheDocument();
    expect(screen.getByText('Fittings (1)')).toBeInTheDocument();
  });

  it('renders empty state when there are no BOM items', () => {
    vi.mocked(useBOM).mockReturnValue({
      ducts: [],
      equipment: [],
      fittings: [],
    });

    render(<BOMPanel />);

    fireEvent.click(screen.getByRole('button', { name: /bill of materials/i }));

    expect(screen.getByText('No entities on canvas')).toBeInTheDocument();
    expect(screen.getByText('Add rooms, ducts, or equipment to generate BOM')).toBeInTheDocument();
  });

  it('disables export button when no items exist', () => {
    vi.mocked(useBOM).mockReturnValue({
      ducts: [],
      equipment: [],
      fittings: [],
    });

    render(<BOMPanel />);

    expect(screen.getByRole('button', { name: /export bom as csv/i })).toBeDisabled();
  });

  it('enables export button when items exist', () => {
    vi.mocked(useBOM).mockReturnValue({
      ducts: [makeItem({ itemNumber: 1 })],
      equipment: [],
      fittings: [],
    });

    render(<BOMPanel />);

    expect(screen.getByRole('button', { name: /export bom as csv/i })).toBeEnabled();
  });

  it('toggles accordion section visibility', async () => {
    vi.mocked(useBOM).mockReturnValue({
      ducts: [makeItem({ itemNumber: 1, name: 'Duct A' })],
      equipment: [],
      fittings: [],
    });

    render(<BOMPanel />);
    fireEvent.click(screen.getByRole('button', { name: /bill of materials/i }));

    expect(screen.getByText('Duct A')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Ducts (1)'));

    await waitFor(() => {
      expect(screen.queryByText('Duct A')).not.toBeInTheDocument();
    });
  });

  it('shows total and category item counts', () => {
    vi.mocked(useBOM).mockReturnValue({
      ducts: [makeItem({ itemNumber: 1, name: 'Duct A' })],
      equipment: [makeItem({ itemNumber: 2, name: 'Equipment A', type: 'Equipment' })],
      fittings: [makeItem({ itemNumber: 3, name: 'Fitting A', type: 'Fitting' })],
    });

    render(<BOMPanel />);

    expect(screen.getByText('Bill of Materials (3 items)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /bill of materials/i }));

    expect(screen.getByText('Ducts (1)')).toBeInTheDocument();
    expect(screen.getByText('Equipment (1)')).toBeInTheDocument();
    expect(screen.getByText('Fittings (1)')).toBeInTheDocument();
  });

  it('exports CSV with current entities and project name', () => {
    vi.mocked(useBOM).mockReturnValue({
      ducts: [makeItem({ itemNumber: 1, name: 'Duct A' })],
      equipment: [],
      fittings: [],
    });

    render(<BOMPanel />);

    fireEvent.click(screen.getByRole('button', { name: /export bom as csv/i }));

    expect(downloadBomCsv).toHaveBeenCalledWith(entityState, 'Test Project');
  });
});
