import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock Tauri API modules for testing
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn()
}))

vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn(),
  readTextFileLines: vi.fn(),
  readFile: vi.fn(),
  writeTextFile: vi.fn(),
  writeFile: vi.fn(),
  readDir: vi.fn(),
  mkdir: vi.fn(),
  copyFile: vi.fn(),
  remove: vi.fn(),
  rename: vi.fn(),
  exists: vi.fn()
}))

vi.mock('@tauri-apps/api/path', () => ({
  homeDir: vi.fn().mockResolvedValue('/Users/test'),
  documentDir: vi.fn().mockResolvedValue('/Users/test/Documents'),
  tempDir: vi.fn().mockResolvedValue('/tmp'),
  join: vi.fn((...paths: string[]) => paths.join('/'))
}))

vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: vi.fn(),
  open: vi.fn(),
  message: vi.fn(),
  ask: vi.fn(),
  confirm: vi.fn()
}))

vi.mock('@tauri-apps/api/window', () => ({
  appWindow: {
    close: vi.fn(),
    hide: vi.fn(),
    show: vi.fn(),
    minimize: vi.fn(),
    maximize: vi.fn()
  }
}))

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn()
}

// HTMLCanvasElement.prototype.getContext is now mocked by vitest-canvas-mock
// No manual mock needed here

// Mock URL.createObjectURL and revokeObjectURL for file download tests
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();
