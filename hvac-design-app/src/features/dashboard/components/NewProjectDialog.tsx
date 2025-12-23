'use client';

import React, { useState, useCallback } from 'react';
import styles from './NewProjectDialog.module.css';

interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: {
    projectName: string;
    projectNumber?: string;
    clientName?: string;
  }) => void;
}

export function NewProjectDialog({ isOpen, onClose, onCreateProject }: NewProjectDialogProps) {
  const [projectName, setProjectName] = useState('');
  const [projectNumber, setProjectNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmedName = projectName.trim();
      if (!trimmedName) {
        setError('Project name is required');
        return;
      }

      if (trimmedName.length > 100) {
        setError('Project name must be 100 characters or less');
        return;
      }

      onCreateProject({
        projectName: trimmedName,
        projectNumber: projectNumber.trim() || undefined,
        clientName: clientName.trim() || undefined,
      });

      // Reset form
      setProjectName('');
      setProjectNumber('');
      setClientName('');
      setError(null);
    },
    [projectName, projectNumber, clientName, onCreateProject]
  );

  const handleClose = useCallback(() => {
    setProjectName('');
    setProjectNumber('');
    setClientName('');
    setError(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Create New Project</h2>
          <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="projectName">Project Name *</label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              autoFocus
              maxLength={100}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="projectNumber">Project Number</label>
            <input
              id="projectNumber"
              type="text"
              value={projectNumber}
              onChange={(e) => setProjectNumber(e.target.value)}
              placeholder="e.g., HVAC-2024-001"
              maxLength={50}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="clientName">Client Name</label>
            <input
              id="clientName"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
              maxLength={100}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className={styles.createButton}>
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewProjectDialog;
