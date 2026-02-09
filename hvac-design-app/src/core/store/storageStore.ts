import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StorageState {
    storageRootPath: string | null;
    storageRootType: 'documents' | 'appdata' | null;
    migrationState: 'pending' | 'in-progress' | 'completed' | 'error';
    migrationCompletedAt: string | null;
    migrationError: string | null;
    lastValidatedAt: string | null;
    validationWarnings: string[];
    quarantinedFileCount: number;
    lastQuarantineAt: string | null;

    setStorageRoot: (path: string, type: 'documents' | 'appdata') => void;
    setMigrationState: (state: StorageState['migrationState'], error?: string) => void;
    updateValidation: (warnings: string[]) => void;
    incrementQuarantine: () => void;
}

export const useStorageStore = create<StorageState>()(
    persist(
        (set) => ({
            storageRootPath: null,
            storageRootType: null,
            migrationState: 'pending',
            migrationCompletedAt: null,
            migrationError: null,
            lastValidatedAt: null,
            validationWarnings: [],
            quarantinedFileCount: 0,
            lastQuarantineAt: null,

            setStorageRoot: (path, type) => set({ storageRootPath: path, storageRootType: type }),
            setMigrationState: (state, error) => set((prev) => ({
                migrationState: state,
                migrationError: error || null,
                migrationCompletedAt: state === 'completed' ? new Date().toISOString() : prev.migrationCompletedAt
            })),
            updateValidation: (warnings) => set({
                validationWarnings: warnings,
                lastValidatedAt: new Date().toISOString()
            }),
            incrementQuarantine: () => set((state) => ({
                quarantinedFileCount: state.quarantinedFileCount + 1,
                lastQuarantineAt: new Date().toISOString()
            })),
        }),
        {
            name: 'sws.storage',
        }
    )
);
