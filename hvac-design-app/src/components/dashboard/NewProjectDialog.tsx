'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProjectStore } from '@/stores/useProjectStore';
import { useRouter } from 'next/navigation';

interface NewProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const NewProjectDialog: React.FC<NewProjectDialogProps> = ({ open, onOpenChange }) => {
    const [projectName, setProjectName] = useState('');
    const [projectNumber, setProjectNumber] = useState('');
    const [clientName, setClientName] = useState('');
    const [location, setLocation] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { addProject } = useProjectStore();
    const router = useRouter();

    const isValid = projectName.trim().length > 0 && projectName.length <= 100;

    const handleCreate = async () => {
        if (!isValid) return;

        setIsLoading(true);

        try {
            const newProject = {
                id: crypto.randomUUID(),
                name: projectName.trim(),
                projectNumber: projectNumber.trim() || null,
                clientName: clientName.trim() || null,
                location: location.trim() || null,
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString(),
                entityCount: 0,
                thumbnailUrl: null,
                isArchived: false,
            };

            addProject(newProject);

            // Close dialog and reset
            onOpenChange(false);
            setProjectName('');
            setProjectNumber('');
            setClientName('');
            setLocation('');

            // Navigate to canvas
            router.push(`/canvas/${newProject.id}`);
        } catch (error) {
            console.error('Failed to create project:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && isValid && !isLoading) {
            handleCreate();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]" data-testid="new-project-dialog">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Enter the details for your new HVAC design project.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4" onKeyDown={handleKeyDown}>
                    <div className="grid gap-2">
                        <Label htmlFor="project-name">
                            Project Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="project-name"
                            name="projectName"
                            placeholder="Office Building HVAC"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            maxLength={100}
                            autoFocus
                            data-testid="project-name-input"
                        />
                        <p className="text-xs text-slate-500">{projectName.length}/100</p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="project-number">Project Number</Label>
                        <Input
                            id="project-number"
                            name="projectNumber"
                            placeholder="2025-001"
                            value={projectNumber}
                            onChange={(e) => setProjectNumber(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="client-name">Client Name</Label>
                        <Input
                            id="client-name"
                            name="clientName"
                            placeholder="Acme Corporation"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            name="location"
                            placeholder="123 Main St, Chicago, IL"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!isValid || isLoading}
                        data-testid="create-project-btn"
                    >
                        {isLoading ? 'Creating...' : 'Create Project'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
