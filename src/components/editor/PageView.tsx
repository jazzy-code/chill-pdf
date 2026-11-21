'use client';
import { memo } from 'react';
import AnnotationLayer from '@/components/editor/AnnotationLayer';
import PdfCanvas from '@/components/editor/PdfCanvas';
import type { PageItem, SourceDoc } from '@/types/editor';

interface Props {
  page: PageItem;
  source: SourceDoc;
  zoom: number;
}

function PageView({ page, source, zoom }: Props) {
  return (
    <div
      id={'page-' + page.id}
      data-page-id={page.id}
      className="relative shrink-0 scroll-mt-6 rounded-sm bg-card shadow-md"
      style={{ width: page.width * zoom, height: page.height * zoom }}
    >
      <PdfCanvas source={source} pageIndex={page.sourceIndex} scale={zoom} className="rounded-sm" />
      <AnnotationLayer page={page} zoom={zoom} />
    </div>
  );
}

export default memo(PageView);
