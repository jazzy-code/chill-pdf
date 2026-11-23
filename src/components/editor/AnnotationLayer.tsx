'use client';
import { nanoid } from 'nanoid';
import { useShallow } from 'zustand/react/shallow';
import ImageAnnotation from '@/components/editor/ImageAnnotation';
import TextAnnotation from '@/components/editor/TextAnnotation';
import { layoutText } from '@/lib/text-layout';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/editor-store';
import type { PageItem } from '@/types/editor';

const NEW_TEXT_WIDTH = 200; // PDF points

export default function AnnotationLayer({ page, zoom }: { page: PageItem; zoom: number }) {
  const annotations = useEditorStore(useShallow((s) => s.annotations.filter((a) => a.pageId === page.id)));
  const tool = useEditorStore((s) => s.tool);

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return; // click inside an annotation (incl. its handles)
    const s = useEditorStore.getState();
    if (s.tool !== 'text') {
      s.select(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const style = s.lastTextStyle;
    const width = Math.min(NEW_TEXT_WIDTH, page.width);
    const height = layoutText({ ...style, text: '', width }).height;
    // place the box where the user clicked, kept inside the page
    const x = Math.max(0, Math.min((e.clientX - rect.left) / zoom, page.width - width));
    const y = Math.max(0, Math.min((e.clientY - rect.top) / zoom - height / 2, page.height - height));
    const id = nanoid();
    s.addAnnotation({ id, type: 'text', pageId: page.id, x, y, width, height, text: '', ...style });
    s.setTool('select');
    s.setEditing(id);
  };

  return (
    <div
      className={cn('absolute inset-0', tool === 'text' && 'cursor-crosshair')}
      onClick={onClick}
    >
      {annotations.map((a) =>
        a.type === 'text' ? (
          <TextAnnotation key={a.id} a={a} zoom={zoom} />
        ) : (
          <ImageAnnotation key={a.id} a={a} zoom={zoom} />
        )
      )}
    </div>
  );
}
