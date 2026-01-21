'use client';

import { ProjectGrid } from './ProjectGrid';
import type { ProjectListItem } from '../store/projectListStore';
import { Clock } from 'lucide-react';

interface RecentProjectsSectionProps {
    projects: ProjectListItem[];
}

/**
 * Recent Projects section - Modern Engineering Design 2025
 * Displays last 10 accessed projects with modern styling
 */
export function RecentProjectsSection({ projects }: RecentProjectsSectionProps) {
    if (projects.length === 0) {
        return null;
    }

    return (
        <section data-testid="recent-projects">
            {/* Section Header */}
            <div className="flex items-center gap-2 mb-5">
                <Clock className="w-4 h-4 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-900">
                    Recent Projects
                </h2>
                <span className="text-xs font-medium text-slate-400">
                    {projects.length}
                </span>
            </div>
            <ProjectGrid projects={projects} />
        </section>
    );
}
