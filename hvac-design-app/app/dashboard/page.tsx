'use client';

import React, { useState } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { NewProjectDialog } from '@/components/dashboard/NewProjectDialog';
import { Plus, FolderOpen } from 'lucide-react';

export default function DashboardPage() {
    const { projects } = useProjectStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const activeProjects = projects.filter((p) => !p.isArchived);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Project Dashboard</h1>
                        <p className="text-sm text-slate-500">Manage your HVAC design projects</p>
                    </div>
                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        size="lg"
                        className="gap-2"
                        data-testid="new-project-btn"
                    >
                        <Plus className="w-4 h-4" />
                        New Project
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8" data-testid="dashboard-page">
                {activeProjects.length === 0 ? (
                    // Empty State
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
                        <div className="rounded-full bg-blue-100 p-6 mb-6">
                            <FolderOpen className="w-16 h-16 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-900 mb-2">No Projects Yet</h2>
                        <p className="text-slate-600 mb-8 text-center max-w-md">
                            Create your first HVAC design project to get started with professional system layouts.
                        </p>
                        <Button
                            onClick={() => setIsDialogOpen(true)}
                            size="lg"
                            className="gap-2"
                            data-testid="empty-state-create-btn"
                        >
                            <Plus className="w-4 h-4" />
                            Create Your First Project
                        </Button>
                    </div>
                ) : (
                    // Project Grid
                    <div>
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-slate-900">
                                All Projects ({activeProjects.length})
                            </h2>
                        </div>
                        <div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            data-testid="project-grid"
                        >
                            {activeProjects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* New Project Dialog */}
            <NewProjectDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </div>
    );
}
