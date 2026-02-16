import type { Project } from '@/types/project';

export interface ReportOptions {
    format?: 'pdf' | 'csv' | 'excel';
    groupBy?: 'category' | 'systemType' | 'zone' | 'flat';
    includeMetadata: boolean;
    includeCalculations: boolean;
    includeEntities: boolean;
    includeBOM: boolean;
    includePricing?: boolean;
    includeEngineeringNotes?: boolean;
    includeCanvasSnapshot?: boolean;
    templateId?: string;
    orientation: 'portrait' | 'landscape';
}

export interface ReportGeneratorService {
    generatePDF(project: Project, options: ReportOptions): Promise<Uint8Array>;
}

/**
 * PDF Report Generator Service
 * Implements UJ-PM-008: Export Project Report
 * 
 * Generates professional PDF reports from project data using jsPDF
 */
class ReportGenerator implements ReportGeneratorService {
    async generatePDF(project: Project, options: ReportOptions): Promise<Uint8Array> {
        // Dynamically import jsPDF (to avoid SSR issues with Next.js)
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        // Create PDF document
        const doc = new jsPDF({
            orientation: options.orientation,
            unit: 'mm',
            format: 'a4',
        });

        let yPosition = 20;

        // Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('HVAC Project Report', 105, yPosition, { align: 'center' });
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, yPosition, { align: 'center' });
        yPosition += 15;

        // Project Metadata Section
        if (options.includeMetadata) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Project Information', 20, yPosition);
            yPosition += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            const metadata = [
                ['Project Name:', project.projectName],
                ['Project Number:', project.projectNumber || 'N/A'],
                ['Client:', project.clientName || 'N/A'],
                ['Location:', project.location || 'N/A'],
                ['Created:', new Date(project.createdAt).toLocaleDateString()],
                ['Last Modified:', new Date(project.modifiedAt).toLocaleDateString()],
            ];

            autoTable(doc, {
                startY: yPosition,
                head: [],
                body: metadata,
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2 },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 40 },
                    1: { cellWidth: 'auto' },
                },
            });

            yPosition = (doc as any).lastAutoTable.finalY + 10;
        }

        // Scope & Site Conditions
        if (options.includeMetadata && project.scope) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Project Scope', 20, yPosition);
            yPosition += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            if (project.scope.projectType) {
                doc.text(`Type: ${project.scope.projectType}`, 20, yPosition);
                yPosition += 6;
            }

            if (project.scope.details && project.scope.details.length > 0) {
                doc.text('Details:', 20, yPosition);
                yPosition += 6;
                project.scope.details.forEach((detail) => {
                    doc.text(`• ${detail}`, 25, yPosition);
                    yPosition += 5;
                });
            }

            yPosition += 5;
        }

        // Site Conditions
        if (options.includeMetadata && project.siteConditions) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Site Conditions', 20, yPosition);
            yPosition += 8;

            const siteData = [
                ['Elevation:', project.siteConditions.elevation || 'N/A'],
                ['Outdoor Temperature:', project.siteConditions.outdoorTemp || 'N/A'],
                ['Indoor Temperature:', project.siteConditions.indoorTemp || 'N/A'],
                ['Wind Speed:', project.siteConditions.windSpeed || 'N/A'],
                ['Humidity:', project.siteConditions.humidity || 'N/A'],
                ['Local Codes:', project.siteConditions.localCodes || 'N/A'],
            ];

            autoTable(doc, {
                startY: yPosition,
                head: [],
                body: siteData,
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2 },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 50 },
                    1: { cellWidth: 'auto' },
                },
            });

            yPosition = (doc as any).lastAutoTable.finalY + 10;
        }

        // Bill of Materials (BOM)
        if (options.includeBOM && project.entities) {
            const entitiesState = project.entities;
            // Check if we need a new page
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Bill of Materials', 20, yPosition);
            yPosition += 8;

            const entities = entitiesState.allIds
                .map((id) => entitiesState.byId[id])
                .filter(Boolean);
            const bomData = entities.map((entity, index) => [
                (index + 1).toString(),
                entity.type || 'Unknown',
                entity.id,
                entity.properties?.model || 'N/A',
                '1', // Quantity (could be enhanced)
            ]);

            autoTable(doc, {
                startY: yPosition,
                head: [['#', 'Type', 'ID', 'Model', 'Qty']],
                body: bomData,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [66, 135, 245], textColor: 255 },
            });

            yPosition = (doc as any).lastAutoTable.finalY + 10;
        }

        // Entity Summary
        if (options.includeEntities && project.entities) {
            const entitiesState = project.entities;
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Entity Summary', 20, yPosition);
            yPosition += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total Entities: ${entitiesState.allIds.length}`, 20, yPosition);
            yPosition += 6;

            // Group by type
            const entityCounts: Record<string, number> = {};
            entitiesState.allIds.forEach(id => {
                const entity = entitiesState.byId[id];
                const type = entity.type || 'Unknown';
                entityCounts[type] = (entityCounts[type] || 0) + 1;
            });

            Object.entries(entityCounts).forEach(([type, count]) => {
                doc.text(`• ${type}: ${count}`, 25, yPosition);
                yPosition += 5;
            });
        }

        // Footer on last page
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(
                `Page ${i} of ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        // Return as Uint8Array
        const pdfOutput = doc.output('arraybuffer');
        return new Uint8Array(pdfOutput);
    }
}

export const reportGenerator = new ReportGenerator();
