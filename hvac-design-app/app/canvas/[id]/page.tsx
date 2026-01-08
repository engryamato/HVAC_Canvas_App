'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/stores/useProjectStore';
import { Header } from '@/components/layout/Header';
import { Toolbar } from '@/components/layout/Toolbar';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { StatusBar } from '@/components/layout/StatusBar';

export default function CanvasPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const [isMounted, setIsMounted] = React.useState(false);
    const project = useProjectStore((state) => state.projects.find((p) => p.id === projectId));
    const projectsCount = useProjectStore((state) => state.projects.length);

    useEffect(() => {
        setIsMounted(true);
        console.log(`CanvasPage mounted. ProjectID: ${projectId}, Found: ${!!project}, TotalProjects: ${projectsCount}`);
    }, [projectId, project, projectsCount]);

    // Keyboard shortcut: Ctrl+Shift+D to go back to Dashboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && (e.key === 'd' || e.key === 'D' || e.code === 'KeyD')) {
                e.preventDefault();
                router.push('/dashboard');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    if (!isMounted) return <div className="h-screen w-screen bg-slate-50" />;

    // Redirect if project not found
    if (!project) {
        console.log('Project not found, rendering error state');
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Project Not Found</h1>
                    <p className="text-slate-600 mb-4">The project you're looking for doesn't exist.</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden">
            {/* Header */}
            <Header projectName={project.name} />

            {/* Toolbar */}
            <Toolbar />

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <LeftSidebar />

                {/* Canvas Area */}
                <main
                    className="flex-1 bg-slate-100 relative overflow-hidden"
                    data-testid="canvas-area"
                >
                    {/* Grid Pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <svg width="100%" height="100%">
                            <defs>
                                <pattern
                                    id="grid"
                                    width="40"
                                    height="40"
                                    patternUnits="userSpaceOnUse"
                                >
                                    <path
                                        d="M 40 0 L 0 0 0 40"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1"
                                    />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                    </div>

                    {/* Center Content */}
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        <div className="text-center">
                            <p className="text-lg">Canvas Area</p>
                            <p className="text-sm mt-2">Start designing your HVAC system</p>
                        </div>
                    </div>
                </main>

                {/* Right Sidebar */}
                <RightSidebar />
            </div>

            {/* Status Bar */}
            <StatusBar entityCount={0} />
        </div>
    );
}
