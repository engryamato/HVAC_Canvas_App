'use client';

import { ProjectGrid } from './ProjectGrid';
import type { ProjectListItem } from '../store/projectListStore';

interface RecentProjectsSectionProps {
    projects: ProjectListItem[];
}

/**
 * Recent Projects section - displays last 10 accessed projects
 * Implements UJ-PM-002 Step 1: Recent Projects display
 */
export function RecentProjectsSection({ projects }: RecentProjectsSectionProps) {
    if (projects.length === 0) {
        return null; // Don't show section if no recent projects
    }

    return (
        <section data-testid="recent-projects" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
                Recent Projects
            </h2>
            <ProjectGrid projects={projects} />
        </section>
    );
}
