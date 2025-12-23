'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useEntityStore } from '@/core/store/entityStore';
import { useProjectStore } from '@/core/store/project.store';
import { useViewportStore } from '../store/viewportStore';
import {
  exportProjectAsJson,
  downloadFile,
  downloadRoomsCsv,
  downloadDuctsCsv,
  downloadEquipmentCsv,
  downloadBomCsv,
  printProjectAsPdf,
  downloadPdfHtml,
} from '@/features/export';
import { createEmptyProjectFile, type ProjectFile } from '@/core/schema/project-file.schema';
import styles from './ExportMenu.module.css';

interface ExportMenuProps {
  className?: string;
}

export function ExportMenu({ className = '' }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const projectDetails = useProjectStore((state) => state.projectDetails);
  const entities = useEntityStore((state) => ({ byId: state.byId, allIds: state.allIds }));
  const viewport = useViewportStore((state) => ({
    panX: state.panX,
    panY: state.panY,
    zoom: state.zoom,
  }));

  // Build project file from current state
  const getProjectFile = useCallback((): ProjectFile | null => {
    if (!projectDetails) {return null;}

    return {
      ...createEmptyProjectFile(projectDetails.projectId, projectDetails.projectName),
      projectId: projectDetails.projectId,
      projectName: projectDetails.projectName,
      projectNumber: projectDetails.projectNumber,
      clientName: projectDetails.clientName,
      createdAt: projectDetails.createdAt,
      modifiedAt: new Date().toISOString(),
      entities,
      viewportState: viewport,
    };
  }, [projectDetails, entities, viewport]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleExportJson = useCallback(() => {
    const project = getProjectFile();
    if (!project) {return;}

    const result = exportProjectAsJson(project);
    if (result.success && result.data && result.filename) {
      downloadFile(result.data, result.filename, 'application/json');
    }
    setIsOpen(false);
  }, [getProjectFile]);

  const handleExportRoomsCsv = useCallback(() => {
    const project = getProjectFile();
    if (!project) {return;}

    downloadRoomsCsv(entities, project.projectName);
    setIsOpen(false);
  }, [getProjectFile, entities]);

  const handleExportDuctsCsv = useCallback(() => {
    const project = getProjectFile();
    if (!project) {return;}

    downloadDuctsCsv(entities, project.projectName);
    setIsOpen(false);
  }, [getProjectFile, entities]);

  const handleExportEquipmentCsv = useCallback(() => {
    const project = getProjectFile();
    if (!project) {return;}

    downloadEquipmentCsv(entities, project.projectName);
    setIsOpen(false);
  }, [getProjectFile, entities]);

  const handleExportBomCsv = useCallback(() => {
    const project = getProjectFile();
    if (!project) {return;}

    downloadBomCsv(entities, project.projectName);
    setIsOpen(false);
  }, [getProjectFile, entities]);

  const handlePrintPdf = useCallback(() => {
    const project = getProjectFile();
    if (!project) {return;}

    printProjectAsPdf(project);
    setIsOpen(false);
  }, [getProjectFile]);

  const handleDownloadHtml = useCallback(() => {
    const project = getProjectFile();
    if (!project) {return;}

    downloadPdfHtml(project);
    setIsOpen(false);
  }, [getProjectFile]);

  return (
    <div className={`${styles.container} ${className}`} ref={menuRef}>
      <button
        className={styles.exportButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Export
        <span className={styles.arrow}>&#9662;</span>
      </button>

      {isOpen && (
        <div className={styles.menu} role="menu">
          <div className={styles.menuSection}>
            <span className={styles.sectionLabel}>Project</span>
            <button className={styles.menuItem} onClick={handleExportJson} role="menuitem">
              Export as JSON
            </button>
          </div>

          <div className={styles.menuDivider} />

          <div className={styles.menuSection}>
            <span className={styles.sectionLabel}>Schedules (CSV)</span>
            <button className={styles.menuItem} onClick={handleExportRoomsCsv} role="menuitem">
              Room Schedule
            </button>
            <button className={styles.menuItem} onClick={handleExportDuctsCsv} role="menuitem">
              Duct Schedule
            </button>
            <button className={styles.menuItem} onClick={handleExportEquipmentCsv} role="menuitem">
              Equipment Schedule
            </button>
            <button className={styles.menuItem} onClick={handleExportBomCsv} role="menuitem">
              Bill of Materials
            </button>
          </div>

          <div className={styles.menuDivider} />

          <div className={styles.menuSection}>
            <span className={styles.sectionLabel}>Report</span>
            <button className={styles.menuItem} onClick={handlePrintPdf} role="menuitem">
              Print / Save as PDF
            </button>
            <button className={styles.menuItem} onClick={handleDownloadHtml} role="menuitem">
              Download as HTML
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExportMenu;
