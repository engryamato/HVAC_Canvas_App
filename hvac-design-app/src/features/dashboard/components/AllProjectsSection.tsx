'use client';

import { ProjectGrid } from './ProjectGrid';
import type { ProjectListItem } from '../store/projectListStore';
import { Folder, Search as SearchIcon } from 'lucide-react';

interface AllProjectsSectionProps {
    projects: ProjectListItem[];
    searchTerm?: string;
    emptyMessage?: string;
}

/**
 * All Projects section - Modern Engineering Design 2025
 * Displays all projects with section header and empty states
 */
export function AllProjectsSection({ projects, searchTerm, emptyMessage }: AllProjectsSectionProps) {
    return (
        <section data-testid="all-projects">
            {/* Section Header */}
            <div className="flex items-center gap-2 mb-5">
                <h2 className="text-lg font-semibold text-slate-900">
                    All Projects
                </h2>
                <span className="text-xs font-medium text-slate-400">
                    {projects.length}
                </span>
            </div>

            {projects.length > 0 ? (
                <ProjectGrid projects={projects} />
            ) : (
                // Empty State
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white/50 rounded-2xl border border-dashed border-slate-200">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                        {searchTerm ? (
                            <SearchIcon className="w-7 h-7 text-slate-400" />
                        ) : (
                            <Folder className="w-7 h-7 text-slate-400" />
                        )}
                    </div>
                    <p className="text-slate-500 text-sm">
                        {searchTerm
                            ? `No projects match "${searchTerm}"`
                            : emptyMessage || 'No projects yet. Create your first project!'}
                    </p>
                </div>
            )}
        </section>
    );
}
