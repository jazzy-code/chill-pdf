'use client';
import { useCallback, useEffect, useRef } from 'react';
import PageThumbnail from '@/components/editor/PageThumbnail';
import { useEditorStore } from '@/store/editor-store';

export default function PagesSidebar() {
  const ref = useRef<HTMLElement>(null);
  const pages = useEditorStore((s) => s.pages);
  const sources = useEditorStore((s) => s.sources);
  const activePageId = useEditorStore((s) => s.activePageId);
  const setActivePage = useEditorStore((s) => s.setActivePage);

  const goTo = useCallback(
    (id: string) => {
      setActivePage(id);
      document.getElementById('page-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [setActivePage]
  );

  // Keep the active thumbnail in view (scroll only the sidebar, never the viewer)
  useEffect(() => {
    const container = ref.current;
    const el = container?.querySelector<HTMLElement>(`[data-thumb-id="${activePageId}"]`);
    if (!container || !el) return;
    const c = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const pad = 16;
    if (r.top < c.top + pad) {
      container.scrollBy({ top: r.top - c.top - pad, behavior: 'smooth' });
    } else if (r.bottom > c.bottom - pad) {
      container.scrollBy({ top: r.bottom - c.bottom + pad, behavior: 'smooth' });
    }
  }, [activePageId]);

  return (
    <aside
      ref={ref}
      aria-label="Páginas"
      className="w-56 shrink-0 overflow-y-auto border-r bg-card px-4 py-6"
    >
      <div className="flex flex-col items-center gap-5">
        {pages.map((page, i) => (
          <PageThumbnail
            key={page.id}
            page={page}
            source={sources[page.sourceId]}
            index={i}
            active={page.id === activePageId}
            onSelect={goTo}
          />
        ))}
      </div>
    </aside>
  );
}
