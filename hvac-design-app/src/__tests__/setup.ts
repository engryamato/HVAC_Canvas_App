import { vi } from 'vitest'

// Mock Tauri API modules for testing
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn()
}))

vi.mock('@tauri-apps/api/fs', () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  readDir: vi.fn(),
  createDir: vi.fn(),
  copyFile: vi.fn(),
  exists: vi.fn()
}))

vi.mock('@tauri-apps/api/path', () => ({
  homeDir: vi.fn().mockResolvedValue('/Users/test'),
  documentDir: vi.fn().mockResolvedValue('/Users/test/Documents'),
  tempDir: vi.fn().mockResolvedValue('/tmp'),
  join: vi.fn((...paths: string[]) => paths.join('/'))
}))

vi.mock('@tauri-apps/api/dialog', () => ({
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

