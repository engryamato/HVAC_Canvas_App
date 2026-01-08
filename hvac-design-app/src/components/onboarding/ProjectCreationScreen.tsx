'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type ProjectType = 'template' | 'blank';
type UnitSystem = 'imperial' | 'metric';

export const ProjectCreationScreen: React.FC = () => {
    const router = useRouter();
    const [projectType, setProjectType] = useState<ProjectType>('template');
    const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
    const [projectName, setProjectName] = useState('My First HVAC Project');

    const handleCreate = () => {
        // Here we would typically call a service to create the project
        // For now, we simulate creation and navigate
        if (!projectName) {return;}
        router.push('/canvas');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Your First Project</h1>
                    <p className="text-slate-500">Configure your workspace to get started</p>
                </div>

                <Card className="shadow-xl">
                    <CardContent className="p-8 space-y-8">

                        {/* Project Type Selection */}
                        <div className="space-y-4">
                            <Label className="text-base">Start with</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div
                                    className={cn(
                                        "cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-slate-50",
                                        projectType === 'template' ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600" : "border-slate-200"
                                    )}
                                    onClick={() => setProjectType('template')}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                                        </div>
                                        <span className="font-semibold text-slate-900">Recommended Template</span>
                                    </div>
                                    <p className="text-xs text-slate-500 pl-[3.25rem]">
                                        Pre-configured with standard layers, symbols, and settings. Best for new users.
                                    </p>
                                </div>

                                <div
                                    className={cn(
                                        "cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-slate-50",
                                        projectType === 'blank' ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600" : "border-slate-200"
                                    )}
                                    onClick={() => setProjectType('blank')}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                        </div>
                                        <span className="font-semibold text-slate-900">Blank Canvas</span>
                                    </div>
                                    <p className="text-xs text-slate-500 pl-[3.25rem]">
                                        Start from scratch. Fully customizable settings. Best for advanced users.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Project Details */}
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="project-name">Project Name</Label>
                                <Input
                                    id="project-name"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="Enter project name"
                                    className="h-11"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label>Units System</Label>
                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="units"
                                            checked={unitSystem === 'imperial'}
                                            onChange={() => setUnitSystem('imperial')}
                                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-700">Imperial (IP)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="units"
                                            checked={unitSystem === 'metric'}
                                            onChange={() => setUnitSystem('metric')}
                                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-700">Metric (SI)</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 text-base shadow-lg shadow-blue-200"
                            onClick={handleCreate}
                            disabled={!projectName}
                        >
                            Create Project
                        </Button>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
