'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import PageThumbnail, { ThumbnailPreview } from '@/components/editor/PageThumbnail';
import { useEditorStore } from '@/store/editor-store';

// Enter is left free so it keeps navigating to the page; Space picks up / drops.
const KEYBOARD_CODES = { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] };

export default function PagesSidebar() {
  const ref = useRef<HTMLElement>(null);
  const pages = useEditorStore((s) => s.pages);
  const sources = useEditorStore((s) => s.sources);
  const activePageId = useEditorStore((s) => s.activePageId);
  const setActivePage = useEditorStore((s) => s.setActivePage);
  const deletePage = useEditorStore((s) => s.deletePage);
  const movePage = useEditorStore((s) => s.movePage);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: KEYBOARD_CODES,
    })
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
      className="w-56 shrink-0 overflow-y-auto border-r bg-card px-4 py-6"
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
            draggable:
              'Pulsa Espacio para levantar la página, usa las flechas para moverla y Espacio de nuevo para soltarla. Escape cancela.',
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
                active={page.id === activePageId}
                onSelect={goTo}
                onDelete={deletePage}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {draggingPage ? (
            <ThumbnailPreview
              page={draggingPage}
              source={sources[draggingPage.sourceId]}
              className="scale-105 cursor-grabbing shadow-lg ring-2 ring-primary"
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </aside>
  );
}
