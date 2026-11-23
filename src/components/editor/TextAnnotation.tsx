'use client';
import { memo, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Rnd } from 'react-rnd';
import { cssFontFamily } from '@/lib/fonts';
import { LINE_HEIGHT, layoutText } from '@/lib/text-layout';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/editor-store';
import type { TextAnnotation as TextAnnotationType } from '@/types/editor';

const MIN_WIDTH = 24; // PDF points

const handle = (
  <span className="absolute top-1/2 left-1/2 block size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-card shadow-sm" />
);

interface Props {
  a: TextAnnotationType;
  zoom: number;
}

function TextAnnotation({ a, zoom }: Props) {
  const selected = useEditorStore((s) => s.selectedId === a.id);
  const editing = useEditorStore((s) => s.editingId === a.id);
  const { select, setEditing, updateAnnotation, removeAnnotation } = useEditorStore.getState();

  const [draft, setDraft] = useState(a.text);
  const [liveWidth, setLiveWidth] = useState<number | null>(null); // during resize (points)
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // entering edit mode: start from the stored text, focus at the end
  useEffect(() => {
    if (!editing) return;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [editing]);

  const width = liveWidth ?? a.width;
  const { lines, height } = layoutText({ ...a, text: editing ? draft : a.text, width });

  const textStyle: CSSProperties = {
    fontFamily: cssFontFamily(a.fontFamily),
    fontSize: a.fontSize * zoom,
    lineHeight: LINE_HEIGHT,
    fontWeight: a.bold ? 700 : 400,
    fontStyle: a.italic ? 'italic' : 'normal',
    textDecoration: a.underline ? 'underline' : 'none',
    color: a.color,
    textAlign: a.align,
  };

  const commit = () => {
    setEditing(null);
    if (draft.trim() === '') {
      removeAnnotation(a.id);
      return;
    }
    if (draft !== a.text) {
      updateAnnotation(a.id, { text: draft, height: layoutText({ ...a, text: draft }).height });
    }
  };

  const startEditing = () => {
    setDraft(a.text);
    select(a.id);
    setEditing(a.id);
  };

  return (
    <Rnd
      bounds="parent"
      position={{ x: a.x * zoom, y: a.y * zoom }}
      size={{ width: width * zoom, height: height * zoom }}
      minWidth={MIN_WIDTH * zoom}
      cancel=".no-drag"
      disableDragging={editing}
      enableResizing={selected && !editing ? { left: true, right: true } : false}
      resizeHandleComponent={{ left: handle, right: handle }}
      // stacking follows the annotations array (= export order); only raise while typing
      style={editing ? { zIndex: 30 } : undefined}
      className={cn(
        'outline-2 outline-offset-2 outline-transparent',
        selected ? 'outline-dashed outline-primary' : 'hover:outline-dashed hover:outline-primary/40',
        editing ? 'cursor-text' : 'cursor-move'
      )}
      onMouseDown={(e: MouseEvent) => {
        e.stopPropagation();
        if (!selected) select(a.id);
      }}
      onDragStop={(_e, d) => {
        const x = d.x / zoom;
        const y = d.y / zoom;
        if (Math.abs(x - a.x) > 0.01 || Math.abs(y - a.y) > 0.01) updateAnnotation(a.id, { x, y });
      }}
      onResize={(_e, _dir, ref) => setLiveWidth(ref.offsetWidth / zoom)}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        setLiveWidth(null);
        const nextWidth = ref.offsetWidth / zoom;
        updateAnnotation(a.id, {
          x: pos.x / zoom,
          width: nextWidth,
          height: layoutText({ ...a, width: nextWidth }).height,
        });
      }}
    >
      <div
        className="h-full w-full"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (!editing) startEditing();
        }}
      >
        {editing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            spellCheck={false}
            aria-label="Texto"
            className="no-drag block h-full w-full resize-none overflow-hidden border-0 bg-transparent p-0 whitespace-pre-wrap outline-none [overflow-wrap:anywhere]"
            style={textStyle}
          />
        ) : (
          <div style={textStyle} className="select-none">
            {lines.map((line, i) => (
              // one block per computed line → wraps exactly like the PDF export
              <div key={i} className="whitespace-pre">
                {line || '​'}
              </div>
            ))}
          </div>
        )}
      </div>
    </Rnd>
  );
}

export default memo(TextAnnotation);
