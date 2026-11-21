'use client';
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { FilePlus2 } from 'lucide-react';
import { useEditorStore } from '@/store/editor-store';

const hasFiles = (e: { dataTransfer: DataTransfer | null }) =>
  !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');

/** Accepts PDFs dropped from the OS and appends them. Ignores dnd-kit's internal drags. */
export default function FileDropZone({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const depth = useRef(0);
  const appendFiles = useEditorStore((s) => s.appendFiles);

  // Prevent the browser from opening files dropped outside the zone (toolbar, etc.)
  useEffect(() => {
    const block = (e: globalThis.DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const resetZone = () => {
      depth.current = 0;
      setActive(false);
    };
    window.addEventListener('dragover', block);
    window.addEventListener('drop', block);
    window.addEventListener('drop', resetZone);
    window.addEventListener('dragend', resetZone);
    return () => {
      window.removeEventListener('dragover', block);
      window.removeEventListener('drop', block);
      window.removeEventListener('drop', resetZone);
      window.removeEventListener('dragend', resetZone);
    };
  }, []);

  const onDragEnter = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    depth.current += 1;
    setActive(true);
  };
  const onDragLeave = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setActive(false);
  };
  const onDragOver = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  const onDrop = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth.current = 0;
    setActive(false);
    appendFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div
      className="relative flex min-h-0 flex-1"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {children}
      {active && (
        <div className="pointer-events-none absolute inset-3 z-40 flex items-center justify-center rounded-3xl border-2 border-dashed border-primary bg-accent/40 backdrop-blur-[1px]">
          <div className="flex items-center gap-3 rounded-full bg-card px-6 py-3 font-display text-lg font-semibold text-foreground shadow-md">
            <FilePlus2 className="size-5 text-primary" />
            Suelta para añadir al final
          </div>
        </div>
      )}
    </div>
  );
}
