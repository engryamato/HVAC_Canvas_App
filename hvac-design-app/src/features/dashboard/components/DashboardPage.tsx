'use client';

import { useState, useEffect, useRef } from 'react';
import { useProjectListStore, useRecentProjects } from '../store/projectListStore';
import { useProjectFilters } from '../hooks/useProjectFilters';
import { SearchBar } from './SearchBar';
import { RecentProjectsSection } from './RecentProjectsSection';
import { AllProjectsSection } from './AllProjectsSection';
import { Plus, Archive, FolderOpen, Search as SearchIcon } from 'lucide-react';
import { NewProjectDialog } from '@/components/dashboard/NewProjectDialog';
import { FileMenu } from '@/components/layout/FileMenu';
import { useAutoOpen } from '@/hooks/useAutoOpen';
import { useAppStateStore } from '@/stores/useAppStateStore';
import { useSearchParams } from 'next/navigation';

/**
 * Dashboard Page - Modern Engineering Project Management Interface
 * 2025 Design: Glassmorphism, Bento Grid, Segmented Controls
 * 
 * Implements UJ-PM-002: Opening Existing Projects
 * Implements UJ-PM-007: Search & Filter Projects
 * Implements UJ-PM-005: Archive and restore projects
 */
export function DashboardPage() {
    const allProjectsRaw = useProjectListStore(state => state.projects);
    const activeProjects = allProjectsRaw.filter(p => !p.isArchived);
    const archivedProjects = allProjectsRaw.filter(p => p.isArchived);
    const recentProjects = useRecentProjects();
    const scanProjectsFromDisk = useProjectListStore(state => state.scanProjectsFromDisk);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const searchParams = useSearchParams();
    const viewParam = searchParams.get('view') as 'active' | 'archived' | null;
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>(viewParam === 'archived' ? 'archived' : 'active');
    const [focusedIndex, setFocusedIndex] = useState(0);
    const isTauri = useAppStateStore((state) => state.isTauri);

    // Sync state with URL
    useEffect(() => {
        setActiveTab(viewParam === 'archived' ? 'archived' : 'active');
    }, [viewParam]);

    const displayedProjects = activeTab === 'active' ? activeProjects : archivedProjects;
    const {
        filteredProjects,
        totalCount,
        filters,
        setSearchQuery,
        setSortBy,
        setSortOrder,
    } = useProjectFilters(displayedProjects);

    useAutoOpen();

    useEffect(() => {
        void (async () => {
            await useProjectListStore.persist.rehydrate();
            if (isTauri) {
                await scanProjectsFromDisk();
            }
        })();
    }, [isTauri, scanProjectsFromDisk]);

    const handleRescan = async () => {
        if (!isTauri) return;
        await scanProjectsFromDisk();
    };

    const handleOpenFromFile = async () => {
        if (!isTauri) return;
        try {
            const { TauriFileSystem } = await import('@/core/persistence/TauriFileSystem');
            const { loadProject } = await import('@/core/persistence/projectIO');
            const addProjectToList = useProjectListStore.getState().addProject;
            const filePath = await TauriFileSystem.openFileDialog();
            if (!filePath) return;
            const result = await loadProject(filePath);
            if (!result.success || !result.project) {
                alert(`Failed to open project: ${result.error || 'Unknown error'}`);
                return;
            }
            const existingProject = allProjectsRaw.find(p => p.projectId === result.project!.projectId);
            if (!existingProject) {
                const projectListItem = {
                    projectId: result.project.projectId,
                    projectName: result.project.projectName,
                    projectNumber: result.project.projectNumber,
                    clientName: result.project.clientName,
                    entityCount: result.project.entities?.allIds?.length || 0,
                    createdAt: result.project.createdAt,
                    modifiedAt: result.project.modifiedAt,
                    storagePath: filePath,
                    isArchived: ('isArchived' in result.project ? result.project.isArchived : false) as boolean,
                    filePath: filePath,
                };
                addProjectToList(projectListItem);
            }
            window.location.href = `/canvas/${result.project.projectId}`;
        } catch (error) {
            console.error('[DashboardPage] Failed to open project:', error);
            alert('Failed to open project. Please check the file and try again.');
        }
    };

    const handleSortChange = (sortBy: 'name' | 'date', sortOrder: 'asc' | 'desc') => {
        setSortBy(sortBy);
        setSortOrder(sortOrder);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
                searchInput?.focus();
                return;
            }
            if (e.key === 'Escape' && filters.searchQuery) {
                setSearchQuery('');
                return;
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                setFocusedIndex((prev) => Math.min(prev + 1, filteredProjects.length - 1));
                return;
            }
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                setFocusedIndex((prev) => Math.max(prev - 1, 0));
                return;
            }
            if (e.key === 'Enter' && filteredProjects[focusedIndex]) {
                window.location.href = `/canvas/${filteredProjects[focusedIndex].projectId}`;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filters.searchQuery, focusedIndex, filteredProjects, setSearchQuery]);

    return (
        <div className="min-h-screen bg-slate-50 grid-pattern" data-testid="dashboard-page">
            {/* Glassmorphism Header */}
            <header className="glass-header sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Logo & Title */}
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                            <FolderOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">HVAC Pro Design</h1>
                            <p className="text-xs text-slate-500">Project Dashboard</p>
                        </div>
                    </div>

                    {/* Header Actions */}
                    <div className="flex items-center gap-3">
                        <FileMenu />
                        <button
                            onClick={() => setIsDialogOpen(true)}
                            className="btn-primary"
                            data-testid="new-project-btn"
                        >
                            <Plus className="w-4 h-4" />
                            New Project
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Controls Row: Tabs + Search */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    {/* Segmented Control Tabs */}
                    <div className="segmented-control" data-testid="project-tabs">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={activeTab === 'active' ? 'active' : ''}
                            data-testid="tab-active"
                        >
                            <span className="flex items-center gap-2">
                                Active
                                <span className="badge badge-slate">{activeProjects.length}</span>
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('archived')}
                            className={activeTab === 'archived' ? 'active' : ''}
                            data-testid="tab-archived"
                        >
                            <span className="flex items-center gap-2">
                                <Archive className="w-3.5 h-3.5" />
                                Archived
                                <span className="badge badge-slate">{archivedProjects.length}</span>
                            </span>
                        </button>
                    </div>

                    {/* Search Bar */}
                    <SearchBar
                        value={filters.searchQuery}
                        onChange={setSearchQuery}
                        sortBy={filters.sortBy}
                        sortOrder={filters.sortOrder}
                        onSortChange={handleSortChange}
                        onRescan={isTauri ? handleRescan : undefined}
                        totalCount={totalCount}
                        filteredCount={filteredProjects.length}
                    />
                </div>

                {/* Content Area */}
                {allProjectsRaw.length === 0 ? (
                    // Empty State
                    <div className="flex flex-col items-center justify-center py-24 text-center animate-slide-up">
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
                            <FolderOpen className="w-10 h-10 text-slate-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">No projects yet</h2>
                        <p className="text-slate-500 mb-8 max-w-md">
                            Create your first HVAC design project to get started with professional floor plans and equipment layouts.
                        </p>
                        <button
                            onClick={() => setIsDialogOpen(true)}
                            className="btn-primary text-base px-6 py-3"
                            data-testid="empty-state-create-btn"
                        >
                            <Plus className="w-5 h-5" />
                            Create New Project
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Recent Projects Section - only on Active tab */}
                        {activeTab === 'active' && recentProjects.length > 0 && (
                            <div className="mb-10 animate-slide-up">
                                <RecentProjectsSection projects={recentProjects} />
                            </div>
                        )}

                        {/* All Projects Section */}
                        <div className="animate-slide-up animation-delay-100">
                            <AllProjectsSection 
                                projects={filteredProjects} 
                                searchTerm={filters.searchQuery}
                                emptyMessage={activeTab === 'archived' ? 'No archived projects' : undefined}
                            />
                        </div>
                    </>
                )}
            </main>

            <NewProjectDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </div>
    );
}

export default DashboardPage;
