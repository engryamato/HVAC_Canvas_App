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
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className={styles.dialog}>
        <h3 id="dialog-title">Create New Project</h3>
        <label className={styles.label} htmlFor="projectName">
          Project Name *
        </label>
        <input
          id="projectName"
          name="projectName"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          onBlur={() => setError(validate(projectName))}
          placeholder="My HVAC Layout"
          aria-required="true"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'projectName-error' : undefined}
        />
        {error && <div id="projectName-error" className={styles.error} role="alert">{error}</div>}
        <label className={styles.label} htmlFor="projectNumber">
          Project Number
        </label>
        <input
          id="projectNumber"
          name="projectNumber"
          value={projectNumber}
          onChange={(e) => setProjectNumber(e.target.value)}
          placeholder="Optional"
        />
        <label className={styles.label} htmlFor="clientName">
          Client Name
        </label>
        <input
          id="clientName"
          name="clientName"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Optional"
        />
        <div className={styles.actions}>
          <button type="button" onClick={onClose} className={styles.secondary}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className={styles.primary}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewProjectDialog;
