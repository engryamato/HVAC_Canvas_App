/**
import { isTauri } from "@/lib/platform";
 * Type declarations for Tauri modules that may not be available in web builds
 * These modules are only used when running in Tauri desktop environment
 */

declare module '@tauri-apps/plugin-fs' {
  export function readTextFile(path: string): Promise<string>;
  export function writeTextFile(path: string, content: string): Promise<void>;
  export function writeFile(path: string, data: Uint8Array): Promise<void>;
  export function exists(path: string): Promise<boolean>;
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function readDir(path: string): Promise<Array<{ name?: string }>>;
  export function copyFile(source: string, destination: string): Promise<void>;
  export function remove(path: string): Promise<void>;
  export function rename(oldPath: string, newPath: string): Promise<void>;
}

declare module '@tauri-apps/plugin-dialog' {
  export function open(options?: unknown): Promise<string | string[] | null>;
  export function save(options?: unknown): Promise<string | null>;
}

declare module '@tauri-apps/plugin-clipboard-manager' {
  export function readText(): Promise<string>;
  export function writeText(text: string): Promise<void>;
}

declare module '@tauri-apps/api/path' {
  export function documentDir(): Promise<string>;
}
