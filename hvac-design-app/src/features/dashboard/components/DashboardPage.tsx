'use client';

import { useState, useEffect, useRef } from 'react';
import { useProjectListStore, useRecentProjects } from '../store/projectListStore';
import { useProjectFilters } from '../hooks/useProjectFilters';
import { SearchBar } from './SearchBar';
import { RecentProjectsSection } from './RecentProjectsSection';
import { AllProjectsSection } from './AllProjectsSection';
import { Plus, Archive } from 'lucide-react';
import { NewProjectDialog } from '@/components/dashboard/NewProjectDialog';
import { FileMenu } from '@/components/layout/FileMenu';
import { useAutoOpen } from '@/hooks/useAutoOpen';
import { useAppStateStore } from '@/stores/useAppStateStore';
import { useSearchParams } from 'next/navigation';

/**
 * Dashboard Page - Main project management interface
 * Implements UJ-PM-002: Opening Existing Projects
 * Implements UJ-PM-007: Search & Filter Projects
 * Implements UJ-PM-005: Archive and restore projects
 * 
 * Features:
 * - Recent Projects section (last 5 accessed)
 * - All Projects section with search
 * - Keyboard shortcuts (Ctrl+F for search)
 * - Auto-open last project (if enabled)
 * - Search, filter, and sort functionality
 * - Folder rescanning (Tauri mode)
 * - URL-based view state (?view=active or ?view=archived)
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
    const _searchInputRef = useRef<HTMLInputElement>(null);
    const [focusedIndex, setFocusedIndex] = useState(0);
    const isTauri = useAppStateStore((state) => state.isTauri);

    // Sync state with URL and handle "Return to Dashboard" logic
    useEffect(() => {
        if (viewParam === 'archived') {
            setActiveTab('archived');
        } else {
            // Default to 'active' if param is 'active' OR missing/null (e.g. root /dashboard)
            setActiveTab('active');
        }
    }, [viewParam]);

    // Use new filtering hook
    const displayedProjects = activeTab === 'active' ? activeProjects : archivedProjects;
    const {
        filteredProjects,
        totalCount,
        filters,
        setSearchQuery,
        setSortBy,
        setSortOrder,
    } = useProjectFilters(displayedProjects);

    // Auto-open last project if enabled
    useAutoOpen();

    useEffect(() => {
        void (async () => {
            await useProjectListStore.persist.rehydrate();
            
            // Scan projects from disk in Tauri mode
            if (isTauri) {
                await scanProjectsFromDisk();
            }
        })();
    }, [isTauri, scanProjectsFromDisk]);

    // Handle rescan (Tauri only)
    const handleRescan = async () => {
        if (!isTauri) {return;}
        await scanProjectsFromDisk();
    };

    // Handle opening project from file (Tauri only)
    const handleOpenFromFile = async () => {
        if (!isTauri) {return;}

        try {
            const { TauriFileSystem } = await import('@/core/persistence/TauriFileSystem');
            const { loadProject } = await import('@/core/persistence/projectIO');
            const addProjectToList = useProjectListStore.getState().addProject;

            // Show native open dialog
            const filePath = await TauriFileSystem.openFileDialog();
            
            if (!filePath) {
                // User cancelled
                return;
            }

            // Load project from file
            const result = await loadProject(filePath);
            
            if (!result.success || !result.project) {
                alert(`Failed to open project: ${result.error || 'Unknown error'}`);
                return;
            }

            // Add to project list if not already there
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

            // Navigate to canvas
            window.location.href = `/canvas/${result.project.projectId}`;
        } catch (error) {
            console.error('[DashboardPage] Failed to open project:', error);
            alert('Failed to open project. Please check the file and try again.');
        }
    };

    // Handle sort change from SearchBar
    const handleSortChange = (sortBy: 'name' | 'date', sortOrder: 'asc' | 'desc') => {
        setSortBy(sortBy);
        setSortOrder(sortOrder);
    };

    // Keyboard shortcuts (UJ-PM-002: Step 7)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+F or Cmd+F: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                // Find the search input nested in SearchBar
                const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
                searchInput?.focus();
                return;
            }

            // Escape: Clear search
            if (e.key === 'Escape' && filters.searchQuery) {
                setSearchQuery('');
                return;
            }

            // Arrow key navigation
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

            // Enter: Open focused project
            if (e.key === 'Enter' && filteredProjects[focusedIndex]) {
                const project = filteredProjects[focusedIndex];
                window.location.href = `/canvas/${project.projectId}`;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filters.searchQuery, focusedIndex, filteredProjects, setSearchQuery]);

    // Empty state (only show when NO projects exist at all)
    if (allProjectsRaw.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" data-testid="dashboard-page">
                {/* Header */}
                <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                    <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Project Dashboard</h1>
                            <p className="text-sm text-slate-500">Manage your HVAC design projects</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <FileMenu />
                            {isTauri && (
                                <button
                                    onClick={handleOpenFromFile}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                                    data-testid="open-project-btn"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                                    </svg>
                                    Open Project...
                                </button>
                            )}
                            <button
                                onClick={() => setIsDialogOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                data-testid="new-project-btn"
                            >
                                <Plus className="w-4 h-4" />
                                New Project
                            </button>
                        </div>
                    </div>
                </header>
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>No projects yet</h1>
                    <p style={{ color: '#666', marginBottom: '24px' }}>
                        Create your first project to get started!
                    </p>
                    <button
                        onClick={() => setIsDialogOpen(true)}
                        style={{
                            padding: '12px 24px',
                            fontSize: '16px',
                            background: '#0070f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                        data-testid="empty-state-create-btn"
                    >
                        Create New Project
                    </button>
                </div>
                <NewProjectDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" data-testid="dashboard-page">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Project Dashboard</h1>
                        <p className="text-sm text-slate-500">Manage your HVAC design projects</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <FileMenu />
                        <button
                            onClick={() => setIsDialogOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            data-testid="new-project-btn"
                        >
                            <Plus className="w-4 h-4" />
                            New Project
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
                {/* Tab Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }} data-testid="project-tabs">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === 'active'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                        data-testid="tab-active"
                    >
                        Active
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                            activeTab === 'active' ? 'bg-blue-200' : 'bg-slate-200'
                        }`}>
                            {activeProjects.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('archived')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === 'archived'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                        data-testid="tab-archived"
                    >
                        <Archive className="w-4 h-4" />
                        Archived
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                            activeTab === 'archived' ? 'bg-blue-200' : 'bg-slate-200'
                        }`}>
                            {archivedProjects.length}
                        </span>
                    </button>
                </div>

                {/* Search Bar with Sort and Rescan */}
                <div style={{ marginBottom: '32px' }}>
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

                {/* Recent Projects Section - only show on Active tab */}
                {activeTab === 'active' && <RecentProjectsSection projects={recentProjects} />}

                {/* All Projects Section */}
                <AllProjectsSection 
                    projects={filteredProjects} 
                    searchTerm={filters.searchQuery}
                    emptyMessage={activeTab === 'archived' ? 'No archived projects' : undefined}
                />
            </div>

            <NewProjectDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </div>
    );
}

export default DashboardPage;
