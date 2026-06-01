import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EquipmentPlacementDialog } from '../EquipmentPlacementDialog';
import type { EquipmentPlacementDraft } from '@/core/store/canvas.store';
import type { EquipmentType, EquipmentCategory } from '@/core/schema/equipment.schema';

// ─── Store mocks ──────────────────────────────────────────────────────────────

vi.mock('@/core/store/canvas.store', () => ({
  useEquipmentPlacementDraft: vi.fn(),
  useEquipmentPlacementDialogOpen: vi.fn().mockReturnValue(false),
  useToolActions: vi.fn(),
  useToolStore: vi.fn(),
}));

vi.mock('@/core/store/componentLibraryStoreV2', () => ({
  useUnifiedCatalogStore: vi.fn(),
}));

import {
  useEquipmentPlacementDraft,
  useToolActions,
} from '@/core/store/canvas.store';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';

// ─── Typed mock references ────────────────────────────────────────────────────

const mockUseDraft = vi.mocked(useEquipmentPlacementDraft);
const mockUseActions = vi.mocked(useToolActions);
const mockUseCatalog = vi.mocked(useUnifiedCatalogStore);

const mockSetDraft = vi.fn();
const mockResetDraft = vi.fn();
const mockApplyCatalogEntry = vi.fn();

// ─── Test helpers ─────────────────────────────────────────────────────────────

type CatalogEntry = {
  id: string;
  name: string;
  componentClass: string;
  categoryId: string;
  typeId: string;
  tags?: string[];
  keySpec?: string;
};

function buildDraft(overrides: Partial<EquipmentPlacementDraft> = {}): EquipmentPlacementDraft {
  return {
    catalogEntryId: null,
    name: 'AHU-1',
    equipmentType: 'air_handler' as EquipmentType,
    equipmentCategory: 'air_handling' as EquipmentCategory,
    manufacturer: '',
    model: '',
    locationTag: '',
    capacity: 10000,
    capacityUnit: 'CFM',
    staticPressure: 1.0,
    staticPressureUnit: 'in_wg',
    width: 48,
    depth: 60,
    height: 48,
    engineeringSystem: 'standard_duct',
    ...overrides,
  };
}

function setupStoreMocks(
  draftOverrides: Partial<EquipmentPlacementDraft> = {},
  catalogEntries: CatalogEntry[] = []
) {
  mockUseDraft.mockReturnValue(buildDraft(draftOverrides));
  mockUseActions.mockReturnValue({
    setEquipmentPlacementDraft: mockSetDraft,
    resetEquipmentPlacementDraft: mockResetDraft,
    applyEquipmentCatalogEntry: mockApplyCatalogEntry,
    setTool: vi.fn(),
    setEquipmentPlacementDialogOpen: vi.fn(),
    setStatusMessage: vi.fn(),
  } as unknown as ReturnType<typeof useToolActions>);
  // useUnifiedCatalogStore is called with a selector in the component
  mockUseCatalog.mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (selector: (s: any) => any) => selector({ catalogEntries })
  );
}

