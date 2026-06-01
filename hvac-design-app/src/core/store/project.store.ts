import { create } from 'zustand';
import type { ProjectDetails } from '../schema/project-file.schema';

export type UnitSystem = 'imperial' | 'metric';

export interface ProjectSettings {
  unitSystem: UnitSystem;
}

interface ProjectState {
  /** Current project ID (null if no project loaded) */
  currentProjectId: string | null;
  /** Project metadata/details */
  projectDetails: ProjectDetails | null;
  /** Project-scoped settings that should persist into the project file */
  projectSettings: ProjectSettings | null;
  /** Whether the project has unsaved changes */
  isDirty: boolean;
}

interface ProjectActions {
  /** Set the current project */
  setProject: (id: string, details: ProjectDetails) => void;
  /** Update project-scoped settings */
  setProjectSettings: (settings: Partial<ProjectSettings>) => void;
  /** Mark project as dirty (unsaved changes) or clean */
  setDirty: (dirty: boolean) => void;
  /** Mark project metadata modified after a canvas write */
  markProjectModified: (modifiedAt?: string) => void;
  /** Clear the current project */
  clearProject: () => void;
}

type ProjectStore = ProjectState & ProjectActions;

export const PROJECT_INITIAL_STATE: ProjectState = {
  currentProjectId: null,
  projectDetails: null,
  projectSettings: null,
  isDirty: false,
};

export const useProjectStore = create<ProjectStore>((set) => ({
  ...PROJECT_INITIAL_STATE,

  setProject: (id, details) =>
    set({ currentProjectId: id, projectDetails: details, projectSettings: null, isDirty: false }),

  setProjectSettings: (settings) =>
    set((state) => ({
      projectSettings: {
        unitSystem: state.projectSettings?.unitSystem ?? 'imperial',
        ...state.projectSettings,
        ...settings,
      },
    })),

  setDirty: (dirty) => set({ isDirty: dirty }),

  markProjectModified: (modifiedAt = new Date().toISOString()) =>
    set((state) => ({
      projectDetails: state.projectDetails
        ? {
            ...state.projectDetails,
            modifiedAt,
          }
        : state.projectDetails,
      isDirty: true,
    })),

  clearProject: () => set(PROJECT_INITIAL_STATE),
}));

// Hook selectors (for React components with reactivity)
export const useCurrentProjectId = () => useProjectStore((state) => state.currentProjectId);
export const useProjectDetails = () => useProjectStore((state) => state.projectDetails);
export const useIsDirty = () => useProjectStore((state) => state.isDirty);
export const useHasProject = () => useProjectStore((state) => state.currentProjectId !== null);
export const useProjectSettings = () => useProjectStore((state) => state.projectSettings);

// Actions hook (per naming convention) - stable selectors to prevent infinite loops
export const useProjectActions = () => {
  const setProject = useProjectStore((state) => state.setProject);
  const setProjectSettings = useProjectStore((state) => state.setProjectSettings);
  const setDirty = useProjectStore((state) => state.setDirty);
  const markProjectModified = useProjectStore((state) => state.markProjectModified);
  const clearProject = useProjectStore((state) => state.clearProject);

  return { setProject, setProjectSettings, setDirty, markProjectModified, clearProject };
};
