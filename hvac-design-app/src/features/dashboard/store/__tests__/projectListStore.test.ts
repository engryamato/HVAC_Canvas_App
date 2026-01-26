import { describe, it, beforeEach, expect } from 'vitest';
import {
  useProjectListStore,
  type ProjectListItem,
} from '../projectListStore';

describe('ProjectListStore', () => {
  const createMockProject = (overrides: Partial<ProjectListItem> = {}): ProjectListItem => ({
    projectId: crypto.randomUUID(),
    projectName: 'Test Project',
    projectNumber: 'TEST-001',
    clientName: 'Test Client',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    storagePath: `project-${crypto.randomUUID()}`,
    isArchived: false,
    ...overrides,
  });

  beforeEach(() => {
    // Clear localStorage and reset store
    localStorage.removeItem('sws.projectIndex');
    useProjectListStore.setState({ projects: [], loading: false, error: undefined });
  });

  describe('initialization', () => {
    it('should initialize with empty projects array', () => {
      const state = useProjectListStore.getState();
      expect(state.projects).toEqual([]);
      expect(state.loading).toBe(false);
    });
  });

  describe('addProject', () => {
    it('should add a new project to the beginning of the list', () => {
      const project = createMockProject({ projectName: 'First Project' });
      useProjectListStore.getState().addProject(project);

      const state = useProjectListStore.getState();
      expect(state.projects).toHaveLength(1);
      expect(state.projects[0]!.projectName).toBe('First Project');
    });

    it('should prepend new projects (most recent first)', () => {
      const project1 = createMockProject({ projectName: 'First' });
      const project2 = createMockProject({ projectName: 'Second' });

      useProjectListStore.getState().addProject(project1);
      useProjectListStore.getState().addProject(project2);

      const state = useProjectListStore.getState();
      expect(state.projects).toHaveLength(2);
      expect(state.projects[0]!.projectName).toBe('Second');
      expect(state.projects[1]!.projectName).toBe('First');
    });

    it('should persist project to localStorage', () => {
      const project = createMockProject();
      useProjectListStore.getState().addProject(project);

      const stored = JSON.parse(localStorage.getItem('sws.projectIndex') ?? '{}');
      expect(stored.state.projects).toHaveLength(1);
      expect(stored.state.projects[0]!.projectId).toBe(project.projectId);
    });
  });

  describe('updateProject', () => {
    it('should update project name', () => {
      const project = createMockProject({ projectName: 'Original' });
      useProjectListStore.getState().addProject(project);

      useProjectListStore.getState().updateProject(project.projectId, {
        projectName: 'Updated Name',
      });

      const state = useProjectListStore.getState();
      expect(state.projects[0]!.projectName).toBe('Updated Name');
    });

    it('should update modifiedAt timestamp on update', () => {
      const originalDate = '2024-01-01T00:00:00.000Z';
      const project = createMockProject({ modifiedAt: originalDate });
      useProjectListStore.getState().addProject(project);

      useProjectListStore.getState().updateProject(project.projectId, {
        projectName: 'Updated',
      });

      const state = useProjectListStore.getState();
      expect(state.projects[0]!.modifiedAt).not.toBe(originalDate);
      expect(new Date(state.projects[0]!.modifiedAt).getTime()).toBeGreaterThan(
        new Date(originalDate).getTime()
      );
    });

    it('should persist updates to localStorage', () => {
      const project = createMockProject();
      useProjectListStore.getState().addProject(project);
      useProjectListStore.getState().updateProject(project.projectId, {
        projectName: 'Persisted Update',
      });

      const stored = JSON.parse(localStorage.getItem('sws.projectIndex') ?? '{}');
      expect(stored.state.projects[0]!.projectName).toBe('Persisted Update');
    });
  });

  describe('removeProject', () => {
    it('should remove project from list', () => {
      const project = createMockProject();
      useProjectListStore.getState().addProject(project);
      expect(useProjectListStore.getState().projects).toHaveLength(1);

      useProjectListStore.getState().removeProject(project.projectId);
      expect(useProjectListStore.getState().projects).toHaveLength(0);
    });

    it('should persist removal to localStorage', () => {
      const project = createMockProject();
      useProjectListStore.getState().addProject(project);
      useProjectListStore.getState().removeProject(project.projectId);

      const stored = JSON.parse(localStorage.getItem('sws.projectIndex') ?? '{}');
      expect(stored.state.projects).toHaveLength(0);
    });

    it('should not affect other projects when removing one', () => {
      const project1 = createMockProject({ projectName: 'Keep' });
      const project2 = createMockProject({ projectName: 'Remove' });

      useProjectListStore.getState().addProject(project1);
      useProjectListStore.getState().addProject(project2);
      useProjectListStore.getState().removeProject(project2.projectId);

      const state = useProjectListStore.getState();
      expect(state.projects).toHaveLength(1);
      expect(state.projects[0]!.projectName).toBe('Keep');
    });
  });

  describe('archiveProject', () => {
    it('should set isArchived to true', () => {
      const project = createMockProject({ isArchived: false });
      useProjectListStore.getState().addProject(project);
      useProjectListStore.getState().archiveProject(project.projectId);

      const state = useProjectListStore.getState();
      expect(state.projects[0]!.isArchived).toBe(true);
    });

    it('should update modifiedAt timestamp', () => {
      const originalDate = '2024-01-01T00:00:00.000Z';
      const project = createMockProject({ modifiedAt: originalDate });
      useProjectListStore.getState().addProject(project);
      useProjectListStore.getState().archiveProject(project.projectId);

      const state = useProjectListStore.getState();
      expect(state.projects[0]!.modifiedAt).not.toBe(originalDate);
    });
  });

  describe('restoreProject', () => {
    it('should set isArchived to false', () => {
      const project = createMockProject({ isArchived: true });
      useProjectListStore.getState().addProject(project);
      useProjectListStore.getState().restoreProject(project.projectId);

      const state = useProjectListStore.getState();
      expect(state.projects[0]!.isArchived).toBe(false);
    });
  });

  describe('duplicateProject', () => {
    it('should create a copy with new ID', () => {
      const project = createMockProject({ projectName: 'Original' });
      useProjectListStore.getState().addProject(project);
      useProjectListStore.getState().duplicateProject(project.projectId, 'Copy of Original');

      const state = useProjectListStore.getState();
      expect(state.projects).toHaveLength(2);
      expect(state.projects[0]!.projectName).toBe('Copy of Original');
      expect(state.projects[0]!.projectId).not.toBe(project.projectId);
    });

    it('should set new storagePath for duplicate', () => {
      const project = createMockProject();
      useProjectListStore.getState().addProject(project);
      useProjectListStore.getState().duplicateProject(project.projectId, 'Duplicate');

      const state = useProjectListStore.getState();
      expect(state.projects[0]!.storagePath).not.toBe(project.storagePath);
      expect(state.projects[0]!.storagePath).toContain('project-');
    });

    it('should reset isArchived to false for duplicate', () => {
      const project = createMockProject({ isArchived: true });
      useProjectListStore.getState().addProject(project);
      useProjectListStore.getState().duplicateProject(project.projectId, 'Duplicate');

      const state = useProjectListStore.getState();
      expect(state.projects[0]!.isArchived).toBe(false);
    });

    it('should set new timestamps for duplicate', () => {
      const oldDate = '2020-01-01T00:00:00.000Z';
      const project = createMockProject({ createdAt: oldDate, modifiedAt: oldDate });
      useProjectListStore.getState().addProject(project);
      useProjectListStore.getState().duplicateProject(project.projectId, 'Duplicate');

      const state = useProjectListStore.getState();
      expect(state.projects[0]!.createdAt).not.toBe(oldDate);
      expect(state.projects[0]!.modifiedAt).not.toBe(oldDate);
    });

    it('should do nothing if source project not found', () => {
      useProjectListStore.getState().duplicateProject('non-existent-id', 'Duplicate');
      expect(useProjectListStore.getState().projects).toHaveLength(0);
    });
  });

  describe('selector hooks', () => {
    it('useActiveProjects should filter out archived projects', () => {
      const active = createMockProject({ projectName: 'Active', isArchived: false });
      const archived = createMockProject({ projectName: 'Archived', isArchived: true });

      useProjectListStore.getState().addProject(active);
      useProjectListStore.getState().addProject(archived);

      // Simulate hook behavior
      const activeProjects = useProjectListStore.getState().projects.filter((p) => !p.isArchived);
      expect(activeProjects).toHaveLength(1);
      expect(activeProjects[0]!.projectName).toBe('Active');
    });

    it('useArchivedProjects should return only archived projects', () => {
      const active = createMockProject({ projectName: 'Active', isArchived: false });
      const archived = createMockProject({ projectName: 'Archived', isArchived: true });

      useProjectListStore.getState().addProject(active);
      useProjectListStore.getState().addProject(archived);

      // Simulate hook behavior
      const archivedProjects = useProjectListStore.getState().projects.filter((p) => p.isArchived);
      expect(archivedProjects).toHaveLength(1);
      expect(archivedProjects[0]!.projectName).toBe('Archived');
    });
  });

  describe('localStorage persistence', () => {
    it('should use correct storage key', () => {
      const project = createMockProject();
      useProjectListStore.getState().addProject(project);

      expect(localStorage.getItem('sws.projectIndex')).not.toBeNull();
    });

    it('should restore state from localStorage on rehydration', () => {
      // Simulate persisted state
      const persistedState = {
        state: {
          projects: [createMockProject({ projectName: 'Persisted' })],
          loading: false,
        },
        version: 0,
      };
      localStorage.setItem('sws.projectIndex', JSON.stringify(persistedState));

      // Trigger rehydration by recreating store state
      useProjectListStore.persist.rehydrate();

      const state = useProjectListStore.getState();
      expect(state.projects).toHaveLength(1);
      expect(state.projects[0]!.projectName).toBe('Persisted');
    });

    it('should validate ProjectListItem structure', () => {
      const project = createMockProject();
      useProjectListStore.getState().addProject(project);

      const stored = JSON.parse(localStorage.getItem('sws.projectIndex') ?? '{}');
      const storedProject = stored.state.projects[0];

      expect(storedProject).toBeDefined();

      // Verify all required fields are present
      expect(storedProject).toHaveProperty('projectId');
      expect(storedProject).toHaveProperty('projectName');
      expect(storedProject).toHaveProperty('createdAt');
      expect(storedProject).toHaveProperty('modifiedAt');
      expect(storedProject).toHaveProperty('storagePath');
      expect(storedProject).toHaveProperty('isArchived');

      // Verify types
      expect(typeof storedProject!.projectId).toBe('string');
      expect(typeof storedProject!.projectName).toBe('string');
      expect(typeof storedProject!.isArchived).toBe('boolean');
    });
  });
});
