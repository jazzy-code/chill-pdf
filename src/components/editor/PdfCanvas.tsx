'use client';
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { RenderTask } from 'pdfjs-dist';
import { getPdfDoc } from '@/lib/pdfjs';
import { cn } from '@/lib/utils';
import type { SourceDoc } from '@/types/editor';

interface Props {
  source: SourceDoc;
  pageIndex: number;
  scale: number;
  className?: string;
}

function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY, overflowX } = getComputedStyle(node);
    if (/(auto|scroll)/.test(overflowY + overflowX)) return node;
    node = node.parentElement;
  }
  return null;
}

/** Fills its (sized, positioned) parent. Renders lazily and re-renders after zoom settles. */
export default function PdfCanvas({ source, pageIndex, scale, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [renderScale, setRenderScale] = useState(scale);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      root: getScrollParent(el),
      rootMargin: '600px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // While zooming the canvas is scaled by CSS; re-render sharp after 150 ms.
  useEffect(() => {
    if (scale === renderScale) return;
    const t = setTimeout(() => setRenderScale(scale), 150);
    return () => clearTimeout(t);
  }, [scale, renderScale]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!visible) {
      el.replaceChildren(); // free canvas memory when far from view
      return;
    }

    let cancelled = false;
    let task: RenderTask | null = null;
    (async () => {
      try {
        const doc = await getPdfDoc(source);
        if (cancelled) return;
        const page = await doc.getPage(pageIndex + 1);
        if (cancelled) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: renderScale * dpr });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.className = 'block h-full w-full';
        task = page.render({ canvas, viewport });
        await task.promise;
        // swap only when done → no blank flash while re-rendering
        if (!cancelled) el.replaceChildren(canvas);
      } catch (err) {
        if (!cancelled && (err as Error)?.name !== 'RenderingCancelledException') {
          console.error(err);
        }
      }
    })();

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [visible, renderScale, source, pageIndex]);

  // The spinner sits under the canvas host: visible while empty, covered by the opaque page once drawn.
  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-card', className)}>
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <Loader2 className="size-5 animate-spin text-primary/50" />
      </div>
      <div ref={ref} className="absolute inset-0" />
    </div>
  );
}
