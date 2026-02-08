import { describe, it, expect, beforeEach } from 'vitest';
import { TauriPathManager } from '../TauriPathManager';

describe('TauriPathManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return null when no path is set', () => {
    expect(TauriPathManager.getPath()).toBeNull();
  });

  it('should save and retrieve a path', () => {
    const testPath = '/custom/path/to/projects';
    TauriPathManager.setPath(testPath);
    expect(TauriPathManager.getPath()).toBe(testPath);
  });

  it('should clear the path on reset', () => {
    TauriPathManager.setPath('/some/path');
    TauriPathManager.resetPath();
    expect(TauriPathManager.getPath()).toBeNull();
  });

  it('should handle multiple updates', () => {
    TauriPathManager.setPath('/path/one');
    expect(TauriPathManager.getPath()).toBe('/path/one');
    
    TauriPathManager.setPath('/path/two');
    expect(TauriPathManager.getPath()).toBe('/path/two');
  });
});
