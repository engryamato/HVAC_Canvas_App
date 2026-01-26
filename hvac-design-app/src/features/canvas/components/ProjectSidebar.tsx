import React, { useMemo } from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { useProjectStore } from '@/core/store/project.store';
import { cn } from '@/lib/utils';

interface ProjectSidebarProps {
    className?: string;
}

export function ProjectSidebar({ className }: ProjectSidebarProps) {
    const { projectDetails } = useProjectStore();

    if (!projectDetails) {
        return <div className={cn("w-64 bg-background border-r p-4", className)}>No Project Loaded</div>;
    }

    const { projectName, projectNumber, clientName, location, scope, siteConditions } = projectDetails;

    const normalizedScopeMaterials = useMemo(() => {
        const materials = scope?.materials ?? [];
        return materials
            .map((material: any) => {
                if (typeof material === 'string') {
                    return { type: material };
                }
                return material;
            })
            .filter((material: any) => Boolean(material?.type));
    }, [scope]);

    return (
        <div className={cn("w-64 bg-background border-r flex flex-col overflow-hidden", className)}>
            <div className="p-4 border-b">
                <h3 className="font-semibold truncate" title={projectName}>{projectName}</h3>
                <p className="text-sm text-muted-foreground truncate">{projectNumber || 'No Number'}</p>
            </div>

            <div className="flex-1 overflow-auto">
                <Accordion type="single" collapsible defaultValue="project-details" className="w-full">
                    <AccordionItem value="project-details">
                        <AccordionTrigger className="px-4">Project Details</AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-1">
                                <span className="text-muted-foreground">Client:</span>
                                <span>{clientName || '-'}</span>
                                <span className="text-muted-foreground">Location:</span>
                                <span>{location || '-'}</span>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="project-scope">
                        <AccordionTrigger className="px-4">Project Scope</AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 space-y-2 text-sm">
                            {scope ? (
                                <>
                                    <div className="font-medium">Scope</div>
                                    <ul className="list-disc list-inside pl-1 text-muted-foreground">
                                        {scope.details?.map((d: string) => <li key={d}>{d}</li>)}
                                    </ul>
                                    <div className="font-medium mt-2">Materials</div>
                                    <ul className="list-disc list-inside pl-1 text-muted-foreground">
                                        {normalizedScopeMaterials.map((m: any) => (
                                            <li key={m.type}>{m.type} {m.grade ? `(${m.grade})` : ''}</li>
                                        ))}
                                    </ul>
                                    <div className="font-medium mt-2">Type</div>
                                    <div className="text-muted-foreground pl-1">{scope.projectType}</div>
                                </>
                            ) : <div className="text-muted-foreground italic">No scope defined</div>}
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="site-conditions">
                        <AccordionTrigger className="px-4">Site Conditions</AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 space-y-2 text-sm">
                            {siteConditions ? (
                                <div className="grid grid-cols-2 gap-1">
                                    <span className="text-muted-foreground">Elevation:</span>
                                    <span>{siteConditions.elevation || '-'}</span>
                                    <span className="text-muted-foreground">Outdoor:</span>
                                    <span>{siteConditions.outdoorTemp || '-'}</span>
                                    <span className="text-muted-foreground">Indoor:</span>
                                    <span>{siteConditions.indoorTemp || '-'}</span>
                                    <span className="text-muted-foreground">Wind:</span>
                                    <span>{siteConditions.windSpeed || '-'}</span>
                                    <span className="text-muted-foreground">Humidity:</span>
                                    <span>{siteConditions.humidity || '-'}</span>
                                    <span className="text-muted-foreground">Local Codes:</span>
                                    <span className="truncate" title={siteConditions.localCodes}>{siteConditions.localCodes || '-'}</span>
                                </div>
                            ) : <div className="text-muted-foreground italic">No conditions</div>}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </div>
    );
}
