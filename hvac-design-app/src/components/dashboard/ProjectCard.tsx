'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import type { Project } from '@/stores/useProjectStore';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';

interface ProjectCardProps {
    project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
    const router = useRouter();

    const handleClick = () => {
        router.push(`/canvas/${project.id}`);
    };

    const formattedDate = new Date(project.modifiedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <Card
            className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-blue-500/50"
            onClick={handleClick}
            data-testid="project-card"
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {project.name}
                        </h3>
                        {project.projectNumber && (
                            <p className="text-sm text-slate-500 mt-1">#{project.projectNumber}</p>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {project.clientName && (
                        <p className="text-sm text-slate-600">
                            <span className="font-medium">Client:</span> {project.clientName}
                        </p>
                    )}
                    {project.location && (
                        <p className="text-sm text-slate-600">
                            <span className="font-medium">Location:</span> {project.location}
                        </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-4 pt-4 border-t">
                        <Clock className="w-3 h-3" />
                        <span>Modified {formattedDate}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
