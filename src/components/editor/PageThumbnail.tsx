'use client';
import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';
import PdfCanvas from '@/components/editor/PdfCanvas';
import { cn } from '@/lib/utils';
import type { PageItem, SourceDoc } from '@/types/editor';

export const THUMB_WIDTH = 160;
export const THUMB_WIDTH_SMALL = 80; // sidebar w-28 under 768px

/** Static page image used both in the list and in the drag overlay. */
export function ThumbnailPreview({
  page,
  source,
  width = THUMB_WIDTH,
  className,
}: {
  page: PageItem;
  source: SourceDoc;
  width?: number;
  className?: string;
}) {
  const scale = width / page.width;
  return (
    <div
      className={cn('relative overflow-hidden rounded-md bg-card shadow-sm ring-1 ring-border', className)}
      style={{ width, height: page.height * scale }}
    >
      <PdfCanvas source={source} pageIndex={page.sourceIndex} scale={scale} />
    </div>
  );
}

interface Props {
  page: PageItem;
  source: SourceDoc;
  index: number;
  width: number;
  active: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}

function PageThumbnail({ page, source, index, width, active, onSelect, onDelete, onMove }: Props) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: page.id });
  const scale = width / page.width;

  return (
    <div
      ref={setNodeRef}
      data-thumb-id={page.id}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('group relative flex flex-col items-center gap-1.5', isDragging && 'opacity-50')}
    >
      <div className="relative">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          onClick={() => onSelect(page.id)}
          onKeyDown={(e) => {
            if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
            e.preventDefault();
            onMove(page.id, e.key === 'ArrowUp' ? -1 : 1);
          }}
          aria-label={`Página ${index + 1}`}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'relative block cursor-grab touch-none overflow-hidden rounded-md bg-card shadow-sm ring-1 ring-border transition-shadow duration-150 outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing',
            active && 'ring-2 ring-primary'
          )}
          style={{ width, height: page.height * scale }}
        >
          <PdfCanvas source={source} pageIndex={page.sourceIndex} scale={scale} />
          <span className="absolute inset-0 bg-foreground/0 transition-colors duration-150 group-hover:bg-foreground/5" />
        </button>
        <button
          type="button"
          aria-label={`Eliminar página ${index + 1}`}
          title="Eliminar página"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(page.id);
          }}
          className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full bg-card text-destructive opacity-0 shadow-md ring-1 ring-border transition-all duration-150 outline-none group-hover:opacity-100 [@media(hover:none)]:opacity-100 hover:scale-110 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <span className={cn('text-xs font-semibold text-muted-foreground', active && 'text-primary')}>
        {index + 1}
      </span>
    </div>
  );
}

export default memo(PageThumbnail);
