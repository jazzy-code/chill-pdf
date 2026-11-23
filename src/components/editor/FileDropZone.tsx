'use client';
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { FilePlus2, ImagePlus } from 'lucide-react';
import { isImageFile, isPdfFile } from '@/lib/files';
import { cn } from '@/lib/utils';
import { insertImage, useEditorStore } from '@/store/editor-store';

const hasFiles = (e: { dataTransfer: DataTransfer | null }) =>
  !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');

// During a drag only the MIME types are readable (not the files themselves)
const onlyImages = (dt: DataTransfer) => {
  const items = Array.from(dt.items).filter((i) => i.kind === 'file');
  return items.length > 0 && items.every((i) => i.type.startsWith('image/'));
};

/**
 * OS file drops on the editor: PDFs are appended at the end; images are placed on the page
 * (and at the point) where they are dropped. Ignores dnd-kit's internal drags.
 */
export default function FileDropZone({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'pdf' | 'image' | null>(null);
  const depth = useRef(0);
  const appendFiles = useEditorStore((s) => s.appendFiles);

  // Prevent the browser from opening files dropped outside the zone (toolbar, etc.)
  useEffect(() => {
    const block = (e: globalThis.DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const resetZone = () => {
      depth.current = 0;
      setMode(null);
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
    setMode(onlyImages(e.dataTransfer) ? 'image' : 'pdf');
  };
  const onDragLeave = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setMode(null);
  };
  const onDragOver = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  const onDrop = async (e: DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth.current = 0;
    setMode(null);

    const files = Array.from(e.dataTransfer.files);
    const images = files.filter(isImageFile);
    const others = files.filter((f) => !isImageFile(f));

    if (images.length) {
      // the page under the pointer (overlay is pointer-events-none, so target is the real element)
      const pageEl = (e.target as HTMLElement).closest<HTMLElement>('[data-page-id]');
      const zoom = useEditorStore.getState().zoom;
      let pageId: string | undefined;
      let point: { x: number; y: number } | undefined;
      if (pageEl) {
        const r = pageEl.getBoundingClientRect();
        pageId = pageEl.dataset.pageId;
        point = { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom };
      }
      // several images: cascade them a little so they don't overlap exactly
      for (const [i, file] of images.entries()) {
        await insertImage(file, pageId, point && { x: point.x + i * 16, y: point.y + i * 16 });
      }
    }
    if (others.some(isPdfFile) || (others.length && !images.length)) appendFiles(others);
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
      {mode && (
        <div
          className={cn(
            'pointer-events-none absolute inset-3 z-40 flex justify-center rounded-3xl border-2 border-dashed border-primary',
            // images: keep the pages visible so the user can aim
            mode === 'pdf' ? 'items-center bg-accent/40 backdrop-blur-[1px]' : 'items-start pt-4'
          )}
        >
          <div className="flex items-center gap-3 rounded-full bg-card px-6 py-3 font-display text-lg font-semibold text-foreground shadow-md">
            {mode === 'pdf' ? (
              <>
                <FilePlus2 className="size-5 text-primary" />
                Suelta para añadir al final
              </>
            ) : (
              <>
                <ImagePlus className="size-5 text-primary" />
                Suelta la imagen sobre una página
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
