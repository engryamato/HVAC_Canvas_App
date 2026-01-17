'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Project } from '@/stores/useProjectStore';
import { useRouter } from 'next/navigation';
import { Clock, MoreVertical, Edit2, Trash2, Archive, Copy, RotateCcw } from 'lucide-react';
import { useProjectListStore } from '@/features/dashboard/store/projectListStore';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { EditProjectDialog } from './EditProjectDialog';

interface ProjectCardProps {
    project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const { archiveProject, restoreProject, duplicateProject } = useProjectListStore((state) => ({
        archiveProject: state.archiveProject,
        restoreProject: state.restoreProject,
        duplicateProject: state.duplicateProject,
    }));

    // Close menu when clicking outside
    useEffect(() => {
        if (!menuOpen) {return;}

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    // Close menu on escape
    useEffect(() => {
        if (!menuOpen) {return;}

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMenuOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [menuOpen]);

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't navigate if clicking the menu button or menu
        if ((e.target as HTMLElement).closest('[data-menu-trigger]') ||
            (e.target as HTMLElement).closest('[data-menu-content]')) {
            return;
        }
        router.push(`/canvas/${project.id}`);
    };

    const handleMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(!menuOpen);
    };

    const handleEdit = () => {
        setMenuOpen(false);
        setEditDialogOpen(true);
    };

    const handleDuplicate = async () => {
        setMenuOpen(false);

        // Generate unique copy name with smart naming
        const projects = useProjectListStore.getState().projects;
        const existingNames = projects.map((p) => p.projectName);

        // Check if base name already has " - Copy" suffix
        const copyMatch = project.name.match(/^(.*) - Copy( \d+)?$/);
        const cleanName = copyMatch?.[1] ?? project.name;

        // Find highest copy number
        let maxCopyNumber = 0;
        const escapedName = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`^${escapedName} - Copy( (\\d+))?$`);

        existingNames.forEach((name) => {
            const match = name.match(pattern);
            if (match) {
                const num = match[2] ? parseInt(match[2], 10) : 1;
                maxCopyNumber = Math.max(maxCopyNumber, num);
            }
        });

        // Generate new name
        const newNumber = maxCopyNumber + 1;
        const copyName = newNumber === 1
            ? `${cleanName} - Copy`
            : `${cleanName} - Copy ${newNumber}`;

        try {
            await duplicateProject(project.id, copyName);
        } catch (error) {
            console.error('[ProjectCard] Failed to duplicate project:', error);
            alert('Failed to duplicate project. Please try again.');
        }
    };

    const handleArchive = async () => {
        setMenuOpen(false);
        try {
            await archiveProject(project.id);
        } catch (error) {
            console.error('[ProjectCard] Failed to archive project:', error);
            alert('Failed to archive project. Please try again.');
        }
    };

    const handleRestore = async () => {
        setMenuOpen(false);
        try {
            await restoreProject(project.id);
        } catch (error) {
            console.error('[ProjectCard] Failed to restore project:', error);
            alert('Failed to restore project. Please try again.');
        }
    };

    const handleDelete = () => {
        setMenuOpen(false);
        setDeleteDialogOpen(true);
    };

    const formattedDate = new Date(project.modifiedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const isArchived = project.isArchived;

    return (
        <>
            <Card
                className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-blue-500/50 relative ${isArchived ? 'opacity-70' : ''
                    }`}
                onClick={handleCardClick}
                data-testid="project-card"
            >
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                    {project.name}
                                </h3>
                                {isArchived && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-600">
                                        Archived
                                    </span>
                                )}
                            </div>
                            {project.projectNumber && (
                                <p className="text-sm text-slate-500 mt-1">#{project.projectNumber}</p>
                            )}
                        </div>

                        {/* Action Menu */}
                        <div className="relative" ref={menuRef}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={handleMenuToggle}
                                data-menu-trigger
                                data-testid="project-card-menu-btn"
                                aria-label={`Actions for ${project.name}`}
                                aria-expanded={menuOpen}
                                aria-haspopup="menu"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>

                            {/* Dropdown Menu */}
                            {menuOpen && (
                                <div
                                    data-menu-content
                                    className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50"
                                    role="menu"
                                    aria-orientation="vertical"
                                >
                                    <button
                                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                                        onClick={handleEdit}
                                        role="menuitem"
                                        data-testid="menu-edit-btn"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        Edit Details
                                    </button>

                                    <button
                                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                                        onClick={handleDuplicate}
                                        role="menuitem"
                                        data-testid="menu-duplicate-btn"
                                    >
                                        <Copy className="h-4 w-4" />
                                        Duplicate
                                    </button>

                                    <div className="border-t border-slate-100 my-1" />

                                    {isArchived ? (
                                        <button
                                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                                            onClick={handleRestore}
                                            role="menuitem"
                                            data-testid="menu-restore-btn"
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                            Restore
                                        </button>
                                    ) : (
                                        <button
                                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                                            onClick={handleArchive}
                                            role="menuitem"
                                            data-testid="menu-archive-btn"
                                        >
                                            <Archive className="h-4 w-4" />
                                            Archive
                                        </button>
                                    )}

                                    <div className="border-t border-slate-100 my-1" />

                                    <button
                                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        onClick={handleDelete}
                                        role="menuitem"
                                        data-testid="menu-delete-btn"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {project.clientName && (
                            <p className="text-sm text-slate-600">
                                <span className="font-medium">Client:</span> {project.clientName}
                            </p>
                        )}
                        {project.location && (
                            <p className="text-sm text-slate-600">
                                <span className="font-medium">Location:</span> {project.location}
                            </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-4 pt-4 border-t">
                            <Clock className="w-3 h-3" />
                            <span>Modified {formattedDate}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                projectId={project.id}
                projectName={project.name}
                entityCount={project.entityCount}
                modifiedAt={project.modifiedAt}
                filePath={(project as any).filePath} // Tauri file path if available
            />

            {/* Edit Project Dialog */}
            <EditProjectDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                project={{
                    projectId: project.id,
                    projectName: project.name,
                    projectNumber: project.projectNumber || undefined,
                    clientName: project.clientName || undefined,
                    entityCount: project.entityCount,
                    createdAt: project.createdAt,
                    modifiedAt: project.modifiedAt,
                    storagePath: `project-${project.id}`,
                    isArchived: project.isArchived ?? false,
                }}
            />
        </>
    );
};
