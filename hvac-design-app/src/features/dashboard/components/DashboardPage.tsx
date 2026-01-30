'use client';

import { useState, useEffect } from 'react';
import { useProjectListStore, useRecentProjects } from '../store/projectListStore';
import { useProjectFilters } from '../hooks/useProjectFilters';
import { SearchBar } from './SearchBar';
import { RecentProjectsSection } from './RecentProjectsSection';
import { AllProjectsSection } from './AllProjectsSection';
import { Plus, Archive, FolderOpen } from 'lucide-react';
import { NewProjectDialog } from './NewProjectDialog';
import { AppShell } from '@/components/layout/AppShell';
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
interface DashboardPageProps {
    initialNewProjectOpen?: boolean;
}

export function DashboardPage({ initialNewProjectOpen = false }: DashboardPageProps = {}) {
    const allProjectsRaw = useProjectListStore(state => state.projects);
    const activeProjects = allProjectsRaw.filter(p => !p.isArchived);
    const archivedProjects = allProjectsRaw.filter(p => p.isArchived);
    const recentProjects = useRecentProjects();
    const scanProjectsFromDisk = useProjectListStore(state => state.scanProjectsFromDisk);
    const [isDialogOpen, setIsDialogOpen] = useState(initialNewProjectOpen);
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
        if (!isTauri) {
            return;
        }
        await scanProjectsFromDisk();
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
        <AppShell 
            showBreadcrumb={true}
            rightActions={
                <button
                    onClick={() => setIsDialogOpen(true)}
                    className="btn-primary py-1.5"
                    data-testid="new-project-btn"
                >
                    <Plus className="w-4 h-4" />
                    New Project
                </button>
            }
        >
            <div className="flex-1 overflow-y-auto" data-testid="dashboard-page">
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
        </AppShell>
    );
}

export default DashboardPage;
