'use client';

import { useState } from 'react';
import styles from './NewProjectDialog.module.css';

interface ProjectData {
  projectName: string;
  projectNumber?: string;
  clientName?: string;
}

export interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (data: ProjectData) => void;
}

export function NewProjectDialog({ isOpen, onClose, onCreateProject }: NewProjectDialogProps) {
  const [projectName, setProjectName] = useState('');
  const [projectNumber, setProjectNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validate = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 1 || trimmed.length > 100) {
      return 'Project name must be between 1 and 100 characters.';
    }
    if (/[/\\?%*:|"<>]/.test(trimmed)) {
      return 'Project name contains invalid filename characters.';
    }
    return null;
  };

  const handleSubmit = () => {
    const validationError = validate(projectName);
    setError(validationError);
    if (!validationError) {
      onCreateProject({
        projectName: projectName.trim(),
        projectNumber: projectNumber.trim() || undefined,
        clientName: clientName.trim() || undefined,
      });
      setProjectName('');
      setProjectNumber('');
      setClientName('');
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.dialog}>
        <h3>Create New Project</h3>
        <label className={styles.label}>
          Project Name *
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={() => setError(validate(projectName))}
            placeholder="My HVAC Layout"
          />
        </label>
        {error && <div className={styles.error}>{error}</div>}
        <label className={styles.label}>
          Project Number
          <input
            value={projectNumber}
            onChange={(e) => setProjectNumber(e.target.value)}
            placeholder="Optional"
          />
        </label>
        <label className={styles.label}>
          Client Name
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Optional"
          />
        </label>
        <div className={styles.actions}>
          <button onClick={onClose} className={styles.secondary}>
            Cancel
          </button>
          <button onClick={handleSubmit} className={styles.primary}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewProjectDialog;
