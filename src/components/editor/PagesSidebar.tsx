'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import PageThumbnail, {
  THUMB_WIDTH,
  THUMB_WIDTH_SMALL,
  ThumbnailPreview,
} from '@/components/editor/PageThumbnail';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Plus } from 'lucide-react';
import { pickAndAppendPdfs, useEditorStore } from '@/store/editor-store';

export default function PagesSidebar() {
  const ref = useRef<HTMLElement>(null);
  const pages = useEditorStore((s) => s.pages);
  const sources = useEditorStore((s) => s.sources);
  const activePageId = useEditorStore((s) => s.activePageId);
  const setActivePage = useEditorStore((s) => s.setActivePage);
  const deletePage = useEditorStore((s) => s.deletePage);
  const movePage = useEditorStore((s) => s.movePage);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const thumbWidth = useMediaQuery('(min-width: 768px)') ? THUMB_WIDTH : THUMB_WIDTH_SMALL;

  const [announcement, setAnnouncement] = useState('');

  // Mouse/touch drag only. Keyboard reorder is Alt+↑/↓ (see onMove): dnd-kit's KeyboardSensor
  // mis-measures once the sidebar is scrolled and can move the wrong page.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onMove = useCallback(
    (id: string, direction: -1 | 1) => {
      const { pages } = useEditorStore.getState();
      const index = pages.findIndex((p) => p.id === id);
      const target = pages[index + direction];
      if (!target) return;
      movePage(id, target.id);
      setAnnouncement(`Página movida a la posición ${index + direction + 1} de ${pages.length}.`);
      // re-ordering keyed DOM nodes can drop focus → restore it
      requestAnimationFrame(() =>
        ref.current
          ?.querySelector<HTMLElement>(`[data-thumb-id="${id}"] button`)
          ?.focus({ preventScroll: false })
      );
    },
    [movePage]
  );

  const goTo = useCallback(
    (id: string) => {
      setActivePage(id);
      document.getElementById('page-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [setActivePage]
  );

  const onDragStart = ({ active }: DragStartEvent) => setDraggingId(String(active.id));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingId(null);
    if (over && active.id !== over.id) movePage(String(active.id), String(over.id));
  };

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

  const pageNumber = (id: string | number) => pages.findIndex((p) => p.id === id) + 1;
  const draggingPage = draggingId ? pages.find((p) => p.id === draggingId) : undefined;

  return (
    <aside
      ref={ref}
      aria-label="Páginas"
      className="w-28 shrink-0 overflow-y-auto border-r bg-card px-3 py-6 md:w-56 md:px-4"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDraggingId(null)}
        accessibility={{
          announcements: {
            onDragStart: ({ active }) => `Página ${pageNumber(active.id)} levantada.`,
            onDragOver: ({ active, over }) =>
              over ? `Página ${pageNumber(active.id)} sobre la posición ${pageNumber(over.id)}.` : undefined,
            onDragEnd: ({ active, over }) =>
              over
                ? `Página ${pageNumber(active.id)} movida a la posición ${pageNumber(over.id)}.`
                : `Página ${pageNumber(active.id)} soltada.`,
            onDragCancel: ({ active }) => `Movimiento cancelado. Página ${pageNumber(active.id)} en su sitio.`,
          },
          screenReaderInstructions: {
            draggable: 'Enter va a la página. Alt + flecha arriba o abajo la mueve una posición.',
          },
        }}
      >
        <SortableContext items={pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col items-center gap-5">
            {pages.map((page, i) => (
              <PageThumbnail
                key={page.id}
                page={page}
                source={sources[page.sourceId]}
                index={i}
                width={thumbWidth}
                active={page.id === activePageId}
                onSelect={goTo}
                onDelete={deletePage}
                onMove={onMove}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {draggingPage ? (
            <ThumbnailPreview
              page={draggingPage}
              source={sources[draggingPage.sourceId]}
              width={thumbWidth}
              className="scale-105 cursor-grabbing shadow-lg ring-2 ring-primary"
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      <button
        type="button"
        onClick={pickAndAppendPdfs}
        className="mx-auto mt-6 flex w-full max-w-40 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-primary/40 py-6 text-sm font-semibold text-muted-foreground transition-colors duration-150 outline-none hover:border-primary hover:bg-accent/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="size-5 text-primary" />
        Añadir PDF
      </button>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </aside>
  );
}
