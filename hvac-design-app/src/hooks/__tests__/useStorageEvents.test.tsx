import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStorageEvents } from '../useStorageEvents';

// Mock dependencies
const mockAddToast = vi.fn();

vi.mock('../../components/ui/ToastContext', () => ({
    useToast: () => ({
        addToast: mockAddToast
    })
}));

vi.mock('../../core/store/storageStore', () => ({
    useStorageStore: vi.fn(() => ({
        quarantinedFileCount: 0,
        validationWarnings: []
    }))
}));

describe('useStorageEvents Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should show toast on low disk event', () => {
        renderHook(() => useStorageEvents());

        const event = new CustomEvent('storage:low-disk', {
            detail: { percentAvailable: 5 }
        });
        window.dispatchEvent(event);

        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({
            type: 'warning',
            title: 'Low Disk Space',
            message: expect.stringContaining('5% disk space available')
        }));
    });

    it('should show toast on quarantine event', () => {
        renderHook(() => useStorageEvents());

        const event = new CustomEvent('project:quarantined', {
            detail: { projectId: 'test-123', reason: 'Invalid JSON' }
        });
        window.dispatchEvent(event);

        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({
            type: 'error',
            title: 'Project File Quarantined',
            message: expect.stringContaining('Project test-123 was corrupted')
        }));
    });

    it('should show toast on validation error event', () => {
        renderHook(() => useStorageEvents());

        const event = new CustomEvent('storage:validation-error', {
            detail: { error: 'Permission denied' }
        });
        window.dispatchEvent(event);

        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({
            type: 'error',
            title: 'Storage Validation Error',
            message: 'Permission denied'
        }));
    });

    it('should show toast on relocation success event', () => {
        renderHook(() => useStorageEvents());

        const event = new CustomEvent('storage:relocated', {
            detail: { newPath: '/new/path' }
        });
        window.dispatchEvent(event);

        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({
            type: 'success',
            title: 'Storage Relocated',
            message: expect.stringContaining('/new/path')
        }));
    });
});
