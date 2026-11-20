'use client';
import { memo } from 'react';
import PdfCanvas from '@/components/editor/PdfCanvas';
import { cn } from '@/lib/utils';
import type { PageItem, SourceDoc } from '@/types/editor';

export const THUMB_WIDTH = 160;

interface Props {
  page: PageItem;
  source: SourceDoc;
  index: number;
  active: boolean;
  onSelect: (id: string) => void;
}

function PageThumbnail({ page, source, index, active, onSelect }: Props) {
  const scale = THUMB_WIDTH / page.width;
  return (
    <div data-thumb-id={page.id} className="group relative flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => onSelect(page.id)}
        aria-label={`Ir a la página ${index + 1}`}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative overflow-hidden rounded-md bg-card shadow-sm ring-1 ring-border transition-shadow duration-150 outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring',
          active && 'ring-2 ring-primary'
        )}
        style={{ width: THUMB_WIDTH, height: page.height * scale }}
      >
        <PdfCanvas source={source} pageIndex={page.sourceIndex} scale={scale} />
        <span className="absolute inset-0 bg-foreground/0 transition-colors duration-150 group-hover:bg-foreground/5" />
      </button>
      <span
        className={cn(
          'text-xs font-semibold text-muted-foreground',
          active && 'text-primary'
        )}
      >
        {index + 1}
      </span>
    </div>
  );
}

export default memo(PageThumbnail);
