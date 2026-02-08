
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'hvac_has_seen_folder_setup';

export function useFirstLaunch() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        // Check localStorage
        const hasSeen = localStorage.getItem(STORAGE_KEY);

        // Also check if folder permission already exists
        // Dynamic import to avoid circular dependencies if any, and keep this lightweight
        const { getDirectoryHandle } = await import(
          '@/core/persistence/directoryHandleManager'
        );
        const existingHandle = await getDirectoryHandle();

        // First launch if: hasn't seen modal AND no folder permission
        setIsFirstLaunch(hasSeen !== 'true' && !existingHandle);
      } catch (error) {
        console.error('Failed to check first launch status:', error);
        setIsFirstLaunch(false);
      } finally {
        setIsLoading(false);
      }
    };

    void check();
  }, []);

  const markAsCompleted = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsFirstLaunch(false);
  };

  return { isFirstLaunch, isLoading, markAsCompleted };
}
