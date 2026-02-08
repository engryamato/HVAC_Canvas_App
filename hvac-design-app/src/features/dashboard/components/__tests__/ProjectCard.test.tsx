import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectCard } from '../ProjectCard';
import type { ProjectListItem } from '../../store/projectListStore';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('../../store/projectListStore', () => ({
  useProjectListActions: () => ({
    markAsOpened: vi.fn(),
  }),
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage });

describe('ProjectCard', () => {
  const mockProject: ProjectListItem = {
    projectId: 'test-project-123',
    projectName: 'Test HVAC Project',
    projectNumber: '2025-001',
    clientName: 'Acme Corp',
    modifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    entityCount: 5,
    isArchived: false,
    status: 'draft',
  };

  const defaultProps = {
    project: mockProject,
    onDelete: vi.fn(),
    onArchive: vi.fn(),
    onRestore: vi.fn(),
    onDuplicate: vi.fn(),
    onRename: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  describe('Rendering', () => {
    it('should render project card', () => {
      render(<ProjectCard {...defaultProps} />);

      expect(screen.getByTestId('project-card')).toBeDefined();
    });

    it('should display project name', () => {
      render(<ProjectCard {...defaultProps} />);

      expect(screen.getByText('Test HVAC Project')).toBeDefined();
    });

    it('should display project number', () => {
      render(<ProjectCard {...defaultProps} />);

      expect(screen.getByText('#2025-001')).toBeDefined();
    });

    it('should display client name', () => {
      render(<ProjectCard {...defaultProps} />);

      expect(screen.getByText('Acme Corp')).toBeDefined();
    });

    it('should display entity count badge', () => {
      render(<ProjectCard {...defaultProps} />);

      expect(screen.getByText('5 items')).toBeDefined();
    });

    it('should display Untitled Project when name is undefined', () => {
      const projectWithNoName = { ...mockProject, projectName: 'undefined' };
      render(<ProjectCard {...defaultProps} project={projectWithNoName} />);

      expect(screen.getByText('Untitled Project')).toBeDefined();
    });
  });

  describe('Status Badges', () => {
    it('should display Draft badge for draft status', () => {
      render(<ProjectCard {...defaultProps} />);

      expect(screen.getByTestId('badge-draft')).toBeDefined();
      expect(screen.getByText('Draft')).toBeDefined();
    });

    it('should display In Progress badge', () => {
      const inProgressProject = { ...mockProject, status: 'in-progress' as const };
      render(<ProjectCard {...defaultProps} project={inProgressProject} />);

      expect(screen.getByTestId('badge-in-progress')).toBeDefined();
    });

    it('should display Complete badge', () => {
      const completeProject = { ...mockProject, status: 'complete' as const };
      render(<ProjectCard {...defaultProps} project={completeProject} />);

      expect(screen.getByTestId('badge-complete')).toBeDefined();
    });

    it('should display Archived badge when archived', () => {
      const archivedProject = { ...mockProject, isArchived: true };
      render(<ProjectCard {...defaultProps} project={archivedProject} />);

      expect(screen.getByTestId('badge-archived')).toBeDefined();
    });
  });

  describe('Menu Actions', () => {
    it('should show menu when menu button is clicked', () => {
      render(<ProjectCard {...defaultProps} />);

      const menuBtn = screen.getByTestId('project-card-menu-btn');
      fireEvent.pointerDown(menuBtn);

      expect(screen.getByTestId('project-card-menu')).toBeDefined();
    });

    it('should call onDelete when delete is clicked', () => {
      render(<ProjectCard {...defaultProps} />);

      const menuBtn = screen.getByTestId('project-card-menu-btn');
      fireEvent.pointerDown(menuBtn);

      const deleteBtn = screen.getByTestId('menu-delete-btn');
      fireEvent.click(deleteBtn);

      expect(defaultProps.onDelete).toHaveBeenCalledWith('test-project-123');
    });

    it('should call onDuplicate when duplicate is clicked', () => {
      render(<ProjectCard {...defaultProps} />);

      const menuBtn = screen.getByTestId('project-card-menu-btn');
      fireEvent.pointerDown(menuBtn);

      const duplicateBtn = screen.getByTestId('menu-duplicate-btn');
      fireEvent.click(duplicateBtn);

      expect(defaultProps.onDuplicate).toHaveBeenCalledWith('test-project-123');
    });

    it('should call onArchive when archive is clicked', () => {
      render(<ProjectCard {...defaultProps} />);

      const menuBtn = screen.getByTestId('project-card-menu-btn');
      fireEvent.pointerDown(menuBtn);

      const archiveBtn = screen.getByTestId('menu-archive-btn');
      fireEvent.click(archiveBtn);

      expect(defaultProps.onArchive).toHaveBeenCalledWith('test-project-123');
    });

    it('should show restore button for archived projects', () => {
      const archivedProject = { ...mockProject, isArchived: true };
      render(<ProjectCard {...defaultProps} project={archivedProject} />);

      const menuBtn = screen.getByTestId('project-card-menu-btn');
      fireEvent.pointerDown(menuBtn);

      expect(screen.getByTestId('menu-restore-btn')).toBeDefined();
    });
  });

  describe('Rename Functionality', () => {
    it('should enter edit mode when rename is clicked', async () => {
      render(<ProjectCard {...defaultProps} />);

      const menuBtn = screen.getByTestId('project-card-menu-btn');
      fireEvent.pointerDown(menuBtn);

      const editBtn = screen.getByTestId('menu-edit-btn');
      fireEvent.click(editBtn);

      await waitFor(() => {
        expect(screen.getByLabelText('Project name')).toBeDefined();
      });
    });
  });

  describe('Date Formatting', () => {
    it('should display Just now for recent projects', () => {
      render(<ProjectCard {...defaultProps} />);

      expect(screen.getByText('Modified Just now')).toBeDefined();
    });

    it('should display hours ago for older projects', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const olderProject = { ...mockProject, modifiedAt: twoHoursAgo };
      render(<ProjectCard {...defaultProps} project={olderProject} />);

      expect(screen.getByText('Modified 2h ago')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have article role', () => {
      render(<ProjectCard {...defaultProps} />);

      expect(screen.getByRole('article')).toBeDefined();
    });

    it('should have accessible menu button', () => {
      render(<ProjectCard {...defaultProps} />);

      expect(screen.getByLabelText('Project actions')).toBeDefined();
    });

    it('should have accessible open button', () => {
      render(<ProjectCard {...defaultProps} />);

      expect(screen.getByLabelText('Open Test HVAC Project')).toBeDefined();
    });
  });
});
