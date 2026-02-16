import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';
import { useSettingsStore } from '@/core/store/settingsStore';
import { useDialogStore } from '@/core/store/dialogStore';
import { FileText } from 'lucide-react';
import { ExportReportDialog } from '@/features/export/ExportReportDialog';
import { useAppStateStore } from '@/stores/useAppStateStore';
import { TauriFileSystem } from '@/core/persistence/TauriFileSystem';
import { ProjectAlreadyExistsDialog } from '@/components/dialogs/ProjectAlreadyExistsDialog';
import { UnsavedChangesDialog } from '@/components/dialogs/UnsavedChangesDialog';
import { ErrorDialog } from '@/components/dialogs/ErrorDialog';
import { useCurrentProjectId, useIsDirty, useProjectActions, useProjectStore } from '@/core/store/project.store';
import { useEntityStore } from '@/core/store/entityStore';
import { useViewportStore } from '@/features/canvas/store/viewportStore';
import {
  buildProjectFileFromStores,
  createLocalStoragePayloadFromProjectFileWithDefaults,
  loadProjectFromStorage,
  saveProjectToStorage,
} from '@/features/canvas/hooks/useAutoSave';
import { setWebProjectFileHandle } from '@/core/persistence/webFileHandles';
import { openProjectFromPicker, saveProjectAsAndRememberHandle } from '@/core/persistence/webProjectFileIO';
import { deserializeProjectLenient } from '@/core/persistence/serialization';
import { useProjectListStore } from '@/features/dashboard/store/projectListStore';
import { getProjectRepository } from '@/core/persistence/ProjectRepository';
import { createEmptyProject, type ProjectFile } from '@/core/schema/project-file.schema';
import { ProjectSetupWizard, type ProjectSetupData } from '@/features/project/components/ProjectSetupWizard';
import { MigrationWizard } from '@/components/dialogs/MigrationWizard';
import { useToast } from '@/components/ui/ToastContext';
import {
    ENABLE_MIGRATION_WIZARD,
    ENABLE_PROJECT_SETUP_WIZARD,
    ENABLE_SYSTEM_TEMPLATE_DIALOG,
} from '@/core/config/featureFlags';

