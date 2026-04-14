import { describe, expect, it } from 'vitest';
import { createEmptyProjectFile } from '@/core/schema';
import { VersionDetector } from '../VersionDetector';

describe('VersionDetector', () => {
  it('prefers schemaVersion for project files', () => {
    const project = {
      ...createEmptyProjectFile('550e8400-e29b-41d4-a716-446655440000'),
      schemaVersion: '2.0.0',
      services: {},
    };

    expect(VersionDetector.detectVersion(project)).toEqual({ major: 2, minor: 0, patch: 0 });
  });

  it('still detects legacy store markers as v1 when schemaVersion is absent', () => {
    expect(
      VersionDetector.detectVersion({
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        services: {},
      })
    ).toEqual({ major: 1, minor: 0, patch: 0 });
  });
});
