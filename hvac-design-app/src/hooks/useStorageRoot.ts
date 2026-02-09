import { useEffect, useState } from 'react';
import { getStorageRootService } from '../core/services/StorageRootService';
import { useStorageStore } from '../core/store/storageStore';

export interface UseStorageRootReturn {
    storageRootPath: string | null;
    storageRootType: 'documents' | 'appdata' | null;
    migrationState: 'pending' | 'in-progress' | 'completed' | 'error';
    migrationError: string | null;
    validationWarnings: string[];
    isValidating: boolean;
    initialize: () => Promise<void>;
    validate: () => Promise<void>;
    relocate: (newPath: string) => Promise<void>;
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

    return {
        storageRootPath: store.storageRootPath,
        storageRootType: store.storageRootType,
        migrationState: store.migrationState,
        migrationError: store.migrationError,
        validationWarnings: store.validationWarnings,
        isValidating,
        initialize,
        validate,
        relocate
    };
}
