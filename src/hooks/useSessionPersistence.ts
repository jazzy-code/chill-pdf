'use client';
import { useEffect } from 'react';
import { saveSession } from '@/lib/session';
import { useEditorStore, type EditorState } from '@/store/editor-store';

const SAVE_DELAY = 1000;

const snapshot = (s: EditorState) => ({
  fileName: s.fileName,
  sources: s.sources,
  pages: s.pages,
  annotations: s.annotations,
});

/** Saves the open document to IndexedDB (debounced) and warns before leaving with unsaved edits. */
export function useSessionPersistence() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const save = () => {
      timer = null;
      const s = useEditorStore.getState();
      if (s.pages.length) saveSession(snapshot(s));
    };

    save(); // a freshly loaded document is resumable right away
    const unsubscribe = useEditorStore.subscribe((s, prev) => {
      const changed =
        s.pages !== prev.pages ||
        s.annotations !== prev.annotations ||
        s.sources !== prev.sources ||
        s.fileName !== prev.fileName;
      if (!changed) return;
      if (timer) clearTimeout(timer);
      // document closed (reset): it clears the session itself, don't write it back
      timer = s.pages.length ? setTimeout(save, SAVE_DELAY) : null;
    });

    // best effort: flush a pending save when the tab goes away
    const flush = () => {
      if (timer) {
        clearTimeout(timer);
        save();
      }
    };
    // browser's "leave site?" prompt while there are edits in the history
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      flush();
      if (useEditorStore.temporal.getState().pastStates.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);
}
