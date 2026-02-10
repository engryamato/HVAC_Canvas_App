import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StorageRootType = 'documents' | 'appdata';
export type StorageMigrationState = 'idle' | 'pending' | 'running' | 'completed' | 'failed';
type LegacyStorageMigrationState = 'in-progress' | 'error';
type SetMigrationStateInput = StorageMigrationState | LegacyStorageMigrationState;

export interface DiskSpaceInfo {
    availableBytes: number;
    totalBytes: number;
    percentAvailable: number;
}

export interface StorageState {
    storageRootPath: string | null;
    storageRootType: StorageRootType;
    migrationState: StorageMigrationState;
    migrationCompletedAt: string | null;
    migrationError: string | null;
    lastValidatedAt: number | null;
    validationWarnings: string[];
    quarantinedFileCount: number;
    lastQuarantineAt: string | null;
    diskSpace: DiskSpaceInfo;

    setStorageRoot: (path: string, type: StorageRootType) => void;
    setMigrationState: (state: SetMigrationStateInput, error?: string) => void;
    updateValidation: (timestamp: number, warnings: string[]) => void;
    incrementQuarantine: () => void;
    setDiskSpace: (diskSpace: DiskSpaceInfo) => void;
}

export const STORAGE_INITIAL_STATE: Pick<
    StorageState,
    | 'storageRootPath'
    | 'storageRootType'
    | 'migrationState'
    | 'migrationCompletedAt'
    | 'migrationError'
    | 'lastValidatedAt'
    | 'validationWarnings'
    | 'quarantinedFileCount'
    | 'lastQuarantineAt'
    | 'diskSpace'
> = {
    storageRootPath: null,
    storageRootType: 'documents',
    migrationState: 'pending',
    migrationCompletedAt: null,
    migrationError: null,
    lastValidatedAt: null,
    validationWarnings: [],
    quarantinedFileCount: 0,
    lastQuarantineAt: null,
    diskSpace: {
        availableBytes: 0,
        totalBytes: 0,
        percentAvailable: 100,
    },
};

function normalizeMigrationState(state: SetMigrationStateInput): StorageMigrationState {
    if (state === 'in-progress') {
        return 'running';
    }
    if (state === 'error') {
        return 'failed';
    }
    return state;
}

export const useStorageStore = create<StorageState>()(
    persist(
        (set) => ({
            ...STORAGE_INITIAL_STATE,

            setStorageRoot: (path, type) => set({ storageRootPath: path, storageRootType: type }),
            setMigrationState: (state, error) => set((prev) => ({
                migrationState: normalizeMigrationState(state),
                migrationError: error || null,
                migrationCompletedAt:
                    normalizeMigrationState(state) === 'completed'
                        ? new Date().toISOString()
                        : prev.migrationCompletedAt,
            })),
            updateValidation: (timestamp, warnings) => set({
                validationWarnings: warnings,
                lastValidatedAt: timestamp,
            }),
            incrementQuarantine: () => set((state) => ({
                quarantinedFileCount: state.quarantinedFileCount + 1,
                lastQuarantineAt: new Date().toISOString(),
            })),
            setDiskSpace: (diskSpace) => set({ diskSpace }),
        }),
        {
            name: 'sws.storage',
            version: 1,
            migrate: (persistedState, version) => {
                if (!persistedState || typeof persistedState !== 'object') {
                    return persistedState;
                }
                const state = persistedState as Partial<StorageState> & {
                    migrationState?: SetMigrationStateInput;
                    storageRootType?: StorageRootType | null;
                    lastValidatedAt?: number | string | null;
                };
                if (version >= 1) {
                    return {
                        ...state,
                        storageRootType: state.storageRootType ?? 'documents',
                        migrationState: normalizeMigrationState(state.migrationState ?? 'pending'),
                    };
                }
                const migratedTimestamp =
                    typeof state.lastValidatedAt === 'string'
                        ? Date.parse(state.lastValidatedAt)
                        : state.lastValidatedAt;
                return {
                    ...state,
                    storageRootType: state.storageRootType ?? 'documents',
                    migrationState: normalizeMigrationState(state.migrationState ?? 'pending'),
                    lastValidatedAt: Number.isFinite(migratedTimestamp) ? migratedTimestamp : null,
                };
            },
        }
    )
);
