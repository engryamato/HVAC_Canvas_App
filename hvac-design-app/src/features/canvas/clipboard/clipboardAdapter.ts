import { isTauri } from '@/core/persistence/filesystem';

export type ClipboardReadResult =
  | { ok: true; text: string }
  | { ok: false; reason: string; error?: unknown };

export type ClipboardWriteResult =
  | { ok: true }
  | { ok: false; reason: string; error?: unknown };

async function readTextWeb(): Promise<ClipboardReadResult> {
  if (typeof navigator === 'undefined') {
    return { ok: false, reason: 'Navigator is not available' };
  }

  if (!navigator.clipboard?.readText) {
    return { ok: false, reason: 'Clipboard API not available' };
  }

  try {
    const text = await navigator.clipboard.readText();
    return { ok: true, text };
  } catch (error) {
    return { ok: false, reason: 'Clipboard read failed', error };
  }
}

async function writeTextWeb(text: string): Promise<ClipboardWriteResult> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true };
    } catch {
      // Continue to fallback
    }
  }

  if (typeof document === 'undefined') {
    return { ok: false, reason: 'Document is not available' };
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.left = '-1000px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);

    return ok ? { ok: true } : { ok: false, reason: 'execCommand(copy) returned false' };
  } catch (error) {
    return { ok: false, reason: 'Clipboard write failed', error };
  }
}

async function readTextTauri(): Promise<ClipboardReadResult> {
  try {
    const mod = await import('@tauri-apps/plugin-clipboard-manager');
    const text = await mod.readText();
    return { ok: true, text };
  } catch (error) {
    return { ok: false, reason: 'Tauri clipboard read failed', error };
  }
}

async function writeTextTauri(text: string): Promise<ClipboardWriteResult> {
  try {
    const mod = await import('@tauri-apps/plugin-clipboard-manager');
    await mod.writeText(text);
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: 'Tauri clipboard write failed', error };
  }
}

export async function readClipboardText(): Promise<ClipboardReadResult> {
  return isTauri() ? readTextTauri() : readTextWeb();
}

export async function writeClipboardText(text: string): Promise<ClipboardWriteResult> {
  return isTauri() ? writeTextTauri(text) : writeTextWeb(text);
}

