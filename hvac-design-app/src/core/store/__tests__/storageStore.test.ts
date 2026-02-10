import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_INITIAL_STATE, useStorageStore } from '../storageStore';

describe('storageStore', () => {
  beforeEach(async () => {
    useStorageStore.persist?.clearStorage?.();
    localStorage.clear();
    useStorageStore.setState({ ...STORAGE_INITIAL_STATE });
    await useStorageStore.persist.rehydrate();
  });

  it('initializes with expected defaults', () => {
    const state = useStorageStore.getState();
    expect(state.storageRootPath).toBeNull();
    expect(state.storageRootType).toBe('documents');
    expect(state.migrationState).toBe('pending');
    expect(state.lastValidatedAt).toBeNull();
    expect(state.validationWarnings).toEqual([]);
    expect(state.quarantinedFileCount).toBe(0);
  });

  it('sets storage root path and type', () => {
    useStorageStore.getState().setStorageRoot('/tmp/sizewise', 'appdata');
    const state = useStorageStore.getState();
    expect(state.storageRootPath).toBe('/tmp/sizewise');
    expect(state.storageRootType).toBe('appdata');
  });

  it('tracks migration completion timestamp when completed', () => {
    useStorageStore.getState().setMigrationState('running');
    expect(useStorageStore.getState().migrationState).toBe('running');
    useStorageStore.getState().setMigrationState('completed');
    const state = useStorageStore.getState();
    expect(state.migrationState).toBe('completed');
    expect(state.migrationCompletedAt).not.toBeNull();
  });

  it('normalizes legacy migration state names', () => {
    useStorageStore.getState().setMigrationState('in-progress');
    expect(useStorageStore.getState().migrationState).toBe('running');
    useStorageStore.getState().setMigrationState('error', 'legacy failure');
    const state = useStorageStore.getState();
    expect(state.migrationState).toBe('failed');
    expect(state.migrationError).toBe('legacy failure');
  });

  it('updates validation data with numeric timestamp', () => {
    const ts = Date.now();
    const warnings = ['Low disk space'];
    useStorageStore.getState().updateValidation(ts, warnings);
    const state = useStorageStore.getState();
    expect(state.lastValidatedAt).toBe(ts);
    expect(state.validationWarnings).toEqual(warnings);
  });

  it('increments quarantine counters', () => {
    useStorageStore.getState().incrementQuarantine();
    const state = useStorageStore.getState();
    expect(state.quarantinedFileCount).toBe(1);
    expect(state.lastQuarantineAt).not.toBeNull();
  });

  it('updates disk space info', () => {
    useStorageStore.getState().setDiskSpace({
      availableBytes: 5 * 1024 ** 3,
      totalBytes: 10 * 1024 ** 3,
      percentAvailable: 50,
    });
    const state = useStorageStore.getState();
    expect(state.diskSpace.availableBytes).toBe(5 * 1024 ** 3);
    expect(state.diskSpace.totalBytes).toBe(10 * 1024 ** 3);
    expect(state.diskSpace.percentAvailable).toBe(50);
  });

  it('persists state to sws.storage', () => {
    useStorageStore.getState().setStorageRoot('/persisted/path', 'documents');
    const persistedRaw = localStorage.getItem('sws.storage');
    expect(persistedRaw).not.toBeNull();
    const persisted = JSON.parse(persistedRaw ?? '{}');
    expect(persisted?.state?.storageRootPath).toBe('/persisted/path');
    expect(persisted?.state?.storageRootType).toBe('documents');
  });

  it('migrates legacy persisted data on rehydrate', async () => {
    localStorage.setItem(
      'sws.storage',
      JSON.stringify({
        state: {
          storageRootPath: '/legacy/path',
          storageRootType: null,
          migrationState: 'in-progress',
          lastValidatedAt: '2026-01-01T00:00:00.000Z',
        },
        version: 0,
      })
    );

    await useStorageStore.persist.rehydrate();

    const state = useStorageStore.getState();
    expect(state.storageRootPath).toBe('/legacy/path');
    expect(state.storageRootType).toBe('documents');
    expect(state.migrationState).toBe('running');
    expect(typeof state.lastValidatedAt).toBe('number');
  });
});
