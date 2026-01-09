import { useProjectStore as useLegacyStore } from '@/stores/useProjectStore';
import { useProjectListStore } from '@/features/dashboard/store/projectListStore';

/**
 * Service for File System Access API interactions
 * Handles opening .hvac and .json project files
 */
export class FileSystemService {
    /**
     * Open file picker and load project
     * @returns Project data or null if user cancelled
     */
    static async openProjectFromFile() {
        // Check browser support
        if (typeof window === 'undefined' || !('showOpenFilePicker' in window)) {
            throw new Error('File System Access API not supported in this browser');
        }

        try {
            // Open file picker
            const [fileHandle] = await (window as any).showOpenFilePicker({
                types: [{
                    description: 'HVAC Projects',
                    accept: {
                        'application/json': ['.hvac', '.json']
                    }
                }],
                multiple: false
            });

            // Read file
            const file = await fileHandle.getFile();
            const content = await file.text();
            const projectData = JSON.parse(content);

            return projectData;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                // User cancelled - not an error
                return null;
            }
            throw error;
        }
    }

    /**
     * Import project to both stores (for compatibility with dual-store architecture)
     * @param projectData Raw project data from file
     * @returns Project ID for navigation
     */
    static async importProject(projectData: any) {
        // Map fields to match ProjectListItem interface (dashboard)
        const mappedForDashboard = {
            projectId: projectData.projectId || projectData.id,
            projectName: projectData.projectName || projectData.name,
            projectNumber: projectData.projectNumber || '',
            clientName: projectData.clientName || projectData.client || '',
            entityCount: projectData.entityCount || projectData.entities?.length || 0,
            createdAt: projectData.createdAt || new Date().toISOString(),
            modifiedAt: new Date().toISOString(), // Update to now
            storagePath: `imported-${projectData.projectId || projectData.id}`,
            isArchived: false,
        };

        // Map fields to match Project interface (legacy store)
        const mappedForLegacy = {
            id: projectData.id || projectData.projectId,
            name: projectData.name || projectData.projectName,
            projectNumber: projectData.projectNumber || '',
            clientName: projectData.clientName || projectData.client || '',
            location: projectData.location || '',
            scope: projectData.scope || {
                details: [],
                materials: [],
                projectType: 'Commercial'
            },
            siteConditions: projectData.siteConditions || {
                elevation: '0',
                outdoorTemp: '70',
                indoorTemp: '70',
                windSpeed: '0',
                humidity: '50',
                localCodes: ''
            },
            createdAt: projectData.createdAt || new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            entityCount: projectData.entityCount || projectData.entities?.length || 0,
            thumbnailUrl: null,
            isArchived: false,
            entities: projectData.entities || []
        };

        // Add to dashboard store
        const dashboardStore = useProjectListStore.getState();
        dashboardStore.addProject(mappedForDashboard);

        // Add to legacy store
        const legacyStore = useLegacyStore.getState();
        legacyStore.addProject(mappedForLegacy);

        return mappedForDashboard.projectId;
    }
}
