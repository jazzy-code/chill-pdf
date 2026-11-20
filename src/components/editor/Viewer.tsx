'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import PageView from '@/components/editor/PageView';
import { useEditorStore } from '@/store/editor-store';

export const VIEWER_ID = 'viewer-scroll';
const ZOOM_STEP = 0.1;
const WHEEL_STEP = 50; // accumulated deltaY per zoom step (smooths trackpad pinch)

export default function Viewer() {
  const ref = useRef<HTMLDivElement>(null);
  const pages = useEditorStore((s) => s.pages);
  const sources = useEditorStore((s) => s.sources);
  const zoom = useEditorStore((s) => s.zoom);

  // Keep the page at the top of the viewer anchored when zoom changes
  const anchorRef = useRef<{ id: string; frac: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const top = el.getBoundingClientRect().top;
      for (const node of el.querySelectorAll<HTMLElement>('[data-page-id]')) {
        const r = node.getBoundingClientRect();
        if (r.bottom > top) {
          anchorRef.current = { id: node.dataset.pageId!, frac: (top - r.top) / r.height };
          return;
        }
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const prevZoom = useRef(zoom);
  useLayoutEffect(() => {
    const el = ref.current;
    const anchor = anchorRef.current;
    const ratio = zoom / prevZoom.current;
    prevZoom.current = zoom;
    if (!el || ratio === 1) return;
    el.scrollLeft *= ratio;
    const node = anchor && document.getElementById('page-' + anchor.id);
    if (!node) return;
    const r = node.getBoundingClientRect();
    el.scrollTop += r.top - el.getBoundingClientRect().top + anchor.frac * r.height;
  }, [zoom]);

  // Ctrl/⌘ + wheel zoom (needs a non-passive listener to block browser zoom)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      acc += e.deltaY;
      if (Math.abs(acc) < WHEEL_STEP) return;
      const { zoom, setZoom } = useEditorStore.getState();
      setZoom(zoom + (acc < 0 ? ZOOM_STEP : -ZOOM_STEP));
      acc = 0;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Active page = the one occupying most of the viewer
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const visibleHeight = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.pageId;
          if (id) visibleHeight.set(id, e.isIntersecting ? e.intersectionRect.height : 0);
        }
        let best: string | null = null;
        let max = 0;
        visibleHeight.forEach((h, id) => {
          if (h > max) {
            max = h;
            best = id;
          }
        });
        const state = useEditorStore.getState();
        if (best && best !== state.activePageId) state.setActivePage(best);
      },
      { root, threshold: Array.from({ length: 11 }, (_, i) => i / 10) }
    );
    root.querySelectorAll('[data-page-id]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pages, zoom]);

  return (
    <div id={VIEWER_ID} ref={ref} className="min-w-0 flex-1 overflow-auto bg-muted">
      <div className="flex w-max min-w-full flex-col items-center gap-6 p-8">
        {pages.map((page) => (
          <PageView key={page.id} page={page} source={sources[page.sourceId]} zoom={zoom} />
        ))}
      </div>
    </div>
  );
}
