import { create } from 'zustand'
import type { ProjectDetails } from '../schema/project-file.schema'

interface ProjectStore {
  // State
  currentProjectId: string | null
  projectDetails: ProjectDetails | null
  isDirty: boolean

  // Actions
  setProject: (id: string, details: ProjectDetails) => void
  setDirty: (dirty: boolean) => void
  clearProject: () => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  // Initial state
  currentProjectId: null,
  projectDetails: null,
  isDirty: false,

  // Actions
  setProject: (id, details) =>
    set({ currentProjectId: id, projectDetails: details }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  clearProject: () =>
    set({ currentProjectId: null, projectDetails: null, isDirty: false }),
}))

