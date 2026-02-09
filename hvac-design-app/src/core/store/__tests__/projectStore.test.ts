import { describe, it, beforeEach, expect } from 'vitest';
import { useProjectStore, PROJECT_INITIAL_STATE } from '../project.store';
import type { ProjectDetails } from '../../schema/project-file.schema';

describe('ProjectStore', () => {
  const mockDetails: ProjectDetails = {
    projectId: '550e8400-e29b-41d4-a716-446655440000',
    projectName: 'Test Project',
    isArchived: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    useProjectStore.setState(PROJECT_INITIAL_STATE);
  });

  it('sets project details and resets dirty flag', () => {
    useProjectStore.getState().setProject(mockDetails.projectId, mockDetails);

    expect(useProjectStore.getState().currentProjectId).toBe(mockDetails.projectId);
    expect(useProjectStore.getState().projectDetails).toEqual(mockDetails);
    expect(useProjectStore.getState().isDirty).toBe(false);
  });

  it('marks project as dirty and clean', () => {
    useProjectStore.getState().setDirty(true);
    expect(useProjectStore.getState().isDirty).toBe(true);

    useProjectStore.getState().setDirty(false);
    expect(useProjectStore.getState().isDirty).toBe(false);
  });

  it('clears project to initial state', () => {
    useProjectStore.getState().setProject('project-1', mockDetails);
    useProjectStore.getState().setDirty(true);

    useProjectStore.getState().clearProject();

    expect(useProjectStore.getState()).toMatchObject(PROJECT_INITIAL_STATE);
  });
});
