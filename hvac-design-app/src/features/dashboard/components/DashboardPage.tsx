'use client';

import { useState, useEffect, useRef } from 'react';
import { useProjectListStore, useRecentProjects } from '../store/projectListStore';
import { useFilteredProjects } from '../hooks/useFilteredProjects';
import { SearchBar } from './SearchBar';
import { RecentProjectsSection } from './RecentProjectsSection';
import { AllProjectsSection } from './AllProjectsSection';
import { Plus, FolderOpen } from 'lucide-react';
import { NewProjectDialog } from './NewProjectDialog';
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
    const allProjects = useProjectListStore(state => state.projects.filter(p => !p.isArchived));
    const recentProjects = useRecentProjects();
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const filteredProjects = useFilteredProjects(allProjects, searchTerm);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [focusedIndex, setFocusedIndex] = useState(0);

    // Auto-open last project if enabled
    useAutoOpen();

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

    // Empty state
    if (allProjects.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
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
                <NewProjectDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
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
                {/* Search Bar */}
                <div style={{ marginBottom: '32px' }}>
                    <SearchBar value={searchTerm} onChange={setSearchTerm} />
                </div>

                {/* Recent Projects Section */}
                <RecentProjectsSection projects={recentProjects} />

                {/* All Projects Section */}
                <AllProjectsSection projects={filteredProjects} searchTerm={searchTerm} />
            </div>

            <NewProjectDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
        </div>
    );
}

export default DashboardPage;

