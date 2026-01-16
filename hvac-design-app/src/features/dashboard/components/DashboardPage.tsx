'use client';

import { useState, useEffect, useRef } from 'react';
import { useProjectListStore, useRecentProjects } from '../store/projectListStore';
import { useFilteredProjects, SortOption } from '../hooks/useFilteredProjects';
import { SearchBar } from './SearchBar';
import { RecentProjectsSection } from './RecentProjectsSection';
import { AllProjectsSection } from './AllProjectsSection';
import { Plus, Archive } from 'lucide-react';
import { NewProjectDialog } from '@/components/dashboard/NewProjectDialog';
import { FileMenu } from '@/components/layout/FileMenu';
import { useAutoOpen } from '@/hooks/useAutoOpen';

/**
 * Dashboard Page - Main project management interface
 * Implements UJ-PM-002: Opening Existing Projects
 * 
 * Features:
 * - Recent Projects section (last 5 accessed)
 * - All Projects section with search
 * - Keyboard shortcuts (Ctrl+F for search)
 * - Auto-open last project (if enabled)
 */
export function DashboardPage() {
    const allProjectsRaw = useProjectListStore(state => state.projects);
    const activeProjects = allProjectsRaw.filter(p => !p.isArchived);
    const archivedProjects = allProjectsRaw.filter(p => p.isArchived);
    const recentProjects = useRecentProjects();
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
    const [sortBy, setSortBy] = useState<SortOption>('modified');
    
    const displayedProjects = activeTab === 'active' ? activeProjects : archivedProjects;
    const filteredProjects = useFilteredProjects(displayedProjects, searchTerm, sortBy);
    const _searchInputRef = useRef<HTMLInputElement>(null);
    const [focusedIndex, setFocusedIndex] = useState(0);

    // Auto-open last project if enabled
    useAutoOpen();

    useEffect(() => {
        void (async () => {
            await useProjectListStore.persist.rehydrate();
        })();
    }, []);

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
            if (e.key === 'Escape' && searchTerm) {
                setSearchTerm('');
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
    }, [searchTerm, focusedIndex, filteredProjects]);

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
                <div className="flex items-center gap-4 mb-6" data-testid="project-tabs">
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

                {/* Search Bar and Sort */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <SearchBar value={searchTerm} onChange={setSearchTerm} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label htmlFor="sort-select" className="text-sm text-slate-500 whitespace-nowrap">Sort by:</label>
                        <select
                            id="sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            data-testid="sort-select"
                        >
                            <option value="modified">Last Modified</option>
                            <option value="name">Name (A-Z)</option>
                            <option value="created">Date Created</option>
                        </select>
                    </div>
                </div>

                {/* Recent Projects Section - only show on Active tab */}
                {activeTab === 'active' && <RecentProjectsSection projects={recentProjects} />}

                {/* All Projects Section */}
                <AllProjectsSection 
                    projects={filteredProjects} 
                    searchTerm={searchTerm}
                    emptyMessage={activeTab === 'archived' ? 'No archived projects' : undefined}
                />
            </div>

            <NewProjectDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </div>
    );
}

export default DashboardPage;

