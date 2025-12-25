'use client';

import { useState } from 'react';
import styles from './NewProjectDialog.module.css';

interface NewProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function NewProjectDialog({ open, onClose, onCreate }: NewProjectDialogProps) {
  const [name, setName] = useState('');
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
    const validationError = validate(name);
    setError(validationError);
    if (!validationError) {
      onCreate(name.trim());
      setName('');
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.dialog}>
        <h3>Create New Project</h3>
        <label className={styles.label}>
          Project Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setError(validate(name))}
            placeholder="My HVAC Layout"
          />
        </label>
        {error && <div className={styles.error}>{error}</div>}
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
