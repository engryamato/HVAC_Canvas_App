import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewProjectDialog } from '../NewProjectDialog';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock stores
vi.mock('@/stores/useProjectStore', () => ({
  useProjectStore: () => ({
    addProject: vi.fn(),
  }),
}));

vi.mock('@/features/dashboard/store/projectListStore', () => ({
  useProjectListActions: () => ({
    refreshProjects: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Mock storage adapter factory
vi.mock('@/core/persistence/factory', () => ({
  createStorageAdapter: vi.fn().mockResolvedValue({
    saveProject: vi.fn().mockResolvedValue({ success: true }),
  }),
}));

describe('NewProjectDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnProjectCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dialog when open', () => {
      render(
        <NewProjectDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
          onProjectCreated={mockOnProjectCreated}
        />
      );
      
      expect(screen.getByTestId('new-project-dialog')).toBeInTheDocument();
    });

    it('should not render dialog when closed', () => {
      render(
        <NewProjectDialog 
          open={false} 
          onOpenChange={mockOnOpenChange}
          onProjectCreated={mockOnProjectCreated}
        />
      );
      
      expect(screen.queryByTestId('new-project-dialog')).not.toBeInTheDocument();
    });

    it('should display dialog title', () => {
      render(
        <NewProjectDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      );
      
      expect(screen.getByText('Create New Project')).toBeInTheDocument();
    });

    it('should display project name input', () => {
      render(
        <NewProjectDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      );
      
      expect(screen.getByTestId('project-name-input')).toBeInTheDocument();
    });
  });

  describe('Tailwind Classes (No CSS Modules)', () => {
    it('should render dialog content with Tailwind max-w class', () => {
      render(
        <NewProjectDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      );
      
      const dialogContent = screen.getByTestId('new-project-dialog');
      expect(dialogContent).toHaveClass('sm:max-w-[600px]');
    });

    it('should render dialog with overflow-y-auto class', () => {
      render(
        <NewProjectDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      );
      
      const dialogContent = screen.getByTestId('new-project-dialog');
      expect(dialogContent).toHaveClass('overflow-y-auto');
    });

    it('should render create button with correct data-testid', () => {
      render(
        <NewProjectDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      );
      
      expect(screen.getByTestId('create-button')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should disable create button when project name is empty', () => {
      render(
        <NewProjectDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      );
      
      const createButton = screen.getByTestId('create-button');
      expect(createButton).toBeDisabled();
    });

    it('should enable create button when project name is provided', async () => {
      render(
        <NewProjectDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      );
      
      const input = screen.getByTestId('project-name-input');
      fireEvent.change(input, { target: { value: 'New HVAC Project' } });
      
      const createButton = screen.getByTestId('create-button');
      expect(createButton).not.toBeDisabled();
    });

    it('should show character count', () => {
      render(
        <NewProjectDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      );
      
      const input = screen.getByTestId('project-name-input');
      fireEvent.change(input, { target: { value: 'Test Project' } });
      
      expect(screen.getByText('12/100')).toBeInTheDocument();
    });
  });

  describe('Dialog Actions', () => {
    it('should render cancel button', () => {
      render(
        <NewProjectDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      );
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render create button', () => {
      render(
        <NewProjectDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      );
      
      expect(screen.getByTestId('create-button')).toHaveTextContent('Create Project');
    });
  });
});
