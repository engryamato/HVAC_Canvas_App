'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useProjectStore } from '@/stores/useProjectStore';
import { useProjectListStore, ProjectListItem } from '@/features/dashboard/store/projectListStore';

interface EditProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: ProjectListItem;
}

/**
 * Edit Project Dialog - UJ-PM-003: Edit Project Metadata
 * 
 * Allows editing of project details, scope, and site conditions.
 * Pre-populates form with existing project data.
 */
export const EditProjectDialog: React.FC<EditProjectDialogProps> = ({ open, onOpenChange, project }) => {
    // Project Details
    const [projectName, setProjectName] = useState('');
    const [projectNumber, setProjectNumber] = useState('');
    const [clientName, setClientName] = useState('');
    const [location, setLocation] = useState('');

    // Project Scope
    const [scopeHvac, setScopeHvac] = useState(true);
    const [projectType, setProjectType] = useState('Residential');

    // Materials
    const [matGalvanized, setMatGalvanized] = useState(false);
    const [gradeGalvanized, setGradeGalvanized] = useState('G-60');
    const [matStainless, setMatStainless] = useState(false);
    const [gradeStainless, setGradeStainless] = useState('304 S.S.');
    const [matAluminum, setMatAluminum] = useState(false);
    const [matPvc, setMatPvc] = useState(false);

    // Site Conditions
    const [elevation, setElevation] = useState('');
    const [outdoorTemp, setOutdoorTemp] = useState('');
    const [indoorTemp, setIndoorTemp] = useState('');
    const [windSpeed, setWindSpeed] = useState('');
    const [humidity, setHumidity] = useState('');
    const [localCodes, setLocalCodes] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const { updateProject: updateProjectStore } = useProjectStore();
    const updateProjectList = useProjectListStore((state) => state.updateProject);

    const isValid = projectName.trim().length > 0 && projectName.length <= 100;

    // Pre-populate form when project changes or dialog opens
    useEffect(() => {
        if (open && project) {
            setProjectName(project.projectName || '');
            setProjectNumber(project.projectNumber || '');
            setClientName(project.clientName || '');
            
            // Fetch full project data from sws.projectDetails for additional fields
            const projectStorageRaw = localStorage.getItem('sws.projectDetails');
            if (projectStorageRaw) {
                try {
                    const projectStorage = JSON.parse(projectStorageRaw);
                    const fullProject = projectStorage.state?.projects?.find(
                        (p: { id: string }) => p.id === project.projectId
                    );
                    
                    if (fullProject) {
                        setLocation(fullProject.location || '');
                        
                        // Scope
                        const scopeDetails = fullProject.scope?.details || [];
                        setScopeHvac(scopeDetails.includes('HVAC'));
                        setProjectType(fullProject.scope?.projectType || 'Residential');
                        
                        // Materials
                        const materials = fullProject.scope?.materials || [];
                        const galv = materials.find((m: { type: string }) => m.type === 'Galvanized Steel');
                        const stain = materials.find((m: { type: string }) => m.type === 'Stainless Steel');
                        const alum = materials.find((m: { type: string }) => m.type === 'Aluminum');
                        const pvc = materials.find((m: { type: string }) => m.type === 'PVC');
                        
                        setMatGalvanized(!!galv);
                        if (galv?.grade) {
                            setGradeGalvanized(galv.grade);
                        }
                        setMatStainless(!!stain);
                        if (stain?.grade) {
                            setGradeStainless(stain.grade);
                        }
                        setMatAluminum(!!alum);
                        setMatPvc(!!pvc);
                        
                        // Site Conditions
                        setElevation(fullProject.siteConditions?.elevation || '');
                        setOutdoorTemp(fullProject.siteConditions?.outdoorTemp || '');
                        setIndoorTemp(fullProject.siteConditions?.indoorTemp || '');
                        setWindSpeed(fullProject.siteConditions?.windSpeed || '');
                        setHumidity(fullProject.siteConditions?.humidity || '');
                        setLocalCodes(fullProject.siteConditions?.localCodes || '');
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            }
        }
    }, [open, project]);

    const handleSave = async () => {
        if (!isValid) {return;}

        setIsLoading(true);

        try {
            // Construct updated data
            const scopeDetails: string[] = [];
            if (scopeHvac) {
                scopeDetails.push('HVAC');
            }

            const materials = [];
            if (matGalvanized) {
                materials.push({ type: 'Galvanized Steel', grade: gradeGalvanized });
            }
            if (matStainless) {
                materials.push({ type: 'Stainless Steel', grade: gradeStainless });
            }
            if (matAluminum) {
                materials.push({ type: 'Aluminum' });
            }
            if (matPvc) {
                materials.push({ type: 'PVC' });
            }

            const updatedProject = {
                id: project.projectId,
                name: projectName.trim(),
                projectNumber: projectNumber.trim() || null,
                clientName: clientName.trim() || null,
                location: location.trim() || null,
                scope: {
                    details: scopeDetails,
                    materials: materials,
                    projectType: projectType
                },
                siteConditions: {
                    elevation: elevation.trim(),
                    outdoorTemp: outdoorTemp.trim(),
                    indoorTemp: indoorTemp.trim(),
                    windSpeed: windSpeed.trim(),
                    humidity: humidity.trim(),
                    localCodes: localCodes.trim()
                },
                modifiedAt: new Date().toISOString(),
            };

            // Update sws.projectDetails (full project data)
            updateProjectStore(project.projectId, updatedProject);

            // Update sws.projectIndex (list item)
            updateProjectList(project.projectId, {
                projectName: updatedProject.name,
                projectNumber: updatedProject.projectNumber || undefined,
                clientName: updatedProject.clientName || undefined,
                modifiedAt: updatedProject.modifiedAt,
            });

            // Manual persistence backup
            try {
                const existing = localStorage.getItem('sws.projectIndex');
                if (existing) {
                    const state = JSON.parse(existing).state;
                    state.projects = state.projects.map((p: ProjectListItem) =>
                        p.projectId === project.projectId
                            ? {
                                  ...p,
                                  projectName: updatedProject.name,
                                  projectNumber: updatedProject.projectNumber || undefined,
                                  clientName: updatedProject.clientName || undefined,
                                  modifiedAt: updatedProject.modifiedAt,
                              }
                            : p
                    );
                    localStorage.setItem('sws.projectIndex', JSON.stringify({ state, version: 0 }));
                }
            } catch (e) {
                // Manual save failed, store update should still work
            }

            onOpenChange(false);
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('[EditProjectDialog] Failed to update project:', error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && isValid && !isLoading) {
            handleSave();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="edit-project-dialog">
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                    <DialogDescription>
                        Update the details for your HVAC design project.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4" onKeyDown={handleKeyDown}>
                    <Accordion type="multiple" defaultValue={['item-1']} className="w-full">

                        {/* 1. Project Details */}
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Project Details</AccordionTrigger>
                            <AccordionContent>
                                <div className="grid gap-4 px-1 py-1">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-project-name">
                                            Project Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="edit-project-name"
                                            placeholder="Office Building HVAC"
                                            value={projectName}
                                            onChange={(e) => setProjectName(e.target.value)}
                                            maxLength={100}
                                            data-testid="edit-project-name-input"
                                        />
                                        <div className="flex justify-end">
                                            <span className={`text-xs ${projectName.length === 100 ? 'text-red-500' : 'text-slate-500'}`}>
                                                {projectName.length}/100
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-project-number">Project Number</Label>
                                            <Input
                                                id="edit-project-number"
                                                placeholder="2025-001"
                                                value={projectNumber}
                                                onChange={(e) => setProjectNumber(e.target.value)}
                                                data-testid="edit-project-number-input"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-client-name">Client Name</Label>
                                            <Input
                                                id="edit-client-name"
                                                placeholder="Acme Corporation"
                                                value={clientName}
                                                onChange={(e) => setClientName(e.target.value)}
                                                data-testid="edit-client-name-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-location">Location</Label>
                                        <Input
                                            id="edit-location"
                                            placeholder="123 Main St, Chicago, IL"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            data-testid="edit-location-input"
                                        />
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* 2. Project Scope */}
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Project Scope</AccordionTrigger>
                            <AccordionContent>
                                <div className="grid gap-4 px-1 py-1">
                                    <div className="grid gap-2">
                                        <Label className="mb-1">Scope</Label>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="edit-scope-hvac" checked={scopeHvac} onCheckedChange={(c) => setScopeHvac(!!c)} />
                                            <Label htmlFor="edit-scope-hvac" className="font-normal">HVAC</Label>
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label className="mb-1">Material</Label>
                                        <div className="grid gap-2 pl-2">
                                            {/* Galvanized Steel */}
                                            <div className="flex items-center gap-2">
                                                <Checkbox id="edit-mat-galvanized" checked={matGalvanized} onCheckedChange={(c) => setMatGalvanized(!!c)} />
                                                <Label htmlFor="edit-mat-galvanized" className="w-[120px] font-normal">Galvanized Steel</Label>
                                                {matGalvanized && (
                                                    <div className="w-[100px]">
                                                        <Select value={gradeGalvanized} onValueChange={setGradeGalvanized}>
                                                            <SelectTrigger aria-label="Galvanized Steel Grade" className="h-8">
                                                                <SelectValue placeholder="Grade" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="G-60">G-60</SelectItem>
                                                                <SelectItem value="G-90">G-90</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Stainless Steel */}
                                            <div className="flex items-center gap-2">
                                                <Checkbox id="edit-mat-stainless" checked={matStainless} onCheckedChange={(c) => setMatStainless(!!c)} />
                                                <Label htmlFor="edit-mat-stainless" className="w-[120px] font-normal">Stainless Steel</Label>
                                                {matStainless && (
                                                    <div className="w-[100px]">
                                                        <Select value={gradeStainless} onValueChange={setGradeStainless}>
                                                            <SelectTrigger aria-label="Stainless Steel Grade" className="h-8">
                                                                <SelectValue placeholder="Grade" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="304 S.S.">304 S.S.</SelectItem>
                                                                <SelectItem value="316 S.S.">316 S.S.</SelectItem>
                                                                <SelectItem value="409 S.S.">409 S.S.</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Aluminum */}
                                            <div className="flex items-center gap-2">
                                                <Checkbox id="edit-mat-aluminum" checked={matAluminum} onCheckedChange={(c) => setMatAluminum(!!c)} />
                                                <Label htmlFor="edit-mat-aluminum" className="font-normal">Aluminum</Label>
                                            </div>

                                            {/* PVC */}
                                            <div className="flex items-center gap-2">
                                                <Checkbox id="edit-mat-pvc" checked={matPvc} onCheckedChange={(c) => setMatPvc(!!c)} />
                                                <Label htmlFor="edit-mat-pvc" className="font-normal">PVC</Label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-project-type">Project Type</Label>
                                        <Select value={projectType} onValueChange={setProjectType}>
                                            <SelectTrigger id="edit-project-type" aria-label="Project Type">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Residential">Residential</SelectItem>
                                                <SelectItem value="Commercial">Commercial</SelectItem>
                                                <SelectItem value="Industrial">Industrial</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* 3. Site Conditions */}
                        <AccordionItem value="item-3">
                            <AccordionTrigger>Site Conditions</AccordionTrigger>
                            <AccordionContent>
                                <div className="grid gap-4 px-1 py-1">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-elevation">Elevation (ft)</Label>
                                            <Input id="edit-elevation" value={elevation} onChange={(e) => setElevation(e.target.value)} placeholder="0" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-wind-speed">Wind Speed (mph)</Label>
                                            <Input id="edit-wind-speed" value={windSpeed} onChange={(e) => setWindSpeed(e.target.value)} placeholder="0" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-outdoor-temp">Outdoor Temp (°F)</Label>
                                            <Input id="edit-outdoor-temp" value={outdoorTemp} onChange={(e) => setOutdoorTemp(e.target.value)} placeholder="95" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-indoor-temp">Indoor Temp (°F)</Label>
                                            <Input id="edit-indoor-temp" value={indoorTemp} onChange={(e) => setIndoorTemp(e.target.value)} placeholder="75" />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-humidity">Humidity (%)</Label>
                                        <Input id="edit-humidity" value={humidity} onChange={(e) => setHumidity(e.target.value)} placeholder="50" />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-local-codes">Local Codes</Label>
                                        <Input id="edit-local-codes" value={localCodes} onChange={(e) => setLocalCodes(e.target.value)} placeholder="IMC 2021" />
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading} data-testid="edit-cancel-btn">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!isValid || isLoading}
                        data-testid="edit-save-btn"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
