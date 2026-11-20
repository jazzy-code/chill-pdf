'use client';
import { useEffect } from 'react';
import { redo, undo, useEditorStore } from '@/store/editor-store';

function isEditableTarget(el: Element | null) {
  if (!el) return false;
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement ||
    (el as HTMLElement).isContentEditable ||
    el.closest('[contenteditable]:not([contenteditable="false"])') !== null
  );
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(document.activeElement)) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (!mod && (e.key === 'Delete' || e.key === 'Backspace')) {
        const { selectedId, removeAnnotation } = useEditorStore.getState();
        if (!selectedId) return;
        e.preventDefault();
        removeAnnotation(selectedId);
      } else if (e.key === 'Escape') {
        const { selectedId, tool, select, setTool } = useEditorStore.getState();
        if (!selectedId && tool === 'select') return;
        e.preventDefault();
        select(null);
        setTool('select');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