function renderDialog(props: {
  open?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}) {
  return render(
    <EquipmentPlacementDialog
      open={props.open ?? true}
      onConfirm={props.onConfirm ?? vi.fn()}
      onCancel={props.onCancel ?? vi.fn()}
    />
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EquipmentPlacementDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStoreMocks(); // default mocks for every test
  });

  // ── Visibility ────────────────────────────────────────────────────────────

  describe('visibility', () => {
    it('renders dialog content when open is true', () => {
      renderDialog({ open: true });
      expect(screen.getByText('Place Equipment')).toBeInTheDocument();
    });

    it('does not render dialog content when open is false', () => {
      renderDialog({ open: false });
      expect(screen.queryByText('Place Equipment')).not.toBeInTheDocument();
    });
  });

  // ── Footer buttons ────────────────────────────────────────────────────────

  describe('footer buttons', () => {
    it('calls onConfirm when Place Equipment button is clicked', () => {
      const onConfirm = vi.fn();
      renderDialog({ onConfirm });
      fireEvent.click(screen.getByRole('button', { name: /Place Equipment/i }));
      expect(onConfirm).toHaveBeenCalledOnce();
    });

    it('calls onCancel when Cancel button is clicked', () => {
      const onCancel = vi.fn();
      renderDialog({ onCancel });
      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
      expect(onCancel).toHaveBeenCalledOnce();
    });
  });

  // ── Name auto-increment ───────────────────────────────────────────────────

  describe('name auto-increment on Place', () => {
    it('increments trailing number when Place is clicked', () => {
      setupStoreMocks({ name: 'AHU-1' });
      renderDialog({});
      fireEvent.click(screen.getByRole('button', { name: /Place Equipment/i }));
      expect(mockSetDraft).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'AHU-2' })
      );
    });

    it('increments from 9 to 10 correctly', () => {
      setupStoreMocks({ name: 'RTU-9' });
      renderDialog({});
      fireEvent.click(screen.getByRole('button', { name: /Place Equipment/i }));
      expect(mockSetDraft).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'RTU-10' })
      );
    });

    it('increments names without prefix (bare number)', () => {
      setupStoreMocks({ name: 'UNIT-5' });
      renderDialog({});
      fireEvent.click(screen.getByRole('button', { name: /Place Equipment/i }));
      expect(mockSetDraft).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'UNIT-6' })
      );
    });
  });

  // ── Search & filter UI ────────────────────────────────────────────────────

  describe('search & filter UI', () => {
    it('renders the search input', () => {
      renderDialog({});
      expect(
        screen.getByPlaceholderText(/Search by name, model, type/i)
      ).toBeInTheDocument();
    });

    it('shows "No equipment found" when catalog is empty', () => {
      setupStoreMocks({}, []);
      renderDialog({});
      expect(screen.getByText(/No equipment found/i)).toBeInTheDocument();
    });

    it('hides "No equipment found" when equipment entries exist', () => {
      // Radix Select renders closed-state items in a portal only when open,
      // so we check for the absence of the empty-state message instead of item text.
      setupStoreMocks({}, [
        {
          id: 'e1',
          name: 'Test AHU',
          componentClass: 'equipment',
          categoryId: 'air_handling',
          typeId: 'air_handler',
          keySpec: '10,000 CFM',
        },
      ]);
      renderDialog({});
      expect(screen.queryByText(/No equipment found/i)).not.toBeInTheDocument();
    });

    it('filters out non-equipment catalog entries', () => {
      setupStoreMocks({}, [
        {
          id: 'd1',
          name: 'Round Duct 12"',
          componentClass: 'duct',
          categoryId: 'round_duct',
          typeId: 'round_duct',
        },
      ]);
      renderDialog({});
      expect(screen.queryByText('Round Duct 12"')).not.toBeInTheDocument();
      expect(screen.getByText(/No equipment found/i)).toBeInTheDocument();
    });

    it('renders search input without pre-filled text (cleared on open)', () => {
      renderDialog({ open: true });
      const searchInput = screen.getByPlaceholderText(/Search by name, model, type/i);
      expect(searchInput).toHaveValue('');
    });
  });

  // ── Configure section ─────────────────────────────────────────────────────

  describe('configure section', () => {
    it('shows the equipment type label', () => {
      setupStoreMocks({ equipmentType: 'air_handler' });
      renderDialog({});
      // EQUIPMENT_TYPE_LABELS['air_handler'] = 'Air Handling Unit'
      expect(screen.getByText(/Configure:.*Air Handling Unit/i)).toBeInTheDocument();
    });

    it('renders name input with draft name as value', () => {
      setupStoreMocks({ name: 'FCU-3' });
      renderDialog({});
      const nameInput = screen.getByLabelText('Name');
      expect(nameInput).toHaveValue('FCU-3');
    });

    it('calls setEquipmentPlacementDraft when name is edited', () => {
      setupStoreMocks({ name: 'AHU-1' });
      renderDialog({});
      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, { target: { value: 'CUSTOM-99' } });
      expect(mockSetDraft).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'CUSTOM-99' })
      );
    });

    it('renders width input with draft width as value', () => {
      setupStoreMocks({ width: 72 });
      renderDialog({});
      const widthInput = screen.getByLabelText('Width');
      expect(widthInput).toHaveValue(72);
    });

    it('calls setEquipmentPlacementDraft with new width value', () => {
      renderDialog({});
      const widthInput = screen.getByLabelText('Width');
      fireEvent.change(widthInput, { target: { value: '96' } });
      expect(mockSetDraft).toHaveBeenCalledWith(
        expect.objectContaining({ width: 96 })
      );
    });

    it('renders depth input with draft depth as value', () => {
      setupStoreMocks({ depth: 84 });
      renderDialog({});
      expect(screen.getByLabelText('Depth')).toHaveValue(84);
    });

    it('renders height input with draft height as value', () => {
      setupStoreMocks({ height: 60 });
      renderDialog({});
      expect(screen.getByLabelText('Height')).toHaveValue(60);
    });

    it('renders static pressure input with draft value', () => {
      setupStoreMocks({ staticPressure: 1.5 });
      renderDialog({});
      // There are multiple number inputs; the static pressure one has step=0.05
      const spInput = document.querySelector('input[step="0.05"]') as HTMLInputElement;
      expect(spInput).not.toBeNull();
      expect(Number(spInput?.value)).toBe(1.5);
    });
  });

  // ── Section headings ──────────────────────────────────────────────────────

  describe('section headings', () => {
    it('shows "Search & Select" section heading', () => {
      renderDialog({});
      expect(screen.getByText(/Search & Select/i)).toBeInTheDocument();
    });

    it('shows "Identity" fieldset legend', () => {
      renderDialog({});
      expect(screen.getByText('Identity')).toBeInTheDocument();
    });

    it('shows "Performance" fieldset legend', () => {
      renderDialog({});
      expect(screen.getByText('Performance')).toBeInTheDocument();
    });

    it('shows "Dimensions (inches)" fieldset legend', () => {
      renderDialog({});
      expect(screen.getByText(/Dimensions \(inches\)/i)).toBeInTheDocument();
    });
  });
});
