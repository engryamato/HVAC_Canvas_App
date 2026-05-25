import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewProjectDialog } from '../NewProjectDialog';
import { saveProjectToStorage } from '@/features/canvas/hooks/useAutoSave';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/stores/useProjectStore', () => ({
  useProjectStore: () => ({
    addProject: vi.fn(),
  }),
}));

vi.mock('@/features/dashboard/store/projectListStore', () => ({
  useProjectListActions: () => ({
    addProject: vi.fn(),
    refreshProjects: vi.fn(),
  }),
}));

vi.mock('@/core/persistence/ProjectRepository', () => ({
  getProjectRepository: vi.fn(() =>
    Promise.resolve({
      saveProject: vi.fn(() => Promise.resolve({ success: true })),
    })
  ),
}));

vi.mock('@/core/services/StorageRootService', () => ({
  ensureStorageRootReady: vi.fn(() =>
    Promise.resolve({ success: true, path: 'indexeddb://documents/SizeWise', migrationRan: false })
  ),
}));

vi.mock('@/core/schema/project-file.schema', () => ({
  createEmptyProject: (name: string) => ({
    schemaVersion: '2.0.0',
    projectId: '00000000-0000-4000-8000-000000000000',
    projectName: name,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    isArchived: false,
    scope: {},
    siteConditions: {},
    entities: { byId: {}, allIds: [] },
    viewportState: { panX: 0, panY: 0, zoom: 1 },
    settings: { unitSystem: 'imperial', gridSize: 12, gridVisible: true, snapToGrid: true },
    commandHistory: { commands: [], currentIndex: 0 },
  }),
}));

vi.mock('@/features/canvas/hooks/useAutoSave', () => {
  return {
    createLocalStoragePayloadFromProjectFileWithDefaults: vi.fn((project) => ({
      project,
      selection: { selectedIds: [], hoveredId: null },
      viewport: { panX: 0, panY: 0, zoom: 1, gridVisible: true, gridSize: 12, snapToGrid: true },
      preferences: {},
      settings: {},
      projectIndex: { projects: [], recentProjectIds: [], loading: false },
      legacyProjects: { projects: [] },
      history: { past: [], future: [], maxSize: 100 },
      uiState: {},
    })),
    saveProjectToStorage: vi.fn(() => ({ success: true })),
  };
});

describe('NewProjectDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onProjectCreated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dialog when open', () => {
      render(<NewProjectDialog {...defaultProps} />);

      expect(screen.getByTestId('new-project-dialog')).toBeDefined();
      expect(screen.getByText('Create New Project')).toBeDefined();
    });

    it('should not render when not open', () => {
      render(<NewProjectDialog {...defaultProps} open={false} />);

      expect(screen.queryByTestId('new-project-dialog')).toBeNull();
    });

    it('should display project details accordion', () => {
      render(<NewProjectDialog {...defaultProps} />);

      expect(screen.getByText('Project Details')).toBeDefined();
    });

    it('should display project scope accordion', () => {
      render(<NewProjectDialog {...defaultProps} />);

      expect(screen.getByText('Project Scope')).toBeDefined();
    });

    it('should display site conditions accordion', () => {
      render(<NewProjectDialog {...defaultProps} />);

      expect(screen.getByText('Site Conditions')).toBeDefined();
    });
  });

  describe('Form Validation', () => {
    it('should disable create button when project name is empty', () => {
      render(<NewProjectDialog {...defaultProps} />);

      const createBtn = screen.getByTestId('create-button');
      expect(createBtn).toHaveProperty('disabled', true);
    });

    it('should enable create button when project name is provided', async () => {
      render(<NewProjectDialog {...defaultProps} />);

      const nameInput = screen.getByTestId('project-name-input') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'My New Project' } });

      const createBtn = screen.getByTestId('create-button');
      expect(createBtn).toHaveProperty('disabled', false);
    });

    it('should show character count for project name', async () => {
      render(<NewProjectDialog {...defaultProps} />);

      const nameInput = screen.getByTestId('project-name-input') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      expect(screen.getByText('4/100')).toBeDefined();
    });
  });

  describe('User Interactions', () => {
    it('should call onOpenChange when cancel is clicked', async () => {
      render(<NewProjectDialog {...defaultProps} />);

      const cancelBtn = screen.getByText('Cancel');
      fireEvent.click(cancelBtn);

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should update project name on input', async () => {
      render(<NewProjectDialog {...defaultProps} />);

      const nameInput = screen.getByTestId('project-name-input') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Office Building HVAC' } });

      expect(nameInput).toHaveProperty('value', 'Office Building HVAC');
    });

    it('initializes fresh canvas storage for the newly-created project', async () => {
      vi.stubGlobal('crypto', { randomUUID: () => '11111111-1111-4111-8111-111111111111' });
      render(<NewProjectDialog {...defaultProps} />);

      fireEvent.change(screen.getByTestId('project-name-input'), { target: { value: 'Fresh Project' } });
      fireEvent.click(screen.getByTestId('create-button'));

      await waitFor(() => {
        expect(saveProjectToStorage).toHaveBeenCalledWith(
          '11111111-1111-4111-8111-111111111111',
          expect.objectContaining({
            project: expect.objectContaining({
              projectId: '11111111-1111-4111-8111-111111111111',
              projectName: 'Fresh Project',
              entities: { byId: {}, allIds: [] },
            }),
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have dialog role', () => {
      render(<NewProjectDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeDefined();
    });

    it('should have accessible name input', () => {
      render(<NewProjectDialog {...defaultProps} />);

      expect(screen.getByTestId('project-name-input')).toBeDefined();
    });
  });
});
