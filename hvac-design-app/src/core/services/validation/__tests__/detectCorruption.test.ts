import { beforeEach, describe, expect, it, vi } from 'vitest';
import { detectCorruption } from '../detectCorruption';
import * as filesystem from '../../../persistence/filesystem';

vi.mock('../../../persistence/filesystem', () => ({
  exists: vi.fn(),
  readTextFile: vi.fn(),
}));

describe('detectCorruption', () => {
  const validProject = {
    projectId: 'test-project',
    projectName: 'Test Project',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(filesystem.exists).mockResolvedValue(true);
    vi.mocked(filesystem.readTextFile).mockResolvedValue(JSON.stringify(validProject));
  });

  it('returns invalid for missing files', async () => {
    vi.mocked(filesystem.exists).mockResolvedValue(false);

    const result = await detectCorruption('/path/to/missing.sws');

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('does not exist');
    expect(result.corruptionType).toBe('INVALID_JSON');
  });

  it('returns invalid for malformed JSON', async () => {
    vi.mocked(filesystem.readTextFile).mockResolvedValue('{ invalid json');

    const result = await detectCorruption('/path/to/corrupted.sws');

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Invalid JSON');
    expect(result.corruptionType).toBe('INVALID_JSON');
  });

  it('returns invalid when required fields are missing', async () => {
    vi.mocked(filesystem.readTextFile).mockResolvedValue(
      JSON.stringify({ projectId: 'test-project' })
    );

    const result = await detectCorruption('/path/to/incomplete.sws');

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Missing required fields');
    expect(result.error).toContain('projectName');
    expect(result.corruptionType).toBe('MISSING_REQUIRED_FIELDS');
  });

  it('returns invalid for wrong field types', async () => {
    vi.mocked(filesystem.readTextFile).mockResolvedValue(
      JSON.stringify({ ...validProject, projectName: 123 })
    );

    const result = await detectCorruption('/path/to/invalid-types.sws');

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('projectName must be a non-empty string');
    expect(result.corruptionType).toBe('INVALID_SCHEMA');
  });

  it('returns valid for a correct project shape', async () => {
    const result = await detectCorruption('/path/to/valid.sws');

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('surfaces filesystem read errors', async () => {
    vi.mocked(filesystem.readTextFile).mockRejectedValue(new Error('Permission denied'));

    const result = await detectCorruption('/path/to/unreadable.sws');

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Permission denied');
  });
});
