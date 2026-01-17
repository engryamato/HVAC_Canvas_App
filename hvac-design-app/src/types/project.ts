export interface Project {
    projectId: string;
    projectName: string;
    projectNumber?: string;
    clientName?: string;
    location?: string;
    createdAt: string;
    modifiedAt: string;
    entities?: {
        byId: Record<string, any>;
        allIds: string[];
    };
    viewportState?: {
        panX: number;
        panY: number;
        zoom: number;
    };
    settings?: {
        unitSystem: 'imperial' | 'metric';
        gridSize: number;
        gridVisible: boolean;
    };
    commandHistory?: {
        commands: any[];
        currentIndex: number;
    };
    scope?: {
        projectType?: string;
        details?: string[];
    };
    siteConditions?: {
        elevation?: string;
        outdoorTemp?: string;
        indoorTemp?: string;
        windSpeed?: string;
        humidity?: string;
        localCodes?: string;
    };
}
