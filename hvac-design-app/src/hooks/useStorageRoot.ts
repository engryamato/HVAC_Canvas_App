import { useEffect, useState } from 'react';
import { getStorageRootService } from '../core/services/StorageRootService';
import { useStorageStore } from '../core/store/storageStore';
import type { StorageMigrationState, StorageRootType } from '../core/store/storageStore';
import { isTauri } from '../core/persistence/filesystem';

export interface UseStorageRootReturn {
    storageRootPath: string | null;
    storageRootType: StorageRootType;
    migrationState: StorageMigrationState;
    migrationError: string | null;
    validationWarnings: string[];
    isValidating: boolean;
    initialize: () => Promise<void>;
    validate: () => Promise<void>;
    relocate: (newPath: string) => Promise<void>;
    changeStorageLocation: () => Promise<void>;
}

export function useStorageRoot(): UseStorageRootReturn {
    const store = useStorageStore();
    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
        let service: Awaited<ReturnType<typeof getStorageRootService>> | null = null;

        const handleStorageRootChanged = (_event: Event) => {
            // Event already dispatched by service, just trigger re-render
            // Zustand will handle the actual state updates
        };

        const handleMigrationState = (_event: Event) => {
            // Migration state changes handled via Zustand store
        };

        const handleOperationError = (event: Event) => {
            console.error('Storage operation error:', event);
        };

        // Set up event listeners
        (async () => {
            service = await getStorageRootService();
            service.addEventListener('storageRoot:changed', handleStorageRootChanged);
            service.addEventListener('migration:state', handleMigrationState);
            service.addEventListener('operation:error', handleOperationError);
        })();

        return () => {
            if (service) {
                service.removeEventListener('storageRoot:changed', handleStorageRootChanged);
                service.removeEventListener('migration:state', handleMigrationState);
                service.removeEventListener('operation:error', handleOperationError);
            }
        };
    }, []);
    
    // Periodic validation to update disk space info
    useEffect(() => {
        if (!store.storageRootPath) {
            return;
        }

        let cancelled = false;
        
        const runValidation = async () => {
            try {
                const service = await getStorageRootService();
                if (!cancelled) {
                    await service.validate();
                }
            } catch (error) {
                console.warn('Periodic storage validation failed:', error);
            }
        };

        // Initial run
        runValidation();

        // Poll every 60 seconds
        const interval = setInterval(() => {
            runValidation();
        }, 60_000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [store.storageRootPath]);

    useEffect(() => {
        if (!store.storageRootPath) {
            return;
        }

        let cancelled = false;

        const runValidation = async () => {
            try {
                const service = await getStorageRootService();
                if (!cancelled) {
                    await service.validate();
                }
            } catch (error) {
                console.warn('Periodic storage validation failed:', error);
            }
        };

        void runValidation();
        const interval = setInterval(() => {
            void runValidation();
        }, 60_000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [store.storageRootPath]);

    const initialize = async () => {
        const service = await getStorageRootService();
        await service.initialize();
    };

    const validate = async () => {
        setIsValidating(true);
        try {
            const service = await getStorageRootService();
            await service.validate();
        } finally {
            setIsValidating(false);
        }
    };

    const relocate = async (newPath: string) => {
        const service = await getStorageRootService();
        await service.relocate(newPath);
    };
    
    const changeStorageLocation = async () => {
        if (!isTauri()) {
            // Web Fallback: Allow manual path entry for Virtual FS
            // This preserves the feature logic (changing location) without needing native dialogs
            const current = store.storageRootPath || 'indexeddb://documents';
            // eslint-disable-next-line no-alert
            const newPath = window.prompt('Enter new storage path (Virtual FS):', current);
            
            if (newPath && newPath.trim() !== '' && newPath !== current) {
                await relocate(newPath.trim());
            }
            return;
        }

        // Import dialog dynamically to avoid SSR issues
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
            directory: true,
            multiple: false,
            title: 'Select New Storage Location',
        });
        
        if (selected && typeof selected === 'string') {
            await relocate(selected);
        }
    };

    return {
        storageRootPath: store.storageRootPath,
        storageRootType: store.storageRootType,
        migrationState: store.migrationState,
        migrationError: store.migrationError,
        validationWarnings: store.validationWarnings,
        isValidating,
        initialize,
        validate,
        relocate,
        changeStorageLocation,
    };
}
