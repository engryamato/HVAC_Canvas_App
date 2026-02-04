'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HardDrive, CheckCircle, AlertCircle, Loader2, FolderOpen } from 'lucide-react';
import { createFolderStructure } from '@/core/persistence/directoryHandleManager';
import {
  migrateProjectsFromIndexedDB,
  MigrationProgress,
} from '@/core/persistence/migrationHelper';
import { resetAdapter } from '@/core/persistence/factory';
import { FolderSetupProgress } from './FolderSetupProgress';

interface FirstLaunchModalProps {
  isOpen: boolean;
  onClose: (mode: 'folder' | 'browser' | 'dismissed') => void;
}

export function FirstLaunchModal({ isOpen, onClose }: FirstLaunchModalProps) {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [status, setStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);

  const handleEnableSync = async () => {
    setIsSettingUp(true);
    setStatus('syncing');
    setError(null);

    try {
      // 1. Check support
      if (!('showDirectoryPicker' in globalThis)) {
        throw new Error('File System Access API not supported in this browser.');
      }

      // 2. Request Folder Access
      // Cast to any because showDirectoryPicker might not be in TS lib yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dirHandle = await (globalThis as any).showDirectoryPicker({
        id: 'sizewise-projects-root',
        mode: 'readwrite',
        startIn: 'documents',
      });

      // 3. Create Structure
      const projectsHandle = await createFolderStructure(dirHandle);
      if (!projectsHandle) {
        throw new Error('Failed to create folder structure.');
      }

      // 4. Migration
      await migrateProjectsFromIndexedDB(projectsHandle, (p) => {
        setProgress({ ...p });
      });

      // 5. Reset Adapter
      resetAdapter();

      // Success
      setStatus('success');
      
      // Delay closing to show success
      setTimeout(() => {
        onClose('folder');
      }, 1500);

    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (err.name === 'AbortError') {
        // User cancelled
        setError('Setup cancelled. Using browser storage.');
        // Brief message before falling back
        setTimeout(() => {
          onClose('dismissed'); 
        }, 2000);
      } else {
        console.error('Setup failed:', err);
        setError(err.message || 'Failed to set up folder sync.');
        setStatus('error');
        // Enable buttons again to let retry
        setIsSettingUp(false);
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    // Only allow dismissal if not setting up (unless successful)
    // If successfully finished, dismissal is fine (handled by timeout mostly)
    if (!open && !isSettingUp && status !== 'success') {
      onClose('dismissed');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enable Automatic Sync</DialogTitle>
          <DialogDescription>
            Connect a local folder to seamlessly sync your projects between the web app and the desktop app.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {status === 'idle' && !error && (
            <div className="flex flex-col items-center gap-4 text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <HardDrive className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">We&apos;ll create a folder at:</p>
                <p className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  Documents/SizeWise/Projects
                </p>
              </div>
            </div>
          )}

          {status === 'syncing' && !error && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
              {progress ? (
                <FolderSetupProgress progress={progress} />
              ) : (
                <p className="text-center text-sm text-slate-500">Setting up folder structure...</p>
              )}
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="font-medium text-green-600">Sync Enabled Successfully!</p>
            </div>
          )}

          {status === 'error' && error && (
             <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg">
               <AlertCircle className="h-5 w-5 shrink-0" />
               <p className="text-sm">{error}</p>
             </div>
          )}
          
          {/* Cancelled State (shown briefly) */}
          {error && status === 'syncing' && ( 
             <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 text-slate-600 rounded-lg">
               <p className="text-sm">{error}</p>
             </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:justify-between gap-2 sm:gap-0">
          {status !== 'success' && !error && (
            <>
              <Button
                variant="ghost"
                onClick={() => onClose('browser')}
                disabled={isSettingUp}
                className="text-slate-500"
              >
                Use Browser Storage
              </Button>
              <Button onClick={handleEnableSync} disabled={isSettingUp} className="gap-2">
                {isSettingUp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FolderOpen className="h-4 w-4" />
                )}
                Enable Sync
              </Button>
            </>
          )}
          {status === 'error' && (
             <Button onClick={handleEnableSync} className="w-full">
               Retry
             </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
