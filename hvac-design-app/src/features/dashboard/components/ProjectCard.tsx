'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useRef, useEffect } from 'react';
import type { ProjectListItem } from '../store/projectListStore';
import { useProjectListActions } from '../store/projectListStore';
import { estimateStorageSizeBytes, getProjectStorageKey } from '@/utils/storageKeys';
import { MoreVertical, Edit3, Copy, Archive, ArchiveRestore, Trash2 } from 'lucide-react';

interface ProjectCardProps {
    project: ProjectListItem;
    onDelete: (projectId: string) => void;
    onArchive: (projectId: string) => void;
    onRestore: (projectId: string) => void;
    onDuplicate: (projectId: string) => void;
    onRename: (projectId: string, newName: string) => void;
    animationDelay?: number;
}

/**
 * ProjectCard - Modern Engineering Design 2025
 * Clean card with hover lift, status badges, and smooth menu
 */
export function ProjectCard({
    project,
    onDelete,
    onArchive,
    onRestore,
    onDuplicate,
    onRename,
    animationDelay = 0,
}: ProjectCardProps) {
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const [editing, setEditing] = useState(false);
    const [draftName, setDraftName] = useState(project.projectName);
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when editing starts
    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editing]);

    // Close menu when clicking outside
    useEffect(() => {
        if (!showMenu) {
            return;
        }
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showMenu]);

    const formattedDate = useMemo(() => {
        const date = new Date(project.modifiedAt);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours < 1) {
            return 'Just now';
        }
        if (diffHours < 24) {
            const hours = Math.floor(diffHours);
            return `${hours}h ago`;
        }
        if (diffHours < 48) {
            return 'Yesterday';
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }, [project.modifiedAt]);

    const storageSizeLabel = useMemo(() => {
        if (typeof window === 'undefined') {
            return null;
        }
        const data = localStorage.getItem(getProjectStorageKey(project.projectId));
        const sizeBytes = estimateStorageSizeBytes(data);
        if (!sizeBytes) {
            return null;
        }
        if (sizeBytes < 1024) {
            return `${sizeBytes} B`;
        }
        const sizeKb = sizeBytes / 1024;
        if (sizeKb < 1024) {
            return `${sizeKb.toFixed(1)} KB`;
        }
        return `${(sizeKb / 1024).toFixed(1)} MB`;
    }, [project.projectId, project.modifiedAt]);

    const handleRename = () => {
        const trimmed = draftName.trim();
        if (trimmed.length >= 1 && trimmed.length <= 100) {
            onRename(project.projectId, trimmed);
            setEditing(false);
        }
    };

    const { markAsOpened } = useProjectListActions();

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (
            target.tagName === 'BUTTON' ||
            target.tagName === 'INPUT' ||
            target.closest('button') ||
            target.closest('input')
        ) {
            return;
        }
        markAsOpened(project.projectId);
        router.push(`/canvas/${project.projectId}`);
    };

    const handleOpenClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        markAsOpened(project.projectId);
        router.push(`/canvas/${project.projectId}`);
    };

    const projectName = (project.projectName && project.projectName !== 'undefined') 
        ? project.projectName 
        : 'Untitled Project';

    return (
        <div
            className="project-card group animate-slide-up"
            style={{ animationDelay: `${animationDelay}ms` }}
            onClick={handleCardClick}
            role="article"
            data-testid="project-card"
        >
            {/* Card Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                {editing ? (
                    <div className="flex-1 flex items-center gap-2">
                        <input
                            ref={inputRef}
                            aria-label="Project name"
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleRename();
                                }
                                if (e.key === 'Escape') {
                                    setEditing(false);
                                }
                            }}
                            className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button 
                            onClick={handleRename} 
                            className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Save
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">
                                PROJECT
                            </span>
                            <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">
                                {projectName}
                            </h3>
                            {project.projectNumber && (
                                <span className="text-xs text-slate-500 font-mono">
                                    #{project.projectNumber}
                                </span>
                            )}
                        </div>

                        {/* Menu Button */}
                        <div ref={menuRef} className="relative">
                            <button
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setShowMenu((s) => !s);
                                }}
                                aria-label="Project actions"
                                data-testid="project-card-menu-btn"
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>

                            {/* Dropdown Menu */}
                            {showMenu && (
                                <div 
                                    className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-slate-200 shadow-xl z-20 py-1 overflow-hidden"
                                    data-testid="project-card-menu"
                                >
                                    <button
                                        data-testid="menu-edit-btn"
                                        onClick={() => { setEditing(true); setShowMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        Rename
                                    </button>
                                    <button
                                        data-testid="menu-duplicate-btn"
                                        onClick={() => { onDuplicate(project.projectId); setShowMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Duplicate
                                    </button>
                                    {project.isArchived ? (
                                        <button
                                            data-testid="menu-restore-btn"
                                            onClick={() => { onRestore(project.projectId); setShowMenu(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                        >
                                            <ArchiveRestore className="w-4 h-4" />
                                            Restore
                                        </button>
                                    ) : (
                                        <button
                                            data-testid="menu-archive-btn"
                                            onClick={() => { onArchive(project.projectId); setShowMenu(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                        >
                                            <Archive className="w-4 h-4" />
                                            Archive
                                        </button>
                                    )}
                                    <div className="border-t border-slate-100 my-1" />
                                    <button
                                        data-testid="menu-delete-btn"
                                        onClick={() => { onDelete(project.projectId); setShowMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Status Badge Row */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                {project.isArchived && (
                    <span className="badge badge-amber">Archived</span>
                )}
                {project.entityCount !== undefined && project.entityCount > 0 && (
                    <span className="badge badge-slate">{project.entityCount} items</span>
                )}
                {storageSizeLabel && (
                    <span className="badge badge-slate font-mono">{storageSizeLabel}</span>
                )}
            </div>

            {/* Meta Info */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 text-slate-500">
                    <span className="font-mono text-xs">Modified {formattedDate}</span>
                    {project.clientName && (
                        <>
                            <span className="text-slate-300">•</span>
                            <span className="truncate max-w-[120px]">{project.clientName}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Open Button - appears on hover */}
            <div className="mt-4 pt-4 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={handleOpenClick}
                    className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all active:scale-[0.98]"
                    role="button"
                    aria-label={`Open ${projectName}`}
                >
                    Open Project
                </button>
            </div>
        </div>
    );
}

export default ProjectCard;
