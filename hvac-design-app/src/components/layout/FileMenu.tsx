'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { FileText } from 'lucide-react';
import { ExportReportDialog } from '@/features/export/ExportReportDialog';
import { useAppStateStore } from '@/stores/useAppStateStore';
import { TauriFileSystem } from '@/core/persistence/TauriFileSystem';
import { ProjectAlreadyExistsDialog } from '@/components/dialogs/ProjectAlreadyExistsDialog';
import { UnsavedChangesDialog } from '@/components/dialogs/UnsavedChangesDialog';
import { useCurrentProjectId, useIsDirty } from '@/core/store/project.store';
import {
  createLocalStoragePayloadFromProjectFile,
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
    const [pendingAction, setPendingAction] = useState<null | 'open' | 'new'>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const isTauri = useAppStateStore((state) => state.isTauri);
    const isDirty = useIsDirty();
    const currentProjectId = useCurrentProjectId();
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

    const proceedAfterSaveOrDiscard = async (action: 'open' | 'new') => {
        if (action === 'new') {
            router.push('/dashboard/new');
            return;
        }
        await handleOpenFromFileInternal();
    };

    const handleOpenFromFileInternal = async () => {
        setIsOpen(false);
        setIsLoading(true);

        try {
            if (isTauri) {
                const filePath = await TauriFileSystem.openFileDialog();
                if (!filePath) {
                    return;
                }

                const existing = useProjectListStore.getState().projects.find(p => p.filePath === filePath);
                if (existing) {
                    setExistingProjectId(existing.projectId);
                    setExistingProjectDialogOpen(true);
                    return;
                }

                const { loadProject } = await import('@/core/persistence/projectIO');
                const result = await loadProject(filePath);
                if (!result.success || !result.project) {
                    throw new Error(result.error || 'Failed to load project');
                }

                const projectListStore = useProjectListStore.getState();
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

            const payload = createLocalStoragePayloadFromProjectFile(parsed.data);
            const storageResult = saveProjectToStorage(parsed.data.projectId, payload);
            if (!storageResult.success) {
                throw new Error(storageResult.error || 'Failed to save imported project');
            }

            setWebProjectFileHandle(parsed.data.projectId, opened.fileHandle);

            const projectListStore = useProjectListStore.getState();
            const existingById = projectListStore.projects.find(p => p.projectId === parsed.data.projectId);
            const projectListItem = {
                projectId: parsed.data.projectId,
                projectName: parsed.data.projectName,
                projectNumber: parsed.data.projectNumber,
                clientName: parsed.data.clientName,
                entityCount: parsed.data.entities.allIds.length,
                createdAt: parsed.data.createdAt,
                modifiedAt: parsed.data.modifiedAt,
                storagePath: `file:${opened.fileName}`,
                isArchived: Boolean((parsed.data as any).isArchived),
            };

            if (existingById) {
                projectListStore.updateProject(parsed.data.projectId, projectListItem);
            } else {
                projectListStore.addProject(projectListItem);
            }

            router.push(`/canvas/${parsed.data.projectId}`);
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
            alert('Failed to open project file. Please ensure it is a valid .sws file.');
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

            useProjectListStore.getState().updateProject(currentProjectId!, {
                filePath,
                storagePath: filePath,
            });

            requestCanvasSave();
            return;
        }

        const { buildProjectFileFromStores } = await import('@/features/canvas/hooks/useAutoSave');
        const projectFile = buildProjectFileFromStores();
        if (!projectFile) {
            return;
        }

        await saveProjectAsAndRememberHandle(projectFile);
        requestCanvasSave();
    };

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
                                setIsOpen(false);
                                router.push('/dashboard');
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
                    setExistingProjectDialogOpen(false);
                    setExistingProjectId(null);
                    if (!projectId) {
                        return;
                    }
                    void (async () => {
                        await useProjectListStore.getState().syncProjectFromDisk(projectId);
                        router.push(`/canvas/${projectId}`);
                    })();
                }}
                onCancel={() => {
                    setExistingProjectDialogOpen(false);
                    setExistingProjectId(null);
                }}
            />
        </>
    );
}
