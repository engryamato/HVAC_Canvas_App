import { create } from 'zustand';
import type { ProjectDetails } from '../schema/project-file.schema';

interface ProjectState {
  /** Current project ID (null if no project loaded) */
  currentProjectId: string | null;
  /** Project metadata/details */
  projectDetails: ProjectDetails | null;
  /** Whether the project has unsaved changes */
  isDirty: boolean;
}

interface ProjectActions {
  /** Set the current project */
  setProject: (id: string, details: ProjectDetails) => void;
  /** Mark project as dirty (unsaved changes) or clean */
  setDirty: (dirty: boolean) => void;
  /** Clear the current project */
  clearProject: () => void;
}

type ProjectStore = ProjectState & ProjectActions;

export const PROJECT_INITIAL_STATE: ProjectState = {
  currentProjectId: null,
  projectDetails: null,
  isDirty: false,
};

export const useProjectStore = create<ProjectStore>((set) => ({
  ...PROJECT_INITIAL_STATE,

  setProject: (id, details) =>
    set({ currentProjectId: id, projectDetails: details, isDirty: false }),

  setDirty: (dirty) => set({ isDirty: dirty }),

  clearProject: () => set(PROJECT_INITIAL_STATE),
}));

// Hook selectors (for React components with reactivity)
export const useCurrentProjectId = () => useProjectStore((state) => state.currentProjectId);
export const useProjectDetails = () => useProjectStore((state) => state.projectDetails);
export const useIsDirty = () => useProjectStore((state) => state.isDirty);
export const useHasProject = () => useProjectStore((state) => state.currentProjectId !== null);

// Actions hook (per naming convention) - stable selectors to prevent infinite loops
export const useProjectActions = () => {
  const setProject = useProjectStore((state) => state.setProject);
  const setDirty = useProjectStore((state) => state.setDirty);
  const clearProject = useProjectStore((state) => state.clearProject);
  
  // Return same object reference across renders
  return { setProject, setDirty, clearProject };
};
