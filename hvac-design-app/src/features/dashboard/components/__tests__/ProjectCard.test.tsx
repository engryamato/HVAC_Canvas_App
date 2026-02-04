import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectCard } from '../ProjectCard';
import type { ProjectListItem } from '../../store/projectListStore';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock projectListStore hooks
vi.mock('../../store/projectListStore', async () => {
  const actual = await vi.importActual('../../store/projectListStore');
  return {
    ...actual,
    useProjectListActions: () => ({
      markAsOpened: vi.fn(),
    }),
  };
});

describe('ProjectCard', () => {
  const mockHandlers = {
    onDelete: vi.fn(),
    onArchive: vi.fn(),
    onRestore: vi.fn(),
    onDuplicate: vi.fn(),
    onRename: vi.fn(),
  };

  const createMockProject = (overrides: Partial<ProjectListItem> = {}): ProjectListItem => ({
    projectId: 'test-project-id',
    projectName: 'Test Project',
    projectNumber: 'TEST-001',
    clientName: 'Test Client',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    storagePath: 'test-storage-path',
    isArchived: false,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Status Badge Rendering', () => {
    it('should display Draft badge when status is undefined', () => {
      const project = createMockProject({ status: undefined });
      render(<ProjectCard project={project} {...mockHandlers} />);
      
      expect(screen.getByTestId('badge-draft')).toBeInTheDocument();
      expect(screen.getByTestId('badge-draft')).toHaveTextContent('Draft');
      expect(screen.getByTestId('badge-draft')).toHaveClass('badge-slate');
    });

    it('should display Draft badge when status is "draft"', () => {
      const project = createMockProject({ status: 'draft' });
      render(<ProjectCard project={project} {...mockHandlers} />);
      
      expect(screen.getByTestId('badge-draft')).toBeInTheDocument();
      expect(screen.getByTestId('badge-draft')).toHaveClass('badge-slate');
    });

    it('should display In Progress badge with badge-blue class', () => {
      const project = createMockProject({ status: 'in-progress' });
      render(<ProjectCard project={project} {...mockHandlers} />);
      
      expect(screen.getByTestId('badge-in-progress')).toBeInTheDocument();
      expect(screen.getByTestId('badge-in-progress')).toHaveTextContent('In Progress');
      expect(screen.getByTestId('badge-in-progress')).toHaveClass('badge-blue');
    });

    it('should display Complete badge with badge-green class', () => {
      const project = createMockProject({ status: 'complete' });
      render(<ProjectCard project={project} {...mockHandlers} />);
      
      expect(screen.getByTestId('badge-complete')).toBeInTheDocument();
      expect(screen.getByTestId('badge-complete')).toHaveTextContent('Complete');
      expect(screen.getByTestId('badge-complete')).toHaveClass('badge-green');
    });

    it('should display Archived badge with badge-amber class when archived', () => {
      const project = createMockProject({ isArchived: true });
      render(<ProjectCard project={project} {...mockHandlers} />);
      
      expect(screen.getByTestId('badge-archived')).toBeInTheDocument();
      expect(screen.getByTestId('badge-archived')).toHaveTextContent('Archived');
      expect(screen.getByTestId('badge-archived')).toHaveClass('badge-amber');
    });

    it('should hide status badge when project is archived', () => {
      const project = createMockProject({ isArchived: true, status: 'in-progress' });
      render(<ProjectCard project={project} {...mockHandlers} />);
      
      expect(screen.getByTestId('badge-archived')).toBeInTheDocument();
      expect(screen.queryByTestId('badge-in-progress')).not.toBeInTheDocument();
      expect(screen.queryByTestId('badge-draft')).not.toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('should display project name', () => {
      const project = createMockProject({ projectName: 'My HVAC Project' });
      render(<ProjectCard project={project} {...mockHandlers} />);
      
      expect(screen.getByText('My HVAC Project')).toBeInTheDocument();
    });

    it('should display project number', () => {
      const project = createMockProject({ projectNumber: 'HVAC-2025-001' });
      render(<ProjectCard project={project} {...mockHandlers} />);
      
      expect(screen.getByText('#HVAC-2025-001')).toBeInTheDocument();
    });

    it('should display client name', () => {
      const project = createMockProject({ clientName: 'Acme Corp' });
      render(<ProjectCard project={project} {...mockHandlers} />);
      
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    it('should display entity count badge when > 0', () => {
      const project = createMockProject({ entityCount: 42 });
      render(<ProjectCard project={project} {...mockHandlers} />);
      
      expect(screen.getByText('42 items')).toBeInTheDocument();
    });

    it('should not display entity count badge when 0', () => {
      const project = createMockProject({ entityCount: 0 });
      render(<ProjectCard project={project} {...mockHandlers} />);
      
      expect(screen.queryByText('0 items')).not.toBeInTheDocument();
    });

    it('should display formatted date', () => {
      const project = createMockProject({ modifiedAt: new Date().toISOString() });
      render(<ProjectCard project={project} {...mockHandlers} />);
      
      expect(screen.getByText(/Modified/)).toBeInTheDocument();
    });

    it('should display fallback name for undefined projectName', () => {
      const project = createMockProject({ projectName: undefined as unknown as string });
      render(<ProjectCard project={project} {...mockHandlers} />);
      
      expect(screen.getByText('Untitled Project')).toBeInTheDocument();
    });
  });

  describe('Card Interactions', () => {
    it('should render project card with correct test id', () => {
      const project = createMockProject();
      render(<ProjectCard project={project} {...mockHandlers} />);
      
      expect(screen.getByTestId('project-card')).toBeInTheDocument();
    });

    it('should render menu button with correct test id', () => {
      const project = createMockProject();
      render(<ProjectCard project={project} {...mockHandlers} />);
      
      expect(screen.getByTestId('project-card-menu-btn')).toBeInTheDocument();
    });

    it('should show menu on menu button click', () => {
      const project = createMockProject();
      render(<ProjectCard project={project} {...mockHandlers} />);
      
      fireEvent.pointerDown(screen.getByTestId('project-card-menu-btn'));
      
      expect(screen.getByTestId('project-card-menu')).toBeInTheDocument();
    });

    it('should display Open Project button', () => {
      const project = createMockProject();
      render(<ProjectCard project={project} {...mockHandlers} />);
      
      expect(screen.getByRole('button', { name: /Open Test Project/i })).toBeInTheDocument();
    });
  });

  describe('All Badge State Transitions', () => {
    it.each([
      ['draft', 'badge-draft', 'Draft', 'badge-slate'],
      ['in-progress', 'badge-in-progress', 'In Progress', 'badge-blue'],
      ['complete', 'badge-complete', 'Complete', 'badge-green'],
    ])('should render %s status with correct styling', (status, testId, label, className) => {
      const project = createMockProject({ status: status as 'draft' | 'in-progress' | 'complete' });
      render(<ProjectCard project={project} {...mockHandlers} />);
      
      const badge = screen.getByTestId(testId);
      expect(badge).toHaveTextContent(label);
      expect(badge).toHaveClass(className);
    });
  });
});
