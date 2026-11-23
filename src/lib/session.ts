'use client';
import { del, get, set } from 'idb-keyval';
import type { Annotation, PageItem, SourceDoc } from '@/types/editor';

// IndexedDB (not localStorage: PDF bytes easily exceed its ~5 MB limit). Everything stays on this device.
const KEY = 'chill-pdf:session';

export interface SavedSession {
  version: 1;
  savedAt: number;
  fileName: string;
  sources: Record<string, SourceDoc>;
  pages: PageItem[];
  annotations: Annotation[];
}

export async function loadSession(): Promise<SavedSession | null> {
  try {
    const s = await get<SavedSession>(KEY);
    if (!s || s.version !== 1 || !Array.isArray(s.pages) || s.pages.length === 0) return null;
    // every page must still have its source bytes
    if (!s.pages.every((p) => s.sources[p.sourceId]?.bytes instanceof Uint8Array)) return null;
    return s;
  } catch {
    return null; // private mode / storage blocked: just don't offer to resume
  }
}

export async function saveSession(data: Omit<SavedSession, 'version' | 'savedAt'>) {
  try {
    // keep only the sources still used (deleted/undone PDFs aren't worth storing)
    const used = new Set(data.pages.map((p) => p.sourceId));
    const sources = Object.fromEntries(Object.entries(data.sources).filter(([id]) => used.has(id)));
    await set(KEY, { ...data, sources, version: 1, savedAt: Date.now() } satisfies SavedSession);
  } catch {
    // quota exceeded / storage blocked: the editor keeps working, only resume is lost
  }
}

export async function clearSession() {
  try {
    await del(KEY);
  } catch {
    /* ignore */
  }
}
