'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { FileText } from 'lucide-react';
import { ExportReportDialog } from '@/features/export/ExportReportDialog';
import { useAppStateStore } from '@/stores/useAppStateStore';
import { TauriFileSystem } from '@/core/persistence/TauriFileSystem';
import { ProjectAlreadyExistsDialog } from '@/components/dialogs/ProjectAlreadyExistsDialog';
import { UnsavedChangesDialog } from '@/components/dialogs/UnsavedChangesDialog';
import { ErrorDialog } from '@/components/dialogs/ErrorDialog';
import { useCurrentProjectId, useIsDirty, useProjectActions } from '@/core/store/project.store';
import {
  buildProjectFileFromStores,
  createLocalStoragePayloadFromProjectFileWithDefaults,
  saveProjectToStorage,
} from '@/features/canvas/hooks/useAutoSave';
import { setWebProjectFileHandle } from '@/core/persistence/webFileHandles';
import { openProjectFromPicker, saveProjectAsAndRememberHandle } from '@/core/persistence/webProjectFileIO';
import { deserializeProjectLenient } from '@/core/persistence/serialization';
import { useProjectListStore } from '@/features/dashboard/store/projectListStore';

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
    const menuRef = useRef<HTMLDivElement>(null);

    const isTauri = useAppStateStore((state) => state.isTauri);
    const isDirty = useIsDirty();
    const currentProjectId = useCurrentProjectId();
    const { setDirty } = useProjectActions();
    const canSave = Boolean(currentProjectId && pathname.startsWith('/canvas/'));

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

    const requestCanvasSave = () => {
        if (typeof window === 'undefined') {
            return;
        }
        window.dispatchEvent(new Event('sws:canvas-save'));
    };

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

    const handleOpenFromFileInternal = async () => {
        setIsOpen(false);
        setIsLoading(true);

        try {
            if (isTauri) {
                const filePath = await TauriFileSystem.openFileDialog();
                if (!filePath) {
                    return;
                }
                const { loadProject } = await import('@/core/persistence/projectIO');
                const result = await loadProject(filePath);
                if (!result.success || !result.project) {
                    throw new Error(result.error || 'Failed to load project');
                }

                const projectListStore = useProjectListStore.getState();
                const existing = projectListStore.projects.find(
                    p => p.filePath === filePath || p.projectId === result.project!.projectId
                );
                if (existing) {
                    setExistingProjectId(existing.projectId);
                    setExistingProjectFilePath(filePath);
                    setExistingProjectDialogOpen(true);
                    return;
                }

                const existingById = projectListStore.projects.find(
                    p => p.projectId === result.project!.projectId
                );
                const projectListItem = {
                    projectId: result.project.projectId,
                    projectName: result.project.projectName,
                    projectNumber: result.project.projectNumber,
                    clientName: result.project.clientName,
                    entityCount: result.project.entities.allIds.length,
                    createdAt: result.project.createdAt,
                    modifiedAt: result.project.modifiedAt,
                    storagePath: filePath,
                    isArchived: Boolean((result.project as any).isArchived),
                    filePath,
                };

                if (existingById) {
                    projectListStore.updateProject(result.project.projectId, projectListItem);
                } else {
                    projectListStore.addProject(projectListItem);
                }

                router.push(`/canvas/${result.project.projectId}`);
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
    };

    const handleOpenFromFile = async () => {
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
    };

    const handleNewProject = () => {
        if (isDirty) {
            setPendingAction('new');
            setUnsavedDialogOpen(true);
            setIsOpen(false);
            return;
        }
        setIsOpen(false);
        router.push('/dashboard/new');
    };

    const handleSaveAs = async () => {
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
    };

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
                    <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg py-1 min-w-[200px] z-50 flex flex-col items-start">
                        <button
                            onClick={() => {
                                handleNavigateDashboard();
                            }}
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
                            className="w-full text-left px-4 py-2 hover:bg-slate-100 transition-colors text-sm"
                            data-testid="menu-archived"
                        >
                            Archived Projects
                        </button>

                        <div className="h-px bg-slate-200 w-full my-1" />

                        <button
                            onClick={handleNewProject}
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

                        <div className="h-px bg-slate-200 w-full my-1" />

                        <button
                            onClick={() => {
                                setIsOpen(false);
                                requestCanvasSave();
                            }}
                            disabled={!canSave}
                            className="w-full text-left px-4 py-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex justify-between items-center"
                        >
                            Save Project <span className="text-xs opacity-50 ml-2">Ctrl+S</span>
                        </button>
                        <button
                            onClick={() => void handleSaveAs()}
                            disabled={!canSave}
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
                        await useProjectListStore.getState().syncProjectFromDisk(projectId);
                        router.push(`/canvas/${projectId}`);
                    })();
                }}
                onCancel={() => {
                    setExistingProjectDialogOpen(false);
                    setExistingProjectId(null);
                    setExistingProjectFilePath(null);
                }}
            />

            {errorMessage && (
                <ErrorDialog
                    message={errorMessage}
                    onClose={() => setErrorMessage(null)}
                />
            )}
        </>
    );
}
