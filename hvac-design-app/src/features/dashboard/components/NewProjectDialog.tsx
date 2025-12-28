'use client';

import { useState } from 'react';
import { validateProjectName } from '@/utils';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const validation = validateProjectName(projectName);
    setError(validation.error);

    if (!validation.isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreateProject({
        projectName: projectName.trim(),
        projectNumber: projectNumber.trim() || undefined,
        clientName: clientName.trim() || undefined,
      });

      // Reset form state
      setProjectName('');
      setProjectNumber('');
      setClientName('');
      setError(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className={styles.dialog}>
        <h3 id="dialog-title">Create New Project</h3>
        <form onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="projectName">
            Project Name *
          </label>
          <input
            id="projectName"
            name="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={() => setError(validateProjectName(projectName).error)}
            placeholder="My HVAC Layout"
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'projectName-error' : undefined}
            autoFocus
            maxLength={100}
            disabled={isSubmitting}
            className={error ? styles.errorInput : ''}
          />
          {error && (
            <div id="projectName-error" className={styles.error} role="alert">
              ⚠️ {error}
            </div>
          )}
          <label className={styles.label} htmlFor="projectNumber">
            Project Number
          </label>
          <input
            id="projectNumber"
            name="projectNumber"
            value={projectNumber}
            onChange={(e) => setProjectNumber(e.target.value)}
            placeholder="Optional"
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.secondary}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primary}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewProjectDialog;
