import { useEffect } from 'react';
import { useToast } from '../components/ui/ToastContext';
import { useStorageStore } from '../core/store/storageStore';

/**
 * Hook to subscribe to storage events and display toast notifications
 */
export function useStorageEvents() {
    const { addToast } = useToast();
    const { quarantinedFileCount, validationWarnings } = useStorageStore();

    useEffect(() => {
        // Listen for quarantine events
        const handleQuarantine = (event: CustomEvent) => {
            const { projectId, reason } = event.detail;
            addToast({
                type: 'error',
                title: 'Project File Quarantined',
                message: `Project ${projectId} was corrupted: ${reason}`,
                duration: 10000,
            });
        };

        // Listen for low disk warnings
        const handleLowDisk = (event: CustomEvent) => {
            const { percentAvailable } = event.detail;
            addToast({
                type: 'warning',
                title: 'Low Disk Space',
                message: `Only ${percentAvailable}% disk space available. Consider freeing up space.`,
                duration: 8000,
            });
        };

        // Listen for validation errors
        const handleValidationError = (event: CustomEvent) => {
            const { error } = event.detail;
            addToast({
                type: 'error',
                title: 'Storage Validation Error',
                message: error,
                duration: 7000,
            });
        };

        // Listen for storage relocation success
        const handleRelocationSuccess = (event: CustomEvent) => {
            const { newPath } = event.detail;
            addToast({
                type: 'success',
                title: 'Storage Relocated',
                message: `Projects moved to: ${newPath}`,
                duration: 5000,
            });
        };

        window.addEventListener('project:quarantined', handleQuarantine as EventListener);
        window.addEventListener('storage:low-disk', handleLowDisk as EventListener);
        window.addEventListener('storage:validation-error', handleValidationError as EventListener);
        window.addEventListener('storage:relocated', handleRelocationSuccess as EventListener);

        return () => {
            window.removeEventListener('project:quarantined', handleQuarantine as EventListener);
            window.removeEventListener('storage:low-disk', handleLowDisk as EventListener);
            window.removeEventListener('storage:validation-error', handleValidationError as EventListener);
            window.removeEventListener('storage:relocated', handleRelocationSuccess as EventListener);
        };
    }, [addToast]);

    // Show toast when quarantine count increases
    useEffect(() => {
        if (quarantinedFileCount > 0) {
            // Only notify on first quarantine detection during session
            const hasNotified = sessionStorage.getItem('quarantine-notified');
            if (!hasNotified) {
                addToast({
                    type: 'info',
                    title: 'Quarantined Files Detected',
                    message: `${quarantinedFileCount} corrupted file(s) found. Check Settings > Storage to review.`,
                    duration: 8000,
                });
                sessionStorage.setItem('quarantine-notified', 'true');
            }
        }
    }, [quarantinedFileCount, addToast]);

    // Show toast for storage warnings
    useEffect(() => {
        if (validationWarnings.length > 0) {
            const latestWarning = validationWarnings[validationWarnings.length - 1];
            addToast({
                type: 'warning',
                title: 'Storage Warning',
                message: latestWarning,
                duration: 7000,
            });
        }
    }, [validationWarnings, addToast]);
}
