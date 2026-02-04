import { useState } from 'react';
import { requestDirectoryAccess } from '@/core/persistence/directoryHandleManager';
import { resetAdapter } from '@/core/persistence/factory';
import { useProjectListStore } from '@/features/dashboard/store/projectListStore';

interface ConnectFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export function ConnectFolderDialog({ isOpen, onClose, onConnected }: ConnectFolderDialogProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshProjects = useProjectListStore((state) => state.refreshProjects);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const dirHandle = await requestDirectoryAccess();
      
      if (!dirHandle) {
        setError('Folder access was denied or cancelled.');
        setIsConnecting(false);
        return;
      }

      // Verify it's the correct folder by checking for expected structure
      // (Optional: could check for existence of project folders)
      
      // Reset adapter to force recreation with new directory handle
      resetAdapter();

      // Refresh projects list
      await refreshProjects();
      
      // Notify parent
      onConnected?.();

      // Close dialog
      onClose();
    } catch (err) {
      console.error('Failed to connect folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect folder');
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Connect Local Folder
        </h2>
        
        <div className="space-y-4 mb-6">
          <p className="text-gray-600 dark:text-gray-300">
            Connect to your local <strong>SizeWise/Projects</strong> folder to sync projects
            between the web app and desktop app.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Expected Location:
            </h3>
            <code className="text-sm text-blue-800 dark:text-blue-200">
              Documents/SizeWise/Projects
            </code>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> You will need to grant permission to access this folder.
              This only works in Chrome/Edge browsers.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isConnecting}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isConnecting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Connecting...
              </>
            ) : (
              'Connect Folder'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
