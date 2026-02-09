import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewProjectDialog } from '../NewProjectDialog';

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

vi.mock('@/core/schema/project-file.schema', () => ({
  createEmptyProject: (name: string) => ({
    projectId: '',
    projectName: name,
    createdAt: '',
    modifiedAt: '',
    isArchived: false,
    scope: {},
    siteConditions: {},
    entities: { rooms: [], ducts: [], fittings: [], equipment: [] },
  }),
}));

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
