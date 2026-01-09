import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Project {
    id: string;
    name: string;
    projectNumber?: string | null;
    clientName?: string | null;
    location?: string | null;
    scope: {
        details: string[];
        materials: { type: string; grade?: string }[];
        projectType: string;
    };
    siteConditions: {
        elevation: string;
        outdoorTemp: string;
        indoorTemp: string;
        windSpeed: string;
        humidity: string;
        localCodes: string;
    };
    createdAt: string;
    modifiedAt: string;
    entityCount: number;
    thumbnailUrl?: string | null;
    isArchived: boolean;
    version?: string; // App version when created/modified
}

interface ProjectStoreState {
    projects: Project[];
    addProject: (project: Project) => void;
    getProject: (id: string) => Project | undefined;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;
}

export const useProjectStore = create<ProjectStoreState>()(
    persist(
        (set, get) => ({
            projects: [],

            addProject: (project) =>
                set((state) => ({
                    projects: [project, ...state.projects],
                })),

            getProject: (id) => {
                return get().projects.find((p) => p.id === id);
            },

            updateProject: (id, updates) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === id ? { ...p, ...updates, modifiedAt: new Date().toISOString() } : p
                    ),
                })),

            deleteProject: (id) =>
                set((state) => ({
                    projects: state.projects.filter((p) => p.id !== id),
                })),
        }),
        {
            name: 'project-storage',
        }
    )
);
