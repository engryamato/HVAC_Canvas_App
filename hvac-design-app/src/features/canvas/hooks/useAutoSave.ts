'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { saveProject } from '@/core/persistence/projectIO';
import type { ProjectFile } from '@/core/schema';
import { useIsDirty, useProjectActions } from '@/core/store/project.store';
import { usePreferencesStore } from '@/core/store/preferencesStore';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave(project: ProjectFile | null, path: string | null) {
  const isDirty = useIsDirty();
  const { setDirty } = useProjectActions();
  const autoSaveInterval = usePreferencesStore((state) => state.autoSaveInterval);
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const performSave = useCallback(async () => {
    if (!project || !path) return;
    setStatus('saving');
    setError(null);

    const result = await saveProject(project, path);
    if (result.success) {
      setStatus('saved');
      setLastSavedAt(new Date());
      setDirty(false);
    } else {
      setStatus('error');
      setError(result.error ?? 'Failed to save project');
    }
  }, [path, project, setDirty]);

  useEffect(() => {
    clearTimer();
    if (isDirty) {
      timer.current = setTimeout(() => {
        void performSave();
      }, autoSaveInterval);
    }
    return clearTimer;
  }, [autoSaveInterval, isDirty, performSave]);

  return {
    status,
    lastSavedAt,
    error,
    triggerSave: performSave,
  } as const;
}