export function FileMenu() {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
    const [existingProjectDialogOpen, setExistingProjectDialogOpen] = useState(false);
    const [existingProjectId, setExistingProjectId] = useState<string | null>(null);
    const [existingProjectFilePath, setExistingProjectFilePath] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<null | 'open' | 'new' | 'dashboard'>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [projectSetupOpen, setProjectSetupOpen] = useState(false);
    const [migrationWizardOpen, setMigrationWizardOpen] = useState(false);
    const [migrationWizardData, setMigrationWizardData] = useState<ProjectFile | Record<string, never>>({});
    const menuRef = useRef<HTMLDivElement>(null);

    const isTauri = useAppStateStore((state) => state.isTauri);
    const isDirty = useIsDirty();
    const currentProjectId = useCurrentProjectId();
    const { setDirty, setProject } = useProjectActions();
    const isCanvasRoute = pathname.startsWith('/canvas/');
    const canSave = Boolean(currentProjectId && pathname.startsWith('/canvas/'));
    const canOpenSystemTemplate = isCanvasRoute && ENABLE_SYSTEM_TEMPLATE_DIALOG;
    const { addToast } = useToast();

    const loadProjectDataForMigration = async (): Promise<ProjectFile | null> => {
        if (isCanvasRoute) {
            return buildProjectFileFromStores();
        }

        const lastProjectId = localStorage.getItem('lastActiveProjectId');
        if (!lastProjectId) {
            console.warn('No recent project found for migration');
            return null;
        }

        try {
            const loaded = loadProjectFromStorage(lastProjectId);
            return loaded?.payload?.project || null;
        } catch (error) {
            console.error('Failed to load project for migration:', error);
            return null;
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const requestCanvasSave = useCallback(() => {
        if (typeof window === 'undefined') {
            return;
        }
        window.dispatchEvent(new Event('sws:canvas-save'));
    }, []);

    const handleOpenFromFileInternal = useCallback(async () => {
        setIsOpen(false);
        setIsLoading(true);

        try {
            if (isTauri) {
                const filePath = await TauriFileSystem.openFileDialog();
                if (!filePath) {
                    return;
                }
                const { loadProject } = await import('@/core/persistence/projectIO');
                const loadResult = await loadProject(filePath);
                if (!loadResult.success || !loadResult.project) {
                    throw new Error(loadResult.error || 'Failed to load project');
                }
                const importedProject = loadResult.project;

                const projectListStore = useProjectListStore.getState();
                const existing = projectListStore.projects.find(
                    p => p.filePath === filePath || p.projectId === importedProject.projectId
                );
                if (existing) {
                    setExistingProjectId(existing.projectId);
                    setExistingProjectFilePath(filePath);
                    setExistingProjectDialogOpen(true);
                    return;
                }

                const repository = await getProjectRepository();
                const importResult = await repository.importProject(filePath);
                if (!importResult.success) {
                    throw new Error(importResult.error || 'Failed to import project');
                }

                if (importResult.filePath) {
                    projectListStore.updateProject(importResult.projectId, {
                        filePath: importResult.filePath,
                        storagePath: importResult.filePath,
                    });
                }

                await projectListStore.refreshProjects();
                router.push(`/canvas/${importResult.projectId}`);
                return;
            }

            const opened = await openProjectFromPicker();
            if (!opened) {
                return;
            }

            const parsed = deserializeProjectLenient(opened.contents);
            if (!parsed.success || !parsed.data) {
                throw new Error(parsed.error || 'Invalid project file');
            }

            const projectFile = parsed.data;
            const payload = createLocalStoragePayloadFromProjectFileWithDefaults(projectFile);
            const storageResult = saveProjectToStorage(projectFile.projectId, payload);
                if (!storageResult.success) {
                    throw new Error(storageResult.error || 'Failed to save imported project');
                }

            setWebProjectFileHandle(projectFile.projectId, opened.fileHandle);

            const projectListStore = useProjectListStore.getState();
            const existingById = projectListStore.projects.find(p => p.projectId === projectFile.projectId);
            const projectListItem = {
                projectId: projectFile.projectId,
                projectName: projectFile.projectName,
                projectNumber: projectFile.projectNumber,
                clientName: projectFile.clientName,
                entityCount: projectFile.entities.allIds.length,
                createdAt: projectFile.createdAt,
                modifiedAt: projectFile.modifiedAt,
                storagePath: `file:${opened.fileName}`,
                isArchived: Boolean((projectFile as any).isArchived),
            };

            if (existingById) {
                projectListStore.updateProject(projectFile.projectId, projectListItem);
            } else {
                projectListStore.addProject(projectListItem);
            }

            router.push(`/canvas/${projectFile.projectId}`);
        } finally {
            setIsLoading(false);
        }
    }, [isTauri, router]);

    const proceedAfterSaveOrDiscard = async (action: 'open' | 'new' | 'dashboard') => {
        if (action === 'new') {
            router.push('/dashboard/new');
            return;
        }

        if (action === 'dashboard') {
            setDirty(false);
            router.push('/dashboard');
            return;
        }
        await handleOpenFromFileInternal();
    };

    const handleNavigateDashboard = useCallback(() => {
        setIsOpen(false);
        if (!pathname.startsWith('/canvas/')) {
            router.push('/dashboard');
            return;
        }

        if (isDirty) {
            setPendingAction('dashboard');
            setUnsavedDialogOpen(true);
            return;
        }

        router.push('/dashboard');
    }, [isDirty, pathname, router]);

    useEffect(() => {
        const handleNavigateEvent = () => {
            handleNavigateDashboard();
        };

        window.addEventListener('sws:navigate-dashboard', handleNavigateEvent);
        return () => window.removeEventListener('sws:navigate-dashboard', handleNavigateEvent);
    }, [handleNavigateDashboard]);

    const handleOpenFromFile = useCallback(async () => {
        if (isDirty) {
            setPendingAction('open');
            setUnsavedDialogOpen(true);
            setIsOpen(false);
            return;
        }

        try {
            await handleOpenFromFileInternal();
        } catch (error) {
            console.error('Failed to open file:', error);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Failed to open project file. Please ensure it is a valid .sws file.'
            );
        }
    }, [isDirty, handleOpenFromFileInternal]);

    const handleNewProject = useCallback(() => {
        if (isDirty) {
            setPendingAction('new');
            setUnsavedDialogOpen(true);
            setIsOpen(false);
            return;
        }
        setIsOpen(false);
        if (!ENABLE_PROJECT_SETUP_WIZARD) {
            router.push('/dashboard/new');
            return;
        }
        setProjectSetupOpen(true);
    }, [isDirty, router]);

    const handleProjectSetupComplete = async (projectData: ProjectSetupData) => {
        const projectId = crypto.randomUUID();
        const now = new Date().toISOString();

        try {
            const projectFile = createEmptyProject(projectData.projectName, {
                projectId,
                createdAt: now,
                modifiedAt: now,
                isArchived: false,
                location: projectData.location || undefined,
                settings: projectData.settings ? {
                    unitSystem: projectData.settings.unitSystem || 'imperial',
                    gridSize: projectData.settings.gridSize || 12,
                    gridVisible: projectData.settings.gridVisible ?? true,
                    snapToGrid: projectData.settings.snapToGrid ?? true,
                    // Include any other calculation settings from the wizard
                    ...projectData.settings
                } : undefined,
            });

            const repository = await getProjectRepository();
            const saveResult = await repository.saveProject(projectFile);
            if (!saveResult.success) {
                throw new Error(saveResult.error || 'Failed to create project');
            }

            const projectListStore = useProjectListStore.getState();
            projectListStore.addProject({
                projectId,
                projectName: projectData.projectName,
                entityCount: 0,
                createdAt: now,
                modifiedAt: now,
                storagePath: saveResult.filePath || `project-${projectId}`,
                filePath: saveResult.filePath,
                isArchived: false,
                status: 'draft',
            });
            await projectListStore.refreshProjects();

            // 1. Initialize Project Store
            setProject(projectId, {
                projectId: projectId,
                projectName: projectData.projectName,
                isArchived: false,
                location: projectData.location,
                createdAt: now,
                modifiedAt: now,
            });

            // 2. Apply Settings
            if (projectData.settings) {
                useSettingsStore.getState().setCalculationSettings(projectData.settings);
            }

            setDirty(false);
            setProjectSetupOpen(false);
            router.push(`/canvas/${projectId}`);
            
            addToast({
                title: 'Project Created',
                message: `Started project: ${projectData.projectName}`,
                type: 'success',
            });
        } catch (error) {
            console.error('[FileMenu] Failed to create project:', error);
            setErrorMessage(error instanceof Error ? error.message : 'Failed to create project');
        }
    };

    const handleMigration = async () => {
        setIsOpen(false);
        if (!ENABLE_MIGRATION_WIZARD) {
            return;
        }

        const projectData = await loadProjectDataForMigration();
        if (!projectData) {
            addToast({
                title: 'Migration Unavailable',
                message: isCanvasRoute
                    ? 'Unable to load current project data for migration.'
                    : 'No project found to migrate. Please open a project first.',
                type: 'error',
            });
            return;
        }

        setMigrationWizardData(projectData);
        setMigrationWizardOpen(true);
    };

    const handleSaveAs = useCallback(async () => {
        setIsOpen(false);
        if (!canSave) {
            return;
        }

        if (isTauri) {
            const projectName = useProjectListStore.getState().projects.find(p => p.projectId === currentProjectId)?.projectName
                || 'Project';
            const filePath = await TauriFileSystem.saveFileDialog(projectName);
            if (!filePath) {
                return;
            }

            const projectFile = buildProjectFileFromStores();
            if (!projectFile) {
                return;
            }

            const { saveProject } = await import('@/core/persistence/projectIO');
            const result = await saveProject(projectFile, filePath);
            if (!result.success) {
                setErrorMessage(result.error || 'Failed to save project');
                return;
            }

            useProjectListStore.getState().updateProject(currentProjectId!, { filePath, storagePath: filePath });
            setDirty(false);
            return;
        }

        const projectFile = buildProjectFileFromStores();
        if (!projectFile) {
            return;
        }

        await saveProjectAsAndRememberHandle(projectFile);
        requestCanvasSave();
    }, [canSave, isTauri, currentProjectId, requestCanvasSave, setDirty]);

    useEffect(() => {
        const isEditableTarget = (target: EventTarget | null) => {
            if (!(target instanceof HTMLElement)) {
                return false;
            }
            const tagName = target.tagName.toLowerCase();
            return tagName === 'input' || tagName === 'textarea' || target.isContentEditable;
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (isEditableTarget(event.target)) {
                return;
            }

            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 's') {
                if (!canSave) {
                    return;
                }
                event.preventDefault();
                void handleSaveAs();
                return;
            }

            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') {
                event.preventDefault();
                void handleOpenFromFile();
                return;
            }

            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
                event.preventDefault();
                handleNewProject();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canSave, handleOpenFromFile, handleNewProject, handleSaveAs]);

    const handleExportReport = () => {
        setIsOpen(false);
        setExportDialogOpen(true);
    };

    return (
        <>
            <div className="relative" ref={menuRef}>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <FileText className="w-4 h-4" />
                    File
                </Button>

                {isOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg py-1 min-w-[200px] z-50 flex flex-col items-start" role="menu">
                        <button
                            onClick={() => {
                                handleNavigateDashboard();
                            }}
                            role="menuitem"
                            className="w-full text-left px-4 py-2 hover:bg-slate-100 transition-colors text-sm flex justify-between items-center"
                            data-testid="menu-dashboard"
                        >
                            Go to Dashboard <span className="text-xs opacity-50 ml-2">Ctrl+Shift+D</span>
                        </button>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                router.push('/dashboard?view=archived');
                            }}
                            role="menuitem"
                            className="w-full text-left px-4 py-2 hover:bg-slate-100 transition-colors text-sm"
                            data-testid="menu-archived"
                        >
                            Archived Projects
                        </button>

                        <div className="h-px bg-slate-200 w-full my-1" role="separator" />

                        <button
                            onClick={handleNewProject}
                            role="menuitem"
                            className="w-full text-left px-4 py-2 hover:bg-slate-100 transition-colors text-sm flex justify-between items-center"
                        >
                            New Project... <span className="text-xs opacity-50 ml-2">Ctrl+N</span>
                        </button>
                        <button
                            onClick={handleOpenFromFile}
                            disabled={isLoading}
                            role="menuitem"
                            className="w-full text-left px-4 py-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex justify-between items-center"
                        >
                            {isLoading ? 'Opening...' : 'Open from File...'} <span className="text-xs opacity-50 ml-2">Ctrl+O</span>
                        </button>

                        <div className="h-px bg-slate-200 w-full my-1" role="separator" />

                        <button
                            onClick={handleMigration}
                            disabled={!ENABLE_MIGRATION_WIZARD}
                            role="menuitem"
                            className="w-full text-left px-4 py-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                            Migrate Data
                        </button>
                        
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                if (!canOpenSystemTemplate) {
                                    useDialogStore.getState().setOpenSystemTemplate(false);
                                    return;
                                }
                                useDialogStore.getState().setOpenSystemTemplate(true);
                            }}
                            disabled={!canOpenSystemTemplate}
                            role="menuitem"
                            className="w-full text-left px-4 py-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                            Apply System Template...
                        </button>

                        <div className="h-px bg-slate-200 w-full my-1" role="separator" />

                        <button
                            onClick={() => {
                                setIsOpen(false);
                                requestCanvasSave();
                            }}
                            disabled={!canSave}
                            role="menuitem"
                            className="w-full text-left px-4 py-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex justify-between items-center"
                        >
                            Save Project <span className="text-xs opacity-50 ml-2">Ctrl+S</span>
                        </button>
                        <button
                            onClick={() => void handleSaveAs()}
                            disabled={!canSave}
                            role="menuitem"
                            className="w-full text-left px-4 py-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex justify-between items-center"
                        >
                            Save Project As... <span className="text-xs opacity-50 ml-2">Ctrl+Shift+S</span>
                        </button>
                        <button
                            onClick={handleExportReport}
                            role="menuitem"
                            className="w-full text-left px-4 py-2 hover:bg-slate-100 transition-colors text-sm flex justify-between items-center"
                            data-testid="menu-export-report"
                        >
                            Export Report... <span className="text-xs opacity-50 ml-2">Ctrl+P</span>
                        </button>
                    </div>
                )}
            </div>

            <ExportReportDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
            />

            <UnsavedChangesDialog
                open={unsavedDialogOpen}
                onOpenChange={setUnsavedDialogOpen}
                onSaveAndLeave={() => {
                    requestCanvasSave();
                    setUnsavedDialogOpen(false);
                    if (pendingAction) {
                        void proceedAfterSaveOrDiscard(pendingAction);
                    }
                    setPendingAction(null);
                }}
                onLeaveWithoutSaving={() => {
                    setUnsavedDialogOpen(false);
                    if (pendingAction) {
                        void proceedAfterSaveOrDiscard(pendingAction);
                    }
                    setPendingAction(null);
                }}
                onCancel={() => {
                    setUnsavedDialogOpen(false);
                    setPendingAction(null);
                }}
            />

            <ProjectAlreadyExistsDialog
                open={existingProjectDialogOpen}
                onOpenChange={setExistingProjectDialogOpen}
                projectName={existingProjectId
                    ? (useProjectListStore.getState().projects.find(p => p.projectId === existingProjectId)?.projectName
                        || 'Project')
                    : 'Project'}
                onContinue={() => {
                    const projectId = existingProjectId;
                    const filePath = existingProjectFilePath;
                    setExistingProjectDialogOpen(false);
                    setExistingProjectId(null);
                    setExistingProjectFilePath(null);
                    if (!projectId) {
                        return;
                    }
                    void (async () => {
                        if (filePath) {
                            useProjectListStore.getState().updateProject(projectId, {
                                filePath,
                                storagePath: filePath,
                            });
                        }
                        await useProjectListStore.getState().syncProject(projectId);
                        router.push(`/canvas/${projectId}`);
                    })();
                }}
                onCancel={() => {
                    setExistingProjectDialogOpen(false);
                    setExistingProjectId(null);
                    setExistingProjectFilePath(null);
                }}
            />

            {ENABLE_PROJECT_SETUP_WIZARD && (
                <ProjectSetupWizard 
                    isOpen={projectSetupOpen}
                    onClose={() => setProjectSetupOpen(false)}
                    onComplete={handleProjectSetupComplete}
                />
            )}

            {ENABLE_MIGRATION_WIZARD && (
                <MigrationWizard
                    isOpen={migrationWizardOpen}
                    onClose={() => setMigrationWizardOpen(false)}
                    data={migrationWizardData}
                    onMigrationComplete={(migratedData: any) => {
                        if (!migratedData || !migratedData.projectId) {
                            setErrorMessage('Migration produced invalid data');
                            return;
                        }

                        const payload = createLocalStoragePayloadFromProjectFileWithDefaults(migratedData);
                        const storageResult = saveProjectToStorage(migratedData.projectId, payload);
                        if (!storageResult.success) {
                            setErrorMessage(storageResult.error || 'Failed to save migrated project');
                            return;
                        }

                        if (migratedData.entities) {
                            useEntityStore.getState().hydrate(migratedData.entities);
                        }

                        if (migratedData.viewportState) {
                            useViewportStore.setState({
                                panX: migratedData.viewportState.panX,
                                panY: migratedData.viewportState.panY,
                                zoom: migratedData.viewportState.zoom,
                            });
                        }

                        if (migratedData.settings) {
                            useSettingsStore.getState().setCalculationSettings(migratedData.settings);
                        }

                        const migratedProject = payload.project;
                        useProjectStore.getState().setProject(migratedData.projectId, {
                            projectId: migratedData.projectId,
                            projectName: migratedProject.projectName,
                            projectNumber: migratedProject.projectNumber,
                            clientName: migratedProject.clientName,
                            isArchived: migratedProject.isArchived,
                            createdAt: migratedProject.createdAt,
                            modifiedAt: migratedProject.modifiedAt,
                        });

                        const projectListStore = useProjectListStore.getState();
                        projectListStore.updateProject(migratedData.projectId, {
                            projectName: migratedProject.projectName,
                            projectNumber: migratedProject.projectNumber,
                            clientName: migratedProject.clientName,
                            modifiedAt: new Date().toISOString()
                        });

                        setMigrationWizardOpen(false);
                        if (!isCanvasRoute) {
                            router.push(`/canvas/${migratedData.projectId}`);
                        }

                        addToast({
                            title: 'Migration Complete',
                            message: 'Data migration finished successfully.',
                            type: 'success',
                        });
                    }}
                />
            )}

            {errorMessage && (
                <ErrorDialog
                    message={errorMessage}
                    onClose={() => setErrorMessage(null)}
                />
            )}
        </>
    );
}
